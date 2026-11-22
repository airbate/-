/* 把打卡印章直接烧进照片里，输出可直接保存的图片 */

import { ZONES, type Spot } from '../data/carnivalData';

const MAX_EDGE = 1280;
const FONT =
  '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,-apple-system,sans-serif';
const CREAM = '#FFF4DE';
const SEAL = '#D8412F';

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // 某些浏览器不支持该参数，走 Image 兜底
    }
  }
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image decode failed'));
    };
    img.src = url;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    const next = cur + ch;
    if (ctx.measureText(next).width > maxWidth && cur) {
      lines.push(cur);
      cur = ch;
      if (lines.length === maxLines - 1) break;
    } else {
      cur = next;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.join('').length < text.length) {
    lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1) + '…';
  }
  return lines;
}

function drawSeal(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  spot: Spot,
  dateStr: string
) {
  const r = Math.min(w, h) * 0.135;
  const pad = Math.round(w * 0.06);
  const cx = w - pad - r;
  const cy = h - pad - r;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-12 * Math.PI) / 180);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = SEAL;
  ctx.fillStyle = SEAL;

  /* 外圈 */
  ctx.lineWidth = Math.max(4, r * 0.075);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();

  /* 内圈虚线 */
  ctx.lineWidth = Math.max(2, r * 0.028);
  ctx.setLineDash([r * 0.13, r * 0.1]);
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.font = `900 ${Math.round(r * 0.46)}px ${FONT}`;
  ctx.fillText(spot.lm ? 'GO' : spot.id, 0, -r * 0.16);

  ctx.font = `900 ${Math.round(r * 0.2)}px ${FONT}`;
  ctx.fillText('已打卡', 0, r * 0.2);

  ctx.font = `700 ${Math.round(r * 0.13)}px ${FONT}`;
  ctx.fillText(dateStr, 0, r * 0.49);

  ctx.restore();
}

export async function composeStampedPhoto(file: File, spot: Spot): Promise<string> {
  const img = await loadBitmap(file);
  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih) throw new Error('empty image');

  const scale = Math.min(1, MAX_EDGE / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * scale));
  const h = Math.max(1, Math.round(ih * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');

  ctx.drawImage(img as CanvasImageSource, 0, 0, w, h);

  const pad = Math.round(w * 0.055);
  const d = new Date();
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(
    d.getDate()
  ).padStart(2, '0')}`;

  /* 底部压暗，保证文字可读 */
  const grad = ctx.createLinearGradient(0, h * 0.58, 0, h);
  grad.addColorStop(0, 'rgba(10,18,48,0)');
  grad.addColorStop(1, 'rgba(10,18,48,0.9)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, h * 0.58, w, h * 0.42);

  /* 左上角品牌 */
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = CREAM;
  ctx.font = `800 ${Math.round(w * 0.03)}px ${FONT}`;
  ctx.fillText('2026 亦庄具身智能嘉年华', pad, pad);
  ctx.shadowBlur = 0;

  /* 底部信息：项目名 + 展区/编号 */
  const stampR = Math.min(w, h) * 0.135;
  const textMax = w - pad * 2 - stampR * 2 - 16;
  const nameSize = Math.min(Math.round(w * 0.062), Math.round(h * 0.05));
  ctx.font = `900 ${nameSize}px ${FONT}`;
  const lines = wrapText(ctx, spot.name, textMax, 2);

  const lineH = nameSize * 1.16;
  const zoneSize = Math.round(w * 0.028);
  const zoneTop = h - pad - zoneSize;
  const nameTop = zoneTop - 8 - lineH * lines.length;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = CREAM;
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = Math.round(nameSize * 0.2);
  lines.forEach((line, i) => {
    ctx.font = `900 ${nameSize}px ${FONT}`;
    ctx.fillText(line, pad, nameTop + i * lineH);
  });

  ctx.font = `700 ${zoneSize}px ${FONT}`;
  ctx.fillStyle = 'rgba(255,244,222,0.9)';
  ctx.shadowBlur = Math.round(zoneSize * 0.3);
  ctx.fillText(
    `${ZONES[spot.z].name} · ${spot.lm ? '地标' : spot.id} · ${dateStr}`,
    pad,
    zoneTop
  );

  drawSeal(ctx, w, h, spot, dateStr);

  return canvas.toDataURL('image/jpeg', 0.88);
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
