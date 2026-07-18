"""
PatentMCP MCP Server
Model Context Protocol server interface for PatentMCP.

Provides 3 MCP tools:
1. disclose_invention - Submit an invention disclosure
2. verify_disclosure - Verify a prior disclosure
3. search_registry - Search the prior art registry

These tools can be called by any MCP-compatible client:
- Claude Desktop
- Claude Code
- Custom MCP clients
- Other AI systems via A2A protocol

Usage:
    from patentmcp.server import PatentMCPServer
    
    server = PatentMCPServer()
    server.run()  # Starts MCP server on stdio
"""

import json
import base64
from typing import Optional

try:
    from mcp.server.fastmcp import FastMCP
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    # Create stub for when mcp is not installed
    class FastMCP:
        def __init__(self, name): self.name = name
        def tool(self): return lambda f: f
        def run(self): print(f"MCP library not installed. Run: pip install mcp")

from .core import PatentMCP


class PatentMCPServer:
    """
    MCP Server for PatentMCP invention disclosure system.
    
    Exposes 3 tools via the Model Context Protocol:
    - patentmcp.disclose: Submit invention for disclosure
    - patentmcp.verify: Verify prior disclosure
    - patentmcp.search: Search prior art registry
    """
    
    def __init__(self, storage_path: Optional[str] = None):
        """
        Initialize MCP server.
        
        Args:
            storage_path: Path for persistent storage
        """
        self.pm = PatentMCP(storage_path=storage_path)
        self.mcp = FastMCP("patentmcp")
        self._register_tools()
    
    def _register_tools(self):
        """Register all MCP tools."""
        
        @self.mcp.tool()
        def disclose(
            title: str,
            description: str,
            inventor_did: str,
            document_base64: str,
            document_format: str = "pdf",
            classification: str = "",
            disclosure_type: str = "full",
        ) -> str:
            """
            Disclose an invention through the PatentMCP system.
            
            Creates a 6-layer cryptographic proof of invention including
            SHA-3/512 hash, HMAC attestation, Ed25519 signature, Bitcoin
            blockchain anchor, C2PA credential, and hash-chained audit log.
            
            Args:
                title: Invention title (required, max 200 chars)
                description: Detailed description (required, max 5000 chars)
                inventor_did: Inventor's DID like did:key:z6Mk... (required)
                document_base64: Invention document as base64 string (required)
                document_format: File format: pdf, doc, code, data (default: pdf)
                classification: IPC/CPC code like G06N7/01 (optional)
                disclosure_type: "defensive" ($10), "full" ($50), "premium" ($100)
            
            Returns:
                JSON with attestation URL, Bitcoin tx, verification results
            
            Pricing:
                - defensive ($10): Basic timestamp + hash
                - full ($50): Complete 6-layer proof + prior art registry
                - premium ($100): Full + expedited + consultation
            """
            try:
                document_bytes = base64.b64decode(document_base64)
                
                result = self.pm.disclose_invention(
                    title=title,
                    description=description,
                    inventor_did=inventor_did,
                    document_bytes=document_bytes,
                    document_format=document_format,
                    classification=classification,
                    disclosure_type=disclosure_type,
                )
                
                return json.dumps(result, indent=2)
                
            except Exception as e:
                return json.dumps({
                    "status": "ERROR",
                    "error": str(e),
                    "tool": "patentmcp.disclose",
                }, indent=2)
        
        @self.mcp.tool()
        def verify(
            attestation_url: str = "",
            document_hash: str = "",
            disclosure_json: str = "",
        ) -> str:
            """
            Verify a PatentMCP invention disclosure.
            
            Runs all 6 cryptographic verification checks:
            1. SHA-3/512 document hash integrity
            2. CSOAI HMAC attestation
            3. Inventor Ed25519 signature
            4. Bitcoin blockchain anchor
            5. C2PA Content Credential
            6. Hash-chain audit log integrity
            
            Args:
                attestation_url: The verify.meok.ai URL from disclosure
                document_hash: The SHA-3/512 hash to look up
                disclosure_json: Full disclosure result JSON as string
            
            Returns:
                JSON with verification results for all 6 checks
            """
            try:
                if disclosure_json:
                    disclosure = json.loads(disclosure_json)
                    result = self.pm.verify_disclosure(disclosure)
                    return json.dumps(result, indent=2)
                elif document_hash:
                    # Look up by hash in registry
                    return json.dumps({
                        "status": "INFO",
                        "message": f"Lookup by hash: {document_hash[:16]}...",
                        "attestation_url": f"https://verify.meok.ai/{document_hash[:16]}",
                    }, indent=2)
                elif attestation_url:
                    return json.dumps({
                        "status": "INFO",
                        "message": f"Visit {attestation_url} to verify",
                        "note": "Full verification requires the disclosure JSON. Re-run with disclosure_json parameter.",
                    }, indent=2)
                else:
                    return json.dumps({
                        "status": "ERROR",
                        "error": "Provide attestation_url, document_hash, or disclosure_json",
                    }, indent=2)
                    
            except Exception as e:
                return json.dumps({
                    "status": "ERROR",
                    "error": str(e),
                }, indent=2)
        
        @self.mcp.tool()
        def search(
            query: str = "",
            classification: str = "",
            date_from: str = "",
            date_to: str = "",
            disclosure_type: str = "",
            limit: int = 25,
        ) -> str:
            """
            Search the PatentMCP prior art registry.
            
            Searches disclosed inventions that patent examiners,
            companies, and researchers can query for prior art.
            
            Args:
                query: Full-text search (title, description keywords)
                classification: IPC/CPC code filter (e.g., G06N7/01)
                date_from: Start date ISO 8601 (e.g., 2026-01-01)
                date_to: End date ISO 8601 (e.g., 2026-12-31)
                disclosure_type: full, defensive, or provisional
                limit: Max results (default: 25)
            
            Returns:
                JSON with matching entries and total count
            """
            try:
                result = self.pm.registry.search(
                    query=query,
                    classification=classification,
                    date_from=date_from,
                    date_to=date_to,
                    disclosure_type=disclosure_type,
                    limit=limit,
                )
                
                return json.dumps(result, indent=2)
                
            except Exception as e:
                return json.dumps({
                    "status": "ERROR",
                    "error": str(e),
                }, indent=2)
        
        @self.mcp.tool()
        def get_statistics() -> str:
            """Get PatentMCP system statistics."""
            return json.dumps(self.pm.get_statistics(), indent=2)
    
    def run(self):
        """Start the MCP server."""
        self.mcp.run()


def main():
    """Entry point for running PatentMCP MCP server."""
    import argparse
    
    parser = argparse.ArgumentParser(description="PatentMCP MCP Server")
    parser.add_argument("--storage", default="./patentmcp_data", help="Storage path")
    parser.add_argument("--mode", default="development", help="Blockchain mode")
    args = parser.parse_args()
    
    server = PatentMCPServer(storage_path=args.storage)
    print(f"PatentMCP v{PatentMCP.VERSION} MCP Server starting...")
    print(f"Storage: {args.storage}")
    print(f"Blockchain mode: {args.mode}")
    print("Registered tools: disclose, verify, search, get_statistics")
    server.run()


if __name__ == "__main__":
    main()
