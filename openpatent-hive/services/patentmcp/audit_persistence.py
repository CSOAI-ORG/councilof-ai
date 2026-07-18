#!/usr/bin/env python3
"""
Audit Persistence Layer — Postgres mirror for the hash-chained audit log.

Wraps the in-memory HashChainedAuditLog so that every new entry is also
written to Postgres. On startup, reconciles any entries that are in
Postgres but not yet in the in-memory chain (e.g. entries that arrived
while the patentmcp service was down — including the genesis).

Falls back to in-memory only if POSTGRES_URL is unset or Postgres is
unreachable. The audit chain is the source of truth in both modes.

Schema:
  audit_log (
    id           SERIAL PRIMARY KEY,
    entry_index  INT     NOT NULL UNIQUE,
    prev_hash    TEXT    NOT NULL,
    hash         TEXT    NOT NULL,
    payload      JSONB   NOT NULL,
    signature    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )

The hive remembers. The dragon knows. The sovereign companion never forgets.
"""
import json
import logging
import os
from typing import List, Dict, Optional, Any

log = logging.getLogger("audit-persistence")

# Optional psycopg — degrades gracefully to in-memory
try:
    import psycopg
    import psycopg.rows
    POSTGRES_OK = True
    _DRIVER = "psycopg3"
except ImportError:
    try:
        import psycopg2  # type: ignore
        import psycopg2.extras  # type: ignore
        POSTGRES_OK = True
        _DRIVER = "psycopg2"
    except ImportError:
        POSTGRES_OK = False
        _DRIVER = None

POSTGRES_URL = os.environ.get("POSTGRES_URL", "") or os.environ.get(
    "POSTGRES_DSN", ""
)


SCHEMA_DDL = """
CREATE TABLE IF NOT EXISTS audit_log (
    id           SERIAL PRIMARY KEY,
    entry_index  INT  NOT NULL UNIQUE,
    prev_hash    TEXT NOT NULL,
    hash         TEXT NOT NULL,
    payload      JSONB NOT NULL,
    signature    TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_hash ON audit_log(hash);
"""


class AuditPersistence:
    """Postgres-backed mirror for the hash-chained audit log.

    The in-memory HashChainedAuditLog is the source of truth for the
    running process. This layer (a) writes new entries to Postgres as
    they are appended, and (b) hydrates any missing entries from
    Postgres on startup so the in-memory chain is complete after a
    restart.
    """

    def __init__(self, postgres_url: Optional[str] = None):
        self.postgres_url = postgres_url or POSTGRES_URL
        self.conn = None
        self.available = False
        if not self.postgres_url:
            log.info("[audit-pg] POSTGRES_URL unset — running in-memory only")
            return
        if not POSTGRES_OK:
            log.warning(
                "[audit-pg] psycopg not installed — running in-memory only"
            )
            return
        try:
            self._connect()
            self._ensure_schema()
            self.available = True
            log.info(
                "[audit-pg] connected to Postgres (driver=%s)", _DRIVER
            )
        except Exception as e:
            log.warning(
                "[audit-pg] Postgres unreachable, falling back to "
                "in-memory: %s",
                e,
            )
            self.available = False
            self.conn = None

    # ── Connection / schema ──────────────────────────────────────────────

    def _connect(self):
        if _DRIVER == "psycopg3":
            self.conn = psycopg.connect(self.postgres_url)
        else:
            self.conn = psycopg2.connect(self.postgres_url)

    def _ensure_schema(self):
        with self._cursor() as cur:
            cur.execute(SCHEMA_DDL)
        self._commit()

    def _cursor(self):
        conn = self.conn
        assert conn is not None
        if _DRIVER == "psycopg3":
            return conn.cursor(row_factory=psycopg.rows.dict_row)  # type: ignore[union-attr]
        return conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)  # type: ignore[union-attr]

    def _commit(self):
        try:
            self.conn.commit()
        except Exception as e:
            import logging
            logging.getLogger("audit_persistence").error(
                "Postgres commit failed: %s", e, exc_info=True,
            )

    def close(self):
        if self.conn is not None:
            try:
                self.conn.close()
            except Exception as e:
                import logging
                logging.getLogger("audit_persistence").error(
                    "Postgres close failed: %s", e, exc_info=True,
                )
            self.conn = None

    # ── Write path ───────────────────────────────────────────────────────

    def write_entry(
        self,
        entry_index: int,
        prev_hash: str,
        this_hash: str,
        payload: Dict[str, Any],
        signature: Optional[str] = None,
    ) -> bool:
        """Mirror a single chain entry to Postgres. Returns True on success.

        Failures are logged but never raised — Postgres is a mirror, not
        the source of truth, and we don't want a transient DB outage to
        break the disclosure pipeline.
        """
        if not self.available or self.conn is None:
            return False
        try:
            with self._cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO audit_log
                      (entry_index, prev_hash, hash, payload, signature)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (entry_index) DO NOTHING
                    """,
                    (
                        entry_index,
                        prev_hash,
                        this_hash,
                        json.dumps(payload, default=str),
                        signature,
                    ),
                )
            self._commit()
            return True
        except Exception as e:
            log.warning("[audit-pg] write_entry(%d) failed: %s", entry_index, e)
            # Try to reconnect on next call
            try:
                self._connect()
                self._ensure_schema()
            except Exception:
                self.available = False
            return False

    # ── Read path / hydration ────────────────────────────────────────────

    def fetch_all_entries(self) -> List[Dict[str, Any]]:
        """Return every audit_log row ordered by entry_index."""
        if not self.available or self.conn is None:
            return []
        try:
            with self._cursor() as cur:
                cur.execute(
                    "SELECT entry_index, prev_hash, hash, payload, signature, "
                    "       created_at "
                    "  FROM audit_log "
                    " ORDER BY entry_index ASC"
                )
                rows = cur.fetchall()
            return [dict(r) for r in rows]
        except Exception as e:
            log.warning("[audit-pg] fetch_all_entries failed: %s", e)
            return []

    def count(self) -> int:
        if not self.available or self.conn is None:
            return -1
        try:
            with self._cursor() as cur:
                cur.execute("SELECT COUNT(*) AS n FROM audit_log")
                row = cur.fetchone()
            return int(row["n"]) if row else 0
        except Exception as e:
            log.warning("[audit-pg] count failed: %s", e)
            return -1

    # ── Reconciliation ───────────────────────────────────────────────────

    def reconcile(self, audit_log) -> Dict[str, Any]:
        """On startup, replay any rows from Postgres that are not yet in
        the in-memory chain.

        `audit_log` is the HashChainedAuditLog instance. We append a
        minimal AuditEntry per missing row, preserving the existing
        in-memory chain head. Genesis (index 0) is handled by
        HashChainedAuditLog itself — we only hydrate indices >= 1.
        """
        if not self.available:
            return {
                "available": False,
                "reconciled": 0,
                "in_memory": audit_log.get_length(),
                "in_pg": 0,
            }

        rows = self.fetch_all_entries()
        in_memory_len = audit_log.get_length()
        in_pg = len(rows)
        reconciled = 0

        # Build a set of indices we already have in memory
        in_mem_indices = {audit_log.get_entry(i).index for i in range(in_memory_len) if audit_log.get_entry(i) is not None}

        for row in rows:
            idx = int(row["entry_index"])
            if idx == 0 or idx in in_mem_indices:
                continue  # Genesis or already loaded from disk
            # The chain in-memory might be shorter than the row we
            # found. Append a minimal placeholder that preserves the
            # prev_hash / hash from the row, so the chain stays valid.
            try:
                from patentmcp.audit import AuditEntry  # type: ignore
                payload = row.get("payload") or {}
                if isinstance(payload, str):
                    try:
                        payload = json.loads(payload)
                    except Exception:
                        payload = {}
                # Pull the most semantically rich fields from the payload
                # (which is the AuditEntry.to_dict() shape from append())
                entry = AuditEntry(
                    index=idx,
                    timestamp=str(
                        row.get("created_at") or payload.get("timestamp") or ""
                    ),
                    entry_type=str(
                        payload.get("entry_type", "INVENTION_DISCLOSURE")
                    ),
                    document_hash=str(
                        payload.get("document_hash", "")
                    ),
                    inventor_did=str(
                        payload.get("inventor_did", "")
                    ),
                    csoai_attestation=str(
                        payload.get("csoai_attestation", "")
                    ),
                    bitcoin_tx=payload.get("bitcoin_tx"),
                    c2pa_credential_id=payload.get("c2pa_credential_id"),
                    prev_hash=str(row.get("prev_hash", "")),
                    this_hash=str(row.get("hash", "")),
                    ipfs_hash=payload.get("ipfs_hash"),
                    metadata=payload.get("metadata") or {},
                )
                audit_log._chain.append(entry)
                in_mem_indices.add(idx)
                reconciled += 1
            except Exception as e:
                log.warning(
                    "[audit-pg] failed to reconcile entry %d: %s", idx, e
                )

        return {
            "available": True,
            "reconciled": reconciled,
            "in_memory_after": audit_log.get_length(),
            "in_pg": in_pg,
        }


# Module-level singleton (lazily created by the service)
_singleton: Optional[AuditPersistence] = None


def get_persistence() -> AuditPersistence:
    global _singleton
    if _singleton is None:
        _singleton = AuditPersistence()
    return _singleton
