"""
memory.py — SOV3 shared memory graph.

A typed, node-and-edge knowledge graph that all hive components write to.
"""
from __future__ import annotations

import json
import time
import uuid
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


class NodeType(str, Enum):
    FACT = "fact"
    PATTERN = "pattern"
    INSIGHT = "insight"
    CODE = "code"
    CHARTER = "charter"
    PERCEPTION = "perception"
    DREAM = "dream"
    VOTE = "vote"


@dataclass
class MemoryNode:
    id: str
    type: NodeType
    content: Dict[str, Any]
    tags: List[str] = field(default_factory=list)
    src: str = ""
    created_at: float = field(default_factory=time.time)
    salience: float = 0.5
    access_count: int = 0

    def touch(self) -> None:
        self.access_count += 1
        self.salience = min(1.0, self.salience + 0.02)


@dataclass
class MemoryEdge:
    src: str
    dst: str
    relation: str
    weight: float = 1.0


class MemoryStore:
    def __init__(self, persist_path: Optional[Path] = None) -> None:
        self.nodes: Dict[str, MemoryNode] = {}
        self.edges: List[MemoryEdge] = []
        self.persist_path = persist_path
        if persist_path and persist_path.exists():
            self.load(persist_path)

    def add(self, type_: NodeType, content: Dict[str, Any],
            tags: Iterable[str] = (), src: str = "",
            salience: float = 0.5) -> str:
        node = MemoryNode(
            id=str(uuid.uuid4()),
            type=type_,
            content=dict(content),
            tags=list(tags),
            src=src,
            salience=max(0.0, min(1.0, salience)),
        )
        self.nodes[node.id] = node
        return node.id

    def link(self, src_id: str, dst_id: str, relation: str, weight: float = 1.0) -> None:
        if src_id in self.nodes and dst_id in self.nodes:
            self.edges.append(MemoryEdge(src_id, dst_id, relation, weight))

    def get(self, node_id: str) -> Optional[MemoryNode]:
        n = self.nodes.get(node_id)
        if n:
            n.touch()
        return n

    def query(self, text: str, top_k: int = 5,
              type_filter: Optional[NodeType] = None) -> List[MemoryNode]:
        text_l = text.lower()
        words = [w for w in text_l.split() if len(w) > 2]
        if not words:
            return []
        scored: List[Tuple[float, MemoryNode]] = []
        for n in self.nodes.values():
            if type_filter and n.type != type_filter:
                continue
            hay = " ".join([n.type.value, " ".join(n.tags),
                            json.dumps(n.content, ensure_ascii=False)]).lower()
            hits = sum(1 for w in words if w in hay)
            if hits == 0:
                continue
            score = hits * n.salience
            scored.append((score, n))
        scored.sort(key=lambda t: t[0], reverse=True)
        return [n for _, n in scored[:top_k]]

    def top(self, n: int = 10) -> List[MemoryNode]:
        return sorted(self.nodes.values(), key=lambda x: x.salience, reverse=True)[:n]

    def stats(self) -> Dict[str, Any]:
        by_type: Dict[str, int] = {}
        for n in self.nodes.values():
            by_type[n.type.value] = by_type.get(n.type.value, 0) + 1
        return {
            "total_nodes": len(self.nodes),
            "total_edges": len(self.edges),
            "by_type": by_type,
            "avg_salience": (sum(n.salience for n in self.nodes.values()) / len(self.nodes))
                            if self.nodes else 0.0,
        }

    def save(self, path: Optional[Path] = None) -> None:
        path = path or self.persist_path
        if not path:
            return
        data = {
            "nodes": [asdict(n) | {"type": n.type.value} for n in self.nodes.values()],
            "edges": [asdict(e) for e in self.edges],
        }
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False))

    def load(self, path: Path) -> None:
        if not path.exists():
            return
        data = json.loads(path.read_text())
        for nd in data.get("nodes", []):
            nd["type"] = NodeType(nd["type"])
            self.nodes[nd["id"]] = MemoryNode(**nd)
        for ed in data.get("edges", []):
            self.edges.append(MemoryEdge(**ed))
