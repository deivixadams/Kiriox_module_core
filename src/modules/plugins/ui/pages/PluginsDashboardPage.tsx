import styles from "./PluginsDashboardPage.module.css";
import { PluginsModule } from "../../index";
import { PluginCard } from "../components/PluginCard";
import { PluginsSummary } from "../components/PluginsSummary";
import { InstallPluginButton } from "../components/InstallPluginButton";
import { PluginAuditTrail } from "../components/PluginAuditTrail";

export async function PluginsDashboardPage() {
  const { plugins, summary, auditTrail } = await PluginsModule.listDashboardData();

  return (
    <main className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Extensiones</h1>
            <p className={styles.subtitle}>
              Gestión y administración de plugins instalados en el ecosistema
              Kiriox mediante contratos y puntos de extensión trazables.
            </p>
          </div>
          <InstallPluginButton />
        </div>
      </header>

      <PluginsSummary summary={summary} />

      <section className={styles.pluginGrid}>
        {plugins.map((plugin) => (
          <PluginCard key={plugin.id} plugin={plugin} />
        ))}
      </section>

      <PluginAuditTrail entries={auditTrail} />
    </main>
  );
}
