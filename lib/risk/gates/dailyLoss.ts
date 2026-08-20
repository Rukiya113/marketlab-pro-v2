import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkDailyloss(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  return { id:'dailyLoss',label:'Daily loss',result:ctx.dailyPnlR>-Math.abs(ctx.maxDailyLossR)?'PASS':'FAIL',value:ctx.dailyPnlR,reason:ctx.dailyPnlR>-Math.abs(ctx.maxDailyLossR)?'Daily loss limit is intact.':'Daily loss limit reached.' };
}
