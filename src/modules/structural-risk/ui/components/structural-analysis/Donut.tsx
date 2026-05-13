import { memo } from 'react';

type DonutProps = { pct: number; color: string };

// rule rendering-hoist-jsx: static track circle hoisted
const TRACK = <circle cx="45" cy="45" r={34} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />;

export const Donut = memo(function Donut({ pct, color }: DonutProps) {
  const circ = 2 * Math.PI * 34;
  const qualLabel = pct >= 80 ? 'Alta' : pct >= 60 ? 'Media' : 'Baja';

  return (
    <svg width="88" height="88" viewBox="0 0 90 90">
      {TRACK}
      <circle
        cx="45" cy="45" r={34} fill="none"
        stroke={color} strokeWidth="9"
        strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        transform="rotate(-90 45 45)"
        strokeLinecap="round"
      />
      <text x="45" y="41" textAnchor="middle" fill="white" fontSize="15" fontWeight="800">{pct}%</text>
      <text x="45" y="57" textAnchor="middle" fill={color} fontSize="9" fontWeight="700">{qualLabel}</text>
    </svg>
  );
});
