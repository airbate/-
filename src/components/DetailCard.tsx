import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ZONES, type Spot } from '../data/carnivalData';

interface DetailCardProps {
  spot: Spot | null;
  open: boolean;
  isStamped: boolean;
  stampBurstKey: number;
  slideDir: number;
  onClose: () => void;
  onStep: (delta: number) => void;
  onCapturePhoto: () => void;
}

const SPARKS = [
  { sx: '-46px', sy: '-32px' },
  { sx: '46px', sy: '-36px' },
  { sx: '-52px', sy: '14px' },
  { sx: '52px', sy: '18px' },
  { sx: '-24px', sy: '46px' },
  { sx: '28px', sy: '44px' },
];

export function DetailCard({
  spot,
  open,
  isStamped,
  stampBurstKey,
  slideDir,
  onClose,
  onStep,
  onCapturePhoto,
}: DetailCardProps) {
  const zone = spot ? ZONES[spot.z] : ZONES.M;

  return (
    <AnimatePresence>
      {open && spot && (
        <motion.div
          className="backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`${spot.id} ${spot.name} 展位详情`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.article
            className="detail-card"
            style={{ ['--zc' as string]: zone.color }}
            initial={{ y: 56, scale: 0.96, opacity: 0.7 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 44, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 440, damping: 32, mass: 0.85 }}
          >
            <div className="card-awning" />

            {/* Rubber Stamp Seal + Impact Burst */}
            {isStamped && (
              <div className="stamp-wrap" aria-hidden="true">
                {stampBurstKey > 0 && (
                  <React.Fragment key={stampBurstKey}>
                    <div className="stamp-shockwave" />
                    {SPARKS.map((sp, i) => (
                      <span
                        key={i}
                        className="stamp-spark"
                        style={
                          {
                            ['--sx' as string]: sp.sx,
                            ['--sy' as string]: sp.sy,
                          } as React.CSSProperties
                        }
                      >
                        ★
                      </span>
                    ))}
                  </React.Fragment>
                )}
                <motion.div
                  key={`${spot.id}-${stampBurstKey}`}
                  className="stamp-fx"
                  initial={
                    stampBurstKey > 0
                      ? { scale: 2.5, rotate: -26, opacity: 0 }
                      : { scale: 1, rotate: -16, opacity: 1 }
                  }
                  animate={{ scale: 1, rotate: -16, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 520,
                    damping: 22,
                    mass: 0.7,
                  }}
                >
                  <span>★</span>
                  <span>已打卡</span>
                  <span>{spot.lm ? 'GO!' : spot.id}</span>
                </motion.div>
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={spot.id}
                initial={{ x: slideDir * 24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: slideDir * -24, opacity: 0 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="card-head">
                  <div>
                    <div>
                      <span className="code-badge">{spot.lm ? '地标' : spot.id}</span>
                      <span className="zone-lbl">{zone.name}</span>
                    </div>
                    <h2 className="card-title">{spot.name}</h2>
                    <div className="card-team">{spot.team}</div>
                  </div>
                  <button
                    type="button"
                    className="close-btn"
                    aria-label="关闭详情卡"
                    onClick={onClose}
                  >
                    ✕
                  </button>
                </div>

                <div className="card-body">
                  <div className="card-desc">{spot.desc}</div>
                  <div className="card-tags">
                    {spot.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        # {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="card-foot">
              <button type="button" className="nav-btn" onClick={() => onStep(-1)}>
                ◀ 上一个
              </button>
              <button
                type="button"
                className={`card-scan-btn ${isStamped ? 'done' : ''}`}
                onClick={onCapturePhoto}
              >
                {spot.lm
                  ? '📷 给地标拍张照'
                  : isStamped
                  ? '📷 已打卡 · 再拍一张'
                  : '📷 拍照打卡'}
              </button>
              <button type="button" className="nav-btn" onClick={() => onStep(1)}>
                下一个 ▶
              </button>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
