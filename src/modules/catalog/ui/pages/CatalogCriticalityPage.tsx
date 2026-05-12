'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, AlertTriangle, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CritLevel = { id: string; code: string; name: string; sort_order: number; is_active: boolean };

const EMPTY: Omit<CritLevel, 'id'> = { code: '', name: '', sort_order: 0, is_active: true };

const S = {
  page: { minHeight: '100vh', background: 'transparent', padding: '2rem 2.5rem 3rem' } as React.CSSProperties,
  header: { display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' } as React.CSSProperties,
  title: { margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9' } as React.CSSProperties,
  sub: { margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b' } as React.CSSProperties,
  card: { background: 'rgba(13,22,52,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' } as React.CSSProperties,
  th: { padding: '0.7rem 1rem', fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' as const, letterSpacing: '0.06em', textAlign: 'left' as const },
  td: { padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#cbd5e1', borderTop: '1px solid rgba(255,255,255,0.04)' } as React.CSSProperties,
  input: { width: '100%', background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 10px', color: '#f1f5f9', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' } as React.CSSProperties,
  btnPrimary: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' } as React.CSSProperties,
  btnDanger: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' } as React.CSSProperties,
  btnGhost: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.08)', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' } as React.CSSProperties,
  btnEdit: { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 7, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 } as React.CSSProperties,
};

export function CatalogCriticalityPage() {
  const router = useRouter();
  const [items, setItems] = useState<CritLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<CritLevel, 'id'>>(EMPTY);
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/catalogo/criticidad');
      const data = await res.json() as { items: CritLevel[] };
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, []);

  function openNew() {
    setEditId(null);
    setForm({ ...EMPTY, sort_order: items.length + 1 });
    setShowForm(true);
    setError('');
  }

  function openEdit(item: CritLevel) {
    setEditId(item.id);
    setForm({ code: item.code, name: item.name, sort_order: item.sort_order, is_active: item.is_active });
    setShowForm(true);
    setError('');
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = editId ? { ...form, id: editId } : form;
      const res = await fetch('/api/catalogo/criticidad', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setShowForm(false);
      setEditId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    try {
      await fetch(`/api/catalogo/criticidad?id=${id}`, { method: 'DELETE' });
      setConfirmDelete(null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/modelo/gobernanza/catalogo');
  }

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button onClick={handleClose} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#475569', fontSize: '0.78rem', textDecoration: 'none', marginBottom: '1rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
          <ChevronLeft size={14} /> Volver al catálogo
        </button>
        <div style={S.header}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} color="#fb923c" />
          </div>
          <div>
            <h1 style={S.title}>Nivel de criticidad</h1>
            <p style={S.sub}>Mantenimiento de la tabla <code style={{ color: '#fb923c', fontSize: '0.75rem' }}>catalog_activity_criticality_level</code></p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
            <button style={S.btnPrimary} onClick={openNew}>
              <Plus size={14} /> Nuevo nivel
            </button>
            <button style={S.btnGhost} onClick={handleClose}>
              <X size={14} /> Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <div style={{ ...S.card, marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
          <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8' }}>
            {editId ? 'Editar nivel' : 'Nuevo nivel'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 120px auto', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Código *</div>
              <input style={S.input} value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="ej. HIGH" />
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Nombre *</div>
              <input style={S.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ej. Alta criticidad" />
            </div>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Orden</div>
              <input style={S.input} type="number" min={0} value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: 1 }}>
              <button style={S.btnPrimary} onClick={() => void handleSave()} disabled={saving}>
                <Save size={13} /> {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button style={S.btnGhost} onClick={() => { setShowForm(false); setEditId(null); }}>
                <X size={13} />
              </button>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.78rem', color: '#94a3b8' }}>
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Activo
            </label>
          </div>
          {error && <p style={{ margin: '0.75rem 0 0', color: '#f87171', fontSize: '0.75rem' }}>{error}</p>}
        </div>
      )}

      {/* Table */}
      <div style={S.card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
            <tr>
              <th style={S.th}>Código</th>
              <th style={S.th}>Nombre</th>
              <th style={{ ...S.th, textAlign: 'center' }}>Orden</th>
              <th style={{ ...S.th, textAlign: 'center' }}>Estado</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: '#475569', padding: '2rem' }}>Cargando…</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={5} style={{ ...S.td, textAlign: 'center', color: '#475569', padding: '2rem' }}>Sin registros. Cree el primero.</td></tr>
            ) : items.map(item => (
              <tr key={item.id}>
                <td style={S.td}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#fb923c', background: 'rgba(251,146,60,0.1)', padding: '2px 8px', borderRadius: 5 }}>{item.code}</span>
                </td>
                <td style={{ ...S.td, fontWeight: 600, color: '#f1f5f9' }}>{item.name}</td>
                <td style={{ ...S.td, textAlign: 'center', color: '#64748b' }}>{item.sort_order}</td>
                <td style={{ ...S.td, textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99, background: item.is_active ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: item.is_active ? '#10b981' : '#64748b' }}>
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ ...S.td, textAlign: 'right' }}>
                  {confirmDelete === item.id ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', color: '#f87171' }}>¿Confirmar?</span>
                      <button style={S.btnDanger} onClick={() => void handleDelete(item.id)} disabled={saving}>Sí</button>
                      <button style={S.btnGhost} onClick={() => setConfirmDelete(null)}>No</button>
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button style={S.btnEdit} onClick={() => openEdit(item)}><Pencil size={12} /> Editar</button>
                      <button style={S.btnDanger} onClick={() => setConfirmDelete(item.id)}><Trash2 size={12} /></button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
