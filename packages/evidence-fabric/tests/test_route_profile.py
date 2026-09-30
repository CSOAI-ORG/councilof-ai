# SPDX-License-Identifier: Apache-2.0
"""csoai.route-evidence/0.1 (a profile of csoai.evidence-event/0.1): verify.py --structure on the GSPC Route
golden records (fixtures/route-golden, written by functions/_lib/route/route.test.ts), and every rule
shown able to say no."""
import copy, glob, json, os
import pytest
import event as E
import verify as VF

pytest.importorskip("jsonschema")
HERE = os.path.dirname(os.path.abspath(__file__))
GOLD = sorted(glob.glob(os.path.join(HERE, "..", "..", "..", "fixtures", "route-golden", "*.record.json")))


def load(name):
    return json.load(open(next(p for p in GOLD if p.endswith(name))))


def reid(ev):
    ev["event_id"] = E.compute_event_id(ev)
    return ev


def test_goldens_exist():
    assert len(GOLD) >= 5


@pytest.mark.parametrize("path", GOLD, ids=[os.path.basename(p) for p in GOLD])
def test_golden_is_structure_valid_and_id_recomputes(path):
    ev = json.load(open(path))
    res, why, info = VF.verify_structure(ev)
    assert res == "STRUCTURE_VALID", why
    assert info["signed"] is False and info["profile"] == "csoai.route-evidence/0.1"
    assert E.compute_event_id(ev) == ev["event_id"]  # TypeScript JCS == Python JCS


def _tie():
    return load("tie-governance-local-models.record.json")


MUTATIONS = {
    "untested carries a number": lambda ev: ev["observed"]["considered"][2]["measurements"][0].__setitem__("value", 0),
    "best in a label": lambda ev: ev["observed"].__setitem__("label", "best observed"),
    "leader on a TIE": lambda ev: ev["observed"].__setitem__("label", "leader"),
    "separated basis on a TIE": lambda ev: ev["observed"]["chosen"].__setitem__("choice_basis", "separated_leader:governance"),
    "chosen not permitted": lambda ev: ev["observed"]["chosen"].__setitem__("id", "nobody"),
    "decide-only claims CONSISTENT": lambda ev: ev.__setitem__("state", "PARTIAL"),
    "decide-only carries a value": lambda ev: ev.__setitem__("value", 0.5),
    "task content retained": lambda ev: ev["declared"]["task"].__setitem__("content_retained", True),
    "task text stored": lambda ev: ev["declared"]["task"].__setitem__("text", "hello"),
    "wrong subject kind": lambda ev: ev["subject"].__setitem__("kind", "policy"),
    "uncheckable permitted": lambda ev: (ev["observed"]["considered"][0].__setitem__("uncheckable", ["x"])),
    "three heal actions": lambda ev: ev["observed"].__setitem__("heal", [{}, {}, {}]),
}


@pytest.mark.parametrize("name", sorted(MUTATIONS))
def test_each_rule_can_say_no(name):
    ev = copy.deepcopy(_tie())
    MUTATIONS[name](ev)
    reid(ev)  # a well-formed id, so only the mutated rule can refuse it
    res, why, _ = VF.verify_structure(ev)
    assert res == "INVALID", f"{name} was accepted"


def test_stale_event_id_is_invalid():
    ev = copy.deepcopy(_tie())
    ev["observed"]["permitted"] = []
    assert VF.verify_structure(ev)[0] == "INVALID"


def test_cli_structure(tmp_path, capsys):
    rc = VF.main(["--structure", GOLD[0]])
    out = json.loads(capsys.readouterr().out)
    assert rc == 0 and out["result"] == "STRUCTURE_VALID" and out["records"][0]["signed"] is False
    bad = copy.deepcopy(_tie()); bad["value"] = 1
    p = tmp_path / "bad.json"; p.write_text(json.dumps(bad))
    assert VF.main(["--structure", str(p)]) == 1
