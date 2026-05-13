import { memo } from 'react';
import { ExternalLink } from 'lucide-react';
import type { CardConfig, QuestionKey } from './types';
import { Pill } from './Pill';
import { QUESTIONS, QUESTION_KEYS, CRIT_LEGEND } from './cardConfigs';
import { trunc } from './colorHelpers';

type Props = {
  cards: CardConfig[];
  activeDetail: QuestionKey | null;
  onDetailToggle?: (key: QuestionKey) => void;
};

// rule rerender-memo-with-default-value: stable NOOP
const NOOP = () => {};

// rule rendering-hoist-jsx: table header cells are static
const TABLE_HEADERS = ['#', 'Pregunta', 'Nodo identificado', 'Tipo', 'Criticidad', 'Impacto', 'Principales efectos', ''];
const TH_STYLE: React.CSSProperties = {
  borderBottom: '1px solid rgba(96,165,250,0.1)',
  padding: '0.4rem 0.55rem',
  textAlign: 'left',
  color: '#475569',
  fontWeight: 700,
  fontSize: '0.6rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  whiteSpace: 'nowrap',
};

export const SummaryTable = memo(function SummaryTable({ cards, activeDetail: _, onDetailToggle = NOOP }: Props) {
  return (
    <div style={{ background: 'rgba(13,18,50,0.95)', border: '1px solid rgba(96,165,250,0.13)', borderRadius: 16, padding: '1rem 1.15rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <div style={{ color: '#f1f5f9', fontSize: '0.83rem', fontWeight: 800 }}>Resumen de detalles clave</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {CRIT_LEGEND.map((l) => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color }} />
              <span style={{ color: '#64748b', fontSize: '0.6rem' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', color: '#cbd5e1' }}>
          <thead>
            <tr>{TABLE_HEADERS.map((h) => <th key={h} style={TH_STYLE}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {cards.map((card, i) => (
              <tr key={card.key} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '0.48rem 0.55rem' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: card.accentBg, border: `2px solid ${card.accent}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.accent, fontSize: '0.62rem', fontWeight: 900 }}>
                    {i + 1}
                  </div>
                </td>
                <td style={{ padding: '0.48rem 0.55rem', color: '#94a3b8', fontSize: '0.66rem', maxWidth: 170 }}>
                  {QUESTIONS[QUESTION_KEYS[i]]}
                </td>
                <td style={{ padding: '0.48rem 0.55rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem', flexWrap: 'wrap' }}>
                    <span style={{ color: '#e2e8f0', fontWeight: 700 }}>{trunc(card.entityName, 30)}</span>
                    <span style={{ background: card.accentBg, border: `1px solid ${card.accent}40`, borderRadius: 4, padding: '0.04rem 0.32rem', color: card.accent, fontSize: '0.56rem', fontWeight: 800 }}>
                      {card.tipo}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '0.48rem 0.55rem', color: '#64748b', fontSize: '0.66rem' }}>{card.tipo}</td>
                <td style={{ padding: '0.48rem 0.55rem' }}>
                  {card.critInfo ? <Pill {...card.critInfo} /> : <span style={{ color: '#334155' }}>—</span>}
                </td>
                <td style={{ padding: '0.48rem 0.55rem', color: '#94a3b8', whiteSpace: 'nowrap', fontWeight: 700 }}>{card.impacto}</td>
                <td style={{ padding: '0.48rem 0.55rem', color: '#64748b', fontSize: '0.64rem', maxWidth: 230 }}>{card.efectos}</td>
                <td style={{ padding: '0.48rem 0.55rem' }}>
                  <button
                    type="button"
                    onClick={() => onDetailToggle(card.key)}
                    style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: '0.15rem' }}
                  >
                    <ExternalLink size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem', color: '#1e293b', fontSize: '0.62rem' }}>
        Los análisis estructurales se basan en interdependencias, criticidad, cascadas y evidencia real.
      </div>
    </div>
  );
});

