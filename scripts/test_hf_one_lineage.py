import importlib.util
from pathlib import Path

MODULE = Path(__file__).with_name("hf_one_lineage.py")
SPEC = importlib.util.spec_from_file_location("hf_one_lineage", MODULE)
MOD = importlib.util.module_from_spec(SPEC)
assert SPEC.loader
SPEC.loader.exec_module(MOD)


def test_parse_label_is_single_token_only():
    assert MOD.parse_label("HIGH_RISK") == "HIGH_RISK"
    assert MOD.parse_label("answer: limited-risk") == "LIMITED_RISK"
    assert MOD.parse_label("HIGH_RISK or MINIMAL_RISK") is None


def test_manifest_digest_is_order_stable():
    class Sibling:
        def __init__(self, name, blob):
            self.rfilename = name
            self.blob_id = blob
            self.size = 1
            self.lfs = None

    class Info:
        siblings = [Sibling("z.safetensors", "z"), Sibling("a.safetensors", "a")]

    first, rows = MOD.manifest_digest(Info(), lambda name: name.endswith(".safetensors"))
    Info.siblings.reverse()
    second, _ = MOD.manifest_digest(Info(), lambda name: name.endswith(".safetensors"))
    assert first == second
    assert [row["path"] for row in rows] == ["a.safetensors", "z.safetensors"]
