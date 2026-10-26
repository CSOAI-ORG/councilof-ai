"""Hub mill lock is fail safe: live foreign lock or any error -> bill nothing."""
import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import hub_mill_lock as K  # noqa: E402


class FakeHub:
    def __init__(self, raw=None, hijack=None, boom=False):
        self.raw, self.hijack, self.boom = raw, hijack, boom

    def read(self):
        if self.boom:
            raise OSError("hub down")
        return self.raw

    def write(self, lock, msg):
        self.raw = json.dumps(self.hijack or lock)


def test_decide():
    now = 1000.0
    assert K.decide(None, "r1", now) == "acquire"
    assert K.decide({"run_id": "r2", "expires_at": now + 5}, "r1", now) == "held"
    assert K.decide({"run_id": "r2", "expires_at": now - 5}, "r1", now) == "acquire"
    assert K.decide({"run_id": "r1", "expires_at": now + 5}, "r1", now) == "acquire"
    assert K.decide({"run_id": "r2", "expires_at": now + 5, "released": True}, "r1", now) == "acquire"


def test_acquire_free_and_held_by_other():
    h = FakeHub()
    assert K._cli(["acquire", "r1"], h) == 0
    assert json.loads(h.raw)["run_id"] == "r1"
    assert K._cli(["acquire", "r2"], h) == 3  # live lock held by r1
    assert json.loads(h.raw)["run_id"] == "r1"


def test_expired_lock_taken_over():
    h = FakeHub(json.dumps({"run_id": "old", "expires_at": time.time() - 1}))
    assert K._cli(["acquire", "r1"], h) == 0


def test_race_lost_and_errors_bill_nothing():
    h = FakeHub(hijack={"run_id": "other", "expires_at": time.time() + 600})
    assert K._cli(["acquire", "r1"], h) == 3
    assert K._cli(["acquire", "r1"], FakeHub(boom=True)) == 3
    assert K._cli(["acquire", "r1"], FakeHub("not json")) == 3
    assert K._cli(["acquire", "r1"], FakeHub(json.dumps({"expires_at": 1}))) == 3


def test_release_only_own():
    h = FakeHub()
    K._cli(["acquire", "r1"], h)
    assert K._cli(["release", "r2"], h) == 0
    assert not json.loads(h.raw).get("released")
    assert K._cli(["release", "r1"], h) == 0
    assert json.loads(h.raw)["released"] is True
    assert K._cli(["acquire", "r2"], h) == 0


if __name__ == "__main__":
    for n, f in list(globals().items()):
        if n.startswith("test_"):
            f()
    print("ok")
