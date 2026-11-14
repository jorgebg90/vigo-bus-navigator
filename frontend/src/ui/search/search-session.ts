export type SearchCategory = 'all' | 'stops' | 'lines' | 'addresses';

/** In-memory only: never written to localStorage, URLs, logs or caches. */
export interface SearchSession {
  query: string;
  category: SearchCategory;
}

export function createSearchSession(): SearchSession {
  return { query: '', category: 'all' };
}
