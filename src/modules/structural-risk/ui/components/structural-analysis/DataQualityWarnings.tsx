import { memo } from 'react';

type Props = {
  missingData: string[];
  blockedConclusions: string[];
};

// rule rerender-memo-with-default-value: hoist default non-primitive props
const EMPTY: string[] = [];

export const DataQualityWarnings = memo(function DataQualityWarnings({ missingData = EMPTY, blockedConclusions = EMPTY }: Props) {
  if (missingData.length === 0 && blockedConclusions.length === 0) return null;

  return (
    <div style={{ marginTop: '0.8rem', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 12, padding: '0.8rem 1rem' }}>
      <div style={{ color: '#fcd34d', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.4rem' }}>
        Advertencias de calidad de datos
      </div>
      {missingData.map((m, i) => (
        <div key={i} style={{ color: '#94a3b8', fontSize: '0.65rem', marginBottom: '0.2rem' }}>• {m}</div>
      ))}
      {blockedConclusions.map((b, i) => (
        <div key={i} style={{ color: '#f87171', fontSize: '0.65rem', marginBottom: '0.2rem' }}>⚠ {b}</div>
      ))}
    </div>
  );
});
