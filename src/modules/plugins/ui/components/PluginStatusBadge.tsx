import type { KirioxPluginStatus } from "@/shared/contracts/plugins/plugin.contract";
import styles from "../pages/PluginsDashboardPage.module.css";

const statusLabels: Record<KirioxPluginStatus, string> = {
  installed: "Instalado",
  active: "Activo",
  disabled: "Instalado",
  quarantined: "Instalado",
};

const statusClassNames: Record<KirioxPluginStatus, string> = {
  installed: styles.statusInstalled,
  active: styles.statusActive,
  disabled: styles.statusInstalled,
  quarantined: styles.statusInstalled,
};

export function PluginStatusBadge({ status }: { status: KirioxPluginStatus }) {
  return (
    <span className={`${styles.statusBadge} ${statusClassNames[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
