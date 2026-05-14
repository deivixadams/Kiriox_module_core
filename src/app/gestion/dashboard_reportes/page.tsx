'use client';

import React, { useEffect, useState } from 'react';
import { ReportesModule } from '@/modules/reportes';
import { Reporte, ReportesKpis as KpiType, ReporteCategoria } from '@/modules/reportes/reportes.types';
import { ReportesHeader } from '@/components/reportes/ReportesHeader';
import { ReportesKpis } from '@/components/reportes/ReportesKpis';
import { ReporteCard } from '@/components/reportes/ReporteCard';
import styles from '@/components/reportes/reportes.module.css';

export default function DashboardReportesPage() {
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [kpis, setKpis] = useState<KpiType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [allReportes, stats] = await Promise.all([
          ReportesModule.listReportes(),
          ReportesModule.obtenerKpis()
        ]);
        setReportes(allReportes);
        setKpis(stats);
      } catch (error) {
        console.error("Error loading reportes:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !kpis) {
    return <div className={styles.dashboard}>Cargando dashboard...</div>;
  }

  const reportesOrdenados = [...reportes].sort((a, b) => a.nombre.localeCompare(b.nombre));

  return (
    <main className={styles.dashboard}>
      <ReportesHeader />
      
      <ReportesKpis kpis={kpis} />

      <div className={styles.reportGrid}>
        {reportesOrdenados.map(reporte => (
          <ReporteCard key={reporte.id} reporte={reporte} />
        ))}
      </div>
    </main>
  );
}
