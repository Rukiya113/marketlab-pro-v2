import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkExpectedvalue(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  if(intent.expectedValueR==null)return { id:'expectedValue',label:'Expected value',result:'WAIT',value:null,reason:'Net expected value is not available.'};
  return {id:'expectedValue',label:'Expected value',result:intent.expectedValueR>=ctx.minExpectedValueR?'PASS':'FAIL',value:intent.expectedValueR,reason:intent.expectedValueR>=ctx.minExpectedValueR?'Expected value clears policy.':'Expected value is below policy.' };
}
