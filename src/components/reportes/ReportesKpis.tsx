'use client';

import React from 'react';
import { 
  BarChart3, 
  FileCheck, 
  AlertOctagon, 
  Clock4, 
  CalendarDays, 
  SendHorizontal, 
  FileWarning, 
  FileClock 
} from 'lucide-react';
import { ReportesKpis as KpiType } from '@/modules/reportes/reportes.types';
import styles from './reportes.module.css';

interface ReportesKpisProps {
  kpis: KpiType;
}

export const ReportesKpis: React.FC<ReportesKpisProps> = ({ kpis }) => {
  const kpiData = [
    { label: 'Total reportes', value: kpis.total, icon: <BarChart3 size={20} />, color: '#6366f1', bg: 'rgba(99,102,241,0.16)' },
    { label: 'Plantilla oficial', value: kpis.conPlantilla, icon: <FileCheck size={20} />, color: '#22c55e', iconBg: 'rgba(34,197,94,0.16)' },
    { label: 'Reportes críticos', value: kpis.criticos, icon: <AlertOctagon size={20} />, color: '#ef4444', iconBg: 'rgba(239,68,68,0.16)' },
    { label: 'Reportes diarios', value: kpis.diarios, icon: <Clock4 size={20} />, color: '#8b5cf6', iconBg: 'rgba(139,92,246,0.16)' },
    { label: 'Por vencer', value: kpis.porVencer, icon: <FileClock size={20} />, color: '#f59e0b', iconBg: 'rgba(245,158,11,0.16)' },
    { label: 'Remitidos', value: kpis.remitidos, icon: <SendHorizontal size={20} />, color: '#14b8a6', iconBg: 'rgba(20,184,166,0.16)' },
  ];

  return (
    <div className={styles.kpiGrid}>
      {kpiData.map((kpi, index) => (
        <div key={index} className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <div className={styles.kpiIcon} style={{ backgroundColor: kpi.iconBg || kpi.bg, color: kpi.color }}>
              {kpi.icon}
            </div>
          </div>
          <div className={styles.kpiValue}>{kpi.value}</div>
          <div className={styles.kpiLabel}>{kpi.label}</div>
        </div>
      ))}
    </div>
  );
};
