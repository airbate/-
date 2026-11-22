import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BOOTHS,
  SPOT_BY_ID,
  STORAGE_KEY,
  ZONES,
  ZOOM_STOPS,
  type Spot,
} from './data/carnivalData';
import {
  findNextDpadBooth,
  stepBooth,
  type DpadDirection,
} from './utils/mapLogic';
import {
  carnivalApi,
  detectMilestone,
  loadOrCreateVisitorProfile,
  type VisitorProfile,
} from './services/carnivalApi';
import { SFX } from './utils/sfx';
import { VenueMap, type VenueMapHandle } from './components/VenueMap';
import { DetailCard } from './components/DetailCard';
import { DirectorySheet } from './components/DirectorySheet';
import { PhotoResultModal } from './components/PhotoResultModal';
import { GallerySheet } from './components/GallerySheet';
import { composeStampedPhoto } from './services/photoComposer';
import { countPhotos, savePhoto } from './services/photoStore';
import { BootOverlay } from './components/BootOverlay';
import { ConfettiOverlay } from './components/ConfettiOverlay';
import { LeaderboardSheet } from './components/LeaderboardSheet';
import { RetroGamepadSvg } from './components/CarnivalArt';

function loadInitialStamps(): Set<string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((id): id is string => typeof id === 'string'));
    }
  } catch {
    // Ignore storage read failure
  }
  return new Set();
}

function getInitialParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    autostart: params.get('autostart') === '1',
    stamp: (params.get('stamp') || '').trim().toUpperCase(),
  };
}

const AMBIENT_MOTES = [
  { left: '8%', top: '16%', size: 10, delay: '0s', char: '✦' },
  { left: '89%', top: '22%', size: 12, delay: '1.4s', char: '+' },
  { left: '12%', top: '76%', size: 9, delay: '2.1s', char: '◇' },
  { left: '91%', top: '70%', size: 11, delay: '0.8s', char: '✦' },
  { left: '6%', top: '46%', size: 8, delay: '3.0s', char: '+' },
  { left: '93%', top: '44%', size: 9, delay: '1.9s', char: '◇' },
];

export default function App() {
  const initialParams = useMemo(getInitialParams, []);
  const mapRef = useRef<VenueMapHandle | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const pulseTimerRef = useRef<number | null>(null);
  const directStampHandledRef = useRef<boolean>(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const [booting, setBooting] = useState(!initialParams.autostart);
  const [muted, setMuted] = useState(false);
  const [showRoute, setShowRoute] = useState(true);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [dirOpen, setDirOpen] = useState(false);
  const [lbOpen, setLbOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryCount, setGalleryCount] = useState(0);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoTargetId, setPhotoTargetId] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<{ image: string; spot: Spot } | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const [profile, setProfile] = useState<VisitorProfile>(loadOrCreateVisitorProfile);
  const [stampedIds, setStampedIds] = useState<Set<string>>(loadInitialStamps);
  const [lastRankDelta, setLastRankDelta] = useState(0);

  const [stampBurstKey, setStampBurstKey] = useState(0);
  const [confettiKey, setConfettiKey] = useState(0);
  const [confettiIntensity, setConfettiIntensity] = useState<'normal' | 'milestone'>('normal');
  const [bezelFlashKey, setBezelFlashKey] = useState(0);
  const [slideDir, setSlideDir] = useState(1);
  const [shellShakeKey, setShellShakeKey] = useState(0);
  const [countPopKey, setCountPopKey] = useState(0);
  const [speakerPulse, setSpeakerPulse] = useState(false);
  const [dpadTilt, setDpadTilt] = useState<DpadDirection | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const focusedSpot = focusedId ? SPOT_BY_ID[focusedId] ?? null : null;

  const stampedCount = useMemo(
    () => BOOTHS.filter((b) => stampedIds.has(b.id)).length,
    [stampedIds]
  );

  const showToast = useCallback((msg: string, duration = 2400) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, duration);
  }, []);

  const refreshGalleryCount = useCallback(() => {
    countPhotos()
      .then(setGalleryCount)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshGalleryCount();
  }, [refreshGalleryCount]);

  // Unlock Web Audio on first pointer interaction + wire speaker grille visual pulse
  useEffect(() => {
    const unlock = () => SFX.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    const unsub = SFX.subscribePulse(() => {
      setSpeakerPulse(true);
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = window.setTimeout(() => setSpeakerPulse(false), 120);
    });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      unsub();
    };
  }, []);

  const focusSpot = useCallback((id: string, playSound = true) => {
    const spot = SPOT_BY_ID[id];
    if (!spot) return;
    setFocusedId(id);
    if (playSound) SFX.select(ZONES[spot.z].idx);
  }, []);

  const openSpotCard = useCallback((id: string, direction = 0) => {
    if (!SPOT_BY_ID[id]) return;
    setSlideDir(direction);
    setStampBurstKey(0);
    setFocusedId(id);
    setCardOpen(true);
    SFX.openCard();
  }, []);

  const closeSpotCard = useCallback(() => {
    setCardOpen((wasOpen) => {
      if (wasOpen) SFX.closeCard();
      return false;
    });
  }, []);

  const handleMapSelect = useCallback(
    (spot: Spot) => {
      focusSpot(spot.id, true);
      openSpotCard(spot.id, 0);
    },
    [focusSpot, openSpotCard]
  );

  const performStamp = useCallback(
    (id: string) => {
      const target = BOOTHS.find((b) => b.id === id);
      if (!target) {
        showToast('未识别到有效展位码');
        return;
      }

      const alreadyStamped = stampedIds.has(target.id);
      setFocusedId(target.id);
      mapRef.current?.panTo(target.cx, target.cy, 2.1);
      setSlideDir(0);
      setCardOpen(true);
      SFX.openCard();

      if (alreadyStamped) {
        setStampBurstKey(0);
        SFX.dup();
        showToast(`${target.id} ${target.name} 已打过卡（同一展位计 1 枚）`);
        return;
      }

      const prevSet = new Set(stampedIds);
      const nextSet = new Set(stampedIds);
      nextSet.add(target.id);
      setStampedIds(nextSet);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...nextSet]));
      } catch {
        // Ignore storage write failure
      }

      const milestoneMsg = detectMilestone(prevSet, nextSet, target.id);

      // Sync check-in with backend adapter (or local ranking fallback)
      carnivalApi
        .submitCheckIn(
          {
            userId: profile.userId,
            nickname: profile.nickname,
            avatar: profile.avatar,
            boothId: target.id,
            scannedAt: Date.now(),
          },
          prevSet,
          nextSet
        )
        .then((res) => {
          if (res.rankDelta > 0) {
            setLastRankDelta(res.rankDelta);
          }
          window.setTimeout(() => {
            if (milestoneMsg) {
              SFX.milestone();
              setConfettiIntensity('milestone');
            } else {
              SFX.stamp();
              setConfettiIntensity('normal');
            }
            setStampBurstKey((k) => k + 1);
            setConfettiKey((k) => k + 1);
            setBezelFlashKey((k) => k + 1);
            setShellShakeKey((k) => k + 1);
            setCountPopKey((k) => k + 1);

            const total = BOOTHS.filter((b) => nextSet.has(b.id)).length;
            if (milestoneMsg) {
              showToast(milestoneMsg, 3200);
            } else if (res.rankDelta > 0) {
              showToast(
                `🎉 打卡成功！${target.id} ${target.name}（${total}/45）· 🏆 升至第 #${res.newRank} 名`,
                3000
              );
            } else {
              showToast(`🎉 打卡成功！${target.id} ${target.name}（${total}/45）`);
            }
          }, 150);
        });
    },
    [profile, showToast, stampedIds]
  );

  const handleBootFinish = useCallback(() => {
    setBooting(false);
    if (initialParams.stamp && !directStampHandledRef.current) {
      directStampHandledRef.current = true;
      window.setTimeout(() => performStamp(initialParams.stamp), 180);
    }
  }, [initialParams.stamp, performStamp]);

  // If autostart=1 and ?stamp=M5 are both provided, run stamp immediately
  useEffect(() => {
    if (initialParams.autostart && initialParams.stamp && !directStampHandledRef.current) {
      directStampHandledRef.current = true;
      const t = window.setTimeout(() => performStamp(initialParams.stamp), 240);
      return () => window.clearTimeout(t);
    }
  }, [initialParams.autostart, initialParams.stamp, performStamp]);

  const handleReplayBoot = useCallback(() => {
    SFX.bootUp();
    setCardOpen(false);
    setDirOpen(false);
    setLbOpen(false);
    setBooting(true);
  }, []);

  const handleUpdateProfile = useCallback((next: VisitorProfile) => {
    setProfile(next);
    carnivalApi.syncProfile(next);
  }, []);

  const triggerDpad = useCallback(
    (dir: DpadDirection) => {
      setDpadTilt(dir);
      window.setTimeout(() => setDpadTilt((cur) => (cur === dir ? null : cur)), 140);

      const cur = (focusedId && SPOT_BY_ID[focusedId]) || SPOT_BY_ID['M5'];
      if (!focusedId) {
        focusSpot(cur.id, true);
        mapRef.current?.panTo(cur.cx, cur.cy, Math.max(mapRef.current?.getScale() ?? 1, 1.8));
        return;
      }

      const next = findNextDpadBooth(cur, dir);
      if (next) {
        focusSpot(next.id, true);
        mapRef.current?.panTo(next.cx, next.cy, Math.max(mapRef.current?.getScale() ?? 1, 1.85));
      } else {
        SFX.click();
      }
    },
    [focusSpot, focusedId]
  );

  const handleDpadCenter = useCallback(() => {
    if (focusedId) {
      openSpotCard(focusedId, 0);
    } else {
      const m5 = SPOT_BY_ID['M5'];
      focusSpot(m5.id, true);
      mapRef.current?.panTo(m5.cx, m5.cy, 1.9);
    }
  }, [focusSpot, focusedId, openSpotCard]);

  const handleZoomIn = useCallback(() => {
    const curScale = mapRef.current?.getScale() ?? 1;
    const next = ZOOM_STOPS.find((s) => s > curScale + 0.08) ?? 3.1;
    SFX.zoomIn();
    mapRef.current?.setScale(next, focusedSpot);
  }, [focusedSpot]);

  const handleZoomOut = useCallback(() => {
    const curScale = mapRef.current?.getScale() ?? 1;
    const prev = [...ZOOM_STOPS].reverse().find((s) => s < curScale - 0.08) ?? 1;
    SFX.zoomOut();
    if (prev <= 1.02) {
      mapRef.current?.resetCamera();
    } else {
      mapRef.current?.setScale(prev, null);
    }
  }, []);

  const handleResetCam = useCallback(() => {
    SFX.zoomOut();
    mapRef.current?.resetCamera();
  }, []);

  const handleStepCard = useCallback(
    (delta: number) => {
      const nxt = stepBooth(focusedId, delta);
      focusSpot(nxt.id, false);
      const curScale = mapRef.current?.getScale() ?? 1;
      if (curScale > 1.1) {
        mapRef.current?.panTo(nxt.cx, nxt.cy, curScale);
      }
      openSpotCard(nxt.id, delta);
    },
    [focusSpot, focusedId, openSpotCard]
  );

  /* 拍照打卡：不再扫码，直接调起系统相机 */
  const openPhotoPicker = useCallback(
    (id?: string | null) => {
      const targetId = id || focusedId || null;
      if (!targetId || !SPOT_BY_ID[targetId]) {
        showToast('先在地图上点一个展位，再拍照打卡');
        setDirOpen(true);
        SFX.click();
        return;
      }
      setPhotoTargetId(targetId);
      setCardOpen(false);
      setDirOpen(false);
      setLbOpen(false);
      setGalleryOpen(false);
      SFX.click();

      const input = photoInputRef.current;
      if (!input) return;
      input.value = '';
      input.click();
    },
    [focusedId, showToast]
  );

  const handlePhotoChosen = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      const target = photoTargetId ? SPOT_BY_ID[photoTargetId] : null;
      if (!target) return;

      setPhotoBusy(true);
      try {
        const image = await composeStampedPhoto(file, target);

        try {
          await savePhoto({
            id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            boothId: target.id,
            boothName: target.name,
            zoneName: ZONES[target.z].name,
            createdAt: Date.now(),
            dataUrl: image,
          });
        } catch {
          // 存储失败也不阻断展示
        }
        refreshGalleryCount();
        setPhotoResult({ image, spot: target });

        const isBooth = BOOTHS.some((b) => b.id === target.id);
        if (isBooth) {
          performStamp(target.id);
        } else {
          showToast('地标照片已存入素材库');
        }
      } catch {
        showToast('照片处理失败，请重拍一次');
      } finally {
        setPhotoBusy(false);
      }
    },
    [photoTargetId, performStamp, refreshGalleryCount, showToast]
  );

  const handlePickFromDir = useCallback(
    (spot: Spot) => {
      setDirOpen(false);
      focusSpot(spot.id, true);
      mapRef.current?.panTo(spot.cx, spot.cy, 2.15);
      window.setTimeout(() => openSpotCard(spot.id, 0), 220);
    },
    [focusSpot, openSpotCard]
  );

  // Keyboard shortcuts for desktop exploration
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        if (photoResult) setPhotoResult(null);
        else if (galleryOpen) setGalleryOpen(false);
        else if (cardOpen) closeSpotCard();
        else if (dirOpen) {
          setDirOpen(false);
          SFX.click();
        } else if (lbOpen) {
          setLbOpen(false);
          SFX.click();
        }
        return;
      }

      if (booting || galleryOpen || dirOpen || lbOpen) return;

      if (cardOpen) {
        if (e.key === 'ArrowLeft') handleStepCard(-1);
        else if (e.key === 'ArrowRight') handleStepCard(1);
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        triggerDpad('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        triggerDpad('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        triggerDpad('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        triggerDpad('right');
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDpadCenter();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetCam();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    booting,
    cardOpen,
    closeSpotCard,
    dirOpen,
    handleDpadCenter,
    handleResetCam,
    handleStepCard,
    handleZoomIn,
    handleZoomOut,
    lbOpen,
    galleryOpen,
    photoResult,
    triggerDpad,
  ]);

  return (
    <div className="app-stage">
      {/* Subtle Ambient Floating Carnival Motes in Backdrop */}
      <div className="ambient-motes" aria-hidden="true">
        {AMBIENT_MOTES.map((m, i) => (
          <span
            key={i}
            style={{
              left: m.left,
              top: m.top,
              fontSize: m.size,
              animationDelay: m.delay,
            }}
          >
            {m.char}
          </span>
        ))}
      </div>

      {/* Celebratory Confetti & Star Particle Canvas */}
      <ConfettiOverlay burstKey={confettiKey} intensity={confettiIntensity} />

      {/* Animated Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            key={toastMsg}
            className="toast-pill"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, x: '-50%', y: -14, scale: 0.94 }}
            animate={{ opacity: 1, x: '-50%', y: 0, scale: 1 }}
            exit={{ opacity: 0, x: '-50%', y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 480, damping: 30 }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="app-frame">
        {/* Top Brand Header with Extracted Poster Retro Gamepad Crest */}
        <motion.header
          className="top-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="brand-left">
            <span className="brand-pad-crest" aria-hidden="true">
              <RetroGamepadSvg width={42} />
            </span>
            <div>
              <h1 className="brand-title">2026 亦庄具身智能嘉年华</h1>
              <div className="brand-sub">E-Town Embodied Intelligence · 亦庄机器人 × E-Bot Hub</div>
            </div>
          </div>
          <div className="header-right">
            <button
              type="button"
              className={`mute-btn ${muted ? 'muted' : ''}`}
              aria-label={muted ? '开启音效' : '静音音效'}
              aria-pressed={muted}
              onClick={() => setMuted(SFX.toggleMute())}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </motion.header>

        {/* Retro Handheld Console Shell */}
        <motion.section
          key={shellShakeKey > 0 ? `shell-${shellShakeKey}` : 'shell-init'}
          className={`console-shell ${shellShakeKey > 0 ? 'shake' : ''}`}
          initial={shellShakeKey === 0 ? { opacity: 0, y: 24, scale: 0.96 } : false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28, mass: 0.95 }}
        >
          <span className="side-grip side-grip-left" aria-hidden="true" />
          <span className="side-grip side-grip-right" aria-hidden="true" />

          {/* Console Meta Strip */}
          <div className="shell-meta">
            <button
              type="button"
              className="meta-left-btn"
              title="点击重播掌机开机动画"
              aria-label="现场导览，点击重播开机动画"
              onClick={handleReplayBoot}
            >
              <span className="vent" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
              <span>现场导览</span>
              <span className={`led ${booting ? 'led-boot' : ''}`} aria-hidden="true" />
            </button>

            <div className="meta-actions">
              <button
                type="button"
                className={`chip-btn ${showRoute ? 'active' : ''}`}
                aria-pressed={showRoute}
                onClick={() => {
                  setShowRoute((v) => !v);
                  SFX.click();
                }}
              >
                路线
              </button>
              <button
                type="button"
                className="chip-btn chip-gallery"
                aria-label="打开我的打卡照片"
                onClick={() => {
                  SFX.openCard();
                  setGalleryOpen(true);
                }}
              >
                📸 {galleryCount}
              </button>
              <button
                type="button"
                className="chip-btn chip-lb"
                aria-label="打开逛展排行榜"
                onClick={() => {
                  SFX.openCard();
                  setLbOpen(true);
                }}
              >
                🏆 榜单
              </button>
              <button
                key={countPopKey}
                type="button"
                className={`chip-btn ${countPopKey > 0 ? 'count-pop' : ''}`}
                onClick={() => {
                  SFX.openCard();
                  setDirOpen(true);
                }}
              >
                <span>{stampedCount}/45</span>
                <span aria-hidden="true">▾</span>
              </button>
            </div>
          </div>

          {/* Recessed LCD Map Screen */}
          <div
            key={bezelFlashKey > 0 ? `bz-${bezelFlashKey}` : 'bz-base'}
            className={`screen-bezel ${bezelFlashKey > 0 ? 'bezel-flash' : ''}`}
          >
            <div className="screen-vp screen-power-on">
              <div className="screen-scanlines" aria-hidden="true" />
              <div className="screen-glass-sheen" aria-hidden="true" />

              {/* Retro Handheld Power-On Boot Splash inside LCD */}
              <BootOverlay
                visible={booting}
                hasDirectStamp={Boolean(initialParams.stamp)}
                onFinish={handleBootFinish}
              />

              <AnimatePresence>
                {!booting && zoomScale > 1.06 && (
                  <motion.button
                    type="button"
                    className="zoom-pill"
                    initial={{ opacity: 0, y: -8, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                    onClick={handleResetCam}
                  >
                    {zoomScale.toFixed(1)}x · 复原全景
                  </motion.button>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!booting && focusedSpot && (
                  <motion.button
                    type="button"
                    className="screen-banner"
                    initial={{ opacity: 0, x: '-50%', y: 16, scale: 0.92 }}
                    animate={{ opacity: 1, x: '-50%', y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: '-50%', y: 14, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 460, damping: 28 }}
                    onClick={() => openSpotCard(focusedSpot.id, 0)}
                  >
                    <span className="b-code">
                      {focusedSpot.lm ? '地标' : focusedSpot.id}
                    </span>
                    <span className="b-name">{focusedSpot.name}</span>
                    <span className="b-go">看详情 ▶</span>
                  </motion.button>
                )}
              </AnimatePresence>

              <VenueMap
                ref={mapRef}
                focusedId={focusedId}
                stampedIds={stampedIds}
                showRoute={showRoute}
                onSelectSpot={handleMapSelect}
                onScaleChange={setZoomScale}
              />
            </div>
          </div>

          {/* Physical Color-Block Control Deck (extracted from Poster Image 1) */}
          <div className="control-deck">
            {/* Poster pixel + chassis decals */}
            <span className="deck-plus deck-plus-lt" aria-hidden="true">+</span>
            <span className="deck-plus deck-plus-mid" aria-hidden="true">+</span>

            <div className="deck-row">
              {/* Cream Circular Well + Sculpted Navy D-Pad */}
              <div className="dpad-well">
                <div className={`dpad ${dpadTilt ? `tilt-${dpadTilt}` : ''}`}>
                  <button
                    type="button"
                    className={`dpad-key d-up ${dpadTilt === 'up' ? 'pressed' : ''}`}
                    aria-label="向上切换展位"
                    onClick={() => triggerDpad('up')}
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    className={`dpad-key d-dn ${dpadTilt === 'down' ? 'pressed' : ''}`}
                    aria-label="向下切换展位"
                    onClick={() => triggerDpad('down')}
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    className={`dpad-key d-lt ${dpadTilt === 'left' ? 'pressed' : ''}`}
                    aria-label="向左切换展位"
                    onClick={() => triggerDpad('left')}
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    className={`dpad-key d-rt ${dpadTilt === 'right' ? 'pressed' : ''}`}
                    aria-label="向右切换展位"
                    onClick={() => triggerDpad('right')}
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    className="d-mid"
                    aria-label="打开当前聚焦展位详情"
                    onClick={handleDpadCenter}
                  />
                </div>
              </div>

              {/* Center Scan CTA + Glowing Cyan Dual Select/Start Bars */}
              <div className="scan-center">
                <div className="scan-btn-well">
                  <button
                    type="button"
                    className="scan-btn"
                    onClick={() => openPhotoPicker(focusedId)}
                  >
                    📷 拍照打卡
                  </button>
                </div>
                <div className="poster-pills" aria-hidden="true">
                  <span />
                  <span />
                </div>
              </div>

              {/* Poster Sky-Blue & Coral-Orange Action Pod + Diagonal Dot-Matrix Speaker */}
              <div className="right-pod-wrap">
                <div className="zoom-pod">
                  <button
                    type="button"
                    className="z-btn z-minus"
                    aria-label="缩小地图"
                    onClick={handleZoomOut}
                  >
                    −
                  </button>
                  <button
                    type="button"
                    className="z-btn z-plus"
                    aria-label="放大地图"
                    onClick={handleZoomIn}
                  >
                    ＋
                  </button>
                </div>
                <div
                  className={`speaker-matrix ${speakerPulse ? 'pulse' : ''}`}
                  aria-hidden="true"
                >
                  {Array.from({ length: 12 }, (_, idx) => (
                    <i key={idx} />
                  ))}
                </div>
              </div>
            </div>

            <div className="deck-hint">轻点展位看介绍 · 📷拍照打卡 · 🏆看榜单排名</div>
          </div>
        </motion.section>
      </main>

      {/* Modals & Bottom Sheets */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="photo-input"
        onChange={handlePhotoChosen}
      />

      <GallerySheet
        open={galleryOpen}
        onClose={() => {
          setGalleryOpen(false);
          SFX.closeCard();
        }}
      />

      <PhotoResultModal
        open={Boolean(photoResult)}
        image={photoResult?.image ?? null}
        spot={photoResult?.spot ?? null}
        onClose={() => setPhotoResult(null)}
        onOpenGallery={() => {
          setPhotoResult(null);
          setGalleryOpen(true);
        }}
      />

      <DirectorySheet
        open={dirOpen}
        stampedIds={stampedIds}
        onClose={() => {
          setDirOpen(false);
          SFX.click();
        }}
        onPickBooth={handlePickFromDir}
      />

      <LeaderboardSheet
        open={lbOpen}
        profile={profile}
        stampedIds={stampedIds}
        lastRankDelta={lastRankDelta}
        onUpdateProfile={handleUpdateProfile}
        onClose={() => {
          setLbOpen(false);
          SFX.click();
        }}
      />

      <DetailCard
        spot={focusedSpot}
        open={cardOpen}
        isStamped={focusedSpot ? stampedIds.has(focusedSpot.id) : false}
        stampBurstKey={stampBurstKey}
        slideDir={slideDir}
        onClose={closeSpotCard}
        onStep={handleStepCard}
        onCapturePhoto={() => openPhotoPicker(focusedSpot?.id)}
      />

      {photoBusy && (
        <div className="photo-busy" role="status" aria-live="polite">
          <div className="photo-busy-card">
            <span>📸</span>
            正在冲洗照片…
          </div>
        </div>
      )}
    </div>
  );
}
