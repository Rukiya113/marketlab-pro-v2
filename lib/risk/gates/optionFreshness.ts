import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkOptionfreshness(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  if(intent.optionQuoteAgeMs==null)return { id:'optionFreshness',label:'Option freshness',result:'WAIT',value:null,reason:'Option quote freshness is unavailable.'};
  return {id:'optionFreshness',label:'Option freshness',result:intent.optionQuoteAgeMs<=ctx.maxOptionQuoteAgeMs?'PASS':'FAIL',value:intent.optionQuoteAgeMs,reason:intent.optionQuoteAgeMs<=ctx.maxOptionQuoteAgeMs?'Option quote is fresh.':'Option quote is stale.' };
}
