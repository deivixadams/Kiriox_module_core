'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Shield, Trash2, UserPlus } from 'lucide-react';

interface RoleUser {
  assignment_id: string;
  user_id: string;
  name: string | null;
  last_name: string | null;
  email: string;
}

interface RoleEditorModalProps {
  role: Record<string, unknown> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => Promise<void>;
}

export default function RoleEditorModal({ role, isOpen, onClose, onSave }: RoleEditorModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '', isActive: true });
  const [assignedUsers, setAssignedUsers] = useState<RoleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'users'>('details');
  const [allUsers, setAllUsers] = useState<Record<string, unknown>[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role && isOpen) {
      setFormData({ name: String(role.name ?? ''), description: String(role.description ?? ''), isActive: role.is_active !== false });
      fetchAssignedUsers(String(role.id));
      fetchAllUsers();
    } else {
      setFormData({ name: '', description: '', isActive: true });
      setAssignedUsers([]);
    }
    setActiveTab('details');
    setError(null);
  }, [role, isOpen]);

  async function fetchAssignedUsers(roleId: string) {
    try {
      const res = await fetch(`/api/admin/rbac?id=${roleId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.users) setAssignedUsers(data.users);
    } catch { /* ignore */ }
  }

  async function fetchAllUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) return;
      const data = await res.json();
      setAllUsers(Array.isArray(data) ? data : []);
    } catch { /* ignore */ }
  }

  const handleAssignUser = async () => {
    if (!selectedUserId || !role?.id) return;
    setAssigning(true);
    try {
      const res = await fetch('/api/admin/rbac/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, roleId: role.id }),
      });
      if (!res.ok) throw new Error('Error al asignar');
      setSelectedUserId('');
      fetchAssignedUsers(String(role.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveUser = async (assignmentId: string) => {
    if (!window.confirm('¿Quitar este usuario del rol?')) return;
    try {
      const res = await fetch(`/api/admin/rbac?assignment_id=${assignmentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al remover');
      if (role?.id) fetchAssignedUsers(String(role.id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const generateCode = (name: string) =>
    name.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const code = generateCode(formData.name);
      if (!code) throw new Error('El nombre no genera un código válido.');
      await onSave({ ...formData, id: role?.id, code: role ? undefined : code });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  const availableUsers = allUsers.filter(u => !assignedUsers.some(au => au.user_id === String(u.id)));

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: 650, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '85vh', background: 'rgba(30,41,59,0.95)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
            <Shield size={22} style={{ color: 'var(--primary)' }} />
            {role ? 'Configurar Rol' : 'Nuevo Rol'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--secondary)' }}><X size={22} /></button>
        </div>

        {role && (
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.1)' }}>
            {(['details', 'users'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '0.9rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: activeTab === tab ? 'var(--primary)' : 'var(--secondary)', borderBottom: activeTab === tab ? '3px solid var(--primary)' : '3px solid transparent' }}>
                {tab === 'details' ? 'General' : `Miembros (${assignedUsers.length})`}
              </button>
            ))}
          </div>
        )}

        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
          {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: '#fca5a5', marginBottom: '1.5rem', fontSize: '0.85rem' }}>{error}</div>}

          {activeTab === 'details' ? (
            <form id="role-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase' }}>Nombre del Rol</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ padding: '0.8rem 1rem', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--secondary)', textTransform: 'uppercase' }}>Descripción</label>
                <textarea rows={4} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ padding: '0.8rem 1rem', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'white', outline: 'none', resize: 'none' }} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                <span style={{ color: 'white', fontWeight: 600 }}>Rol Activo</span>
              </label>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(59,130,246,0.08)', padding: '1.25rem', borderRadius: 12, border: '1px solid rgba(59,130,246,0.2)' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Vincular Usuario</label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} style={{ flex: 1, padding: '0.8rem', borderRadius: 10, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                    <option value="">Seleccionar...</option>
                    {availableUsers.map(u => <option key={String(u.id)} value={String(u.id)}>{String(u.name ?? '')} {String(u.lastName ?? '')} ({String(u.email)})</option>)}
                  </select>
                  <button onClick={handleAssignUser} disabled={!selectedUserId || assigning} style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0 1.25rem', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>
                    {assigning ? '...' : <UserPlus size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {assignedUsers.map(user => (
                  <div key={user.assignment_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <p style={{ fontWeight: 700, margin: 0, color: 'white', fontSize: '0.9rem' }}>{user.name} {user.last_name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', margin: 0 }}>{user.email}</p>
                    </div>
                    <button onClick={() => handleRemoveUser(user.assignment_id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '1.25rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', fontWeight: 700 }}>Cancelar</button>
          {activeTab === 'details' && (
            <button type="submit" form="role-form" style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: 10, fontWeight: 900, cursor: 'pointer' }}>
              {loading ? '...' : 'Guardar'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
