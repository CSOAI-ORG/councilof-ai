import copy, importlib.util, json, re, tempfile, unittest
from pathlib import Path
from unittest.mock import patch
spec=importlib.util.spec_from_file_location("gen_sbom",Path(__file__).with_name("gen_sbom.py"))
gen=importlib.util.module_from_spec(spec);spec.loader.exec_module(gen)
class LockfileInventory(unittest.TestCase):
    def setUp(self):
        self.package={"name":"fixture","version":"1.0.0","dependencies":{"@sample/lib":"^1.0.0"}}
        self.lock={"lockfileVersion":3,"packages":{
            "":{"name":"fixture","version":"1.0.0","dependencies":{"@sample/lib":"^1.0.0"}},
            "node_modules/@sample/lib":{"version":"1.8.2","license":"MIT"},
            "node_modules/transitive":{"version":"2.0.0","license":"MIT OR Apache-2.0","dev":True},
            "node_modules/@sample/lib/node_modules/transitive":{"version":"1.3.0","optional":True}}}
        self.hashes={"package.json":"a"*64,"package-lock.json":"b"*64}
    def built(self):
        return gen.build_sbom(self.package,self.lock,"c"*40,self.hashes,"2026-10-14T09:00:00Z")
    def test_locked_versions_transitives_and_distinct_install_locations(self):
        value=self.built();components=value["components"]
        self.assertEqual(len(components),3)
        self.assertEqual(components[0]["version"],"1.8.2")
        self.assertNotEqual(components[0]["version"],"1.0.0")
        self.assertEqual(len({c["bom-ref"] for c in components}),3)
        self.assertEqual(components[0]["purl"],"pkg:npm/%40sample/lib@1.8.2")
    def test_official_identifier_scope_and_prebuild_contract(self):
        a=self.built();b=self.built()
        self.assertRegex(a["serialNumber"],r"^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$")
        self.assertNotEqual(a["serialNumber"],b["serialNumber"])
        self.assertTrue(all(c["scope"] in {"required","optional","excluded"} for c in a["components"]))
        self.assertEqual(a["metadata"]["lifecycles"],[{"phase":"pre-build"}])
        self.assertEqual(a["metadata"]["properties"][1]["value"],"c"*40)
    def test_declarations_not_clearance_and_no_vulnerability_absence_claim(self):
        value=self.built()
        self.assertNotIn("vulnerabilities",value)
        self.assertEqual(value["components"][-1]["licenses"],[{"license":{"name":"MIT OR Apache-2.0"}}])
        missing=value["components"][1]
        self.assertNotIn("licenses",missing)
        self.assertIn({"name":"csoai:license:evidence","value":"UNRECORDED"},missing["properties"])
        self.assertIn("not independently verified",value["metadata"]["properties"][-1]["value"])
        self.assertNotIn("xrpl",json.dumps(value))
    def test_manifest_lock_drift_is_refused(self):
        self.lock["packages"][""]["dependencies"]["@sample/lib"]="^2.0.0"
        with self.assertRaisesRegex(ValueError,"differ"):self.built()
    def test_unresolved_or_missing_versions_are_refused(self):
        for field,value in [("version","^1.0.0"),("version",None),("link",True)]:
            with self.subTest(field=field,value=value):
                old=copy.deepcopy(self.lock["packages"]["node_modules/@sample/lib"])
                self.lock["packages"]["node_modules/@sample/lib"][field]=value
                with self.assertRaises(ValueError):self.built()
                self.lock["packages"]["node_modules/@sample/lib"]=old
    def test_full_commit_and_both_input_digests_are_required(self):
        for commit,hashes in [("abc123",self.hashes),("c"*40,{"package.json":"a"*64})]:
            with self.subTest(commit=commit,hashes=hashes):
                with self.assertRaises(ValueError):gen.build_sbom(self.package,self.lock,commit,hashes)
    def test_missing_old_lockformat_and_duplicate_keys_are_refused(self):
        for lock in [{"lockfileVersion":1,"dependencies":{}},{"lockfileVersion":3,"packages":{}}]:
            with self.subTest(lock=lock):
                with self.assertRaises(ValueError):gen.build_sbom(self.package,lock,"c"*40,self.hashes)
        with self.assertRaisesRegex(ValueError,"Duplicate"):gen.load_json(b'{"version":1,"version":2}')
    def test_validation_failure_preserves_existing_output(self):
        with tempfile.TemporaryDirectory(prefix="csoai-sbom-test-") as directory:
            root=Path(directory);(root/"package.json").write_text(json.dumps(self.package))
            lock=copy.deepcopy(self.lock);lock["packages"][""]["dependencies"]={}
            (root/"package-lock.json").write_text(json.dumps(lock));out=root/"old.json";out.write_bytes(b"existing original output")
            def git_read(args, **kwargs):
                stdout = "c"*40 if args[1]=="rev-parse" else (root/args[2].split(":",1)[1]).read_bytes()
                return type("Run",(),{"stdout":stdout})()
            with patch.object(gen.subprocess,"run",side_effect=git_read):
                self.assertEqual(gen.main(["--root",str(root),"--output",str(out)]),2)
            self.assertEqual(out.read_bytes(),b"existing original output")
    def test_valid_cli_writes_same_locked_inventory(self):
        with tempfile.TemporaryDirectory(prefix="csoai-sbom-test-") as directory:
            root=Path(directory);(root/"package.json").write_text(json.dumps(self.package))
            (root/"package-lock.json").write_text(json.dumps(self.lock))
            def git_read(args, **kwargs):
                stdout = "c"*40 if args[1]=="rev-parse" else (root/args[2].split(":",1)[1]).read_bytes()
                return type("Run",(),{"stdout":stdout})()
            with patch.object(gen.subprocess,"run",side_effect=git_read):
                self.assertEqual(gen.main(["--root",str(root)]),0)
            value=json.loads((root/"public/interop/sbom-councilof-ai.json").read_bytes())
            self.assertEqual(len(value["components"]),3)
            self.assertEqual(value["components"][0]["version"],"1.8.2")
    def test_uncommitted_dependency_bytes_refused_before_output_change(self):
        with tempfile.TemporaryDirectory(prefix="csoai-sbom-test-") as directory:
            root=Path(directory);(root/"package.json").write_text(json.dumps(self.package))
            (root/"package-lock.json").write_text(json.dumps(self.lock))
            out=root/"existing.json";out.write_bytes(b"original artifact must remain")
            def git_read(args, **kwargs):
                return type("Run",(),{"stdout":"c"*40 if args[1]=="rev-parse" else b"different committed bytes"})()
            with patch.object(gen.subprocess,"run",side_effect=git_read):
                self.assertEqual(gen.main(["--root",str(root),"--output",str(out)]),2)
            self.assertEqual(out.read_bytes(),b"original artifact must remain")
    def parity_fixture(self):
        package_raw=json.dumps(self.package).encode();lock_raw=json.dumps(self.lock).encode()
        hashes={"package.json":gen.sha256(package_raw),"package-lock.json":gen.sha256(lock_raw)}
        old=gen.build_sbom(self.package,self.lock,"c"*40,hashes,"2026-10-14T08:00:00Z")
        fresh=gen.build_sbom(self.package,self.lock,"d"*40,hashes,"2026-10-14T09:00:00Z")
        def pinned(revision,path):
            self.assertEqual(revision,"c"*40)
            return package_raw if path=="package.json" else lock_raw
        return old,fresh,package_raw,lock_raw,pinned
    def test_parity_allows_new_uuid_timestamp_and_next_output_commit(self):
        old,fresh,package_raw,lock_raw,pinned=self.parity_fixture()
        self.assertTrue(gen.check_output(old,fresh,package_raw,lock_raw,pinned))
        for stamp in ["2026-10-14T08:00:00.123Z","2026-10-14t08:00:00.123z","2026-10-14T08:00:00.123+01:30"]:
            with self.subTest(timestamp=stamp):
                old["metadata"]["timestamp"]=stamp
                self.assertTrue(gen.check_output(old,fresh,package_raw,lock_raw,pinned))
    def test_parity_rejects_same_names_with_changed_version_licence_role_or_path(self):
        original,fresh,package_raw,lock_raw,pinned=self.parity_fixture()
        for kind in ["version","licence","role","path","integrity","input-digest"]:
            with self.subTest(kind=kind):
                old=copy.deepcopy(original);component=old["components"][0]
                if kind=="version":component["version"]="9.9.9"
                elif kind=="licence":component["licenses"]=[{"license":{"name":"different"}}]
                elif kind=="role":component["scope"]="optional"
                elif kind=="path":component["properties"][0]["value"]="node_modules/other"
                elif kind=="integrity":component["properties"].append({"name":"csoai:lockfile:integrity-declaration","value":"changed"})
                else:old["metadata"]["properties"][2]["value"]="f"*64
                with self.assertRaisesRegex(ValueError,"detailed"):gen.check_output(old,fresh,package_raw,lock_raw,pinned)
    def test_parity_rejects_unrelated_generation_commit_inputs_or_reference(self):
        old,fresh,package_raw,lock_raw,pinned=self.parity_fixture()
        with self.assertRaisesRegex(ValueError,"stale"):
            gen.check_output(old,fresh,package_raw,lock_raw,lambda revision,path:b"unrelated source bytes")
        old["metadata"]["component"]["bom-ref"]="source:"+"f"*40
        with self.assertRaisesRegex(ValueError,"reference"):gen.check_output(old,fresh,package_raw,lock_raw,pinned)
    def test_cli_check_is_readonly_and_refuses_detailed_drift(self):
        with tempfile.TemporaryDirectory(prefix="csoai-sbom-test-") as directory:
            root=Path(directory);old,fresh,package_raw,lock_raw,pinned=self.parity_fixture()
            (root/"package.json").write_bytes(package_raw);(root/"package-lock.json").write_bytes(lock_raw)
            out=root/"old.json";out.write_text(json.dumps(old));before=out.read_bytes()
            def git_read(args,**kwargs):
                return type("Run",(),{"stdout":"d"*40 if args[1]=="rev-parse" else (package_raw if args[2].endswith(":package.json") else lock_raw)})()
            with patch.object(gen.subprocess,"run",side_effect=git_read):
                self.assertEqual(gen.main(["--root",str(root),"--output",str(out),"--check"]),0)
            self.assertEqual(out.read_bytes(),before)
            old["components"][0]["version"]="7.7.7";out.write_text(json.dumps(old));changed=out.read_bytes()
            with patch.object(gen.subprocess,"run",side_effect=git_read):
                self.assertEqual(gen.main(["--root",str(root),"--output",str(out),"--check"]),2)
            self.assertEqual(out.read_bytes(),changed)
    def test_parity_rejects_invalid_volatile_fields(self):
        original,fresh,package_raw,lock_raw,pinned=self.parity_fixture()
        for field,value in [("serialNumber","not-a-uuid"),("timestamp","tomorrow"),("timestamp","2026-10-14T09:00:00"),("timestamp","2026-10-14Q09:00:00+00:00"),("timestamp","2026-10-14 09:00:00+00:00"),("timestamp","2026-10-14T09:00:00+01:99")]:
            with self.subTest(field=field,value=value):
                old=copy.deepcopy(original)
                if field=="serialNumber":old[field]=value
                else:old["metadata"][field]=value
                with self.assertRaises(ValueError):gen.check_output(old,fresh,package_raw,lock_raw,pinned)
if __name__=="__main__":unittest.main(verbosity=2)
