const CX = 100;
const CY = 96;
const R = 76;
const STROKE = 14;

const BAND_COLORS = ['#1f9d8f', '#e9b23f', '#ee8f37', '#d95a33'];
/** Light, moderate, busy, packed — as fractions of the sweep. */
const BOUNDARIES = [0, 0.4, 0.55, 0.78, 1];

const point = (fraction: number, radius = R) => {
  const angle = Math.PI * (1 - fraction);
  return [CX + radius * Math.cos(angle), CY - radius * Math.sin(angle)] as const;
};

const arcPath = (from: number, to: number) => {
  const start = point(from);
  const end = point(to);
  return `M ${start[0].toFixed(2)} ${start[1].toFixed(2)} A ${R} ${R} 0 0 1 ${end[0].toFixed(2)} ${end[1].toFixed(2)}`;
};

/**
 * Four bands drawn edge to edge with butt caps, so each colour change is a clean
 * radial line instead of two round caps blending into a muddy seam. The outer ends
 * are rounded with circles in the matching band colour.
 */
const BANDS = BAND_COLORS.map((color, index) => ({
  color,
  d: arcPath(BOUNDARIES[index], Math.min(1, BOUNDARIES[index + 1] + 0.0015)),
}));

export function Gauge({ percent }: { percent: number }) {
  const fraction = Math.max(0, Math.min(100, percent)) / 100;
  const needleX = CX + 54 * Math.cos(Math.PI * (1 - fraction));
  const needleY = CY - 54 * Math.sin(Math.PI * (1 - fraction));
  const leftCap = point(0);
  const rightCap = point(1);

  return (
    <svg viewBox="0 0 200 104" className="gauge" role="img" aria-label={`${percent} percent occupied`}>
      <line
        x1="22"
        y1={CY}
        x2="178"
        y2={CY}
        stroke="#d8d4cd"
        strokeWidth="2.4"
        strokeDasharray="0.5 6.5"
        strokeLinecap="round"
      />

      {BANDS.map((band) => (
        <path
          key={band.color}
          d={band.d}
          stroke={band.color}
          strokeWidth={STROKE}
          strokeLinecap="butt"
          fill="none"
        />
      ))}

      <circle cx={leftCap[0]} cy={leftCap[1]} r={STROKE / 2} fill={BAND_COLORS[0]} />
      <circle cx={rightCap[0]} cy={rightCap[1]} r={STROKE / 2} fill={BAND_COLORS[3]} />

      <line x1={CX} y1={CY} x2={needleX} y2={needleY} stroke="#26242c" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx={CX} cy={CY} r="4.2" fill="#26242c" />
    </svg>
  );
}
