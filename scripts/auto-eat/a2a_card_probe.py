"""Bounded public A2A metadata discovery, not protocol or skill qualification.

LIVE means a fetched JSON object has the minimum typed discovery fields below.
It does not verify signatures, publisher identity, advertised interfaces or skills.
Only GET is used. A permission/transport failure never triggers another route.
"""
from __future__ import annotations

import json
import math
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable

MAX_CARD_BYTES = 65536
PATHS = ('/.well-known/agent-card.json', '/.well-known/agent.json', '/agent-card.json')


def _http_url(value: object) -> bool:
    if (not isinstance(value, str) or not value or len(value) > 4096
            or any(ord(c) <= 32 or ord(c) == 127 for c in value) or '\\' in value):
        return False
    try:
        p = urllib.parse.urlsplit(value)
        return (p.scheme in ('https', 'http') and bool(p.hostname)
                and p.username is None and p.password is None
                and not p.fragment and (p.port is None or 1 <= p.port <= 65535))
    except ValueError:
        return False


def _unique(pairs: list) -> dict:
    result = {}
    for k, v in pairs:
        if k in result:
            raise ValueError('DUPLICATE_JSON_KEY')
        result[k] = v
    return result


def _reject_constant(value: str):
    raise ValueError('NONFINITE_JSON')


def _finite_float(value: str) -> float:
    result = float(value)
    if not math.isfinite(result):
        raise ValueError('NONFINITE_JSON')
    return result


def _text(value: object) -> bool:
    return isinstance(value, str) and bool(value.strip())


def _strings(value: object) -> bool:
    return isinstance(value, list) and all(_text(item) for item in value)


def card_shape(body: object) -> bool:
    """Conservative minimum v0.x/v1.x shape; NOT full schema conformance."""
    if not isinstance(body, bytes) or not 0 < len(body) <= MAX_CARD_BYTES:
        return False
    try:
        obj = json.loads(body.decode('utf-8'), object_pairs_hook=_unique,
                         parse_constant=_reject_constant, parse_float=_finite_float)
        if not isinstance(obj, dict) or not all(_text(obj.get(k)) for k in ('name', 'version')):
            return False
        if not isinstance(obj.get('description'), str) or not isinstance(obj.get('capabilities'), dict):
            return False
        if not all(_strings(obj.get(k)) for k in ('defaultInputModes', 'defaultOutputModes')):
            return False
        skills = obj.get('skills')
        if not isinstance(skills, list):
            return False
        for skill in skills:
            if (not isinstance(skill, dict) or not all(_text(skill.get(k)) for k in ('id', 'name'))
                    or not isinstance(skill.get('description'), str) or not _strings(skill.get('tags'))):
                return False
        if len({s['id'] for s in skills}) != len(skills):
            return False
        # Do not downgrade a malformed modern declaration to a legacy url field.
        if 'supportedInterfaces' in obj:
            interfaces = obj['supportedInterfaces']
            return (isinstance(interfaces, list) and bool(interfaces)
                    and all(isinstance(i, dict) and _http_url(i.get('url'))
                            and _text(i.get('protocolBinding')) and _text(i.get('protocolVersion'))
                            for i in interfaces))
        return _http_url(obj.get('url'))
    except (ValueError, TypeError, UnicodeError, RecursionError, OverflowError):
        return False


class _NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _http_get(url: str, user_agent: str) -> tuple[int, bytes | None]:
    """Bound bytes while reading, not after a potentially unlimited download."""
    req = urllib.request.Request(url, headers={'User-Agent': user_agent, 'Accept': 'application/json'})
    try:
        with urllib.request.build_opener(_NoRedirect()).open(req, timeout=12) as response:
            return response.status, response.read(MAX_CARD_BYTES + 1)
    except urllib.error.HTTPError as exc:
        code = exc.code
        exc.close()
        return code, None
    except (OSError, ValueError):
        return -1, None


def probe_agent_card(entry: dict, *, user_agent: str,
                     get: Callable[[str, str], tuple[int, bytes | None]] | None = None) -> tuple[str, str]:
    """Use a configured resource as-is, then bounded legacy base-URL discovery.

    Historical discovery calls both resource URLs and service base URLs card_url.
    Try the supplied URL first. A .json resource or query-bearing URL is exact;
    only other URLs get the existing three fallback paths. No redirects, retries,
    credential use, tool/task calls or advertised-interface fetches occur here.
    """
    if not isinstance(entry, dict):
        return 'UNCHECKABLE', '(invalid queue entry)'
    meta = entry.get('meta', {})
    if meta is None:
        meta = {}
    name = str(entry.get('id', 'unknown'))[:120]
    if not isinstance(meta, dict):
        return 'UNCHECKABLE', f'{name} (invalid metadata)'
    base = meta.get('card_url')
    if base is None or base == '':
        base = entry.get('id')
        if not isinstance(base, str) or not base.lower().startswith(('http://', 'https://')):
            return 'PLACEHOLDER', f'{name} (no agent-card URL)'
    if not _http_url(base):
        return 'UNCHECKABLE', f'{name} (invalid or unsupported agent-card URL)'
    p = urllib.parse.urlsplit(base)
    urls = [base]
    if not p.path.lower().rstrip('/').endswith('.json') and not p.query:
        urls.extend(urllib.parse.urlunsplit((p.scheme, p.netloc, p.path.rstrip('/') + path, '', '')) for path in PATHS)
    fetch = _http_get if get is None else get
    invalid = False
    for url in dict.fromkeys(urls):
        status, body = fetch(url, user_agent)
        if type(status) is not int:
            return 'UNCHECKABLE', f'{name} (invalid transport status)'
        if status in (401, 403):
            return 'HELD', f'{name} (gated {status})'
        if status == 200:
            if card_shape(body):
                return 'LIVE', f'{name} (200; typed card metadata only, ungraded)'
            invalid = True
        elif status not in (404, 410):
            # Rate limits, redirects, 5xx and failed requests are inconclusive.
            return 'UNCHECKABLE', f'{name} (card lookup inconclusive, status={status})'
    if invalid:
        return 'UNCHECKABLE', f'{name} (200 response failed minimum card checks)'
    return 'PLACEHOLDER', f'{name} (no card at the bounded lookup locations)'
