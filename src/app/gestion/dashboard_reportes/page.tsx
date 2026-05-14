'use client';

import React, { useEffect, useState } from 'react';
import { ReportesModule } from '@/modules/reportes';
import type { Reporte, ReportesKpis as KpiType } from '@/modules/reportes/reportes.types';
import { ReportesHeader } from '@/components/reportes/ReportesHeader';
import { ReportesKpis } from '@/components/reportes/ReportesKpis';
import { ReportesCategoriaTable } from '@/components/reportes/ReportesCategoriaTable';
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
          ReportesModule.obtenerKpis(),
        ]);
        setReportes(allReportes);
        setKpis(stats);
      } catch {
        // silent — production would surface this via error boundary
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !kpis) {
    return <div className={styles.dashboard}>Cargando dashboard...</div>;
  }

  return (
    <main className={styles.dashboard}>
      <ReportesHeader />
      <ReportesKpis kpis={kpis} />
      <ReportesCategoriaTable reportes={reportes} />
    </main>
  );
}
