import type { ExecutionIntent, GateCheck, SentinelContext } from '../contracts';
export function checkDataquality(intent: ExecutionIntent, ctx: SentinelContext): GateCheck {
  void ctx;
  return {id:'dataQuality',label:'Data quality',result:intent.dataQuality>=85?'PASS':intent.dataQuality>=70?'WAIT':'FAIL',value:intent.dataQuality,reason:intent.dataQuality>=85?'Canonical data quality is healthy.':'Data quality is below the preferred execution threshold.' };
}
