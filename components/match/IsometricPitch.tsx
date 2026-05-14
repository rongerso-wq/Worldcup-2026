"use client";

import type { Team } from "@/lib/teams";

// 4-3-3 formation positions in normalized pitch coordinates (0..1, half-pitch).
// y=0 = own goal-line, y=1 = halfway line.
const F_433: [number, number][] = [
  [0.5,  0.05], // GK
  [0.15, 0.25], [0.38, 0.25], [0.62, 0.25], [0.85, 0.25],   // back 4
  [0.30, 0.55], [0.50, 0.55], [0.70, 0.55],                 // mid 3
  [0.20, 0.85], [0.50, 0.92], [0.80, 0.85],                 // front 3
];

const FORMATIONS: Record<string, [number, number][]> = {
  "4-3-3": F_433,
};

const W = 400;
const H = 520; // 4:5-ish, two halves stacked
const PAD = 18;

export default function IsometricPitch({
  home,
  away,
  formationHome = "4-3-3",
  formationAway = "4-3-3",
}: {
  home: Team;
  away: Team;
  formationHome?: string;
  formationAway?: string;
}) {
  const fH = FORMATIONS[formationHome] ?? F_433;
  const fA = FORMATIONS[formationAway] ?? F_433;

  // Pitch box (inside padding)
  const px = PAD;
  const py = PAD;
  const pw = W - PAD * 2;
  const ph = H - PAD * 2;
  const halfY = py + ph / 2;

  // Map normalized formation point to pitch coords for HOME (bottom half).
  // Home attacks UP, so y=0 = home goal-line at the very bottom.
  const homePt = (nx: number, ny: number) => ({
    cx: px + nx * pw,
    cy: py + ph - (ny * (ph / 2)),
  });
  // Away attacks DOWN, so y=0 = away goal-line at the very top, mirror.
  const awayPt = (nx: number, ny: number) => ({
    cx: px + (1 - nx) * pw,
    cy: py + ny * (ph / 2),
  });

  return (
    <div
      className="card-dim relative overflow-hidden"
      style={{ aspectRatio: `${W}/${H}`, padding: 0 }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="pitch-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--pitch-2)" />
            <stop offset="0.5" stopColor="var(--pitch-1)" />
            <stop offset="1" stopColor="var(--pitch-2)" />
          </linearGradient>
          {/* iso tilt — just a subtle vertical squash with a tiny skew via transform on the group */}
          <radialGradient id="floodlight" cx="50%" cy="50%" r="60%">
            <stop offset="0" stopColor="white" stopOpacity="0.06" />
            <stop offset="1" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* pitch fill */}
        <rect x={px} y={py} width={pw} height={ph} rx="14" fill="url(#pitch-grad)" />
        <rect x={px} y={py} width={pw} height={ph} rx="14" fill="url(#floodlight)" />

        {/* mowed-grass bands */}
        {Array.from({ length: 8 }).map((_, i) => (
          <rect
            key={i}
            x={px}
            y={py + (i * ph) / 8}
            width={pw}
            height={ph / 8}
            fill={i % 2 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.03)"}
          />
        ))}

        {/* lines */}
        <g
          fill="none"
          stroke="var(--pitch-line)"
          strokeOpacity="0.7"
          strokeWidth="1.4"
        >
          {/* outline */}
          <rect x={px} y={py} width={pw} height={ph} rx="14" />
          {/* halfway */}
          <line x1={px} y1={halfY} x2={px + pw} y2={halfY} />
          {/* centre circle */}
          <circle cx={px + pw / 2} cy={halfY} r="46" />
          <circle cx={px + pw / 2} cy={halfY} r="2.5" fill="var(--pitch-line)" />
          {/* home (bottom) box */}
          <rect x={px + pw * 0.18} y={py + ph - 80} width={pw * 0.64} height="80" />
          <rect x={px + pw * 0.34} y={py + ph - 30} width={pw * 0.32} height="30" />
          <circle cx={px + pw / 2} cy={py + ph - 52} r="2.5" fill="var(--pitch-line)" />
          {/* away (top) box */}
          <rect x={px + pw * 0.18} y={py} width={pw * 0.64} height="80" />
          <rect x={px + pw * 0.34} y={py} width={pw * 0.32} height="30" />
          <circle cx={px + pw / 2} cy={py + 52} r="2.5" fill="var(--pitch-line)" />
        </g>

        {/* players */}
        {fH.map(([nx, ny], i) => {
          const { cx, cy } = homePt(nx, ny);
          return <PlayerDot key={`h-${i}`} cx={cx} cy={cy} color={home.primary} ink={home.ink} label={i === 0 ? "GK" : String(i)} />;
        })}
        {fA.map(([nx, ny], i) => {
          const { cx, cy } = awayPt(nx, ny);
          return <PlayerDot key={`a-${i}`} cx={cx} cy={cy} color={away.primary} ink={away.ink} label={i === 0 ? "GK" : String(i)} />;
        })}

        {/* team labels on goal-line */}
        <text
          x={px + pw / 2}
          y={py + 14}
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="12"
          letterSpacing="0.22em"
          fill={away.primary}
          opacity="0.75"
        >
          {away.code}
        </text>
        <text
          x={px + pw / 2}
          y={py + ph - 6}
          textAnchor="middle"
          fontFamily="var(--font-display)"
          fontSize="12"
          letterSpacing="0.22em"
          fill={home.primary}
          opacity="0.75"
        >
          {home.code}
        </text>
      </svg>
    </div>
  );
}

function PlayerDot({
  cx,
  cy,
  color,
  ink,
  label,
}: {
  cx: number;
  cy: number;
  color: string;
  ink: string;
  label: string;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy + 1.5} r="9" fill="black" opacity="0.4" />
      <circle
        cx={cx}
        cy={cy}
        r="10"
        fill={color}
        stroke={`color-mix(in oklab, white 30%, ${color})`}
        strokeWidth="1.2"
      />
      <text
        x={cx}
        y={cy + 3}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="8"
        letterSpacing="0.12em"
        fill={ink}
      >
        {label}
      </text>
    </g>
  );
}
