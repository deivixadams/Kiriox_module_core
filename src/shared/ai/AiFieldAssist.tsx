'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { AiFieldContract, AiResult } from './AiFieldContract';
import { runKirioxAiStreaming } from './runKirioxAi';
import { isChromAiAvailable, warmupKirioxAi } from './aiUtils';

interface AiFieldAssistProps {
  contract: AiFieldContract;
  currentValue: string;
  onAccept: (value: string, trace: AiResult['trace']) => void;
  className?: string;
  disabled?: boolean;
}

type AiStatus = 'idle' | 'streaming' | 'done' | 'error';

const S = {
  btn: (variant: 'primary' | 'redo' | 'disabled'): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 10px', borderRadius: 8, fontSize: '0.75rem',
      fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' as const,
      letterSpacing: '0.02em', transition: 'opacity 0.15s', border: 'none',
    };
    if (variant === 'primary')  return { ...base, background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)',   color: '#a78bfa' };
    if (variant === 'redo')     return { ...base, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',   color: 'rgba(167,139,250,0.7)' };
    return { ...base, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.25)', cursor: 'not-allowed' };
  },
  spinner: (): React.CSSProperties => ({
    width: 10, height: 10,
    border: '1.5px solid rgba(167,139,250,0.25)',
    borderTopColor: '#a78bfa', borderRadius: '50%',
    animation: 'kiriox-ai-spin 0.7s linear infinite',
    display: 'inline-block', flexShrink: 0,
  }),
  statusText: (): React.CSSProperties => ({
    fontSize: '0.73rem', color: 'rgba(167,139,250,0.6)', fontStyle: 'italic',
  }),
  errorText: (): React.CSSProperties => ({
    marginTop: 5, fontSize: '0.73rem', color: '#f87171', lineHeight: 1.4,
  }),
  traceLine: (): React.CSSProperties => ({
    marginTop: 3, fontSize: '0.67rem',
    color: 'rgba(255,255,255,0.2)', letterSpacing: '0.01em',
  }),
} as const;

export function AiFieldAssist({
  contract,
  currentValue,
  onAccept,
  className,
  disabled = false,
}: AiFieldAssistProps) {
  const [status, setStatus]     = useState<AiStatus>('idle');
  const [lastTrace, setTrace]   = useState<AiResult['trace'] | null>(null);
  const [error, setError]       = useState<string>('');
  const abortRef                = useRef<AbortController | null>(null);
  const available               = isChromAiAvailable();

  // Warmup the session for this module as soon as the component mounts
  useEffect(() => {
    if (available) warmupKirioxAi(contract.module).catch(() => {});
  }, [available, contract.module]);

  const handleRun = useCallback(async () => {
    if (!available) { setError('Chrome AI no disponible. Requiere Chrome 127+ con Gemini Nano.'); return; }
    const input = currentValue.trim();
    if (!input) { setError('Escribe el nombre del objetivo primero.'); return; }

    setError('');
    setStatus('streaming');
    abortRef.current = new AbortController();

    try {
      const result = await runKirioxAiStreaming(
        { ...contract, input },
        // Live-update the field on every chunk — user sees text appear in real time
        (chunk) => onAccept(chunk, {
          module: contract.module, field: contract.field, intent: contract.intent,
          model: 'chrome-built-in-ai', local: true, timestamp: new Date().toISOString(),
        }),
        abortRef.current.signal,
      );
      // Final clean value
      onAccept(result.value, result.trace);
      setTrace(result.trace);
      setStatus('done');
    } catch (err) {
      if ((err as Error).name === 'AbortError') { setStatus('idle'); return; }
      setError((err as Error).message);
      setStatus('error');
    }
  }, [available, contract, currentValue, onAccept]);

  const handleRedo = useCallback(() => {
    setTrace(null);
    setError('');
    handleRun();
  }, [handleRun]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const isStreaming = status === 'streaming';

  return (
    <>
      <style>{`@keyframes kiriox-ai-spin { to { transform: rotate(360deg); } }`}</style>
      <div className={className} data-ai-assist data-field={contract.field} data-module={contract.module}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
          {isStreaming ? (
            <>
              <span style={S.spinner()} aria-hidden />
              <span style={S.statusText()} aria-live="polite">Generando…</span>
              <button
                type="button"
                onClick={handleCancel}
                style={{ ...S.btn('disabled'), cursor: 'pointer', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)' }}
              >
                ✕
              </button>
            </>
          ) : status === 'done' ? (
            <button type="button" onClick={handleRedo} style={S.btn('redo')} title="Regenerar">
              ↺ Regenerar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRun}
              disabled={disabled || !available}
              title={!available ? 'Chrome AI no disponible' : 'Autocompletar con IA local'}
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

        {error && <p role="alert" style={S.errorText()}>{error}</p>}
      </div>
    </>
  );
}
