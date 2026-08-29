import { SEARCH_INDEX_A, type SearchResult, type SearchCategory } from './globalSearchIndexA';
import { SEARCH_INDEX_B } from './globalSearchIndexB';
import { SEARCH_INDEX_C } from './globalSearchIndexC';

export type { SearchResult, SearchCategory };
export const SEARCH_INDEX: SearchResult[] = [...SEARCH_INDEX_A, ...SEARCH_INDEX_B, ...SEARCH_INDEX_C];
