export interface DataCatalogEntry {
  name: string;
  url: string;
  urlText?: string;
  format?: string;
  license?: string;
  apiKey?: string;
  keyData?: string;
  region?: string;
  datasets?: string;
  category: string;
  categoryUse: string;
  [key: string]: string | undefined;
}

export interface DataCatalog {
  generatedAt: string;
  source: string;
  count: number;
  categories: string[];
  entries: DataCatalogEntry[];
}

export interface HiveDefinition {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categoryMatches: string[];
  useCase: string;
  color: string;
}
