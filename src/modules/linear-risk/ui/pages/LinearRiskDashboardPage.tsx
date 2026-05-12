"use client";

import React, { useEffect, useState } from "react";
import styles from "./dashboard.module.css";
import { LinearRiskDashboardRow } from "../../domain/types";

type Row = LinearRiskDashboardRow;

function formatValue(value: any) {
  if (value === null || value === undefined) return "—";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(2);
  }
  return String(value);
}

function safeNumber(value: any) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function findKey(columns: string[], candidates: string[]) {
  const lower = columns.map((c) => c.toLowerCase());
  for (const candidate of candidates) {
    const idx = lower.findIndex((c) => c === candidate.toLowerCase());
    if (idx >= 0) return columns[idx];
  }
  for (const candidate of candidates) {
    const idx = lower.findIndex((c) => c.includes(candidate.toLowerCase()));
    if (idx >= 0) return columns[idx];
  }
  return "";
}

function buildColumns(rows: Row[]) {
  if (!rows.length) return [];
  return Object.keys(rows[0]);
}

export default function LinearRiskDashboardPage() {
  const [data, setData] = useState<{ rows: Row[]; source: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/linear-risk/dashboard")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.page}><div className={styles.container}><p className={styles.subtitle}>Cargando dashboard...</p></div></div>;
  }

  const rows = data?.rows || [];
  const source = data?.source || "dashboard_top_control";

  const columns = buildColumns(rows);
  const keyMap = {
    controlCode: findKey(columns, ["control_code", "code"]),
    controlName: findKey(columns, ["control_name", "control_title", "name"]),
    controlType: findKey(columns, ["control_type", "type"]),
    domainName: findKey(columns, ["domain_name", "domain"]),
    obligations: findKey(columns, ["obligations_supported", "obligations", "obligation_count"]),
    risks: findKey(columns, ["risks_mitigated", "risks", "risk_count"]),
    structuralScore: findKey(columns, ["structural_score", "structural"]),
    fragilityScore: findKey(columns, ["fragility_score", "fragility"]),
    systemicScore: findKey(columns, ["systemic_impact_score", "systemic"]),
    rank: findKey(columns, ["final_weighted_rank", "rank"]),
  };

  const systemicValues = keyMap.systemicScore
    ? rows.map((row) => safeNumber(row[keyMap.systemicScore])).filter((v) => v !== null) as number[]
    : [];
  const fragilityValues = keyMap.fragilityScore
    ? rows.map((row) => safeNumber(row[keyMap.fragilityScore])).filter((v) => v !== null) as number[]
    : [];
  const structuralValues = keyMap.structuralScore
    ? rows.map((row) => safeNumber(row[keyMap.structuralScore])).filter((v) => v !== null) as number[]
    : [];

  const avgSystemic = systemicValues.length
    ? systemicValues.reduce((acc, val) => acc + val, 0) / systemicValues.length
    : null;
  const avgFragility = fragilityValues.length
    ? fragilityValues.reduce((acc, val) => acc + val, 0) / fragilityValues.length
    : null;
  const avgStructural = structuralValues.length
    ? structuralValues.reduce((acc, val) => acc + val, 0) / structuralValues.length
    : null;

  const topControls = [...rows]
    .sort((a, b) => {
      const aVal = safeNumber(a[keyMap.systemicScore]) ?? safeNumber(a[keyMap.structuralScore]) ?? 0;
      const bVal = safeNumber(b[keyMap.systemicScore]) ?? safeNumber(b[keyMap.structuralScore]) ?? 0;
      return bVal - aVal;
    })
    .slice(0, 6);

  const maxSystemic = systemicValues.length ? Math.max(...systemicValues) : 1;
  const maxStructural = structuralValues.length ? Math.max(...structuralValues) : 1;
  const maxFragility = fragilityValues.length ? Math.max(...fragilityValues) : 1;

  const domainSummary = rows.reduce((acc: Record<string, { count: number; impact: number }>, row) => {
    const name = keyMap.domainName ? String(row[keyMap.domainName] ?? "Sin dominio") : "Sin dominio";
    const impact = safeNumber(row[keyMap.systemicScore]) ?? 0;
    if (!acc[name]) acc[name] = { count: 0, impact: 0 };
    acc[name].count += 1;
    acc[name].impact += impact;
    return acc;
  }, {});

  const domainCards = Object.entries(domainSummary)
    .map(([name, values]) => ({
      name,
      count: values.count,
      avgImpact: values.count ? values.impact / values.count : 0,
    }))
    .sort((a, b) => b.avgImpact - a.avgImpact)
    .slice(0, 6);

  const canEnhancedTable =
    Boolean(keyMap.controlCode || keyMap.controlName) &&
    Boolean(keyMap.systemicScore || keyMap.structuralScore || keyMap.fragilityScore);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div className={styles.eyebrow}>compliance risk engine</div>
            <h1 className={styles.title}>Dashboard Riesgo Lineal</h1>
            <p className={styles.subtitle}>
              Vista ejecutiva construida desde <span className={styles.subtitleStrong}>{source}</span>. 
              Los controles críticos se ordenan por impacto sistémico, fragilidad y severidad estructural.
            </p>
          </div>
          <div className={styles.headerMeta}>
            <span className={styles.metaPill}>{rows.length} controles críticos</span>
            {avgSystemic !== null && <span className={styles.metaPill}>Prom. impacto {avgSystemic.toFixed(2)}</span>}
          </div>
        </div>

        <section className={styles.heroGrid}>
          <div className={styles.heroCard}>
            <div className={styles.cardEyebrow}>Score ejecutivo</div>
            <div className={styles.heroRow}>
              <div>
                <div className={styles.heroValue}>{avgSystemic !== null ? avgSystemic.toFixed(2) : "—"}</div>
                <div className={styles.heroHint}>Impacto sistémico promedio</div>
              </div>
              <div className={styles.heroOrb}><div className={styles.heroOrbInner} /></div>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.heroStatCard}>
                <div className={styles.heroStatLabel}>Fragilidad</div>
                <div className={styles.heroStatValue}>{avgFragility !== null ? avgFragility.toFixed(2) : "—"}</div>
              </div>
              <div className={styles.heroStatCard}>
                <div className={styles.heroStatLabel}>Score estructural</div>
                <div className={styles.heroStatValue}>{avgStructural !== null ? avgStructural.toFixed(2) : "—"}</div>
              </div>
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.cardEyebrow}>Dominio líder</div>
            <div className={styles.metricValue}>{domainCards[0]?.name || "—"}</div>
            <div className={styles.metricHint}>{domainCards[0] ? `${domainCards[0].count} controles` : "Sin datos"}</div>
            <div className={styles.metricBarTrack}>
              <div className={styles.metricBarFill} style={{ width: domainCards[0] ? `${Math.min(100, domainCards[0].avgImpact * 100)}%` : "0%" }} />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Top controles críticos</div>
          </div>
          <div className={styles.cardGrid}>
            {topControls.map((row, idx) => {
              const impact = safeNumber(row[keyMap.systemicScore]) ?? 0;
              const width = maxSystemic > 0 ? (impact / maxSystemic) * 100 : 0;
              return (
                <div key={idx} className={styles.rankCard}>
                  <div className={styles.rankHeader}>
                    <div>
                      <div className={styles.rankEyebrow}>{row[keyMap.controlType] || "Control"}</div>
                      <div className={styles.rankTitle}>{row[keyMap.controlName] || row[keyMap.controlCode] || "—"}</div>
                      <div className={styles.rankMeta}>{row[keyMap.controlCode] || "Sin código"}</div>
                    </div>
                    <div className={styles.rankBadge}>#{safeNumber(row[keyMap.rank]) ?? idx + 1}</div>
                  </div>
                  <div className={styles.rankMetricRow}>
                    <span>Impacto sistémico</span>
                    <span className={styles.rankMetricValue}>{impact ? impact.toFixed(2) : "—"}</span>
                  </div>
                  <div className={styles.rankBarTrack}>
                    <div className={styles.rankBarFill} style={{ width: `${Math.max(6, Math.min(100, width))}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Detalle completo</div>
          </div>
          <div className={styles.tableCard}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th className={styles.th}>Control</th>
                    <th className={styles.th}>Dominio</th>
                    <th className={styles.th}>Scores</th>
                    <th className={styles.th}>Rank</th>
                  </tr>
                </thead>
                <tbody className={styles.tbody}>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.controlCell}>
                          <div className={styles.controlName}>{row[keyMap.controlName] || "—"}</div>
                          <div className={styles.controlMeta}><span className={styles.controlCode}>{row[keyMap.controlCode]}</span></div>
                        </div>
                      </td>
                      <td className={styles.td}>{row[keyMap.domainName] || "—"}</td>
                      <td className={styles.td}>
                        <div className={styles.metricStack}>
                          <div className={styles.metricRow}><span>Impacto</span><span>{safeNumber(row[keyMap.systemicScore])?.toFixed(2) || "—"}</span></div>
                          <div className={styles.metricBarTrackSmall}><div className={styles.metricBarImpactSmall} style={{ width: `${(safeNumber(row[keyMap.systemicScore]) || 0) / maxSystemic * 100}%` }} /></div>
                        </div>
                      </td>
                      <td className={styles.td}><span className={styles.rankPill}>#{row[keyMap.rank] || idx + 1}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
