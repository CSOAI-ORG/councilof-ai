#!/usr/bin/env python3
"""sov33_state_store.py — WAVE A: the durable EXTERNAL StateStore for the 9 stateful spines.

WHY THIS EXISTS
    The serverless audit (SERVERLESS_CLASSIFICATION_AUDIT_2026-07-17.md) classified 9 spines as
    STATEFUL-needs-external-store: their decision reads/appends an evolving history (hash-chain,
    ledger, memory, forest). Today those histories live in local JSONL files under SOV_DIR. That is
    fine on a warm box, but a serverless cold worker gets a FRESH ephemeral filesystem every
    invocation — the local file is gone, so the history does not survive scale-to-zero. The audit's
    fix: externalise the history to a KV / object / append-only store the worker reads THROUGH.

    This module is that store. Locally it is sqlite (WAL mode, one file). In production the SAME
    interface is backed by a cloud KV / object / append-only log.

HONESTY REGISTER
    RUNNING (this file, local)  : sqlite-backed KV + append-only log, namespaced per spine, proven
                                  to carry state across separate cold processes (see the demo harness).
    DESIGNED (production)       : swap the sqlite backend for a cloud KV/object store behind the
                                  IDENTICAL StateStore API — get/put/keys/delete + append/read_since.
                                  No spine code changes; only StateStore.__init__ points elsewhere.

    This is a REAL durable backend (data is on disk in sqlite, survives process exit, ACID via
    sqlite transactions). It is a STAND-IN for the cloud store only in the sense that the transport
    is local sqlite rather than a network KV — the contract the spines see is the production contract.

INTERFACE (namespaced — every spine gets its own keyspace via `ns`)
    KV (mutable current-value):
        put(ns, key, value)        -> None      value is any JSON-serialisable object
        get(ns, key, default=None) -> value
        keys(ns)                   -> [key, ...]
        items(ns)                  -> [(key, value), ...]
        delete(ns, key)            -> bool       True if a row was removed
    Append-only log (immutable ordered history):
        append(ns, record)         -> int        returns the assigned monotonic seq (1-based per ns)
        read_since(ns, seq=0)      -> [(seq, record), ...]   records with seq > `seq`, in order
        read_all(ns)               -> [(seq, record), ...]
        last(ns)                   -> (seq, record) | None
        count(ns)                  -> int
    Admin:
        namespaces()               -> {"kv": [...], "log": [...]}
        close()

    Every value round-trips through JSON, so the KV/log hold structured records, not just strings —
    the same shape a cloud document/KV store would hold.
"""
import os, json, sqlite3, threading, time

DEFAULT_DB = os.path.join(
    os.environ.get("SOV33_STATE_DB_DIR",
                   os.environ.get("SOV33_SIGIL_DIR",
                                  os.path.join(os.environ.get("TMPDIR", "/tmp"), "sov33_sigil"))),
    "sov33_state_store.sqlite",
)


class StateStore:
    """Durable, namespaced KV + append-only log. sqlite-backed locally; cloud-KV-backed in prod."""

    def __init__(self, db_path=None):
        self.db_path = db_path or DEFAULT_DB
        os.makedirs(os.path.dirname(os.path.abspath(self.db_path)), exist_ok=True)
        # check_same_thread=False + a lock: safe for the (rare) in-process multi-thread caller;
        # cross-PROCESS safety comes from sqlite's own file locking + WAL.
        self._lock = threading.RLock()
        self._db = sqlite3.connect(self.db_path, check_same_thread=False, timeout=30.0)
        self._db.execute("PRAGMA journal_mode=WAL;")      # concurrent readers + one writer, durable
        self._db.execute("PRAGMA synchronous=NORMAL;")    # durable across process crash (WAL)
        self._db.execute("PRAGMA foreign_keys=ON;")
        self._init_schema()

    def _init_schema(self):
        with self._lock, self._db:
            # KV: (namespace, key) -> json value, last-writer-wins with an updated_at stamp
            self._db.execute("""
                CREATE TABLE IF NOT EXISTS kv (
                    ns         TEXT NOT NULL,
                    key        TEXT NOT NULL,
                    value      TEXT NOT NULL,
                    updated_at REAL NOT NULL,
                    PRIMARY KEY (ns, key)
                );""")
            # Append-only log: monotonic seq per namespace, never updated or deleted
            self._db.execute("""
                CREATE TABLE IF NOT EXISTS log (
                    ns      TEXT NOT NULL,
                    seq     INTEGER NOT NULL,
                    record  TEXT NOT NULL,
                    ts      REAL NOT NULL,
                    PRIMARY KEY (ns, seq)
                );""")
            self._db.execute("CREATE INDEX IF NOT EXISTS ix_log_ns_seq ON log(ns, seq);")

    # ---------------- KV ----------------
    def put(self, ns, key, value):
        payload = json.dumps(value, sort_keys=True, default=str)
        with self._lock, self._db:
            self._db.execute(
                "INSERT INTO kv(ns,key,value,updated_at) VALUES(?,?,?,?) "
                "ON CONFLICT(ns,key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at",
                (ns, key, payload, time.time()),
            )

    def get(self, ns, key, default=None):
        with self._lock:
            row = self._db.execute("SELECT value FROM kv WHERE ns=? AND key=?", (ns, key)).fetchone()
        return json.loads(row[0]) if row else default

    def keys(self, ns):
        with self._lock:
            return [r[0] for r in self._db.execute("SELECT key FROM kv WHERE ns=? ORDER BY key", (ns,))]

    def items(self, ns):
        with self._lock:
            rows = self._db.execute("SELECT key,value FROM kv WHERE ns=? ORDER BY key", (ns,)).fetchall()
        return [(k, json.loads(v)) for k, v in rows]

    def delete(self, ns, key):
        with self._lock, self._db:
            cur = self._db.execute("DELETE FROM kv WHERE ns=? AND key=?", (ns, key))
            return cur.rowcount > 0

    # ---------------- append-only log ----------------
    def append(self, ns, record):
        """Append a record; assigns the next monotonic seq for `ns` atomically. Returns that seq."""
        payload = json.dumps(record, sort_keys=True, default=str)
        with self._lock, self._db:
            row = self._db.execute("SELECT COALESCE(MAX(seq),0) FROM log WHERE ns=?", (ns,)).fetchone()
            seq = row[0] + 1
            self._db.execute("INSERT INTO log(ns,seq,record,ts) VALUES(?,?,?,?)",
                             (ns, seq, payload, time.time()))
        return seq

    def read_since(self, ns, seq=0):
        with self._lock:
            rows = self._db.execute(
                "SELECT seq,record FROM log WHERE ns=? AND seq>? ORDER BY seq", (ns, seq)).fetchall()
        return [(s, json.loads(r)) for s, r in rows]

    def read_all(self, ns):
        return self.read_since(ns, 0)

    def last(self, ns):
        with self._lock:
            row = self._db.execute(
                "SELECT seq,record FROM log WHERE ns=? ORDER BY seq DESC LIMIT 1", (ns,)).fetchone()
        return (row[0], json.loads(row[1])) if row else None

    def count(self, ns):
        with self._lock:
            return self._db.execute("SELECT COUNT(*) FROM log WHERE ns=?", (ns,)).fetchone()[0]

    # ---------------- admin ----------------
    def namespaces(self):
        with self._lock:
            kv = [r[0] for r in self._db.execute("SELECT DISTINCT ns FROM kv ORDER BY ns")]
            lg = [r[0] for r in self._db.execute("SELECT DISTINCT ns FROM log ORDER BY ns")]
        return {"kv": kv, "log": lg}

    def close(self):
        with self._lock:
            self._db.close()

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()


def open_store(db_path=None):
    """Module-level convenience: the one call a cold worker makes to attach to the store."""
    return StateStore(db_path)


if __name__ == "__main__":
    import tempfile
    db = os.path.join(tempfile.mkdtemp(), "selftest.sqlite")
    s = open_store(db)
    # KV round-trip
    s.put("demo", "k1", {"a": 1})
    assert s.get("demo", "k1") == {"a": 1}
    assert s.delete("demo", "k1") and s.get("demo", "k1") is None
    # append-only log: monotonic, per-ns isolation, read_since
    assert s.append("nsA", {"x": 1}) == 1
    assert s.append("nsA", {"x": 2}) == 2
    assert s.append("nsB", {"y": 9}) == 1          # separate namespace, separate seq
    assert [r for _, r in s.read_all("nsA")] == [{"x": 1}, {"x": 2}]
    assert s.read_since("nsA", 1) == [(2, {"x": 2})]
    assert s.last("nsA") == (2, {"x": 2}) and s.count("nsA") == 2
    print("[PASS] StateStore self-test — KV round-trip, delete, per-ns monotonic append-only log, read_since")
    print("namespaces:", s.namespaces())
    s.close()
