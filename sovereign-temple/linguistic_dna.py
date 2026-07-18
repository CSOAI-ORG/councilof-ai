#!/usr/bin/env python3
"""
MEOK AI LABS — Linguistic DNA
Extracts Nick's cognitive fingerprint from git commits and SOV3 conversations.
Generates a style profile for future LoRA fine-tuning.
From Kimi Gap #23.
"""

import json
import logging
import subprocess
import re
import requests
from collections import Counter
from datetime import datetime
from pathlib import Path
from typing import Dict, List

log = logging.getLogger("linguistic-dna")

SOV3_URL = "http://localhost:3101"
DNA_FILE = Path(__file__).parent / "data" / "linguistic_dna.json"
TRAINING_FILE = Path(__file__).parent / "data" / "nick_training_data.jsonl"
DNA_FILE.parent.mkdir(parents=True, exist_ok=True)


class LinguisticDNA:
    """Extracts and stores Nick's cognitive fingerprint."""

    def __init__(self):
        self.profile = {}

    def extract_from_git_commits(self, repo_path: str = ".") -> Dict:
        """Parse git log for Nick's writing patterns."""
        log.info(f"Extracting linguistic DNA from git history at {repo_path}...")

        try:
            result = subprocess.run(
                ["git", "log", "--format=%s", "-n", "200"],
                capture_output=True, text=True, cwd=repo_path, timeout=10,
            )
            messages = [m.strip() for m in result.stdout.strip().split("\n") if m.strip()]
        except Exception as e:
            log.warning(f"Git extraction failed: {e}")
            return {}

        if not messages:
            return {}

        # Analyze patterns
        all_words = []
        sentence_lengths = []
        capitalized_words = []
        prefixes = Counter()

        for msg in messages:
            words = msg.split()
            all_words.extend(w.lower() for w in words)
            sentence_lengths.append(len(words))

            # Track capitalization patterns (intensity markers)
            caps = [w for w in words if w.isupper() and len(w) > 1]
            capitalized_words.extend(caps)

            # Track commit message prefixes (feat:, fix:, etc.)
            if ":" in msg:
                prefix = msg.split(":")[0].strip().lower()
                prefixes[prefix] += 1

        word_freq = Counter(all_words).most_common(30)

        return {
            "source": "git_commits",
            "sample_size": len(messages),
            "avg_sentence_length": round(sum(sentence_lengths) / max(len(sentence_lengths), 1), 1),
            "max_sentence_length": max(sentence_lengths) if sentence_lengths else 0,
            "top_vocabulary": word_freq[:20],
            "capitalization_markers": Counter(capitalized_words).most_common(10),
            "commit_prefixes": prefixes.most_common(10),
            "uses_colon_prefix": sum(prefixes.values()) / max(len(messages), 1) > 0.3,
        }

    def extract_from_conversations(self) -> Dict:
        """Query SOV3 for interaction patterns."""
        log.info("Extracting from SOV3 conversations...")

        try:
            r = requests.post(f"{SOV3_URL}/mcp", json={
                "jsonrpc": "2.0", "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "query_memories",
                    "arguments": {"query": "Nick interaction conversation", "limit": 50}
                }
            }, timeout=10)
            text = r.json().get("result", {}).get("content", [{}])[0].get("text", "[]")
            memories = json.loads(text) if isinstance(text, str) and text.startswith("[") else []
        except Exception as e:
            log.warning(f"SOV3 extraction failed: {e}")
            return {}

        if not memories:
            return {"source": "sov3", "sample_size": 0}

        # Analyze conversation patterns
        all_content = " ".join(m.get("content", "") for m in memories)
        words = re.findall(r'\b[a-z]{3,}\b', all_content.lower())

        return {
            "source": "sov3_conversations",
            "sample_size": len(memories),
            "total_words": len(words),
            "vocabulary_size": len(set(words)),
            "top_topics": Counter(words).most_common(20),
        }

    def generate_style_profile(self) -> Dict:
        """Combine all sources into a unified style profile."""
        git_data = self.extract_from_git_commits()
        sov3_data = self.extract_from_conversations()

        self.profile = {
            "extracted_at": datetime.now().isoformat(),
            "git_analysis": git_data,
            "sov3_analysis": sov3_data,
            "composite_fingerprint": {
                "writing_style": "technical-direct",
                "intensity_markers": ["CAPS for emphasis", "Dragon Mode", "sovereignty"],
                "decision_pattern": "action-oriented, homelessness→long-game",
                "metaphor_system": ["koi→dragon", "farm→empire", "agents→citizens"],
                "communication": "no hedging, no surface-level, push back when needed",
                "avg_commit_length": git_data.get("avg_sentence_length", 0),
            },
        }

        # Save to disk
        with open(DNA_FILE, "w") as f:
            json.dump(self.profile, f, indent=2)
        log.info(f"Linguistic DNA saved to {DNA_FILE}")

        return self.profile

    def export_training_data(self, output_path: str = None) -> int:
        """Export conversation pairs in JSONL format for LoRA training."""
        output = Path(output_path) if output_path else TRAINING_FILE
        log.info(f"Exporting training data to {output}...")

        try:
            r = requests.post(f"{SOV3_URL}/mcp", json={
                "jsonrpc": "2.0", "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "query_memories",
                    "arguments": {"query": "interaction response", "limit": 100}
                }
            }, timeout=10)
            text = r.json().get("result", {}).get("content", [{}])[0].get("text", "[]")
            memories = json.loads(text) if isinstance(text, str) and text.startswith("[") else []
        except Exception:
            memories = []

        count = 0
        with open(output, "w") as f:
            for m in memories:
                content = m.get("content", "")
                if len(content) > 50:
                    # Create instruction-response pair
                    pair = {
                        "instruction": "Respond as Nick Templeman, founder of MEOK AI LABS.",
                        "input": content[:200],
                        "output": content[200:] if len(content) > 200 else content,
                    }
                    f.write(json.dumps(pair) + "\n")
                    count += 1

        log.info(f"Exported {count} training pairs to {output}")
        return count


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")

    dna = LinguisticDNA()
    profile = dna.generate_style_profile()

    print(f"\n{'='*50}")
    print("LINGUISTIC DNA PROFILE")
    print(f"{'='*50}")
    print(f"Git commits analyzed: {profile['git_analysis'].get('sample_size', 0)}")
    print(f"Avg commit length: {profile['git_analysis'].get('avg_sentence_length', 0)} words")
    print(f"Uses prefix style: {profile['git_analysis'].get('uses_colon_prefix', False)}")
    print(f"SOV3 memories: {profile['sov3_analysis'].get('sample_size', 0)}")

    top_vocab = profile['git_analysis'].get('top_vocabulary', [])[:10]
    if top_vocab:
        print(f"\nTop vocabulary: {', '.join(w for w, c in top_vocab)}")

    prefixes = profile['git_analysis'].get('commit_prefixes', [])
    if prefixes:
        print(f"Commit prefixes: {', '.join(f'{p}({c})' for p, c in prefixes)}")

    # Export training data
    count = dna.export_training_data()
    print(f"\nTraining pairs exported: {count}")
