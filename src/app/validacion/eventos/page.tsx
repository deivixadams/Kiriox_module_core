import { redirect } from 'next/navigation';
import { getAuthContext } from '@/core/auth/auth-server';
import { HechosRelevantesTab } from '@/modules/hechos-relevantes/ui/components/HechosRelevantesTab';

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function EventosPage({ searchParams }: Props) {
  const auth = await getAuthContext();
  if (!auth) redirect('/login');

  const { tab } = await searchParams;

  if (!tab || tab === 'hechos-relevantes') {
    return (
      <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#f1f5f9' }}>
            Hechos Relevantes
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
            Monitoreo de eventos externos con impacto potencial en el perfil de riesgo.
          </p>
        </div>
        <HechosRelevantesTab />
      </div>
    );
  }

  redirect('/validacion/eventos?tab=hechos-relevantes');
}
