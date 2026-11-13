"""Auth boundary tests: synthetic tokens/profiles; no Hub requests."""
import hashlib
import os
import time
import unittest
from unittest.mock import patch

import gradio as gr
from starlette.requests import Request as HTTPRequest
from memory_auth import MemoryAuthError, verified_owner


def oauth(token="hf_synthetic", expires=None):
    return gr.OAuthToken(token=token, scope="openid profile",
                         expires_at=expires if expires is not None else time.time() + 300)


def request(token="hf_synthetic", scheme="Bearer"):
    raw = HTTPRequest({"type": "http",
                       "headers": [(b"authorization", f"{scheme} {token}".encode())]})
    return gr.Request(request=raw)


PROFILE = {"type": "user", "id": "synthetic-account-a", "name": "display-name"}


class MemoryAuthTests(unittest.TestCase):
    def setUp(self):
        self.patcher = patch("memory_auth.HfApi")
        self.api = self.patcher.start()
        self.addCleanup(self.patcher.stop)
        self.api.return_value.whoami.return_value = dict(PROFILE)

    def test_no_auth_has_no_ambient_token_fallback(self):
        with patch.dict(os.environ, {"HF_TOKEN": "ambient_must_not_be_used"}):
            with self.assertRaises(MemoryAuthError):
                verified_owner()
        self.api.assert_not_called()

    def test_profile_username_and_session_hash_cannot_authenticate(self):
        for value in (PROFILE, "display-name", {"session_hash": "known-session"}):
            with self.subTest(value=value), self.assertRaises(MemoryAuthError):
                verified_owner(value)
        self.api.assert_not_called()

    def test_expired_malformed_and_nonfinite_expiry_denied_before_network(self):
        for expires in (0, time.time() - 1, float("nan"), float("inf"), True, "tomorrow"):
            with self.subTest(expires=expires), self.assertRaises(MemoryAuthError):
                verified_owner(oauth(expires=expires))
        self.api.assert_not_called()

    def test_malformed_token_is_not_sent(self):
        for token in ("", None, "abc\nsecret", "x" * 8193):
            with self.subTest(token=str(token)[:10]), self.assertRaises(MemoryAuthError):
                verified_owner(oauth(token))
        self.api.assert_not_called()

    def test_oauth_uses_current_token_fixed_endpoint_and_no_cache(self):
        owner = verified_owner(oauth())
        self.api.assert_called_once_with(endpoint="https://huggingface.co")
        self.api.return_value.whoami.assert_called_once_with(token="hf_synthetic", cache=False)
        self.assertEqual(owner, hashlib.sha256(
            b"meok.hf-owner/1\0synthetic-account-a").hexdigest())
        self.assertNotIn(PROFILE["id"], owner)

    def test_real_sdk_accepts_current_token_without_cached_authority(self):
        from huggingface_hub import HfApi as RealHfApi
        with patch("memory_auth.HfApi", RealHfApi), \
             patch.object(RealHfApi, "_inner_whoami", side_effect=[dict(PROFILE), RuntimeError("revoked")]) as remote:
            verified_owner(oauth())
            with self.assertRaises(MemoryAuthError):
                verified_owner(oauth())
        self.assertEqual(remote.call_count, 2)
        self.assertTrue(all(call.kwargs["token"] == "hf_synthetic"
                            for call in remote.call_args_list))

    def test_bearer_request_is_freshly_verified(self):
        verified_owner(None, request("hf_api_synthetic"))
        self.api.return_value.whoami.assert_called_once_with(token="hf_api_synthetic", cache=False)

    def test_caller_dict_request_or_wrong_auth_scheme_denied(self):
        for req in ({"authorization": "Bearer hf_synthetic"}, request(scheme="Basic"), gr.Request()):
            with self.subTest(req=type(req).__name__), self.assertRaises(MemoryAuthError):
                verified_owner(None, req)
        self.api.assert_not_called()

    def test_expired_oauth_does_not_fall_back_to_another_identity(self):
        with self.assertRaises(MemoryAuthError):
            verified_owner(oauth(expires=1), request("hf_other"))
        self.api.assert_not_called()

    def test_revocation_on_second_operation_has_no_cached_authority(self):
        self.api.return_value.whoami.side_effect = [dict(PROFILE), RuntimeError("revoked")]
        verified_owner(oauth())
        with self.assertRaises(MemoryAuthError):
            verified_owner(oauth())
        self.assertEqual(self.api.return_value.whoami.call_count, 2)
        self.assertTrue(all(c.kwargs["cache"] is False
                            for c in self.api.return_value.whoami.call_args_list))

    def test_expiry_during_remote_check_is_denied(self):
        with patch("memory_auth.time.time", side_effect=[100, 201]):
            with self.assertRaises(MemoryAuthError):
                verified_owner(oauth(expires=200))

    def test_username_change_does_not_change_owner(self):
        first = verified_owner(oauth())
        self.api.return_value.whoami.return_value = dict(PROFILE, name="renamed-user")
        self.assertEqual(first, verified_owner(oauth()))

    def test_distinct_account_ids_have_distinct_owner_keys(self):
        first = verified_owner(oauth())
        self.api.return_value.whoami.return_value = dict(PROFILE, id="synthetic-account-b")
        self.assertNotEqual(first, verified_owner(oauth()))

    def test_missing_identity_org_and_malformed_profile_denied(self):
        for profile in (None, {}, {"type": "org", "id": "org-a"},
                        {"type": "user", "name": "no-id"}, dict(PROFILE, id="../escape")):
            self.api.return_value.whoami.return_value = profile
            with self.subTest(profile=profile), self.assertRaises(MemoryAuthError):
                verified_owner(oauth())

    def test_auth_network_failure_is_safe_and_not_success(self):
        self.api.return_value.whoami.side_effect = RuntimeError("secret_do_not_expose")
        with self.assertRaises(MemoryAuthError) as caught:
            verified_owner(oauth())
        self.assertNotIn("secret_do_not_expose", str(caught.exception))
        self.assertIn("No saved-copy operation", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
