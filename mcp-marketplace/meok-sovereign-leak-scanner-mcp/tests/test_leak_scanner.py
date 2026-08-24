"""
Tests for MEOK Sovereign Leak Scanner MCP
Covers: env files, API keys, private keys, certificates, repo scan, severity, care floor
"""
import os
import sys
import tempfile

os.environ["SOV_LEAK_KEY"] = "test-leak-scanner-key"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from meok_leak_scanner_mcp import (
    scan_file, scan_repository, check_env_files, check_api_keys,
    check_private_keys, get_severity, leak_scanner_care_floor,
    _is_env_file, _is_risky_path, _redact_secret, _scan_text_for_patterns
)


def test_env_file_detection():
    """Test .env file pattern detection."""
    assert _is_env_file("/path/to/.env") is True
    assert _is_env_file("/path/to/.env.production") is True
    assert _is_env_file("/path/to/.env.staging") is True
    assert _is_env_file("/path/to/.env.local") is True
    assert _is_env_file("/path/to/main.py") is False
    assert _is_env_file("/path/to/README.md") is False
    print("✅ test_env_file_detection")


def test_risky_path_detection():
    """Test risky path patterns."""
    assert _is_risky_path("/repo/.env") is True
    assert _is_risky_path("/repo/.env.prod") is True
    assert _is_risky_path("/repo/secrets.json") is True
    assert _is_risky_path("/repo/id_rsa") is True
    assert _is_risky_path("/repo/gateway.key") is True
    assert _is_risky_path("/repo/main.py") is False
    print("✅ test_risky_path_detection")


def test_secret_redaction():
    """Test that secrets are properly redacted."""
    secret = "[REDACTED-SECRET-GH-PUSH-PROTECTION]"
    redacted = _redact_secret(secret)
    assert "sk-p" in redacted
    assert "234" in redacted
    assert "abc" not in redacted  # Middle is hidden
    print("✅ test_secret_redaction")


def test_scan_file_openai_key():
    """Test scanning file with OpenAI key."""
    content = '''
# Config file
OPENAI_API_KEY=[REDACTED-SECRET-GH-PUSH-PROTECTION]
OTHER=foo
'''
    r = scan_file("/test/config.py", content)
    assert r["findings_count"] >= 1
    assert r["severity_counts"]["CRITICAL"] >= 1
    # Verify no actual secret in output
    output_str = str(r)
    assert "abc123def456" not in output_str
    print("✅ test_scan_file_openai_key")


def test_scan_file_aws_key():
    """Test scanning file with AWS key."""
    content = '''
aws_access_key_id = "[REDACTED-SECRET-GH-PUSH-PROTECTION]"
aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
'''
    r = scan_file("/test/aws.py", content)
    assert r["findings_count"] >= 2
    assert r["severity_counts"]["CRITICAL"] >= 2
    print("✅ test_scan_file_aws_key")


def test_scan_file_private_key():
    """Test scanning file with private key."""
    content = '''
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA...
-----END RSA PRIVATE KEY-----
'''
    r = scan_file("/test/key.pem", content)
    assert r["findings_count"] >= 1
    assert any("RSA" in f["pattern_name"] for f in r["findings"])
    print("✅ test_scan_file_private_key")


def test_scan_file_no_secrets():
    """Test scanning file with no secrets."""
    content = '''
def hello():
    return "world"
'''
    r = scan_file("/test/clean.py", content)
    assert r["findings_count"] == 0
    assert r["severity_counts"]["CRITICAL"] == 0
    print("✅ test_scan_file_no_secrets")


def test_scan_file_github_token():
    """Test GitHub PAT detection."""
    content = 'GITHUB_TOKEN = "[REDACTED-SECRET-GH-PUSH-PROTECTION]"'
    r = scan_file("/test/github.py", content)
    assert r["findings_count"] >= 1
    assert any("GitHub" in f["pattern_name"] for f in r["findings"])
    print("✅ test_scan_file_github_token")


def test_scan_file_stripe_key():
    """Test Stripe key detection."""
    content = 'STRIPE_KEY = "sk_live_abc123def456ghi789jkl012mno"'
    r = scan_file("/test/stripe.py", content)
    assert r["findings_count"] >= 1
    assert any("Stripe" in f["pattern_name"] for f in r["findings"])
    print("✅ test_scan_file_stripe_key")


def test_scan_file_anthropic_key():
    """Test Anthropic key detection."""
    content = 'ANTHROPIC_KEY = "[REDACTED-SECRET-GH-PUSH-PROTECTION]"'
    r = scan_file("/test/anthropic.py", content)
    assert r["findings_count"] >= 1
    print("✅ test_scan_file_anthropic_key")


def test_check_env_files():
    """Test env file checker."""
    paths = [
        "/repo/.env",
        "/repo/.env.production",
        "/repo/.env.staging",
        "/repo/main.py",
        "/repo/secrets.json",
    ]
    r = check_env_files(paths)
    assert r["env_files_found"] >= 3
    assert r["paths_checked"] == 5
    assert "sigil" in r
    print("✅ test_check_env_files")


def test_check_api_keys():
    """Test API key checker."""
    text = """
    OPENAI_KEY=[REDACTED-SECRET-GH-PUSH-PROTECTION]
    GITHUB=[REDACTED-SECRET-GH-PUSH-PROTECTION]stu
    """
    r = check_api_keys(text, "test.txt")
    assert r["keys_found"] >= 2
    assert "OpenAI" in r["key_types"]
    print("✅ test_check_api_keys")


def test_check_private_keys():
    """Test private key checker."""
    text = """
    -----BEGIN RSA PRIVATE KEY-----
    ABC123
    -----END RSA PRIVATE KEY-----
    -----BEGIN OPENSSH PRIVATE KEY-----
    DEF456
    -----END OPENSSH PRIVATE KEY-----
    """
    r = check_private_keys(text, "test.pem")
    assert r["keys_found"] >= 2
    print("✅ test_check_private_keys")


def test_get_severity_critical():
    """Test severity classification — critical."""
    finding = {"pattern_name": "OpenAI", "snippet": "sk-..."}
    r = get_severity(finding)
    assert r["severity"] == "CRITICAL"
    assert r["sla_hours"] == 1
    print("✅ test_get_severity_critical")


def test_get_severity_high():
    """Test severity classification — high."""
    finding = {"pattern_name": "env_file:.env.production", "snippet": ""}
    r = get_severity(finding)
    assert r["severity"] == "HIGH"
    print("✅ test_get_severity_high")


def test_get_severity_medium():
    """Test severity classification — medium."""
    finding = {"pattern_name": "DB_Dump", "snippet": ""}
    r = get_severity(finding)
    assert r["severity"] == "MEDIUM"
    print("✅ test_get_severity_medium")


def test_care_floor():
    """Test care floor constraints."""
    r = leak_scanner_care_floor()
    assert r["care_floor_active"] is True
    assert len(r["rules"]) == 5
    assert len(r["red_lines"]) == 5
    assert len(r["allowed"]) == 5
    assert "case_study" in r
    assert r["case_study"]["incident"] == "Accenture 35GB Breach"
    print("✅ test_care_floor")


def test_scan_repository_temp():
    """Test scanning a temp directory with fake secrets."""
    with tempfile.TemporaryDirectory() as tmpdir:
        # Create .env file
        with open(os.path.join(tmpdir, ".env"), "w") as f:
            f.write("SECRET=foo\n")

        # Create Python file with API key
        with open(os.path.join(tmpdir, "config.py"), "w") as f:
            f.write('OPENAI = "[REDACTED-SECRET-GH-PUSH-PROTECTION]"\n')

        # Create a private key file (on a single line for regex match)
        with open(os.path.join(tmpdir, "id_rsa"), "w") as f:
            f.write("-----BEGIN RSA PRIVATE KEY----- MIIEpAIBAAKCAQEA -----END RSA PRIVATE KEY-----\n")

        r = scan_repository(tmpdir)

        assert r["files_scanned"] >= 1
        assert r["findings_count"] >= 1
        assert r["severity_counts"]["CRITICAL"] >= 1
        assert r["findings_by_type"]["PRIVATE_KEY"] >= 1
        assert r["findings_by_type"]["API_KEY"] >= 1
        assert r["care_floor"].startswith("Detection only")
        print("✅ test_scan_repository_temp")


def test_scan_repository_clean():
    """Test scanning a clean temp directory."""
    with tempfile.TemporaryDirectory() as tmpdir:
        with open(os.path.join(tmpdir, "main.py"), "w") as f:
            f.write('def hello():\n    return "world"\n')

        r = scan_repository(tmpdir)
        assert r["findings_count"] == 0
        print("✅ test_scan_repository_clean")


def test_scan_file_not_found():
    """Test scanning a file that doesn't exist with no content."""
    r = scan_file("/nonexistent/file.py", "")
    assert "error" in r
    print("✅ test_scan_file_not_found")


def test_scan_file_gcp_key():
    """Test GCP API key detection."""
    content = 'GCP_KEY = "[REDACTED-SECRET-GH-PUSH-PROTECTION]789"'
    r = scan_file("/test/gcp.py", content)
    assert r["findings_count"] >= 1
    assert any("GCP" in f["pattern_name"] for f in r["findings"])
    print("✅ test_scan_file_gcp_key")


def test_scan_file_huggingface():
    """Test HuggingFace token detection."""
    content = 'HF_TOKEN = "[REDACTED-SECRET-GH-PUSH-PROTECTION]"'
    r = scan_file("/test/hf.py", content)
    assert r["findings_count"] >= 1
    print("✅ test_scan_file_huggingface")


def test_scan_file_slack_webhook():
    """Test Slack webhook detection."""
    content = 'SLACK_WEBHOOK = "https://hooks.slack.com/services/T12345678/B12345678/abcdefghij1234567890abcdef"'
    r = scan_file("/test/slack.py", content)
    assert r["findings_count"] >= 1
    print("✅ test_scan_file_slack_webhook")


def test_sigil_signed():
    """Test that all responses are SIGIL-signed."""
    r = scan_file("/test.py", "OPENAI = '[REDACTED-SECRET-GH-PUSH-PROTECTION]'")
    assert "sigil" in r
    assert len(r["sigil"]) == 16
    print("✅ test_sigil_signed")


def test_redaction_in_output():
    """Test that secrets are never exposed in output."""
    full_secret = "[REDACTED-SECRET-GH-PUSH-PROTECTION]"
    content = f'KEY = "{full_secret}"'
    r = scan_file("/test.py", content)
    output = str(r)
    assert full_secret not in output
    assert "sk-p" in output  # First 4 chars visible
    print("✅ test_redaction_in_output")


if __name__ == "__main__":
    test_env_file_detection()
    test_risky_path_detection()
    test_secret_redaction()
    test_scan_file_openai_key()
    test_scan_file_aws_key()
    test_scan_file_private_key()
    test_scan_file_no_secrets()
    test_scan_file_github_token()
    test_scan_file_stripe_key()
    test_scan_file_anthropic_key()
    test_check_env_files()
    test_check_api_keys()
    test_check_private_keys()
    test_get_severity_critical()
    test_get_severity_high()
    test_get_severity_medium()
    test_care_floor()
    test_scan_repository_temp()
    test_scan_repository_clean()
    test_scan_file_not_found()
    test_scan_file_gcp_key()
    test_scan_file_huggingface()
    test_scan_file_slack_webhook()
    test_sigil_signed()
    test_redaction_in_output()
    print(f"\n{'='*50}")
    print(f"🔐 MEOK SOVEREIGN LEAK SCANNER MCP — ALL 25 TESTS PASS")
    print(f"{'='*50}")
