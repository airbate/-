import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import jsQR from 'jsqr';
import { parseBoothQRCode } from '../utils/mapLogic';

interface ScannerModalProps {
  open: boolean;
  onClose: (silent?: boolean) => void;
  onRecognized: (boothId: string) => void;
  onSimulate: () => void;
  onToast: (message: string) => void;
}

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

export function ScannerModal({
  open,
  onClose,
  onRecognized,
  onSimulate,
  onToast,
}: ScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const lockedRef = useRef<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);

  const [statusVisible, setStatusVisible] = useState(true);
  const [statusTitle, setStatusTitle] = useState('正在启动后置摄像头…');
  const [statusDesc, setStatusDesc] = useState(
    '请允许访问相机，对准展位二维码即可自动盖章。'
  );

  // Initialize native BarcodeDetector once if supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        const BD = (window as unknown as {
          BarcodeDetector: new (opts: { formats: string[] }) => BarcodeDetectorLike;
        }).BarcodeDetector;
        detectorRef.current = new BD({ formats: ['qr_code'] });
      } catch {
        detectorRef.current = null;
      }
    }
    canvasRef.current = document.createElement('canvas');
  }, []);

  const stopCamera = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handlePayload = (raw: string) => {
    if (lockedRef.current) return;
    const id = parseBoothQRCode(raw);
    if (!id) {
      onToast('扫到的不是本嘉年华展位二维码哦');
      return;
    }
    lockedRef.current = true;
    stopCamera();
    onRecognized(id);
  };

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }

    lockedRef.current = false;
    setStatusVisible(true);
    setStatusTitle('正在启动后置摄像头…');
    setStatusDesc('请允许访问相机，对准展位二维码即可自动盖章。');

    let cancelled = false;

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setStatusTitle('当前环境暂不支持实时取景');
        setStatusDesc(
          '本地非 HTTPS 测试时浏览器会限制实时相机，请点下方「🖼 拍照 / 选图识码」或「✨ 模拟扫码体验」直接测试！'
        );
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatusVisible(false);

        let lastScan = 0;
        const loop = async (now: number) => {
          if (cancelled || !streamRef.current || lockedRef.current) return;
          rafRef.current = requestAnimationFrame(loop);
          if (now - lastScan < 180) return;
          lastScan = now;

          const v = videoRef.current;
          if (!v || v.readyState < 2 || !v.videoWidth) return;

          if (detectorRef.current) {
            try {
              const codes = await detectorRef.current.detect(v);
              if (codes?.[0]?.rawValue) {
                handlePayload(codes[0].rawValue);
                return;
              }
            } catch {
              // Fall back to jsQR
            }
          }

          const cvs = canvasRef.current;
          if (!cvs) return;
          const ctx = cvs.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;

          const tw = Math.min(480, v.videoWidth);
          const th = Math.round((v.videoHeight / v.videoWidth) * tw);
          cvs.width = tw;
          cvs.height = th;
          ctx.drawImage(v, 0, 0, tw, th);
          const imgData = ctx.getImageData(0, 0, tw, th);
          const res = jsQR(imgData.data, tw, th, { inversionAttempts: 'dontInvert' });
          if (res?.data) {
            handlePayload(res.data);
          }
        };

        rafRef.current = requestAnimationFrame(loop);
      } catch {
        if (cancelled) return;
        setStatusTitle('未能开启实时摄像头');
        setStatusDesc('可点下方「🖼 拍照 / 选图识码」识码打卡，或直接用微信扫一扫展位二维码！');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = async () => {
      URL.revokeObjectURL(url);
      const cvs = canvasRef.current || document.createElement('canvas');
      const ctx = cvs.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const sc = Math.min(1, 960 / Math.max(img.width, img.height));
      const w = Math.round(img.width * sc);
      const h = Math.round(img.height * sc);
      cvs.width = w;
      cvs.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      if (detectorRef.current) {
        try {
          const codes = await detectorRef.current.detect(cvs);
          if (codes?.[0]?.rawValue) {
            handlePayload(codes[0].rawValue);
            return;
          }
        } catch {
          // Fall back to jsQR
        }
      }

      const imgData = ctx.getImageData(0, 0, w, h);
      const res = jsQR(imgData.data, w, h);
      if (res?.data) {
        handlePayload(res.data);
        return;
      }
      onToast('未识别到二维码，请靠近拍清晰一点再试');
    };
    img.src = url;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="scanner-modal"
          role="dialog"
          aria-modal="true"
          aria-label="扫描展位二维码打卡"
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="scanner-inner">
            <div className="scan-head">
              <div className="scan-title">📷 扫描展位二维码打卡</div>
              <button
                type="button"
                className="scan-close"
                aria-label="关闭扫码器"
                onClick={() => onClose(false)}
              >
                ✕
              </button>
            </div>

            <div className="vf-wrap">
              <video ref={videoRef} className="scan-video" playsInline muted autoPlay />
              <div className="scan-reticle">
                <div className="scan-laser" />
              </div>
              {statusVisible && (
                <div className="scan-status">
                  <div className="scan-status-card">
                    <div style={{ fontSize: 36 }}>📸</div>
                    <div style={{ fontSize: 15.5, fontWeight: 900 }}>{statusTitle}</div>
                    <div style={{ fontSize: 12.5, color: '#C6D4F8', lineHeight: 1.55 }}>
                      {statusDesc}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="scan-foot">
              <div className="scan-tip">将展位二维码放入黄框，识别成功自动“滴”声盖章</div>
              <div className="scan-actions">
                <label className="scan-alt pri">
                  🖼 拍照 / 选图识码
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
                <button type="button" className="scan-alt" onClick={onSimulate}>
                  ✨ 模拟扫码体验
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
