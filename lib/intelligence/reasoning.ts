import type { AsuraDecision, EvidenceItem } from './contracts';

export interface ReasoningNarrative {
  thesis: string;
  evidence: string[];
  counterThesis: string[];
  waitingFor: string[];
  invalidation: string;
  confidenceExplanation: string;
}

function strongest(items: EvidenceItem[], status: EvidenceItem['status'], limit: number): string[] {
  return items
    .filter((item) => item.status === status)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((item) => `${item.label}: ${item.reason}`);
}

export function buildReasoning(decision: AsuraDecision): ReasoningNarrative {
  const selected = decision.competition.selected;
  const evidence = strongest(decision.evidence, 'PASS', 8);
  const warnings = strongest(decision.evidence, 'WARN', 5);
  const thesis = selected
    ? `${decision.direction} thesis. ${selected.label} leads strategy competition at ${selected.score}. ${decision.context.summary} ${decision.setup.summary} ${decision.execution.summary}`
    : `${decision.context.direction} context exists, but no strategy is eligible. ${decision.summary}`;
  const counterThesis = [...new Set([...decision.counterThesis, ...warnings])].slice(0, 8);
  const invalidation = decision.invalidation == null
    ? 'No executable invalidation is available until a directional setup exists.'
    : `The current trade thesis invalidates near ${decision.invalidation.toFixed(2)}, subject to live instrument tick-size handling.`;
  const confidenceExplanation = `Direction ${decision.directionProbability}%, setup ${decision.setupQuality}, location ${decision.locationQuality}, execution ${decision.executionQuality}, data ${decision.dataQuality}, risk ${decision.riskQuality}, uncertainty ${decision.uncertainty}.`;
  return { thesis, evidence, counterThesis, waitingFor: decision.waitingFor, invalidation, confidenceExplanation };
}
