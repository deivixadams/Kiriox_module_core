import { memo } from 'react';
import { Download } from 'lucide-react';

type Props = {
  runCode: string;
  isComplete: boolean;
  onClose: () => void;
};

export const AnalysisHeader = memo(function AnalysisHeader({ runCode, isComplete, onClose }: Props) {
  const completeColor  = isComplete ? '#6ee7b7' : '#fcd34d';
  const completeBg     = isComplete ? 'rgba(16,185,129,0.18)' : 'rgba(251,191,36,0.15)';
  const completeBorder = isComplete ? 'rgba(16,185,129,0.4)'  : 'rgba(251,191,36,0.35)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.1rem' }}>
      <div style={{ color: '#f1f5f9', fontSize: '1.12rem', fontWeight: 800 }}>Resumen Ejecutivo Estructural</div>

      <div style={{ display: 'flex', gap: '0.55rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(8,20,54,0.9)', border: '1px solid rgba(96,165,250,0.22)', borderRadius: 9, padding: '0.33rem 0.7rem' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>Run de Análisis</span>
          <span style={{ color: '#60a5fa', fontSize: '0.72rem', fontWeight: 800 }}>{runCode}</span>
          <span style={{ background: completeBg, border: `1px solid ${completeBorder}`, borderRadius: 5, padding: '0.04rem 0.4rem', color: completeColor, fontSize: '0.6rem', fontWeight: 800 }}>
            {isComplete ? 'Completo' : 'Incompleto'}
          </span>
        </div>

        <button type="button" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: 9, border: '1px solid rgba(96,165,250,0.38)', background: 'linear-gradient(135deg,rgba(30,64,175,0.28),rgba(37,99,235,0.2))', color: '#bfdbfe', padding: '0.36rem 0.85rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
          <Download size={13} /> Exportar
        </button>

        <button type="button" onClick={onClose} style={{ borderRadius: 9, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(127,29,29,0.2)', color: '#fca5a5', padding: '0.36rem 0.85rem', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}>
          Cerrar
        </button>
      </div>
    </div>
  );
});
