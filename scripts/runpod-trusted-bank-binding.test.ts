import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const source = fileURLToPath(new URL('./test_verify_runpod_gspc_intake.py', import.meta.url));
const controls = [
  "test_trusted_keyword_only_bank_with_empty_label_menu_is_valid",
  "test_trusted_genuine_wrong_output_remains_reviewable",
  "test_trusted_missing_bytes_fail_closed",
  "test_trusted_absent_file_fail_closed",
  "test_trusted_bank_digest_must_match_actual_bytes",
  "test_trusted_bank_cannot_be_a_symlink",
  "test_trusted_bank_cannot_be_a_hardlink",
  "test_trusted_bank_cannot_come_from_transferred_directory",
  "test_trusted_answer_key_flip_cannot_inflate_wrong_answer",
  "test_trusted_prompt_change_cannot_pass_with_recomputed_hashes",
  "test_trusted_unknown_item_cannot_pass_with_recomputed_hashes",
  "test_trusted_predicate_cannot_be_replaced",
  "test_trusted_keyword_requirements_cannot_be_weakened",
  "test_trusted_keyword_prompt_cannot_be_changed",
  "test_trusted_complete_run_cannot_omit_supported_items",
  "test_trusted_complete_run_cannot_add_supported_items",
  "test_trusted_worker_item_order_is_preserved",
  "test_trusted_bounded_bank_uses_its_own_exact_digest",
  "test_trusted_unsupported_predicate_stays_uncheckable",
  "test_trusted_generated_ids_and_metadata_follow_worker_loader",
  "test_trusted_json_array_bank_uses_existing_loader",
  "test_trusted_existing_jail_candidate_bank_full_item_replay",
  "test_trusted_cli_requires_bytes_and_preserves_review_only_output"
];

describe('RunPod intake binds evidence to independently frozen bank bytes', () => {
  it('preserves all established worker, grading and quarantine controls', () => {
    const result = spawnSync('python3', [source, '-v'], { encoding: 'utf8', timeout: 20000 });
    expect(result.status, result.stderr || result.error?.message).toBe(0);
    expect(result.stderr).toMatch(/Ran [0-9]+ tests/);
  });
  it.each(controls)('%s', (name) => {
    const result = spawnSync('python3', [source, 'IntakeTests.' + name, '-v'], { encoding: 'utf8', timeout: 10000 });
    expect(result.status, result.stderr || result.error?.message).toBe(0);
    expect(result.stderr).toContain('Ran 1 test');
  });
});
