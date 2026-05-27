export type AnyObj = Record<string, unknown>;

export type TurathSearchRawItem = {
  id?: number;
  page?: number;
  page_id?: number;
  book_id?: number;
  author_id?: number;
  snip?: string;
  text?: string;
  meta?: string | AnyObj;
};

export type TurathSearchResponse = {
  count?: number;
  results?: TurathSearchRawItem[];
};

export type HeadingItem = {
  title: string;
  page: number;
  level: number;
  breadcrumb?: string[];
  [k: string]: unknown;
};

export type CachedBookIndex = {
  bookId: number;
  fetchedAt: number;
  meta: AnyObj | null;
  headings: HeadingItem[];
  volumes: unknown;
  pageMap: unknown;
  pageHeadings: unknown;
  printPgToPg: unknown;
  volumeBounds: unknown;
};

export type NormalizedSearchResult = {
  book_id: number | null;
  author_id: number | null;
  book_name: string | null;
  author_name: string | null;
  page: number | null;
  page_id: number | null;
  vol: string | null;
  headings: string[];
  snip: string;
  text: string;
};
