#!/usr/bin/env python3
"""CSOAI private draft workflow. No SMTP send command, keys, or public publishing.
Python 3.9+. Plain-text composition deliberately avoids rich-editor empty-body bugs.
Existing mail clients can bypass this tool; it is not an organisation-wide mail gateway.
"""
import argparse
import datetime as dt
from email import policy
from email.message import EmailMessage
from email.parser import BytesParser
from email.utils import format_datetime, getaddresses
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import unicodedata

SCHEMA = 'csoai.private-draft/1'
MAX_BYTES = 5 * 1024 * 1024


class ReviewRequired(ValueError):
    pass


def sha(data):
    return hashlib.sha256(data).hexdigest()


def normal_text(text):
    return text.replace('\r\n', '\n').replace('\r', '\n')


def meaningful(text):
    return ''.join(c for c in text if not c.isspace() and unicodedata.category(c) not in ('Cf', 'Cc'))


def addresses(values):
    """Restricted to ordinary ASCII mailboxes; deliberately refuses ambiguous input."""
    result = []
    for value in values:
        if '\r' in value or '\n' in value:
            raise ReviewRequired('HEADER_NEWLINE')
        parsed = getaddresses([value])
        if len(parsed) != 1:
            raise ReviewRequired('AMBIGUOUS_ADDRESS')
        addr = parsed[0][1]
        if not re.fullmatch(r"[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}", addr):
            raise ReviewRequired('INVALID_ADDRESS')
        # Preserve local-part case: it can be significant, unlike the domain.
        local, domain = addr.rsplit('@', 1)
        result.append(local + '@' + domain.lower())
    if len(set(result)) != len(result):
        raise ReviewRequired('DUPLICATE_RECIPIENT')
    return sorted(result)


def body_nodes(part):
    # Never use an attached message or a text attachment as the outgoing body.
    if part.get_content_disposition() == 'attachment' or part.get_filename() or part.get_content_type() == 'message/rfc822':
        return
    if part.is_multipart():
        for child in part.iter_parts():
            yield from body_nodes(child)
    elif part.get_content_type() == 'text/plain':
        yield part


def contract(raw):
    if not raw or len(raw) > MAX_BYTES:
        raise ReviewRequired('EMPTY_OR_OVERSIZE_MESSAGE')
    m = BytesParser(policy=policy.default).parsebytes(raw)
    for name in ('From', 'To', 'Subject', 'Message-ID'):
        if len(m.get_all(name, [])) != 1:
            raise ReviewRequired('MISSING_OR_DUPLICATE_' + name.upper())
    if m.get_all('Bcc') or m.get_all('Resent-To'):
        raise ReviewRequired('HIDDEN_OR_RESENT_RECIPIENTS_UNSUPPORTED')
    if len(m.get_all('Cc', [])) > 1 or any(p.defects for p in m.walk()):
        raise ReviewRequired('MALFORMED_MIME')
    sender = addresses([str(m['From'])])
    tos = addresses([a for a in [str(m['To'])] if a]) if len(getaddresses([str(m['To'])])) == 1 else addresses([addr for _, addr in getaddresses([str(m['To'])])])
    ccs = addresses([addr for _, addr in getaddresses(m.get_all('Cc', []))])
    if set(tos) & set(ccs):
        raise ReviewRequired('DUPLICATE_RECIPIENT_ROLES')
    if not meaningful(str(m['Subject'])):
        raise ReviewRequired('EMPTY_SUBJECT')
    if not re.fullmatch(r'<[^\s<>]+@[^\s<>]+>', str(m['Message-ID'])):
        raise ReviewRequired('INVALID_MESSAGE_ID')
    texts = list(body_nodes(m))
    if len(texts) != 1:
        raise ReviewRequired('EXACTLY_ONE_PLAIN_BODY_REQUIRED')
    try:
        text = normal_text(texts[0].get_content())
    except (ValueError, UnicodeError, LookupError) as exc:
        raise ReviewRequired('BODY_DECODE_ERROR') from exc
    if not meaningful(text):
        raise ReviewRequired('EMPTY_VISIBLE_BODY')
    # This workflow emits plain text only. Decline alternative HTML disagreement.
    if any(p.get_content_type() == 'text/html' and not p.get_filename() for p in m.walk()):
        raise ReviewRequired('HTML_BODY_UNSUPPORTED_USE_PLAIN_TEXT')
    attachments = []
    for p in m.walk():
        if p.get_content_disposition() != 'attachment':
            continue
        if p.is_multipart() or not p.get_filename():
            raise ReviewRequired('NESTED_ATTACHMENT_UNSUPPORTED')
        filename = p.get_filename()
        if Path(filename).name != filename or any(c in filename for c in '\r\n\\'):
            raise ReviewRequired('INVALID_ATTACHMENT_NAME')
        data = p.get_payload(decode=True)
        if data is None:
            raise ReviewRequired('ATTACHMENT_DECODE_ERROR')
        attachments.append({'name': filename, 'type': p.get_content_type(), 'size': len(data), 'sha256': sha(data)})
    if len({x['name'] for x in attachments}) != len(attachments):
        raise ReviewRequired('DUPLICATE_ATTACHMENT_NAME')
    return {'from': sender, 'to': tos, 'cc': ccs, 'subject': str(m['Subject']),
            'message_id': str(m['Message-ID']), 'in_reply_to': str(m.get('In-Reply-To', '')),
            'body_sha256': sha(text.encode('utf-8')), 'body_characters': len(meaningful(text)),
            'attachments': sorted(attachments, key=lambda x: x['name'])}


def compose(spec, when=None):
    sender = spec['from']; tos = spec['to']; ccs = spec.get('cc', [])
    if not tos or not isinstance(tos, list) or not isinstance(ccs, list):
        raise ReviewRequired('RECIPIENT_LIST_REQUIRED')
    addresses([sender]); addresses(tos); addresses(ccs)
    if set(addresses(tos)) & set(addresses(ccs)):
        raise ReviewRequired('DUPLICATE_RECIPIENT_ROLES')
    if not meaningful(spec['text']):
        raise ReviewRequired('EMPTY_VISIBLE_BODY')
    m = EmailMessage(policy=policy.SMTP)
    m['From'] = sender; m['To'] = ', '.join(tos)
    if ccs: m['Cc'] = ', '.join(ccs)
    m['Subject'] = spec['subject']
    m['Date'] = format_datetime(when or dt.datetime.now(dt.timezone.utc))
    attachments = []
    for entry in spec.get('attachments', []):
        p = Path(entry['path'])
        if p.is_symlink() or not p.is_file() or p.stat().st_size > MAX_BYTES:
            raise ReviewRequired('ATTACHMENT_PATH_OR_SIZE')
        data = p.read_bytes()
        if sha(data) != entry['sha256']:
            raise ReviewRequired('ATTACHMENT_DIGEST_MISMATCH')
        attachments.append((entry, data))
    stable = {k: spec.get(k) for k in ('task', 'from', 'to', 'cc', 'subject', 'text', 'in_reply_to')}
    stable['attachments'] = [{k: e[k] for k in ('name', 'type', 'sha256')} for e, _ in attachments]
    identity = sha(json.dumps(stable, sort_keys=True, ensure_ascii=False).encode())
    m['Message-ID'] = '<csoai-review-' + identity[:32] + '@csoai.org>'
    m['X-CSOAI-Task-ID'] = spec['task']
    if spec.get('in_reply_to'):
        if not re.fullmatch(r'<[^\s<>]+@[^\s<>]+>', spec['in_reply_to']):
            raise ReviewRequired('INVALID_REPLY_ID')
        m['In-Reply-To'] = spec['in_reply_to']; m['References'] = spec['in_reply_to']
    m.set_content(normal_text(spec['text']).rstrip('\n') + '\n', charset='utf-8')
    for entry, data in attachments:
        main, sub = entry['type'].split('/', 1)
        m.add_attachment(data, maintype=main, subtype=sub, filename=entry['name'])
    raw = m.as_bytes(); c = contract(raw)
    return raw, {'schema': SCHEMA, 'task': spec['task'], 'content_id': identity,
                 'raw_sha256': sha(raw), 'contract': c,
                 'approval': 'REVIEW_REQUIRED', 'delivery': 'NOT_SENT', 'factual_review': 'HUMAN_REVIEW_REQUIRED'}


def write_private(path, data):
    fd = os.open(str(path), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, 'wb') as f:
        f.write(data); f.flush(); os.fsync(f.fileno())


def stage(spec, root):
    task = spec.get('task', '')
    if not re.fullmatch(r'[a-z0-9][a-z0-9-]{2,70}', task):
        raise ReviewRequired('INVALID_TASK_NAME')
    root = Path(root); root.mkdir(parents=True, exist_ok=True, mode=0o700)
    directory = root / task
    if directory.exists():
        raw, candidate = compose(spec)
        prior = json.loads((directory / 'manifest.json').read_text())
        if candidate['content_id'] != prior['content_id']:
            raise ReviewRequired('TASK_EXISTS_WITH_DIFFERENT_CONTENT')
        validate_stage(directory)
        return directory
    raw, manifest = compose(spec)
    directory.mkdir(mode=0o700)
    write_private(directory / 'message.eml', raw)
    write_private(directory / 'manifest.json', json.dumps(manifest, indent=2).encode())
    return directory


def validate_stage(directory):
    directory = Path(directory)
    for name in ('message.eml', 'manifest.json'):
        if (directory / name).is_symlink(): raise ReviewRequired('SYMLINKED_STAGE')
    m = json.loads((directory / 'manifest.json').read_text())
    if m.get('schema') != SCHEMA: raise ReviewRequired('SCHEMA_MISMATCH')
    raw = (directory / 'message.eml').read_bytes()
    if sha(raw) != m['raw_sha256'] or contract(raw) != m['contract']:
        raise ReviewRequired('STAGED_MESSAGE_CHANGED')
    return raw, m


def verify_export(raw, manifest):
    actual = contract(raw)
    comparison = 'EXACT_DECODED_CONTENT'
    if actual != manifest['contract']:
        # Observed IMAP export removes the sole final CRLF from a non-multipart
        # text message. Permit only that change; retain both raw hashes.
        parsed = BytesParser(policy=policy.default).parsebytes(raw)
        text = normal_text(list(body_nodes(parsed))[0].get_content())
        candidate = dict(actual)
        if not text.endswith('\n'):
            candidate['body_sha256'] = sha((text + '\n').encode('utf-8'))
        if candidate != manifest['contract']:
            raise ReviewRequired('READBACK_CONTENT_MISMATCH')
        comparison = 'ONE_TERMINAL_NEWLINE_REMOVED_BY_EXPORT'
    return {'state': 'DRAFT_CONTENT_VERIFIED', 'raw_sha256': sha(raw),
            'prepared_raw_sha256': manifest['raw_sha256'],
            'body_sha256': manifest['contract']['body_sha256'],
            'comparison': comparison,
            'delivery': 'NOT_SENT', 'recipient_receipt': 'NOT_APPLICABLE'}


class HimalayaDrafts:
    """Uses existing authenticated CLI; never reads its config or credential values."""
    def __init__(self, executable='/opt/homebrew/bin/himalaya', existing_uid=None):
        self.exe = executable
        self.existing_uid = existing_uid

    def run(self, args, raw=None):
        p = subprocess.run([self.exe, '--quiet'] + args, input=raw, capture_output=True, timeout=35)
        if p.returncode:
            # Do not print potentially sensitive backend diagnostics into shared logs.
            raise ReviewRequired('MAIL_BACKEND_ERROR_' + str(p.returncode))
        return p.stdout

    def candidates(self, subject):
        out = self.run(['-o', 'json', 'envelope', 'list', '-f', 'Drafts', '-s', '25',
                        'subject', json.dumps(subject, ensure_ascii=False), 'order', 'by', 'date', 'desc'])
        rows = json.loads(out)
        if not isinstance(rows, list) or len(rows) >= 25:
            raise ReviewRequired('DRAFT_SEARCH_AMBIGUOUS_OR_PARTIAL')
        return [str(row['id']) for row in rows]

    def read(self, uid):
        if not uid.isdigit(): raise ReviewRequired('INVALID_UID')
        with tempfile.TemporaryDirectory(prefix='csoai-draft-read-') as temp:
            p = Path(temp) / 'message.eml'
            self.run(['message', 'export', '--full', '-f', 'Drafts', '-d', str(p), uid])
            return p.read_bytes()

    def find(self, expected):
        if self.existing_uid is not None:
            raw = self.read(self.existing_uid)
            verify_export(raw, expected)
            return self.existing_uid, raw
        matches = []
        for uid in self.candidates(expected['contract']['subject']):
            raw = self.read(uid)
            m = BytesParser(policy=policy.default).parsebytes(raw)
            if str(m.get('Message-ID', '')) == expected['contract']['message_id']:
                matches.append((uid, raw))
        if len(matches) > 1: raise ReviewRequired('DUPLICATE_REMOTE_DRAFTS')
        return matches[0] if matches else None

    def append(self, raw):
        # Always stdin: positional payloads can be ignored in non-TTY Himalaya 1.2.0.
        self.run(['message', 'save', '-f', 'Drafts'], raw)

    def mark_draft(self, uid):
        self.run(['flag', 'add', '-f', 'Drafts', uid, 'draft'])


def save_draft(directory, backend):
    directory = Path(directory)
    lockpath = directory / 'draft.lock'
    fd = os.open(str(lockpath), os.O_CREAT | os.O_RDWR, 0o600)
    with os.fdopen(fd, 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        raw, manifest = validate_stage(directory)
        found = backend.find(manifest)
        intent = directory / 'append-intent.json'
        if not found:
            if intent.exists():
                raise ReviewRequired('PRIOR_APPEND_UNCERTAIN_DO_NOT_RETRY')
            write_private(intent, json.dumps({'at': dt.datetime.now(dt.timezone.utc).isoformat(),
                                             'raw_sha256': sha(raw)}).encode())
            backend.append(raw)
            found = backend.find(manifest)
            if not found: raise ReviewRequired('DRAFT_READBACK_UNAVAILABLE_DO_NOT_RETRY')
        uid, readback = found
        checked = verify_export(readback, manifest)
        backend.mark_draft(uid)
        receipt = dict(checked, uid=uid, folder='Drafts', task=manifest['task'],
                       observed_at=dt.datetime.now(dt.timezone.utc).isoformat())
        out = directory / ('receipt-' + dt.datetime.now(dt.timezone.utc).strftime('%Y%m%dT%H%M%S%f') + '.json')
        write_private(out, json.dumps(receipt, indent=2).encode())
        return receipt


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    sp = ap.add_subparsers(dest='command', required=True)
    s = sp.add_parser('stage'); s.add_argument('spec', type=Path); s.add_argument('--root', required=True, type=Path)
    c = sp.add_parser('check'); c.add_argument('directory', type=Path)
    d = sp.add_parser('save-draft'); d.add_argument('directory', type=Path); d.add_argument('--allow-draft-write', action='store_true'); d.add_argument('--existing-uid')
    v = sp.add_parser('verify-export'); v.add_argument('directory', type=Path); v.add_argument('eml', type=Path)
    args = ap.parse_args()
    try:
        if args.command == 'stage':
            print(stage(json.loads(args.spec.read_text()), args.root))
        elif args.command == 'check':
            raw, m = validate_stage(args.directory); print(json.dumps({'state': 'READY_FOR_DRAFT_REVIEW', 'contract': m['contract'], 'sent': False}, indent=2))
        elif args.command == 'save-draft':
            if not args.allow_draft_write: raise ReviewRequired('EXPLICIT_DRAFT_WRITE_REQUIRED')
            print(json.dumps(save_draft(args.directory, HimalayaDrafts(existing_uid=args.existing_uid)), indent=2))
        elif args.command == 'verify-export':
            _, m = validate_stage(args.directory); print(json.dumps(verify_export(args.eml.read_bytes(), m), indent=2))
    except (ReviewRequired, OSError, ValueError, KeyError, subprocess.TimeoutExpired) as exc:
        print(json.dumps({'state': 'BLOCK_REVIEW', 'reason': str(exc)[:200], 'sent': False}))
        return 2
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
