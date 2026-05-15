'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, Save, ArrowLeft } from 'lucide-react';
import styles from './GovernanceActivityNewPage.module.css';

type CompanyOption = { id: string; name: string };
type ProcessOption = { id: string; name: string; code: string };
type UserOption = { id: string; name: string | null; lastName: string | null; email: string };

export default function GovernanceActivityNewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const companyIdParam = searchParams.get('company_id') || '';
  const elementIdParam = searchParams.get('element_id') || '';

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [processes, setProcesses] = useState<ProcessOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingContext, setLoadingContext] = useState(true);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    companyId: companyIdParam,
    elementId: elementIdParam,
    ownerId: '',
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    let mounted = true;
    setLoadingContext(true);
    fetch('/api/governance/companies', { cache: 'no-store' })
      .then(async r => {
        if (r.status === 403) { if (mounted) setError('Sin permisos para cargar empresas.'); return; }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!mounted) return;
        const list: CompanyOption[] = data.items || [];
        setCompanies(list);
        const paramId = searchParams.get('company_id') || searchParams.get('companyId');
        const found = list.find(c => c.id === paramId);
        if (found) setForm(prev => ({ ...prev, companyId: found.id }));
        else if (list.length > 0 && !form.companyId) setForm(prev => ({ ...prev, companyId: list[0].id }));
      })
      .catch(err => { if (mounted) setError(`Error: ${err.message}`); })
      .finally(() => { if (mounted) setLoadingContext(false); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!form.companyId) { setProcesses([]); setUsers([]); return; }
    let mounted = true;

    setLoadingProcesses(true);
    fetch(`/api/governance/processes?company_id=${form.companyId}`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!mounted) return;
        const items: ProcessOption[] = data.items || [];
        setProcesses(items);
        const exists = items.some(p => p.id === form.elementId);
        if (!exists) setForm(prev => ({ ...prev, elementId: items[0]?.id || '' }));
      })
      .catch(err => { if (mounted) setError(`Error procesos: ${err.message}`); })
      .finally(() => { if (mounted) setLoadingProcesses(false); });

    setLoadingUsers(true);
    fetch(`/api/admin/users?companyId=${form.companyId}`, { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : data.users || []);
        setForm(prev => ({ ...prev, ownerId: '' }));
      })
      .catch(err => { if (mounted) setError(`Error líderes: ${err.message}`); })
      .finally(() => { if (mounted) setLoadingUsers(false); });

    return () => { mounted = false; };
  }, [form.companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.companyId) { setError('La empresa es obligatoria.'); return; }
    if (!form.elementId) { setError('El proceso es obligatorio.'); return; }
    if (!form.name.trim()) { setError('El nombre de la actividad es obligatorio.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/governance/processes/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Error al crear la actividad');
      setSuccess('Actividad clave creada exitosamente.');
      setForm(prev => ({ ...prev, name: '', description: '', ownerId: '' }));
      setTimeout(() => router.back(), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.headerWrapper}>
          <button type="button" className={styles.closeButton} onClick={() => router.back()} aria-label="Volver">
            <X size={20} />
          </button>
          <div className={styles.header}>
            <h1 className={styles.title}>Nueva Actividad Clave</h1>
            <p className={styles.subtitle}>Registra una nueva actividad de gobierno vinculada a un proceso y empresa.</p>
          </div>
        </div>

        <form className={styles.card} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <label className={styles.field}>
              <span>Empresa</span>
              <select className={styles.input} value={form.companyId} onChange={e => setForm(prev => ({ ...prev, companyId: e.target.value, elementId: '', ownerId: '' }))} disabled={loadingContext || saving}>
                {loadingContext && <option value="">Cargando empresas...</option>}
                {!loadingContext && companies.length === 0 && <option value="">Sin empresas disponibles</option>}
                {!loadingContext && companies.length > 0 && <option value="" disabled>Seleccione una empresa</option>}
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>

            <label className={styles.field}>
              <span>Proceso Vinculado</span>
              <select className={styles.input} value={form.elementId} onChange={e => setForm(prev => ({ ...prev, elementId: e.target.value }))} disabled={loadingProcesses || saving || !form.companyId}>
                <option value="">{loadingProcesses ? 'Cargando procesos...' : 'Seleccione Proceso'}</option>
                {processes.map(p => <option key={p.id} value={p.id}>[{p.code}] {p.name}</option>)}
              </select>
            </label>

            <label className={styles.field}>
              <span>Líder de la Actividad</span>
              <select className={styles.input} value={form.ownerId} onChange={e => setForm(prev => ({ ...prev, ownerId: e.target.value }))} disabled={loadingUsers || saving || !form.companyId}>
                <option value="">{loadingUsers ? 'Cargando usuarios...' : 'Seleccione Líder'}</option>
                {users.map(u => {
                  const label = [u.name, u.lastName].filter(Boolean).join(' ') || u.email;
                  return <option key={u.id} value={u.id}>{label}</option>;
                })}
              </select>
            </label>
          </div>

          <label className={styles.field}>
            <span>Nombre de la Actividad</span>
            <input className={styles.input} value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ej: Conciliación bancaria diaria" disabled={saving} required />
          </label>

          <label className={styles.field}>
            <span>Descripción / Alcance</span>
            <textarea className={styles.textarea} rows={5} value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Describa el objetivo y las tareas principales de esta actividad..." disabled={saving} />
          </label>

          <label className={styles.switchRow}>
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))} disabled={saving} />
            <span>Actividad activa</span>
          </label>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryButton} onClick={() => router.back()} disabled={saving}>
              <ArrowLeft size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Cancelar
            </button>
            <button type="submit" className={styles.primaryButton} disabled={saving}>
              <Save size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
              {saving ? 'Guardando...' : 'Crear Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
