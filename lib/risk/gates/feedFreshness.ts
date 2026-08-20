import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkFeedfreshness(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  if(ctx.feedAgeMs==null)return { id:'feedFreshness',label:'Feed freshness',result:'WAIT',value:null,reason:'Feed age is unavailable.'};
  return {id:'feedFreshness',label:'Feed freshness',result:ctx.feedAgeMs<=ctx.maxFeedAgeMs?'PASS':'FAIL',value:ctx.feedAgeMs,reason:ctx.feedAgeMs<=ctx.maxFeedAgeMs?'Market feed is fresh.':'Market feed is stale.' };
}
