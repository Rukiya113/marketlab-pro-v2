import type { ContextBrainResult, ExecutionBrainResult, SetupBrainResult, StrategyEvaluation } from '../contracts';
export interface StrategyContext { context: ContextBrainResult; setup: SetupBrainResult; execution: ExecutionBrainResult; }
export type StrategyEvaluator = (input: StrategyContext) => StrategyEvaluation;
