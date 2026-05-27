import { normalizeArabic, toSafeText } from "./normalize.js";
import type { AnyObj, NormalizedSearchResult, TurathSearchRawItem } from "./types.js";

export const parseMeta = (meta: unknown): AnyObj | null => {
  if (meta && typeof meta === "object") return meta as AnyObj;
  if (typeof meta !== "string") return null;
  try {
    const parsed = JSON.parse(meta);
    return parsed && typeof parsed === "object" ? (parsed as AnyObj) : null;
  } catch {
    return null;
  }
};

const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

export const normalizeSearchItem = (item: TurathSearchRawItem): NormalizedSearchResult => {
  const meta = parseMeta(item.meta);
  const bookId = num(item.book_id) ?? num(meta?.book_id);
  const authorId = num(item.author_id) ?? num(meta?.author_id);
  const page = num(item.page) ?? num(meta?.page);
  const pageId = num(item.page_id) ?? num(meta?.page_id);
  const bookName = toSafeText(meta?.book_name);
  const authorName = toSafeText(meta?.author_name);
  const vol = toSafeText(meta?.vol);
  const headings = Array.isArray(meta?.headings) ? meta.headings.map((h) => toSafeText(h)).filter(Boolean) : [];
  return {
    book_id: bookId,
    author_id: authorId,
    book_name: bookName || null,
    author_name: authorName || null,
    page,
    page_id: pageId,
    vol: vol || null,
    headings,
    snip: toSafeText(item.snip),
    text: toSafeText(item.text)
  };
};

export const dedupeSearchResults = (items: NormalizedSearchResult[]): NormalizedSearchResult[] => {
  const byKey = new Map<string, NormalizedSearchResult>();
  for (const item of items) {
    const keyBase = item.book_id ?? -1;
    const keyPage = item.page_id ?? item.page ?? -1;
    const key = `${keyBase}:${keyPage}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    if (item.snip && item.snip !== existing.snip) existing.snip = [existing.snip, item.snip].filter(Boolean).join("\n");
    if (item.text && item.text !== existing.text) existing.text = [existing.text, item.text].filter(Boolean).join("\n");
  }
  const textDedup = new Set<string>();
  return [...byKey.values()].filter((it) => {
    const key = normalizeArabic(it.text || it.snip || "");
    if (!key) return true;
    if (textDedup.has(key)) return false;
    textDedup.add(key);
    return true;
  });
};

export const extractSearchItems = (payload: unknown): TurathSearchRawItem[] => {
  if (Array.isArray(payload)) return payload as TurathSearchRawItem[];
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  if (Array.isArray(obj.results)) return obj.results as TurathSearchRawItem[];
  if (Array.isArray(obj.data)) return obj.data as TurathSearchRawItem[];
  return [];
};

export const extractSearchCount = (payload: unknown, fallback: number): number => {
  if (!payload || typeof payload !== "object") return fallback;
  const obj = payload as Record<string, unknown>;
  return typeof obj.count === "number" ? obj.count : fallback;
};
