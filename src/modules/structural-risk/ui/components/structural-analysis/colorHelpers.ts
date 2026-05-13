import type { CI } from './types';

// Module-level caches — rule js-cache-function-results
const critWCache = new Map<number, CI>();
const strgWCache = new Map<number, CI>();
const effSCache = new Map<number, CI>();
const benSCache = new Map<number, CI>();

export function critW(w: number): CI {
  const hit = critWCache.get(w);
  if (hit) return hit;
  const r: CI =
    w >= 0.9 ? { label: 'Muy Alta', color: '#c084fc', bg: 'rgba(168,85,247,0.14)' } :
    w >= 0.7 ? { label: 'Alta',     color: '#f87171', bg: 'rgba(239,68,68,0.12)'   } :
    w >= 0.4 ? { label: 'Media',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  } :
               { label: 'Baja',     color: '#4ade80', bg: 'rgba(74,222,128,0.10)'  };
  critWCache.set(w, r);
  return r;
}

export function strgW(w: number): CI {
  const hit = strgWCache.get(w);
  if (hit) return hit;
  const r: CI =
    w >= 0.8 ? { label: 'Crítica', color: '#f87171', bg: 'rgba(239,68,68,0.12)'   } :
    w >= 0.6 ? { label: 'Alta',    color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  } :
    w >= 0.4 ? { label: 'Media',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  } :
               { label: 'Baja',    color: '#4ade80', bg: 'rgba(74,222,128,0.10)'  };
  strgWCache.set(w, r);
  return r;
}

export function effS(s: number): CI {
  const hit = effSCache.get(s);
  if (hit) return hit;
  const r: CI =
    s <= 1.0 ? { label: 'Bajo',  color: '#4ade80', bg: 'rgba(74,222,128,0.10)'  } :
    s <= 1.5 ? { label: 'Medio', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  } :
               { label: 'Alto',  color: '#f87171', bg: 'rgba(239,68,68,0.12)'   };
  effSCache.set(s, r);
  return r;
}

export function benS(s: number): CI {
  const hit = benSCache.get(s);
  if (hit) return hit;
  const r: CI =
    s >= 3 ? { label: 'Muy Alto', color: '#c084fc', bg: 'rgba(168,85,247,0.14)' } :
    s >= 2 ? { label: 'Alto',     color: '#f87171', bg: 'rgba(239,68,68,0.12)'  } :
    s >= 1 ? { label: 'Medio',    color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' } :
             { label: 'Bajo',     color: '#4ade80', bg: 'rgba(74,222,128,0.10)' };
  benSCache.set(s, r);
  return r;
}

export function fragPct(benefit: number, effort: number): number {
  return Math.round(Math.min(99, (benefit / Math.max(0.01, benefit + effort)) * 100));
}

export function scopeLabel(s: string): string {
  const map: Record<string, string> = { COMPANY: 'Compañía', UNIT: 'Unidad', PROCESS: 'Proceso' };
  return map[s] ?? s;
}

export function fmtN(n: number | null | undefined): string {
  return n != null ? Math.round(n).toLocaleString('es') : '—';
}

export function trunc(s: string, max = 34): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
