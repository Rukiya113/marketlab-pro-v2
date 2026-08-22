import {NextRequest,NextResponse} from 'next/server';
import {clearToken,setToken} from '@/lib/upstox/session';
export async function POST(req:NextRequest){const body=await req.json() as {token?:string};const token=body.token?.trim();if(!token)return NextResponse.json({error:'Access token is required.'},{status:400});const probe=await fetch('https://api.upstox.com/v2/user/profile',{headers:{Accept:'application/json',Authorization:`Bearer ${token}`},cache:'no-store'});if(!probe.ok)return NextResponse.json({error:'Upstox rejected this access token.'},{status:401});await setToken(token);return NextResponse.json({ok:true,connected:true});}
export async function DELETE(){await clearToken();return NextResponse.json({ok:true});}
