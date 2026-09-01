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
