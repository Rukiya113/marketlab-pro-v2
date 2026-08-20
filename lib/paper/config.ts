export interface PaperBrokerConfig {
  startingCapital: number;
  slippageBps: number;
  chargeBps: number;
  maxOrderQuantity: number;
  maxQuoteAgeMs: number;
}

export const DEFAULT_PAPER_BROKER_CONFIG: PaperBrokerConfig = {
  startingCapital: 1_000_000,
  slippageBps: 2,
  chargeBps: 3,
  maxOrderQuantity: 100_000,
  maxQuoteAgeMs: 15_000,
};
