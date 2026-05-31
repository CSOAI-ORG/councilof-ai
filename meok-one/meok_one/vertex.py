"""
MEOK BRIDGE — Vertex AI (Gemini) right-brain connector.

Wires Google Vertex AI Gemini as the RIGHT-BRAIN cloud engine, paid by Nick's £742
"GenAI App Builder" credit (Vertex-scoped). Once `gcloud auth` + project are set and
`google-cloud-aiplatform` is installed, the BRIDGE's right:cloud side answers with Gemini.

Activate (after `gcloud init` + `gcloud services enable aiplatform.googleapis.com`):
    pip install google-cloud-aiplatform
    export GOOGLE_CLOUD_PROJECT=<your-project-id>
    export MEOK_RIGHT_MODEL=vertex          # tells bridge to prefer this
Then bridge right:cloud → Gemini, spending the credit (not your card).

Honest: this is a thin, dependency-optional adapter. If the SDK/creds aren't present it
returns None so the BRIDGE cleanly falls back (never fabricates).
"""

import os

_PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT")
_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "europe-west2")
_MODEL = os.environ.get("VERTEX_MODEL", "gemini-2.0-flash")  # cheap+fast; -pro for power


def available() -> bool:
    if not _PROJECT:
        return False
    try:
        import vertexai  # noqa: F401
        return True
    except Exception:
        return False


def ask_vertex(prompt: str, model: str = None) -> dict:
    """Call Vertex Gemini. Returns {reply, model, backend, source} or {reply:None,...}."""
    if not available():
        return {"reply": None, "backend": "cloud", "source": "vertex",
                "note": "vertex unavailable (set GOOGLE_CLOUD_PROJECT + pip install google-cloud-aiplatform)"}
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
        vertexai.init(project=_PROJECT, location=_LOCATION)
        gm = GenerativeModel(model or _MODEL)
        resp = gm.generate_content(prompt)
        return {"reply": (resp.text or "").strip(), "model": f"vertex:{model or _MODEL}",
                "backend": "cloud", "source": "vertex"}
    except Exception as e:
        return {"reply": None, "backend": "cloud", "source": "vertex", "note": f"{type(e).__name__}: {e}"}


if __name__ == "__main__":
    print("vertex available:", available(), "| project:", _PROJECT or "(unset)", "| model:", _MODEL)
    if available():
        print(ask_vertex("Say hello in one sentence.").get("reply"))
    else:
        print("→ set GOOGLE_CLOUD_PROJECT + `pip install google-cloud-aiplatform`, then this powers the right brain on the £742 credit.")
