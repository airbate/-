import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  carnivalApi,
  computeZoneProgress,
  type LeaderboardEntry,
  type VisitorProfile,
} from '../services/carnivalApi';
import { SFX } from '../utils/sfx';

interface LeaderboardSheetProps {
  open: boolean;
  profile: VisitorProfile;
  stampedIds: Set<string>;
  lastRankDelta: number;
  onUpdateProfile: (next: VisitorProfile) => void;
  onClose: () => void;
}

const AVATAR_CHOICES = ['🤖', '🦾', '🚀', '⚡', '🛸', '🦊', '👾', '🧩'];

export function LeaderboardSheet({
  open,
  profile,
  stampedIds,
  lastRankDelta,
  onUpdateProfile,
  onClose,
}: LeaderboardSheetProps) {
  const [tab, setTab] = useState<'rank' | 'progress'>('rank');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<number>(1);
  const [source, setSource] = useState<'remote' | 'local'>('local');
  const [loading, setLoading] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(profile.nickname);

  const zoneProgress = useMemo(() => computeZoneProgress(stampedIds), [stampedIds]);
  const totalStamped = useMemo(
    () => zoneProgress.reduce((sum, z) => sum + z.stamped, 0),
    [zoneProgress]
  );

  useEffect(() => {
    setDraftName(profile.nickname);
  }, [profile.nickname]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    carnivalApi
      .fetchLeaderboard(profile, stampedIds)
      .then((res) => {
        if (!active) return;
        setEntries(res.entries);
        setMyRank(res.myRank);
        setSource(res.source);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, profile, stampedIds]);

  const handleSaveName = () => {
    const cleaned = draftName.trim().slice(0, 14);
    if (!cleaned) {
      setDraftName(profile.nickname);
      setEditingName(false);
      return;
    }
    SFX.click();
    const updated = { ...profile, nickname: cleaned };
    onUpdateProfile(updated);
    setEditingName(false);
  };

  const handleCycleAvatar = () => {
    SFX.click();
    const idx = AVATAR_CHOICES.indexOf(profile.avatar);
    const nextAvatar = AVATAR_CHOICES[(idx + 1) % AVATAR_CHOICES.length];
    onUpdateProfile({ ...profile, avatar: nextAvatar });
  };

  const podium = useMemo(() => {
    const first = entries[0] ?? null;
    const second = entries[1] ?? null;
    const third = entries[2] ?? null;
    return [second, first, third];
  }, [entries]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="嘉年华逛展排行榜"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="lb-sheet"
            initial={{ y: 68, scale: 0.96, opacity: 0.7 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 52, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 430, damping: 33, mass: 0.85 }}
          >
            <div className="lb-awning" />

            {/* Header */}
            <div className="dir-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span>🏆 嘉年华打卡榜</span>
                <span className="lb-source-tag">
                  {source === 'remote' ? '实时同步' : '本地演示榜'}
                </span>
              </div>
              <button
                type="button"
                className="close-btn"
                aria-label="关闭排行榜"
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            {/* Segmented Mode Tabs */}
            <div className="lb-tabs" role="tablist" aria-label="排行榜视图切换">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'rank'}
                className={`lb-tab ${tab === 'rank' ? 'active' : ''}`}
                onClick={() => {
                  SFX.click();
                  setTab('rank');
                }}
              >
                🏆 探索总榜
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'progress'}
                className={`lb-tab ${tab === 'progress' ? 'active' : ''}`}
                onClick={() => {
                  SFX.click();
                  setTab('progress');
                }}
              >
                🎯 展区进度 ({totalStamped}/45)
              </button>
            </div>

            {/* My Profile & Live Rank Banner */}
            <div className="lb-me-card">
              <button
                type="button"
                className="lb-avatar-btn"
                aria-label="切换头像"
                title="点击切换头像"
                onClick={handleCycleAvatar}
              >
                {profile.avatar}
              </button>

              <div className="lb-me-info">
                {editingName ? (
                  <div className="lb-name-edit">
                    <input
                      type="text"
                      aria-label="修改榜单昵称"
                      maxLength={14}
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') {
                          setDraftName(profile.nickname);
                          setEditingName(false);
                        }
                      }}
                      autoFocus
                    />
                    <button type="button" onClick={handleSaveName}>
                      保存
                    </button>
                  </div>
                ) : (
                  <div className="lb-me-name-row">
                    <span className="lb-me-name">{profile.nickname}</span>
                    <button
                      type="button"
                      className="lb-edit-trigger"
                      aria-label="编辑昵称"
                      onClick={() => {
                        SFX.click();
                        setEditingName(true);
                      }}
                    >
                      改名
                    </button>
                  </div>
                )}
                <div className="lb-me-sub">
                  已打卡 <strong>{totalStamped}/45</strong> 个展位
                  {lastRankDelta > 0 && (
                    <span className="lb-delta"> · ▲ 上升 {lastRankDelta} 名</span>
                  )}
                </div>
              </div>

              <div className="lb-my-rank">
                <div className="lb-rank-lbl">当前排名</div>
                <div className="lb-rank-num">#{myRank}</div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="lb-scroll">
              {tab === 'rank' ? (
                <>
                  {/* Top 3 Arcade Podium */}
                  {!loading && entries.length >= 3 && (
                    <div className="lb-podium">
                      {podium.map((item, slotIdx) => {
                        if (!item) return null;
                        const medal = slotIdx === 1 ? '🥇' : slotIdx === 0 ? '🥈' : '🥉';
                        const cls =
                          slotIdx === 1 ? 'podium-1' : slotIdx === 0 ? 'podium-2' : 'podium-3';
                        return (
                          <motion.div
                            key={item.userId}
                            className={`podium-col ${cls} ${item.isMe ? 'is-me' : ''}`}
                            initial={{ y: 18, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{
                              delay: slotIdx === 1 ? 0.04 : 0.1,
                              type: 'spring',
                              stiffness: 400,
                              damping: 26,
                            }}
                          >
                            <div className="podium-medal">{medal}</div>
                            <div className="podium-avatar">{item.avatar}</div>
                            <div className="podium-name">{item.nickname}</div>
                            <div className="podium-score">{item.stampedCount}/45</div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Full Ranked List */}
                  <div className="lb-list">
                    {loading ? (
                      <div className="lb-empty">正在载入排行榜…</div>
                    ) : (
                      entries.map((entry) => (
                        <div
                          key={entry.userId}
                          className={`lb-row ${entry.isMe ? 'is-me' : ''}`}
                        >
                          <span className={`lb-row-rank rank-${entry.rank <= 3 ? entry.rank : 'n'}`}>
                            {entry.rank}
                          </span>
                          <span className="lb-row-avatar">{entry.avatar}</span>
                          <div className="lb-row-mid">
                            <div className="lb-row-name">
                              {entry.nickname}
                              {entry.isMe && <span className="lb-me-tag">我</span>}
                            </div>
                            <div className="lb-row-bar">
                              <div
                                className="lb-row-fill"
                                style={{ width: `${Math.min(100, (entry.stampedCount / 45) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="lb-row-score">
                            <strong>{entry.stampedCount}</strong>
                            <span>/45</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div className="lb-zones-wrap">
                  <div className="lb-overall-card">
                    <div className="lb-overall-top">
                      <span>嘉年华总集章进度</span>
                      <strong>
                        {totalStamped} / 45（{Math.round((totalStamped / 45) * 100)}%）
                      </strong>
                    </div>
                    <div className="lb-overall-bar">
                      <motion.div
                        className="lb-overall-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${(totalStamped / 45) * 100}%` }}
                        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                  </div>

                  {zoneProgress.map((zp) => (
                    <div key={zp.zone} className={`lb-zone-row ${zp.completed ? 'done' : ''}`}>
                      <div className="lb-zone-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span className="dir-code" style={{ background: zp.color }}>
                            {zp.zone}
                          </span>
                          <span className="lb-zone-name">{zp.name}</span>
                        </div>
                        <span className="lb-zone-stat">
                          {zp.completed ? '★ 已制霸' : `${zp.stamped} / ${zp.total}`}
                        </span>
                      </div>
                      <div className="lb-zone-track">
                        <div
                          className="lb-zone-fill"
                          style={{
                            width: `${(zp.stamped / Math.max(zp.total, 1)) * 100}%`,
                            background: zp.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
