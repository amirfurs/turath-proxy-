import { normalizeArabic } from "./normalize.js";
import type { HeadingItem } from "./types.js";

export const buildBreadcrumbs = (headings: HeadingItem[]): HeadingItem[] => {
  const trail: string[] = [];
  return headings.map((h) => {
    const level = Math.max(1, h.level || 1);
    trail.length = level - 1;
    trail[level - 1] = h.title;
    return { ...h, level, breadcrumb: trail.filter(Boolean) };
  });
};

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

export const scoreIndexMatch = (query: string, heading: HeadingItem): number => {
  const q = normalizeArabic(query);
  const t = normalizeArabic(heading.title);
  const b = normalizeArabic((heading.breadcrumb ?? []).join(" "));
  if (!q || !t) return 0;
  if (t === q) return 1;
  let score = 0;
  if (t.includes(q)) score = 0.88;
  const qTokens = q.split(" ").filter(Boolean);
  if (qTokens.length > 0) {
    const hits = qTokens.filter((tok) => t.includes(tok)).length;
    score = Math.max(score, (hits / qTokens.length) * 0.8);
  }
  if (b.includes(q)) score = Math.max(score, 0.75);
  if (Math.abs(t.length - q.length) <= 2 && t[0] === q[0]) score = Math.max(score, 0.65);
  return clamp(Number(score.toFixed(3)), 0, 1);
};

export const takeIndexChunk = (items: HeadingItem[], offset: number, limit: number, maxLevel?: number): HeadingItem[] =>
  items
    .filter((h) => (maxLevel ? h.level <= maxLevel : true))
    .slice(offset, offset + limit);

export const buildIndexWindow = (
  items: HeadingItem[],
  page: number,
  before = 5,
  after = 5
): { current: HeadingItem | null; before: HeadingItem[]; after: HeadingItem[] } => {
  const ordered = [...items].sort((a, b) => a.page - b.page);
  let idx = -1;
  for (let i = 0; i < ordered.length; i += 1) if (ordered[i].page <= page) idx = i;
  const current = idx >= 0 ? ordered[idx] : null;
  return {
    current,
    before: idx > 0 ? ordered.slice(Math.max(0, idx - before), idx) : [],
    after: idx >= 0 ? ordered.slice(idx + 1, idx + 1 + after) : ordered.slice(0, after)
  };
};
