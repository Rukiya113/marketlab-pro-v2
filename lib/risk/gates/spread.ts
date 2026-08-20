import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkSpread(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  if(intent.estimatedSpreadPct==null)return { id:'spread',label:'Spread',result:'WAIT',value:null,reason:'Spread is not measured.'};
  return {id:'spread',label:'Spread',result:intent.estimatedSpreadPct<=ctx.maxSpreadPct?'PASS':'FAIL',value:intent.estimatedSpreadPct,reason:intent.estimatedSpreadPct<=ctx.maxSpreadPct?'Spread is within policy.':'Spread exceeds policy.' };
}
