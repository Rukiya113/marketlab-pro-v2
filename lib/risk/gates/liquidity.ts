import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkLiquidity(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  if(intent.optionLiquidityScore==null)return { id:'liquidity',label:'Liquidity',result:'WAIT',value:null,reason:'Option liquidity is not measured.'};
  return {id:'liquidity',label:'Liquidity',result:intent.optionLiquidityScore>=ctx.minLiquidityScore?'PASS':'FAIL',value:intent.optionLiquidityScore,reason:intent.optionLiquidityScore>=ctx.minLiquidityScore?'Liquidity is acceptable.':'Liquidity quality is below threshold.' };
}
