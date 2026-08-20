import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkFrequency(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  return { id:'frequency',label:'Trade frequency',result:ctx.tradesToday<ctx.maxTradesPerDay?'PASS':'FAIL',value:ctx.tradesToday,reason:ctx.tradesToday<ctx.maxTradesPerDay?'Daily trade-count policy allows another trade.':'Maximum daily trade count reached.' };
}
