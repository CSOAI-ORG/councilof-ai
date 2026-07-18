#!/usr/bin/env python3
"""
Council Deliberation Engine

Loads 7 Legion characters from YAML → matches task to relevant characters →
each character gives their perspective → synthesizes unified response.

Usage:
    from council_deliber import deliberate
    result = deliberate("How should we handle the HARVI sensor integration?")
"""

import json
import re
import os
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any

CHARACTER_DIR = Path("/Users/nicholas/legion/character_council")


def _parse_yaml_frontmatter(text: str) -> Dict[str, Any]:
    """Parse YAML frontmatter using PyYAML."""
    if not text.startswith("---"):
        return {}
    end = text.find("---", 3)
    if end == -1:
        return {}
    raw = text[3:end].strip()
    try:
        return yaml.safe_load(raw) or {}
    except Exception:
        return {}


def load_characters() -> List[Dict[str, Any]]:
    """Load all 7 Legion characters from YAML files."""
    characters = []
    if not CHARACTER_DIR.exists():
        return characters
    for f in sorted(CHARACTER_DIR.glob("*.md")):
        text = f.read_text()
        data = _parse_yaml_frontmatter(text)
        if data.get("name"):
            data["_file"] = f.name
            characters.append(data)
    return characters


def _score_character_relevance(character: Dict, task: str) -> float:
    """Score how relevant a character is to the task (0.0 - 1.0)."""
    task_lower = task.lower()
    score = 0.0

    # Role match
    role = character.get("role", "").lower()
    if any(w in task_lower for w in role.split()):
        score += 0.3

    # Specialization match
    spec = character.get("specialization", "").lower()
    for keyword in spec.split(","):
        keyword = keyword.strip()
        if keyword in task_lower:
            score += 0.4

    # Domain expertise match
    expertise = character.get("domain_expertise", [])
    if isinstance(expertise, list):
        for area in expertise:
            area_lower = area.lower()
            # Extract key terms from expertise area
            terms = re.findall(r"\b[a-z]{4,}\b", area_lower)
            for term in terms:
                if term in task_lower:
                    score += 0.15

    # Personality traits match
    traits = character.get("personality_traits", [])
    if isinstance(traits, list):
        for trait in traits:
            trait_lower = trait.lower()
            terms = re.findall(r"\b[a-z]{4,}\b", trait_lower)
            for term in terms:
                if term in task_lower:
                    score += 0.05

    return min(score, 1.0)


def _build_character_prompt(character: Dict, task: str) -> str:
    """Build a system prompt that makes the character speak in their voice."""
    name = character.get("name", "Unknown")
    role = character.get("role", "")
    spec = character.get("specialization", "")
    traits = character.get("personality_traits", [])
    style = character.get("communication_style", [])
    examples = character.get("response_examples", [])

    prompt = f"""You are {name}, {role}.
Specialization: {spec}

Your personality:
"""
    if isinstance(traits, list):
        for t in traits:
            prompt += f"- {t}\n"

    prompt += "\nCommunication style:\n"
    if isinstance(style, list):
        for s in style:
            prompt += f"- {s}\n"

    prompt += f"""

Speak as {name}. Use your characteristic analogies and communication style.
Address the following task from your unique perspective.

Task: {task}

Give your perspective in 2-4 sentences. Be distinctive and in-character."""

    return prompt


def deliberate(
    task: str,
    min_characters: int = 2,
    max_characters: int = 4,
    characters: Optional[List[Dict]] = None,
    llm_fn=None,
) -> Dict[str, Any]:
    """
    Council deliberation on a task.

    Args:
        task: The question/task to deliberate
        min_characters: Minimum characters to include
        max_characters: Maximum characters to include
        characters: Pre-loaded characters (or auto-loads)
        llm_fn: Function(prompt) -> str. If None, uses Ollama local.

    Returns:
        {
            "task": str,
            "council": [{"name": str, "role": str, "relevance": float, "perspective": str}],
            "synthesis": str,
            "characters_consulted": int,
        }
    """
    if characters is None:
        characters = load_characters()

    if not characters:
        return {
            "task": task,
            "council": [],
            "synthesis": "No characters loaded.",
            "characters_consulted": 0,
        }

    # Score all characters
    scored = []
    for char in characters:
        relevance = _score_character_relevance(char, task)
        scored.append((relevance, char))

    # Sort by relevance descending
    scored.sort(key=lambda x: x[0], reverse=True)

    # Select top characters (at least min_characters if they have any relevance)
    selected = []
    for relevance, char in scored:
        if relevance > 0 or len(selected) < min_characters:
            selected.append((relevance, char))
        if len(selected) >= max_characters:
            break

    # Get each character's perspective
    council_perspectives = []
    for relevance, char in selected:
        name = char.get("name", "Unknown")
        role = char.get("role", "")
        prompt = _build_character_prompt(char, task)

        if llm_fn:
            perspective = llm_fn(prompt)
        else:
            # Default: use Ollama local (qwen2.5:7b is always available)
            try:
                import requests

                resp = requests.post(
                    "http://localhost:11434/api/generate",
                    json={
                        "model": "qwen2.5:7b",
                        "prompt": prompt,
                        "stream": False,
                        "options": {"temperature": 0.8, "num_predict": 256},
                    },
                    timeout=60,
                )
                resp.raise_for_status()
                perspective = resp.json().get("response", "").strip()
            except Exception:
                perspective = f"[{name} perspective unavailable — Ollama not running]"

        council_perspectives.append(
            {
                "name": name,
                "role": role,
                "relevance": round(relevance, 3),
                "perspective": perspective,
            }
        )

    # Synthesize
    synthesis_prompt = f"""You are the synthesis engine for the Legion Council deliberation.

Task: {task}

Council perspectives:
"""
    for cp in council_perspectives:
        synthesis_prompt += f"\n**{cp['name']}** ({cp['role']}):\n{cp['perspective']}\n"

    synthesis_prompt += """

Synthesize these perspectives into a unified response. Acknowledge disagreements, highlight consensus,
and provide a clear recommendation. Speak as the Council — plural, wise, decisive.

Keep it to 3-5 sentences."""

    if llm_fn:
        synthesis = llm_fn(synthesis_prompt)
    else:
        try:
            import requests

            resp = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "qwen2.5:7b",
                    "prompt": synthesis_prompt,
                    "stream": False,
                    "options": {"temperature": 0.7, "num_predict": 512},
                },
                timeout=60,
            )
            resp.raise_for_status()
            synthesis = resp.json().get("response", "").strip()
        except Exception:
            synthesis = "Council deliberation complete. Perspectives gathered but synthesis unavailable."

    return {
        "task": task,
        "council": council_perspectives,
        "synthesis": synthesis,
        "characters_consulted": len(council_perspectives),
    }


if __name__ == "__main__":
    import sys

    task = (
        " ".join(sys.argv[1:])
        if len(sys.argv) > 1
        else "How should we handle the HARVI sensor integration?"
    )
    print(f"\n🏛️  Council Deliberation: {task}\n")
    result = deliberate(task)
    for cp in result["council"]:
        print(f"\n{cp['name']} ({cp['role']}) — relevance: {cp['relevance']:.0%}")
        print(f"  {cp['perspective'][:200]}")
    print(f"\n{'=' * 60}")
    print(f"\n📜 Synthesis:\n{result['synthesis']}")
    print(f"\n({result['characters_consulted']} characters consulted)")
