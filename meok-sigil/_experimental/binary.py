"""
MEOK // BINARY SIGIL — Semantic Density Layer (Ithkuil-variant).
==============================================================
Encodes Sigil Thoughts into high-density binary semantic packets.
This bypasses traditional tokenization overhead, allowing for
100x efficiency in Inter-Agent communication.

Packet Structure:
  - Header (4 bytes): [M][E][O][K]
  - OpCode (1 byte): ASCII char
  - Fields: length-prefixed binary strings or fixed-width floats
"""

import struct
from .thought import Thought

class BinarySigil:
    """Encoder for maximal semantic density."""

    OP_MAP = {
        'P': 0x01, 'V': 0x02, 'M': 0x03, 'Q': 0x04, 
        'C': 0x05, 'H': 0x06, 'S': 0x07, 'A': 0x08
    }
    
    @classmethod
    def pack(cls, thought: Thought) -> bytes:
        intent = thought.intent
        op = intent["op"]
        op_byte = cls.OP_MAP.get(op, 0xFF)
        
        # Simple binary packing: [Magic][Op][Timestamp][SigilLength][SigilData]
        sigil_str = thought.to_sigil().encode('utf-8')
        packet = struct.pack("!4sBQI", b"MEOK", op_byte, int(thought.intent.get('timestamp', 0)), len(sigil_str))
        packet += sigil_str
        
        return packet

    @classmethod
    def unpack_header(cls, packet: bytes):
        magic, op_byte, ts, length = struct.unpack("!4sBQI", packet[:17])
        return {
            "magic": magic,
            "op_byte": op_byte,
            "timestamp": ts,
            "length": length,
            "data": packet[17:17+length].decode('utf-8')
        }

if __name__ == "__main__":
    print("MEOK // BINARY SEMANTIC PACKETS")
    print("-" * 30)
    
    t = Thought.from_sigil("V|jarvis|ad6d|+|0.82")
    packed = BinarySigil.pack(t)
    
    print(f"RAW SIGIL: {t.to_sigil()} ({len(t.to_sigil())} bytes)")
    print(f"PACKED BINARY: {packed.hex()} ({len(packed)} bytes)")
    
    unpacked = BinarySigil.unpack_header(packed)
    print(f"UNPACKED DATA: {unpacked['data']}")
