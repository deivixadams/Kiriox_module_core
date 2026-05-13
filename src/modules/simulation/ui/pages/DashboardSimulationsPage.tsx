"use client";

import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Shield,
} from "lucide-react";
import type { ComponentType } from "react";
import styles from "./DashboardSimulationsPage.module.css";

type SimulationCard = {
  label: string;
  description: string;
  href: string;
  color: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
};

const CARDS: SimulationCard[] = [
  {
    label: "Stress testing",
    description: "Simula escenarios de estrés sobre el sistema.",
    href: "/app-simulation-stresstesting",
    color: "#f59e0b",
    Icon: RefreshCw,
  },
  {
    label: "Liquidez",
    description: "Escenarios de liquidez y pérdida esperada.",
    href: "/app-simulation-Liquidez",
    color: "#ef4444",
    Icon: AlertCircle,
  },
  {
    label: "Monte Carlo",
    description: "Escenarios probabilísticos por iteraciones.",
    href: "/score/simulacion/monte-carlo",
    color: "#a78bfa",
    Icon: CheckCircle2,
  },
];

export default function DashboardSimulationsPage() {
  const router = useRouter();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.eyebrow}>
          <Shield size={13} /> Simulaciones
        </div>
        <h1 className={styles.title}>Dashboard de simulaciones</h1>
        <p className={styles.subtitle}>
          Seleccione el tipo de simulación a ejecutar.
        </p>
      </div>

      <div className={styles.body}>
        <div className={styles.grid}>
          {CARDS.map((card) => (
            <button
              key={card.label}
              type="button"
              className={styles.card}
              onClick={() => router.push(card.href)}
            >
              <div
                className={styles.cardAccent}
                style={{
                  background: `linear-gradient(90deg, ${card.color}88, ${card.color}22)`,
                }}
              />
              <div className={styles.cardHeader}>
                <p className={styles.cardTitle}>{card.label}</p>
                <div
                  className={styles.iconWrap}
                  style={{
                    background: `${card.color}22`,
                    borderColor: `${card.color}55`,
                  }}
                >
                  <card.Icon size={16} color={card.color} />
                </div>
              </div>
              <p className={styles.description}>{card.description}</p>
              <div className={styles.linkLabel} style={{ color: card.color }}>
                Abrir simulación
              </div>
            </button>
          ))}
        </div>

        <div className={styles.note}>
          Este panel permite acceder directamente a Stress testing, Liquidez y
          Monte Carlo.
        </div>
      </div>
    </div>
  );
}
