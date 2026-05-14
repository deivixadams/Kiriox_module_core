import { useState, useEffect } from 'react';
import { KirioxPluginExtensionPoint } from '@/shared/contracts/plugins/plugin.contract';

export interface PluginExtension {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  status: "active";
  extensionPoints: KirioxPluginExtensionPoint[];
}

export function useExtensionPlugins(pointId: KirioxPluginExtensionPoint) {
  const [plugins, setPlugins] = useState<PluginExtension[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlugins() {
      try {
        const res = await fetch(`/api/plugins/active?pointId=${encodeURIComponent(pointId)}`);
        if (!res.ok) throw new Error('Error al cargar plugins');
        const data = await res.json() as PluginExtension[];
        setPlugins(data);
      } catch (error) {
        console.error(`[PluginHooks] Error cargando extensiones para ${pointId}:`, error);
      } finally {
        setLoading(false);
      }
    }

    void fetchPlugins();
  }, [pointId]);

  return { plugins, loading };
}
