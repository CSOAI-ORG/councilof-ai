#!/usr/bin/env python3
"""sov33_oracle_brain.py — SOV33's REAL brain: signed Oracle GenAI inference. MEOK-SOV3 2026-07-10.
PROVEN LIVE: meta.llama-3.3-70b-instruct authenticated via OCI request-signing (~/.oci key).
No bearer key, no browser — the endpoint needs OCI signing, which this does.
"""
import oci

REGION = "uk-london-1"
EP = f"https://inference.generativeai.{REGION}.oci.oraclecloud.com"
DEFAULT_MODEL = "meta.llama-3.3-70b-instruct"   # confirmed live in root compartment

class OracleBrain:
    def __init__(self, model=DEFAULT_MODEL, profile="DEFAULT"):
        self.cfg = oci.config.from_file("~/.oci/config", profile)
        self.comp = self.cfg["tenancy"]
        self.model = model
        self.client = oci.generative_ai_inference.GenerativeAiInferenceClient(self.cfg, service_endpoint=EP)

    def think(self, prompt, system=None, max_tokens=200, temperature=0.0):
        msgs = []
        if system:
            msgs.append(oci.generative_ai_inference.models.SystemMessage(
                content=[oci.generative_ai_inference.models.TextContent(text=system)]))
        msgs.append(oci.generative_ai_inference.models.UserMessage(
            content=[oci.generative_ai_inference.models.TextContent(text=prompt)]))
        det = oci.generative_ai_inference.models.ChatDetails(
            compartment_id=self.comp,
            serving_mode=oci.generative_ai_inference.models.OnDemandServingMode(model_id=self.model),
            chat_request=oci.generative_ai_inference.models.GenericChatRequest(
                api_format="GENERIC", messages=msgs, max_tokens=max_tokens, temperature=temperature))
        r = self.client.chat(det)
        return r.data.chat_response.choices[0].message.content[0].text

if __name__ == "__main__":
    b = OracleBrain()
    print("model:", b.model, "| compartment ...", b.comp[-8:])
    out = b.think("What does EU AI Act Annex III cover? One sentence, cite the annex.",
                  system="You are SOVEREIGN-COMPLIANCE. Authoritative, cite the article.")
    print("LIVE BRAIN:", out)
