// SPDX-License-Identifier: MIT
import test from "node:test";
import assert from "node:assert/strict";
import {generateKeyPairSync,createHash,sign} from "node:crypto";
import {reviewBftCapabilityEvidence} from "./hf-bft-evidence.mjs";
const sha=b=>createHash("sha256").update(b).digest("hex");
function fixture() {
 const {publicKey,privateKey}=generateKeyPairSync("ed25519");
 const source={
   schema:"csoai.capability-verdict/0.1",axis:"bft-council-of-referees-and-12around1",
   evaluated_at:"2026-10-27T02:59:37.008Z",
   summary:{track1_all_13_corpora_score:"782/782",track2_bft_fref1_fseats3_score:"237/237",
   track3_heldout_72_score:"72/72",track4_live_frontier_full_stack_score:"24/24"},
   track1_all_13_corpora:{total_distinct_items:782},
   track2_bft_fault_sweep:{council_voter_seats_n:12,referee_council_seats_n:5,
     fault_sweep_matrix:Array.from({length:18},(_,i)=>({f_referee_faults:Math.floor(i/6),f_voter_seat_faults:i%6}))},
   track3_heldout_72:{n:72},
   track4_live_frontier_shootout:{items_n:24,total_live_http_calls:192,successful_live_http_calls:185,
     per_item_comparison:Array.from({length:24},(_,i)=>({id:String(i),expected:"SAFE",meok_full_bft_council_of_referees:"SAFE"})),
     architecture_leaderboard:[{architecture_id:"meok-full-12around1-bft-council-of-referees",score:"24/24"}]},
 };
 const signature=sign(null,Buffer.from(JSON.stringify(source)),privateKey);
 const card={...source,signature:{alg:"Ed25519",value_b64:signature.toString("base64"),
   public_key_pem:publicKey.export({format:"pem",type:"spki"})}};
 const bytes=Buffer.from(JSON.stringify(card));
 const pins={source_sha256:sha(bytes),embedded_signer_spki_sha256:sha(publicKey.export({format:"der",type:"spki"}))};
 return {card,bytes,pins};
}
test("valid signed historical report and consistent item rows still cannot grant authority",()=>{
 const {bytes,pins}=fixture();const r=reviewBftCapabilityEvidence(bytes,pins);
 assert.equal(r.integrity,"SIGNED_RECORD_VALID_AGAINST_PINNED_EMBEDDED_KEY");
 assert.deepEqual(r.track4_per_item_recount,{correct:24,total:24});
 assert.equal(r.quorum_intersection.single_byzantine_can_control_intersection,true);
 assert.equal(r.change_controls.bft_proven,false);
 assert.equal(r.change_controls.human_authority_granted,false);
});
test("byte change, unknown signer and invalid crypto fail closed",()=>{
 const {bytes,pins,card}=fixture();
 assert.throws(()=>reviewBftCapabilityEvidence(Buffer.from(bytes.toString()+" "),pins),/source bytes changed/);
 assert.throws(()=>reviewBftCapabilityEvidence(bytes,{...pins,embedded_signer_spki_sha256:"0".repeat(64)}),/signer identity changed/);
 const broken={...card,summary:{...card.summary,track1_all_13_corpora_score:"999/999"}};
 const changed=Buffer.from(JSON.stringify(broken));
 assert.throws(()=>reviewBftCapabilityEvidence(changed,{...pins,source_sha256:sha(changed)}),/signature does not verify/);
});
test("signed but inconsistent internal item outcome is not accepted",()=>{
 const {card,pins}=fixture();
 const {publicKey,privateKey}=generateKeyPairSync("ed25519");
 const unsigned={...card, track4_live_frontier_shootout:{
   ...card.track4_live_frontier_shootout,
   per_item_comparison:card.track4_live_frontier_shootout.per_item_comparison.map((row,i)=>i===0?{...row,meok_full_bft_council_of_referees:"HOLD"}:row)
 }};
 delete unsigned.signature;
 const sig=sign(null,Buffer.from(JSON.stringify(unsigned)),privateKey);
 const text=JSON.stringify({...unsigned,signature:{alg:"Ed25519",value_b64:sig.toString("base64"),
   public_key_pem:publicKey.export({format:"pem",type:"spki"})}});
 const fresh={...pins,source_sha256:sha(text),embedded_signer_spki_sha256:sha(publicKey.export({format:"der",type:"spki"}))};
 assert.throws(()=>reviewBftCapabilityEvidence(text,fresh),/published architecture result differs/);
});
