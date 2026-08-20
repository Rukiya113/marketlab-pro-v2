import type {CanonicalInstrumentId} from './events';
export interface CatalogInstrument{id:CanonicalInstrumentId;label:string;group:'INDICES'|'SECTORS'|'STOCKS'}
export const MARKET_CATALOG:CatalogInstrument[]=[
{id:'IN:NSE:INDEX:NIFTY50',label:'NIFTY 50',group:'INDICES'},{id:'IN:NSE:INDEX:BANKNIFTY',label:'BANKNIFTY',group:'INDICES'},{id:'IN:BSE:INDEX:SENSEX',label:'SENSEX',group:'INDICES'},{id:'IN:NSE:INDEX:INDIAVIX',label:'INDIA VIX',group:'INDICES'},
{id:'IN:NSE:INDEX:NIFTYIT',label:'NIFTY IT',group:'SECTORS'},{id:'IN:NSE:INDEX:NIFTYBANK',label:'NIFTY BANK',group:'SECTORS'},{id:'IN:NSE:INDEX:NIFTYPHARMA',label:'NIFTY PHARMA',group:'SECTORS'},
{id:'IN:NSE:EQUITY:RELIANCE',label:'RELIANCE',group:'STOCKS'},{id:'IN:NSE:EQUITY:TCS',label:'TCS',group:'STOCKS'},{id:'IN:NSE:EQUITY:HDFCBANK',label:'HDFCBANK',group:'STOCKS'},{id:'IN:NSE:EQUITY:INFY',label:'INFY',group:'STOCKS'},{id:'IN:NSE:EQUITY:ICICIBANK',label:'ICICIBANK',group:'STOCKS'}];
export const displayName=(id:string)=>MARKET_CATALOG.find(x=>x.id===id)?.label??id.split(':').at(-1)??id;
