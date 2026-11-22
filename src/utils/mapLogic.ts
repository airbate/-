import {
  BOOTHS,
  MAP_HEIGHT,
  MAP_WIDTH,
  type FilterZone,
  type Spot,
} from '../data/carnivalData';

export type DpadDirection = 'up' | 'down' | 'left' | 'right';

export interface CameraState {
  scale: number;
  tx: number;
  ty: number;
}

const BOOTH_ID_SET = new Set(BOOTHS.map((b) => b.id));

/**
 * Clamp camera scale & translation strictly within map viewport bounds.
 */
export function clampCamera(cam: CameraState): CameraState {
  const clampedScale = Math.max(1, Math.min(3.2, cam.scale));
  if (clampedScale <= 1.01) {
    return { scale: 1, tx: 0, ty: 0 };
  }
  const halfW = MAP_WIDTH / 2;
  const halfH = MAP_HEIGHT / 2;
  const maxX = halfW * (clampedScale - 1) + 60;
  const maxY = halfH * (clampedScale - 1) + 60;
  return {
    scale: clampedScale,
    tx: Math.max(-maxX, Math.min(maxX, cam.tx)),
    ty: Math.max(-maxY, Math.min(maxY, cam.ty)),
  };
}

/**
 * Compute target camera state to center a given SVG coordinate (sx, sy) at target scale.
 */
export function cameraForPoint(sx: number, sy: number, scale: number): CameraState {
  const nextScale = Math.max(1, Math.min(3.2, scale));
  return clampCamera({
    scale: nextScale,
    tx: (MAP_WIDTH / 2 - sx) * nextScale,
    ty: (MAP_HEIGHT / 2 - sy) * nextScale,
  });
}

/**
 * Compute SVG transform coordinates (translateX, translateY, scale) from camera state.
 */
export function cameraToSvgMatrix(cam: CameraState): { x: number; y: number; scale: number } {
  const halfW = MAP_WIDTH / 2;
  const halfH = MAP_HEIGHT / 2;
  return {
    x: halfW + cam.tx - halfW * cam.scale,
    y: halfH + cam.ty - halfH * cam.scale,
    scale: cam.scale,
  };
}

/**
 * Parse a QR payload (either URL with ?stamp=XX or raw text containing a booth code).
 */
export function parseBoothQRCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();
  if (!trimmed) return null;

  try {
    const param = new URL(trimmed).searchParams.get('stamp');
    if (param) {
      const upper = param.trim().toUpperCase();
      if (BOOTH_ID_SET.has(upper)) return upper;
    }
  } catch {
    // Not a valid URL, fall through to pattern matching
  }

  const upperText = trimmed.toUpperCase();
  const match = upperText.match(
    /(?:^|[^A-Z0-9])(Q[1-6]|M(?:1[0-5]|[1-9])|S(?:10|[1-9])|G(?:1[0-2]|[1-9])|W[12])(?:$|[^A-Z0-9])/
  );
  return match && BOOTH_ID_SET.has(match[1]) ? match[1] : null;
}

/**
 * Spatial directional search for handheld D-pad navigation across the 45 booths.
 */
export function findNextDpadBooth(
  current: Spot,
  dir: DpadDirection,
  candidates: Spot[] = BOOTHS
): Spot | null {
  let best: Spot | null = null;
  let bestScore = Infinity;

  for (const c of candidates) {
    if (c.id === current.id) continue;
    const dx = c.cx - current.cx;
    const dy = c.cy - current.cy;

    let ok = false;
    let primary = 0;
    let secondary = 0;

    if (dir === 'right' && dx > 16) {
      ok = true;
      primary = dx;
      secondary = Math.abs(dy);
    } else if (dir === 'left' && dx < -16) {
      ok = true;
      primary = -dx;
      secondary = Math.abs(dy);
    } else if (dir === 'down' && dy > 16) {
      ok = true;
      primary = dy;
      secondary = Math.abs(dx);
    } else if (dir === 'up' && dy < -16) {
      ok = true;
      primary = -dy;
      secondary = Math.abs(dx);
    }

    if (ok) {
      const score = primary + secondary * 2.2;
      if (score < bestScore) {
        bestScore = score;
        best = c;
      }
    }
  }

  return best;
}

/**
 * Filter the 45 booths by zone tab and search query.
 */
export function filterDirectoryBooths(
  zone: FilterZone,
  query: string,
  booths: Spot[] = BOOTHS
): Spot[] {
  const q = query.trim().toLowerCase();
  return booths.filter((b) => {
    if (zone !== 'ALL' && b.z !== zone) return false;
    if (!q) return true;
    return (
      b.id.toLowerCase().includes(q) ||
      b.name.toLowerCase().includes(q) ||
      b.team.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/**
 * Step to previous or next booth in the ordered 45-booth list.
 */
export function stepBooth(currentId: string | null, delta: number, booths: Spot[] = BOOTHS): Spot {
  const idx = currentId ? booths.findIndex((b) => b.id === currentId) : -1;
  const nextIdx = (Math.max(idx, 0) + delta + booths.length) % booths.length;
  return booths[nextIdx];
}
