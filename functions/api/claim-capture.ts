/** Free evidence route. No payment, signing, settlement, or certification. */
import { CAPTURE_POPULATIONS, readClaimCapture } from './_claim_capture';
export const onRequestGet: PagesFunction = async ({request}) => {
 const u=new URL(request.url);const id=u.searchParams.get('population')||'stablecoins';
 if(!CAPTURE_POPULATIONS[id])return Response.json({error:'unknown_population',supported:Object.keys(CAPTURE_POPULATIONS)},{status:404});
 const result=await readClaimCapture(id,u.searchParams.get('full')==='1');
 return Response.json({schema:'csoai.claim-capture-door/0.1',...result,payment_taken:false},{status:result.state==='UNMEASURED'||result.state==='UNCHECKABLE'?503:200,headers:{'cache-control':'no-store','access-control-allow-origin':'*'}});
};
