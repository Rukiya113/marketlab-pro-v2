'use client';
import type { AsuraDecision } from '@/lib/intelligence/contracts';
export default function AsuraDecisionPanel({ decision }: { decision: AsuraDecision | null }) {
  if (!decision) return <div className="xrayEmpty">ASURA is waiting for canonical 15m/5m/1m evidence.</div>;
  const rows = [
    ['Direction', `${decision.direction} ${decision.directionProbability}%`], ['Regime', decision.regime], ['Strategy', decision.competition.selected?.label ?? 'NO ELIGIBLE STRATEGY'],
    ['Setup', decision.setupQuality], ['Location', decision.locationQuality], ['Execution', decision.executionQuality], ['Data', decision.dataQuality],
    ['Risk', decision.riskQuality], ['Uncertainty', decision.uncertainty], ['Opportunity', decision.opportunityScore],
  ];
  return <div className="asuraDecision"><div className="asuraTwin"><section><h4>DECISION STACK</h4>{rows.map(([label, value]) => <p key={String(label)}><span>{label}</span><b>{String(value)}</b></p>)}</section><section><h4>WAITING FOR</h4>{decision.waitingFor.length ? decision.waitingFor.map((item) => <p key={item}><span>•</span><b>{item}</b></p>) : <p><span>✓</span><b>Sentinel review</b></p>}</section></div><section className="recentActivity"><h4>EVIDENCE</h4>{decision.evidence.filter((item) => item.status === 'PASS').slice(0, 6).map((item) => <p key={item.id}><i/> {item.reason}</p>)}</section><section className="recentActivity"><h4>COUNTER-THESIS</h4>{decision.counterThesis.length ? decision.counterThesis.slice(0, 6).map((item) => <p key={item}><i/> {item}</p>) : <p><i/> No material counter-thesis detected.</p>}</section></div>;
}
