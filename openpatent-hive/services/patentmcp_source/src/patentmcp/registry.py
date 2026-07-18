"""
PatentMCP Prior Art Registry
Public searchable registry of invention disclosures.

Serves as a decentralized prior art database that patent examiners,
researchers, and companies can search to find existing inventions.

Features:
- Full-text search across invention titles and descriptions
- IPC/CPC classification filtering
- Date range filtering
- Cryptographic verification of every entry
- Patent examiner-friendly export formats
- API access for programmatic queries
"""

import hashlib
import json
import re
from typing import List, Optional, Dict
from dataclasses import dataclass, asdict
from datetime import datetime, timezone


@dataclass
class RegistryEntry:
    """A single entry in the prior art registry."""
    registry_id: str
    document_hash: str
    title: str
    inventor_did: str
    classification: str  # IPC or CPC classification
    disclosure_type: str  # full, defensive, provisional
    timestamp: str
    bitcoin_tx: Optional[str]
    attestation_url: str
    c2pa_credential_id: Optional[str]
    searchable_text: str  # For full-text search
    metadata: Optional[Dict] = None
    
    def to_dict(self) -> Dict:
        return asdict(self)


class PriorArtRegistry:
    """
    Searchable prior art registry for invention disclosures.
    
    This registry makes disclosed inventions findable by:
    - Patent examiners (during prior art searches)
    - Companies (freedom-to-operate searches)
    - Researchers (technology landscape analysis)
    - The public (transparency)
    
    Every entry is cryptographically verifiable through
    its attestation URL at verify.meok.ai.
    """
    
    # IPC classification categories for AI/tech inventions
    IPC_CATEGORIES = {
        "G06N": "Artificial Intelligence / Machine Learning",
        "G06F": "Computing / Data Processing",
        "G06T": "Image Processing",
        "H04L": "Network Security / Communications",
        "H04N": "Image/Video Transmission",
        "G06K": "Pattern Recognition",
        "G06Q": "Data Processing Systems/Methods",
        "G05B": "Control Systems",
        "G01N": "Testing/Analyzing",
        "B25J": "Robotics",
    }
    
    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize prior art registry.
        
        Args:
            storage_path: Path to persist registry. If None, in-memory.
        """
        self._entries: List[RegistryEntry] = []
        self._index: Dict[str, set] = {  # Inverted index for search
            "title": set(),
            "classification": set(),
            "inventor": set(),
            "text": set(),
        }
        self._storage_path = storage_path
        
        if storage_path:
            self._load_registry()
    
    def register(
        self,
        document_hash: str,
        title: str,
        inventor_did: str,
        classification: str,
        disclosure_type: str,
        timestamp: str,
        bitcoin_tx: Optional[str],
        attestation_url: str,
        c2pa_credential_id: Optional[str],
        description: str = "",
        metadata: Optional[Dict] = None,
    ) -> RegistryEntry:
        """
        Register an invention disclosure in the prior art registry.
        
        Args:
            document_hash: SHA-3/512 hash of invention document
            title: Invention title
            inventor_did: Inventor's DID
            classification: IPC/CPC classification code
            disclosure_type: full, defensive, or provisional
            timestamp: Disclosure timestamp
            bitcoin_tx: Bitcoin transaction hash
            attestation_url: URL to verify attestation
            c2pa_credential_id: C2PA credential ID
            description: Searchable description
            metadata: Additional metadata
            
        Returns:
            RegistryEntry with registry ID
        """
        # Generate registry ID
        registry_id = f"pmreg:{document_hash[:16]}"
        
        # Build searchable text
        searchable_text = f"{title} {description} {classification} {inventor_did}"
        
        entry = RegistryEntry(
            registry_id=registry_id,
            document_hash=document_hash,
            title=title,
            inventor_did=inventor_did,
            classification=classification,
            disclosure_type=disclosure_type,
            timestamp=timestamp,
            bitcoin_tx=bitcoin_tx,
            attestation_url=attestation_url,
            c2pa_credential_id=c2pa_credential_id,
            searchable_text=searchable_text.lower(),
            metadata=metadata,
        )
        
        self._entries.append(entry)
        self._update_index(entry, len(self._entries) - 1)
        
        if self._storage_path:
            self._persist_entry(entry)
        
        return entry
    
    def _update_index(self, entry: RegistryEntry, position: int):
        """Update inverted search index."""
        # Index by title words
        for word in entry.title.lower().split():
            clean = re.sub(r'[^a-z0-9]', '', word)
            if len(clean) > 2:
                self._index.setdefault(clean, set()).add(position)
        
        # Index by classification
        for code in entry.classification.split(","):
            clean = code.strip().upper()
            self._index.setdefault(clean, set()).add(position)
        
        # Index by inventor
        self._index.setdefault(entry.inventor_did, set()).add(position)
    
    def search(
        self,
        query: str = "",
        classification: str = "",
        date_from: str = "",
        date_to: str = "",
        disclosure_type: str = "",
        limit: int = 25,
        offset: int = 0,
    ) -> Dict:
        """
        Search the prior art registry.
        
        Args:
            query: Full-text search query
            classification: IPC/CPC classification filter
            date_from: Start date (ISO 8601)
            date_to: End date (ISO 8601)
            disclosure_type: full, defensive, or provisional
            limit: Max results
            offset: Pagination offset
            
        Returns:
            Dict with results, total count, and pagination info
        """
        results = list(range(len(self._entries)))
        
        # Full-text search
        if query:
            query_words = [re.sub(r'[^a-z0-9]', '', w.lower()) 
                          for w in query.split() if len(w) > 2]
            matching = set()
            for word in query_words:
                if word in self._index:
                    matching.update(self._index[word])
            results = [r for r in results if r in matching]
        
        # Classification filter
        if classification:
            results = [r for r in results 
                      if classification.upper() in self._entries[r].classification]
        
        # Date range filter
        if date_from:
            results = [r for r in results 
                      if self._entries[r].timestamp >= date_from]
        if date_to:
            results = [r for r in results 
                      if self._entries[r].timestamp <= date_to]
        
        # Disclosure type filter
        if disclosure_type:
            results = [r for r in results 
                      if self._entries[r].disclosure_type == disclosure_type]
        
        total = len(results)
        
        # Pagination
        results = results[offset:offset + limit]
        
        # Build response
        entries = []
        for pos in results:
            e = self._entries[pos]
            entries.append({
                "registry_id": e.registry_id,
                "title": e.title,
                "classification": e.classification,
                "disclosure_type": e.disclosure_type,
                "timestamp": e.timestamp,
                "bitcoin_tx": e.bitcoin_tx,
                "attestation_url": e.attestation_url,
                "inventor_did_masked": self._mask_did(e.inventor_did),
            })
        
        return {
            "total": total,
            "returned": len(entries),
            "offset": offset,
            "limit": limit,
            "entries": entries,
        }
    
    def get_entry(self, registry_id: str) -> Optional[Dict]:
        """Get full entry details by registry ID."""
        for entry in self._entries:
            if entry.registry_id == registry_id:
                result = entry.to_dict()
                result["inventor_did_masked"] = self._mask_did(entry.inventor_did)
                return result
        return None
    
    def get_statistics(self) -> Dict:
        """Get registry statistics."""
        if not self._entries:
            return {"total_entries": 0}
        
        types = {}
        classifications = {}
        
        for e in self._entries:
            types[e.disclosure_type] = types.get(e.disclosure_type, 0) + 1
            for c in e.classification.split(","):
                c = c.strip()
                classifications[c] = classifications.get(c, 0) + 1
        
        return {
            "total_entries": len(self._entries),
            "by_disclosure_type": types,
            "by_classification": dict(sorted(classifications.items(), 
                                              key=lambda x: -x[1])[:10]),
            "latest_entry": self._entries[-1].timestamp,
        }
    
    def export_for_examiner(self, format: str = "json") -> str:
        """
        Export registry in patent examiner-friendly format.
        
        Formats:
        - json: Machine-readable JSON
        - csv: Spreadsheet-compatible
        - xml: Patent office XML format
        """
        if format == "json":
            return json.dumps([e.to_dict() for e in self._entries], indent=2)
        elif format == "csv":
            lines = ["registry_id,title,classification,timestamp,attestation_url"]
            for e in self._entries:
                lines.append(f"{e.registry_id},\"{e.title}\",{e.classification},{e.timestamp},{e.attestation_url}")
            return "\n".join(lines)
        elif format == "xml":
            lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<patentmcp-registry>']
            for e in self._entries:
                lines.append(f"  <entry id=\"{e.registry_id}\">")
                lines.append(f"    <title>{e.title}</title>")
                lines.append(f"    <classification>{e.classification}</classification>")
                lines.append(f"    <timestamp>{e.timestamp}</timestamp>")
                lines.append(f"    <attestation>{e.attestation_url}</attestation>")
                lines.append("  </entry>")
            lines.append("</patentmcp-registry>")
            return "\n".join(lines)
        else:
            raise ValueError(f"Unknown format: {format}")
    
    @staticmethod
    def _mask_did(did: str) -> str:
        """Partially mask DID for privacy."""
        if len(did) > 20:
            return f"{did[:12]}...{did[-8:]}"
        return did
    
    def _persist_entry(self, entry: RegistryEntry):
        """Persist entry to storage."""
        import os
        os.makedirs(self._storage_path, exist_ok=True)
        filepath = os.path.join(self._storage_path, f"registry_{entry.registry_id}.json")
        with open(filepath, "w") as f:
            json.dump(entry.to_dict(), f, indent=2)
    
    def _load_registry(self):
        """Load registry from storage."""
        import os
        import glob
        
        if not os.path.exists(self._storage_path):
            return
        
        files = sorted(glob.glob(os.path.join(self._storage_path, "registry_*.json")))
        for f in files:
            try:
                with open(f) as fp:
                    data = json.load(fp)
                    entry = RegistryEntry(**data)
                    self._entries.append(entry)
                    self._update_index(entry, len(self._entries) - 1)
            except (json.JSONDecodeError, TypeError):
                continue
