import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkCooldown(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  if(ctx.lastTradeAt==null)return { id:'cooldown',label:'Cooldown',result:'PASS',value:null,reason:'No previous trade cooldown applies.'};const elapsed=ctx.now-ctx.lastTradeAt;
  return {id:'cooldown',label:'Cooldown',result:elapsed>=ctx.cooldownMs?'PASS':'WAIT',value:elapsed,reason:elapsed>=ctx.cooldownMs?'Cooldown completed.':'Trade cooldown is still active.' };
}
