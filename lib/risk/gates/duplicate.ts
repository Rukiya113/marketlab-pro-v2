import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkDuplicate(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  return { id:'duplicate',label:'Duplicate intent',result:ctx.duplicateIntent?'FAIL':'PASS',value:ctx.duplicateIntent,reason:ctx.duplicateIntent?'Equivalent execution intent already exists.':'No duplicate intent detected.' };
}
