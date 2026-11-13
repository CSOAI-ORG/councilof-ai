"""Real Gradio binding/controller checks; only worker and external I/O are mocked."""
import copy
import sys
import tempfile
import types
import unittest
from pathlib import Path
from unittest.mock import patch

if "app" not in sys.modules:
    fake = types.ModuleType("vision")
    fake.reason = lambda prompt, image: "Inspect the current result, then confirm the next step."
    fake.MODEL_ID = "nvidia/Cosmos3-Edge"
    fake.REVISION = "344d602b128d1bbdacb43b08d0a3626f46343e29"
    fake.model = object()
    fake.load_error = None
    sys.modules["vision"] = fake

import app
import core
import memory_store as memory
import memory_ui
from test_memory_auth import oauth, request, PROFILE
from test_memory_store import state


class SavedMemoryUITests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.store = memory.SnapshotStore(Path(self.temp.name).resolve(), require_mount=False)
        self.backend = patch("memory_store.configured_store", return_value=self.store)
        self.backend_call = self.backend.start()
        self.addCleanup(self.backend.stop)
        self.auth = patch("memory_auth.HfApi")
        self.api = self.auth.start()
        self.addCleanup(self.auth.stop)
        self.api.return_value.whoami.return_value = dict(PROFILE)
        self.controls = app.conversation_controls["saved_memory"]

    def test_explicit_save_list_restore_remove_flow(self):
        original = state()
        saved = self.controls["save"](original, True, oauth())
        self.assertFalse(saved[-1])
        snapshot_id = saved[2]["snapshot_id"]
        self.assertEqual(saved[2]["operation"], "saved")
        listed = self.controls["list"](oauth())
        self.assertEqual(listed[2]["copies"][0]["snapshot_id"], snapshot_id)
        restored = self.controls["restore"](snapshot_id, oauth())
        self.assertEqual(len(restored), 13)
        self.assertEqual(restored[0]["chat_messages"], original["chat_messages"])
        self.assertEqual(restored[0]["episodes"], [])
        self.assertEqual(restored[3:5], ({}, {}))
        self.assertEqual(restored[6], "")
        self.assertIsNone(restored[7])
        self.assertIs(restored[8], False)
        self.assertIs(restored[-2], False)
        self.assertEqual(restored[10]["operation"], "restored")
        removed = self.controls["remove"](snapshot_id, oauth())
        self.assertEqual(removed[2]["operation"], "removed")
        self.assertEqual(self.controls["list"](oauth())[2]["copies"], [])
        self.assertEqual(self.api.return_value.whoami.call_count, 5)

    def test_native_request_bearer_works_without_profile_input(self):
        saved = self.controls["save"](state(), True, None, request("hf_sdk_synthetic"))
        self.assertEqual(saved[2]["operation"], "saved")
        self.api.return_value.whoami.assert_called_once_with(token="hf_sdk_synthetic", cache=False)

    def test_all_handlers_refuse_anonymous_without_storage(self):
        calls = [(lambda: self.controls["save"](state(), True), 2),
                 (self.controls["list"], 2),
                 (lambda: self.controls["restore"]("a" * 64), 10),
                 (lambda: self.controls["remove"]("a" * 64), 2)]
        for call, receipt_index in calls:
            result = call()
            receipt = result[receipt_index]
            self.assertEqual(receipt["operation"], "refused")
            self.assertIn("Sign in", receipt["reason"])
            selection = result[-1] if receipt_index == 10 else result[0]
            self.assertEqual(selection.choices, [])
            self.assertIsNone(selection.value)
        self.backend_call.assert_not_called()

    def test_failed_restore_leaves_every_chat_field_unchanged(self):
        import gradio as gr
        out = self.controls["restore"]("a" * 64, oauth())
        self.assertEqual(out[:9], tuple(gr.skip() for _ in range(9)))
        self.assertEqual(out[10]["operation"], "refused")
        self.assertIs(out[11], False)
        self.assertEqual(out[12].choices, [])

    def test_failed_save_clears_stale_view_without_claiming_success(self):
        with patch.object(self.store, "save", side_effect=OSError("private sensitive path")):
            result = self.controls["save"](state(), True, oauth())
        self.assertEqual(result[2]["operation"], "refused")
        self.assertIn("No success is claimed", result[2]["reason"])
        self.assertNotIn("private sensitive path", result[2]["reason"])
        self.assertEqual(result[0].choices, [])
        self.assertIs(result[-1], False)

    def test_revocation_clears_previous_account_metadata(self):
        saved = self.controls["save"](state(), True, oauth())
        snapshot_id = saved[2]["snapshot_id"]
        self.api.return_value.whoami.side_effect = RuntimeError("revoked")
        result = self.controls["list"](oauth())
        self.assertEqual(result[0].choices, [])
        self.assertEqual(result[2]["operation"], "refused")
        self.assertNotIn(snapshot_id, str(result[2]))

    def test_reset_and_login_actions_clear_view_without_removing_saved_copies(self):
        self.controls["save"](state(), True, oauth())
        calls_before = self.api.return_value.whoami.call_count
        cleared = self.controls["clear"]()
        self.assertEqual(cleared[0].choices, [])
        self.assertEqual(cleared[2], {})
        self.assertIs(cleared[3], False)
        self.assertEqual(self.api.return_value.whoami.call_count, calls_before)
        self.assertEqual(len(self.controls["list"](oauth())[2]["copies"]), 1)
        components = self.controls["components"]
        outputs = [components[key]._id for key in ("selection", "status", "receipt", "opt_in")]
        bindings = [entry for entry in app.demo.get_config_file()["dependencies"]
                    if entry["outputs"] == outputs and entry["backend_fn"]]
        self.assertTrue(any(any(target[0] == components["login"]._id
                                    for target in entry["targets"]) for entry in bindings))
        self.assertEqual(sum(entry.get("trigger_after") is not None for entry in bindings), 2)

    def test_new_handlers_have_only_expected_user_inputs_and_auth_annotations(self):
        dependencies = app.demo.get_config_file()["dependencies"]
        expected = {"memory_save": 2, "memory_list": 0, "memory_restore": 1, "memory_remove": 1}
        for name, input_count in expected.items():
            found = [entry for entry in dependencies if entry.get("api_name") == name]
            self.assertEqual(len(found), 1, name)
            self.assertEqual(len(found[0]["inputs"]), input_count)
            self.assertEqual(found[0]["api_visibility"], "undocumented")
        import gradio as gr
        from typing import get_type_hints
        for name in ("save", "list", "restore", "remove"):
            hints = get_type_hints(self.controls[name])
            self.assertEqual(hints["request"], gr.Request)
            self.assertEqual(hints["oauth_token"], gr.OAuthToken | None)

    def test_chat_export_reset_are_usable_without_memory_auth_or_storage(self):
        with patch.object(memory_ui._SERVICE, "save") as saved, \
             patch.object(memory_ui._SERVICE, "list") as listed:
            out = list(app.conversation_controls["submit"](
                "A regular message", None, core.PROVIDERS[0], True, True, None))[-1]
            exported = app.conversation_controls["save"](out[0])
            reset = app.conversation_controls["reset"]()
        self.assertIn("meok.chat-export/1", exported)
        self.assertEqual(reset[0]["turns"], [])
        self.assertIs(reset[-2], False)
        saved.assert_not_called()
        listed.assert_not_called()
        self.api.assert_not_called()

    def test_real_space_oauth_routes_mount_without_local_account_lookup(self):
        import os
        import gradio as gr
        import gradio.oauth as oauth_module
        config = {
            "SYSTEM": "spaces", "SPACE_ID": "synthetic/memory-tests",
            "OAUTH_CLIENT_ID": "synthetic-client",
            "OAUTH_CLIENT_SECRET": "synthetic-test-secret",
            "OAUTH_SCOPES": "openid profile",
            "OPENID_PROVIDER_URL": "https://huggingface.co",
        }
        constants = {key: config[key] for key in
                     ("OAUTH_CLIENT_ID", "OAUTH_CLIENT_SECRET", "OAUTH_SCOPES", "OPENID_PROVIDER_URL")}
        with patch.dict(os.environ, config), patch.multiple(oauth_module, **constants), \
             patch.object(oauth_module, "_get_mocked_oauth_info",
                          side_effect=AssertionError("ambient account lookup is forbidden")):
            with gr.Blocks() as demo:
                controls = memory_ui.create_controls()
            self.assertIsInstance(controls["login"], gr.LoginButton)
            paths = {route.path for route in demo.app.routes if hasattr(route, "path")}
            self.assertTrue({"/login/huggingface", "/login/callback", "/logout"} <= paths)

    def test_missing_oauth_configuration_keeps_ui_available(self):
        import os
        import gradio as gr
        import gradio.oauth as oauth_module
        with patch.dict(os.environ, {"SYSTEM": ""}), \
             patch.object(oauth_module, "_get_mocked_oauth_info",
                          side_effect=AssertionError("ambient account lookup is forbidden")):
            with gr.Blocks() as demo:
                controls = memory_ui.create_controls()
            self.assertNotIsInstance(controls["login"], gr.LoginButton)
            self.assertFalse(controls["login"].interactive)
            self.assertIn("save", controls)

    def test_saving_a_copy_does_not_mutate_live_session(self):
        original = state()
        before = copy.deepcopy(original)
        self.controls["save"](original, True, oauth())
        self.assertEqual(original, before)


if __name__ == "__main__":
    unittest.main()
