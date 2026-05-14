'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Download, 
  History, 
  Send,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { Reporte } from '@/modules/reportes/reportes.types';
import styles from './reportes.module.css';

interface ReporteCardProps {
  reporte: Reporte;
}

export const ReporteCard: React.FC<ReporteCardProps> = ({ reporte }) => {
  const getStatusClass = (estado: string) => {
    switch (estado) {
      case 'pendiente': return styles.statusPendiente;
      case 'remitido': return styles.statusRemitido;
      case 'observado': return styles.statusObservado;
      case 'vencido': return styles.statusVencido;
      case 'en_preparacion': return styles.statusEnPreparacion;
      default: return '';
    }
  };

  const getCriticidadClass = (criticidad: string) => {
    switch (criticidad) {
      case 'alta': return styles.criticidadAlta;
      case 'media': return styles.criticidadMedia;
      case 'baja': return styles.criticidadBaja;
      default: return '';
    }
  };

  const normalizedName = reporte.nombre.toLowerCase().trim();
  const hasEndpoint = normalizedName === "porcentaje de liquidez";
  const slug = normalizedName.replace(/ /g, '-');

  const cardBody = (
    <>
      <div className={styles.reportCardHeader}>
        <h3 className={styles.reportName}>{reporte.nombre}</h3>
        <span className={`${styles.criticidadBadge} ${getCriticidadClass(reporte.criticidad)}`}>
          {reporte.criticidad}
        </span>
      </div>

      <div className={`${styles.statusBadge} ${getStatusClass(reporte.estado)}`}>
        {reporte.estado === 'remitido' && <CheckCircle2 size={14} />}
        {reporte.estado === 'vencido' && <ShieldAlert size={14} />}
        {reporte.estado === 'observado' && <Eye size={14} />}
        {reporte.estado === 'pendiente' && <Clock size={14} />}
        {reporte.estado === 'en_preparacion' && <Activity size={14} />}
        {reporte.estado.replace('_', ' ')}
      </div>

      <div className={styles.reportMeta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Periodicidad</span>
          <span className={styles.metaValue}><Calendar size={14} color="#94a3b8" /> {reporte.periodicidad}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Responsable</span>
          <span className={styles.metaValue}><User size={14} color="#94a3b8" /> {reporte.responsable}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>F. Límite</span>
          <span className={styles.metaValue}>{reporte.fechaLimite || '-'}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>U. Remisión</span>
          <span className={styles.metaValue}>{reporte.ultimaRemision || '-'}</span>
        </div>
      </div>

      <div className={styles.metaItem}>
        <span className={styles.metaLabel}>Plantilla Oficial</span>
        <span className={styles.metaValue} style={{ color: reporte.plantillaOficial ? '#22c55e' : '#94a3b8' }}>
          {reporte.plantillaOficial ? 'Sí (SMV)' : 'No'}
        </span>
      </div>
    </>
  );

  return (
    <div className={`${styles.reportCard} ${hasEndpoint ? styles.clickableCard : ''}`}>
      {hasEndpoint ? (
        <Link href={`/gestion/dashboard_reportes/${slug}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          {cardBody}
        </Link>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
          {cardBody}
        </div>
      )}

      <div className={styles.reportFooter}>
        {hasEndpoint ? (
          <Link href={`/gestion/dashboard_reportes/${slug}`} style={{ textDecoration: 'none' }}>
            <button className={styles.cardAction}>
              <FileText size={14} /> Detalle
            </button>
          </Link>
        ) : (
          <button className={styles.cardAction}>
            <FileText size={14} /> Detalle
          </button>
        )}
        <button className={styles.cardAction} disabled={!reporte.plantillaOficial}>
          <Download size={14} /> Plantilla
        </button>
        <button className={`${styles.cardAction} ${styles.cardActionPrimary}`}>
          <Send size={14} /> Remitir
        </button>
        <button className={styles.cardAction}>
          <History size={14} /> Histórico
        </button>
      </div>
    </div>
  );
};
