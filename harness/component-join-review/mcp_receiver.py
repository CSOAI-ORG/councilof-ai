"""Finite research stdio entrypoint, or import the function into an existing host.
No registration, daemon, arbitrary file/URL input or action tools are created.
"""
from mcp.server.fastmcp import FastMCP
from receive_artifacts import evidence_json
server=FastMCP('Council specialist artifact review')
@server.tool()
def review_specialist_artifacts(request_json: str) -> dict:
    """Check supplied artifact bytes and context; return an unsigned PARTIAL event.
    Expected pins and context require authentication by the caller's host.
    Uses receiver UTC; a request-provided now field is refused.
    Does not execute models, grant action authority or admit a board measurement.
    """
    return evidence_json(request_json, current=True)
if __name__=='__main__':server.run(transport='stdio')
