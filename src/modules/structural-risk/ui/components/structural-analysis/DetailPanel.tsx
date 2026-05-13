import { memo } from 'react';

type Props = {
  rows: Record<string, unknown>[];
  question: string;
  onClose: () => void;
};

function renderVal(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'object') {
    if (Array.isArray(v)) return (v as unknown[]).map(String).join(', ');
    return Object.entries(v as Record<string, unknown>)
      .map(([k, val]) => `${k}: ${String(val ?? '')}`)
      .join(' · ');
  }
  return typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(4)) : String(v);
}

export const DetailPanel = memo(function DetailPanel({ rows, question, onClose }: Props) {
  const cols = rows[0] ? Object.keys(rows[0]) : [];

  return (
    <div style={{ background: 'rgba(10,15,42,0.97)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: 14, padding: '1rem 1.2rem', marginBottom: '1.1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.7rem' }}>
        <div style={{ color: '#60a5fa', fontSize: '0.73rem', fontWeight: 800 }}>Top resultados — {question}</div>
        <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem', color: '#cbd5e1' }}>
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c} style={{ borderBottom: '1px solid rgba(96,165,250,0.12)', padding: '0.35rem 0.55rem', textAlign: 'left', color: '#475569', fontWeight: 700, fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {cols.map((c) => (
                  <td key={c} style={{ padding: '0.38rem 0.55rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {renderVal(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
