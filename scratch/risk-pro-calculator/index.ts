import React from 'react';
import { KirioxPluginContract, KirioxPluginContext } from "@/shared/contracts/plugins/plugin.contract";

// Definimos el componente del plugin directamente aquí
// El motor lo transpilará y lo inyectará en la zona correcta
const RiskCalculatorWidget = () => {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.05))',
      border: '1px solid rgba(59, 130, 246, 0.3)',
      borderRadius: '16px',
      padding: '1.25rem',
      color: '#f1f5f9',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      backdropFilter: 'blur(8px)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          borderRadius: '10px', 
          background: '#3b82f6', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontSize: '1.2rem'
        }}>
          📊
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Calculador Pro</h4>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8' }}>Análisis predictivo activo</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Confianza</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#60a5fa' }}>98.2%</div>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '10px' }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Severidad Est.</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f87171' }}>Alta</div>
        </div>
      </div>

      <button style={{
        marginTop: '1rem',
        width: '100%',
        padding: '0.6rem',
        borderRadius: '8px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#e2e8f0',
        fontSize: '0.75rem',
        fontWeight: 700,
        cursor: 'pointer'
      }}>
        Ver reporte detallado
      </button>
    </div>
  );
};

export const plugin: KirioxPluginContract = {
  manifest: {
    id: "risk-pro-calculator",
    name: "Calculador de Riesgo Pro",
    version: "1.0.0",
    description: "Algoritmo avanzado para el cálculo de severidad y frecuencia basado en datos históricos.",
    author: "Kiriox Labs",
    status: "active",
    permissions: ["read:risk", "write:risk", "register:ui"],
    extensionPoints: ["linear-risk:dashboard:widget"],
    dependencies: []
  },

  async activate(context: KirioxPluginContext) {
    console.log("[RiskPro] Activando con UI Sandbox...");
  },

  // Aquí es donde el plugin "entrega" sus componentes a Kiriox
  uiContributions: {
    "linear-risk:dashboard:widget": RiskCalculatorWidget
  }
};

export default plugin;
