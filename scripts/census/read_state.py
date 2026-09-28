"""Read-state predicate shared by the census collectors and builders. Fail closed.

A walk is EXHAUSTED only when the collector that ran it POSITIVELY recorded a clean end:
read_state == "EXHAUSTED" written by a collector that checks HTTP status and page shape,
and every page it read was a valid page. Everything else is PARTIAL (something was read)
or FAILED (nothing was).

Why this exists: the 14 Sep 2026 csoai/agent-interop-census published
`mcp_registry_enumeration_complete: true` with `mcp_registry_pages_read: 2` and
`mcp_registry_unique_entries: 100` (stop_reason "cursor exhausted - clean end of registry").
  1. THE PUBLISHED CASE. collect-mcp-registry.py parsed ANY JSON body as a page, never checked
     the HTTP status or the page shape, and called "no metadata.nextCursor" a clean end. Page 2
     added no new rows and carried no nextCursor; the collector kept no body, so whether it was
     an error object or an empty page is not recoverable -- either way it was not the end of a
     registry that holds tens of thousands of servers.
  2. build-agent-interop-census.py derived completeness as `stop_reason != "in-progress"`, so
     every other stop too -- a fetch failure, a repeated cursor, the bounded fallback file --
     would have been published as complete.
Legacy files (no read_state field) are therefore PARTIAL: their stop_reason cannot be trusted.
"""
EXHAUSTED, PARTIAL, FAILED = "EXHAUSTED", "PARTIAL", "FAILED"
STATES = (EXHAUSTED, PARTIAL, FAILED)


def walk_read_state(doc, source_file=None, bounded_files=()):
    """-> one of STATES for a collector's output document. Never raises on odd input."""
    if not isinstance(doc, dict):
        return FAILED
    has_rows = bool(doc.get("rows")) or bool(doc.get("unique_entries"))
    if source_file is not None and source_file in set(bounded_files):
        return PARTIAL if has_rows else FAILED
    state = doc.get("read_state")
    pages, valid = doc.get("pages"), doc.get("pages_valid")
    if (state == EXHAUSTED and isinstance(pages, int) and pages > 0
            and isinstance(valid, int) and valid == pages):
        return EXHAUSTED
    return PARTIAL if has_rows else FAILED


def population_total(doc, count_key, source_file=None, bounded_files=()):
    """The count under count_key if the walk is EXHAUSTED, else None (never a floor as a total)."""
    if walk_read_state(doc, source_file, bounded_files) != EXHAUSTED:
        return None
    return doc.get(count_key)
