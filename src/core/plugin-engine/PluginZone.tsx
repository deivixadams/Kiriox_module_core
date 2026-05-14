'use client';

import React, { Component, ReactNode } from 'react';
import * as Lucide from 'lucide-react';
import { useExtensionPlugins } from './hooks';
import { KirioxPluginExtensionPoint } from '@/shared/contracts/plugins/plugin.contract';

// Error Boundary para aislar fallos de los plugins
class PluginErrorBoundary extends Component<{ children: ReactNode, pluginName: string }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '1rem', border: '1px solid #ef4444', borderRadius: '8px', background: '#fee2e2', color: '#b91c1c', fontSize: '0.8rem' }}>
          Error al cargar el widget de <strong>{this.props.pluginName}</strong>.
        </div>
      );
    }
    return this.props.children;
  }
}

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
          <Lucide.Puzzle size={12} /> {label}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {plugins.map(plugin => (
          <PluginErrorBoundary key={plugin.id} pluginName={plugin.name}>
            <RemotePluginComponent pluginId={plugin.id} pointId={pointId} />
          </PluginErrorBoundary>
        ))}
      </div>
    </div>
  );
}

function RemotePluginComponent({ pluginId, pointId }: { pluginId: string, pointId: string }) {
  const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadComponent() {
      try {
        const response = await fetch(`/api/plugins/runtime/${pluginId}`);
        if (!response.ok) throw new Error('No se pudo cargar el runtime del plugin');
        const code = await response.text();
        
        // Ejecutar el bundle inyectando dependencias
        // eslint-disable-next-line no-new-func
        const factory = new Function('return ' + code)();
        const exports: any = {};
        const pluginInstance = factory(exports, React, Lucide);
        
        // Extraer la contribución UI
        const candidate = pluginInstance.default || pluginInstance.plugin || pluginInstance;
        const uiComponent = candidate.uiContributions?.[pointId];
        
        if (uiComponent) {
          setComponent(() => uiComponent);
        } else {
          setError('El plugin no provee un componente para esta zona');
        }
      } catch (err) {
        console.error(`[PluginZone] Error cargando ${pluginId}:`, err);
        setError('Error de carga');
      }
    }

    void loadComponent();
  }, [pluginId, pointId]);

  if (error) return <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{error}</div>;
  if (!Component) return <div style={{ height: 100, borderRadius: 12, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lucide.Loader2 className="animate-spin" size={16} color="#475569" /></div>;

  return <Component />;
}
