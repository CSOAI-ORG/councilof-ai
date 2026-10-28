#!/usr/bin/env python3
"""One surface's refusal must not take the other five down with it.

THE DEFECT
──────────
``class Refused(SystemExit)`` — the spray's own "I will not publish this" signal — is a
``BaseException``, NOT an ``Exception``. The per-surface loop caught ``Exception`` only, so a
``Refused`` raised inside one surface function ESCAPED the loop and unwound the whole program.
One Kaggle licence conflict therefore killed the GitHub, Zenodo, PyPI and npm surfaces too.

19 consecutive spray runs died that way, and because the GitHub, Zenodo, PyPI and npm mirrors are
what a citation resolves to, the *board* kept looking alive while every mirror of it went stale.

THE RULE
────────
One surface's refusal is that surface's failure, recorded in that surface's row of the report.
The other surfaces publish. The report says which failed and why; nothing is silent.

These are offline tests: no network, no credential, no surface is contacted. The surfaces are
faked so the loop's behaviour is what is under test, not Kaggle's.
"""
import importlib.util
import os
import sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
SPEC = os.path.join(HERE, "gspc-spray.py")


def load_spray():
    """gspc-spray.py has a hyphen: import it by path, under a name the test can hold."""
    spec = importlib.util.spec_from_file_location("gspc_spray_under_test", SPEC)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


spray = load_spray()


def _row(surface, status, detail=None):
    r = {"surface": surface, "status": status, "url": None, "as_of_seen": None}
    if detail is not None:
        r["detail"] = detail
    return r


def test_refused_is_not_an_exception():
    """The premise. If this ever becomes true, the bug cannot come back."""
    assert issubclass(spray.Refused, SystemExit)
    assert not issubclass(spray.Refused, Exception)


def test_one_surfaces_refusal_does_not_stop_the_others(monkeypatch):
    """A Refused on the first surface must not stop the second from publishing."""
    def kaggle_refuses(tr, snap, **kw):
        raise spray.Refused("Kaggle licence CC0-1.0 differs from board CC-BY-4.0; owner approval required")

    def hf_publishes(tr, snap, **kw):
        return [_row("hf", "PUBLISHED", "as_of 2026-10-26T00:00:00Z")]

    monkeypatch.setattr(spray, "SURFACES", {"hf": hf_publishes, "kaggle": kaggle_refuses})

    rows = spray.publish_surfaces(["kaggle", "hf"], {"as_of": "x"}, None,
                                  {"dry_run": False, "force": False,
                                   "metadata_only": False, "approved_licence_change": None})

    by_surface = {r["surface"]: r for r in rows}
    assert "hf" in by_surface, "the healthy surface did not publish — the refusal escaped the loop"
    assert by_surface["hf"]["status"] == "PUBLISHED"
    assert by_surface["kaggle"]["status"] == "FAILED"
    assert "Refused" in by_surface["kaggle"].get("detail", ""), "the refusal was not named in the report"


def test_an_ordinary_exception_also_stays_local(monkeypatch):
    """A crash on one surface is also that surface's failure."""
    def boom(tr, snap, **kw):
        raise RuntimeError("kaggle cli exploded")

    def pypi_publishes(tr, snap, **kw):
        return [_row("pypi", "PUBLISHED")]

    monkeypatch.setattr(spray, "SURFACES", {"pypi": pypi_publishes, "kaggle": boom})

    rows = spray.publish_surfaces(["kaggle", "pypi"], {"as_of": "x"}, None,
                                  {"dry_run": False, "force": False,
                                   "metadata_only": False, "approved_licence_change": None})

    by_surface = {r["surface"]: r for r in rows}
    assert by_surface["pypi"]["status"] == "PUBLISHED"
    assert by_surface["kaggle"]["status"] == "FAILED"
    assert "RuntimeError" in by_surface["kaggle"].get("detail", "")


def test_the_licence_repair_is_reachable_and_optional(monkeypatch):
    """The Kaggle surface must receive the owner approval only when it is given."""
    seen = {}

    def kaggle(tr, snap, **kw):
        seen.update(kw)
        return [_row("kaggle", "PUBLISHED")]

    monkeypatch.setattr(spray, "SURFACES", {"kaggle": kaggle})
    base = {"dry_run": False, "force": False, "metadata_only": False, "approved_licence_change": None}

    spray.publish_surfaces(["kaggle"], {"as_of": "x"}, None, dict(base))
    assert seen["approved_licence_change"] is None, "no approval means no approval is passed"

    spray.publish_surfaces(["kaggle"], {"as_of": "x"}, None, dict(base, approved_licence_change=("CC0-1.0", "CC-BY-4.0")))
    assert seen["approved_licence_change"] == ("CC0-1.0", "CC-BY-4.0")


def test_non_kaggle_surfaces_are_not_given_kaggle_only_options(monkeypatch):
    """`metadata_only` / `approved_licence_change` are Kaggle's; no other surface may receive them."""
    seen = {}

    def hf(tr, snap, **kw):
        seen.update(kw)
        return [_row("hf", "PUBLISHED")]

    monkeypatch.setattr(spray, "SURFACES", {"hf": hf})
    spray.publish_surfaces(["hf"], {"as_of": "x"}, None,
                           {"dry_run": True, "force": True,
                            "metadata_only": True, "approved_licence_change": ("CC0-1.0", "CC-BY-4.0")})
    assert "metadata_only" not in seen
    assert "approved_licence_change" not in seen
    assert seen["dry_run"] is True and seen["force"] is True


def test_the_licence_name_written_is_the_one_kaggle_accepts():
    """Kaggle's write endpoint does NOT take the SPDX string its read response reports.

    Measured live 2026-10-27 against the owner's own dataset: a metadata payload carrying
    {"name": "CC-BY-4.0"} is refused with "You've specified an invalid license", while
    {"name": "CC BY 4.0"} is accepted and reads back as
    "Attribution 4.0 International (CC BY 4.0)". The SPDX string is what the server refuses.
    """
    board = {"totals": {"license": "CC-BY-4.0"}}
    info = {"licenseName": None, "licenses": [{"name": "CC0-1.0"}]}

    out = spray.kaggle_licences(board, info, ("CC0-1.0", "CC-BY-4.0"))
    assert out == [{"name": "CC BY 4.0"}], "the SPDX string is refused by Kaggle's write endpoint"
    assert out[0]["name"] != "CC-BY-4.0"

    # the display labels Kaggle itself reports must both be readable
    assert spray.kaggle_licences({"totals": {"license": "CC0-1.0"}},
                                  {"licenseName": "CC0: Public Domain", "licenses": None}) == [{"name": "CC0-1.0"}]
    assert spray.kaggle_licences({"totals": {"license": "CC-BY-4.0"}},
                                  {"licenseName": "Attribution 4.0 International (CC BY 4.0)",
                                   "licenses": None}) == [{"name": "CC BY 4.0"}]


def test_the_drift_check_compares_the_licence_canonically():
    """A licence that is correct must not read as drift on every run.

    Kaggle reports the licence under its display label; the approved metadata carries the
    name Kaggle accepts on write. Comparing the strings directly reports drift that does
    not exist and sends a repair every single run.
    """
    info = {"licenseName": None, "licenses": [{"name": "Attribution 4.0 International (CC BY 4.0)"}],
            "subtitle": "sub", "description": "desc"}
    desired = [{"name": "CC BY 4.0"}]
    assert spray.kaggle_metadata_drift(info, "sub", "desc", desired) is None

    # a genuinely different licence must still read as drift
    info_cc0 = {"licenseName": None, "licenses": [{"name": "CC0-1.0"}],
                "subtitle": "sub", "description": "desc"}
    assert "licence differs" in (spray.kaggle_metadata_drift(info_cc0, "sub", "desc", desired) or "")


def test_wait_for_retries_through_a_refused():
    """The poll must survive a Refused, or a transient 404 kills the publish.

    THE SECOND DEFECT
    ----------------
    ``wait_for`` is the spray's polling helper: it calls a predicate until the predicate
    returns something true, and it treats a transient read failure as "not yet". But the
    predicates it polls include ``kaggle_public_files()``, which raises ``Refused`` when
    Kaggle's archive is not readable yet — and a Kaggle version that is still being created
    answers 404 on its own archive for a while after the upload succeeds.

    Because ``Refused`` is a SystemExit, ``except Exception`` never saw it: the poll died on
    the first miss, the Refused escaped ``spray_kaggle``, and the run reported FAILED instead
    of waiting for the version it had just created. Seen live 2026-10-27.
    """
    calls = {"n": 0}

    def predicate():
        calls["n"] += 1
        if calls["n"] < 3:
            raise spray.Refused("cannot read Kaggle's downloadable archive before publish (HTTP 404)")
        return "landed"

    assert spray.wait_for(predicate, tries=6, delay=0) == "landed"
    assert calls["n"] == 3, "the poll did not retry past the refusal"


def test_wait_for_gives_up_quietly_when_every_attempt_refuses():
    """Exhausting the retries is not itself a refusal — it is a falsy result."""
    def always_refuses():
        raise spray.Refused("still not downloadable")

    assert spray.wait_for(always_refuses, tries=2, delay=0) is None


if __name__ == "__main__":
    raise SystemExit(pytest.main([__file__, "-q"]))
