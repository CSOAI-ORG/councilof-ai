"""hub - the private HF dataset the fleet coordinates through (default csoai/fleet-heartbeat).

Reads are stdlib HTTP (no cache written to Oracle's 97%-full disk). Writes, jobs and schedules use
huggingface_hub, imported lazily (present on Oracle; `pip install huggingface_hub` in a job).
A commit made with parent_commit=<rev> is a compare-and-swap: it fails if anything else committed
since <rev>, which is what makes the leases safe between two supervisors.
"""
from __future__ import annotations

import io
import json
import os
import urllib.error
import urllib.parse
import urllib.request

from fleetlib import LeaseStore, parse_ts

API = "https://huggingface.co"


def read_token():
    t = os.environ.get("HF_TOKEN")
    if t:
        return t.strip()
    p = os.path.expanduser("~/.secrets/hf_token")
    if os.path.exists(p):
        with open(p) as fh:
            return fh.read().strip()
    return None


class Hub(LeaseStore):
    def __init__(self, repo, token, repo_type="dataset", namespace="csoai"):
        self.repo, self.token, self.repo_type, self.namespace = repo, token, repo_type, namespace
        self._api = None

    # -- lazy client
    @property
    def api(self):
        if self._api is None:
            from huggingface_hub import HfApi
            self._api = HfApi(token=self.token)
        return self._api

    def _get(self, url, timeout=30):
        req = urllib.request.Request(url, headers={"Authorization": "Bearer " + self.token,
                                                   "User-Agent": "csoai-fleet-supervisor/0.1"})
        return urllib.request.urlopen(req, timeout=timeout)

    def ensure_repo(self):
        self.api.create_repo(self.repo, repo_type=self.repo_type, private=True, exist_ok=True)

    def head(self):
        with self._get("%s/api/%ss/%s/revision/main" % (API, self.repo_type, self.repo)) as r:
            d = json.load(r)
        return d["sha"], parse_ts(d.get("lastModified"))

    def read_bytes(self, path, rev="main"):
        url = "%s/%ss/%s/resolve/%s/%s" % (API, self.repo_type, self.repo, rev, urllib.parse.quote(path))
        try:
            with self._get(url) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise

    def read_json(self, path, rev="main"):
        b = self.read_bytes(path, rev)
        return json.loads(b) if b is not None else None

    # -- LeaseStore
    def get(self, path):
        rev, _ = self.head()
        return self.read_json(path, rev), rev

    def put(self, files, parent_rev, message=""):
        from huggingface_hub import CommitOperationAdd
        from huggingface_hub.errors import HfHubHTTPError
        ops = []
        for path, obj in files.items():
            data = obj if isinstance(obj, (bytes, bytearray)) else (json.dumps(obj, indent=1, sort_keys=True) + "\n").encode()
            ops.append(CommitOperationAdd(path_in_repo=path, path_or_fileobj=io.BytesIO(data)))
        try:
            self.api.create_commit(self.repo, ops, commit_message=message or "fleet", repo_type=self.repo_type,
                                   parent_commit=parent_rev)
            return True
        except HfHubHTTPError as e:
            code = getattr(getattr(e, "response", None), "status_code", None)
            if code in (409, 412):
                return False
            raise

    def upload_paths(self, mapping, message):
        """mapping {path_in_repo: local_path}; no CAS (content-addressed payloads)."""
        from huggingface_hub import CommitOperationAdd
        ops = [CommitOperationAdd(path_in_repo=k, path_or_fileobj=v) for k, v in mapping.items()]
        return self.api.create_commit(self.repo, ops, commit_message=message, repo_type=self.repo_type)

    def last_modified(self, repo, repo_type="dataset"):
        with self._get("%s/api/%ss/%s/revision/main" % (API, repo_type, repo)) as r:
            d = json.load(r)
        return parse_ts(d.get("lastModified"))

    def list_prefix(self, prefix):
        with self._get("%s/api/%ss/%s/tree/main/%s?recursive=true" % (API, self.repo_type, self.repo, urllib.parse.quote(prefix))) as r:
            return [x["path"] for x in json.load(r) if x.get("type") == "file"]

    # -- jobs
    def run_job(self, command, flavor="cpu-basic", timeout=1800, labels=None, secrets=None, env=None,
                image="python:3.12"):
        j = self.api.run_job(image=image, command=command, flavor=flavor, timeout=timeout, labels=labels or {},
                             secrets=secrets or {}, env=env or {}, namespace=self.namespace)
        return j.id

    def job_stage(self, job_id):
        j = self.api.inspect_job(job_id=job_id, namespace=self.namespace)
        return str(getattr(j.status, "stage", j.status))
