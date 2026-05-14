import { Download, Puzzle, Settings } from "lucide-react";
import styles from "../pages/PluginsDashboardPage.module.css";
import type { PluginListItem } from "../../plugins.types";
import { PluginStatusBadge } from "./PluginStatusBadge";

function resolveIcon(extensionPoints: string[]) {
  if (extensionPoints.includes("report:exporter")) return <Download size={24} />;
  if (extensionPoints.includes("dashboard:widget")) return <Settings size={24} />;
  return <Puzzle size={24} />;
}

function getPluginActions(status: PluginListItem["status"]) {
  if (status === "active") {
    return {
      primary: "Desactivar",
      secondary: "Desinstalar",
    };
  }

  if (status === "disabled" || status === "installed") {
    return {
      primary: "Activar",
      secondary: "Desinstalar",
    };
  }

  return {
    primary: "Activar",
    secondary: "Instalar",
  };
}

export function PluginCard({ plugin }: { plugin: PluginListItem }) {
  const actions = getPluginActions(plugin.status);

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
          <button className={styles.secondaryActionButton}>{actions.secondary}</button>
          <button className={styles.primaryActionButton}>{actions.primary}</button>
        </div>
      </div>
    </article>
  );
}
