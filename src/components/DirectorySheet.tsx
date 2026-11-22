import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ZONES, type FilterZone, type Spot } from '../data/carnivalData';
import { filterDirectoryBooths } from '../utils/mapLogic';
import { SFX } from '../utils/sfx';

interface DirectorySheetProps {
  open: boolean;
  stampedIds: Set<string>;
  onClose: () => void;
  onPickBooth: (spot: Spot) => void;
}

const ZONE_TABS: { key: FilterZone; label: string }[] = [
  { key: 'ALL', label: '全部 (45)' },
  { key: 'Q', label: '趣玩 Q' },
  { key: 'M', label: '人形 M' },
  { key: 'S', label: '桌面 S' },
  { key: 'G', label: '高校 G' },
  { key: 'W', label: '工坊 W' },
];

export function DirectorySheet({
  open,
  stampedIds,
  onClose,
  onPickBooth,
}: DirectorySheetProps) {
  const [zone, setZone] = useState<FilterZone>('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => filterDirectoryBooths(zone, query), [zone, query]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="45 个机器人展位速查"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="dir-sheet"
            initial={{ y: 64, scale: 0.97, opacity: 0.7 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 48, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 430, damping: 34, mass: 0.85 }}
          >
            <div className="dir-head">
              <span>🗺 45 个机器人展位速查</span>
              <button
                type="button"
                className="close-btn"
                aria-label="关闭展位速查"
                onClick={onClose}
              >
                ✕
              </button>
            </div>

            <div className="dir-bar">
              <div className="dir-search-wrap">
                <input
                  className="dir-input"
                  type="text"
                  inputMode="search"
                  role="searchbox"
                  aria-label="搜索展位"
                  placeholder="搜项目名 / 编号 / 高校（如 M5、拼豆、清华）..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    type="button"
                    className="dir-clear"
                    aria-label="清空搜索"
                    onClick={() => setQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="dir-zones" role="tablist" aria-label="展区筛选">
                {ZONE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={zone === tab.key}
                    className={`dz-btn ${zone === tab.key ? 'active' : ''}`}
                    onClick={() => {
                      SFX.click();
                      setZone(tab.key);
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="dir-list">
              {filtered.length === 0 ? (
                <div
                  style={{
                    gridColumn: '1 / -1',
                    textAlign: 'center',
                    padding: '28px 12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#5A678A',
                  }}
                >
                  未找到匹配的展位，换个关键词试试
                </div>
              ) : (
                filtered.map((b) => {
                  const stamped = stampedIds.has(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      className={`dir-item ${stamped ? 'is-stamped' : ''}`}
                      onClick={() => onPickBooth(b)}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          className="dir-code"
                          style={{ background: ZONES[b.z].color }}
                        >
                          {b.id}
                        </span>
                        <span style={{ color: '#E69B00', fontSize: 13 }}>
                          {stamped ? '★' : ''}
                        </span>
                      </div>
                      <div className="dir-name">{b.name}</div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
