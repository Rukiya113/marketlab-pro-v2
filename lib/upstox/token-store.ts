import { createClient } from 'redis';
const KEY='marketlab:upstox:access-token';
export async function persistGatewayToken(token:string, ttlSeconds:number){
  if(!process.env.REDIS_URL) return;
  const c=createClient({url:process.env.REDIS_URL}); await c.connect();
  try { await c.set(KEY, token, {EX:Math.max(60,ttlSeconds)}); } finally { await c.quit(); }
}
export async function removeGatewayToken(){
  if(!process.env.REDIS_URL) return;
  const c=createClient({url:process.env.REDIS_URL}); await c.connect(); try{await c.del(KEY);}finally{await c.quit();}
}
