import {NextRequest,NextResponse} from 'next/server';
import {cookies} from 'next/headers';
import {upstoxConfig} from '@/lib/upstox/config';
import {setToken} from '@/lib/upstox/session';

function redirect(origin:string,state:string){return NextResponse.redirect(new URL(`/?upstox=${encodeURIComponent(state)}`,origin));}
export async function GET(req:NextRequest){
 const c=upstoxConfig();if(!c)return NextResponse.json({error:'Upstox environment variables are not configured.'},{status:503});
 const origin=new URL(c.redirectUri).origin;const code=req.nextUrl.searchParams.get('code');const state=req.nextUrl.searchParams.get('state');const jar=await cookies();const expected=jar.get('upstox_oauth_state')?.value;jar.delete('upstox_oauth_state');
 if(!code||!state||!expected||state!==expected)return redirect(origin,'state_error');
 const body=new URLSearchParams({code,client_id:c.clientId,client_secret:c.clientSecret,redirect_uri:c.redirectUri,grant_type:'authorization_code'});
 try{const r=await fetch('https://api.upstox.com/v2/login/authorization/token',{method:'POST',headers:{accept:'application/json','Content-Type':'application/x-www-form-urlencoded'},body,cache:'no-store'});if(!r.ok){console.error('[UPSTOX] token exchange',r.status,await r.text());return redirect(origin,'token_error');}const data=await r.json() as {access_token?:string};if(!data.access_token)return redirect(origin,'token_error');await setToken(data.access_token);return redirect(origin,'connected');}catch(error){console.error('[UPSTOX] callback',error);return redirect(origin,'token_error');}
}
