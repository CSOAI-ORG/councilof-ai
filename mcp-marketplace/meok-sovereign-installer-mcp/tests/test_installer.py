"""Tests for meok-sovereign-installer-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_ins_")
os.environ["SOV_INS_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_installer_mcp" in sys.modules:
        del sys.modules["meok_sovereign_installer_mcp"]
    import meok_sovereign_installer_mcp as m
    importlib.reload(m)
    return m

def test_pip_basic():
    m = get_fresh()
    r = m.installer_pip()
    assert "pip install" in r["command"]
    assert r["package"] == "meok-sovereign-os"

def test_pip_with_extras():
    m = get_fresh()
    r = m.installer_pip(extras="all")
    assert "[all]" in r["command"]

def test_pip_custom_package():
    m = get_fresh()
    r = m.installer_pip("my-pkg")
    assert "my-pkg" in r["command"]

def test_npm_basic():
    m = get_fresh()
    r = m.installer_npm()
    assert "npm install" in r["command"]

def test_npm_global():
    m = get_fresh()
    r = m.installer_npm(global_install=True)
    assert "-g" in r["command"]

def test_npm_local():
    m = get_fresh()
    r = m.installer_npm(global_install=False)
    assert "-g" not in r["command"]

def test_brew_basic():
    m = get_fresh()
    r = m.installer_brew()
    assert "brew install" in r["command"]

def test_docker_basic():
    m = get_fresh()
    r = m.installer_docker()
    assert "docker run" in r["command"]
    assert "3101" in r["command"]

def test_docker_custom_port():
    m = get_fresh()
    r = m.installer_docker(port=8080)
    assert "8080" in r["command"]

def test_status():
    m = get_fresh()
    r = m.installer_status()
    assert "supported_installers" in r
    assert "pip" in r["supported_installers"]

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.installer_pip(), m.installer_npm(), m.installer_brew(),
              m.installer_docker(), m.installer_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Status → Pip → NPM → Brew → Docker."""
    m = get_fresh()
    r1 = m.installer_status()
    assert r1["package"] == "meok-sovereign-os"
    r2 = m.installer_pip()
    assert "pip install" in r2["command"]
    r3 = m.installer_npm()
    assert "npm install" in r3["command"]
    r4 = m.installer_brew()
    assert "brew install" in r4["command"]
    r5 = m.installer_docker()
    assert "docker run" in r5["command"]
