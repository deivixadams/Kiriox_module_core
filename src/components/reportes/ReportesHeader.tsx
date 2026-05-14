'use client';

import React from 'react';
import { Plus, Download, ChevronRight } from 'lucide-react';
import styles from './reportes.module.css';

export const ReportesHeader: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.titleSection}>
        <div className={styles.breadcrumb}>
          Gestión <ChevronRight size={12} /> Dashboard Reportes
        </div>
        <h1>Reportes</h1>
        <p>Gestión y seguimiento de reportes regulatorios de la AFI ante la SMV.</p>
      </div>
      
      <div className={styles.actions}>
        <button className={styles.btnSecondary}>
          <Download size={18} /> Exportar
        </button>
        <button className={styles.btnPrimary}>
          <Plus size={18} /> Registrar reporte
        </button>
      </div>
    </header>
  );
};
