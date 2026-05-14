'use client';

import React from 'react';
import { Puzzle, ShieldCheck } from 'lucide-react';
import { useExtensionPlugins } from './hooks';
import { KirioxPluginExtensionPoint } from '@/shared/contracts/plugins/plugin.contract';

interface PluginZoneProps {
  pointId: KirioxPluginExtensionPoint;
  label?: string;
}

export function PluginZone({ pointId, label }: PluginZoneProps) {
  const { plugins, loading } = useExtensionPlugins(pointId);

  if (loading) return null;
  if (plugins.length === 0) return null;

  return (
    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <Puzzle size={12} /> {label}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            style={{
              background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.1), rgba(129, 140, 248, 0.05))',
              border: '1px dashed rgba(129, 140, 248, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{plugin.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.4 }}>{plugin.description}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.68rem', color: '#cbd5e1' }}>
              <span>v{plugin.version}</span>
              <span>{plugin.author}</span>
            </div>
            <div
              style={{
                marginTop: '0.5rem',
                fontSize: '0.65rem',
                color: '#818cf8',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}
            >
              <ShieldCheck size={10} /> Activo en: {pointId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
