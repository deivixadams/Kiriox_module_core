"use client";

import { Download, Puzzle, Settings, Loader2 } from "lucide-react";
import styles from "../pages/PluginsDashboardPage.module.css";
import type { PluginListItem } from "../../plugins.types";
import { PluginStatusBadge } from "./PluginStatusBadge";
import { useState } from "react";
import { useRouter } from "next/navigation";

function resolveIcon(extensionPoints: string[]) {
  if (extensionPoints.some((point) => point.includes("simulation"))) return <Download size={24} />;
  if (extensionPoints.some((point) => point.includes("dashboard:widget"))) return <Settings size={24} />;
  return <Puzzle size={24} />;
}

function getPluginActions(status: PluginListItem["status"]) {
  if (status === "active") {
    return {
      primary: "Desactivar",
      secondary: "Instalado",
      action: "deactivate",
    };
  }

  return {
    primary: "Activar",
    secondary: "Instalado",
    action: "activate",
  };
}

export function PluginCard({ plugin }: { plugin: PluginListItem }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const actions = getPluginActions(plugin.status);

  const handleToggleStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plugins/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plugin.id, action: actions.action }),
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert('Error al cambiar el estado del plugin');
      }
    } catch (error) {
      console.error(error);
      alert('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className={styles.pluginCard}>
      <div className={styles.pluginCardHeader}>
        <div className={styles.pluginIcon}>{resolveIcon(plugin.extensionPoints)}</div>
        <PluginStatusBadge status={plugin.status} />
      </div>

      <div className={styles.pluginInfo}>
        <h3>{plugin.name}</h3>
        <p className={styles.descriptionLabel}>Descripción breve</p>
        <p className={styles.pluginDescription}>{plugin.description}</p>
      </div>

      <div className={styles.metaGroup}>
        <span className={styles.version}>v{plugin.version}</span>
        <span className={styles.author}>{plugin.author}</span>
      </div>

      <div className={styles.pluginMeta}>
        <div className={styles.permissionMeta}>
          <span className={styles.metaLabel}>Permisos</span>
          <span className={styles.metaValue}>{plugin.permissions.length}</span>
        </div>
        <div className={styles.actionGroup}>
          <button className={styles.secondaryActionButton} disabled>{actions.secondary}</button>
          <button 
            className={styles.primaryActionButton} 
            onClick={handleToggleStatus}
            disabled={loading}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : actions.primary}
          </button>
        </div>
      </div>
    </article>
  );
}
