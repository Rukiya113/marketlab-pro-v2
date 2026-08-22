import {NextRequest,NextResponse} from 'next/server';
import type {CanonicalInstrumentId} from '@/lib/market/events';
import {emptyOptionChain,getOptionChain} from '@/lib/options/store';
import {loadDerivativeUniverse} from '@/lib/derivatives/upstox';
import {getSessionState} from '@/lib/upstox/session';
export const dynamic='force-dynamic';
export async function GET(r:NextRequest){
 const id=(r.nextUrl.searchParams.get('instrument')??'IN:NSE:INDEX:NIFTY50') as CanonicalInstrumentId;
 if(await getSessionState()==='CONNECTED'){try{await loadDerivativeUniverse(id,r.nextUrl.searchParams.get('refresh')==='1')}catch{}}
 return NextResponse.json(getOptionChain(id)??emptyOptionChain(id),{headers:{'Cache-Control':'no-store'}});
}
