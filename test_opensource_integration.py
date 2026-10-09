"""
test_opensource_integration.py
30+ tests covering the MEOK × OpenShell / OpenBMC / LFX.dev integration layer.

Run with:
    cd ~/clawd
    python -m pytest test_opensource_integration.py -v
or:
    python test_opensource_integration.py
"""
from __future__ import annotations

import json
import os
import re
import socket
import subprocess
import sys
import tempfile
import threading
import time
import unittest
import urllib.request
from http.server import ThreadingHTTPServer
from pathlib import Path

import yaml

CLAWD = Path("/Users/nicholas/clawd")
OPENSELL = CLAWD / "meok-os-openshell"
OPENBMC = CLAWD / "meok-os-openbmc"
LFX = CLAWD / "meok-os-lfx"

# --------------------------------------------------------------------------- #
#  Helpers
# --------------------------------------------------------------------------- #


def _read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _yaml_docs(path: Path):
    return list(yaml.safe_load_all(_read(path)))


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


# --------------------------------------------------------------------------- #
#  TASK 1 — OpenShell
# --------------------------------------------------------------------------- #


class OpenShellFilesExist(unittest.TestCase):
    def test_01_readme(self):
        self.assertTrue((OPENSELL / "README.md").is_file(), "README missing")

    def test_02_cluster_config(self):
        self.assertTrue((OPENSELL / "openshell-config.yaml").is_file())

    def test_03_daemonset(self):
        self.assertTrue((OPENSELL / "meok-agent.yaml").is_file())

    def test_04_sovereignty(self):
        self.assertTrue((OPENSELL / "sovereignty-constraints.yaml").is_file())

    def test_05_compliance_operator(self):
        self.assertTrue((OPENSELL / "compliance-operator.yaml").is_file())


class OpenShellConfigValid(unittest.TestCase):
    def setUp(self):
        self.docs = _yaml_docs(OPENSELL / "openshell-config.yaml")

    def test_06_three_nodes(self):
        # Find the cluster node list inside the ConfigMap's data.cluster.yaml
        cm = next(d for d in self.docs if d and d.get("kind") == "ConfigMap")
        cluster = yaml.safe_load(cm["data"]["cluster.yaml"])
        nodes = cluster["nodes"]
        self.assertEqual(len(nodes), 3, "must declare exactly 3 nodes")
        roles = [n["role"] for n in nodes]
        self.assertIn("control", roles)
        self.assertEqual(roles.count("worker"), 2)

    def test_07_bft_quorum(self):
        cm = next(d for d in self.docs if d and d.get("kind") == "ConfigMap")
        cluster = yaml.safe_load(cm["data"]["cluster.yaml"])
        self.assertEqual(cluster["cluster"]["bft"]["quorum"], "2-of-3")

    def test_08_tpm_required(self):
        cm = next(d for d in self.docs if d and d.get("kind") == "ConfigMap")
        cluster = yaml.safe_load(cm["data"]["cluster.yaml"])
        self.assertTrue(cluster["cluster"]["attestation"]["required"])
        self.assertEqual(cluster["cluster"]["attestation"]["provider"], "tpm2")

    def test_09_daemonset_rolls_to_every_node(self):
        docs = _yaml_docs(OPENSELL / "meok-agent.yaml")
        ds = next(d for d in docs if d and d.get("kind") == "DaemonSet")
        self.assertIsNone(ds["spec"].get("nodeSelector", {}).get("kubernetes.io/arch"))
        self.assertNotIn("replicas", ds["spec"], "DaemonSet cannot have replicas")
        self.assertEqual(ds["spec"]["updateStrategy"]["type"], "RollingUpdate")

    def test_10_daemonset_runs_as_non_root(self):
        docs = _yaml_docs(OPENSELL / "meok-agent.yaml")
        ds = next(d for d in docs if d and d.get("kind") == "DaemonSet")
        sc = ds["spec"]["template"]["spec"]["containers"][0]["securityContext"]
        self.assertTrue(sc["runAsNonRoot"])
        self.assertTrue(sc["readOnlyRootFilesystem"])
        self.assertIn("ALL", sc["capabilities"]["drop"])

    def test_11_sovereignty_blocks_host_pid(self):
        docs = _yaml_docs(OPENSELL / "sovereignty-constraints.yaml")
        policies = [d for d in docs if d and d.get("kind") == "ClusterPolicy"]
        names = {p["metadata"]["name"] for p in policies}
        self.assertIn("meok-deny-host-namespaces", names)
        self.assertIn("meok-require-care-class", names)
        self.assertIn("meok-require-harm-budget", names)

    def test_12_twelve_compliance_frameworks(self):
        docs = _yaml_docs(OPENSELL / "compliance-operator.yaml")
        profiles = [d for d in docs if d and d.get("kind") == "ComplianceProfile"]
        frameworks = {p["spec"]["framework"] for p in profiles}
        expected = {
            "eu-ai-act", "gdpr", "hipaa", "soc2", "iso-27001", "iso-42001",
            "nist-ai-rmf", "pci-dss", "iso-21434", "nis2", "cra",
            "eu-accessibility-act",
        }
        self.assertEqual(frameworks, expected, "must list 12 distinct frameworks")

    def test_13_compliance_crd_defined(self):
        docs = _yaml_docs(OPENSELL / "compliance-operator.yaml")
        crds = {d["metadata"]["name"] for d in docs
                if d and d.get("kind") == "CustomResourceDefinition"}
        self.assertIn("complianceprofiles.meok.io", crds)
        self.assertIn("compliancescans.meok.io", crds)


# --------------------------------------------------------------------------- #
#  TASK 2 — OpenBMC
# --------------------------------------------------------------------------- #


class OpenBMCFilesExist(unittest.TestCase):
    def test_14_readme(self):
        self.assertTrue((OPENBMC / "README.md").is_file())

    def test_15_firmware_yaml(self):
        self.assertTrue((OPENBMC / "bmc-firmware.yaml").is_file())

    def test_16_bmc_daemon_c(self):
        self.assertTrue((OPENBMC / "meok-bmc-daemon.c").is_file())

    def test_17_redfish_api(self):
        self.assertTrue((OPENBMC / "meok-redfish-api.py").is_file())

    def test_18_trust_anchor(self):
        self.assertTrue((OPENBMC / "trust-anchor.yaml").is_file())


class OpenBMCConfigValid(unittest.TestCase):
    def test_19_bmc_matrix_33_hives(self):
        doc = _yaml_docs(OPENBMC / "bmc-firmware.yaml")
        matrix = next(d for d in doc if d and d.get("kind") == "BMCFirmwareMatrix")
        self.assertEqual(matrix["spec"]["hives"]["count"], 33)
        self.assertTrue(matrix["spec"]["security"]["tpm"], "2.0")
        self.assertEqual(matrix["spec"]["base"]["upstream"],
                         "https://github.com/openbmc/openbmc")

    def test_20_trust_anchor_pcr_policy(self):
        doc = _yaml_docs(OPENBMC / "trust-anchor.yaml")
        anchor = next(d for d in doc if d and d.get("kind") == "TrustAnchor")
        pcrs = {p["index"] for p in anchor["spec"]["measuredBoot"]["pcrs"]}
        self.assertEqual(pcrs, {0, 2, 4, 7, 11})
        self.assertTrue(anchor["spec"]["attestation"]["ak"]["extractable"] is False)

    def test_21_bmc_daemon_emits_valid_receipt(self):
        """Compile the C daemon with a portable CC and run --once."""
        cc = os.environ.get("CC", "cc")
        src = OPENBMC / "meok-bmc-daemon.c"
        with tempfile.TemporaryDirectory() as tmp:
            binary = Path(tmp) / "meok-bmc-daemon"
            r = subprocess.run(
                [cc, "-std=c11", "-O2", "-Wall", "-o", str(binary), str(src)],
                capture_output=True, text=True,
            )
            self.assertEqual(r.returncode, 0,
                             f"compile failed: {r.stderr}")
            r = subprocess.run([str(binary), "--once"],
                               capture_output=True, text=True, timeout=10)
            self.assertEqual(r.returncode, 0,
                             f"daemon --once failed: {r.stderr}")
            line = r.stdout.strip().splitlines()[-1]
            data = json.loads(line)
            self.assertEqual(data["sigil"], "v1")
            self.assertIn("node_id", data)
            self.assertIn("pcrs", data)
            self.assertEqual(set(data["pcrs"].keys()),
                             {"0", "2", "4", "7", "11"})
            self.assertEqual(len(data["signature"]), 64 * 2,
                             "signature must be 64 bytes hex")
            self.assertGreaterEqual(data["counter"], 1)

    def test_22_bmc_daemon_counter_monotonic(self):
        cc = os.environ.get("CC", "cc")
        src = OPENBMC / "meok-bmc-daemon.c"
        with tempfile.TemporaryDirectory() as tmp:
            binary = Path(tmp) / "meok-bmc-daemon"
            subprocess.run([cc, "-std=c11", "-O2", "-o", str(binary), str(src)],
                           check=True, capture_output=True)
            r1 = subprocess.run([str(binary), "--once"],
                                capture_output=True, text=True, timeout=10)
            r2 = subprocess.run([str(binary), "--once"],
                                capture_output=True, text=True, timeout=10)
            c1 = json.loads(r1.stdout.splitlines()[-1])["counter"]
            c2 = json.loads(r2.stdout.splitlines()[-1])["counter"]
            self.assertGreater(c2, c1, "counter must be strictly monotonic")


class OpenBMCRedfishAPI(unittest.TestCase):
    """Start the Redfish API in-process, hit it with urllib."""

    @classmethod
    def setUpClass(cls):
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "meok_redfish_api", str(OPENBMC / "meok-redfish-api.py")
        )
        meok_redfish_api = importlib.util.module_from_spec(spec)
        sys.modules["meok_redfish_api"] = meok_redfish_api
        spec.loader.exec_module(meok_redfish_api)  # type: ignore[union-attr]
        cls.mod = meok_redfish_api
        cls.port = _free_port()
        store = meok_redfish_api.AttestationStore()
        store.add(meok_redfish_api.collect_quote(node_id="test-hive"))
        handler = meok_redfish_api.make_handler(
            store, node_id="test-hive",
            system_id="MEOK-Test-0", manager_id="MEOK-BMC-test",
        )
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", cls.port), handler)
        cls.thread = threading.Thread(target=cls.httpd.serve_forever,
                                      daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()

    def _get(self, path: str):
        url = f"http://127.0.0.1:{self.port}{path}"
        with urllib.request.urlopen(url, timeout=5) as r:
            return r.status, json.loads(r.read().decode("utf-8"))

    def _post(self, path: str, body: dict):
        url = f"http://127.0.0.1:{self.port}{path}"
        data = json.dumps(body).encode("utf-8")
        req = urllib.request.Request(
            url, data=data, method="POST",
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            return r.status, json.loads(r.read().decode("utf-8"))

    def test_23_service_root(self):
        status, body = self._get("/redfish/v1/")
        self.assertEqual(status, 200)
        self.assertEqual(body["Id"], "RootService")
        self.assertEqual(body["RedfishVersion"], "1.0.0")

    def test_24_system_oem_meok(self):
        status, body = self._get(
            "/redfish/v1/Systems/MEOK-Test-0"
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["Oem"]["Meok"]["CareClass"], "carer")
        self.assertIn("Actions", body)

    def test_25_attest_action(self):
        status, body = self._post(
            "/redfish/v1/Systems/MEOK-Test-0/Actions/Sober.MeokAttest",
            {"NodeId": "test-hive-2"},
        )
        self.assertEqual(status, 200)
        self.assertEqual(body["Sigil"], "v1")
        self.assertEqual(body["NodeId"], "test-hive-2")
        self.assertEqual(set(body["Pcrs"].keys()),
                         {"0", "2", "4", "7", "11"})

    def test_26_attestation_collection(self):
        status, body = self._get("/redfish/v1/AttestationService/Quotes")
        self.assertEqual(status, 200)
        self.assertGreaterEqual(body["Members@odata.count"], 1)

    def test_27_404(self):
        url = f"http://127.0.0.1:{self.port}/redfish/v1/nope"
        try:
            urllib.request.urlopen(url, timeout=5)
            self.fail("expected 404")
        except urllib.error.HTTPError as e:  # type: ignore[attr-defined]
            self.assertEqual(e.code, 404)


# --------------------------------------------------------------------------- #
#  TASK 3 — LFX.dev
# --------------------------------------------------------------------------- #


class LFXFilesExist(unittest.TestCase):
    def test_28_lfx_readme(self):
        self.assertTrue((LFX / "README.md").is_file())

    def test_29_lfx_project_json(self):
        self.assertTrue((LFX / "lfx-project.json").is_file())

    def test_30_lfx_mentorship(self):
        self.assertTrue((LFX / "lfx-mentorship.json").is_file())

    def test_31_lfx_events(self):
        self.assertTrue((LFX / "lfx-events.yaml").is_file())

    def test_32_lfx_landscape(self):
        self.assertTrue((LFX / "lfx-landscape.yaml").is_file())

    def test_33_lfx_badges(self):
        self.assertTrue((LFX / "lfx-badges.yaml").is_file())


class LFXContentValid(unittest.TestCase):
    def test_34_project_metadata(self):
        doc = json.loads(_read(LFX / "lfx-project.json"))
        self.assertEqual(doc["project"]["slug"], "meok-ai-os")
        self.assertEqual(doc["project"]["license"], "Apache-2.0")
        self.assertTrue(doc["project"]["cla"]["required"])
        self.assertTrue(doc["project"]["dco"]["required"])
        self.assertEqual(doc["project"]["maturity"], "sandbox")
        self.assertEqual(doc["project"]["governance"]["bft_required"], True)

    def test_35_mentorship_33_hives(self):
        doc = json.loads(_read(LFX / "lfx-mentorship.json"))
        self.assertEqual(doc["hives_total"], 33)
        self.assertEqual(len(doc["pairings"]), doc["mentor_pool_size"])
        # Each pairing has 4 mentees
        for p in doc["pairings"]:
            self.assertEqual(len(p["mentees"]), 4)
            self.assertIn("hive", p)
            self.assertIn("mentor", p)

    def test_36_events_have_cfp_state(self):
        doc = next(d for d in _yaml_docs(LFX / "lfx-events.yaml")
                   if d and d.get("kind") == "LFXEventMatrix")
        for ev in doc["spec"]["events"]:
            self.assertIn("cfp_status", ev)
            self.assertIn(ev["cfp_status"],
                          {"accepted", "pending", "invited", "rejected"})
            self.assertGreater(len(ev["sessions"]), 0)

    def test_37_landscape_cross_quadrant(self):
        doc = next(d for d in _yaml_docs(LFX / "lfx-landscape.yaml")
                   if d and d.get("kind") == "LFXLandscapePlacement")
        landscapes = {c["landscape"] for c in doc["spec"]["categories"]}
        # Must appear in 4 different LF landscapes
        self.assertGreaterEqual(len(landscapes), 4)
        self.assertIn("CNCF", landscapes)
        self.assertIn("LF AI", landscapes)
        self.assertIn("LF Edge", landscapes)
        self.assertIn("LF Security", landscapes)

    def test_38_badges_have_targets(self):
        doc = next(d for d in _yaml_docs(LFX / "lfx-badges.yaml")
                   if d and d.get("kind") == "LFXBadges")
        statuses = {b["status"] for b in doc["spec"]["badges"]}
        self.assertIn("gold", statuses)
        # summary numbers must add up
        s = doc["spec"]["summary"]
        self.assertEqual(s["total"], len(doc["spec"]["badges"]))
        self.assertEqual(
            s["gold"] + s["silver"] + s["bronze"], s["total"]
        )


# --------------------------------------------------------------------------- #
#  Cross-integration sanity
# --------------------------------------------------------------------------- #


class CrossIntegration(unittest.TestCase):
    def test_39_agent_image_present_in_daemonset(self):
        docs = _yaml_docs(OPENSELL / "meok-agent.yaml")
        ds = next(d for d in docs if d and d.get("kind") == "DaemonSet")
        image = ds["spec"]["template"]["spec"]["containers"][0]["image"]
        self.assertTrue(image.startswith("ghcr.io/meok-ai/"),
                        "image must live in the MEOK registry")

    def test_40_trust_anchor_keys_match_compliance(self):
        ta = _yaml_docs(OPENBMC / "trust-anchor.yaml")
        anchor = next(d for d in ta if d and d.get("kind") == "TrustAnchor")
        self.assertEqual(anchor["spec"]["attestation"]["algorithm"],
                         "rsa-2048")
        self.assertTrue(anchor["spec"]["attestation"]["ak"]["extractable"] is False)
        self.assertTrue(anchor["spec"]["measuredBoot"]["enabled"])

    def test_41_all_yaml_files_parse(self):
        # Smoke test: every YAML/JSON file we ship parses.
        roots = [OPENSELL, OPENBMC, LFX]
        for root in roots:
            for p in root.rglob("*"):
                if p.suffix in {".yaml", ".yml"}:
                    yaml.safe_load_all(_read(p))
                elif p.suffix == ".json":
                    json.loads(_read(p))


if __name__ == "__main__":
    unittest.main(verbosity=2)
