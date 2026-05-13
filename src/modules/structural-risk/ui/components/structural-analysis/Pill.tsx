import { memo } from 'react';
import type { BadgeConfig } from './types';

export const Pill = memo(function Pill({ label, color, bg }: BadgeConfig) {
  return (
    <span style={{
      background: bg,
      border: `1px solid ${color}50`,
      borderRadius: 5,
      padding: '0.09rem 0.5rem',
      color,
      fontSize: '0.62rem',
      fontWeight: 800,
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
});
