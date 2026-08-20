import type { DiscoveryInstrument } from './types';

export const DISCOVERY_CATALOG: DiscoveryInstrument[] = [
  { id: 'IN:NSE:INDEX:NIFTY50', symbol: 'NIFTY 50', name: 'NIFTY 50', group: 'INDEX', exchange: 'NSE' },
  { id: 'IN:NSE:INDEX:BANKNIFTY', symbol: 'BANKNIFTY', name: 'NIFTY Bank', group: 'INDEX', exchange: 'NSE' },
  { id: 'IN:NSE:INDEX:FINNIFTY', symbol: 'FINNIFTY', name: 'NIFTY Financial Services', group: 'INDEX', exchange: 'NSE' },
  { id: 'IN:NSE:INDEX:MIDCPNIFTY', symbol: 'MIDCPNIFTY', name: 'NIFTY Midcap Select', group: 'INDEX', exchange: 'NSE' }
];

export function searchCatalog(query: string): DiscoveryInstrument[] {
  const q = query.trim().toLowerCase();
  if (!q) return DISCOVERY_CATALOG;
  return DISCOVERY_CATALOG.filter((item) =>
    `${item.symbol} ${item.name} ${item.exchange}`.toLowerCase().includes(q),
  );
}
