"""
sov3_hive.py — the main orchestrator.

Sov3Hive is the public entry point. It owns the King, the two hemispheres,
the shared memory, and the integration bridges. All cognitive primitives
(think/analyze/synthesize/delegate/vote/learn/query) go through the King
and emit signed SIGIL envelopes.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .core.sigil_v2 import (
    Sigil, Hemisphere, MsgKind, make_sigil, DEFAULT_SECRET,
)
from .core.king_hive import KingHive, ConsensusTicket, TicketStatus
from .core.memory import MemoryStore, NodeType
from .brains.brain_hemispheres import Brain, BrainReply, PRESETS
from .brains.openrouter_client import ORModel, api_key, is_live, estimate_cost


@dataclass
class CognitiveResult:
    kind: str
    prompt: str
    reply: BrainReply
    cert: Optional[ConsensusTicket] = None
    sigil: Optional[Sigil] = None
    audit: Dict[str, Any] = field(default_factory=dict)


class Sov3Hive:
    def __init__(self, secret: str = DEFAULT_SECRET,
                 right_preset: str = "right_claude_opus",
                 left_preset: str = "left_qwen_plus",
                 memory_path: Optional[str] = None) -> None:
        self.king = KingHive(secret=secret)
        self.right = Brain(PRESETS[right_preset])
        self.left = Brain(PRESETS[left_preset])
        self.memory = MemoryStore(persist_path=memory_path)
        self._secret = secret
        self._counter = 0

    def _sign_msg(self, src: str, dst: str, hemi: Hemisphere, kind: MsgKind,
                  body: Dict[str, Any], charter_refs: List[int] = ()) -> Sigil:
        self._counter += 1
        s = make_sigil(src=src, dst=dst, hemisphere=hemi, kind=kind,
                       body=body, charter_refs=list(charter_refs),
                       counter=self._counter, ttl=120)
        s.sign(self._secret)
        return s

    def _certify(self, prompt: str) -> ConsensusTicket:
        return self.king.run_queens_on(prompt)

    def think(self, prompt: str, **kwargs: Any) -> CognitiveResult:
        sigil = self._sign_msg("sov3://brain/right/right-01", "sov3://king/king-01",
                               Hemisphere.RIGHT, MsgKind.THINK, {"prompt": prompt})
        routed = self.king.route(sigil)
        reply = self.right.ask(prompt, **kwargs)
        cert = self._certify(f"think:{prompt[:60]}")
        out = self._sign_msg("sov3://king/king-01", "sov3://memory/mem-01",
                             Hemisphere.KING, MsgKind.LEARN,
                             {"prompt": prompt, "reply": reply.text[:600], "live": reply.live})
        return CognitiveResult(kind="think", prompt=prompt, reply=reply,
                                cert=cert, sigil=out, audit={"routed": routed, "hemisphere": "right"})

    def analyze(self, prompt: str, **kwargs: Any) -> CognitiveResult:
        sigil = self._sign_msg("sov3://brain/left/left-01", "sov3://king/king-01",
                               Hemisphere.LEFT, MsgKind.ANALYZE, {"prompt": prompt})
        routed = self.king.route(sigil)
        reply = self.left.ask(prompt, **kwargs)
        cert = self._certify(f"analyze:{prompt[:60]}")
        out = self._sign_msg("sov3://king/king-01", "sov3://memory/mem-01",
                             Hemisphere.KING, MsgKind.LEARN,
                             {"prompt": prompt, "reply": reply.text[:600], "live": reply.live})
        return CognitiveResult(kind="analyze", prompt=prompt, reply=reply,
                                cert=cert, sigil=out, audit={"routed": routed, "hemisphere": "left"})

    def synthesize(self, prompts: List[str]) -> CognitiveResult:
        joined = "\n---\n".join(prompts)
        sigil = self._sign_msg("sov3://brain/both/both-01", "sov3://king/king-01",
                               Hemisphere.BOTH, MsgKind.SYNTHESIZE, {"prompts": prompts})
        routed = self.king.route(sigil)
        right_reply = self.right.ask(joined)
        left_reply = self.left.ask(joined)
        chosen = right_reply if len(right_reply.text) >= len(left_reply.text) else left_reply
        chosen_hemi = "right" if chosen is right_reply else "left"
        cert = self._certify(f"synthesize:{joined[:60]}")
        out = self._sign_msg("sov3://king/king-01", "sov3://memory/mem-01",
                             Hemisphere.KING, MsgKind.LEARN,
                             {"right": right_reply.text[:400], "left": left_reply.text[:400],
                              "chosen": chosen_hemi, "text": chosen.text[:600]})
        return CognitiveResult(kind="synthesize", prompt=joined, reply=chosen,
                                cert=cert, sigil=out,
                                audit={"routed": routed, "right_len": len(right_reply.text),
                                       "left_len": len(left_reply.text), "chosen": chosen_hemi})

    def critique(self, prompt: str, max_rounds: int = 2) -> CognitiveResult:
        sigil = self._sign_msg("sov3://brain/both/both-01", "sov3://king/king-01",
                               Hemisphere.BOTH, MsgKind.SYNTHESIZE,
                               {"prompt": prompt, "loop": "critique"})
        routed = self.king.route(sigil)
        rounds: List[Dict[str, Any]] = []
        prev_text = ""
        chosen_reply: Optional[BrainReply] = None
        for r in range(max_rounds):
            right_draft = self.right.ask(f"Draft a clear answer to: {prompt}")
            left_draft  = self.left.ask(f"Draft a precise answer to: {prompt}")
            right_critique = self.left.ask(f"Critique this draft, then improve it:\n\n{right_draft.text}")
            left_critique = self.right.ask(f"Critique this draft, then improve it:\n\n{left_draft.text}")
            chosen = right_draft
            if left_critique.text and len(left_critique.text) > len(right_critique.text):
                chosen = left_critique
            rounds.append({
                "round": r, "right_draft_len": len(right_draft.text),
                "left_draft_len": len(left_draft.text),
                "right_critique_len": len(right_critique.text),
                "left_critique_len": len(left_critique.text),
                "chosen": "right" if chosen is right_draft else "left",
                "text_preview": chosen.text[:120],
            })
            if chosen.text.strip() == prev_text.strip():
                break
            prev_text = chosen.text
            chosen_reply = chosen
        cert = self._certify(f"critique:{prompt[:60]}")
        final = chosen_reply or BrainReply(
            config_name="synth", model="synth", hemisphere="both",
            text="(no improvement converged)", live=False,
        )
        out = self._sign_msg("sov3://king/king-01", "sov3://memory/mem-01",
                             Hemisphere.KING, MsgKind.LEARN,
                             {"prompt": prompt, "rounds": rounds, "final": final.text[:400]})
        return CognitiveResult(kind="critique", prompt=prompt, reply=final,
                                cert=cert, sigil=out, audit={"routed": routed, "rounds": rounds})

    def delegate(self, domain: str, task: str) -> Dict[str, Any]:
        sigil = self._sign_msg("sov3://king/king-01", f"sov3://queen/{domain}/q-{domain}",
                               Hemisphere.KING, MsgKind.DELEGATE, {"task": task})
        routed = self.king.route(sigil)
        return {"sigil": sigil.to_dict(), "routed": routed,
                "result": self.king.queens.delegate(domain, task)}

    def vote(self, proposal: str, voter: str, choice: str) -> Dict[str, Any]:
        t = self.king.run_queens_on(proposal)
        return (t.__dict__ | {"voter": voter, "choice": choice})

    def learn(self, topic: str, content: Dict[str, Any],
              tags: List[str] = None, salience: float = 0.6) -> str:
        return self.memory.add(NodeType.FACT, {"topic": topic, **content},
                               tags=tags or [topic], src="sov3://user", salience=salience)

    def query(self, text: str, top_k: int = 5) -> List[Dict[str, Any]]:
        return [{"id": n.id, "type": n.type.value, "salience": n.salience,
                 "content": n.content, "tags": n.tags}
                for n in self.memory.query(text, top_k=top_k)]

    def swap_right_brain(self, model_id: str, temperature: float = 0.8) -> Dict[str, Any]:
        old_model = self.right.config.model
        old_temp = self.right.config.temperature
        self.right.config.model = model_id
        self.right.config.temperature = temperature
        return {"old": old_model, "old_temperature": old_temp,
                "new": model_id, "temperature": temperature, "live": is_live()}

    def swap_left_brain(self, model_id: str, temperature: float = 0.3) -> Dict[str, Any]:
        old_model = self.left.config.model
        old_temp = self.left.config.temperature
        self.left.config.model = model_id
        self.left.config.temperature = temperature
        return {"old": old_model, "old_temperature": old_temp,
                "new": model_id, "temperature": temperature, "live": is_live()}

    def apply_brain_preset(self, hemisphere: str, preset: str) -> Dict[str, Any]:
        if hemisphere not in ("right", "left"):
            return {"error": "hemisphere must be right or left"}
        if preset not in PRESETS:
            return {"error": f"unknown preset: {preset}",
                    "available": list(PRESETS.keys())}
        cfg = PRESETS[preset]
        if cfg.hemisphere != hemisphere:
            return {"error": f"preset {preset} is a {cfg.hemisphere} brain, not {hemisphere}"}
        target = self.right if hemisphere == "right" else self.left
        old = target.swap(cfg)
        return {"hemisphere": hemisphere, "preset": preset,
                "model": cfg.model, "old_model": old.model}

    def brain_status(self) -> Dict[str, Any]:
        return {"live": is_live(), "api_key_set": bool(api_key()),
                "right": self.right.stats(), "left": self.left.stats()}

    def status(self) -> Dict[str, Any]:
        from .integrations.frameworks import all_frameworks, frameworks_live_count
        return {
            "version": "0.1.0",
            "king": self.king.status(),
            "memory": self.memory.stats(),
            "brain": self.brain_status(),
            "compliance": frameworks_live_count() * 100 // max(1, len(all_frameworks())),
        }

    def heartbeat(self) -> Dict[str, Any]:
        return {"ts": time.time(), "alive": True,
                "queens": len(self.king.queens.all()),
                "sigils_routed": len(self.king.sigil_log),
                "memory_nodes": len(self.memory.nodes)}
