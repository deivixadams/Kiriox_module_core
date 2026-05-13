import { memo } from 'react';
import { Network, Link2, Shield, FileText, Target, ArrowRight } from 'lucide-react';
import type { CardConfig, QuestionKey } from './types';
import { Pill } from './Pill';
import { trunc } from './colorHelpers';

// rule rendering-hoist-jsx: static icon nodes hoisted at module level
const CARD_ICONS: Record<QuestionKey, React.ReactNode> = {
  q1: <Network size={36} />,
  q2: <Link2   size={36} />,
  q3: <Shield  size={36} />,
  q4: <FileText size={36} />,
  q5: <Target  size={36} />,
};

// rule rerender-memo-with-default-value: stable NOOP for optional callback
const NOOP = () => {};

type Props = {
  card: CardConfig;
  index: number;
  isActive: boolean;
  onDetailToggle?: (key: QuestionKey) => void;
  question: string;
};

export const QuestionCard = memo(function QuestionCard({ card, index, isActive: _isActive, onDetailToggle = NOOP, question }: Props) {
  const { key, accent, accentBg, category, entityName, badges, metricLabel, metricValue, metricUnit } = card;

  return (
    <div style={{
      flex: '1 1 0', minWidth: 200, maxWidth: 290,
      background: 'linear-gradient(145deg,rgba(13,18,50,0.97) 0%,rgba(8,12,36,0.97) 100%)',
      border: `1px solid ${accent}2e`,
      borderRadius: 16,
      padding: '1.05rem 0.85rem 0.85rem',
      display: 'flex', flexDirection: 'column', gap: '0.55rem',
    }}>
      {/* Number + question */}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: accentBg, border: `2px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontSize: '0.72rem', fontWeight: 900, flexShrink: 0 }}>
          {index + 1}
        </div>
        <div style={{ color: '#94a3b8', fontSize: '0.67rem', lineHeight: 1.33, fontWeight: 500 }}>{question}</div>
      </div>

      {/* Icon — hoisted static node */}
      <div style={{ display: 'flex', justifyContent: 'center', color: accent, opacity: 0.78, margin: '0.1rem 0' }}>
        {CARD_ICONS[key]}
      </div>

      {/* Category */}
      <div style={{ color: accent, fontSize: '0.59rem', fontWeight: 800, letterSpacing: '0.08em', textAlign: 'center' }}>
        {category}
      </div>

      {/* Entity name */}
      <div style={{ color: '#f1f5f9', fontSize: '0.83rem', fontWeight: 400, textAlign: 'center', lineHeight: 1.3, minHeight: '2.1rem' }}>
        {trunc(entityName, 42)}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
        {badges.map((b, i) => <Pill key={i} {...b} />)}
      </div>

      {/* Metric */}
      <div style={{ textAlign: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: `1px solid ${accent}12` }}>
        <div style={{ color: '#64748b', fontSize: '0.6rem', marginBottom: '0.12rem' }}>{metricLabel}</div>
        <div style={{ color: '#f1f5f9', fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 }}>{metricValue}</div>
        {metricUnit ? <div style={{ color: '#64748b', fontSize: '0.6rem', marginTop: '0.12rem' }}>{metricUnit}</div> : null}
      </div>

      {/* Ver detalle */}
      <button
        type="button"
        onClick={() => onDetailToggle(key)}
        style={{ width: '100%', borderRadius: 8, border: `1px solid ${accent}38`, background: accentBg, color: accent, padding: '0.38rem', fontSize: '0.66rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.28rem' }}
      >
        Ver detalle <ArrowRight size={11} />
      </button>
    </div>
  );
});

