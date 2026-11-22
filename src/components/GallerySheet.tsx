import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { deletePhoto, listPhotos, type PhotoEntry } from '../services/photoStore';
import { downloadDataUrl } from '../services/photoComposer';
import { SFX } from '../utils/sfx';

interface GallerySheetProps {
  open: boolean;
  onClose: () => void;
}

function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

export function GallerySheet({ open, onClose }: GallerySheetProps) {
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewer, setViewer] = useState<PhotoEntry | null>(null);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    listPhotos()
      .then((list) => {
        if (alive) setPhotos(list);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  const handleDownload = (entry: PhotoEntry) => {
    downloadDataUrl(entry.dataUrl, `carnival-${entry.boothId}-${entry.createdAt}.jpg`);
  };

  const handleShare = async (entry: PhotoEntry) => {
    try {
      const blob = await (await fetch(entry.dataUrl)).blob();
      const file = new File([blob], `carnival-${entry.boothId}.jpg`, { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${entry.boothName} · 我的嘉年华打卡`,
          text: `我在 2026 亦庄具身智能嘉年华打卡了 ${entry.boothId} ${entry.boothName}`,
        });
      } else {
        handleDownload(entry);
      }
    } catch {
      // 取消分享
    }
  };

  const handleDelete = async (entry: PhotoEntry) => {
    if (!window.confirm('删除这张打卡照片？删除后无法恢复。')) return;
    await deletePhoto(entry.id);
    setPhotos((prev) => prev.filter((p) => p.id !== entry.id));
    setViewer(null);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="我的打卡照片"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          >
            <motion.div
              className="dir-sheet gallery-sheet"
              initial={{ y: 64, scale: 0.97, opacity: 0.7 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 48, scale: 0.98, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 430, damping: 34, mass: 0.85 }}
            >
              <div className="dir-head">
                <span>🖼 我的打卡照片（{photos.length}）</span>
                <button type="button" className="close-btn" aria-label="关闭素材库" onClick={onClose}>
                  ✕
                </button>
              </div>

              <div className="gallery-body">
                {loading ? (
                  <p className="gallery-empty">读取中…</p>
                ) : photos.length === 0 ? (
                  <div className="gallery-empty">
                    <b>还没有照片</b>
                    <span>去展位点「拍照打卡」，照片会带着印章存到这里。</span>
                  </div>
                ) : (
                  <div className="gallery-grid">
                    {photos.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="gallery-item"
                        onClick={() => {
                          SFX.openCard();
                          setViewer(p);
                        }}
                      >
                        <img src={p.dataUrl} alt={`${p.boothId} ${p.boothName}`} loading="lazy" />
                        <span className="gallery-code">{p.boothId}</span>
                        <span className="gallery-name">{p.boothName}</span>
                        <span className="gallery-date">{fmtDate(p.createdAt)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewer && (
          <motion.div
            className="photo-viewer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewer(null);
            }}
          >
            <div className="photo-viewer-inner">
              <img src={viewer.dataUrl} alt={`${viewer.boothId} ${viewer.boothName}`} />
              <div className="photo-viewer-meta">
                <b>
                  {viewer.boothId} · {viewer.boothName}
                </b>
                <span>
                  {viewer.zoneName} · {fmtDate(viewer.createdAt)}
                </span>
              </div>
              <div className="photo-viewer-actions">
                <button type="button" className="pr-btn primary" onClick={() => handleDownload(viewer)}>
                  ⬇️ 下载
                </button>
                <button type="button" className="pr-btn" onClick={() => handleShare(viewer)}>
                  📤 分享
                </button>
                <button type="button" className="pr-btn danger" onClick={() => handleDelete(viewer)}>
                  删除
                </button>
                <button type="button" className="pr-btn" onClick={() => setViewer(null)}>
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
