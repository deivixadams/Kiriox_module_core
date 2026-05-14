import type { PluginAuditEntry } from "@/core/plugin-engine/plugin-audit";
import styles from "../pages/PluginsDashboardPage.module.css";

const EVENT_LABELS: Record<PluginAuditEntry["event"], string> = {
  install: "Instalación",
  activate: "Activación",
  deactivate: "Desactivación",
  load: "Carga",
  error: "Error",
  execute: "Ejecución",
};

export function PluginAuditTrail({ entries }: { entries: PluginAuditEntry[] }) {
  return (
    <section className={styles.auditPanel}>
      <div className={styles.auditHeader}>
        <div>
          <h2 className={styles.auditTitle}>Auditoría del engine</h2>
          <p className={styles.auditSubtitle}>
            Registro trazable de carga, activación, errores y ejecución por plugin.
          </p>
        </div>
      </div>

      <div className={styles.auditList}>
        {entries.length === 0 ? (
          <div className={styles.auditEmpty}>Todavía no hay eventos auditados.</div>
        ) : (
          entries.map((entry, index) => (
            <article key={`${entry.timestamp}-${entry.pluginId}-${index}`} className={styles.auditItem}>
              <div className={styles.auditMeta}>
                <span className={styles.auditPlugin}>{entry.pluginId}</span>
                <span className={styles.auditEvent}>{EVENT_LABELS[entry.event]}</span>
                <span className={styles.auditStatus}>{entry.status}</span>
              </div>
              <p className={styles.auditMessage}>{entry.message}</p>
              <div className={styles.auditFoot}>
                <span>{new Date(entry.timestamp).toLocaleString("es-DO")}</span>
                {entry.pointId ? <span>Zona: {entry.pointId}</span> : null}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
