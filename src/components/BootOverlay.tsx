import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RetroGamepadSvg, RobotMascotSvg } from './CarnivalArt';

interface BootOverlayProps {
  visible: boolean;
  hasDirectStamp: boolean;
  onFinish: () => void;
}

export function BootOverlay({ visible, hasDirectStamp, onFinish }: BootOverlayProps) {
  useEffect(() => {
    if (!visible) return;
    const duration = hasDirectStamp ? 1100 : 1550;
    const timer = window.setTimeout(onFinish, duration);
    return () => window.clearTimeout(timer);
  }, [visible, hasDirectStamp, onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="boot-overlay"
          role="button"
          tabIndex={0}
          aria-label="正在启动掌上导览机，轻点跳过"
          onClick={onFinish}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onFinish();
          }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Classic CRT Phosphor Horizontal Power-On Flash */}
          <motion.div
            className="boot-crt-line"
            initial={{ scaleX: 0.08, scaleY: 0.015, opacity: 1 }}
            animate={{ scaleX: [0.08, 1, 1], scaleY: [0.015, 0.03, 1], opacity: [1, 0.95, 0] }}
            transition={{ duration: 0.42, times: [0, 0.45, 1], ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Poster-inspired Sunburst Radial Disc & Retro Grid */}
          <div className="boot-sunburst" aria-hidden="true" />
          <div className="boot-grid-bg" aria-hidden="true" />

          {/* Floating Poster Pixel Plus & Star Accents */}
          <div className="boot-sparkles" aria-hidden="true">
            <span style={{ left: '14%', top: '20%', animationDelay: '0s' }}>+</span>
            <span style={{ left: '84%', top: '18%', animationDelay: '0.18s' }}>✦</span>
            <span style={{ left: '13%', top: '74%', animationDelay: '0.28s' }}>✦</span>
            <span style={{ left: '85%', top: '70%', animationDelay: '0.12s' }}>+</span>
          </div>

          {/* Center Cartridge Emblem */}
          <motion.div
            className="boot-core"
            initial={{ opacity: 0, scale: 0.82, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.16, type: 'spring', stiffness: 420, damping: 24 }}
          >
            <div className="boot-mascot-ring">
              <motion.div
                className="boot-mascot-svg"
                animate={{ y: [0, -5, 0], rotate: [-2.5, 2.5, -2.5] }}
                transition={{ duration: 1.15, repeat: Infinity, ease: 'easeInOut' }}
              >
                <RobotMascotSvg size={64} variant="wave" />
              </motion.div>
              <span className="boot-mini-pad" aria-hidden="true">
                <RetroGamepadSvg width={34} />
              </span>
            </div>

            <div className="boot-kicker">2026 E-TOWN EMBODIED INTELLIGENCE</div>
            <div className="boot-title">亦庄具身智能嘉年华</div>
            <div className="boot-sub">
              {hasDirectStamp ? '识别展位码 · 正在前往打卡点' : '掌上导览机启动中 · 45 个展位就绪'}
            </div>

            {/* Segmented Arcade Progress Bar */}
            <div className="boot-bar-track" aria-hidden="true">
              <motion.div
                className="boot-bar-fill"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  delay: 0.22,
                  duration: hasDirectStamp ? 0.72 : 1.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>

            <div className="boot-skip">轻点屏幕立即进入 ▸</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
