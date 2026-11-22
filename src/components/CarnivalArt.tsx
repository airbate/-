import React from 'react';

/**
 * Reusable vector art motifs extracted from the official
 * "2026 亦庄具身智能嘉年华 (2026 E-Town Embodied Intelligence Carnival)" visual posters:
 *  - White astronaut-helmet embodied humanoid robot mascot
 *  - Tilted retro dual-tone gamepad emblem
 *  - Pop-art layered curling waves & pleated sunburst radial fan discs
 *  - Stacked carnival gift box pyramid
 *  - Mini handheld console photo-frame standee
 *  - Stylized carnival visitor silhouettes
 */

export function RobotMascotSvg({
  className,
  size = 54,
  variant = 'hero',
}: {
  className?: string;
  size?: number;
  variant?: 'hero' | 'wave';
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 80 84"
      fill="none"
      aria-hidden="true"
    >
      {/* Subtle aura shadow */}
      <ellipse cx="40" cy="78" rx="20" ry="4" fill="rgba(16,24,48,0.22)" />

      {/* Left arm */}
      <g transform={variant === 'wave' ? 'rotate(-26 22 44)' : ''}>
        <rect x="11" y="40" width="11" height="20" rx="5.5" fill="#F4F7FF" stroke="#1A2647" strokeWidth="2.4" />
        <circle cx="16.5" cy="49" r="3" fill="#3B6BE8" stroke="#1A2647" strokeWidth="1.6" />
        <rect x="12" y="56" width="9" height="7" rx="3.5" fill="#2A54C8" stroke="#1A2647" strokeWidth="2" />
      </g>

      {/* Right arm (waving up) */}
      <g transform={variant === 'wave' ? 'rotate(-38 58 44)' : 'rotate(-16 58 44)'}>
        <rect x="58" y="34" width="11" height="22" rx="5.5" fill="#F4F7FF" stroke="#1A2647" strokeWidth="2.4" />
        <circle cx="63.5" cy="44" r="3" fill="#3B6BE8" stroke="#1A2647" strokeWidth="1.6" />
        <rect x="59" y="29" width="9" height="8" rx="4" fill="#2A54C8" stroke="#1A2647" strokeWidth="2" />
      </g>

      {/* Legs & Chunky Blue Boots */}
      <rect x="26" y="58" width="11" height="15" rx="4.5" fill="#E9EFFD" stroke="#1A2647" strokeWidth="2.4" />
      <rect x="43" y="58" width="11" height="15" rx="4.5" fill="#E9EFFD" stroke="#1A2647" strokeWidth="2.4" />
      <rect x="23" y="68" width="15" height="8" rx="4" fill="#2A54C8" stroke="#1A2647" strokeWidth="2.2" />
      <rect x="42" y="68" width="15" height="8" rx="4" fill="#2A54C8" stroke="#1A2647" strokeWidth="2.2" />

      {/* Articulated White Torso Armor */}
      <rect x="22" y="38" width="36" height="25" rx="10" fill="#FFFFFF" stroke="#1A2647" strokeWidth="2.6" />
      <path d="M 27 45 H 53" stroke="#C7D6F5" strokeWidth="2" strokeLinecap="round" />
      {/* Chest Core Telemetry Panel */}
      <rect x="30" y="45" width="20" height="11" rx="4.5" fill="#1A2647" />
      <circle cx="36" cy="50.5" r="2.6" fill="#37C8FF" />
      <rect x="41" y="48.5" width="6.5" height="4" rx="2" fill="#FFB830" />

      {/* Shoulder Pauldrons */}
      <circle cx="22" cy="42" r="5.5" fill="#FFFFFF" stroke="#1A2647" strokeWidth="2.2" />
      <circle cx="58" cy="42" r="5.5" fill="#FFFFFF" stroke="#1A2647" strokeWidth="2.2" />

      {/* Ear Pods & Antenna */}
      <rect x="14" y="19" width="6" height="12" rx="3" fill="#3B6BE8" stroke="#1A2647" strokeWidth="2.2" />
      <rect x="60" y="19" width="6" height="12" rx="3" fill="#3B6BE8" stroke="#1A2647" strokeWidth="2.2" />
      <line x1="40" y1="9" x2="40" y2="3.5" stroke="#1A2647" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="40" cy="3.5" r="2.6" fill="#FF7B2B" stroke="#1A2647" strokeWidth="1.6" />

      {/* Glossy White Astronaut Helmet */}
      <rect x="18" y="8" width="44" height="33" rx="16.5" fill="#FFFFFF" stroke="#1A2647" strokeWidth="2.8" />
      {/* Helmet Gloss Highlight */}
      <path d="M 27 12.5 Q 40 9.5 53 12.5" stroke="#DDE8FF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Curved Dark Visor */}
      <rect x="24" y="16" width="32" height="18" rx="9" fill="#131C36" stroke="#1A2647" strokeWidth="1.5" />
      {/* Warm Amber-Gold Glowing Eyes (signature poster look) */}
      <rect x="29.5" y="22" width="7.5" height="5.5" rx="2.75" fill="#FFB830" />
      <rect x="43" y="22" width="7.5" height="5.5" rx="2.75" fill="#FFB830" />
      {/* Visor Glint */}
      <path d="M 28 19.5 Q 34 17.5 40 18.8" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Tilted Retro Dual-Tone Gamepad Emblem (HTML/Standalone SVG version)
 */
export function RetroGamepadSvg({
  className,
  width = 44,
}: {
  className?: string;
  width?: number;
}) {
  const height = Math.round(width * 0.72);
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 84 60"
      fill="none"
      aria-hidden="true"
    >
      <g transform="rotate(14 42 30)">
        {/* Drop shadow */}
        <path
          d="M 16 14 H 68 C 75 14 79 22 77 35 C 75 46 69 51 63 50 C 57 49 54 41 48 41 H 36 C 30 41 27 49 21 50 C 15 51 9 46 7 35 C 5 22 9 14 16 14 Z"
          fill="rgba(14,22,48,0.28)"
          transform="translate(0 3)"
        />
        {/* Left Royal-Blue Half */}
        <path
          d="M 16 14 H 42 V 41 H 36 C 30 41 27 49 21 50 C 15 51 9 46 7 35 C 5 22 9 14 16 14 Z"
          fill="#3E6FE0"
        />
        {/* Right Warm Orange-Gold Half */}
        <path
          d="M 42 14 H 68 C 75 14 79 22 77 35 C 75 46 69 51 63 50 C 57 49 54 41 48 41 H 42 V 14 Z"
          fill="#F5A63B"
        />
        {/* Outer crisp comic outline */}
        <path
          d="M 16 14 H 68 C 75 14 79 22 77 35 C 75 46 69 51 63 50 C 57 49 54 41 48 41 H 36 C 30 41 27 49 21 50 C 15 51 9 46 7 35 C 5 22 9 14 16 14 Z"
          stroke="#1A2647"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Left White + D-Pad */}
        <rect x="20" y="21" width="5.5" height="15" rx="1.8" fill="#FFF8EB" stroke="#1A2647" strokeWidth="1.6" />
        <rect x="15.2" y="25.8" width="15" height="5.5" rx="1.8" fill="#FFF8EB" stroke="#1A2647" strokeWidth="1.6" />
        {/* Center Mini Pills */}
        <rect x="36" y="30" width="5" height="2.6" rx="1.3" fill="#1A2647" />
        <rect x="43" y="30" width="5" height="2.6" rx="1.3" fill="#1A2647" />
        {/* Right Arcade Action Buttons */}
        <circle cx="60" cy="22" r="3.3" fill="#FFF2A6" stroke="#1A2647" strokeWidth="1.6" />
        <circle cx="67" cy="27.5" r="3.3" fill="#FF6B35" stroke="#1A2647" strokeWidth="1.6" />
        <circle cx="60" cy="33" r="3.3" fill="#37B9FF" stroke="#1A2647" strokeWidth="1.6" />
        <circle cx="53.5" cy="27.5" r="3.3" fill="#7D5EC9" stroke="#1A2647" strokeWidth="1.6" />
      </g>
    </svg>
  );
}

/**
 * Pop-Art Curling Multicolor Wave + Radial Sunburst Fan (SVG <g> for VenueMap)
 */
export function PopWaveFlankG({
  x,
  y,
  scale = 1,
  flip = false,
}: {
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -scale : scale} ${scale})`}>
      {/* Radial Pleated Fan Disc behind wave */}
      <g opacity="0.92">
        <circle cx="38" cy="26" r="32" fill="#43B4F5" stroke="#1A2647" strokeWidth="2.2" />
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="38"
            y1="26"
            x2={38 + Math.cos((deg * Math.PI) / 180) * 31}
            y2={26 + Math.sin((deg * Math.PI) / 180) * 31}
            stroke="#1C62B8"
            strokeWidth="2"
          />
        ))}
      </g>

      {/* Outer Coral-Orange Wave Crest */}
      <path
        d="M -6 66 C 2 34 26 8 56 14 C 74 18 76 34 62 36 C 54 37 51 30 56 26 C 46 24 34 34 38 48 C 42 59 64 56 84 66 Z"
        fill="#FF7B33"
        stroke="#1A2647"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Mid Lavender-Purple Wave Curl */}
      <path
        d="M 4 66 C 12 40 30 22 52 27 C 64 30 64 42 54 43 C 47 44 45 38 49 35 C 42 34 35 42 39 52 C 44 60 60 58 76 66 Z"
        fill="#7C5EC4"
        stroke="#1A2647"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Inner Electric-Blue & Gold Foam Highlight */}
      <path
        d="M 16 66 C 24 46 38 36 52 40 C 59 42 58 50 50 51 C 45 51 44 47 47 45 C 40 45 38 54 46 60 C 52 63 62 62 68 66 Z"
        fill="#3AA8FF"
        stroke="#1A2647"
        strokeWidth="2"
      />
      <path
        d="M 24 22 Q 44 10 62 19"
        stroke="#FFD452"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Spray droplets */}
      <circle cx="71" cy="18" r="3.5" fill="#FFC93C" stroke="#1A2647" strokeWidth="1.5" />
      <circle cx="80" cy="28" r="2.5" fill="#FFF8EB" stroke="#1A2647" strokeWidth="1.3" />
    </g>
  );
}

/**
 * Compact Vector White Humanoid Robot for SVG VenueMap (<g>)
 */
export function MapRobotG({
  x,
  y,
  scale = 1,
  pose = 'stand',
}: {
  x: number;
  y: number;
  scale?: number;
  pose?: 'stand' | 'peek' | 'soccer';
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {pose === 'peek' ? (
        /* Leaning playfully over the top-right corner of the Entrance Archway */
        <g transform="rotate(16)">
          {/* Leaning white torso */}
          <rect x="-15" y="10" width="30" height="22" rx="9" fill="#FFFFFF" stroke="#1A2647" strokeWidth="2.5" />
          <rect x="-8" y="15" width="16" height="9" rx="4" fill="#1A2647" />
          <circle cx="-3" cy="19.5" r="2" fill="#37C8FF" />
          <rect x="1" y="18" width="5" height="3" rx="1.5" fill="#FFB830" />
          {/* Two little blue robot hands gripping the arch ledge */}
          <rect x="-22" y="20" width="9" height="10" rx="4" fill="#2B5CE6" stroke="#1A2647" strokeWidth="2" />
          <rect x="13" y="22" width="9" height="10" rx="4" fill="#2B5CE6" stroke="#1A2647" strokeWidth="2" />
          {/* Helmet */}
          <rect x="-19" y="-17" width="38" height="29" rx="14" fill="#FFFFFF" stroke="#1A2647" strokeWidth="2.6" />
          <rect x="-23" y="-7" width="5" height="10" rx="2.5" fill="#3B6BE8" stroke="#1A2647" strokeWidth="2" />
          <rect x="18" y="-7" width="5" height="10" rx="2.5" fill="#3B6BE8" stroke="#1A2647" strokeWidth="2" />
          <rect x="-13" y="-10" width="26" height="15" rx="7.5" fill="#131C36" />
          <rect x="-8.5" y="-5" width="6" height="4.5" rx="2.2" fill="#FFB830" />
          <rect x="2.5" y="-5" width="6" height="4.5" rx="2.2" fill="#FFB830" />
        </g>
      ) : (
        /* Full standing or soccer-kicking humanoid */
        <g>
          <ellipse cx="0" cy="34" rx="16" ry="3.8" fill="rgba(16,24,48,0.22)" />
          {/* Left arm */}
          <rect x="-24" y="-1" width="9" height="17" rx="4.5" fill="#F4F7FF" stroke="#1A2647" strokeWidth="2.2" transform="rotate(14 -19 4)" />
          {/* Right arm */}
          <rect x="15" y="-4" width="9" height="18" rx="4.5" fill="#F4F7FF" stroke="#1A2647" strokeWidth="2.2" transform="rotate(-24 19 4)" />
          {/* Legs */}
          <rect x="-11" y="16" width="9" height="14" rx="4" fill="#E8EFFE" stroke="#1A2647" strokeWidth="2.2" />
          <rect
            x="2"
            y="16"
            width="9"
            height="14"
            rx="4"
            fill="#E8EFFE"
            stroke="#1A2647"
            strokeWidth="2.2"
            transform={pose === 'soccer' ? 'rotate(-28 6 18)' : ''}
          />
          <rect x="-13" y="26" width="12" height="6.5" rx="3" fill="#2A54C8" stroke="#1A2647" strokeWidth="2" />
          <rect
            x="1"
            y="26"
            width="12"
            height="6.5"
            rx="3"
            fill="#2A54C8"
            stroke="#1A2647"
            strokeWidth="2"
            transform={pose === 'soccer' ? 'rotate(-28 6 18)' : ''}
          />
          {/* Torso */}
          <rect x="-15" y="-2" width="30" height="22" rx="8.5" fill="#FFFFFF" stroke="#1A2647" strokeWidth="2.4" />
          <rect x="-8.5" y="4" width="17" height="9" rx="4" fill="#1A2647" />
          <circle cx="-3.5" cy="8.5" r="2.2" fill="#37C8FF" />
          <rect x="1" y="7" width="5.5" height="3" rx="1.5" fill="#FFB830" />
          {/* Ear pods */}
          <rect x="-22" y="-19" width="5" height="10" rx="2.5" fill="#3B6BE8" stroke="#1A2647" strokeWidth="2" />
          <rect x="17" y="-19" width="5" height="10" rx="2.5" fill="#3B6BE8" stroke="#1A2647" strokeWidth="2" />
          {/* Helmet */}
          <rect x="-18" y="-29" width="36" height="28" rx="14" fill="#FFFFFF" stroke="#1A2647" strokeWidth="2.5" />
          <rect x="-13" y="-22" width="26" height="15" rx="7.5" fill="#131C36" />
          <rect x="-8.5" y="-17" width="6" height="4.5" rx="2.2" fill="#FFB830" />
          <rect x="2.5" y="-17" width="6" height="4.5" rx="2.2" fill="#FFB830" />
        </g>
      )}
    </g>
  );
}

/**
 * Stacked Carnival Gift Box Pyramid (extracted from Image 2 bottom-right -> LUCKY zone)
 */
export function GiftMountainG({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  const boxes = [
    // Bottom row
    { bx: -46, by: 16, w: 30, h: 24, fill: '#FF7847', rib: '#FFF2A6' },
    { bx: -16, by: 16, w: 32, h: 24, fill: '#F7C948', rib: '#FF5E7E' },
    { bx: 16, by: 16, w: 30, h: 24, fill: '#6C5CE7', rib: '#72E5FF' },
    // Middle row
    { bx: -34, by: -6, w: 32, h: 22, fill: '#4A89F3', rib: '#FFE36E' },
    { bx: -2, by: -6, w: 34, h: 22, fill: '#FF6B9D', rib: '#FFFFFF' },
    // Top gift box
    { bx: -16, by: -26, w: 30, h: 20, fill: '#22C7A9', rib: '#FFF3B0' },
  ];

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="0" cy="42" rx="48" ry="5" fill="rgba(26,38,71,0.16)" />
      {boxes.map((b, i) => (
        <g key={i}>
          <rect x={b.bx} y={b.by} width={b.w} height={b.h} rx="3" fill={b.fill} stroke="#1A2647" strokeWidth="2" />
          {/* Ribbon vertical & horizontal */}
          <rect x={b.bx + b.w / 2 - 2.5} y={b.by} width="5" height={b.h} fill={b.rib} />
          <rect x={b.bx} y={b.by + b.h / 2 - 2.2} width={b.w} height="4.4" fill={b.rib} />
          <rect x={b.bx} y={b.by} width={b.w} height={b.h} rx="3" fill="none" stroke="#1A2647" strokeWidth="2" />
          {/* Cute ribbon bow loop on top */}
          <ellipse cx={b.bx + b.w / 2 - 4} cy={b.by - 2} rx="4" ry="2.2" fill={b.rib} stroke="#1A2647" strokeWidth="1.3" />
          <ellipse cx={b.bx + b.w / 2 + 4} cy={b.by - 2} rx="4" ry="2.2" fill={b.rib} stroke="#1A2647" strokeWidth="1.3" />
        </g>
      ))}
    </g>
  );
}

/**
 * Mini Handheld Console Photo-Frame Standee (extracted from Image 2 bottom-left -> PHOTO zone)
 */
export function MiniConsoleStandeeG({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {/* Dual-tone handheld body (purple left, gold right) */}
      <rect x="-32" y="-38" width="64" height="76" rx="12" fill="#6C5BA0" stroke="#1A2647" strokeWidth="2.6" />
      <path d="M 0 -38 H 20 A 12 12 0 0 1 32 -26 V 26 A 12 12 0 0 1 20 38 H 0 Z" fill="#F5B841" />
      <rect x="-32" y="-38" width="64" height="76" rx="12" fill="none" stroke="#1A2647" strokeWidth="2.6" />
      {/* Mini LCD Screen Frame */}
      <rect x="-23" y="-29" width="46" height="36" rx="6" fill="#46A8FF" stroke="#1A2647" strokeWidth="2.2" />
      {/* Mini Robot posing inside photo frame */}
      <g transform="translate(0 -9) scale(0.46)">
        <rect x="-15" y="-2" width="30" height="22" rx="8" fill="#FFFFFF" stroke="#1A2647" strokeWidth="3" />
        <rect x="-18" y="-28" width="36" height="27" rx="13" fill="#FFFFFF" stroke="#1A2647" strokeWidth="3" />
        <rect x="-12" y="-21" width="24" height="14" rx="7" fill="#131C36" />
        <rect x="-8" y="-16" width="5.5" height="4" rx="2" fill="#FFB830" />
        <rect x="2.5" y="-16" width="5.5" height="4" rx="2" fill="#FFB830" />
      </g>
      {/* Mini D-pad on left & A/B buttons on right */}
      <circle cx="-15" cy="21" r="10" fill="#F5EFE4" stroke="#1A2647" strokeWidth="1.6" />
      <rect x="-17" y="15" width="4" height="12" rx="1" fill="#23488C" />
      <rect x="-21" y="19" width="12" height="4" rx="1" fill="#23488C" />
      <circle cx="10" cy="24" r="5" fill="#2DA8F0" stroke="#1A2647" strokeWidth="1.8" />
      <circle cx="21" cy="17" r="5" fill="#F05A2B" stroke="#1A2647" strokeWidth="1.8" />
    </g>
  );
}

/**
 * Stylized Minimalist Carnival Visitor Silhouette (from Image 1 & 2)
 */
export function MapVisitorG({
  x,
  y,
  shirt = '#3B6BE8',
  pants = '#1F2C52',
  balloon = false,
}: {
  x: number;
  y: number;
  shirt?: string;
  pants?: string;
  balloon?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {balloon && (
        <g className="map-balloon-bob">
          <path d="M 10 -2 Q 14 -14 11 -24" stroke="#1A2647" strokeWidth="1.1" fill="none" />
          <ellipse cx="11" cy="-29" rx="6.5" ry="8" fill="#FF6B35" stroke="#1A2647" strokeWidth="1.4" />
          <ellipse cx="9" cy="-32" rx="1.6" ry="2.5" fill="rgba(255,255,255,0.5)" />
        </g>
      )}
      <ellipse cx="0" cy="14" rx="7" ry="2.2" fill="rgba(26,38,71,0.16)" />
      {/* Legs */}
      <rect x="-4.5" y="4" width="3.6" height="10" rx="1.8" fill={pants} />
      <rect x="0.9" y="4" width="3.6" height="10" rx="1.8" fill={pants} />
      {/* Shirt/Jacket */}
      <rect x="-6.5" y="-8" width="13" height="14" rx="5.5" fill={shirt} stroke="#1A2647" strokeWidth="1.4" />
      {/* Head */}
      <circle cx="0" cy="-13.5" r="4.4" fill="#FFD9B8" stroke="#1A2647" strokeWidth="1.4" />
      <path d="M -4.2 -14.5 Q 0 -19 4.2 -14.5" fill="#1A2647" />
    </g>
  );
}
