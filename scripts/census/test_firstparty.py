"""Offline tests for the first-party tier rule (firstparty.py) and the Scorecard join's repo parser."""
import importlib.util
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def _load(name, fn):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, fn))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


fp = _load("firstparty", "firstparty.py")
sj = _load("scorecard_join", "scorecard-join.py")

PSL_TEXT = """// ===BEGIN ICANN DOMAINS===
com
uk
co.uk
dev
*.ck
!www.ck
// ===BEGIN PRIVATE DOMAINS===
workers.dev
vercel.app
"""
PSL = fp.PSL(PSL_TEXT)


def test_registrable():
    assert PSL.registrable("mcp.grafana.com") == "grafana.com"
    assert PSL.registrable("api.foo.co.uk") == "foo.co.uk"
    assert PSL.registrable("a.b.workers.dev") == "b.workers.dev"   # private suffix respected
    assert PSL.registrable("x.y.ck") == "x.y.ck"                   # wildcard rule
    assert PSL.registrable("www.ck") == "www.ck"                   # exception rule
    assert PSL.registrable("127.0.0.1") is None
    assert PSL.registrable("localhost") is None
    assert PSL.registrable("com") is None


def test_namespace_domain_match():
    b = fp.match(PSL, "mcp.grafana.com", "com.grafana/mcp", None)
    assert [x["basis"] for x in b] == ["namespace_domain"]
    # a different registrable domain under the same private suffix is NOT a match
    assert fp.match(PSL, "other.workers.dev", "dev.workers.mine/x", None) == []
    assert fp.match(PSL, "api.mine.workers.dev", "dev.workers.mine/x", None)[0]["basis"] == "namespace_domain"
    assert fp.match(PSL, "mcp.evil.com", "com.grafana/mcp", None) == []


def test_github_owner_label():
    b = fp.match(PSL, "mcp.acme-corp.com", "io.github.AcmeCorp/server", None)
    assert [x["basis"] for x in b] == ["github_owner_label"]
    b = fp.match(PSL, "api.echo.com", "io.github.someone/x", "https://github.com/echo/mcp")
    assert b and b[0]["basis"] == "github_owner_label" and "repository.url" in b[0]["publisher"]
    assert fp.match(PSL, "mcp.ai.com", "io.github.ai/x", None) == []          # owner < 3 chars
    assert fp.match(PSL, "mcp.other.com", "io.github.acme/x", "https://github.com/acme/x") == []


def test_repo_key():
    assert sj.repo_key("https://github.com/Owner/Repo.git") == "Owner/Repo"
    assert sj.repo_key("https://github.com/o/r/tree/main/sub") == "o/r"
    assert sj.repo_key("git@github.com:o/r.git") == "o/r"
    assert sj.repo_key("https://gitlab.com/o/r") is None
    assert sj.repo_key("") is None


if __name__ == "__main__":
    for k, v in list(globals().items()):
        if k.startswith("test_"):
            v()
    print("ok")
