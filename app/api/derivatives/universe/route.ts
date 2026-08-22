import {NextRequest,NextResponse} from 'next/server';
import type {CanonicalInstrumentId} from '@/lib/market/events';
import {loadDerivativeUniverse} from '@/lib/derivatives/upstox';
import {getSessionState} from '@/lib/upstox/session';
export const dynamic='force-dynamic';
export async function GET(r:NextRequest){
 const id=(r.nextUrl.searchParams.get('instrument')??'IN:NSE:INDEX:NIFTY50') as CanonicalInstrumentId;
 const session=await getSessionState();
 if(session!=='CONNECTED') return NextResponse.json({underlyingId:id,state:'OFFLINE',contracts:[],updatedAt:Date.now(),runtime:{session,reason:'Connect Upstox to load the live derivative universe.'}},{headers:{'Cache-Control':'no-store'}});
 try{return NextResponse.json(await loadDerivativeUniverse(id,r.nextUrl.searchParams.get('refresh')==='1'),{headers:{'Cache-Control':'no-store'}})}catch(error){return NextResponse.json({underlyingId:id,state:'OFFLINE',contracts:[],updatedAt:Date.now(),runtime:{session,reason:error instanceof Error?error.message:'Derivative runtime failed.'}},{status:502,headers:{'Cache-Control':'no-store'}})}
}
