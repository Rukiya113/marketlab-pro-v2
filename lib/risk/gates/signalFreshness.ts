import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkSignalfreshness(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  const age=ctx.now-intent.signalAt;
  return {id:'signalFreshness',label:'Signal freshness',result:age<=ctx.maxSignalAgeMs?'PASS':'FAIL',value:age,reason:age<=ctx.maxSignalAgeMs?'Execution evidence is fresh.':'Execution evidence expired.' };
}
