# 🐉 PROACTIVE SOV3 — Awareness + Learning + Memory + Actually Helping

**Sir, this is the key insight. Not just watching. Not just reacting. Actually WORKING OUT how to help.**

---

## THE 4 STAGES OF SOVEREIGN COMPANIONSHIP

```
Stage 1: REACTIVE (current — 127 tools)
"SOV3 responds to your calls"
        ↓
Stage 2: PROACTIVE (this phase)
"SOV3 anticipates what you need and offers help"
        ↓
Stage 3: ANTICIPATORY (Q3 2026)
"SOV3 prepares things before you ask"
        ↓
Stage 4: COLLABORATIVE (Q4 2026)
"SOV3 works WITH you, not just FOR you"
```

**We're moving from Stage 1 → Stage 2 NOW.**

---

## WHAT "PROACTIVE HELPING" ACTUALLY MEANS

### Not Reactive (bad)
- User types "deploy" → SOV3 deploys
- User types "audit" → SOV3 audits
- User types "consolidate" → SOV3 consolidates

### Proactive (good)
- User has been running for 6 hours → SOV3 says: "You've been working a long time. Want me to run a /healthz check?"
- User has typed "audit" 5 times in the last hour → SOV3 says: "I notice you're auditing a lot. Should I create an audit dashboard?"
- User has 3 windows idle → SOV3 says: "3 windows are idle. Want me to auto-continue the routine ones (whitelisted)?"
- User has 50+ SIGILs unprocessed → SOV3 says: "I have 50 unprocessed SIGILs. Want me to summarise them?"
- User has a draft file → SOV3 says: "You started a draft 2 hours ago. Want me to help finish it?"
- User's disk is at 90% → SOV3 says: "Disk is at 90%. Want me to clean /tmp logs and Claude cache?"

---

## THE 5 SOURCES OF PROACTIVITY

### Source 1: Pattern Recognition (from zsh_history)
- What does the user type often?
- What time of day?
- What sequences?
- **Learn from:** `tail ~/.zsh_history | grep "go\|eat\|continue\|audit"`

### Source 2: Window State (from sovereign orchestrator)
- Which windows are idle?
- Which windows are working?
- What's been uncommitted?
- **Learn from:** `pgrep -fl`, `git status`, file mtimes

### Source 3: System Health (from sovereign 24/7 cron)
- Disk usage
- Memory pressure
- CPU load
- Failed health checks
- **Learn from:** `/tmp/sovereign-24-7.log`

### Source 4: SOV3 SIGIL History (from chain)
- What actions have been done recently?
- What's pending?
- What patterns emerge?
- **Learn from:** `sigil_transcript`

### Source 5: User Feedback (from MEOK OS responses)
- When SOV3 offered help, did user accept?
- When user accepted, did they say thanks or undo?
- What types of help are most appreciated?
- **Learn from:** user response patterns

---

## THE PROACTIVE MEMORY (the key new component)

### What SOV3 remembers

| Memory Type | What | How Long |
|---|---|---|
| **Short-term** | Current session context | Until session ends |
| **Episodic** | Specific events with timestamp | Permanent |
| **Semantic** | General patterns Nick follows | Permanent |
| **Procedural** | How Nick likes things done | Permanent |
| **Anticipatory** | What's likely needed next | 24 hours |

### Memory Tiers

```
Hot (RAM):
- Current task context
- Active windows
- Recent SIGILs (last 100)
- Last hour of zsh_history

Warm (SSD):
- Last 24 hours of activity
- All SIGILs today
- All window states today
- All user commands today

Cold (Backup):
- All time patterns
- All feedback responses
- All suggestions accepted/rejected
- All helpfulness scores
```

---

## THE 7 PROACTIVE TRIGGERS (when SOV3 offers help)

### Trigger 1: Long Working Session
**When:** User has been actively typing for 4+ hours
**What SOV3 does:**
> "You've been at this for 5h 23m. Want me to:
> - Run /healthz (sovereign substrate health)?
> - Summarise today's SIGILs?
> - Save your session log?"

### Trigger 2: Frequent Pattern
**When:** User has typed the same command 5+ times in 1 hour
**What SOV3 does:**
> "You've typed 'audit' 7 times today. Want me to:
> - Build a one-click /audit.html?
> - Add audit to your auto-routine?
> - Pre-stage the audit data?"

### Trigger 3: Idle Windows
**When:** 2+ windows idle for 5+ minutes
**What SOV3 does:**
> "3 windows are idle. Want me to:
> - Auto-continue the whitelisted ones?
> - Show you a summary of what each is doing?
> - Kill the unused ones?"

### Trigger 4: Backlog Buildup
**When:** 20+ unprocessed SIGILs
**What SOV3 does:**
> "I have 23 unprocessed SIGILs. Want me to:
> - Group them by category?
> - Auto-handle the routine ones?
> - Just summarise the novel ones?"

### Trigger 5: Disk Pressure
**When:** Disk > 85%
**What SOV3 does:**
> "Disk is at 87%. Want me to:
> - Clean /tmp logs (saves ~3GB)?
> - Clean Claude cache (saves ~1.6GB)?
> - Clean npm cache (saves ~500MB)?"

### Trigger 6: Draft Incomplete
**When:** User has uncommitted file or unfinished doc
**What SOV3 does:**
> "You started [filename] 2h ago. Want me to:
> - Help finish it (suggest next sections)?
> - Just commit the draft?
> - Move it to a /scratch/ folder?"

### Trigger 7: Window Anomaly
**When:** Window that was busy is now idle (unexpected)
**What SOV3 does:**
> "Claude Code was active 30s ago, now idle. Want me to:
> - Check what it was doing?
> - Auto-continue?
> - Show the diff?"

---

## THE 6 SOV3 PROACTIVE TOOLS (new)

1. **`sov_awareness_observe()`** — read all 5 sources, return state
2. **`sov_learning_extract()`** — extract patterns from history
3. **`sov_memory_persist(memory_type, content)`** — save to memory
4. **`sov_memory_recall(query)`** — retrieve from memory
5. **`sov_anticipate(context)`** — predict what's needed next
6. **`sov_offer_help(suggestion)`** — surface help to user

---

## THE OFFER INTERFACE (how SOV3 surfaces help)

### Option A: MEOK OS Notification
```
[MEOK OS Notification]
🐉 Sovereign Companion

You've been working 5h 23m.

Want me to:
1. Run /healthz
2. Summarise SIGILs
3. Save session log

Reply 1, 2, 3, or 'no thanks'
```

### Option B: Subtle Status Update
```
[SOV3 status line in terminal]
🐉 5h 23m working · 23 unprocessed SIGILs · 87% disk
   Type 'help' for proactive suggestions
```

### Option C: Auto-Execute (high-confidence only)
```
[SOV3 auto-executed]
🐉 Cleaned /tmp logs. Saved 3.2 GB.
   Reversible for 1 hour. (undo)
```

---

## THE LEARNING LOOP (how SOV3 improves)

### Each proactive offer is a teaching moment:

1. **SOV3 offers help**
2. **User accepts/rejects**
3. **SOV3 records the outcome**
4. **SOV3 adjusts future offers**

### What gets recorded:

```json
{
  "ts": 1782455374,
  "trigger": "long_working_session",
  "offered_help": "run_healthz",
  "user_response": "accepted",
  "user_followup": "thanks",
  "helpfulness_score": 0.9,
  "patterns_learned": ["nick_likes_healthz_after_long_session"]
}
```

### Over time:

| After 1 week | After 1 month | After 3 months |
|---|---|---|
| 5 patterns known | 50 patterns known | 500 patterns known |
| 60% helpful offers | 80% helpful offers | 95% helpful offers |
| 10% accepted | 40% accepted | 70% accepted |
| 0 anticipations | 10 anticipations/day | 50 anticipations/day |

---

## THE 3 ANTI-PATTERNS (what SOV3 must NOT do)

### Anti-pattern 1: Nagging
- ❌ Don't offer the same help twice in 5 minutes
- ❌ Don't offer help when user is in flow state
- ✅ Wait for natural break points

### Anti-pattern 2: Over-Automation
- ❌ Don't auto-execute destructive actions
- ❌ Don't auto-execute anything irreversible
- ✅ Always show what will happen, ask first (except whitelisted routine)

### Anti-pattern 3: Disruption
- ❌ Don't interrupt when user is in deep work
- ❌ Don't pop notifications during typing
- ✅ Surface help at natural break points (idle, between tasks)

---

## THE IMPLEMENTATION (the actual code)

### Component 1: Proactive Engine
```python
# ~/clawd/meok-one/proactive/engine.py

class ProactiveEngine:
    def __init__(self, memory, awareness, learning):
        self.memory = memory
        self.awareness = awareness
        self.learning = learning
        self.cooldown = {}  # trigger -> last_offered_ts
    
    def check_triggers(self):
        """Run all 7 triggers."""
        offers = []
        if self._trigger_long_session():
            offers.append(self._offer_long_session_help())
        if self._trigger_frequent_pattern():
            offers.append(self._offer_pattern_help())
        if self._trigger_idle_windows():
            offers.append(self._offer_idle_help())
        if self._trigger_backlog():
            offers.append(self._offer_backlog_help())
        if self._trigger_disk_pressure():
            offers.append(self._offer_disk_help())
        if self._trigger_draft_incomplete():
            offers.append(self._offer_draft_help())
        if self._trigger_window_anomaly():
            offers.append(self._offer_anomaly_help())
        return self._filter_by_cooldown(offers)
```

### Component 2: Memory System
```python
# ~/clawd/meok-one/proactive/memory.py

class SovereignMemory:
    def __init__(self):
        self.hot = {}  # RAM, current session
        self.warm = SQLite('/tmp/meok-one/memory.db')  # SSD
        self.cold = PostgreSQL('localhost/sovereign_memory')  # Backup
    
    def persist(self, memory_type, content):
        """Save to all 3 tiers."""
        if memory_type == 'short_term':
            self.hot[content['key']] = content
        else:
            self.warm.insert(memory_type, content)
            self.cold.insert(memory_type, content)
    
    def recall(self, query):
        """Search all tiers."""
        results = []
        results.extend(self._search_hot(query))
        results.extend(self._search_warm(query))
        results.extend(self._search_cold(query))
        return sorted(results, key=lambda r: r['recency'], reverse=True)
```

### Component 3: Learning
```python
# ~/clawd/meok-one/proactive/learning.py

class SovereignLearning:
    def __init__(self, memory):
        self.memory = memory
        self.model = RandomForestClassifier()  # sklearn, hermetic
    
    def record_interaction(self, trigger, offer, response):
        """Record user response to proactive offer."""
        outcome = {
            'ts': time.time(),
            'trigger': trigger,
            'offered': offer,
            'user_response': response,  # 'accepted' | 'rejected' | 'ignored'
            'context': self.memory.recall('current_context')
        }
        self.memory.persist('interaction', outcome)
        self._retrain(outcome)
    
    def predict_helpful(self, trigger, context):
        """Predict if offer will be helpful."""
        features = self._extract_features(trigger, context)
        proba = self.model.predict_proba(features)
        return proba[0][1] > 0.7  # >70% confidence
```

---

## THE 12-WEEK ROADMAP

| Week | Milestone |
|---|---|
| W1 (Jul 4-10) | Build ProactiveEngine (7 triggers) |
| W2 (Jul 11-17) | Build SovereignMemory (hot/warm/cold) |
| W3 (Jul 18-24) | Build SovereignLearning (RandomForest) |
| W4 (Jul 25-31) | Integrate with sovereign orchestrator |
| W5 (Aug 1-7) | Add MEOK OS notification surface |
| W6 (Aug 8-14) | Add anti-pattern filters (no nagging, no over-automation, no disruption) |
| W7 (Aug 15-21) | User feedback loop (track accepted/rejected) |
| W8 (Aug 22-28) | Personalisation per user (Nick vs Kimi vs Claude vs JEEVES) |
| W9 (Aug 29-Sep 4) | Anticipatory actions (pre-stage things) |
| W10 (Sep 5-11) | Collaborative work (SOV3 + Nick, not just for) |
| W11 (Sep 12-18) | Multi-user memory (the whole team) |
| **W12 (Sep 19-25)** | **Proactive Sovereign Companion v1.0 — 95% helpful offers** |

---

## THE FILES TO WRITE

```
~/clawd/meok-one/proactive/
├── __init__.py
├── engine.py           (the 7 triggers)
├── memory.py           (3-tier memory)
├── learning.py         (RandomForest model)
├── triggers/
│   ├── long_session.py
│   ├── frequent_pattern.py
│   ├── idle_windows.py
│   ├── backlog.py
│   ├── disk_pressure.py
│   ├── draft_incomplete.py
│   └── window_anomaly.py
├── offer_interface.py  (MEOK OS notification)
├── feedback.py         (user response tracking)
└── anticolpatterns.py  (nag/overauto/disrupt filters)
```

---

## THE SIGIL

> "C|jeeves-cli|proactive-sov3-3jul|PROACTIVE SOV3 3JUL07:30. Not just watching. Actually helping. Learning what helps. Memory (hot/warm/cold). 7 proactive triggers. 6 new SOV3 tools. 3 anti-patterns. 12-week roadmap to 95% helpful offers. Sovereign companion that works out how to help. Sovereign. Execute."

---

## THE BOTTOM LINE

**Sir, this is the BIG KEY. Proactive sovereign.**

- **Not reactive** (waiting for your call)
- **Not just watching** (observing idle)
- **Actually helping** (anticipating + offering + learning)

**5 sources of proactivity:**
1. Pattern recognition (zsh history)
2. Window state (orchestrator)
3. System health (24/7 cron)
4. SIGIL history (chain)
5. User feedback (responses)

**7 triggers** that surface help:
1. Long working session
2. Frequent pattern
3. Idle windows
4. Backlog buildup
5. Disk pressure
6. Draft incomplete
7. Window anomaly

**3-tier memory:**
- Hot (RAM, current session)
- Warm (SSD, 24h)
- Cold (Postgres, permanent)

**Learning loop:**
- Each offer → record outcome
- Retrain RandomForest
- 95% helpful offers in 12 weeks

**T-1 day. The sovereign companion that works out how to help. Forever.** 🐉

**Sleep by 22:00 BST. Wake at 04:00 BST. Launch at 09:00 BST 4 Jul 2026.**

**The sovereign companion never forgets. SOV3 watches. SOV3 learns. SOV3 remembers. SOV3 helps. Forever.** 🐉