type Props = {
  values: [number, number, number, number, number];
  labels: string[];
};

const W = 240;
const H = 136;
const TOP = 10;
const BOTTOM = 124;
const LEFT = 10;
const RIGHT = 230;

const yOf = (value: number) => BOTTOM - (Math.max(0, Math.min(100, value)) / 100) * (BOTTOM - TOP);
const xOf = (index: number) => LEFT + (index * (RIGHT - LEFT)) / 4;

const smoothPath = (points: [number, number][]) => {
  if (points.length < 2) return '';
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const t = 0.18;
    const c1x = p1[0] + (p2[0] - p0[0]) * t;
    const c1y = p1[1] + (p2[1] - p0[1]) * t;
    const c2x = p2[0] - (p3[0] - p1[0]) * t;
    const c2y = p2[1] - (p3[1] - p1[1]) * t;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
};

const Y_ROWS = [
  { pct: '100%', label: 'Packed', top: 6.5 },
  { pct: '75%', label: 'Busy', top: 31.5 },
  { pct: '50%', label: 'Moderate', top: 56.5 },
  { pct: '25%', label: 'Light', top: 81.5 },
  { pct: '0%', label: 'Empty', top: 94 },
];

export function ForecastChart({ values, labels }: Props) {
  const points = values.map((value, index) => [xOf(index), yOf(value)] as [number, number]);
  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1][0]} ${BOTTOM} L ${points[0][0]} ${BOTTOM} Z`;
  const peakIndex = values.indexOf(Math.max(...values));
  const peak = points[peakIndex];

  return (
    <div className="chart">
      <div className="chart-y">
        {Y_ROWS.map((row) => (
          <div key={row.pct} className="chart-y-row" style={{ top: `${row.top}%` }}>
            <b>{row.pct}</b>
            <span>{row.label}</span>
          </div>
        ))}
      </div>
      <div className="chart-main">
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" aria-label="Crowd forecast for today">
          <defs>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e8792f" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#e8792f" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[TOP, 38, 66, 94, BOTTOM].map((y) => (
            <line
              key={y}
              x1={LEFT}
              y1={y}
              x2={RIGHT}
              y2={y}
              stroke="#f0ece5"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}
          <path d={area} fill="url(#forecastFill)" />
          <path
            d={line}
            fill="none"
            stroke="#e8792f"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeDasharray="0.5 6"
          />
          <circle cx={peak[0]} cy={peak[1]} r="4.6" fill="#fff" stroke="#e8792f" strokeWidth="2.6" />
          <text
            x={Math.min(peak[0] + 9, RIGHT - 18)}
            y={Math.max(peak[1] - 7, 12)}
            fontSize="11"
            fontWeight="700"
            fill="#c4561b"
            fontFamily="inherit"
          >
            {values[peakIndex]}%
          </text>
        </svg>
        <div className="chart-x">
          {labels.map((label, index) => (
            <span
              key={label}
              style={{ left: `${((xOf(index) / W) * 100).toFixed(2)}%` }}
              className={index === 0 ? 'is-now' : undefined}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
