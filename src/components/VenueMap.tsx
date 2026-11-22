import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  SPOTS,
  type Spot,
} from '../data/carnivalData';
import {
  cameraForPoint,
  cameraToSvgMatrix,
  clampCamera,
  type CameraState,
} from '../utils/mapLogic';
import { SFX } from '../utils/sfx';
import {
  GiftMountainG,
  MapRobotG,
  MapVisitorG,
  MiniConsoleStandeeG,
  PopWaveFlankG,
} from './CarnivalArt';

export interface VenueMapHandle {
  panTo: (sx: number, sy: number, scale?: number, instant?: boolean) => void;
  setScale: (scale: number, focusPoint?: { cx: number; cy: number } | null) => void;
  resetCamera: () => void;
  getScale: () => number;
}

interface VenueMapProps {
  focusedId: string | null;
  stampedIds: Set<string>;
  showRoute: boolean;
  onSelectSpot: (spot: Spot) => void;
  onScaleChange: (scale: number) => void;
}

const BUNTING_COLORS = ['#FF6B2B', '#FFC93C', '#2980FF', '#6C5CE7', '#00B894'];
const AUDIENCE_ROWS = [0, 1, 2];
const AUDIENCE_COLS = Array.from({ length: 12 }, (_, i) => i);
const W2_ROWS = [0, 1, 2];
const W2_COLS = [0, 1, 2, 3];

function MultiLineText({
  x,
  y,
  text,
  fontSize,
  fill,
  gap = 12,
}: {
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fill: string;
  gap?: number;
}) {
  const lines = text.split('\n');
  const startY = y - ((lines.length - 1) * gap) / 2;
  return (
    <text x={x} y={startY} textAnchor="middle" fill={fill} fontSize={fontSize} fontWeight={900}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : gap}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export const VenueMap = React.forwardRef<VenueMapHandle, VenueMapProps>(function VenueMap(
  { focusedId, stampedIds, showRoute, onSelectSpot, onScaleChange },
  ref
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const camGRef = useRef<SVGGElement | null>(null);

  // Smooth spring-damped camera state stored in refs for 60fps zero-re-render glides
  const currentCamRef = useRef<CameraState>({ scale: 1, tx: 0, ty: 0 });
  const targetCamRef = useRef<CameraState>({ scale: 1, tx: 0, ty: 0 });
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);
  const reportedScaleRef = useRef<number>(1);

  const [isDragging, setIsDragging] = useState(false);
  const [tapRipple, setTapRipple] = useState<{ cx: number; cy: number; key: number } | null>(null);

  // Pointer & gesture refs
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const panStartRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const pinchStartRef = useRef<{
    d: number;
    s: number;
    tx: number;
    ty: number;
    mx: number;
    my: number;
  } | null>(null);
  const wasDraggedRef = useRef(false);
  const activePointerCapturedRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  const applyTransformToDom = (cam: CameraState) => {
    const g = camGRef.current;
    if (!g) return;
    const { x, y, scale } = cameraToSvgMatrix(cam);
    g.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;

    if (Math.abs(scale - reportedScaleRef.current) > 0.025 || (scale === 1 && reportedScaleRef.current !== 1)) {
      reportedScaleRef.current = scale;
      onScaleChange(scale);
    }
  };

  const stopAnim = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const animateToTarget = (instant = false) => {
    targetCamRef.current = clampCamera(targetCamRef.current);
    if (instant) {
      stopAnim();
      currentCamRef.current = { ...targetCamRef.current };
      applyTransformToDom(currentCamRef.current);
      return;
    }

    if (rafRef.current !== null) return;
    lastFrameRef.current = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameRef.current) / 1000));
      lastFrameRef.current = now;

      const cur = currentCamRef.current;
      const tgt = targetCamRef.current;
      // Snappy critically-damped exponential interpolation
      const alpha = 1 - Math.exp(-15 * dt);

      const nextScale = cur.scale + (tgt.scale - cur.scale) * alpha;
      const nextTx = cur.tx + (tgt.tx - cur.tx) * alpha;
      const nextTy = cur.ty + (tgt.ty - cur.ty) * alpha;

      const done =
        Math.abs(tgt.scale - nextScale) < 0.002 &&
        Math.abs(tgt.tx - nextTx) < 0.35 &&
        Math.abs(tgt.ty - nextTy) < 0.35;

      if (done) {
        currentCamRef.current = { ...tgt };
        applyTransformToDom(currentCamRef.current);
        rafRef.current = null;
        return;
      }

      currentCamRef.current = { scale: nextScale, tx: nextTx, ty: nextTy };
      applyTransformToDom(currentCamRef.current);
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    applyTransformToDom(currentCamRef.current);
    return () => stopAnim();
  }, []);

  useImperativeHandle(ref, () => ({
    panTo(sx: number, sy: number, scale?: number, instant = false) {
      const nextScale = scale ?? targetCamRef.current.scale;
      targetCamRef.current = cameraForPoint(sx, sy, nextScale);
      animateToTarget(instant);
    },
    setScale(scale: number, focusPoint?: { cx: number; cy: number } | null) {
      if (scale <= 1.02) {
        targetCamRef.current = { scale: 1, tx: 0, ty: 0 };
      } else if (focusPoint) {
        targetCamRef.current = cameraForPoint(focusPoint.cx, focusPoint.cy, scale);
      } else {
        targetCamRef.current = clampCamera({ ...targetCamRef.current, scale });
      }
      animateToTarget(false);
    },
    resetCamera() {
      targetCamRef.current = { scale: 1, tx: 0, ty: 0 };
      animateToTarget(false);
    },
    getScale() {
      return targetCamRef.current.scale;
    },
  }));

  /** Convert client viewport coordinates accurately into 800x1040 SVG user coordinates */
  const clientToSvgPoint = (clientX: number, clientY: number): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const mapped = pt.matrixTransform(ctm.inverse());
      return { x: mapped.x, y: mapped.y };
    }
    const r = svg.getBoundingClientRect();
    return {
      x: ((clientX - r.left) / Math.max(r.width, 1)) * MAP_WIDTH,
      y: ((clientY - r.top) / Math.max(r.height, 1)) * MAP_HEIGHT,
    };
  };

  const getSvgRatio = (): number => {
    const svg = svgRef.current;
    if (!svg) return 1;
    const r = svg.getBoundingClientRect();
    return Math.max(MAP_WIDTH / Math.max(r.width, 1), MAP_HEIGHT / Math.max(r.height, 1));
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    wasDraggedRef.current = false;

    if (pointersRef.current.size === 1) {
      const cur = currentCamRef.current;
      panStartRef.current = { x: e.clientX, y: e.clientY, tx: cur.tx, ty: cur.ty };
      pinchStartRef.current = null;
    } else if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      const cur = currentCamRef.current;
      pinchStartRef.current = {
        d: Math.hypot(b.x - a.x, b.y - a.y),
        s: cur.scale,
        tx: cur.tx,
        ty: cur.ty,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
      };
      panStartRef.current = null;
      wasDraggedRef.current = true;
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ratio = getSvgRatio();

    if (pointersRef.current.size === 1 && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      if (Math.hypot(dx, dy) > 6) {
        wasDraggedRef.current = true;
        if (currentCamRef.current.scale > 1.01) {
          setIsDragging(true);
          if (activePointerCapturedRef.current === null && svgRef.current) {
            try {
              svgRef.current.setPointerCapture(e.pointerId);
              activePointerCapturedRef.current = e.pointerId;
            } catch {
              // Ignore synthetic pointer capture rejection
            }
          }
        }
      }
      if (!wasDraggedRef.current || currentCamRef.current.scale <= 1.01) return;
      targetCamRef.current = clampCamera({
        scale: currentCamRef.current.scale,
        tx: panStartRef.current.tx + dx * ratio,
        ty: panStartRef.current.ty + dy * ratio,
      });
      animateToTarget(true);
    } else if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const nextScale = Math.max(
        1,
        Math.min(3.2, pinchStartRef.current.s * (d / Math.max(pinchStartRef.current.d, 10)))
      );
      const sd = nextScale / pinchStartRef.current.s;
      targetCamRef.current = clampCamera({
        scale: nextScale,
        tx: pinchStartRef.current.tx * sd + ((a.x + b.x) / 2 - pinchStartRef.current.mx) * ratio,
        ty: pinchStartRef.current.ty * sd + ((a.y + b.y) / 2 - pinchStartRef.current.my) * ratio,
      });
      animateToTarget(true);
    }
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<SVGSVGElement>) => {
    const singleClick = pointersRef.current.size === 1 && !wasDraggedRef.current;
    pointersRef.current.delete(e.pointerId);

    if (activePointerCapturedRef.current === e.pointerId && svgRef.current) {
      try {
        svgRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      activePointerCapturedRef.current = null;
    }

    const targetEl = e.target as Element | null;
    if (singleClick && (!targetEl || !targetEl.closest('.spot-node'))) {
      const now = Date.now();
      if (now - lastTapRef.current < 280) {
        if (targetCamRef.current.scale > 1.15) {
          SFX.zoomOut();
          targetCamRef.current = { scale: 1, tx: 0, ty: 0 };
          animateToTarget(false);
        } else {
          SFX.zoomIn();
          const pt = clientToSvgPoint(e.clientX, e.clientY);
          targetCamRef.current = cameraForPoint(pt.x, pt.y, 2.05);
          animateToTarget(false);
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    }

    if (pointersRef.current.size < 2) {
      pinchStartRef.current = null;
    }
    if (pointersRef.current.size === 1) {
      const [p] = [...pointersRef.current.values()];
      panStartRef.current = {
        x: p.x,
        y: p.y,
        tx: currentCamRef.current.tx,
        ty: currentCamRef.current.ty,
      };
    } else if (pointersRef.current.size === 0) {
      panStartRef.current = null;
      setIsDragging(false);
      window.setTimeout(() => {
        wasDraggedRef.current = false;
      }, 30);
    }
  };

  // Smooth desktop mouse wheel zoom centered around cursor
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cur = targetCamRef.current;
      const factor = e.deltaY < 0 ? 1.18 : 1 / 1.18;
      const nextScale = Math.max(1, Math.min(3.2, cur.scale * factor));
      if (nextScale <= 1.02) {
        targetCamRef.current = { scale: 1, tx: 0, ty: 0 };
        animateToTarget(false);
        return;
      }
      const pt = clientToSvgPoint(e.clientX, e.clientY);
      // Map screen point back into map coordinates before zoom
      const mapX = MAP_WIDTH / 2 + (pt.x - MAP_WIDTH / 2 - cur.tx) / cur.scale;
      const mapY = MAP_HEIGHT / 2 + (pt.y - MAP_HEIGHT / 2 - cur.ty) / cur.scale;
      targetCamRef.current = clampCamera({
        scale: nextScale,
        tx: pt.x - MAP_WIDTH / 2 - (mapX - MAP_WIDTH / 2) * nextScale,
        ty: pt.y - MAP_HEIGHT / 2 - (mapY - MAP_HEIGHT / 2) * nextScale,
      });
      animateToTarget(false);
    };
    svg.addEventListener('wheel', onWheel, { passive: false });
    return () => svg.removeEventListener('wheel', onWheel);
  }, []);

  const handleSpotClick = (e: React.MouseEvent, spot: Spot) => {
    e.stopPropagation();
    if (wasDraggedRef.current) return;
    setTapRipple({ cx: spot.cx, cy: spot.cy, key: Date.now() });
    onSelectSpot(spot);
  };

  return (
    <svg
      ref={svgRef}
      id="map-svg"
      data-testid="venue-map-svg"
      className={`venue-map-svg ${isDragging ? 'is-dragging' : ''}`}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUpOrCancel}
      onPointerCancel={handlePointerUpOrCancel}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3593FA" />
          <stop offset="56%" stopColor="#86D4FF" />
          <stop offset="100%" stopColor="#FFF5DB" />
        </linearGradient>
        <linearGradient id="rib" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#163E9E" />
          <stop offset="50%" stopColor="#2B6FF5" />
          <stop offset="100%" stopColor="#163E9E" />
        </linearGradient>
        <linearGradient id="mTile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB057" />
          <stop offset="100%" stopColor="#F58D2D" />
        </linearGradient>
        <linearGradient id="stageGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1B64EC" />
          <stop offset="52%" stopColor="#268BFF" />
          <stop offset="53%" stopColor="#F8AE2E" />
          <stop offset="100%" stopColor="#FF7A28" />
        </linearGradient>
        <linearGradient id="splitPill" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#3B6BE8" />
          <stop offset="56%" stopColor="#3B6BE8" />
          <stop offset="57%" stopColor="#EE6D2E" />
          <stop offset="100%" stopColor="#F58C2D" />
        </linearGradient>
        <linearGradient id="goldStar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFF099" />
          <stop offset="55%" stopColor="#FFC93C" />
          <stop offset="100%" stopColor="#E69B00" />
        </linearGradient>
        <pattern id="tent" width="20" height="20" patternUnits="userSpaceOnUse">
          <rect width="10" height="20" fill="#FF6B35" />
          <rect x="10" width="10" height="20" fill="#FFF8EB" />
        </pattern>
        <pattern id="mapDots" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="12" cy="12" r="1.2" fill="rgba(214, 166, 92, 0.16)" />
        </pattern>
        <filter id="softShadow" x="-8%" y="-8%" width="118%" height="120%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.2" floodColor="#1A2647" floodOpacity="0.16" />
        </filter>
        <path
          id="walkPath"
          d="M 400 962 L 400 926 L 224 926 L 224 338 L 554 338 L 554 926 L 400 926"
        />
      </defs>

      <g ref={camGRef} id="camG" style={{ transformOrigin: '0 0', willChange: 'transform' }}>
        {/* Seamless Extended Sky & Ground Backdrop for Tall Mobile Screens */}
        <rect x={-200} y={-360} width={1200} height={520} fill="#3593FA" />
        <rect x={-200} y={160} width={1200} height={1240} fill="#FFF5DB" />
        <rect x={0} y={160} width={800} height={1160} fill="url(#mapDots)" />
        <rect x={0} y={0} width={800} height={164} fill="url(#sky)" />

        {/* Soft Drifting Clouds */}
        {[
          [110, 46, 32, 'map-cloud-a'],
          [690, 44, 34, 'map-cloud-b'],
        ].map(([cx, cy, r, cls], idx) => (
          <g key={idx} className={cls as string}>
            <circle cx={cx as number} cy={cy as number} r={r as number} fill="rgba(255,255,255,0.68)" />
            <circle cx={(cx as number) + (r as number) * 0.7} cy={(cy as number) + 4} r={(r as number) * 0.7} fill="rgba(255,255,255,0.68)" />
            <circle cx={(cx as number) - (r as number) * 0.55} cy={(cy as number) + 6} r={(r as number) * 0.55} fill="rgba(255,255,255,0.58)" />
          </g>
        ))}

        {/* Official Poster Pop-Art Multicolor Waves & Pleated Radial Fans */}
        <PopWaveFlankG x={14} y={40} scale={1.08} />
        <PopWaveFlankG x={786} y={40} scale={1.08} flip />

        {/* Carnival Bunting Flags */}
        <path d="M 32 96 Q 400 110 768 96" fill="none" stroke="#1A2647" strokeWidth={1.6} opacity={0.42} />
        {Array.from({ length: 16 }, (_, i) => {
          const bx = 34 + i * 46;
          return (
            <polygon
              key={i}
              points={`${bx},96 ${bx + 20},96 ${bx + 10},112`}
              fill={BUNTING_COLORS[i % BUNTING_COLORS.length]}
              stroke="#1A2647"
              strokeWidth={1.3}
            />
          );
        })}

        {/* Floating Poster Retro Gamepad Crest (Top Right) */}
        <g transform="translate(680 28) rotate(14)" filter="url(#softShadow)">
          <path
            d="M 10 10 H 54 C 60 10 64 17 62 28 C 60 37 55 41 50 40 C 45 39 42 32 37 32 H 27 C 22 32 19 39 14 40 C 9 41 4 37 2 28 C 0 17 4 10 10 10 Z"
            fill="#3E6FE0"
            stroke="#1A2647"
            strokeWidth={2.6}
          />
          <path
            d="M 32 10 H 54 C 60 10 64 17 62 28 C 60 37 55 41 50 40 C 45 39 42 32 37 32 H 32 Z"
            fill="#F5A63B"
            stroke="#1A2647"
            strokeWidth={2.2}
          />
          <rect x="14" y="15" width="4.5" height="12" rx="1.4" fill="#FFF8EB" stroke="#1A2647" strokeWidth={1.4} />
          <rect x="10.2" y="18.8" width="12" height="4.5" rx="1.4" fill="#FFF8EB" stroke="#1A2647" strokeWidth={1.4} />
          <circle cx="48" cy="17" r="2.7" fill="#FFF2A6" stroke="#1A2647" strokeWidth={1.3} />
          <circle cx="54" cy="21.5" r="2.7" fill="#FF6B35" stroke="#1A2647" strokeWidth={1.3} />
          <circle cx="48" cy="26" r="2.7" fill="#37B9FF" stroke="#1A2647" strokeWidth={1.3} />
          <circle cx="42" cy="21.5" r="2.7" fill="#7D5EC9" stroke="#1A2647" strokeWidth={1.3} />
        </g>

        {/* Gently Bobbing Red Carnival Balloons (matching Poster Stage Flanks) */}
        <g className="map-balloon-bob">
          <line x1={232} y1={142} x2={244} y2={178} stroke="#1A2647" strokeWidth={1.5} />
          <ellipse cx={231} cy={132} rx={11} ry={13.5} fill="#E94B35" stroke="#1A2647" strokeWidth={2} />
          <ellipse cx={227} cy={127} rx={2.5} ry={4} fill="rgba(255,255,255,0.45)" />
        </g>
        <g className="map-balloon-bob" style={{ animationDelay: '0.9s' }}>
          <line x1={542} y1={146} x2={530} y2={182} stroke="#1A2647" strokeWidth={1.5} />
          <ellipse cx={543} cy={136} rx={11} ry={13.5} fill="#E94B35" stroke="#1A2647" strokeWidth={2} />
          <ellipse cx={539} cy={131} rx={2.5} ry={4} fill="rgba(255,255,255,0.45)" />
        </g>

        {/* Main Official Bilingual Carnival Banner Ribbon */}
        <g filter="url(#softShadow)">
          <rect x={142} y={10} width={516} height={58} rx={29} fill="url(#rib)" stroke="#FFC93C" strokeWidth={4} />
          <rect x={160} y={15} width={480} height={13} rx={6.5} fill="rgba(255,255,255,0.16)" />
          <text
            x={400}
            y={46}
            textAnchor="middle"
            fill="#FFF"
            stroke="#14234E"
            strokeWidth={5}
            paintOrder="stroke"
            fontSize={31}
            fontWeight={900}
            letterSpacing={2}
          >
            2026 亦庄具身智能嘉年华
          </text>
          {/* Poster Bilingual Orange-Purple Subtitle Pill */}
          <rect x={182} y={62} width={436} height={24} rx={12} fill="url(#splitPill)" stroke="#FFF8EB" strokeWidth={2.5} />
          <text
            x={400}
            y={78}
            textAnchor="middle"
            fill="#FFF"
            fontSize={12.5}
            fontWeight={900}
            fontStyle="italic"
            letterSpacing={0.6}
          >
            2026 E-Town Embodied Intelligence Carnival · 现场导览图
          </text>
        </g>

        {/* Zone Container: 趣玩工坊 (Left Top) with Poster Split Pill + Mini Gamepad */}
        <g filter="url(#softShadow)">
          <polygon points="16,158 114,116 212,158" fill="url(#tent)" stroke="#1A2647" strokeWidth={2.5} />
          <rect x={16} y={152} width={196} height={418} rx={18} fill="#C4B5FD" stroke="#7B56C4" strokeWidth={3.5} />
          <rect x={203} y={184} width={6} height={368} rx={3} fill="#3B5BDB" />
          <rect x={36} y={139} width={156} height={32} rx={16} fill="url(#splitPill)" stroke="#FFF8EB" strokeWidth={3} />
          <text x={122} y={162} textAnchor="middle" fill="#FFF" fontSize={18} fontWeight={900} letterSpacing={2}>
            趣玩工坊
          </text>
          {/* Mini Tilted Gamepad badge perched on 趣玩工坊 header (straight from Image 1) */}
          <g transform="translate(26 130) rotate(-18) scale(0.56)">
            <path
              d="M 10 10 H 54 C 60 10 64 17 62 28 C 60 37 55 41 50 40 C 45 39 42 32 37 32 H 27 C 22 32 19 39 14 40 C 9 41 4 37 2 28 C 0 17 4 10 10 10 Z"
              fill="#3E6FE0"
              stroke="#1A2647"
              strokeWidth={3.5}
            />
            <path d="M 32 10 H 54 C 60 10 64 17 62 28 C 60 37 55 41 50 40 C 45 39 42 32 37 32 H 32 Z" fill="#F5A63B" />
            <rect x="14" y="15" width="4.5" height="12" rx="1.4" fill="#FFF8EB" />
            <rect x="10.2" y="18.8" width="12" height="4.5" rx="1.4" fill="#FFF8EB" />
            <circle cx="48" cy="18" r="3" fill="#FFF2A6" />
            <circle cx="53" cy="24" r="3" fill="#FF6B35" />
          </g>
        </g>

        {/* Zone Container: 高校角 (Left Bottom) with Poster Split Pill */}
        <g filter="url(#softShadow)">
          <rect x={16} y={718} width={196} height={234} rx={16} fill="#E8F8E9" stroke="#3D9E49" strokeWidth={3.5} />
          <rect x={32} y={712} width={164} height={32} rx={16} fill="url(#splitPill)" stroke="#FFF8EB" strokeWidth={3} />
          <text x={114} y={734} textAnchor="middle" fill="#FFF" fontSize={17} fontWeight={900} letterSpacing={3}>
            🎓 高校角
          </text>
        </g>

        {/* 观众席 (Center Upper) with Poster Isometric Chairs + Split Blue-Orange Pill */}
        <g>
          {AUDIENCE_ROWS.map((r) =>
            AUDIENCE_COLS.map((c) => (
              <g key={`${r}-${c}`}>
                <rect
                  x={246 + c * 24}
                  y={258 + r * 18}
                  width={17}
                  height={9}
                  rx={3}
                  fill="#F3F7FF"
                  stroke="#6E85B2"
                  strokeWidth={1.2}
                />
                <rect
                  x={248 + c * 24}
                  y={266 + r * 18}
                  width={13}
                  height={5}
                  rx={2}
                  fill="#C8D8F5"
                  stroke="#6E85B2"
                  strokeWidth={1}
                />
              </g>
            ))
          )}
          <rect x={332} y={266} width={116} height={26} rx={13} fill="url(#splitPill)" stroke="#FFF8EB" strokeWidth={2.5} />
          <text x={390} y={284} textAnchor="middle" fill="#FFF" fontSize={14.5} fontWeight={900} letterSpacing={3}>
            观众席
          </text>
        </g>

        {/* Zone Container: 人形机器人展位 (Center) */}
        <g filter="url(#softShadow)">
          <polygon points="238,366 293,332 348,366" fill="url(#tent)" stroke="#C85A17" strokeWidth={1.8} />
          <polygon points="428,366 483,332 538,366" fill="url(#tent)" stroke="#C85A17" strokeWidth={1.8} />
          <rect x={236} y={374} width={304} height={522} rx={14} fill="#2A6BD6" stroke="#1A2647" strokeWidth={3} />
          <rect x={239} y={680} width={298} height={213} rx={10} fill="#F79D3E" />
          <rect x={290} y={336} width={196} height={32} rx={16} fill="#2355D6" stroke="#FFC93C" strokeWidth={3} />
          <text x={388} y={358} textAnchor="middle" fill="#FFF" fontSize={18} fontWeight={900}>
            人形机器人展位
          </text>
        </g>

        {/* Zone Container: 桌面硬件展位 (Right) */}
        <g filter="url(#softShadow)">
          <rect x={568} y={344} width={212} height={436} rx={18} fill="#D8F1F8" stroke="#2B6CB0" strokeWidth={3.5} />
          <rect x={586} y={332} width={176} height={32} rx={16} fill="#2355D6" stroke="#FFC93C" strokeWidth={3} />
          <text x={674} y={354} textAnchor="middle" fill="#FFF" fontSize={18} fontWeight={900}>
            桌面硬件展位
          </text>
        </g>

        {/* Stylized Poster Carnival Visitors Strolling in the Aisles */}
        <MapVisitorG x={224} y={618} shirt="#4A7BF7" pants="#1E2D5A" />
        <MapVisitorG x={552} y={294} shirt="#F59B2E" pants="#26396E" balloon />
        <MapVisitorG x={554} y={596} shirt="#7D5EC9" pants="#1A2647" />
        <MapVisitorG x={324} y={972} shirt="#FF7847" pants="#2A3E78" />
        <MapVisitorG x={478} y={974} shirt="#3EA4F5" pants="#1E2D5A" balloon />

        {/* Iconic Official Poster Carnival Entrance Archway (Image 2 Closeup!) */}
        <g>
          {/* Side decorative foliage bushes */}
          {[
            [24, 1020, 46],
            [74, 1030, 36],
            [776, 1020, 46],
            [726, 1030, 36],
          ].map(([cx, cy, r], i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="#4CAF50" stroke="#2E7D32" strokeWidth={2.5} />
          ))}

          {/* Archway Warm Carpet Floor (cleanly framed between 高校角 x<=212 and 抽奖区 x>=568) */}
          <rect x={222} y={954} width={336} height={62} rx={10} fill="#FFE9BE" stroke="#D97B29" strokeWidth={2.2} />

          {/* Left Console Pillar with Circular White D-Pad Medallion */}
          <rect x={222} y={946} width={48} height={72} rx={8} fill="#5065B8" stroke="#1A2647" strokeWidth={2.6} />
          <circle cx={246} cy={984} r={13.5} fill="#FFF8EB" stroke="#1A2647" strokeWidth={2} />
          <rect x={243} y={975.5} width={6} height={17} rx={2} fill="#3B56A8" />
          <rect x={237.5} y={981} width={17} height={6} rx={2} fill="#3B56A8" />

          {/* Right Console Pillar with Circular White D-Pad Medallion */}
          <rect x={510} y={946} width={48} height={72} rx={8} fill="#5065B8" stroke="#1A2647" strokeWidth={2.6} />
          <circle cx={534} cy={984} r={13.5} fill="#FFF8EB" stroke="#1A2647" strokeWidth={2} />
          <rect x={531} y={975.5} width={6} height={17} rx={2} fill="#3B56A8" />
          <rect x={525.5} y={981} width={17} height={6} rx={2} fill="#3B56A8" />

          {/* Top Navy Lintel */}
          <rect x={218} y={934} width={344} height={24} rx={7} fill="#1E46A8" stroke="#1A2647" strokeWidth={2.6} />
          <text x={382} y={951} textAnchor="middle" fill="#FFF" fontSize={13.5} fontWeight={900} letterSpacing={1.4}>
            2026 亦庄具身智能嘉年华
          </text>
          {/* Hanging Pennant Scallops under Archway Lintel */}
          {Array.from({ length: 10 }, (_, i) => {
            const px = 274 + i * 23;
            return (
              <polygon
                key={i}
                points={`${px},958 ${px + 19},958 ${px + 9.5},970`}
                fill={BUNTING_COLORS[i % BUNTING_COLORS.length]}
                stroke="#1A2647"
                strokeWidth={1.2}
              />
            );
          })}

          {/* Signature White Humanoid Robot Peeking Playfully Over Top-Right Arch Corner */}
          <MapRobotG x={542} y={928} scale={0.86} pose="peek" />

          {/* Subtle Entry Sonar Beacon when unfocused */}
          {!focusedId && (
            <circle cx={390} cy={1008} r={24} className="entrance-sonar" />
          )}

          {/* Split Blue-Orange "嘉年华入口" Badge */}
          <rect x={314} y={992} width={152} height={34} rx={17} fill="url(#splitPill)" stroke="#FFF8EB" strokeWidth={3} />
          <text x={390} y={1015} textAnchor="middle" fill="#FFF" fontSize={17.5} fontWeight={900} letterSpacing={3}>
            ▲ 嘉年华入口
          </text>
        </g>

        {/* Animated Walkway Route */}
        <g id="routeG" style={{ opacity: showRoute ? 1 : 0, transition: 'opacity 0.25s ease' }}>
          <use href="#walkPath" className="route-glow" />
          <use href="#walkPath" className="route-dash" />
          {[0, -4, -8].map((b) => (
            <circle key={b} r={7} className="route-orb">
              <animateMotion dur="12s" begin={`${b}s`} repeatCount="indefinite">
                <mpath href="#walkPath" />
              </animateMotion>
            </circle>
          ))}
        </g>

        {/* All 48 Interactive Spots (45 Booths + 3 Landmarks) */}
        {SPOTS.map((s) => {
          const isFocused = focusedId === s.id;
          const isStamped = stampedIds.has(s.id);

          return (
            <g
              key={s.id}
              data-id={s.id}
              role="button"
              tabIndex={-1}
              aria-label={`${s.lm ? '地标' : s.id} ${s.name}${isStamped ? '（已打卡）' : ''}`}
              className={`spot-node${isFocused ? ' focused' : ''}${isStamped ? ' stamped' : ''}`}
              onClick={(e) => handleSpotClick(e, s)}
            >
              {/* Soft Ripple + Pulsing Focus Halo */}
              <rect
                className="focus-ripple"
                x={s.x - 7}
                y={s.y - 7}
                width={s.w + 14}
                height={s.h + 14}
                rx={12}
              />
              <rect
                className="focus-halo"
                x={s.x - 4}
                y={s.y - 4}
                width={s.w + 8}
                height={s.h + 8}
                rx={10}
              />

              {s.id === 'STAGE' ? (
                <>
                  {/* Overhead Stage Lighting Truss Rig (from Poster Image 1) */}
                  <line x1={s.x - 16} y1={s.y - 12} x2={s.x + s.w + 16} y2={s.y - 12} stroke="#1A2647" strokeWidth={3} />
                  <line x1={s.x - 16} y1={s.y - 5} x2={s.x + s.w + 16} y2={s.y - 5} stroke="#1A2647" strokeWidth={2} />
                  {Array.from({ length: 8 }, (_, idx) => {
                    const lx = s.x + 8 + idx * 32;
                    return (
                      <g key={idx}>
                        <line x1={lx} y1={s.y - 12} x2={lx + 14} y2={s.y - 5} stroke="#1A2647" strokeWidth={1.4} />
                        <circle cx={lx + 7} cy={s.y - 3} r={3.5} fill="#FFE680" stroke="#1A2647" strokeWidth={1.2} />
                      </g>
                    );
                  })}

                  {/* Stage Shadow & Base Platform */}
                  <rect x={s.x - 14} y={s.y + s.h - 4} width={s.w + 28} height={11} rx={5} fill="#1A2647" />
                  <rect
                    className="booth-bg"
                    x={s.x}
                    y={s.y}
                    width={s.w}
                    height={s.h}
                    rx={12}
                    fill="#F4F7FF"
                    stroke="#1A2647"
                    strokeWidth={3.2}
                  />

                  {/* Left Console Wing: Blue + D-Pad Medallion & Blue Dots */}
                  <rect x={s.x + 2} y={s.y + 2} width={44} height={s.h - 4} rx={10} fill="#D8EEFF" />
                  <circle cx={s.x + 24} cy={s.y + 26} r={14} fill="#FFFFFF" stroke="#1A2647" strokeWidth={2} />
                  <rect x={s.x + 21} y={s.y + 17} width={6} height={18} rx={2} fill="#1F4AA8" />
                  <rect x={s.x + 15} y={s.y + 23} width={18} height={6} rx={2} fill="#1F4AA8" />
                  <circle cx={s.x + 17} cy={s.y + 58} r={4.5} fill="#2B84F5" stroke="#1A2647" strokeWidth={1.4} />
                  <circle cx={s.x + 31} cy={s.y + 58} r={4.5} fill="#5CC5FF" stroke="#1A2647" strokeWidth={1.4} />
                  <circle cx={s.x + 17} cy={s.y + 72} r={4.5} fill="#5CC5FF" stroke="#1A2647" strokeWidth={1.4} />
                  <circle cx={s.x + 31} cy={s.y + 72} r={4.5} fill="#2B84F5" stroke="#1A2647" strokeWidth={1.4} />

                  {/* Right Console Wing: Arcade Action Buttons */}
                  <rect x={s.x + s.w - 46} y={s.y + 2} width={44} height={s.h - 4} rx={10} fill="#FFE6BF" />
                  <circle cx={s.x + s.w - 24} cy={s.y + 26} r={14} fill="#FFFFFF" stroke="#1A2647" strokeWidth={2} />
                  <rect x={s.x + s.w - 27} y={s.y + 17} width={6} height={18} rx={2} fill="#E25822" />
                  <rect x={s.x + s.w - 33} y={s.y + 23} width={18} height={6} rx={2} fill="#E25822" />
                  <circle cx={s.x + s.w - 31} cy={s.y + 58} r={4.5} fill="#FF6B2B" stroke="#1A2647" strokeWidth={1.4} />
                  <circle cx={s.x + s.w - 17} cy={s.y + 58} r={4.5} fill="#2B84F5" stroke="#1A2647" strokeWidth={1.4} />
                  <circle cx={s.x + s.w - 31} cy={s.y + 72} r={4.5} fill="#FFC93C" stroke="#1A2647" strokeWidth={1.4} />
                  <circle cx={s.x + s.w - 17} cy={s.y + 72} r={4.5} fill="#FF6B2B" stroke="#1A2647" strokeWidth={1.4} />

                  {/* Center Diagonal Blue-to-Gold Geometric LED Screen */}
                  <rect
                    x={s.x + 48}
                    y={s.y + 10}
                    width={s.w - 96}
                    height={s.h - 20}
                    rx={8}
                    fill="url(#stageGlow)"
                    stroke="#1A2647"
                    strokeWidth={2.4}
                  />
                  <text
                    x={s.cx}
                    y={s.y + 58}
                    textAnchor="middle"
                    fill="#FFF"
                    stroke="#1A2647"
                    strokeWidth={5}
                    paintOrder="stroke"
                    fontSize={27}
                    fontWeight={900}
                    letterSpacing={5}
                  >
                    主舞台
                  </text>

                  {/* Left & Right Navy Hi-Fi Speaker Towers */}
                  <rect x={s.x - 24} y={s.y + 20} width={20} height={68} rx={5} fill="#254896" stroke="#1A2647" strokeWidth={2.2} />
                  <circle cx={s.x - 14} cy={s.y + 39} r={6} fill="#14234E" stroke="#6FA6FF" strokeWidth={1.6} />
                  <circle cx={s.x - 14} cy={s.y + 66} r={7.5} fill="#14234E" stroke="#6FA6FF" strokeWidth={1.6} />
                  <rect x={s.x + s.w + 4} y={s.y + 20} width={20} height={68} rx={5} fill="#254896" stroke="#1A2647" strokeWidth={2.2} />
                  <circle cx={s.x + s.w + 14} cy={s.y + 39} r={6} fill="#14234E" stroke="#6FA6FF" strokeWidth={1.6} />
                  <circle cx={s.x + s.w + 14} cy={s.y + 66} r={7.5} fill="#14234E" stroke="#6FA6FF" strokeWidth={1.6} />
                </>
              ) : s.id === 'PHOTO' ? (
                <>
                  <polygon
                    points={`${s.x},${s.y + 24} ${s.cx},${s.y - 4} ${s.x + s.w},${s.y + 24}`}
                    fill="url(#tent)"
                    stroke="#C85A17"
                    strokeWidth={2}
                  />
                  <rect
                    className="booth-bg"
                    x={s.x}
                    y={s.y + 20}
                    width={s.w}
                    height={s.h - 20}
                    rx={12}
                    fill="#FFF5D6"
                    stroke="#E89B25"
                    strokeWidth={3}
                  />
                  <rect x={s.x + 20} y={s.y + 8} width={s.w - 40} height={24} rx={12} fill="url(#splitPill)" stroke="#FFF" strokeWidth={2} />
                  <text x={s.cx} y={s.y + 25} textAnchor="middle" fill="#FFF" fontSize={13.5} fontWeight={900}>
                    互动打卡区
                  </text>
                  {/* Official Mini Handheld Photo Frame Standee from Poster Image 2 */}
                  <MiniConsoleStandeeG x={s.cx - 24} y={s.y + 72} scale={0.78} />
                  <text x={s.cx + 38} y={s.y + 79} textAnchor="middle" fontSize={28}>📸</text>
                </>
              ) : s.id === 'LUCKY' ? (
                <>
                  <polygon
                    points={`${s.x + 8},${s.y + 30} ${s.cx},${s.y - 4} ${s.x + s.w - 8},${s.y + 30}`}
                    fill="url(#tent)"
                    stroke="#C85A17"
                    strokeWidth={2}
                  />
                  <rect
                    className="booth-bg"
                    x={s.x}
                    y={s.y + 26}
                    width={s.w}
                    height={s.h - 26}
                    rx={14}
                    fill="#FFF3CC"
                    stroke="#EE8226"
                    strokeWidth={3}
                  />
                  <rect x={s.x + 38} y={s.y + 14} width={s.w - 76} height={28} rx={14} fill="url(#splitPill)" stroke="#FFC93C" strokeWidth={2.5} />
                  <text x={s.cx} y={s.y + 34} textAnchor="middle" fill="#FFF" fontSize={16} fontWeight={900}>
                    抽奖区
                  </text>
                  {/* White Humanoid Mascot + Official Stacked Gift Box Mountain from Poster Image 2 */}
                  <MapRobotG x={s.cx - 46} y={s.y + 104} scale={0.82} />
                  <GiftMountainG x={s.cx + 28} y={s.y + 102} scale={0.94} />
                </>
              ) : s.id === 'W2' ? (
                <>
                  <polygon
                    points={`${s.x + 12},${s.y + 22} ${s.cx},${s.y - 16} ${s.x + s.w - 12},${s.y + 22}`}
                    fill="url(#tent)"
                    stroke="#C85A17"
                    strokeWidth={2}
                  />
                  <rect
                    className="booth-bg"
                    x={s.x}
                    y={s.y + 18}
                    width={s.w}
                    height={s.h - 18}
                    rx={16}
                    fill="#FFE566"
                    stroke="#E09F1F"
                    strokeWidth={3.5}
                  />
                  <rect x={s.x + 12} y={s.y + 28} width={46} height={24} rx={12} fill="#2355D6" />
                  <text x={s.x + 35} y={s.y + 45} textAnchor="middle" fill="#FFF" fontFamily="monospace" fontSize={14} fontWeight={900}>
                    W2
                  </text>
                  <text x={s.x + 128} y={s.y + 44} textAnchor="middle" fill="#1A2647" fontSize={12} fontWeight={900}>
                    Workshop 工坊 02
                  </text>
                  <text x={s.x + 82} y={s.y + 72} textAnchor="middle" fill="#1A2647" fontSize={15.5} fontWeight={900}>
                    智能大头机器狗
                  </text>
                  {W2_ROWS.map((r) =>
                    W2_COLS.map((c) => (
                      <rect
                        key={`${r}-${c}`}
                        x={s.x + 16 + c * 22}
                        y={s.y + 86 + r * 20}
                        width={15}
                        height={12}
                        rx={3}
                        fill="#FFF8EB"
                        stroke="#C88D19"
                        strokeWidth={1.2}
                      />
                    ))
                  )}
                  <text x={s.x + 158} y={s.y + 130} textAnchor="middle" fontSize={50}>🐕</text>
                </>
              ) : s.id === 'W1' ? (
                <>
                  {/* Official Poster Lush Grass Soccer Field (Image 2 Closeup!) */}
                  <rect
                    className="booth-bg"
                    x={s.x}
                    y={s.y}
                    width={s.w}
                    height={s.h}
                    rx={12}
                    fill="#72B828"
                    stroke="#1A2647"
                    strokeWidth={3}
                  />
                  {/* Subtle mowed grass stripes */}
                  {[0, 2, 4].map((stripe) => (
                    <rect
                      key={stripe}
                      x={s.x + 10 + stripe * 21}
                      y={s.y + 38}
                      width={21}
                      height={s.h - 48}
                      fill="rgba(255,255,255,0.08)"
                    />
                  ))}
                  {/* Header banner bar */}
                  <rect x={s.x + 4} y={s.y + 4} width={s.w - 8} height={28} rx={8} fill="#FFF8EB" stroke="#1A2647" strokeWidth={1.6} />
                  <rect x={s.x + 8} y={s.y + 8} width={34} height={20} rx={8} fill="#2355D6" />
                  <text x={s.x + 25} y={s.y + 22} textAnchor="middle" fill="#FFF" fontFamily="monospace" fontSize={12} fontWeight={900}>
                    W1
                  </text>
                  <text x={s.x + 94} y={s.y + 22} textAnchor="middle" fill="#1A2647" fontSize={11} fontWeight={900}>
                    踢球人形机器人
                  </text>
                  {/* Crisp White Pitch Lines: Outer Touchline, Penalty Boxes, Center Circle */}
                  <rect x={s.x + 10} y={s.y + 40} width={s.w - 20} height={s.h - 50} rx={3} fill="none" stroke="#FFFFFF" strokeWidth={2.2} />
                  <line x1={s.x + 10} y1={s.y + 114} x2={s.x + s.w - 10} y2={s.y + 114} stroke="#FFFFFF" strokeWidth={2} />
                  <circle cx={s.cx} cy={s.y + 114} r={20} fill="none" stroke="#FFFFFF" strokeWidth={2} />
                  <circle cx={s.cx} cy={s.y + 114} r={3} fill="#FFFFFF" />
                  {/* Top & Bottom Penalty Boxes */}
                  <rect x={s.cx - 34} y={s.y + 40} width={68} height={22} fill="none" stroke="#FFFFFF" strokeWidth={1.8} />
                  <rect x={s.cx - 18} y={s.y + 40} width={36} height={10} fill="none" stroke="#FFFFFF" strokeWidth={1.6} />
                  <rect x={s.cx - 34} y={s.y + s.h - 32} width={68} height={22} fill="none" stroke="#FFFFFF" strokeWidth={1.8} />
                  <rect x={s.cx - 18} y={s.y + s.h - 20} width={36} height={10} fill="none" stroke="#FFFFFF" strokeWidth={1.6} />
                  {/* White Humanoid Robot Mascot Kicking a Soccer Ball */}
                  <MapRobotG x={s.cx - 14} y={s.y + 112} scale={0.95} pose="soccer" />
                  <g transform={`translate(${s.cx + 25} ${s.y + 136})`}>
                    <circle cx={0} cy={0} r={10} fill="#FFFFFF" stroke="#1A2647" strokeWidth={2} />
                    <polygon points="0,-5 4.8,-1.5 3,4.2 -3,4.2 -4.8,-1.5" fill="#1A2647" />
                  </g>
                </>
              ) : s.z === 'Q' ? (
                <>
                  <rect x={s.x} y={s.y + 2.5} width={s.w} height={s.h} rx={10} fill="rgba(91,56,168,0.22)" />
                  <rect className="booth-bg" x={s.x} y={s.y} width={s.w} height={s.h} rx={10} fill="#FFF" stroke="#7B56C4" strokeWidth={2.4} />
                  <text x={s.x + 25} y={s.y + 37} textAnchor="middle" fontSize={24}>{s.ic}</text>
                  <rect x={s.x + 51} y={s.y + 6} width={34} height={17} rx={6} fill="#7B56C4" />
                  <text x={s.x + 68} y={s.y + 18.5} textAnchor="middle" fill="#FFF" fontFamily="monospace" fontSize={11} fontWeight={900}>
                    {s.id}
                  </text>
                  <text x={s.x + 51} y={s.y + 41} fill="#1A2647" fontSize={12.4} fontWeight={900}>
                    {s.sh}
                  </text>
                </>
              ) : s.z === 'S' ? (
                <>
                  <rect x={s.x} y={s.y + 2} width={s.w} height={s.h} rx={8} fill="rgba(31,110,136,0.18)" />
                  <rect className="booth-bg" x={s.x} y={s.y} width={s.w} height={s.h} rx={8} fill="#FFF" stroke="#2B839B" strokeWidth={2} />
                  <rect x={s.x + 5} y={s.y + 6} width={33} height={23} rx={6} fill="#1F9D8B" />
                  <text x={s.x + 21.5} y={s.y + 21.5} textAnchor="middle" fill="#FFF" fontFamily="monospace" fontSize={11} fontWeight={900}>
                    {s.id}
                  </text>
                  <text x={s.x + 42} y={s.y + 21.5} fill="#1A2647" fontSize={10.4} fontWeight={900}>
                    {s.sh}
                  </text>
                  <text x={s.x + s.w - 13} y={s.y + 23} textAnchor="middle" fontSize={14}>{s.ic}</text>
                </>
              ) : s.z === 'G' ? (
                <>
                  <rect x={s.x} y={s.y + 2} width={s.w} height={s.h} rx={7} fill="rgba(45,120,56,0.18)" />
                  <rect className="booth-bg" x={s.x} y={s.y} width={s.w} height={s.h} rx={7} fill="#FFF" stroke="#3D9E49" strokeWidth={2} />
                  <rect x={s.x + 10} y={s.y + 3} width={s.w - 20} height={13} rx={5} fill="#3D9E49" />
                  <text x={s.cx} y={s.y + 12.5} textAnchor="middle" fill="#FFF" fontFamily="monospace" fontSize={9.5} fontWeight={900}>
                    {s.id}
                  </text>
                  <MultiLineText x={s.cx} y={s.y + 29} text={s.sh} fontSize={9.8} fill="#1A2647" gap={10.5} />
                </>
              ) : (
                <>
                  <rect x={s.x} y={s.y + 3} width={s.w} height={s.h} rx={8} fill="rgba(16,24,48,0.22)" />
                  <rect className="booth-bg" x={s.x} y={s.y} width={s.w} height={s.h} rx={8} fill="url(#mTile)" stroke="#C85A17" strokeWidth={2.2} />
                  <rect x={s.x + 12} y={s.y + 5} width={s.w - 24} height={16} rx={6} fill="#C84B11" />
                  <text x={s.cx} y={s.y + 16.5} textAnchor="middle" fill="#FFF" fontFamily="monospace" fontSize={11} fontWeight={900}>
                    {s.id}
                  </text>
                  <rect x={s.x + 4} y={s.y + 24} width={s.w - 8} height={32} rx={5} fill="#FFF8EB" />
                  <MultiLineText x={s.cx} y={s.y + 42} text={s.sh} fontSize={10} fill="#1A2647" gap={11.5} />
                  <text x={s.cx} y={s.y + s.h - 8} textAnchor="middle" fontSize={20}>{s.ic || '🤖'}</text>
                </>
              )}

              {/* Metallic Embossed Stamp Star Badge */}
              {!s.lm && (
                <g className="stamp-star">
                  <circle cx={s.x + s.w - 4} cy={s.y + 4} r={10.5} fill="url(#goldStar)" stroke="#1A2647" strokeWidth={2} />
                  <text x={s.x + s.w - 4} y={s.y + 8} textAnchor="middle" fill="#1A2647" fontSize={12} fontWeight={900}>
                    ★
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Crisp Golden Tap Ripple on Booth Click */}
        {tapRipple && (
          <circle
            key={tapRipple.key}
            cx={tapRipple.cx}
            cy={tapRipple.cy}
            r={16}
            className="booth-tap-ripple"
          />
        )}
      </g>
    </svg>
  );
});
