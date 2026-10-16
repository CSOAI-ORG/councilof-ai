"""Cross-workflow Hub lock: only one mill bills at a time.

Lock file: csoai/hub-queue ledger/mill.lock = {"run_id", "acquired_at", "expires_at"}.
Fail safe: a live lock held by another run, an unreadable lock, or a lost
acquire race all mean BILL NOTHING. Exit 0 = we hold the lock; exit 3 = do not bill.
"""
import json
import os
import sys
import time

REPO = "csoai/hub-queue"
PATH = "ledger/mill.lock"
TTL_S = 110 * 60  # mill timeout 60m + settle 10m + slack


def parse(raw):
    """None = no lock file. Raises ValueError on anything malformed."""
    if raw is None:
        return None
    d = json.loads(raw)
    if not isinstance(d, dict) or not isinstance(d.get("run_id"), str) or not d["run_id"]:
        raise ValueError("lock missing run_id")
    float(d["expires_at"])
    return d


def decide(lock, run_id, now):
    """Return 'acquire' or 'held'. 'held' means bill nothing."""
    if lock is None or lock.get("released"):
        return "acquire"
    if lock["run_id"] == run_id:
        return "acquire"
    if float(lock["expires_at"]) > now:
        return "held"
    return "acquire"  # expired


def new_lock(run_id, now, ttl=TTL_S):
    return {"run_id": run_id, "acquired_at": now, "expires_at": now + ttl}


def may_release(lock, run_id):
    return lock is not None and lock.get("run_id") == run_id and not lock.get("released")


def _api():
    from huggingface_hub import HfApi
    return HfApi(token=os.environ["HF_TOKEN"].strip())


def _read(api):
    from huggingface_hub.utils import EntryNotFoundError
    from huggingface_hub import hf_hub_download
    try:
        p = hf_hub_download(REPO, PATH, repo_type="dataset", token=api.token,
                            force_download=True)
    except EntryNotFoundError:
        return None
    return open(p, encoding="utf-8").read()


def _write(api, lock, msg):
    api.upload_file(path_or_fileobj=json.dumps(lock).encode(), path_in_repo=PATH,
                    repo_id=REPO, repo_type="dataset", commit_message=msg)


def _cli(argv, io=None):
    cmd, run_id = argv[0], argv[1]
    try:
        api = io or _api()
        read = (lambda: io.read()) if io else (lambda: _read(api))
        write = (lambda l, m: io.write(l, m)) if io else (lambda l, m: _write(api, l, m))
        lock = parse(read())
        now = time.time()
        if cmd == "acquire":
            if decide(lock, run_id, now) == "held":
                print(f"MILL_LOCK_HELD by {lock['run_id']} until {lock['expires_at']:.0f}")
                return 3
            write(new_lock(run_id, now), f"mill lock acquire run {run_id} (no inference)")
            back = parse(read())  # lost race -> someone else's id
            if back is None or back["run_id"] != run_id:
                print("MILL_LOCK_RACE_LOST")
                return 3
            print(f"MILL_LOCK_ACQUIRED {run_id}")
            return 0
        if cmd == "release":
            if not may_release(lock, run_id):
                print("MILL_LOCK_NOT_OURS (left untouched)")
                return 0
            lock.update(released=True, expires_at=now)
            write(lock, f"mill lock release run {run_id} (no inference)")
            print(f"MILL_LOCK_RELEASED {run_id}")
            return 0
    except Exception as e:  # fail safe
        print(f"MILL_LOCK_ERROR {type(e).__name__}: {e}")
        return 3
    return 2


if __name__ == "__main__":
    sys.exit(_cli(sys.argv[1:]))
