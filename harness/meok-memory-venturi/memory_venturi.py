"""Revision-bound result reuse for the existing MEOK receiver.

This is a derived cache, not an authority store, learned memory or execution gate.
The authenticated host supplies context, access checks, source resolver, validator
and deterministic computation. Never obtain those callbacks from tool arguments.
"""
from __future__ import annotations
import hashlib
import json
import math
import sqlite3
import threading
import time
from dataclasses import dataclass
from typing import Callable, Mapping

VERSION = '0.1.0'
MAX_PAYLOAD = 1_048_576

class Refused(ValueError):
    """A named refusal without remote exception or credential disclosure."""

def canonical(value) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False,
                      allow_nan=False).encode('utf-8')

def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()

def _text(value, name, maximum=256):
    if not isinstance(value, str) or not value or len(value.encode()) > maximum:
        raise Refused('INVALID_' + name.upper())
    return value

@dataclass(frozen=True)
class HostContext:
    tenant: str
    principal: str
    policy_epoch: str
    expires_at: float

@dataclass(frozen=True)
class WorkerIdentity:
    model: str
    model_revision: str
    tokenizer_revision: str
    adapter_revision: str
    runtime_revision: str
    prompt_revision: str
    sampling_revision: str
    validator_revision: str

@dataclass(frozen=True)
class SourceState:
    revision: str
    current: bool

@dataclass(frozen=True)
class Request:
    body: bytes
    dependencies: tuple[str, ...]
    worker: WorkerIdentity
    ttl_seconds: float = 60.0
    dependency_closure_complete: bool = True
    deterministic_or_explicit_replay: bool = True

class RevisionBoundCache:
    """SQLite-backed, rebuildable memoization. No model/tool/network is called here.

    resolve(ctx, source_ids) must return a trustworthy, consistent source snapshot.
    authorise(ctx, source_ids) must consult current host authority on EVERY call.
    Caller strings and hashes alone are not authentication or source verification.
    A cross-service authority/source transaction is outside this cache's scope.
    """
    def __init__(self, path: str, *, resolve: Callable, authorise: Callable,
                 clock: Callable = time.time, max_entries: int = 256):
        if type(max_entries) is not int or not 1 <= max_entries <= 10000:
            raise Refused('INVALID_CAPACITY')
        self.resolve, self.authorise, self.clock = resolve, authorise, clock
        self.max_entries = max_entries
        self.lock = threading.RLock()
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.execute('PRAGMA busy_timeout=5000')
        self.db.execute('''CREATE TABLE IF NOT EXISTS result_cache
            (key TEXT PRIMARY KEY, tenant TEXT NOT NULL, principal TEXT NOT NULL,
             dependencies TEXT NOT NULL, payload BLOB NOT NULL, payload_sha TEXT NOT NULL,
             expires REAL NOT NULL, touched REAL NOT NULL)''')
        self.db.execute('CREATE TABLE IF NOT EXISTS cache_epochs (tenant TEXT PRIMARY KEY, epoch INTEGER NOT NULL)')
        self.db.execute('''CREATE TABLE IF NOT EXISTS cache_source_epochs
            (tenant TEXT NOT NULL, source TEXT NOT NULL, epoch INTEGER NOT NULL,
             PRIMARY KEY (tenant, source))''')
        self.db.commit()
        self.closed = False

    def close(self):
        with self.lock:
            self.db.close(); self.closed = True

    def _snapshot(self, ctx: HostContext, req: Request) -> dict[str, str]:
        if not isinstance(ctx, HostContext) or not isinstance(req, Request):
            raise Refused('HOST_CONTRACT_REQUIRED')
        for n in ('tenant', 'principal', 'policy_epoch'):
            _text(getattr(ctx, n), n)
        now = self.clock()
        if type(ctx.expires_at) not in (float, int) or not math.isfinite(ctx.expires_at) or now >= ctx.expires_at:
            raise Refused('HOST_CONTEXT_EXPIRED')
        if not isinstance(req.body, bytes) or len(req.body) > 65536:
            raise Refused('INVALID_REQUEST_BYTES')
        if type(req.ttl_seconds) not in (float, int) or not math.isfinite(req.ttl_seconds) or not 0 < req.ttl_seconds <= 86400:
            raise Refused('INVALID_TTL')
        if req.dependency_closure_complete is not True:
            raise Refused('DEPENDENCY_COVERAGE_INCOMPLETE')
        if req.deterministic_or_explicit_replay is not True:
            raise Refused('REPLAY_NOT_PERMITTED')
        if not isinstance(req.worker, WorkerIdentity):
            raise Refused('WORKER_IDENTITY_REQUIRED')
        for n, v in vars(req.worker).items(): _text(v, n)
        if (not isinstance(req.dependencies, tuple) or not 1 <= len(req.dependencies) <= 128
                or any(not isinstance(x, str) for x in req.dependencies)
                or len(set(req.dependencies)) != len(req.dependencies)):
            raise Refused('INVALID_DEPENDENCIES')
        for source in req.dependencies: _text(source, 'source')
        if self.authorise(ctx, req.dependencies) is not True:
            raise Refused('ACCESS_DENIED')
        state = self.resolve(ctx, req.dependencies)
        if not isinstance(state, Mapping) or set(state) != set(req.dependencies):
            raise Refused('SOURCE_SNAPSHOT_INCOMPLETE')
        result = {}
        for source, s in state.items():
            if not isinstance(s, SourceState) or s.current is not True:
                raise Refused('SOURCE_NOT_CURRENT')
            _text(s.revision, 'source_revision')
            result[source] = s.revision
        return dict(sorted(result.items()))

    def _impact_snapshot(self, ctx: HostContext, req: Request) -> dict[str, int]:
        # Persistent invalidation generations, not authority or source truth.
        placeholders = ','.join('?' for _ in req.dependencies)
        rows = self.db.execute(
            'SELECT source,epoch FROM cache_source_epochs WHERE tenant=? '
            'AND source IN (' + placeholders + ')',
            (ctx.tenant, *req.dependencies)).fetchall()
        epochs = dict(rows)
        return {source: epochs.get(source, 0) for source in sorted(req.dependencies)}

    def run(self, ctx: HostContext, req: Request, *, compute: Callable, verify: Callable) -> dict:
        start = time.perf_counter()
        with self.lock:
            if self.closed: raise Refused('CACHE_CLOSED')
            pins = self._snapshot(ctx, req)
            erow = self.db.execute('SELECT epoch FROM cache_epochs WHERE tenant=?',(ctx.tenant,)).fetchone()
            epoch = erow[0] if erow else 0
            impact_epochs = self._impact_snapshot(ctx, req)
            descriptor = {'tenant':ctx.tenant, 'principal':ctx.principal,
                          'policy_epoch':ctx.policy_epoch, 'cache_epoch':epoch, 'request_sha256':digest(req.body),
                          'max_reuse_seconds':float(req.ttl_seconds),
                          'worker':vars(req.worker), 'source_revisions':pins,
                          'source_impact_epochs':impact_epochs}
            key = digest(canonical(descriptor))
            row = self.db.execute('SELECT payload,payload_sha,expires FROM result_cache WHERE key=?', (key,)).fetchone()
            now = self.clock(); hit = False; corruption_rejected = False
            if row:
                payload = bytes(row[0])
                if row[2] > now and digest(payload) == row[1] and verify(payload) is True:
                    # Recheck the trusted host after validation; never cache authority.
                    if self._snapshot(ctx, req) != pins: raise Refused('SOURCE_CHANGED_DURING_LOOKUP')
                    after = self.db.execute('SELECT epoch FROM cache_epochs WHERE tenant=?',(ctx.tenant,)).fetchone()
                    if (after[0] if after else 0) != epoch: raise Refused('INVALIDATED_DURING_LOOKUP')
                    if self._impact_snapshot(ctx, req) != impact_epochs: raise Refused('INVALIDATED_DURING_LOOKUP')
                    self.db.execute('UPDATE result_cache SET touched=? WHERE key=?', (now,key)); self.db.commit()
                    hit = True
                else:
                    corruption_rejected = digest(payload) != row[1]
                    self.db.execute('DELETE FROM result_cache WHERE key=?',(key,)); self.db.commit()
            if hit:
                return self._result(payload, key, pins, True, start, corruption_rejected)
        # Deliberately outside DB lock. No single-flight/distributed transaction claim.
        payload = compute(req.body, dict(pins))
        if not isinstance(payload, bytes) or not payload or len(payload) > MAX_PAYLOAD:
            raise Refused('INVALID_RESULT_BYTES')
        if verify(payload) is not True: raise Refused('RESULT_NOT_VERIFIED')
        with self.lock:
            if self.closed: raise Refused('CACHE_CLOSED')
            if self._snapshot(ctx, req) != pins: raise Refused('SOURCE_CHANGED_DURING_COMPUTE')
            erow = self.db.execute('SELECT epoch FROM cache_epochs WHERE tenant=?',(ctx.tenant,)).fetchone()
            if (erow[0] if erow else 0) != epoch: raise Refused('INVALIDATED_DURING_COMPUTE')
            if self._impact_snapshot(ctx, req) != impact_epochs: raise Refused('INVALIDATED_DURING_COMPUTE')
            now = self.clock()
            expiry = min(now + req.ttl_seconds, ctx.expires_at)
            self.db.execute('INSERT OR REPLACE INTO result_cache VALUES (?,?,?,?,?,?,?,?)',
                            (key,ctx.tenant,ctx.principal,json.dumps(pins,sort_keys=True),payload,digest(payload),expiry,now))
            self.db.execute('''DELETE FROM result_cache WHERE key IN
                (SELECT key FROM result_cache ORDER BY touched DESC,key DESC LIMIT -1 OFFSET ?)''', (self.max_entries,))
            self.db.commit()
        return self._result(payload, key, pins, False, start, corruption_rejected)

    @staticmethod
    def _result(payload, key, pins, hit, start, corruption):
        return {'state':'REUSED_RESULT' if hit else 'FRESH_RESULT', 'payload':payload,
                'cache_key':key, 'payload_sha256':digest(payload), 'source_revisions':pins,
                'corruption_rejected':corruption, 'elapsed_seconds':time.perf_counter()-start,
                'authority_reused':False, 'training_performed':False,
                'canonical_gspc_admission':False}

    def invalidate_from_impact(self, *, tenant: str, affected: tuple[str,...], truncated: bool) -> dict:
        """Host-only hook for the EXISTING dependency traversal, not another graph.

        A truncated traversal flushes all entries for the tenant. Complete impact
        only removes matching dependency entries. Full source checks still run on
        each hit, even if an invalidation message is lost.
        """
        _text(tenant, 'tenant')
        if type(truncated) is not bool or not isinstance(affected, tuple) or len(affected)>10000:
            raise Refused('INVALID_IMPACT')
        for a in affected: _text(a,'affected')
        with self.lock:
            if self.closed: raise Refused('CACHE_CLOSED')
            if truncated:
                self.db.execute('INSERT INTO cache_epochs VALUES (?,1) ON CONFLICT(tenant) DO UPDATE SET epoch=epoch+1',(tenant,))
            elif affected:
                self.db.executemany(
                    'INSERT INTO cache_source_epochs VALUES (?,?,1) '
                    'ON CONFLICT(tenant,source) DO UPDATE SET epoch=epoch+1',
                    [(tenant, source) for source in sorted(set(affected))])
            rows = self.db.execute('SELECT key,dependencies FROM result_cache WHERE tenant=?',(tenant,)).fetchall()
            keys = [key for key,deps in rows if truncated or set(affected).intersection(json.loads(deps))]
            self.db.executemany('DELETE FROM result_cache WHERE key=?', [(k,) for k in keys]); self.db.commit()
        return {'invalidated':len(keys),'coverage':'TENANT_FLUSH' if truncated else 'DECLARED_IMPACT',
                'truncated_input':truncated, 'model_unlearning_performed':False}

    def count(self) -> int:
        with self.lock:return self.db.execute('SELECT COUNT(*) FROM result_cache').fetchone()[0]
