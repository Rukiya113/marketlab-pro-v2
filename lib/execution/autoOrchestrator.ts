import type { CanonicalInstrumentId } from '@/lib/market/events';
import type { IntelligenceStatePayload } from '@/lib/intelligence/serialize';
import { evaluatePortfolio } from '@/lib/risk/portfolio';
import type { PortfolioDecision, PortfolioPolicy, PortfolioState } from '@/lib/risk/contracts';
import { settingsStore } from '@/lib/settings/singleton';
import { paperBroker } from '@/lib/paper/singleton';
import { getDerivativeUniverse } from '@/lib/derivatives/store';
import type { DerivativeContract } from '@/lib/derivatives/types';
import { captureRuntimePaperState } from '@/lib/integration/journalBridge';

export interface AutoExecutionResult { state:'DISABLED'|'BLOCKED'|'WAIT'|'SUBMITTED'|'DUPLICATE'; reason:string; orderId?:string; contract?:string; portfolio:PortfolioDecision|null; at:number }
const submitted = new Set<string>();

export function runAutoPaper(instrumentId:CanonicalInstrumentId, state:IntelligenceStatePayload):AutoExecutionResult {
  const settings=settingsStore.get().settings;
  if(!settings.system.autoExecutionEnabled)return result('DISABLED','Auto execution is disabled.',null);
  if(settings.system.emergencyKillSwitch)return result('BLOCKED','Emergency kill switch is active.',null);
  if(settings.system.executionMode!=='PAPER')return result('BLOCKED','Only AUTO PAPER is enabled in this build. Live broker execution is locked.',null);
  const d=state.decision,o=state.opportunity,s=state.sentinel;
  if(!d||!o)return result('WAIT','ASURA opportunity is not ready.',null);
  if(d.state!=='READY'||o.state!=='READY')return result('WAIT','ASURA/Opportunity lifecycle is not READY.',null);
  if(d.opportunityScore<settings.asura.minOpportunityScore||d.context.probability<settings.asura.minContextScore||d.setup.setupQuality<settings.asura.minSetupScore||d.execution.executionQuality<settings.asura.minExecutionScore||d.uncertainty>settings.asura.maxUncertainty)return result('BLOCKED','ASURA thresholds from Settings are not satisfied.',null);
  if(!s||s.decision!=='APPROVED')return result('BLOCKED','Sentinel has not approved the execution intent.',null);
  const snapshot=paperBroker.snapshot();
  const equity=Math.max(snapshot.account.equity,1);
  const pState:PortfolioState={equity,openRiskPct:(snapshot.account.openRisk/equity)*100,correlatedRiskPct:0,drawdownPct:Math.max(0,-snapshot.account.dailyPnl/equity*100),consecutiveLosses:consecutiveLosses(snapshot.trades.map(t=>t.netPnl)),openPositions:snapshot.positions.length};
  const policy:PortfolioPolicy={maxOpenRiskPct:settings.portfolio.maxPortfolioHeatPct,maxCorrelatedRiskPct:settings.portfolio.maxCorrelatedExposurePct,maxDrawdownPct:Math.max(0.1,settings.portfolio.maxDailyLossR*settings.portfolio.riskPerTradePct),maxPositions:3,maxConsecutiveLosses:settings.portfolio.maxConsecutiveLosses};
  const portfolio=evaluatePortfolio(pState,policy);
  if(!portfolio.allowed)return result('BLOCKED',portfolio.reasons.join(' '),portfolio);
  const key=o.id;
  if(submitted.has(key))return result('DUPLICATE','This opportunity was already submitted.',portfolio);
  const contract=selectContract(instrumentId,d.direction,settings.options);
  if(!contract)return result('WAIT','No eligible live option/future contract with a fresh executable quote is available.',portfolio);
  const derivativeId=`IN:NFO:DERIVATIVE:${encodeURIComponent(contract.instrumentKey)}` as CanonicalInstrumentId;
  const price=contract.last??(d.direction==='BULLISH'?contract.ask:contract.bid);
  if(price==null)return result('WAIT','Selected derivative has no executable quote.',portfolio);
  paperBroker.ingestQuote({instrumentId:derivativeId,bid:contract.bid,ask:contract.ask,last:contract.last,timestamp:contract.at??Date.now()});
  const order=paperBroker.submit({instrumentId:derivativeId,symbol:contract.symbol,side:'BUY',type:'MARKET',quantity:Math.max(1,contract.lotSize),strategy:d.competition.selected?.id??null,opportunityId:o.id,optionContractKey:contract.instrumentKey,stopLossPrice:null,takeProfitPrice:null,notes:`AUTO PAPER · ${d.direction} · score ${d.opportunityScore}`});
  if(order.status==='REJECTED')return result('BLOCKED',order.rejectionReason??'Paper broker rejected the order.',portfolio);
  submitted.add(key);captureRuntimePaperState();
  return {state:'SUBMITTED',reason:'ASURA + Sentinel + Portfolio approved. AUTO PAPER order submitted.',orderId:order.id,contract:contract.symbol,portfolio,at:Date.now()};
}
function selectContract(id:CanonicalInstrumentId,direction:string,p:{preferredAbsDeltaMin:number;preferredAbsDeltaMax:number;maxSpreadPct:number;minVolume:number;minOpenInterest:number;maxQuoteAgeMs:number;maxDistancePct:number}):DerivativeContract|null{
 const u=getDerivativeUniverse(id);if(u.state!=='LIVE')return null;const now=Date.now();const side=direction==='BULLISH'?'CE':'PE';
 const eligible=u.contracts.filter(c=>{if(c.at==null||now-c.at>p.maxQuoteAgeMs||c.bid==null||c.ask==null||c.ask<=0)return false;const spread=((c.ask-c.bid)/c.ask)*100;if(spread>p.maxSpreadPct)return false;if((c.volume??0)<p.minVolume||(c.oi??0)<p.minOpenInterest)return false;if(c.segment==='OPTIONS'){const delta=Math.abs(c.delta??0);return c.optionSide===side&&delta>=p.preferredAbsDeltaMin&&delta<=p.preferredAbsDeltaMax}return c.segment==='FUTURES'});
 eligible.sort((a,b)=>Number(b.segment==='OPTIONS')-Number(a.segment==='OPTIONS')||((b.volume??0)-(a.volume??0)));return eligible[0]??null;
}
function consecutiveLosses(values:number[]):number{let n=0;for(const v of values){if(v<0)n++;else break}return n}
function result(state:AutoExecutionResult['state'],reason:string,portfolio:PortfolioDecision|null):AutoExecutionResult{return{state,reason,portfolio,at:Date.now()}}
