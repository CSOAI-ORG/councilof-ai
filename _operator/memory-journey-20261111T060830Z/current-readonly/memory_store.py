"""Bounded immutable conversation snapshots on an explicitly mounted volume.

The service authenticates every operation. The filesystem backend is private
implementation, not a Gradio endpoint. Locks coordinate threads/processes on one
mount; independent replicas/mounts require a different quota/locking backend.
SHA256 detects corruption/substitution, not a malicious storage administrator.
"""
from __future__ import annotations
from contextlib import contextmanager
from datetime import datetime, timezone
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import stat
import threading

import conversation as chat
from memory_auth import verified_owner

SCHEMA = "meok.saved-conversation/1"
BASE_SPACE_REVISION = "8339ca14e40024b166d5235f74845118aab6b8f6"
SOURCE_SPACE = "Nicholastempleman/meok-hf-runtime"
MAX_COPIES = 20
MAX_RECORD_BYTES = 2 * chat.MAX_SNAPSHOT_BYTES + 8192
_HEX = re.compile(r"[0-9a-f]{64}")
_FIELDS = {"schema", "owner_sha256", "created_at", "nonce", "export_text",
           "export_sha256", "provenance", "snapshot_sha256"}
_LOCKS = [threading.RLock() for _ in range(64)]
_DIR_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
_FILE_FLAGS = os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK


class MemoryStoreError(ValueError):
    pass


def _canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":"), allow_nan=False).encode("utf-8")


def _key(value):
    if not isinstance(value, str) or _HEX.fullmatch(value) is None:
        raise MemoryStoreError("Choose a valid saved copy.")
    return value


def source_provenance():
    """Identify actual server source, without trusting client metadata."""
    root = Path(__file__).parent
    digest = hashlib.sha256()
    for name in ("app.py", "core.py", "conversation.py", "conversation_ui.py",
                 "memory_auth.py", "memory_store.py", "memory_ui.py"):
        data = (root / name).read_bytes()
        if len(data) > 1_000_000:
            raise MemoryStoreError("Runtime provenance could not be established.")
        digest.update(name.encode() + b"\0" + data + b"\0")
    return {"source_space": SOURCE_SPACE, "base_space_revision": BASE_SPACE_REVISION,
            "runtime_source_sha256": digest.hexdigest(),
            "chat_version": chat.VERSION, "save_kind": "explicit-user-save",
            "scope": "conversation-text-only"}


def _unique_json(pairs):
    value = {}
    for key, item in pairs:
        if key in value:
            raise MemoryStoreError("Saved copy contains duplicate fields.")
        value[key] = item
    return value


def _reject_constant(value):
    raise MemoryStoreError("Saved copy contains invalid numbers.")


class SnapshotStore:
    """One mounted volume, with a bounded namespace for each authenticated owner."""

    def __init__(self, root, *, require_mount=True):
        if not isinstance(root, (str, Path)) or not str(root):
            raise MemoryStoreError("Saved copies are unavailable: persistent storage is not configured.")
        self.root = Path(root)
        if not self.root.is_absolute() or ".." in self.root.parts:
            raise MemoryStoreError("Saved copies are unavailable: invalid storage configuration.")
        self.require_mount = require_mount

    @contextmanager
    def _root(self):
        # Never create the configured mount path or fall back to ephemeral disk.
        if self.require_mount and not os.path.ismount(self.root):
            raise MemoryStoreError("Saved copies are unavailable: persistent storage is not mounted.")
        fd = os.open("/", _DIR_FLAGS)
        try:
            # Open each ancestor without following symlinks; dirfd-relative child
            # operations cannot be redirected by swapping an ancestor afterward.
            for part in self.root.parts[1:]:
                next_fd = os.open(part, _DIR_FLAGS, dir_fd=fd)
                os.close(fd)
                fd = next_fd
            if self.require_mount:
                current = os.stat(self.root, follow_symlinks=False)
                opened = os.fstat(fd)
                if (not os.path.ismount(self.root)
                        or (current.st_dev, current.st_ino) != (opened.st_dev, opened.st_ino)):
                    raise MemoryStoreError("Persistent storage changed. Retry after it is available.")
            yield fd
        finally:
            os.close(fd)

    @contextmanager
    def _owner(self, owner, *, create=False):
        owner = _key(owner)
        # Fixed lock stripes avoid an unbounded in-memory identity registry.
        with _LOCKS[int(owner[:2], 16) % len(_LOCKS)]:
            with self._root() as root_fd:
                namespace_fd = owner_fd = lock_fd = None
                try:
                    if create:
                        try:
                            os.mkdir("chat-v1", mode=0o700, dir_fd=root_fd)
                        except FileExistsError:
                            pass
                    try:
                        namespace_fd = os.open("chat-v1", _DIR_FLAGS, dir_fd=root_fd)
                    except FileNotFoundError:
                        yield None
                        return
                    if create:
                        try:
                            os.mkdir(owner, mode=0o700, dir_fd=namespace_fd)
                        except FileExistsError:
                            pass
                    try:
                        owner_fd = os.open(owner, _DIR_FLAGS, dir_fd=namespace_fd)
                    except FileNotFoundError:
                        yield None
                        return
                    lock_fd = os.open(".lock", os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK,
                                      0o600, dir_fd=owner_fd)
                    lock_info = os.fstat(lock_fd)
                    if not stat.S_ISREG(lock_info.st_mode) or lock_info.st_nlink != 1:
                        raise MemoryStoreError("Saved-copy storage failed its safety check.")
                    try:
                        fcntl.flock(lock_fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
                    except BlockingIOError:
                        raise MemoryStoreError("Another saved-copy operation is running. Please retry.") from None
                    yield owner_fd
                finally:
                    if lock_fd is not None:
                        os.close(lock_fd)
                    if owner_fd is not None:
                        os.close(owner_fd)
                    if namespace_fd is not None:
                        os.close(namespace_fd)

    def _names(self, fd):
        if fd is None:
            return []
        names = []
        with os.scandir(fd) as entries:
            for entry in entries:
                if entry.name == ".lock":
                    continue
                if (not entry.name.endswith(".json")
                        or _HEX.fullmatch(entry.name[:-5]) is None
                        or not entry.is_file(follow_symlinks=False)):
                    raise MemoryStoreError("Saved-copy storage contains an invalid entry.")
                names.append(entry.name[:-5])
                if len(names) > MAX_COPIES:
                    raise MemoryStoreError("Saved-copy storage exceeds its account limit.")
        return names

    def _read(self, fd, owner, snapshot_id):
        snapshot_id = _key(snapshot_id)
        if fd is None:
            raise MemoryStoreError("This saved copy was not found for your account.")
        try:
            file_fd = os.open(snapshot_id + ".json", _FILE_FLAGS, dir_fd=fd)
        except FileNotFoundError:
            raise MemoryStoreError("This saved copy was not found for your account.") from None
        with os.fdopen(file_fd, "rb") as stream:
            info = os.fstat(stream.fileno())
            if (not stat.S_ISREG(info.st_mode) or info.st_nlink != 1
                    or info.st_size > MAX_RECORD_BYTES):
                raise MemoryStoreError("Saved copy failed its file safety or size check.")
            raw = stream.read(MAX_RECORD_BYTES + 1)
        if len(raw) > MAX_RECORD_BYTES:
            raise MemoryStoreError("Saved copy exceeds its size limit.")
        try:
            record = json.loads(raw.decode("utf-8"), object_pairs_hook=_unique_json,
                                parse_constant=_reject_constant)
            if (not isinstance(record, dict) or set(record) != _FIELDS
                    or record.get("schema") != SCHEMA or record.get("owner_sha256") != owner
                    or record.get("snapshot_sha256") != snapshot_id):
                raise MemoryStoreError("Saved copy failed its owner or format check.")
            body = {key: value for key, value in record.items() if key != "snapshot_sha256"}
            if hashlib.sha256(_canonical(body)).hexdigest() != snapshot_id:
                raise MemoryStoreError("Saved-copy checksum does not match.")
            text = record["export_text"]
            if (not isinstance(text, str)
                    or len(text.encode("utf-8")) > chat.MAX_SNAPSHOT_BYTES
                    or hashlib.sha256(text.encode("utf-8")).hexdigest() != record["export_sha256"]):
                raise MemoryStoreError("Conversation-text checksum does not match.")
            provenance = record["provenance"]
            if (not isinstance(provenance, dict)
                    or provenance.get("scope") != "conversation-text-only"
                    or provenance.get("save_kind") != "explicit-user-save"
                    or provenance.get("source_space") != SOURCE_SPACE
                    or not isinstance(provenance.get("runtime_source_sha256"), str)
                    or _HEX.fullmatch(provenance["runtime_source_sha256"]) is None):
                raise MemoryStoreError("Saved-copy provenance is invalid.")
            if (not isinstance(record["nonce"], str)
                    or re.fullmatch(r"[0-9a-f]{32}", record["nonce"]) is None
                    or datetime.fromisoformat(record["created_at"]).tzinfo is None):
                raise MemoryStoreError("Saved-copy metadata is invalid.")
            restored = chat.restore_text(text)
            if not restored["chat_messages"]:
                raise MemoryStoreError("The saved copy contains no conversation.")
        except (TypeError, KeyError, UnicodeError, RecursionError, ValueError) as exc:
            if isinstance(exc, MemoryStoreError):
                raise
            raise MemoryStoreError("Saved copy failed validation; no conversation was restored.") from None
        return record, restored

    @staticmethod
    def _summary(record, restored):
        return {"snapshot_id": record["snapshot_sha256"], "created_at": record["created_at"],
                "messages": len(restored["chat_messages"]),
                "export_sha256": record["export_sha256"], "provenance": record["provenance"]}

    def save(self, owner, state, provenance):
        owner = _key(owner)
        text = chat.export_text(state)
        restored = chat.restore_text(text)
        if not restored["chat_messages"]:
            raise MemoryStoreError("Start a conversation before saving a copy.")
        body = {"schema": SCHEMA, "owner_sha256": owner,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "nonce": secrets.token_hex(16), "export_text": text,
                "export_sha256": hashlib.sha256(text.encode("utf-8")).hexdigest(),
                "provenance": provenance}
        snapshot_id = hashlib.sha256(_canonical(body)).hexdigest()
        payload = _canonical(dict(body, snapshot_sha256=snapshot_id))
        if len(payload) > MAX_RECORD_BYTES:
            raise MemoryStoreError("Conversation exceeds the saved-copy size limit.")
        with self._owner(owner, create=True) as fd:
            if len(self._names(fd)) >= MAX_COPIES:
                raise MemoryStoreError("You have 20 saved copies. Remove a saved copy before saving another.")
            created = False
            try:
                file_fd = os.open(snapshot_id + ".json",
                                  os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW,
                                  0o600, dir_fd=fd)
                created = True
                with os.fdopen(file_fd, "wb") as stream:
                    stream.write(payload)
                    stream.flush()
                    os.fsync(stream.fileno())
                # Close, then reopen and verify before reporting a completed save.
                record, loaded = self._read(fd, owner, snapshot_id)
                return self._summary(record, loaded)
            except Exception:
                if created:
                    try:
                        os.unlink(snapshot_id + ".json", dir_fd=fd)
                    except OSError:
                        pass
                raise

    def list(self, owner):
        owner = _key(owner)
        with self._owner(owner) as fd:
            rows = [self._summary(*self._read(fd, owner, name)) for name in self._names(fd)]
        return sorted(rows, key=lambda row: (row["created_at"], row["snapshot_id"]), reverse=True)

    def restore(self, owner, snapshot_id):
        owner = _key(owner)
        with self._owner(owner) as fd:
            record, restored = self._read(fd, owner, snapshot_id)
        return restored, self._summary(record, restored)

    def remove(self, owner, snapshot_id):
        owner = _key(owner)
        with self._owner(owner) as fd:
            self._read(fd, owner, snapshot_id)
            os.unlink(_key(snapshot_id) + ".json", dir_fd=fd)
            try:
                os.stat(snapshot_id + ".json", dir_fd=fd, follow_symlinks=False)
            except FileNotFoundError:
                return {"removed_snapshot_id": snapshot_id}
            raise MemoryStoreError("Removal could not be confirmed. Refresh your saved-copy list.")


def configured_store():
    # Only the operator sets this, after a private bucket mount is verified.
    return SnapshotStore(os.environ.get("MEOK_MEMORY_ROOT", ""), require_mount=True)


class MemoryService:
    """All user-facing operations start with a new authentication check."""

    def _run(self, operation, oauth_token=None, request=None):
        owner = verified_owner(oauth_token, request)
        try:
            return operation(configured_store(), owner)
        except MemoryStoreError:
            raise
        except (OSError, UnicodeError, ValueError, TypeError, RecursionError):
            raise MemoryStoreError(
                "The saved-copy operation could not be confirmed. No success is claimed. "
                "Your current conversation is unchanged; you can still export it."
            ) from None

    def save(self, state, consent, oauth_token=None, request=None):
        if consent is not True:
            raise MemoryStoreError("Tick the saved-copy consent box before saving.")
        return self._run(lambda store, owner: store.save(owner, state, source_provenance()),
                         oauth_token, request)

    def list(self, oauth_token=None, request=None):
        return self._run(lambda store, owner: store.list(owner), oauth_token, request)

    def restore(self, snapshot_id, oauth_token=None, request=None):
        return self._run(lambda store, owner: store.restore(owner, snapshot_id), oauth_token, request)

    def remove(self, snapshot_id, oauth_token=None, request=None):
        return self._run(lambda store, owner: store.remove(owner, snapshot_id), oauth_token, request)
