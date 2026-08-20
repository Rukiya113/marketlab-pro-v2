import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkAntichase(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  const risk=Math.abs(intent.entry-intent.invalidation);const reward=Math.abs(intent.target-intent.entry);const rr=risk>0?reward/risk:0;
  return {id:'antiChase',label:'Anti-chase / R:R',result:rr>=ctx.minRiskReward?'PASS':'FAIL',value:Number(rr.toFixed(2)),reason:rr>=ctx.minRiskReward?'Entry still preserves required reward/risk.':'Entry is too extended or reward/risk is insufficient.' };
}
