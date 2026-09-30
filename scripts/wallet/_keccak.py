"""Keccak-256 (the Ethereum variant, padding 0x01) and EIP-55 checksums, standard library only.

Transcribed from the Keccak team's CompactFIPS202.py reference (public domain). The same sponge with
padding 0x06 is SHA3-256, which scripts/test_wallet_tokenlist.py checks against hashlib.sha3_256.
"""
from __future__ import annotations


def _rol64(a: int, n: int) -> int:
    n %= 64
    return ((a >> (64 - n)) + (a << n)) % (1 << 64)


def _f1600(state: bytearray) -> bytearray:
    lanes = [[int.from_bytes(state[8 * (x + 5 * y): 8 * (x + 5 * y) + 8], "little") for y in range(5)] for x in range(5)]
    r = 1
    for _ in range(24):
        c = [lanes[x][0] ^ lanes[x][1] ^ lanes[x][2] ^ lanes[x][3] ^ lanes[x][4] for x in range(5)]
        d = [c[(x + 4) % 5] ^ _rol64(c[(x + 1) % 5], 1) for x in range(5)]
        lanes = [[lanes[x][y] ^ d[x] for y in range(5)] for x in range(5)]
        x, y = 1, 0
        current = lanes[x][y]
        for t in range(24):
            x, y = y, (2 * x + 3 * y) % 5
            current, lanes[x][y] = lanes[x][y], _rol64(current, (t + 1) * (t + 2) // 2)
        for y in range(5):
            row = [lanes[x][y] for x in range(5)]
            for x in range(5):
                lanes[x][y] = row[x] ^ ((~row[(x + 1) % 5]) & row[(x + 2) % 5])
        for j in range(7):
            r = ((r << 1) ^ ((r >> 7) * 0x71)) % 256
            if r & 2:
                lanes[0][0] ^= 1 << ((1 << j) - 1)
    out = bytearray(200)
    for x in range(5):
        for y in range(5):
            out[8 * (x + 5 * y): 8 * (x + 5 * y) + 8] = lanes[x][y].to_bytes(8, "little")
    return out


def sponge256(data: bytes, suffix: int) -> bytes:
    rate = 136
    state = bytearray(200)
    off = 0
    block = 0
    while off < len(data):
        block = min(len(data) - off, rate)
        for i in range(block):
            state[i] ^= data[off + i]
        off += block
        if block == rate:
            state = _f1600(state)
            block = 0
    state[block] ^= suffix
    if (suffix & 0x80) and block == rate - 1:
        state = _f1600(state)
    state[rate - 1] ^= 0x80
    state = _f1600(state)
    return bytes(state[:32])


def keccak256(data: bytes) -> bytes:
    return sponge256(data, 0x01)


def checksum(address: str) -> str:
    """EIP-55 mixed-case checksum of a 0x-prefixed 20-byte hex address."""
    a = address.lower().removeprefix("0x")
    if len(a) != 40 or any(ch not in "0123456789abcdef" for ch in a):
        raise ValueError(f"not a 20-byte hex address: {address}")
    h = keccak256(a.encode("ascii")).hex()
    return "0x" + "".join(ch.upper() if ch.isalpha() and int(h[i], 16) >= 8 else ch for i, ch in enumerate(a))
