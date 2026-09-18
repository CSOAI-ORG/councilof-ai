# Verified private drafts

This command connects plain-text composition, attachment hashes, a local task manifest, the existing authenticated Himalaya CLI, and a fetched-back draft verification. It has **no send command**. Existing browser/manual send paths are not intercepted by this tool.

## Local checks

`python3 -m unittest discover -s scripts/mailops -p 'test_mailops.py' -v`

The 45 synthetic tests require Python 3.9+ on a Unix-like system. No packages, credentials or network are needed for tests. Live draft saving requires the existing authorised Himalaya account. This is not a security audit of Himalaya or verification of factual claims/delivery.

## Work sequence

1. Prepare a private JSON spec: `task`, `from`, `to`, `subject`, `text`; optionally `cc`, `in_reply_to` and attachments (`path`, `name`, `type`, `sha256`).
2. `python3 scripts/mailops/mailops.py stage /private/spec.json --root /private/tasks`
3. `python3 scripts/mailops/mailops.py check /private/tasks/TASK`
4. `python3 scripts/mailops/mailops.py save-draft /private/tasks/TASK --allow-draft-write`
5. Read the draft in the named mailbox. Review content, recipient and obligations before sending separately.

For a known existing draft missed by the bounded subject search, add `--existing-uid UID`. It verifies the Message-ID, recipients, text, subject, reply binding and attachments before marking that draft. It cannot blindly append another draft in this mode.

## Invariants

Only the Drafts folder is writable. Raw MIME is passed on stdin, never as positional message text. A verified saved copy receives the Draft flag. An uncertain append is not automatically retried. Task reuse with changed content is blocked. Local file locking is single-host only, not a global distributed lock.

Original bytes and manifests remain unchanged. Readback accepts MIME encoding/header changes only when decoded contract fields match; it additionally records tolerance for removal of the single terminal newline observed in the IMAP export. Other text changes fail. HTML-only/alternative bodies, Bcc, ambiguous addresses and nested attached messages are intentionally unsupported.

Keep message bodies, mailbox exports, invoices, private replies and receipts outside the repository and public evidence graph. The code contains no account credentials. An unsigned local hash is not institutional authentication. A verified draft is not sent, delivered, accepted or approved.
