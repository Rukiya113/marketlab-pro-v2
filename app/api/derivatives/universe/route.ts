import {NextRequest,NextResponse} from 'next/server';
import type {CanonicalInstrumentId} from '@/lib/market/events';
import type {DerivativeUniverse} from '@/lib/derivatives/types';
import {getDerivativeUniverse,setDerivativeUniverse} from '@/lib/derivatives/store';
export const dynamic='force-dynamic';
export async function GET(r:NextRequest){const id=(r.nextUrl.searchParams.get('instrument')??'IN:NSE:INDEX:NIFTY50') as CanonicalInstrumentId;return NextResponse.json(getDerivativeUniverse(id),{headers:{'Cache-Control':'no-store'}})}
export async function POST(r:NextRequest){const universe=await r.json() as DerivativeUniverse;setDerivativeUniverse({...universe,updatedAt:Date.now()});return NextResponse.json({ok:true,count:universe.contracts.length})}
