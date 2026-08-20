export type HealthState = 'HEALTHY' | 'DEGRADED' | 'STALE' | 'OFFLINE' | 'BLOCKED' | 'UNKNOWN';

export interface DiagnosticComponent {
  id: string;
  label: string;
  state: HealthState;
  detail: string;
  lastEventAt: number | null;
  ageMs: number | null;
  latencyMs: number | null;
  blocking: boolean;
}

export interface SystemPulseSnapshot {
  generatedAt: number;
  overall: HealthState;
  readyForAnalysis: boolean;
  readyForPaperExecution: boolean;
  components: DiagnosticComponent[];
  blockers: string[];
}
