'use client';

import { Save, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  count: number;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}

export function SaveChangesBar({ count, saving, saved, onSave }: Props) {
  if (count === 0 && !saved) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
      {saved && count === 0 && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.76rem', color: '#16a34a' }}>
          <CheckCircle size={13} /> Guardado
        </span>
      )}
      {count > 0 && (
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: saving ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.18)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: 8,
            padding: '5px 12px',
            fontSize: '0.76rem',
            fontWeight: 600,
            color: '#a5b4fc',
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'all 0.15s',
          }}
        >
          {saving
            ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Guardando…</>
            : <><Save size={13} /> Guardar cambios ({count})</>
          }
        </button>
      )}
    </div>
  );
}
