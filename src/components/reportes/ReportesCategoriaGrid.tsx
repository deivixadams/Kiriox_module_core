'use client';

import React from 'react';
import { Reporte, ReporteCategoria } from '@/modules/reportes/reportes.types';
import { ReporteCard } from './ReporteCard';
import styles from './reportes.module.css';

interface ReportesCategoriaGridProps {
  categoria: ReporteCategoria;
  descripcion: string;
  reportes: Reporte[];
}

export const ReportesCategoriaGrid: React.FC<ReportesCategoriaGridProps> = ({ 
  categoria, 
  descripcion, 
  reportes 
}) => {
  if (reportes.length === 0) return null;

  return (
    <section className={styles.categorySection}>
      <div className={styles.categoryHeader}>
        <div className={styles.categoryInfo}>
          <h2>{categoria}</h2>
          <p>{descripcion}</p>
        </div>
        <div className={styles.categoryBadge}>
          {reportes.length} {reportes.length === 1 ? 'reporte' : 'reportes'}
        </div>
      </div>
      
      <div className={styles.reportGrid}>
        {reportes.map(reporte => (
          <ReporteCard key={reporte.id} reporte={reporte} />
        ))}
      </div>
    </section>
  );
};
