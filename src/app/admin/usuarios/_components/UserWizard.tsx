'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/core/auth/client-csrf';

interface UserWizardProps {
  mode: 'create' | 'edit';
  userId?: string;
}

interface CompanyOption {
  id: string;
  name: string;
  code: string;
}

export default function UserWizard({ mode, userId }: UserWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateUserId, setDuplicateUserId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [mustChangePassword, setMustChangePassword] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>([]);
  const [roles, setRoles] = useState<{ id: string; code: string; name: string }[]>([]);

  useEffect(() => {
    const companyFromQuery = searchParams.get('company_id');
    if (companyFromQuery) setTenantId(companyFromQuery);
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/admin/companies')
      .then(r => r.ok ? r.json() : [])
      .then(data => setCompanies(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/admin/rbac')
      .then(r => r.ok ? r.json() : [])
      .then(data => setRoles(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mode !== 'edit' || !userId) return;
    setLoading(true);
    fetch(`/api/admin/users/${userId}`)
      .then(async r => {
        if (!r.ok) throw new Error((await r.json()).error || 'Failed to load user');
        return r.json();
      })
      .then(data => {
        if (!data.user) throw new Error('Usuario no encontrado');
        setEmail(data.user.email || '');
        setName(data.user.name || '');
        setLastName(data.user.lastName || '');
        setWhatsapp(data.user.whatsapp || '');
        const codes = Array.isArray(data.user.roles)
          ? data.user.roles.map((r: { roleCode: string }) => r.roleCode).filter(Boolean)
          : data.user.roleCode ? [data.user.roleCode] : [];
        setSelectedRoleCodes(codes);
        if (typeof data.user.mustChangePassword === 'boolean') setMustChangePassword(data.user.mustChangePassword);
        if (typeof data.user.isActive === 'boolean') setIsActive(data.user.isActive);
        if (data.user.tenantId) setTenantId(data.user.tenantId);
      })
      .catch(err => setError(err.message || 'Error al cargar el usuario'))
      .finally(() => setLoading(false));
  }, [mode, userId]);

  const handleSubmit = async () => {
    setError(null);
    setDuplicateUserId(null);
    if (!tenantId) { setError('Seleccione una empresa.'); return; }
    if (!name || !email) { setError('Nombre y email son obligatorios.'); return; }
    if (mode === 'create' && !password) { setError('El password inicial es obligatorio.'); return; }
    setLoading(true);
    const csrf = getCsrfTokenFromDocument();
    try {
      const payload: Record<string, unknown> = { tenantId, email, name, lastName, whatsapp, roleCodes: selectedRoleCodes, isActive, mustChangePassword };
      if (mode === 'create') payload.password = password;
      const res = await fetch(mode === 'create' ? '/api/admin/users' : `/api/admin/users/${userId}`, {
        method: mode === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json', ...(csrf ? { 'x-csrf-token': csrf } : {}) },
        body: JSON.stringify(payload),
      });
      if (res.status === 409) {
        const data = await res.json();
        setError('Email duplicado.');
        setDuplicateUserId(data.userId);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Error al guardar.');
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/admin/usuarios'), 1800);
    } catch {
      setError('Error al guardar el usuario.');
    } finally {
      setLoading(false);
    }
  };

  const formError = useMemo(() => {
    if (!tenantId) return 'Seleccione una empresa.';
    if (!name || !email) return 'Nombre y email son obligatorios.';
    if (selectedRoleCodes.length === 0) return 'Seleccione al menos un rol.';
    if (mode === 'create' && !password) return 'El password inicial es obligatorio.';
    return null;
  }, [tenantId, name, email, selectedRoleCodes, mode, password]);

  const selectedRolesSet = useMemo(() => new Set(selectedRoleCodes), [selectedRoleCodes]);

  const toggleRole = (code: string) =>
    setSelectedRoleCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);

  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}</h2>
        <p style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>Configure la identidad, el rol y los alcances del usuario.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[
              { label: 'Empresa', content: (
                <select value={tenantId} onChange={e => setTenantId(e.target.value)} style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }}>
                  <option value="">Seleccione...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              )},
              { label: 'Nombre', content: <input required value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }} /> },
              { label: 'Apellido', content: <input value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }} /> },
              { label: 'Email corporativo', content: <input type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }} /> },
              { label: 'WhatsApp', content: <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+57 300 000 0000" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }} /> },
            ].map(({ label, content }) => (
              <div key={label}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>{label}</label>
                {content}
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <ShieldCheck size={18} />
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Permisos incluidos</h3>
            </div>
            <p style={{ margin: '0 0 0.75rem', color: 'var(--secondary)', fontSize: '0.8rem' }}>Seleccione uno o más roles para este usuario.</p>
            {roles.length === 0 ? (
              <p style={{ color: 'var(--secondary)' }}>No hay roles activos disponibles.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', maxHeight: 320, overflowY: 'auto' }}>
                {roles.map(role => {
                  const selected = selectedRolesSet.has(role.code);
                  return (
                    <button key={role.id} type="button" onClick={() => toggleRole(role.code)} style={{ textAlign: 'left', padding: '0.7rem 0.75rem', borderRadius: 8, border: selected ? '1px solid rgba(16,185,129,0.55)' : '1px solid var(--glass-border)', background: selected ? 'rgba(16,185,129,0.14)' : 'rgba(255,255,255,0.02)', color: selected ? '#d1fae5' : 'var(--foreground)', cursor: 'pointer', display: 'grid', gap: '0.2rem' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{role.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <p style={{ margin: '0.85rem 0 0', color: 'var(--secondary)', fontSize: '0.75rem' }}>Seleccionados: {selectedRoleCodes.length}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
          {mode === 'edit' && (
            <div className="glass-card" style={{ padding: '1rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Estado del usuario</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {[{ label: 'Activo', value: true }, { label: 'Inactivo', value: false }].map(({ label, value }) => (
                  <button key={label} type="button" onClick={() => setIsActive(value)} style={{ border: isActive === value ? `1px solid ${value ? 'rgba(16,185,129,0.55)' : 'rgba(239,68,68,0.55)'}` : '1px solid var(--glass-border)', background: isActive === value ? `${value ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)'}` : 'rgba(255,255,255,0.03)', color: isActive === value ? (value ? '#d1fae5' : '#fecaca') : 'var(--foreground)', borderRadius: 10, padding: '0.6rem 1rem', fontWeight: 700, cursor: 'pointer' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'create' && (
            <div className="glass-card" style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Password inicial</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: 8, color: 'white' }} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--secondary)', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={mustChangePassword} onChange={e => setMustChangePassword(e.target.checked)} />
                  Forzar cambio de password en el primer login
                </label>
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: '#f87171', fontSize: '0.85rem' }}>
              {error}
              {duplicateUserId && <div><a href={`/admin/usuarios/${duplicateUserId}`} style={{ color: '#60a5fa' }}>Abrir edición</a></div>}
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981' }}>
              <CheckCircle2 size={18} /> Usuario guardado
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={() => router.back()} style={{ background: 'transparent', color: 'white', border: '1px solid var(--glass-border)', padding: '0.75rem 1.25rem', borderRadius: 10, cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleSubmit} disabled={loading || !!formError} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Guardando...' : mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
