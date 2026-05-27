import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { config } from "../config.js";
import { turathGet } from "./client.js";
import { buildBreadcrumbs } from "./index-utils.js";
import type { CachedBookIndex, HeadingItem } from "./types.js";

const memoryCache = new Map<number, CachedBookIndex>();

const isFresh = (fetchedAt: number): boolean => Date.now() - fetchedAt <= config.indexCacheTtlMs;

const filePath = (bookId: number): string => join(process.cwd(), config.cacheDir, `book-${bookId}.json`);

const readFileCache = async (bookId: number): Promise<CachedBookIndex | null> => {
  if (!config.enableFileCache) return null;
  try {
    const raw = await readFile(filePath(bookId), "utf8");
    const parsed = JSON.parse(raw) as CachedBookIndex;
    return isFresh(parsed.fetchedAt) ? parsed : null;
  } catch {
    return null;
  }
};

const saveFileCache = async (bookId: number, value: CachedBookIndex): Promise<void> => {
  if (!config.enableFileCache) return;
  const dir = join(process.cwd(), config.cacheDir);
  await mkdir(dir, { recursive: true });
  await writeFile(filePath(bookId), JSON.stringify(value), "utf8");
};

const asHeadings = (raw: unknown): HeadingItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => {
      const item = h as Record<string, unknown>;
      const title = typeof item.title === "string" ? item.title : "";
      const page = typeof item.page === "number" ? item.page : Number(item.page ?? 0);
      const level = typeof item.level === "number" ? item.level : Number(item.level ?? 1);
      if (!title || !Number.isFinite(page)) return null;
      return { title, page, level };
    })
    .filter((x): x is HeadingItem => x !== null);
};

export const getBookIndex = async (bookId: number): Promise<CachedBookIndex> => {
  const mem = memoryCache.get(bookId);
  if (mem && isFresh(mem.fetchedAt)) return mem;
  const disk = await readFileCache(bookId);
  if (disk) {
    memoryCache.set(bookId, disk);
    return disk;
  }
  const book = await turathGet("/book", { id: bookId, include: "indexes" });
  const indexes = (book?.indexes ?? {}) as Record<string, unknown>;
  const cached: CachedBookIndex = {
    bookId,
    fetchedAt: Date.now(),
    meta: book?.meta && typeof book.meta === "object" ? book.meta : null,
    headings: buildBreadcrumbs(asHeadings(indexes.headings)),
    volumes: indexes.volumes ?? null,
    pageMap: indexes.page_map ?? null,
    pageHeadings: indexes.page_headings ?? null,
    printPgToPg: indexes.print_pg_to_pg ?? null,
    volumeBounds: indexes.volume_bounds ?? null
  };
  memoryCache.set(bookId, cached);
  await saveFileCache(bookId, cached);
  return cached;
};
