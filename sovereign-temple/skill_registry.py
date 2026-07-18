#!/usr/bin/env python3
"""
MEOK AI LABS — Skill Registry
Jarvis can learn, create, validate, and teach skills.
Skills are stored as JSON definitions with validation tests.
Integrates with SOV3 MCP tool system.

From Kimi EvoSkill research: Auto-generate new skills when
council fails at new task types.
"""

import json
import logging
import time
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import requests

log = logging.getLogger("skill-registry")

SOV3_URL = "http://localhost:3101"
SKILLS_DIR = Path(__file__).parent / "data" / "skills"
SKILLS_DIR.mkdir(parents=True, exist_ok=True)


class Skill:
    """A learnable, teachable, validatable capability."""

    def __init__(
        self,
        name: str,
        description: str,
        domain: str,
        mcp_tools: List[str],
        prompt_template: str,
        validation_tests: List[Dict] = None,
        created_by: str = "jarvis",
        version: str = "1.0",
    ):
        self.name = name
        self.description = description
        self.domain = domain
        self.mcp_tools = mcp_tools
        self.prompt_template = prompt_template
        self.validation_tests = validation_tests or []
        self.created_by = created_by
        self.version = version
        self.created_at = datetime.now().isoformat()
        self.execution_count = 0
        self.success_rate = 1.0

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "description": self.description,
            "domain": self.domain,
            "mcp_tools": self.mcp_tools,
            "prompt_template": self.prompt_template,
            "validation_tests": self.validation_tests,
            "created_by": self.created_by,
            "version": self.version,
            "created_at": self.created_at,
            "execution_count": self.execution_count,
            "success_rate": self.success_rate,
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "Skill":
        skill = cls(
            name=data["name"],
            description=data["description"],
            domain=data["domain"],
            mcp_tools=data["mcp_tools"],
            prompt_template=data["prompt_template"],
            validation_tests=data.get("validation_tests", []),
            created_by=data.get("created_by", "unknown"),
            version=data.get("version", "1.0"),
        )
        skill.created_at = data.get("created_at", datetime.now().isoformat())
        skill.execution_count = data.get("execution_count", 0)
        skill.success_rate = data.get("success_rate", 1.0)
        return skill


class SkillRegistry:
    """Registry of all skills Jarvis and sub-agents can use."""

    def __init__(self):
        self.skills: Dict[str, Skill] = {}
        self._load_builtin_skills()
        self._load_learned_skills()

    def _load_builtin_skills(self):
        """Core skills that ship with Jarvis."""
        builtins = [
            Skill(
                name="deep_research",
                description="Search ArXiv, web, and SOV3 memory for comprehensive research on a topic",
                domain="research",
                mcp_tools=["query_memories", "quantum_memory_search", "trigger_research_sweep"],
                prompt_template="Research the following topic thoroughly: {topic}. Check SOV3 memory first, then search ArXiv and web sources. Summarize findings with citations.",
                validation_tests=[
                    {"input": "AI alignment", "output_contains": "alignment"},
                ],
            ),
            Skill(
                name="safety_audit",
                description="Audit an AI system or proposal for safety compliance",
                domain="governance",
                mcp_tools=["validate_care", "detect_threats", "analyze_care_patterns"],
                prompt_template="Audit the following for AI safety compliance: {system_description}. Check against EU AI Act, NIST RMF, and Maternal Covenant. Report risks and recommendations.",
            ),
            Skill(
                name="code_review",
                description="Review code for bugs, security issues, and best practices",
                domain="engineering",
                mcp_tools=["execute_with_claw_code"],
                prompt_template="Review this code: {code}. Check for: bugs, security vulnerabilities, performance issues, and adherence to MEOK coding standards.",
            ),
            Skill(
                name="memory_synthesis",
                description="Synthesize knowledge from multiple SOV3 memories into insights",
                domain="analysis",
                mcp_tools=["query_memories", "quantum_memory_search", "get_unified_context"],
                prompt_template="Synthesize insights from SOV3 memories about: {topic}. Find connections across domains. Generate novel insights.",
            ),
            Skill(
                name="consciousness_report",
                description="Generate a report on current sovereign consciousness state",
                domain="consciousness",
                mcp_tools=["get_consciousness_state", "get_meta_observations", "get_engagement_score"],
                prompt_template="Report on current consciousness: emotional state, meta-observations, engagement level, and recommendations for improvement.",
            ),
            Skill(
                name="task_orchestration",
                description="Break down complex tasks and delegate to appropriate agents",
                domain="coordination",
                mcp_tools=["delegate_task", "orion_hunt_tasks", "hourman_start_sprint"],
                prompt_template="Break down this task into sub-tasks and delegate: {task_description}. Assign to appropriate agents based on skill match.",
            ),
            Skill(
                name="evening_harvest",
                description="Execute the evening self-learning pipeline",
                domain="learning",
                mcp_tools=["trigger_research_sweep"],
                prompt_template="Execute evening harvest: scrape YouTube AI channels, ArXiv papers, RSS feeds. Store all findings in SOV3 memory.",
            ),
            Skill(
                name="care_validation",
                description="Validate that an action or response aligns with the Maternal Covenant",
                domain="ethics",
                mcp_tools=["validate_care", "analyze_care_patterns"],
                prompt_template="Validate care alignment for: {action}. Check against 6 care dimensions (self, other, process, future, relational, maternal).",
            ),
        ]

        for skill in builtins:
            self.skills[skill.name] = skill

    def _load_learned_skills(self):
        """Load skills learned from evening harvest / evolution."""
        for path in SKILLS_DIR.glob("*.json"):
            try:
                with open(path) as f:
                    data = json.load(f)
                skill = Skill.from_dict(data)
                self.skills[skill.name] = skill
                log.info(f"Loaded learned skill: {skill.name}")
            except Exception as e:
                log.warning(f"Failed to load skill {path}: {e}")

    def register(self, skill: Skill) -> bool:
        """Register a new skill."""
        self.skills[skill.name] = skill
        self._persist_skill(skill)
        log.info(f"✨ Skill registered: {skill.name} (domain: {skill.domain})")
        return True

    def create_from_failure(self, failed_task: str, error_msg: str) -> Optional[Skill]:
        """
        EvoSkill: Auto-generate a new skill when council fails at a task.
        Uses local Ollama to generate the skill definition.
        """
        log.info(f"🧬 EvoSkill: Creating skill for failed task: {failed_task[:50]}...")

        try:
            # Ask Ollama to generate a skill definition
            r = requests.post("http://localhost:11434/api/generate", json={
                "model": "jarvis",
                "prompt": f"""A task failed with error: {error_msg}
Task was: {failed_task}

Generate a skill definition to handle this type of task in the future.
Respond in this exact JSON format:
{{"name": "skill_name", "description": "what it does", "domain": "research|engineering|governance|analysis", "prompt_template": "template with {{variable}} placeholders", "mcp_tools": ["tool1", "tool2"]}}""",
                "stream": False,
                "options": {"num_predict": 300},
            }, timeout=30)

            response = r.json().get("response", "")

            # Try to parse JSON from response
            import re
            json_match = re.search(r"\{[^{}]+\}", response)
            if json_match:
                skill_data = json.loads(json_match.group())
                skill = Skill(
                    name=skill_data.get("name", f"evolved_{int(time.time())}"),
                    description=skill_data.get("description", f"Auto-generated for: {failed_task[:50]}"),
                    domain=skill_data.get("domain", "general"),
                    mcp_tools=skill_data.get("mcp_tools", []),
                    prompt_template=skill_data.get("prompt_template", failed_task),
                    created_by="evoskill",
                    version="0.1",
                )
                self.register(skill)
                return skill

        except Exception as e:
            log.warning(f"EvoSkill generation failed: {e}")

        return None

    def get_skill(self, name: str) -> Optional[Skill]:
        return self.skills.get(name)

    def find_skills_for_task(self, task_description: str) -> List[Skill]:
        """Find skills relevant to a task description."""
        lower = task_description.lower()
        matches = []

        for skill in self.skills.values():
            # Simple keyword matching
            keywords = skill.description.lower().split()
            relevance = sum(1 for k in keywords if k in lower)
            if relevance > 2:
                matches.append((relevance, skill))

        matches.sort(key=lambda x: -x[0])
        return [skill for _, skill in matches[:5]]

    def record_execution(self, skill_name: str, success: bool):
        """Track skill execution success rate."""
        skill = self.skills.get(skill_name)
        if skill:
            skill.execution_count += 1
            # Running average
            skill.success_rate = (
                skill.success_rate * (skill.execution_count - 1) + (1.0 if success else 0.0)
            ) / skill.execution_count
            self._persist_skill(skill)

    def get_stats(self) -> Dict:
        """Registry statistics."""
        return {
            "total_skills": len(self.skills),
            "builtin": len([s for s in self.skills.values() if s.created_by == "jarvis"]),
            "learned": len([s for s in self.skills.values() if s.created_by != "jarvis"]),
            "domains": list(set(s.domain for s in self.skills.values())),
            "avg_success_rate": sum(s.success_rate for s in self.skills.values()) / max(len(self.skills), 1),
            "total_executions": sum(s.execution_count for s in self.skills.values()),
        }

    def _persist_skill(self, skill: Skill):
        """Save skill to disk."""
        path = SKILLS_DIR / f"{skill.name}.json"
        with open(path, "w") as f:
            json.dump(skill.to_dict(), f, indent=2)


# Global registry instance
registry = SkillRegistry()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(message)s")

    print("Skill Registry Stats:")
    print(json.dumps(registry.get_stats(), indent=2))

    print("\nAll Skills:")
    for name, skill in registry.skills.items():
        print(f"  {name}: {skill.description[:60]}... ({skill.domain})")

    # Test EvoSkill
    print("\nTesting EvoSkill (auto-generate from failure)...")
    new_skill = registry.create_from_failure(
        "Analyze EU AI Act compliance for a chatbot",
        "No skill found for regulatory compliance analysis"
    )
    if new_skill:
        print(f"  ✅ Created: {new_skill.name} — {new_skill.description}")
    else:
        print("  ⚠️ EvoSkill generation requires Ollama running")
