"""
ToolDispatcher — semantic embedding-based MCP tool selection.
Embeds all tool descriptions at startup, finds top-k matching tools per query.
Achieves ~89% token reduction: sends 5-10 relevant tools vs all 70.
Compass doc ref: arXiv:2025 MCP tool selection research.
"""
import hashlib
import json
import numpy as np
from typing import List, Dict, Any, Optional
from pathlib import Path

class ToolDispatcher:
    def __init__(self, tools: List[Dict], cache_path: str = "/tmp/tool_embeddings.npy"):
        self.tools = tools
        self.cache_path = Path(cache_path)
        self._embedder = None
        self._embeddings: Optional[np.ndarray] = None
        self._tool_names = [t["name"] for t in tools]
        self._tool_descriptions = [
            f"{t['name']}: {t.get('description', '')}" for t in tools
        ]
        self.calls_total: Dict[str, int] = {}
        self.errors_total: Dict[str, int] = {}

    def _get_embedder(self):
        if self._embedder is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._embedder = SentenceTransformer("all-MiniLM-L6-v2")
            except ImportError:
                self._embedder = None
        return self._embedder

    def _descriptions_hash(self) -> str:
        """SHA-256 of all tool descriptions — used to detect stale cache."""
        combined = "\n".join(self._tool_descriptions)
        return hashlib.sha256(combined.encode()).hexdigest()[:16]

    def build_index(self) -> bool:
        """Embed all tool descriptions. Loads from disk cache when tools unchanged."""
        embedder = self._get_embedder()
        if embedder is None:
            return False

        current_hash = self._descriptions_hash()
        hash_path = self.cache_path.with_suffix(".hash")

        # Load from cache if tools are unchanged
        if self.cache_path.exists() and hash_path.exists():
            try:
                if hash_path.read_text().strip() == current_hash:
                    self._embeddings = np.load(self.cache_path)
                    print(f"[ToolDispatcher] Loaded {len(self.tools)} tool embeddings from cache")
                    return True
            except Exception:
                pass  # cache corrupt — fall through to re-embed

        try:
            embeddings = embedder.encode(self._tool_descriptions, batch_size=32, show_progress_bar=False)
            self._embeddings = embeddings
            np.save(self.cache_path, embeddings)
            hash_path.write_text(current_hash)
            print(f"[ToolDispatcher] Indexed {len(self.tools)} tools (cache updated)")
            return True
        except Exception as e:
            print(f"[ToolDispatcher] build_index error: {e}")
            return False

    def get_relevant_tools(self, query: str, top_k: int = 8) -> List[Dict]:
        """Return top-k most relevant tools for this query."""
        if self._embeddings is None or self._get_embedder() is None:
            # fallback: keyword-rank instead of returning ALL tools (token bloat + worse selection)
            try:
                from tool_ops import keyword_rank
                return keyword_rank(query, self.tools, top_k)
            except Exception:
                return self.tools
        try:
            query_emb = self._get_embedder().encode([query])[0]
            # Cosine similarity
            norms = np.linalg.norm(self._embeddings, axis=1) * np.linalg.norm(query_emb)
            norms = np.where(norms == 0, 1e-8, norms)
            sims = np.dot(self._embeddings, query_emb) / norms
            top_idx = np.argsort(sims)[::-1][:top_k]
            return [self.tools[i] for i in top_idx]
        except Exception as e:
            print(f"[ToolDispatcher] get_relevant_tools error: {e}")
            return self.tools

    def record_call(self, tool_name: str, success: bool):
        self.calls_total[tool_name] = self.calls_total.get(tool_name, 0) + 1
        if not success:
            self.errors_total[tool_name] = self.errors_total.get(tool_name, 0) + 1

    def get_stats(self) -> Dict:
        total_calls = sum(self.calls_total.values())
        return {
            "total_tools": len(self.tools),
            "indexed": self._embeddings is not None,
            "total_calls": total_calls,
            "top_tools": sorted(self.calls_total.items(), key=lambda x: x[1], reverse=True)[:5],
        }
