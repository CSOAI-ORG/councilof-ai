/**
 * Hugging Face is the signing record. CSOAI-GSPC is GET /api/gspc.
 *
 * These four datasets are planted. They are mirrors, queues and banks —
 * never a second scoreboard, never an iframe of a Space, never MEASURED
 * because a Hub repo exists. hub-queue stays UNMEASURED.
 */

export type HfPlanted = {
  id: string;
  href: string;
  role: string;
  status: "planted";
};

export const HF_LIVING_RULING =
  "CSOAI-GSPC is GET /api/gspc. Hugging Face holds the signed record. A Hub repo is not a grade.";

export const HF_PLANTED: HfPlanted[] = [
  {
    id: "gspc-board",
    href: "https://huggingface.co/datasets/csoai/gspc-board",
    role: "CSOAI-GSPC Hub mirror. Cite GET /api/gspc.",
    status: "planted",
  },
  {
    id: "gspc-boards",
    href: "https://huggingface.co/datasets/csoai/gspc-boards",
    role: "Public-root Merkle mirror (public-root/root.json). Cite GET /api/gspc for GSPC. Not a second board.",
    status: "planted",
  },
  {
    id: "hub-queue",
    href: "https://huggingface.co/datasets/csoai/hub-queue",
    role: "Named Hub ids. DISCOVERED. All UNMEASURED.",
    status: "planted",
  },
  {
    id: "living-catalog",
    href: "https://huggingface.co/datasets/csoai/living-catalog",
    role: "Directory of public surfaces. Discovery, not a sweep.",
    status: "planted",
  },
  {
    id: "gspc-gov",
    href: "https://huggingface.co/datasets/csoai/gspc-gov",
    role: "Canonical governance bank. Never invent csoai/gspc-${axis}.",
    status: "planted",
  },
];

export const HF_VIEWERS: { id: string; href: string; role: string }[] = [
  {
    id: "space-gspc-board",
    href: "https://huggingface.co/spaces/csoai/gspc-board",
    role: "CSOAI-GSPC public board. Search a model. Open an axis. Hub listings are DISCOVERED; a finished walk is not a grade. Compact cards verify. Same GET /api/gspc.",
  },
  {
    id: "space-living-catalog",
    href: "https://huggingface.co/spaces/csoai/living-catalog",
    role: "Catalog viewer. Opens on the Hub. We do not iframe it.",
  },
  {
    id: "space-gspc-verify",
    href: "https://huggingface.co/spaces/csoai/gspc-verify",
    role: "Verify viewer. Same Ed25519 check as /gspc-verify.",
  },
];

export type CompetitionTrackItem = {
  id: string;
  platform: "Kaggle" | "Hugging Face";
  title: string;
  href: string;
  axis: string;
  role: string;
  license: "CC0-1.0" | "MIT-0";
};

export const KAGGLE_AND_HF_COMPETITIONS: CompetitionTrackItem[] = [
  {
    id: "arc-prize-2026-arc-agi-3",
    platform: "Kaggle",
    title: "ARC Prize 2026 (ARC-AGI-3 Interactive Reasoning)",
    href: "https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-3",
    axis: "GSPC-MATH + GSPC-SCIENCE",
    role: "Offline-verifiable interactive action agent (gpu-offload/kaggle-arc-agi-3) with <= 3KB per-episode action receipts and 3-state SOLVED/FAILED/UNGRADED discipline.",
    license: "CC0-1.0",
  },
  {
    id: "arc-prize-2026-paper-rtr-001",
    platform: "Kaggle",
    title: "ARC Prize 2026 Paper Track — Rating the Raters #001",
    href: "https://www.kaggle.com/competitions/arc-prize-2026-arc-agi-3",
    axis: "GSPC-MATH + GSPC-CONSISTENCY",
    role: "Paired-arm answer-match vs human-reference rule-match methodology (RTR-A1, scripts/rating_the_raters_001_arc.py + scripts/build_arc_paired_arm.py).",
    license: "CC0-1.0",
  },
  {
    id: "kaggle-benchmarks-community-cells",
    platform: "Kaggle",
    title: "Kaggle Community Benchmarks (7 GSPC Evaluation Cells)",
    href: "https://www.kaggle.com/code/nicktempleman/csoai-gspc-community-benchmark-cells",
    axis: "GSPC-TOOL + GSPC-CONSISTENCY + GSPC-REFUSAL + GSPC-INJECTION",
    role: "7 self-contained @kbench.task cells (tool schema, seed parity, calibration, refusal boundary, prompt injection, code fix, citation honesty).",
    license: "MIT-0",
  },
  {
    id: "kaggle-dataset-csoai-gspc-board",
    platform: "Kaggle",
    title: "CSOAI-GSPC 23-Axis Signed Dataset Mirror",
    href: "https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-board",
    axis: "ALL-23-AXES",
    role: "Signed 23-axis GSPC board & Merkle root mirror on Kaggle Datasets. Cite GET /api/gspc.",
    license: "CC0-1.0",
  },
  {
    id: "hf-open-llm-eval-bridge",
    platform: "Hugging Face",
    title: "Hugging Face Hub 118-Model Third-Party Cohort Bridge",
    href: "https://huggingface.co/datasets/csoai/gspc-hub-cards",
    axis: "ALL-23-AXES",
    role: "Third-party open-weights cohort evaluated on GSPC axes and published to csoai/gspc-hub-cards (separate from Council fleet).",
    license: "CC0-1.0",
  },
];

