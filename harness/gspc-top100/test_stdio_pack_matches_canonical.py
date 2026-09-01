"""Stdio Docker/npm copies must be byte-identical to canonical HTTP tools + verifier."""
from hashlib import sha256
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAIRS = [
    (ROOT / "functions" / "mcp" / "gspc-tools.json", ROOT / "mcp" / "gspc-server" / "gspc-tools.json"),
    (ROOT / "public" / "signed" / "verify-card.mjs", ROOT / "mcp" / "gspc-server" / "verify-card.mjs"),
]


def test_packed_stdio_files_match_canonical() -> None:
    for src, dst in PAIRS:
        assert src.is_file(), f"missing canonical {src}"
        assert dst.is_file(), f"missing packed {dst} (Docker/Glama COPY)"
        assert sha256(src.read_bytes()).digest() == sha256(dst.read_bytes()).digest(), f"drift {dst.name}"


if __name__ == "__main__":
    test_packed_stdio_files_match_canonical()
    print("PASS packed stdio == canonical")
