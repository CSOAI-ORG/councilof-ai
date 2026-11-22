# SPDX-License-Identifier: Apache-2.0
# SPDX-FileCopyrightText: 2026 CSOAI
"""Every batch is signed under its own artifact path: two batches can never name the same published path."""
import unittest
import venturi_capsule as v

P = "/evac-bulk/measurement-capsules-v0.2-"


class ArtifactPath(unittest.TestCase):
    def test_unique_per_batch_dir(self):
        dirs = [P + "2026-09-26-mill_cross_runtime", P + "2026-09-26-mill_cross_runtime-batch2",
                P + "2026-09-26-mill_cross_runtime.r2", P + "2026-09-27-mill_cross_runtime", P + "2026-09-26-cross_ledger"]
        paths = [v.artifact_path_for(d) for d in dirs]
        self.assertEqual(len(set(paths)), len(paths))
        self.assertEqual(paths[1], "measurement-capsules/v0.2/2026-09-26/mill_cross_runtime-batch2/record.json")

    def test_control_the_old_rule_collided(self):
        # must-fail control: the previous rule (adapter name only) gave batch 1 and batch 2 the same path
        old = lambda adapter: f"measurement-capsules/v0.2/{adapter}/record.json"
        self.assertEqual(old("mill_cross_runtime"), old("mill_cross_runtime"))
        self.assertNotEqual(v.artifact_path_for(P + "2026-09-26-mill_cross_runtime"),
                            v.artifact_path_for(P + "2026-09-26-mill_cross_runtime-batch2"))

    def test_staging_dir_signs_the_final_path(self):
        # the daily runner builds and signs in $WORK/staging/<final basename>, then moves the dir: same path either way
        self.assertEqual(v.artifact_path_for("/evac-bulk/.capsule-daily/staging/measurement-capsules-v0.2-2026-09-26-self_parity"),
                         v.artifact_path_for(P + "2026-09-26-self_parity"))

    def test_unfiled_dir_still_unique(self):
        self.assertNotEqual(v.artifact_path_for("/tmp/a"), v.artifact_path_for("/tmp/b"))


if __name__ == "__main__":
    unittest.main()
