import type { DiagnosticComponent, HealthState, SystemPulseSnapshot } from './types';

type Inputs = {
  gateway?: Record<string, unknown> | null;
  intelligence?: Record<string, unknown> | null;
  paper?: Record<string, unknown> | null;
  memory?: Record<string, unknown> | null;
};

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function component(
  id: string,
  label: string,
  state: HealthState,
  detail: string,
  lastEventAt: number | null,
  blocking: boolean,
  latencyMs: number | null = null,
): DiagnosticComponent {
  return {
    id,
    label,
    state,
    detail,
    lastEventAt,
    ageMs: lastEventAt == null ? null : Math.max(0, Date.now() - lastEventAt),
    latencyMs,
    blocking,
  };
}

export function buildSystemPulse(input: Inputs): SystemPulseSnapshot {
  const gateway = record(input.gateway);
  const intelligence = record(input.intelligence);
  const decision = record(intelligence?.decision);
  const opportunity = record(intelligence?.opportunity);
  const sentinel = record(intelligence?.sentinel);
  const portfolio = record(intelligence?.portfolio);
  const paper = record(input.paper);
  const memory = record(input.memory);

  const gatewayState = String(gateway?.state ?? 'OFFLINE');
  const gatewayAt = numberValue(gateway?.at);
  const gatewayHealthy = gatewayState === 'LIVE';

  const decisionAt =
    numberValue(decision?.at) ??
    numberValue(decision?.createdAt) ??
    numberValue(intelligence?.updatedAt);

  const sentinelDecision = String(
    sentinel?.decision ?? sentinel?.state ?? 'BLOCKED',
  );

  const portfolioDecision = String(
    portfolio?.decision ?? portfolio?.state ?? 'BLOCKED',
  );

  const components: DiagnosticComponent[] = [
    component(
      'gateway',
      'Market Gateway',
      gatewayHealthy ? 'HEALTHY' : gatewayState === 'RECONNECTING' ? 'DEGRADED' : 'OFFLINE',
      gatewayState,
      gatewayAt,
      true,
      numberValue(gateway?.latencyMs),
    ),
    component(
      'candles',
      'Canonical Candles',
      decision ? 'HEALTHY' : gatewayHealthy ? 'DEGRADED' : 'OFFLINE',
      decision ? 'Multi-timeframe evidence arriving' : 'Waiting for canonical candle evidence',
      decisionAt,
      true,
    ),
    component(
      'asura',
      'ASURA',
      decision ? 'HEALTHY' : 'BLOCKED',
      decision
        ? String(decision.action ?? decision.state ?? 'ANALYZING')
        : 'Waiting for Context / Setup / Execution evidence',
      decisionAt,
      true,
    ),
    component(
      'opportunity',
      'Opportunity Engine',
      opportunity ? 'HEALTHY' : 'BLOCKED',
      opportunity
        ? String(opportunity.state ?? 'ACTIVE')
        : 'No qualified opportunity',
      numberValue(opportunity?.updatedAt) ?? decisionAt,
      false,
    ),
    component(
      'sentinel',
      'Sentinel',
      sentinelDecision === 'APPROVE'
        ? 'HEALTHY'
        : sentinelDecision === 'WAIT'
          ? 'DEGRADED'
          : 'BLOCKED',
      sentinelDecision,
      numberValue(sentinel?.at) ?? decisionAt,
      true,
    ),
    component(
      'portfolio',
      'Portfolio Governor',
      portfolioDecision === 'APPROVE' ? 'HEALTHY' : 'BLOCKED',
      portfolioDecision,
      numberValue(portfolio?.at) ?? decisionAt,
      true,
    ),
    component(
      'paper',
      'Paper Broker',
      paper ? 'HEALTHY' : 'UNKNOWN',
      paper ? 'PAPER mode available' : 'Paper state unavailable',
      numberValue(paper?.updatedAt),
      false,
    ),
    component(
      'memory',
      'Journal / Memory',
      memory ? 'HEALTHY' : 'UNKNOWN',
      memory
        ? `${Number(memory.totalTrades ?? 0)} completed observations`
        : 'Memory state unavailable',
      numberValue(memory?.generatedAt),
      false,
    ),
  ];

  const blockers = components
    .filter((item) => item.blocking && item.state !== 'HEALTHY')
    .map((item) => `${item.label}: ${item.detail}`);

  const readyForAnalysis =
    gatewayHealthy &&
    components.find((item) => item.id === 'asura')?.state === 'HEALTHY';

  const readyForPaperExecution =
    readyForAnalysis &&
    sentinelDecision === 'APPROVE' &&
    portfolioDecision === 'APPROVE';

  let overall: HealthState = 'HEALTHY';
  if (!gatewayHealthy) overall = 'OFFLINE';
  else if (blockers.length) overall = 'BLOCKED';
  else if (components.some((item) => item.state === 'DEGRADED')) overall = 'DEGRADED';

  return {
    generatedAt: Date.now(),
    overall,
    readyForAnalysis,
    readyForPaperExecution,
    components,
    blockers,
  };
}
