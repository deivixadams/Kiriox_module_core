import { Suspense } from 'react';
import GovernanceActivityNewPage from './GovernanceActivityNewPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--secondary)' }}>Cargando...</div>}>
      <GovernanceActivityNewPage />
    </Suspense>
  );
}
