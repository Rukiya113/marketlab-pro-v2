'use client';

import XRayWorkspace from '@/components/XRayWorkspace';
import { useWorkstation } from '@/components/WorkstationProvider';

export default function XRayPage() {
  const { instrumentId } = useWorkstation();

  return (
    <main style={{ padding: 12 }}>
      <XRayWorkspace instrumentId={instrumentId} interval="5m" />
    </main>
  );
}
