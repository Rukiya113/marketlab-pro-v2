import type { ExecutionIntent, GateCheck, SentinelContext, SentinelReport } from './contracts';
import { checkDataquality } from './gates/dataQuality';
import { checkFeedfreshness } from './gates/feedFreshness';
import { checkSignalfreshness } from './gates/signalFreshness';
import { checkAntichase } from './gates/antiChase';
import { checkSpread } from './gates/spread';
import { checkLiquidity } from './gates/liquidity';
import { checkOptionfreshness } from './gates/optionFreshness';
import { checkDuplicate } from './gates/duplicate';
import { checkCooldown } from './gates/cooldown';
import { checkFrequency } from './gates/frequency';
import { checkDailyloss } from './gates/dailyLoss';
import { checkExpectedvalue } from './gates/expectedValue';

export function evaluateSentinel(intent: ExecutionIntent, context: SentinelContext): SentinelReport {
  const checks: GateCheck[] = [
    checkDataquality(intent, context), checkFeedfreshness(intent, context), checkSignalfreshness(intent, context),
    checkAntichase(intent, context), checkSpread(intent, context), checkLiquidity(intent, context), checkOptionfreshness(intent, context),
    checkDuplicate(intent, context), checkCooldown(intent, context), checkFrequency(intent, context), checkDailyloss(intent, context), checkExpectedvalue(intent, context),
  ];
  const failed = checks.filter((check) => check.result === 'FAIL');
  const waiting = checks.filter((check) => check.result === 'WAIT');
  const decision = failed.length ? 'BLOCKED' : waiting.length ? 'WAIT' : 'APPROVED';
  return { decision, at: context.now, checks, reasons: (failed.length ? failed : waiting).map((check) => `${check.label}: ${check.reason}`) };
}
