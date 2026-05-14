import styles from "../pages/PluginsDashboardPage.module.css";
import type { PluginsDashboardSummary } from "../../plugins.types";

export function PluginsSummary({ summary }: { summary: PluginsDashboardSummary }) {
  const cards = [
    { label: "Instalados", value: summary.total },
    { label: "Activos", value: summary.active },
    { label: "Deshabilitados", value: summary.disabled },
    { label: "Cuarentena", value: summary.quarantine },
  ];

  return (
    <section className={styles.summaryGrid}>
      {cards.map((card) => (
        <article key={card.label} className={styles.summaryCard}>
          <span className={styles.summaryLabel}>{card.label}</span>
          <strong className={styles.summaryValue}>{card.value}</strong>
        </article>
      ))}
    </section>
  );
}
