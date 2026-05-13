import { memo } from 'react';
import { Donut } from './Donut';
import { fmtN } from './colorHelpers';

type Props = {
  nodesCount: number;
  edgesCount: number;
  activitiesCount: number;
  risksCount: number;
  controlsCount: number;
  evidencesCount: number;
  resourcesCount: number;
  confidencePct: number;
};


const TILE_STYLE: React.CSSProperties = {
  background: 'rgba(13,18,50,0.92)',
  border: '1px solid rgba(96,165,250,0.13)',
  borderRadius: 12,
  padding: '0.6rem 0.85rem',
  flex: '1 1 80px',
  minWidth: 68,
};

const LABEL_STYLE: React.CSSProperties = {
  color: '#64748b',
  fontSize: '0.58rem',
  fontWeight: 700,
  marginBottom: '0.2rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const VALUE_STYLE: React.CSSProperties = {
  color: '#f1f5f9',
  fontSize: '1.25rem',
  fontWeight: 900,
  lineHeight: 1,
};

export const MetricsRow = memo(function MetricsRow({ nodesCount, edgesCount, activitiesCount, risksCount, controlsCount, evidencesCount, resourcesCount, confidencePct }: Props) {
  const donutColor = confidencePct >= 80 ? '#10b981' : confidencePct >= 60 ? '#f59e0b' : '#f87171';

  return (
    <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'stretch', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
      <div style={TILE_STYLE}>
        <div style={LABEL_STYLE}>Nodos analizados</div>
        <div style={VALUE_STYLE}>{fmtN(nodesCount)}</div>
        <div style={{ color: '#334155', fontSize: '0.54rem', marginTop: '0.28rem', lineHeight: 1.3 }}>
          Actividades, Riesgos,{'\n'}Controles, Evidencias y Recursos
        </div>
      </div>

      {([
        { label: 'Actividades', value: activitiesCount },
        { label: 'Riesgos',     value: risksCount      },
        { label: 'Controles',   value: controlsCount   },
        { label: 'Evidencias',  value: evidencesCount  },
      ] as const).map((t) => (
        <div key={t.label} style={TILE_STYLE}>
          <div style={LABEL_STYLE}>{t.label}</div>
          <div style={VALUE_STYLE}>{fmtN(t.value)}</div>
        </div>
      ))}

      <div style={TILE_STYLE}>
        <div style={LABEL_STYLE}>Dependencias</div>
        <div style={VALUE_STYLE}>{fmtN(edgesCount)}</div>
      </div>

      <div style={TILE_STYLE}>
        <div style={LABEL_STYLE}>Recursos</div>
        <div style={VALUE_STYLE}>{fmtN(resourcesCount)}</div>
      </div>

      {/* Donut tile */}
      <div style={{ background: 'rgba(13,18,50,0.92)', border: '1px solid rgba(96,165,250,0.13)', borderRadius: 12, padding: '0.5rem 0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
        <div style={LABEL_STYLE}>Salud del análisis</div>
        <Donut pct={confidencePct} color={donutColor} />
        <div style={{ color: '#334155', fontSize: '0.54rem', marginTop: '0.15rem' }}>Calidad de datos</div>
      </div>
    </div>
  );
});
