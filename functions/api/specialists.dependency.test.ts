import {describe,it,expect,vi,beforeEach,afterEach} from 'vitest';
import {createHash} from 'node:crypto';
import {onRequestGet} from './specialists';

const sha=(s:string)=>createHash('sha256').update(s).digest('hex');
const make=(role:string)=>JSON.stringify({
  schema:'csoai.specialist-team/0.1',
  record_type:'measured-current-state',
  as_of:'2026-09-26T00:00:00Z',
  count:1,
  not_a_certification:true,
  endorsement:'none',
  specialists:[{id:'fixture',class:'axis',model:'fixture',role,signal:'/fixture',ready:true}],
  body_sha256:'a'.repeat(64),
  sig_algo:'ed25519',
  sig_b64:'fixture-signature'
},null,2);

let upstream='';
beforeEach(()=>{
  upstream=make('baseline role');
  vi.stubGlobal('fetch',vi.fn(async()=>new Response(upstream,{status:200,headers:{'content-type':'application/json'}})));
});
afterEach(()=>vi.unstubAllGlobals());

async function read(){
  const response=await (onRequestGet as any)({});
  return {body:await response.text(),source:response.headers.get('x-csoai-source')};
}

describe('specialists direct upstream dependency',()=>{
  it('changes only when the live upstream bytes change and replays stably',async()=>{
    const baseline=await read();
    expect(baseline.source).toBe('live-signed-feed');
    expect(baseline.body).toBe(upstream);
    const baselineSha=sha(baseline.body);
    upstream=make('changed role');
    const changed=await read();
    expect(changed.source).toBe('live-signed-feed');
    expect(changed.body).toBe(upstream);
    const changedSha=sha(changed.body);
    expect(changedSha).not.toBe(baselineSha);

    upstream=make('baseline role');
    const replay=await read();
    expect(sha(replay.body)).toBe(baselineSha);
  });
});
