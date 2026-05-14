'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import styles from '@/components/reportes/ReporteDetalleForm.module.css';

export default function ReporteDetallePage({ params: paramsPromise }: { params: Promise<{ reporteSlug: string }> }) {
  const params = use(paramsPromise);
  const rawTitle = params.reporteSlug.replace(/-/g, ' ');
  const title = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);

  const columns = [
    "Fecha dia t",
    "No. Registro Fondo",
    "Nombre de la institución financiera",
    "Tipo de Instrumento",
    "Moneda",
    "Balance al cierre del día t",
    "Diferencia cambiaria",
    "Valor en libro del instrumento"
  ];

  // Generate 20 empty rows for the spreadsheet effect
  const rows = Array.from({ length: 25 });

  return (
    <div className={styles.container}>
      <Link href="/gestion/dashboard_reportes" className={styles.backLink}>
        <ArrowLeft size={16} /> Volver al dashboard
      </Link>

      <div className={styles.paper}>
        <div className={styles.formHeader}>
          <h1>{title}</h1>
          <p>Operaciones realizadas por los Patrimonios Autónomos</p>
          <span>Versión 1.0</span>
        </div>

        <div className={styles.topBar}>
          <table className={styles.metadataTable}>
            <tbody>
              <tr>
                <td className={styles.labelCell}>No. Registro</td>
                <td className={styles.valueCell}></td>
              </tr>
              <tr>
                <td className={styles.labelCell}>Periodo:</td>
                <td className={styles.valueCell}></td>
              </tr>
            </tbody>
          </table>

          <div className={styles.buttonGroup}>
            <button className={`${styles.btnAction} ${styles.btnSave}`}>
              <Save size={18} /> Grabar Datos
            </button>
            <button className={`${styles.btnAction} ${styles.btnClear}`}>
              Limpiar
            </button>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                {columns.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((_, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((_, colIndex) => (
                    <td key={colIndex}></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
