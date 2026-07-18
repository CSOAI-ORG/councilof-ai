"""
HARV Guardian Bridge — Phase 2
Connects DeepCamera/Guardian detection events to the HARV camera_event endpoint.
Translates raw VLM/YOLO detections into ContextEnvelope entries for every SOV chat.
"""

import asyncio
import json
import urllib.request
import urllib.error
from datetime import datetime
from typing import Optional

HARV_BASE_URL = "http://localhost:3200"
CAMERA_EVENT_ENDPOINT = f"{HARV_BASE_URL}/harv/camera_event"


class GuardianBridge:
    """Bridge between DeepCamera/Guardian agent and HARV /harv/camera_event endpoint."""

    def __init__(self, base_url: str = HARV_BASE_URL):
        self.base_url = base_url.rstrip("/")
        self.endpoint = f"{self.base_url}/harv/camera_event"

    def _post(self, payload: dict) -> dict:
        """Synchronous HTTP POST to the camera_event endpoint."""
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            self.endpoint,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except urllib.error.URLError as exc:
            return {"error": str(exc), "status": "unreachable"}

    async def _post_async(self, payload: dict) -> dict:
        """Async wrapper around the synchronous POST (runs in executor)."""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._post, payload)

    async def on_detection(
        self,
        label: str,
        confidence: float,
        bbox: Optional[list] = None,
        zone: str = "unknown",
    ) -> dict:
        """
        Forward a raw object detection (YOLO/VLM) to HARV.

        Args:
            label:      Detection class label, e.g. 'dog', 'person', 'vehicle'
            confidence: Model confidence score 0.0–1.0
            bbox:       Bounding box [x1, y1, x2, y2] in pixel coords (optional)
            zone:       Farm zone identifier, e.g. 'field', 'lab', 'caravan'
        """
        event_type = f"{label.lower().replace(' ', '_')}_detected"
        metadata: dict = {}
        if bbox is not None:
            metadata["bbox"] = bbox
        payload = {
            "event_type": event_type,
            "label": label,
            "confidence": confidence,
            "zone": zone,
            "metadata": metadata,
        }
        result = await self._post_async(payload)
        return result

    async def on_activity(
        self,
        activity_type: str,
        person_id: str = "",
        zone: str = "unknown",
        metadata: Optional[dict] = None,
    ) -> dict:
        """
        Forward a higher-level activity recognition event to HARV.

        Args:
            activity_type: e.g. 'dog_walking', 'pc_workstation', 'person_idle'
            person_id:     Re-ID track identifier (FastReID embedding hash)
            zone:          Farm zone identifier
            metadata:      Arbitrary extra context (pose keypoints, speed, etc.)
        """
        meta = dict(metadata or {})
        if person_id:
            meta["person_id"] = person_id
        payload = {
            "event_type": activity_type,
            "label": activity_type.replace("_", " "),
            "confidence": meta.pop("confidence", 1.0),
            "zone": zone,
            "metadata": meta,
        }
        result = await self._post_async(payload)
        return result

    async def simulate_demo_events(self) -> None:
        """
        Post 3 representative sample events to test the live pipeline.
        Covers the three farm zones: field, lab, caravan studio.
        """
        print(f"[GuardianBridge] Posting demo events to {self.endpoint}")

        # 1. Dog detected in field zone
        r1 = await self.on_detection(
            label="dog",
            confidence=0.92,
            bbox=[120, 80, 340, 310],
            zone="field",
        )
        print(f"  [1] dog/field    → {r1}")

        # 2. Person detected in lab zone
        r2 = await self.on_detection(
            label="person",
            confidence=0.87,
            bbox=[200, 50, 420, 480],
            zone="lab",
        )
        print(f"  [2] person/lab   → {r2}")

        # 3. PC activity in caravan studio zone
        r3 = await self.on_activity(
            activity_type="pc_activity",
            person_id="reid_0001",
            zone="caravan",
            metadata={"confidence": 0.95, "pose": "seated", "idle_seconds": 12},
        )
        print(f"  [3] pc/caravan   → {r3}")

        print("[GuardianBridge] Demo complete.")


# ---------------------------------------------------------------------------
# Standalone entry point for quick smoke-tests
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    bridge = GuardianBridge()
    asyncio.run(bridge.simulate_demo_events())
