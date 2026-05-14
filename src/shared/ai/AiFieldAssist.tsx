'use client';

import React, { useState, useCallback } from 'react';
import type { AiFieldContract, AiResult } from './AiFieldContract';
import { runKirioxAi } from './runKirioxAi';
import { isChromAiAvailable } from './aiUtils';

interface AiFieldAssistProps {
  contract: AiFieldContract;
  currentValue: string;
  onAccept: (value: string, trace: AiResult['trace']) => void;
  className?: string;
  disabled?: boolean;
}

type AiStatus = 'idle' | 'loading' | 'done' | 'error';

const S = {
  btn: (variant: 'primary' | 'cancel' | 'redo' | 'disabled'): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 8, fontSize: '0.75rem',
      fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
      letterSpacing: '0.02em', transition: 'opacity 0.15s', border: 'none',
    };
    if (variant === 'primary') return { ...base, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' };
    if (variant === 'cancel')  return { ...base, background: 'rgba(239,68,68,0.08)',   border: '1px solid rgba(239,68,68,0.25)',   color: '#f87171' };
    if (variant === 'redo')    return { ...base, background: 'rgba(139,92,246,0.08)',   border: '1px solid rgba(139,92,246,0.2)',   color: 'rgba(167,139,250,0.7)' };
    return { ...base, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)', cursor: 'not-allowed' };
  },
  spinner: (): React.CSSProperties => ({
    width: 10, height: 10,
    border: '1.5px solid rgba(167,139,250,0.25)',
    borderTopColor: '#a78bfa',
    borderRadius: '50%',
    animation: 'kiriox-ai-spin 0.7s linear infinite',
    display: 'inline-block', flexShrink: 0,
  }),
  statusText: (): React.CSSProperties => ({
    fontSize: '0.75rem', color: 'rgba(167,139,250,0.65)', fontStyle: 'italic',
  }),
  errorText: (): React.CSSProperties => ({
    marginTop: 5, fontSize: '0.74rem', color: '#f87171', lineHeight: 1.4,
  }),
  traceLine: (): React.CSSProperties => ({
    marginTop: 4, fontSize: '0.68rem',
    color: 'rgba(255,255,255,0.22)', letterSpacing: '0.01em',
  }),
} as const;

export function AiFieldAssist({
  contract,
  currentValue,
  onAccept,
  className,
  disabled = false,
}: AiFieldAssistProps) {
  const [status, setStatus] = useState<AiStatus>('idle');
  const [lastTrace, setLastTrace] = useState<AiResult['trace'] | null>(null);
  const [error, setError] = useState<string>('');

  const available = isChromAiAvailable();
  const isLoading = status === 'loading';

  const handleRun = useCallback(async () => {
    if (!available) {
      setError('Chrome AI no disponible. Requiere Chrome 127+ con Gemini Nano.');
      return;
    }
    const input = currentValue.trim();
    if (!input) {
      setError('Escribe el nombre del objetivo primero.');
      return;
    }

    setError('');
    setStatus('loading');

    try {
      const result = await runKirioxAi({ ...contract, input });
      setLastTrace(result.trace);
      setStatus('done');
      onAccept(result.value, result.trace);
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    }
  }, [available, contract, currentValue, onAccept]);

  const handleRedo = useCallback(() => {
    setStatus('idle');
    setLastTrace(null);
    setError('');
    handleRun();
  }, [handleRun]);

  return (
    <>
      <style>{`@keyframes kiriox-ai-spin { to { transform: rotate(360deg); } }`}</style>
      <div className={className} data-ai-assist data-field={contract.field} data-module={contract.module}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {isLoading ? (
            <>
              <span style={S.spinner()} aria-hidden />
              <span style={S.statusText()} aria-live="polite">Generando…</span>
            </>
          ) : status === 'done' ? (
            <button type="button" onClick={handleRedo} style={S.btn('redo')} title="Regenerar descripción">
              ↺ Regenerar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRun}
              disabled={disabled || !available}
              title={!available ? 'Chrome AI no disponible' : 'Autocompletar descripción con IA local'}
              style={S.btn(disabled || !available ? 'disabled' : 'primary')}
            >
              ✦ {status === 'error' ? 'Reintentar' : 'Autocompletar'}
            </button>
          )}

          {lastTrace && status === 'done' && (
            <span style={S.traceLine()}>
              {lastTrace.model} · {new Date(lastTrace.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>

        {error && (
          <p role="alert" style={S.errorText()}>{error}</p>
        )}
      </div>
    </>
  );
}
