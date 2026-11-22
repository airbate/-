import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ZONES, type Spot } from '../data/carnivalData';
import { downloadDataUrl } from '../services/photoComposer';

interface PhotoResultModalProps {
  open: boolean;
  image: string | null;
  spot: Spot | null;
  onClose: () => void;
  onOpenGallery: () => void;
}

export function PhotoResultModal({
  open,
  image,
  spot,
  onClose,
  onOpenGallery,
}: PhotoResultModalProps) {
  const [sharing, setSharing] = useState(false);

  const filename = spot ? `carnival-${spot.id}-${Date.now()}.jpg` : 'carnival.jpg';

  const handleDownload = () => {
    if (!image) return;
    downloadDataUrl(image, filename);
  };

  const handleShare = async () => {
    if (!image || !spot || sharing) return;
    setSharing(true);
    try {
      const blob = await (await fetch(image)).blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `${spot.name} · 我的嘉年华打卡`,
          text: `我在 2026 亦庄具身智能嘉年华打卡了 ${spot.id} ${spot.name}`,
        });
      } else {
        handleDownload();
      }
    } catch {
      // 用户取消分享，忽略
    } finally {
      setSharing(false);
    }
  };

  return (
    <AnimatePresence>
      {open && image && spot && (
        <motion.div
          className="backdrop photo-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="打卡照片"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="photo-result"
            initial={{ y: 60, scale: 0.94, opacity: 0.6 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.97, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.85 }}
          >
            <div className="photo-result-head">
              <span>📸 打卡成功</span>
              <button type="button" className="close-btn" aria-label="关闭" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="photo-result-img">
              <img src={image} alt={`${spot.id} ${spot.name} 打卡照`} />
              <span className="photo-saved-pill">✓ 已存入素材库</span>
            </div>

            <div className="photo-result-body">
              <div className="photo-result-title">
                <span className="code-badge">{spot.id}</span>
                <strong>{spot.name}</strong>
              </div>
              <p className="photo-result-sub">
                {ZONES[spot.z].name} · 印章已印在照片上，可随时下载或分享
              </p>
            </div>

            <div className="photo-result-actions">
              <button type="button" className="pr-btn primary" onClick={handleDownload}>
                ⬇️ 下载照片
              </button>
              <button type="button" className="pr-btn" onClick={handleShare} disabled={sharing}>
                📤 分享
              </button>
              <button type="button" className="pr-btn" onClick={onOpenGallery}>
                🖼 素材库
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
