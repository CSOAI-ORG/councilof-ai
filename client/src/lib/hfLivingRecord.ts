/**
 * Hugging Face is the signing record. The living board is GET /api/gspc.
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
  "The living board is GET /api/gspc. Hugging Face holds the signed record. A Hub repo is not a grade.";

export const HF_PLANTED: HfPlanted[] = [
  {
    id: "gspc-board",
    href: "https://huggingface.co/datasets/csoai/gspc-board",
    role: "Living board mirror. Cite GET /api/gspc.",
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
    role: "Public findings desk. Ontology, tape, published record. Queue is DISCOVERED, not a completed Hub census. Compact cards verify; Card v2 lineage binding is next. Same GET /api/gspc.",
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
