import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { cookies } from 'next/headers';
import { upstoxConfig } from '@/lib/upstox/config';
export async function GET(){const c=upstoxConfig(); if(!c)return NextResponse.json({error:'Upstox environment variables are not configured.'},{status:503}); const state=randomUUID(); (await cookies()).set('upstox_oauth_state',state,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:600,path:'/'}); const u=new URL('https://api.upstox.com/v2/login/authorization/dialog'); u.searchParams.set('response_type','code');u.searchParams.set('client_id',c.clientId);u.searchParams.set('redirect_uri',c.redirectUri);u.searchParams.set('state',state);return NextResponse.redirect(u);}
