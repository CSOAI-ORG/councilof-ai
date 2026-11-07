export type ResearchSourceMetadata = {
  watch?: boolean;
  reviewed_on?: string;
  boundary?: string;
  rights_url?: string;
  version?: string;
  license?: string;
};

export function researchSourceMetadata(source: unknown): ResearchSourceMetadata;
