# OTS stamps of files that are regenerated on every public-root publish — quarantined 2026-09-22

These four `.ots` files were committed on master at 12cf8f3bb (22 Sep 2026, "cycle: land five days of
standing-cycle output"). Each stamps the bytes of a file that `scripts/publish_public_root.py` /
`scripts/witness_public_root.py` rewrite on EVERY publish (`root-kinds.json`, `root-witness-latest.json`,
`root-witness-pointer.json`), or that `witness_public_root.py --refresh-ots` rewrites by design (the dated
sidecar). The first publish after 12cf8f3bb (the 2026-09-22T08:54:02Z root, branch root/refresh-2026-09-22)
therefore left every one of them proving bytes that are no longer the file, and
`scripts/root-witness-release-gate.py --phase candidate` reports each as a digest mismatch.

They are NOT deleted: each is still a valid OpenTimestamps proof of the bytes it names, and those bytes are
in git history (`git show 12cf8f3bb:public/interop/<file>`). They are moved out of the served tree because a
served `.ots` beside a file it does not describe is the exact "proof by filename" defect the gate exists to
catch. The ONE root witness, `root-<sha8>.json.ots`, is content-addressed and is not affected.

Do not re-stamp regenerated files: the next publish invalidates the stamp again. Stamp content-addressed
artefacts (`root-<sha8>.json`; a dated sidecar only once its OTS state is final) or nothing.

| proof | digest it proves | sha256 of master 12cf8f3bb bytes | bitcoin blocks in proof | pending calendars |
|---|---|---|---|---|
| root-kinds.json.ots | 17072ea80d17519217ef57e62e4be71a081b24c33eb45dbeb0cce98f89aebd6d | 17072ea80d17519217ef57e62e4be71a081b24c33eb45dbeb0cce98f89aebd6d (MATCH) | none | 3 |
| root-witness-latest.json.ots | eff684ac62db63aefabfdb16cd93a13e3951c3bc687248c3c7e439f684eb1776 | eff684ac62db63aefabfdb16cd93a13e3951c3bc687248c3c7e439f684eb1776 (MATCH) | none | 3 |
| root-witness-pointer.json.ots | 4ad46e54378233aa82a1409ca4cd1fcbfad7a85b611e5610293bd8629f68c30a | 4ad46e54378233aa82a1409ca4cd1fcbfad7a85b611e5610293bd8629f68c30a (MATCH) | none | 3 |
| root-witness-2026-09-15-dedb49d0.json.ots | eff684ac62db63aefabfdb16cd93a13e3951c3bc687248c3c7e439f684eb1776 | eff684ac62db63aefabfdb16cd93a13e3951c3bc687248c3c7e439f684eb1776 (MATCH) | none | 3 |
