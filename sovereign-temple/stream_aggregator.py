"""
StreamAggregator — unified multi-stream context hub for SOV3.
Collects: HARV physical context, terminal output, screen frames, app events.
Exposes get_unified_context() for LLM injection.
"""
import time
import hashlib
import threading
from collections import deque
from datetime import datetime
from typing import Dict, List, Optional, Any

class StreamAggregator:
    def __init__(self):
        self.terminal_buffer = deque(maxlen=500)  # last 500 terminal lines
        self.app_events = deque(maxlen=100)
        self.screen_hashes = {}  # display_id -> last hash (dedup)
        self.screen_frames = {}  # display_id -> {data_url, timestamp, size_kb}
        self._lock = threading.Lock()

    def push_terminal(self, lines: List[str], source: str = "terminal"):
        """Receive terminal output lines."""
        ts = time.time()
        with self._lock:
            for line in lines:
                if line.strip():
                    self.terminal_buffer.append({
                        "text": line.rstrip(),
                        "source": source,
                        "timestamp": ts
                    })

    def push_screen_frame(self, display_id: str, data_url: str, width: int = 0, height: int = 0):
        """Receive a screen frame. Deduplicates by content hash."""
        # Hash first 500 chars of data URL (sufficient for change detection)
        frame_hash = hashlib.md5(data_url[:500].encode()).hexdigest()
        with self._lock:
            if self.screen_hashes.get(display_id) == frame_hash:
                return False  # unchanged
            self.screen_hashes[display_id] = frame_hash
            size_kb = round(len(data_url) * 0.75 / 1024)
            self.screen_frames[display_id] = {
                "data_url": data_url,
                "timestamp": time.time(),
                "width": width,
                "height": height,
                "size_kb": size_kb
            }
            return True  # new frame stored

    def push_app_event(self, event_type: str, app_name: str, detail: str = ""):
        with self._lock:
            # Deduplicate rapid app switches
            if self.app_events and self.app_events[-1].get("app_name") == app_name:
                return
            self.app_events.append({
                "type": event_type,
                "app_name": app_name,
                "detail": detail,
                "timestamp": time.time()
            })

    def get_terminal_recent(self, lines: int = 50, max_age: float = 300) -> List[Dict]:
        cutoff = time.time() - max_age
        with self._lock:
            recent = [e for e in self.terminal_buffer if e["timestamp"] >= cutoff]
            return recent[-lines:]

    def get_unified_context(self, include_screens: bool = False) -> Dict:
        """Full unified context snapshot. include_screens=False for text-only."""
        with self._lock:
            terminal = list(self.terminal_buffer)[-50:]
            apps = list(self.app_events)[-10:]
            screens_meta = {
                did: {k: v for k, v in frame.items() if k != "data_url"}
                for did, frame in self.screen_frames.items()
            }
            screens_data = dict(self.screen_frames) if include_screens else {}

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "terminal_lines": len(terminal),
            "terminal_recent": terminal,
            "app_events": apps,
            "screens_active": list(screens_meta.keys()),
            "screens_meta": screens_meta,
            "screens": screens_data,
        }

    def get_context_summary(self) -> str:
        """Compact text summary for LLM system prompt injection."""
        ctx = self.get_unified_context(include_screens=False)
        lines = []

        screens = ctx["screens_active"]
        if screens:
            lines.append(f"- Active screens: {len(screens)} ({', '.join(screens)})")

        term = ctx["terminal_recent"]
        if term:
            recent_cmds = [t["text"] for t in term[-5:]]
            lines.append(f"- Terminal (last {len(term)} lines): " + " | ".join(recent_cmds[-3:])[:200])

        apps = ctx["app_events"]
        if apps:
            lines.append(f"- Recent apps: {', '.join(a['app_name'] for a in apps[-3:])}")

        return "\n".join(lines) if lines else ""

    def get_stats(self) -> Dict:
        with self._lock:
            return {
                "terminal_buffered": len(self.terminal_buffer),
                "app_events": len(self.app_events),
                "active_screens": len(self.screen_frames),
                "screen_ids": list(self.screen_frames.keys())
            }


# Singleton
_aggregator: Optional[StreamAggregator] = None

def get_aggregator() -> StreamAggregator:
    global _aggregator
    if _aggregator is None:
        _aggregator = StreamAggregator()
    return _aggregator
