'use client';
import DerivativesWorkspace from '@/components/DerivativesWorkspace';
import {useWorkstation} from '@/components/WorkstationProvider';
export default function DerivativesPage(){const{instrumentId}=useWorkstation();return <main style={{padding:12}}><DerivativesWorkspace instrumentId={instrumentId}/></main>}
