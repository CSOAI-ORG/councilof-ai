#!/usr/bin/env python3
"""mcp2026_shim.py - bidirectional wire-translation middleware for MCP.

Bridges the stateless MCP wire (spec 2026-07-28) and the legacy handshake wire
(2024-11-05 / 2025-03-26 / 2025-06-18 / 2025-11-25) with **zero third-party
dependencies**.

What the 2026-07-28 revision changed
------------------------------------
* stateless: no ``initialize`` / ``initialized`` handshake, no ``Mcp-Session-Id``
* every request carries a mandatory ``Mcp-Method`` header
* ``tools/call``, ``resources/read`` and ``prompts/get`` carry a mandatory
  ``Mcp-Name`` header
* ``server/discover`` replaces session discovery
* MRTR: ``resultType: "input_required"`` is a first-class, forward-compatible
  result state that middleboxes must forward untouched
* 12-month deprecation clock - the old wire dies in **July 2027**

Pure-function core (no server needed, fully unit-testable)::

    from mcp2026_shim import translate_request, translate_response

    out_headers, out_body, notes = translate_request(headers, body)

``notes`` is a list of machine-readable strings.  Any note beginning with
``respond-local:`` means the shim answered the exchange itself and the caller
MUST NOT forward - ``is_local_reply(notes)`` is the predicate.

Two ASGI/WSGI wrappers are provided for hosts that want the whole HTTP path
handled (``ShimASGI``, ``ShimWSGI``).  Note that MCP stdio transports carry no
HTTP headers, so the shim does not apply to them.

Limitations (documented on purpose): request/response bodies are buffered, so
server-sent-event streaming through the wrappers is not supported.  Use the
pure functions in front of a streaming transport if you need SSE.
"""

from __future__ import annotations

import copy
import json
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Sequence, Tuple

WIRE_2026 = "2026-07-28"
WIRE_LEGACY = "2025-11-25"

METHOD_HEADER = "Mcp-Method"
NAME_HEADER = "Mcp-Name"
SESSION_HEADER = "Mcp-Session-Id"
PROTOCOL_HEADER = "Mcp-Protocol-Version"

NOTE_RESPOND = "respond-local"
NOTE_FORWARD = "forward"
NOTE_MRTR = "mrtr-passthrough"

# Methods that require the mandatory Mcp-Name header on the 2026 wire.
NAME_REQUIRED_METHODS = frozenset({"tools/call", "resources/read", "prompts/get"})

HANDSHAKE_METHOD = "initialize"
HANDSHAKE_ACK = "notifications/initialized"
DISCOVER_METHOD = "server/discover"

JSONRPC_ERROR_INVALID_PARAMS = -32602

Headers = Dict[str, str]
Notes = List[str]


# --------------------------------------------------------------------------- #
# configuration
# --------------------------------------------------------------------------- #


SHIM_VERSION = "1.0.0"


@dataclass
class ShimConfig:
    """Everything the shim needs to answer a local exchange."""

    protocol_version: str = WIRE_2026
    legacy_protocol_version: str = WIRE_LEGACY
    server_info: Dict[str, Any] = field(
        default_factory=lambda: {"name": "mcp2026-shim", "version": SHIM_VERSION}
    )
    capabilities: Dict[str, Any] = field(
        default_factory=lambda: {"tools": {}, "resources": {}, "prompts": {}}
    )

    def discover_result(self) -> Dict[str, Any]:
        """Result for the 2026-07-28 ``server/discover`` RPC."""
        return {
            "protocolVersion": self.protocol_version,
            "capabilities": copy.deepcopy(self.capabilities),
            "serverInfo": copy.deepcopy(self.server_info),
        }

    def legacy_initialize_result(self) -> Dict[str, Any]:
        """Result the shim hands a legacy client that still speaks the handshake."""
        return {
            "protocolVersion": self.legacy_protocol_version,
            "capabilities": copy.deepcopy(self.capabilities),
            "serverInfo": copy.deepcopy(self.server_info),
        }


def default_config() -> ShimConfig:
    return ShimConfig()


# --------------------------------------------------------------------------- #
# header helpers (case-insensitive on the way in, canonical on the way out)
# --------------------------------------------------------------------------- #


def _find_key(headers: Headers, name: str) -> Optional[str]:
    lowered = name.lower()
    for key in headers:
        if key.lower() == lowered:
            return key
    return None


def get_header(headers: Headers, name: str) -> Optional[str]:
    key = _find_key(headers, name)
    return headers[key] if key is not None else None


def set_header(headers: Headers, name: str, value: str) -> Headers:
    """Return a new header dict with *name* set (preserving existing casing)."""
    out = dict(headers)
    key = _find_key(out, name)
    out[key if key is not None else name] = value
    return out


def drop_header(headers: Headers, name: str) -> Headers:
    key = _find_key(headers, name)
    if key is None:
        return dict(headers)
    out = dict(headers)
    del out[key]
    return out


def is_local_reply(notes: Sequence[str]) -> bool:
    """True when the shim answered the exchange instead of forwarding it."""
    return any(note.startswith(NOTE_RESPOND) for note in notes)


# --------------------------------------------------------------------------- #
# body helpers
# --------------------------------------------------------------------------- #


def _inject_protocol_meta(body: Dict[str, Any], version: str) -> Tuple[Dict[str, Any], bool]:
    """Set ``params._meta.protocolVersion`` without clobbering existing keys.

    Returns ``(new_body, changed)``.  Any ``resultType`` (MRTR) subtree is
    never touched - we only ever write into ``params._meta``.
    """
    params = body.get("params")
    if not isinstance(params, dict):
        params = {}
    meta = params.get("_meta")
    if not isinstance(meta, dict):
        meta = {}
    if meta.get("protocolVersion") == version:
        return body, False
    new_meta = dict(meta)
    new_meta["protocolVersion"] = version
    new_params = dict(params)
    new_params["_meta"] = new_meta
    new_body = dict(body)
    new_body["params"] = new_params
    return new_body, True


def _find_result_type(body: Any) -> Optional[Any]:
    """Locate a MRTR ``resultType`` value anywhere in a JSON-RPC body."""
    if isinstance(body, dict):
        for key in ("resultType", "result_type"):
            if key in body:
                return body[key]
        for value in body.values():
            found = _find_result_type(value)
            if found is not None:
                return found
    elif isinstance(body, list):
        for item in body:
            found = _find_result_type(item)
            if found is not None:
                return found
    return None


def _envelope(body: Dict[str, Any], result: Optional[Dict[str, Any]] = None,
              error: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    out: Dict[str, Any] = {"jsonrpc": "2.0"}
    if "id" in body:
        out["id"] = body["id"]
    if error is not None:
        out["error"] = error
    else:
        out["result"] = result if result is not None else {}
    return out


def _local_reply(body: Dict[str, Any], result: Dict[str, Any], note: str,
                 extra: Sequence[str] = ()) -> Tuple[Headers, Dict[str, Any], Notes]:
    notes: Notes = [f"{NOTE_RESPOND}:{note}"]
    notes.extend(extra)
    headers: Headers = {"Content-Type": "application/json"}
    return headers, _envelope(body, result=result), notes


def _local_error(body: Dict[str, Any], code: int, message: str, note: str):
    notes: Notes = [f"{NOTE_RESPOND}:{note}", f"error:{code}"]
    headers: Headers = {"Content-Type": "application/json"}
    return headers, _envelope(body, error={"code": code, "message": message}), notes


# --------------------------------------------------------------------------- #
# request translation (inbound wire -> internal 2026 state)
# --------------------------------------------------------------------------- #


def translate_request(
    headers: Headers,
    body: Any,
    config: Optional[ShimConfig] = None,
) -> Tuple[Headers, Dict[str, Any], Notes]:
    """Translate one inbound JSON-RPC exchange.

    * **2026-07-28 request** (carries ``Mcp-Method``, no handshake): internal
      state is synthesized - ``params._meta.protocolVersion`` is injected,
      ``Mcp-Name`` is validated, any stray session header is stripped.
    * **legacy handshake**: answered locally with a 2025-11-25-compatible
      ``InitializeResult``; no session requirement is ever emitted.
    * **``server/discover``**: answered locally with
      ``{protocolVersion, capabilities, serverInfo}``.
    * **MRTR**: any ``resultType`` subtree is passed through byte-for-byte.
    * **legacy non-handshake**: ``Mcp-Method`` (and ``Mcp-Name`` when it can be
      derived) are synthesized from the JSON-RPC body, session state stripped,
      then forwarded on the internal 2026 wire.

    Returns ``(out_headers, out_body, notes)``.
    """
    cfg = config or default_config()
    notes: Notes = []

    if isinstance(body, list):
        # JSON-RPC batching was removed in 2025-06-18; forward untouched.
        return dict(headers), body, ["unsupported-batch-passthrough"]
    if not isinstance(body, dict):
        return dict(headers), body, ["malformed-body-passthrough"]
    if "method" not in body:
        # A response-shaped body: nothing to translate inbound.
        return dict(headers), copy.deepcopy(body), ["response-body-passthrough"]

    method = str(body["method"])
    out_headers = dict(headers)
    result_type = _find_result_type(body)
    if result_type is not None:
        notes.append(f"{NOTE_MRTR}:{result_type}")

    # ---- local exchanges -------------------------------------------------- #
    if method == DISCOVER_METHOD:
        h, b, n = _local_reply(body, cfg.discover_result(), DISCOVER_METHOD,
                               ["stateless-wire"])
        notes.extend(n)
        return h, b, notes

    if method == HANDSHAKE_METHOD:
        extra = ["legacy-handshake-answered", "session-requirements-stripped"]
        h, b, n = _local_reply(body, cfg.legacy_initialize_result(), HANDSHAKE_METHOD, extra)
        notes.extend(n)
        return h, b, notes

    if method == HANDSHAKE_ACK:
        # Notifications have no result; ack without forwarding the handshake.
        notes.append(f"{NOTE_RESPOND}:{HANDSHAKE_ACK}")
        notes.append("session-requirements-stripped")
        return {"Content-Type": "application/json"}, {}, notes

    # ---- forwarded exchanges ---------------------------------------------- #
    existing_method = get_header(out_headers, METHOD_HEADER)
    has_session_header = get_header(out_headers, SESSION_HEADER) is not None
    wire = "2026" if existing_method is not None else ("legacy" if has_session_header else "unknown")
    if existing_method is None:
        out_headers = set_header(out_headers, METHOD_HEADER, method)
        notes.append("mcp-method-header-added")
    elif existing_method != method:
        # Header/body disagreement: the JSON-RPC body is authoritative.
        out_headers = set_header(out_headers, METHOD_HEADER, method)
        notes.append("mcp-method-normalized")

    if has_session_header:
        # The 2026 wire is stateless - session state never reaches upstream.
        out_headers = drop_header(out_headers, SESSION_HEADER)
        notes.append("session-id-stripped")

    if method in NAME_REQUIRED_METHODS:
        name_value = get_header(out_headers, NAME_HEADER)
        if name_value is None:
            params = body.get("params")
            derived = params.get("name") if isinstance(params, dict) else None
            if isinstance(derived, str) and derived:
                out_headers = set_header(out_headers, NAME_HEADER, derived)
                notes.append("mcp-name-header-derived")
            else:
                return _local_error(
                    body,
                    JSONRPC_ERROR_INVALID_PARAMS,
                    f"{NAME_HEADER} header required for {method} on MCP {WIRE_2026} wire",
                    "missing-mcp-name",
                )
        elif not str(name_value):
            return _local_error(
                body,
                JSONRPC_ERROR_INVALID_PARAMS,
                f"{NAME_HEADER} header required for {method} on MCP {WIRE_2026} wire",
                "missing-mcp-name",
            )

    body_out, changed = _inject_protocol_meta(body, cfg.protocol_version)
    if changed:
        notes.append("meta-protocol-version-injected")

    if wire == "2026":
        notes.append("wire:2026-07-28")
    elif wire == "legacy":
        notes.append("wire:legacy")
        notes.append("legacy-non-handshake-normalized")
    else:
        notes.append("wire:unknown")
        notes.append("unknown-wire-treated-as-legacy")

    notes.append(NOTE_FORWARD)
    return out_headers, body_out, notes


# --------------------------------------------------------------------------- #
# response translation (internal 2026 state -> outbound wire)
# --------------------------------------------------------------------------- #


def translate_response(
    headers: Headers,
    body: Any,
    client_wire: str = "legacy",
    config: Optional[ShimConfig] = None,
) -> Tuple[Headers, Dict[str, Any], Notes]:
    """Translate one outbound JSON-RPC exchange onto *client_wire*.

    ``client_wire`` is ``"2026"`` or ``"legacy"``.  MRTR ``resultType``
    subtrees are never rewritten.  On the legacy wire the session header is
    dropped and a 2026-07-28 ``protocolVersion`` in a handshake result is
    rewritten to 2025-11-25 so pre-revision clients accept it.
    """
    cfg = config or default_config()
    notes: Notes = []
    if isinstance(body, list):
        return dict(headers), body, ["unsupported-batch-passthrough"]
    if not isinstance(body, dict):
        return dict(headers), body, ["malformed-body-passthrough"]

    out_headers = dict(headers)
    out_body = copy.deepcopy(body)

    result_type = _find_result_type(out_body)
    if result_type is not None:
        notes.append(f"{NOTE_MRTR}:{result_type}")

    if client_wire == "legacy":
        if get_header(out_headers, SESSION_HEADER) is not None:
            out_headers = drop_header(out_headers, SESSION_HEADER)
            notes.append("session-id-stripped")
        result = out_body.get("result")
        if (
            isinstance(result, dict)
            and result.get("protocolVersion") == cfg.protocol_version
            and result_type is None  # never rewrite inside an MRTR exchange
        ):
            result["protocolVersion"] = cfg.legacy_protocol_version
            notes.append("protocol-version-rewritten")
        notes.append("response:legacy-wire")
    else:
        notes.append("response:2026-07-28-wire")

    return out_headers, out_body, notes


# --------------------------------------------------------------------------- #
# ASGI wrapper
# --------------------------------------------------------------------------- #


def _scope_headers(scope: Dict[str, Any]) -> Headers:
    out: Headers = {}
    for raw_key, raw_value in scope.get("headers", []):
        key = raw_key.decode("latin-1")
        value = raw_value.decode("latin-1")
        out[key] = value
    return out


def _pack_headers(headers: Headers) -> List[Tuple[bytes, bytes]]:
    return [(k.encode("latin-1"), v.encode("latin-1")) for k, v in headers.items()]


class ShimASGI:
    """ASGI middleware: terminate legacy exchanges, forward normalized ones.

    ``app`` is any ASGI application.  Bodies are buffered (see module
    docstring) so responses can be translated before they hit the socket.
    """

    def __init__(self, app: Callable, config: Optional[ShimConfig] = None) -> None:
        self.app = app
        self.config = config or default_config()

    async def __call__(self, scope: Dict[str, Any], receive: Callable, send: Callable) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        chunks: List[bytes] = []
        while True:
            message = await receive()
            if message["type"] == "http.disconnect":

                async def dead_receive() -> Dict[str, Any]:
                    return {"type": "http.disconnect"}

                await self.app(scope, dead_receive, send)
                return
            chunks.append(message.get("body", b""))
            if not message.get("more_body", False):
                break
        raw = b"".join(chunks)

        parse_ok = True
        try:
            body = json.loads(raw.decode("utf-8")) if raw.strip() else {}
        except (ValueError, UnicodeDecodeError):
            body = {}
            parse_ok = False

        in_headers = _scope_headers(scope)
        client_wire = "2026" if get_header(in_headers, METHOD_HEADER) else "legacy"
        out_headers, out_body, notes = translate_request(in_headers, body, self.config)

        if is_local_reply(notes):
            payload = json.dumps(out_body).encode("utf-8") if out_body else b""
            status = 200 if payload else 202
            await send(
                {
                    "type": "http.response.start",
                    "status": status,
                    "headers": _pack_headers(out_headers),
                }
            )
            await send({"type": "http.response.body", "body": payload})
            return

        forwarded_scope = dict(scope)
        forwarded_scope["headers"] = _pack_headers(out_headers)
        # A body we could not parse is forwarded byte-for-byte: silently
        # replacing it with "{}" would corrupt the exchange.
        payload = json.dumps(out_body).encode("utf-8") if parse_ok else raw

        replay: List[Dict[str, Any]] = [
            {"type": "http.request", "body": payload, "more_body": False}
        ]

        async def replay_receive() -> Dict[str, Any]:
            if replay:
                return replay.pop(0)
            return {"type": "http.disconnect"}

        collected: List[Dict[str, Any]] = []

        async def capturing_send(message: Dict[str, Any]) -> None:
            collected.append(message)

        await self.app(forwarded_scope, replay_receive, capturing_send)

        start = next(
            (m for m in collected if m["type"] == "http.response.start"), None
        )
        if start is None:
            for message in collected:
                await send(message)
            return

        raw_chunks = [
            m.get("body", b"") for m in collected if m["type"] == "http.response.body"
        ]
        response_raw = b"".join(raw_chunks)
        try:
            response_body = json.loads(response_raw.decode("utf-8")) if response_raw else {}
        except (ValueError, UnicodeDecodeError):
            response_body = {}

        out_resp_headers = {
            k.decode("latin-1"): v.decode("latin-1")
            for k, v in start.get("headers", [])
        }
        translated_headers, translated_body, resp_notes = translate_response(
            out_resp_headers, response_body, client_wire=client_wire, config=self.config
        )
        payload_out = (
            json.dumps(translated_body).encode("utf-8") if translated_body else response_raw
        )
        await send(
            {
                "type": "http.response.start",
                "status": start["status"],
                "headers": _pack_headers(translated_headers),
            }
        )
        await send({"type": "http.response.body", "body": payload_out})


# --------------------------------------------------------------------------- #
# WSGI wrapper
# --------------------------------------------------------------------------- #


def _environ_headers(environ: Dict[str, Any]) -> Headers:
    out: Headers = {}
    for key, value in environ.items():
        if key.startswith("HTTP_"):
            out[key[5:].replace("_", "-").title()] = str(value)
    if "CONTENT_TYPE" in environ:
        out["Content-Type"] = str(environ["CONTENT_TYPE"])
    return out


def _normalize_header_name(name: str) -> str:
    """``Mcp-Method`` -> canonical casing (HTTP headers are case-insensitive)."""
    lowered = name.lower()
    canonical = {
        "mcp-method": METHOD_HEADER,
        "mcp-name": NAME_HEADER,
        "mcp-session-id": SESSION_HEADER,
        "mcp-protocol-version": PROTOCOL_HEADER,
        "content-type": "Content-Type",
    }
    return canonical.get(lowered, name)


class ShimWSGI:
    """WSGI middleware with the same semantics as :class:`ShimASGI`."""

    def __init__(self, app: Callable, config: Optional[ShimConfig] = None) -> None:
        self.app = app
        self.config = config or default_config()

    def __call__(self, environ: Dict[str, Any], start_response: Callable) -> List[bytes]:
        try:
            length = int(environ.get("CONTENT_LENGTH") or 0)
        except (TypeError, ValueError):
            length = 0
        raw = environ["wsgi.input"].read(length) if length else b""
        parse_ok = True
        try:
            body = json.loads(raw.decode("utf-8")) if raw.strip() else {}
        except (ValueError, UnicodeDecodeError):
            body = {}
            parse_ok = False

        in_headers = {
            _normalize_header_name(k): v for k, v in _environ_headers(environ).items()
        }
        client_wire = "2026" if get_header(in_headers, METHOD_HEADER) else "legacy"
        out_headers, out_body, notes = translate_request(in_headers, body, self.config)

        if is_local_reply(notes):
            payload = json.dumps(out_body).encode("utf-8") if out_body else b""
            status = "200 OK" if payload else "202 Accepted"
            header_list = [(k, v) for k, v in out_headers.items()]
            start_response(status, header_list)
            return [payload]

        new_env = dict(environ)
        payload = json.dumps(out_body).encode("utf-8") if parse_ok else raw
        new_env["wsgi.input"] = _BytesReader(payload)
        new_env["CONTENT_LENGTH"] = str(len(payload))
        for key in list(new_env):
            if key.startswith("HTTP_MCP_"):
                del new_env[key]
        for name, value in out_headers.items():
            if name.lower().startswith("mcp-"):
                new_env["HTTP_" + name.upper().replace("-", "_")] = value

        captured: Dict[str, Any] = {}

        def capturing_start(status: str, headers: List[Tuple[str, str]],
                            exc_info: Any = None) -> Callable:
            captured["status"] = status
            captured["headers"] = headers
            return lambda data: None

        chunks = self.app(new_env, capturing_start)
        response_raw = b"".join(chunks)
        if hasattr(chunks, "close"):
            chunks.close()
        try:
            response_body = json.loads(response_raw.decode("utf-8")) if response_raw else {}
        except (ValueError, UnicodeDecodeError):
            response_body = {}

        resp_headers = dict(captured.get("headers", []))
        translated_headers, translated_body, _ = translate_response(
            resp_headers, response_body, client_wire=client_wire, config=self.config
        )
        payload_out = (
            json.dumps(translated_body).encode("utf-8") if translated_body else response_raw
        )
        start_response(captured.get("status", "200 OK"), list(translated_headers.items()))
        return [payload_out]


class _BytesReader:
    """Minimal file-like object over a fixed byte string (WSGI input swap)."""

    def __init__(self, data: bytes) -> None:
        self._data = data
        self._pos = 0

    def read(self, size: int = -1) -> bytes:  # noqa: D401 - wsgi.input shape
        if size is None or size < 0:
            chunk = self._data[self._pos:]
            self._pos = len(self._data)
            return chunk
        chunk = self._data[self._pos:self._pos + size]
        self._pos += len(chunk)
        return chunk


__all__ = [
    "WIRE_2026",
    "WIRE_LEGACY",
    "METHOD_HEADER",
    "NAME_HEADER",
    "SESSION_HEADER",
    "PROTOCOL_HEADER",
    "NOTE_RESPOND",
    "NOTE_FORWARD",
    "NOTE_MRTR",
    "NAME_REQUIRED_METHODS",
    "ShimConfig",
    "ShimASGI",
    "ShimWSGI",
    "translate_request",
    "translate_response",
    "is_local_reply",
    "get_header",
    "set_header",
    "drop_header",
    "default_config",
]
