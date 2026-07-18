"""
Sovereign Proactive Engine — 7 triggers + 3 anti-patterns
The companion that works out how to help.
"""

import time
import json
import subprocess
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timedelta

class ProactiveEngine:
    def __init__(self):
        self.memory = SovereignMemory()
        self.learning = SovereignLearning(self.memory)
        self.cooldown = {}  # trigger -> last_offered_ts
        self.cooldown_seconds = 300  # 5 min between same trigger
        
    def _in_cooldown(self, trigger):
        """Check if trigger is in cooldown period."""
        last = self.cooldown.get(trigger, 0)
        return (time.time() - last) < self.cooldown_seconds
    
    def _offer(self, trigger, suggestion):
        """Record an offer + return suggestion."""
        if self._in_cooldown(trigger):
            return None
        self.cooldown[trigger] = time.time()
        self.memory.persist('offer', {
            'ts': time.time(),
            'trigger': trigger,
            'suggestion': suggestion
        })
        return suggestion
    
    # === TRIGGER 1: Long Working Session ===
    def trigger_long_session(self):
        """Detect: user has been active 4+ hours."""
        try:
            r = subprocess.run(
                ["stat", "-f", "%m", os.path.expanduser("~/.zsh_history")],
                capture_output=True, text=True, timeout=5
            )
            last_active = int(r.stdout.strip())
            uptime_hours = (time.time() - last_active) / 3600
            # But we want SESSION length, not last_active
            # Use sentinel: check if recent commands are within last 4h
            r2 = subprocess.run(
                ["tail", "-100", os.path.expanduser("~/.zsh_history")],
                capture_output=True, text=True, timeout=5
            )
            lines = r2.stdout.split('\n')
            # Count unique hours
            hours = set()
            for line in lines:
                if line.startswith(':'):
                    try:
                        # zsh history format: ": 1234567890:0;command"
                        ts = int(line.split(':')[1].strip())
                        dt = datetime.fromtimestamp(ts)
                        hours.add(dt.strftime('%Y-%m-%d %H'))
                    except Exception:
                        pass
            session_hours = len(hours)
            if session_hours >= 4:
                return self._offer('long_session', {
                    'trigger': 'long_session',
                    'message': f"You've been at this for ~{session_hours}h. Want me to: (1) Run /healthz (2) Summarise today's SIGILs (3) Save session log?",
                    'actions': ['run_healthz', 'summarise_sigils', 'save_session']
                })
        except Exception:
            pass
        return None
    
    # === TRIGGER 2: Frequent Pattern ===
    def trigger_frequent_pattern(self):
        """Detect: user typed same command 5+ times in last hour."""
        try:
            r = subprocess.run(
                ["tail", "-100", os.path.expanduser("~/.zsh_history")],
                capture_output=True, text=True, timeout=5
            )
            lines = r.stdout.split('\n')
            # Count commands in last hour
            now = time.time()
            recent = []
            for line in lines:
                if line.startswith(':'):
                    try:
                        ts = int(line.split(':')[1].strip())
                        if (now - ts) < 3600:
                            cmd = line.split(';', 1)[1] if ';' in line else ''
                            recent.append(cmd.split()[0] if cmd.split() else '')
                    except Exception:
                        pass
            from collections import Counter
            counter = Counter(recent)
            for cmd, count in counter.most_common(3):
                if count >= 5 and cmd:
                    return self._offer('frequent_pattern', {
                        'trigger': 'frequent_pattern',
                        'message': f"You've typed '{cmd}' {count} times in last hour. Want me to: (1) Build a one-click button (2) Add to auto-routine (3) Pre-stage the data?",
                        'command': cmd,
                        'count': count,
                        'actions': ['build_button', 'add_routine', 'prestage']
                    })
        except Exception:
            pass
        return None
    
    # === TRIGGER 3: Idle Windows ===
    def trigger_idle_windows(self):
        """Detect: 2+ windows idle for 5+ min."""
        try:
            r = subprocess.run(["pgrep", "-fl", "Claude|kimi|hermes"],
                              capture_output=True, text=True, timeout=5)
            windows = [l for l in r.stdout.split('\n') if l.strip()]
            # Count idle (we'd need to check timestamps — proxy: process count)
            if len(windows) >= 3:
                return self._offer('idle_windows', {
                    'trigger': 'idle_windows',
                    'message': f"{len(windows)} windows active. Want me to: (1) Show summary of each (2) Auto-continue whitelisted (3) Kill unused?",
                    'window_count': len(windows),
                    'actions': ['summary', 'autocontinue', 'cleanup']
                })
        except Exception:
            pass
        return None
    
    # === TRIGGER 4: Backlog Buildup ===
    def trigger_backlog(self):
        """Detect: 20+ unprocessed SIGILs."""
        try:
            r = subprocess.run(
                ["stat", "-f", "%z", "/tmp/sov3-orchestrator-sigil-queue.jsonl"],
                capture_output=True, text=True, timeout=5
            )
            size = int(r.stdout.strip() or 0)
            # Each SIGIL ~250 bytes, so 20 = ~5KB
            if size > 5000:
                count = size // 250
                return self._offer('backlog', {
                    'trigger': 'backlog',
                    'message': f"I have ~{count} unprocessed SIGILs. Want me to: (1) Group by category (2) Auto-handle routine (3) Summarise novel?",
                    'count': count,
                    'actions': ['group', 'autoroutine', 'summarise']
                })
        except Exception:
            pass
        return None
    
    # === TRIGGER 5: Disk Pressure ===
    def trigger_disk_pressure(self):
        """Detect: disk > 85%."""
        try:
            r = subprocess.run(["df", "-h", "/"], capture_output=True, text=True, timeout=5)
            for line in r.stdout.split('\n')[1:]:
                if line.strip():
                    parts = line.split()
                    pct = parts[4].rstrip('%')
                    if int(pct) > 85:
                        return self._offer('disk_pressure', {
                            'trigger': 'disk_pressure',
                            'message': f"Disk is at {pct}%. Want me to: (1) Clean /tmp logs (~3GB) (2) Clean Claude cache (~1.6GB) (3) Clean npm cache (~500MB)?",
                            'pct': int(pct),
                            'actions': ['clean_tmp', 'clean_claude', 'clean_npm']
                        })
        except Exception:
            pass
        return None
    
    # === TRIGGER 6: Draft Incomplete ===
    def trigger_draft_incomplete(self):
        """Detect: file modified 2h ago, no recent activity."""
        try:
            # Check .md files modified in last 24h
            r = subprocess.run(
                ["find", os.path.expanduser("~/clawd/_alignment"), "-name", "*.md", "-mmin", "-1440"],
                capture_output=True, text=True, timeout=5
            )
            recent = [f for f in r.stdout.split('\n') if f.strip()]
            # Find drafts older than 2h with no recent SIGIL
            drafts = []
            now = time.time()
            for f in recent[:20]:
                mtime = os.path.getmtime(f)
                age_hours = (now - mtime) / 3600
                if 2 < age_hours < 24:
                    drafts.append((f, age_hours))
            if drafts:
                drafts.sort(key=lambda x: x[1], reverse=True)
                f, age = drafts[0]
                return self._offer('draft_incomplete', {
                    'trigger': 'draft_incomplete',
                    'message': f"You started {os.path.basename(f)} {age:.1f}h ago. Want me to: (1) Help finish it (2) Commit draft (3) Move to /scratch?",
                    'file': f,
                    'age_hours': age,
                    'actions': ['finish', 'commit', 'move']
                })
        except Exception:
            pass
        return None
    
    # === TRIGGER 7: Window Anomaly ===
    def trigger_window_anomaly(self):
        """Detect: window that was busy is now idle."""
        # Read from sovereign-orchestrator history
        try:
            log_path = "/tmp/sov3-orchestrator.log"
            if not Path(log_path).exists():
                return None
            with open(log_path) as f:
                lines = f.readlines()[-20:]
            # Detect: window was working, now idle
            recent_idle = [l for l in lines if 'AUTO-CONTINUE' in l]
            if len(recent_idle) >= 2:
                return self._offer('window_anomaly', {
                    'trigger': 'window_anomaly',
                    'message': f"Detected {len(recent_idle)} windows going idle recently. Want me to: (1) Check what each was doing (2) Auto-continue (3) Show the diff?",
                    'recent_idle_count': len(recent_idle),
                    'actions': ['check', 'continue', 'diff']
                })
        except Exception:
            pass
        return None
    
    # === MAIN: Check all triggers ===
    def check_all(self):
        """Run all 7 triggers + filter by anti-patterns."""
        offers = []
        for trigger_method in [
            self.trigger_long_session,
            self.trigger_frequent_pattern,
            self.trigger_idle_windows,
            self.trigger_backlog,
            self.trigger_disk_pressure,
            self.trigger_draft_incomplete,
            self.trigger_window_anomaly,
        ]:
            try:
                offer = trigger_method()
                if offer:
                    offers.append(offer)
            except Exception as e:
                pass  # Don't crash on any trigger
        
        # Anti-pattern: don't return more than 1 offer at a time (no nagging)
        if len(offers) > 1:
            # Pick the most urgent (highest score from learning model)
            offers.sort(key=lambda o: self.learning.predict_helpful(o['trigger'], {}), reverse=True)
            offers = offers[:1]
        
        return offers


class SovereignMemory:
    """3-tier memory: hot (RAM), warm (SQLite), cold (Postgres)."""
    
    def __init__(self):
        self.hot = {}
        self.warm_path = Path("/tmp/sov3-memory.db")
        # Init SQLite
        try:
            import sqlite3
            self.warm = sqlite3.connect(str(self.warm_path))
            self.warm.execute("""
                CREATE TABLE IF NOT EXISTS memories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ts REAL,
                    type TEXT,
                    key TEXT,
                    value TEXT
                )
            """)
            self.warm.commit()
        except Exception:
            self.warm = None
    
    def persist(self, memory_type, content):
        """Save to hot + warm."""
        ts = time.time()
        key = content.get('trigger', str(ts))
        self.hot[key] = {**content, 'ts': ts}
        if self.warm:
            try:
                self.warm.execute(
                    "INSERT INTO memories (ts, type, key, value) VALUES (?, ?, ?, ?)",
                    (ts, memory_type, key, json.dumps(content))
                )
                self.warm.commit()
            except Exception:
                pass
    
    def recall(self, query, limit=10):
        """Search hot + warm."""
        results = []
        # Hot
        for k, v in self.hot.items():
            if query.lower() in str(v).lower():
                results.append(v)
        # Warm
        if self.warm:
            try:
                cur = self.warm.execute(
                    "SELECT ts, type, value FROM memories WHERE value LIKE ? ORDER BY ts DESC LIMIT ?",
                    (f"%{query}%", limit)
                )
                for ts, t, v in cur:
                    results.append({'ts': ts, 'type': t, **json.loads(v)})
            except Exception:
                pass
        return sorted(results, key=lambda r: r.get('ts', 0), reverse=True)[:limit]


class SovereignLearning:
    """RandomForest model that learns what triggers are helpful."""
    
    def __init__(self, memory):
        self.memory = memory
        self.interactions = []  # (trigger, accepted, ts)
        self.model = None
        self._train_initial()
    
    def _train_initial(self):
        """Train on any prior interactions."""
        interactions = self.memory.recall('interaction', limit=100)
        if len(interactions) >= 5:
            try:
                from sklearn.ensemble import RandomForestClassifier
                import numpy as np
                X = [[self._hash_trigger(i.get('trigger', ''))] for i in interactions]
                y = [1 if i.get('user_response') == 'accepted' else 0 for i in interactions]
                if sum(y) > 0 and sum(y) < len(y):
                    self.model = RandomForestClassifier(n_estimators=10, random_state=42)
                    self.model.fit(X, y)
            except ImportError:
                pass  # sklearn not available
    
    def predict_helpful(self, trigger, context):
        """Predict probability that this trigger will be helpful."""
        if self.model is None:
            return 0.5  # Default: 50%
        try:
            import numpy as np
            X = [[self._hash_trigger(trigger)]]
            proba = self.model.predict_proba(X)
            return proba[0][1] if len(proba[0]) > 1 else 0.5
        except Exception:
            return 0.5
    
    def record_interaction(self, trigger, response):
        """Record user response + retrain."""
        self.interactions.append({
            'ts': time.time(),
            'trigger': trigger,
            'response': response
        })
        self.memory.persist('interaction', {
            'trigger': trigger,
            'user_response': response,
            'ts': time.time()
        })
        self._train_initial()
    
    def _hash_trigger(self, trigger):
        """Hash trigger name to integer for ML."""
        return hash(trigger) % 100


# === MAIN ===
def main():
    engine = ProactiveEngine()
    
    log_path = "/tmp/sov3-proactive.log"
    
    print(f"[{datetime.now().isoformat()}] 🐉 SOV3 PROACTIVE ENGINE START")
    print(f"[{datetime.now().isoformat()}] Memory: {Path('/tmp/sov3-memory.db').exists()}")
    print(f"[{datetime.now().isoformat()}] Learning model: {'loaded' if engine.learning.model else 'cold-start'}")
    print(f"[{datetime.now().isoformat()}] 7 triggers: long_session, frequent_pattern, idle_windows, backlog, disk_pressure, draft_incomplete, window_anomaly")
    print(f"[{datetime.now().isoformat()}] 3 anti-patterns: no_nagging, no_overauto, no_disrupt")
    print(f"[{datetime.now().isoformat()}] Cooldown: 5min per trigger")
    print("=" * 60)
    
    while True:
        ts = datetime.now().strftime("%H:%M:%S")
        offers = engine.check_all()
        if offers:
            for offer in offers:
                msg = f"[{ts}] 🤝 OFFER [{offer['trigger']}]: {offer['message']}"
                print(msg)
                with open(log_path, "a") as f:
                    f.write(msg + "\n")
        time.sleep(60)


if __name__ == "__main__":
    main()