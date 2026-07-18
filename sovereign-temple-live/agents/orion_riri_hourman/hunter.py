"""
Orion Task Hunter
Scans codebase for tasks, TODOs, and pending work
"""

import re
import json
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from enum import Enum


class TaskPriority(Enum):
    CRITICAL = 5    # Blocks release, system down
    HIGH = 4        # Important feature/fix
    MEDIUM = 3      # Normal priority
    LOW = 2         # Nice to have
    TRIVIAL = 1     # Cleanup, minor


class TaskStatus(Enum):
    STALKING = "stalking"      # Found, not yet assessed
    PURSUING = "pursuing"      # Prioritized, ready to capture
    CAPTURED = "captured"      # Assigned to sprint
    COMPLETED = "completed"    # Done


@dataclass
class Task:
    id: str
    title: str
    description: str
    source_file: str
    line_number: int
    priority: TaskPriority
    status: TaskStatus
    care_score: float
    tags: List[str]
    estimated_complexity: int  # 1-10
    discovered_at: str
    captured_at: Optional[str] = None
    care_validated: bool = False


class TaskHunter:
    """
    Hunts for tasks across the codebase.
    Tracks them through: stalking → pursuing → captured
    """

    # Patterns to search for
    TODO_PATTERNS = [
        (r'#\s*TODO[:\s]+(.+)', 'python'),
        (r'//\s*TODO[:\s]+(.+)', 'javascript'),
        (r'/\*\s*TODO[:\s]+(.+?)\*/', 'multiline'),
        (r'<!--\s*TODO[:\s]+(.+?)-->', 'html'),
        (r'""".*TODO[:\s]+(.+?)"""', 'docstring'),
        (r"'''.*TODO[:\s]+(.+?)'''", 'docstring'),
    ]
    
    FIXME_PATTERNS = [
        (r'#\s*FIXME[:\s]+(.+)', 'python'),
        (r'//\s*FIXME[:\s]+(.+)', 'javascript'),
    ]
    
    HACK_PATTERNS = [
        (r'#\s*HACK[:\s]+(.+)', 'python'),
        (r'//\s*HACK[:\s]+(.+)', 'javascript'),
    ]

    # Extended patterns for deeper codebase auditing
    QUALITY_PATTERNS = [
        (r'catch\s*\{?\s*\}', 'Empty catch block — swallowed error'),
        (r'@ts-ignore', 'TypeScript safety bypass (@ts-ignore)'),
        (r'@ts-expect-error', 'TypeScript safety bypass (@ts-expect-error)'),
        (r':\s*any\b', 'Weak typing (: any)'),
        (r'console\.error\s*\(', 'Unhandled error logging (console.error)'),
    ]
    
    PRIORITY_KEYWORDS = {
        'critical': TaskPriority.CRITICAL,
        'urgent': TaskPriority.HIGH,
        'important': TaskPriority.HIGH,
        'high': TaskPriority.HIGH,
        'medium': TaskPriority.MEDIUM,
        'low': TaskPriority.LOW,
        'trivial': TaskPriority.TRIVIAL,
        'cleanup': TaskPriority.LOW,
    }
    
    CARE_POSITIVE_WORDS = [
        'care', 'safe', 'protect', 'help', 'improve', 'optimize',
        'refactor', 'clean', 'document', 'test', 'validate',
        'secure', 'robust', 'reliable', 'maintainable'
    ]
    
    CARE_NEGATIVE_WORDS = [
        'hack', 'workaround', 'temp', 'temporary', 'quick fix',
        'band-aid', 'kludge'
    ]

    def __init__(self, root_dir: Optional[Path] = None, 
                 state_dir: Optional[Path] = None):
        self.root_dir = root_dir or Path(__file__).parent.parent.parent
        self.state_dir = state_dir or self.root_dir / "consciousness-core" / "state"
        self.state_file = self.state_dir / "orion_riri_hourman_tasks.json"
        
        self.tasks: List[Task] = []
        self._load_state()

    def _load_state(self):
        """Load task state from disk"""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    data = json.load(f)
                self.tasks = [
                    Task(
                        id=t["id"],
                        title=t["title"],
                        description=t["description"],
                        source_file=t["source_file"],
                        line_number=t["line_number"],
                        priority=TaskPriority(t["priority"]),
                        status=TaskStatus(t["status"]),
                        care_score=t["care_score"],
                        tags=t["tags"],
                        estimated_complexity=t["estimated_complexity"],
                        discovered_at=t["discovered_at"],
                        captured_at=t.get("captured_at"),
                        care_validated=t.get("care_validated", False)
                    )
                    for t in data.get("tasks", [])
                ]
            except Exception:
                pass

    def _save_state(self):
        """Persist task state"""
        self.state_dir.mkdir(parents=True, exist_ok=True)

        class EnumEncoder(json.JSONEncoder):
            def default(self, obj):
                if isinstance(obj, Enum):
                    return obj.value
                return super().default(obj)

        data = {
            "tasks": [asdict(t) for t in self.tasks],
            "saved_at": datetime.now().isoformat()
        }
        with open(self.state_file, 'w') as f:
            json.dump(data, f, indent=2, cls=EnumEncoder)

    def _score_care_alignment(self, text: str) -> float:
        """Score how care-aligned a task is"""
        text_lower = text.lower()
        
        positive_hits = sum(1 for word in self.CARE_POSITIVE_WORDS if word in text_lower)
        negative_hits = sum(1 for word in self.CARE_NEGATIVE_WORDS if word in text_lower)
        
        base_score = 0.5
        positive_bonus = min(positive_hits * 0.1, 0.3)
        negative_penalty = min(negative_hits * 0.15, 0.4)
        
        return max(0.1, min(1.0, base_score + positive_bonus - negative_penalty))

    def _extract_priority(self, text: str) -> TaskPriority:
        """Extract priority from task text"""
        text_lower = text.lower()
        for keyword, priority in self.PRIORITY_KEYWORDS.items():
            if keyword in text_lower:
                return priority
        return TaskPriority.MEDIUM

    def _estimate_complexity(self, text: str) -> int:
        """Estimate task complexity (1-10)"""
        words = text.split()
        length_score = min(len(words) // 5, 3)  # Longer = more complex
        
        complexity_keywords = {
            'refactor': 5, 'architecture': 7, 'redesign': 6,
            'implement': 4, 'create': 3, 'add': 2,
            'fix': 2, 'bug': 3, 'test': 2,
            'optimize': 4, 'performance': 5,
            'security': 6, 'vulnerability': 7,
            'migrate': 6, 'upgrade': 5,
            'document': 2, 'cleanup': 1, 'typo': 1
        }
        
        keyword_score = 0
        text_lower = text.lower()
        for keyword, score in complexity_keywords.items():
            if keyword in text_lower:
                keyword_score = max(keyword_score, score)
        
        return max(1, min(10, length_score + keyword_score))

    def _extract_tags(self, text: str, file_ext: str) -> List[str]:
        """Extract tags from task"""
        tags = []
        text_lower = text.lower()
        
        # Type tags
        if 'fix' in text_lower or 'bug' in text_lower:
            tags.append('bugfix')
        if 'test' in text_lower:
            tags.append('testing')
        if 'doc' in text_lower:
            tags.append('documentation')
        if 'refactor' in text_lower:
            tags.append('refactoring')
        if 'feature' in text_lower or 'implement' in text_lower:
            tags.append('feature')
        if 'security' in text_lower:
            tags.append('security')
        if 'performance' in text_lower or 'optimize' in text_lower:
            tags.append('performance')
        
        # Language tags
        ext_tags = {
            '.py': 'python', '.js': 'javascript', '.ts': 'typescript',
            '.tsx': 'react', '.jsx': 'react', '.html': 'html',
            '.css': 'css', '.scss': 'scss', '.md': 'markdown',
            '.json': 'config', '.yml': 'config', '.yaml': 'config'
        }
        if file_ext in ext_tags:
            tags.append(ext_tags[file_ext])
        
        return list(set(tags))

    def _scan_file(self, file_path: Path) -> List[Task]:
        """Scan a single file for tasks"""
        tasks = []
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
        except Exception:
            return tasks
        
        file_ext = file_path.suffix
        try:
            relative_path = str(file_path.relative_to(self.root_dir))
        except ValueError:
            relative_path = str(file_path)  # External root dir
        
        # Skip certain directories
        skip_dirs = ['node_modules', '.git', '.next', '__pycache__', 'venv', '.venv']
        if any(d in str(file_path) for d in skip_dirs):
            return tasks
        
        for line_num, line in enumerate(lines, 1):
            # Check all patterns
            for pattern, pattern_type in (self.TODO_PATTERNS + self.FIXME_PATTERNS + self.HACK_PATTERNS):
                matches = re.finditer(pattern, line, re.IGNORECASE)
                for match in matches:
                    task_text = match.group(1).strip()
                    
                    # Skip if too short
                    if len(task_text) < 5:
                        continue
                    
                    # Generate ID
                    task_id = f"task_{file_path.stem}_{line_num}_{hash(task_text) % 10000}"
                    
                    task = Task(
                        id=task_id,
                        title=task_text[:80] + ('...' if len(task_text) > 80 else ''),
                        description=task_text,
                        source_file=relative_path,
                        line_number=line_num,
                        priority=self._extract_priority(task_text),
                        status=TaskStatus.STALKING,
                        care_score=self._score_care_alignment(task_text),
                        tags=self._extract_tags(task_text, file_ext),
                        estimated_complexity=self._estimate_complexity(task_text),
                        discovered_at=datetime.now().isoformat()
                    )
                    tasks.append(task)
        
        return tasks

    async def hunt(self, max_files: int = 100, root_dir: Optional[str] = None,
                   include_quality: bool = False) -> Dict:
        """
        Hunt for tasks across the codebase.

        Args:
            max_files: Maximum files to scan (default 100, use 500 for deep scan)
            root_dir: Override root directory to scan (e.g. MEOK UI src)
            include_quality: Also scan for quality issues (empty catches, any types, etc)

        Returns:
            Dict with found tasks and statistics
        """
        scan_dir = Path(root_dir) if root_dir else self.root_dir
        found_tasks: List[Task] = []
        files_scanned = 0
        quality_issues = 0

        # Scan Python and JS/TS files
        extensions = ['*.py', '*.js', '*.ts', '*.tsx', '*.jsx', '*.md']

        for ext in extensions:
            for file_path in scan_dir.rglob(ext):
                if files_scanned >= max_files:
                    break

                file_tasks = self._scan_file(file_path)
                found_tasks.extend(file_tasks)

                # Extended quality scan
                if include_quality:
                    q_tasks = self._scan_quality(file_path, scan_dir)
                    found_tasks.extend(q_tasks)
                    quality_issues += len(q_tasks)

                files_scanned += 1
        
        # Merge with existing tasks (avoid duplicates)
        existing_ids = {t.id for t in self.tasks}
        new_tasks = [t for t in found_tasks if t.id not in existing_ids]
        
        # Add new tasks
        self.tasks.extend(new_tasks)
        
        # Auto-promote tasks to pursuing (lowered from 0.7 — most tasks have default 0.4)
        for task in self.tasks:
            if task.status == TaskStatus.STALKING and task.care_score >= 0.3:
                task.status = TaskStatus.PURSUING
        
        self._save_state()
        
        return {
            "files_scanned": files_scanned,
            "new_tasks_found": len(new_tasks),
            "total_tasks": len(self.tasks),
            "by_priority": self._count_by_priority(),
            "by_status": self._count_by_status(),
            "top_pursuing": [asdict(t) for t in self.get_pursuing_tasks(5)]
        }

    def _scan_quality(self, file_path: Path, scan_root: Path) -> List[Task]:
        """Scan a file for quality issues (empty catches, any types, ts-ignore)"""
        tasks = []
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                lines = f.readlines()
        except Exception:
            return tasks

        file_ext = file_path.suffix
        try:
            relative_path = str(file_path.relative_to(scan_root))
        except ValueError:
            relative_path = str(file_path)

        for line_num, line in enumerate(lines, 1):
            for pattern, description in self.QUALITY_PATTERNS:
                if re.search(pattern, line):
                    task_id = f"quality_{file_path.stem}_{line_num}_{hash(description) % 10000}"
                    # Skip if already found
                    if any(t.id == task_id for t in self.tasks):
                        continue
                    task = Task(
                        id=task_id,
                        title=f"[Quality] {description}",
                        description=f"{description} at {relative_path}:{line_num} — {line.strip()[:120]}",
                        source_file=relative_path,
                        line_number=line_num,
                        priority=TaskPriority.LOW,
                        status=TaskStatus.STALKING,
                        care_score=0.4,
                        tags=self._extract_tags(description, file_ext) + ['quality'],
                        estimated_complexity=2,
                        discovered_at=datetime.now().isoformat()
                    )
                    tasks.append(task)
        return tasks

    def _count_by_priority(self) -> Dict:
        """Count tasks by priority"""
        counts = {p.name: 0 for p in TaskPriority}
        for task in self.tasks:
            counts[task.priority.name] += 1
        return counts

    def _count_by_status(self) -> Dict:
        """Count tasks by status"""
        counts = {s.value: 0 for s in TaskStatus}
        for task in self.tasks:
            counts[task.status.value] += 1
        return counts

    def get_pursuing_tasks(self, limit: int = 10, min_care_score: float = 0.5) -> List[Task]:
        """Get tasks ready to be captured (prioritized by care score)"""
        pursuing = [
            t for t in self.tasks 
            if t.status == TaskStatus.PURSUING and t.care_score >= min_care_score
        ]
        # Sort by priority descending, then care score
        pursuing.sort(key=lambda t: (t.priority.value, t.care_score), reverse=True)
        return pursuing[:limit]

    def get_task(self, task_id: str) -> Optional[Task]:
        """Get a specific task by ID"""
        for task in self.tasks:
            if task.id == task_id:
                return task
        return None

    def capture_task(self, task_id: str) -> Optional[Task]:
        """Mark a task as captured (ready for sprint)"""
        task = self.get_task(task_id)
        if task and task.status == TaskStatus.PURSUING:
            task.status = TaskStatus.CAPTURED
            task.captured_at = datetime.now().isoformat()
            self._save_state()
            return task
        return None

    def complete_task(self, task_id: str) -> bool:
        """Mark a task as completed"""
        task = self.get_task(task_id)
        if task:
            task.status = TaskStatus.COMPLETED
            self._save_state()
            return True
        return False

    def get_hunt_summary(self) -> Dict:
        """Get summary of current hunt state"""
        return {
            "total_tasks": len(self.tasks),
            "stalking": sum(1 for t in self.tasks if t.status == TaskStatus.STALKING),
            "pursuing": sum(1 for t in self.tasks if t.status == TaskStatus.PURSUING),
            "captured": sum(1 for t in self.tasks if t.status == TaskStatus.CAPTURED),
            "completed": sum(1 for t in self.tasks if t.status == TaskStatus.COMPLETED),
            "avg_care_score": round(sum(t.care_score for t in self.tasks) / len(self.tasks), 2) if self.tasks else 0,
            "high_care_ready": len(self.get_pursuing_tasks(100, min_care_score=0.8))
        }


# Singleton instance
_hunter: Optional[TaskHunter] = None


def get_hunter() -> TaskHunter:
    """Get or create task hunter singleton"""
    global _hunter
    if _hunter is None:
        _hunter = TaskHunter()
    return _hunter


if __name__ == "__main__":
    import asyncio
    
    async def test():
        hunter = TaskHunter()
        result = await hunter.hunt(max_files=50)
        print(json.dumps(result, indent=2))
        
        print("\n--- Hunt Summary ---")
        print(json.dumps(hunter.get_hunt_summary(), indent=2))
    
    asyncio.run(test())
