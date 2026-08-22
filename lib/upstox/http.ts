import { getToken } from './session';

const API='https://api.upstox.com/v2';

export class UpstoxRuntimeError extends Error {
  constructor(message:string, public readonly status:number){super(message);this.name='UpstoxRuntimeError';}
}

export async function upstoxGet<T>(path:string, params:Record<string,string|number|undefined>={}):Promise<T>{
  const token=await getToken();
  if(!token) throw new UpstoxRuntimeError('Upstox is not connected.',401);
  const url=new URL(`${API}${path}`);
  for(const [key,value] of Object.entries(params)) if(value!==undefined) url.searchParams.set(key,String(value));
  const response=await fetch(url,{headers:{Accept:'application/json',Authorization:`Bearer ${token}`},cache:'no-store'});
  const text=await response.text();
  let payload:unknown=null;
  try{payload=text?JSON.parse(text):null}catch{payload=text}
  if(!response.ok){
    const message=typeof payload==='object'&&payload&&'message' in payload?String((payload as {message?:unknown}).message):`Upstox request failed (${response.status}).`;
    throw new UpstoxRuntimeError(message,response.status);
  }
  return payload as T;
}
