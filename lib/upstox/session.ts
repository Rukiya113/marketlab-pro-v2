import { cookies } from 'next/headers';
import { getGatewayToken, persistGatewayToken, removeGatewayToken } from './token-store';

const TOKEN='mlp_upstox_token';
const ISSUED='mlp_upstox_issued_at';

export function nextExpiryFrom(issuedAtMs:number):number{
  const IST=5.5*60*60*1000;const d=new Date(issuedAtMs+IST);const e=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),3,30,0));
  if(d.getUTCHours()>3||(d.getUTCHours()===3&&d.getUTCMinutes()>=30))e.setUTCDate(e.getUTCDate()+1);
  return e.getTime()-IST;
}

export async function setToken(token:string){
  const now=Date.now();const expiresAt=nextExpiryFrom(now);const maxAge=Math.max(60,Math.floor((expiresAt-now)/1000));
  const jar=await cookies();const common={httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax' as const,path:'/',maxAge};
  jar.set(TOKEN,token,common);jar.set(ISSUED,String(now),common);
  await persistGatewayToken(token,maxAge);
}

export async function getToken(){
  const jar=await cookies();const cookieToken=jar.get(TOKEN)?.value??null;
  return cookieToken??await getGatewayToken();
}

export type SessionState='DISCONNECTED'|'CONNECTED'|'EXPIRED';
export async function getSessionState():Promise<SessionState>{
  const jar=await cookies();const cookieToken=jar.get(TOKEN)?.value??null;
  if(cookieToken){const issued=Number(jar.get(ISSUED)?.value??0);if(issued&&Date.now()>=nextExpiryFrom(issued))return 'EXPIRED';return 'CONNECTED';}
  return (await getGatewayToken())?'CONNECTED':'DISCONNECTED';
}

export async function clearToken(){const jar=await cookies();jar.delete(TOKEN);jar.delete(ISSUED);await removeGatewayToken();}
