"""Explicit saved-copy controls; normal chat does not call this service."""
from typing import Optional
import importlib.util
import os

import gradio as gr

from memory_auth import MemoryAuthError
from memory_store import MemoryService, MemoryStoreError

_SERVICE = MemoryService()


def _refused(exc):
    # Clear stale account metadata even on refusal; keep current chat untouched.
    reason = str(exc)
    return (gr.Dropdown(choices=[], value=None), "Saved-copy operation refused: " + reason,
            {"operation": "refused", "reason": reason})


def _label(row):
    return f"{row['created_at']} · {row['messages']} messages · {row['snapshot_id'][:12]}"


def create_controls():
    gr.Markdown(
        "### Saved copies\n"
        "Optionally keep a text snapshot in this private workspace and restore it "
        "after signing in again. Saving happens only when you press **Save a copy**. "
        "Copies are available to your verified Hugging Face account and workspace "
        "administrators. Up to 20 copies per account; images are excluded. "
        "Restoring brings back conversation text with a fresh session and consent."
    )
    oauth_ready = (os.environ.get("SYSTEM") == "spaces" and bool(os.environ.get("SPACE_ID"))
                   and all(os.environ.get(name) for name in
                           ("OAUTH_CLIENT_ID", "OAUTH_CLIENT_SECRET", "OAUTH_SCOPES", "OPENID_PROVIDER_URL"))
                   and all(importlib.util.find_spec(name) is not None
                           for name in ("authlib", "itsdangerous")))
    if oauth_ready:
        login = gr.LoginButton(value="Sign in with Hugging Face")
    else:
        login = gr.Button("Hugging Face sign-in is unavailable here", interactive=False)
        gr.Markdown("Browser sign-in is available when this Space has OAuth configured. "
                    "Chat and device exports remain available.")
    opt_in = gr.Checkbox(value=False, label="Save this conversation text in the private workspace.")
    with gr.Row():
        save = gr.Button("Save a copy")
        refresh = gr.Button("List my saved copies")
    selection = gr.Dropdown(choices=[], value=None, label="Your saved copies", interactive=True)
    with gr.Row():
        restore = gr.Button("Restore selected copy")
        remove = gr.Button("Remove selected saved copy")
    status = gr.Markdown(
        "Sign in to use saved copies. If sign-in or persistent storage is unavailable, "
        "you can still chat and export on your device."
    )
    receipt = gr.JSON(label="Saved-copy result", value={})
    return dict(login=login, opt_in=opt_in, save=save, refresh=refresh,
                selection=selection, restore=restore, remove=remove,
                status=status, receipt=receipt)


def bind_controls(controls, state, chat_outputs, chat_consent, chat_event):
    def save_copy(state, opt_in, oauth_token: Optional[gr.OAuthToken] = None,
                  request: gr.Request = None):
        try:
            row = _SERVICE.save(state, opt_in, oauth_token, request)
            return (gr.Dropdown(choices=[(_label(row), row["snapshot_id"])],
                                value=row["snapshot_id"]),
                    "Saved this text copy. Use List my saved copies to see all your copies.",
                    dict(operation="saved", **row), False)
        except (MemoryAuthError, MemoryStoreError) as exc:
            return _refused(exc) + (False,)

    def list_copies(oauth_token: Optional[gr.OAuthToken] = None,
                    request: gr.Request = None):
        try:
            rows = _SERVICE.list(oauth_token, request)
            return (gr.Dropdown(choices=[(_label(row), row["snapshot_id"]) for row in rows],
                                value=None),
                    f"{len(rows)} saved copies for your verified account.",
                    {"operation": "listed", "copies": rows})
        except (MemoryAuthError, MemoryStoreError) as exc:
            return _refused(exc)

    def restore_copy(snapshot_id, oauth_token: Optional[gr.OAuthToken] = None,
                     request: gr.Request = None):
        try:
            restored, row = _SERVICE.restore(snapshot_id, oauth_token, request)
            return (restored, restored["chat_messages"], "", {}, {},
                    "Saved conversation text restored. Tick chat consent before sending. "
                    "Prior text is not verified evidence.",
                    "", None, False,
                    "Restored the selected copy into a fresh session.",
                    dict(operation="restored", **row), False,
                    gr.Dropdown(choices=[(_label(row), row["snapshot_id"])], value=row["snapshot_id"]))
        except (MemoryAuthError, MemoryStoreError) as exc:
            cleared, status, receipt = _refused(exc)
            return tuple(gr.skip() for _ in range(9)) + (status, receipt, False, cleared)

    def remove_copy(snapshot_id, oauth_token: Optional[gr.OAuthToken] = None,
                    request: gr.Request = None):
        try:
            result = _SERVICE.remove(snapshot_id, oauth_token, request)
            return (gr.Dropdown(choices=[], value=None),
                    "Removed the selected saved copy. Your current conversation and "
                    "copies already exported to your device are unchanged.",
                    dict(operation="removed", **result))
        except (MemoryAuthError, MemoryStoreError) as exc:
            return _refused(exc)

    def clear_saved_view():
        return (gr.Dropdown(choices=[], value=None),
                "Saved-copy view cleared. Sign in and list your copies to continue.", {}, False)

    common = dict(api_visibility="undocumented", concurrency_limit=1,
                  concurrency_id="meok-memory")
    memory_outputs = [controls["selection"], controls["status"], controls["receipt"]]
    controls["save"].click(
        save_copy, [state, controls["opt_in"]], memory_outputs + [controls["opt_in"]],
        api_name="memory_save", **common)
    controls["refresh"].click(
        list_copies, [], memory_outputs, api_name="memory_list", **common)
    controls["restore"].click(
        restore_copy, [controls["selection"]],
        chat_outputs + [chat_consent, controls["status"], controls["receipt"], controls["opt_in"], controls["selection"]],
        cancels=[chat_event], queue=False, api_name="memory_restore", **common)
    controls["remove"].click(
        remove_copy, [controls["selection"]], memory_outputs,
        api_name="memory_remove", **common)
    controls["login"].click(clear_saved_view, [], memory_outputs + [controls["opt_in"]],
                            queue=False, api_visibility="private")
    return dict(save=save_copy, list=list_copies, restore=restore_copy,
                remove=remove_copy, clear=clear_saved_view, components=controls)


def bind_clear_events(bound, events):
    controls = bound["components"]
    outputs = [controls["selection"], controls["status"], controls["receipt"], controls["opt_in"]]
    for event in events:
        event.then(bound["clear"], [], outputs, queue=False, api_visibility="private")
