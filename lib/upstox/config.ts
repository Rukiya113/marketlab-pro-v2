export function upstoxConfig(){
 const clientId=process.env.UPSTOX_CLIENT_ID;
 const clientSecret=process.env.UPSTOX_CLIENT_SECRET;
 const redirectUri=process.env.UPSTOX_REDIRECT_URI;
 if(!clientId||!clientSecret||!redirectUri) return null;
 return {clientId,clientSecret,redirectUri};
}
