import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from 'redis';

const KEY='marketlab:upstox:access-token';
const FILE=path.join(process.cwd(),'.marketlab','upstox-session.json');

type StoredSession={ciphertext:string;iv:string;tag:string;expiresAt:number};

function encryptionKey():Buffer|null{
  const secret=process.env.MARKETLAB_SESSION_SECRET??process.env.UPSTOX_CLIENT_SECRET;
  return secret?createHash('sha256').update(secret).digest():null;
}

async function redisClient(){
  if(!process.env.REDIS_URL)return null;
  const client=createClient({url:process.env.REDIS_URL});
  await client.connect();
  return client;
}

async function persistLocal(token:string,expiresAt:number){
  const key=encryptionKey();
  if(!key)return;
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',key,iv);
  const ciphertext=Buffer.concat([cipher.update(token,'utf8'),cipher.final()]);
  const payload:StoredSession={ciphertext:ciphertext.toString('base64'),iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),expiresAt};
  await mkdir(path.dirname(FILE),{recursive:true});
  await writeFile(FILE,JSON.stringify(payload),{encoding:'utf8',mode:0o600});
}

async function readLocal():Promise<{token:string;expiresAt:number}|null>{
  const key=encryptionKey();
  if(!key)return null;
  try{
    const payload=JSON.parse(await readFile(FILE,'utf8')) as StoredSession;
    if(!payload.expiresAt||Date.now()>=payload.expiresAt){await rm(FILE,{force:true});return null;}
    const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(payload.iv,'base64'));
    decipher.setAuthTag(Buffer.from(payload.tag,'base64'));
    const token=Buffer.concat([decipher.update(Buffer.from(payload.ciphertext,'base64')),decipher.final()]).toString('utf8');
    return {token,expiresAt:payload.expiresAt};
  }catch{return null;}
}

export async function persistGatewayToken(token:string,ttlSeconds:number){
  const ttl=Math.max(60,ttlSeconds);const expiresAt=Date.now()+ttl*1000;
  const client=await redisClient().catch(()=>null);
  if(client){try{await client.set(KEY,token,{EX:ttl});}finally{await client.quit();}}
  await persistLocal(token,expiresAt).catch(()=>{});
}

export async function getGatewayToken():Promise<string|null>{
  const client=await redisClient().catch(()=>null);
  if(client){try{const token=await client.get(KEY);if(token)return token;}finally{await client.quit();}}
  return (await readLocal())?.token??null;
}

export async function removeGatewayToken(){
  const client=await redisClient().catch(()=>null);
  if(client){try{await client.del(KEY);}finally{await client.quit();}}
  await rm(FILE,{force:true}).catch(()=>{});
}
