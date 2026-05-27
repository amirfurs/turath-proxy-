import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { getBookIndex } from "../turath/index-cache.js";
import { buildIndexWindow, scoreIndexMatch, takeIndexChunk } from "../turath/index-utils.js";

const paramsSchema = z.object({ book_id: z.coerce.number().int().positive() });
const topQuery = z.object({
  max_level: z.coerce.number().int().min(1).max(10).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});
const searchQuery = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  max_level: z.coerce.number().int().min(1).max(10).optional()
});
const chunkQuery = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  max_level: z.coerce.number().int().min(1).max(10).optional()
});
const windowQuery = z.object({
  page: z.coerce.number().int().positive(),
  before: z.coerce.number().int().min(0).max(30).default(5),
  after: z.coerce.number().int().min(0).max(30).default(5)
});

export const indexRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/books/:book_id/index/top", async (req, reply) => {
    const p = paramsSchema.safeParse(req.params);
    const q = topQuery.safeParse(req.query);
    if (!p.success || !q.success) return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: "Invalid params" } });
    const index = await getBookIndex(p.data.book_id);
    const results = takeIndexChunk(index.headings, 0, q.data.limit, q.data.max_level);
    return { book_id: p.data.book_id, max_level: q.data.max_level, results };
  });

  app.get("/books/:book_id/index/search", async (req, reply) => {
    const p = paramsSchema.safeParse(req.params);
    const q = searchQuery.safeParse(req.query);
    if (!p.success || !q.success) return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: "Invalid params" } });
    const index = await getBookIndex(p.data.book_id);
    const filtered = index.headings.filter((h) => (q.data.max_level ? h.level <= q.data.max_level : true));
    const results = filtered
      .map((h) => ({ ...h, score: scoreIndexMatch(q.data.q, h) }))
      .filter((h) => h.score > 0.35)
      .sort((a, b) => b.score - a.score)
      .slice(0, q.data.limit);
    return { book_id: p.data.book_id, query: q.data.q, results };
  });

  app.get("/books/:book_id/index/chunk", async (req, reply) => {
    const p = paramsSchema.safeParse(req.params);
    const q = chunkQuery.safeParse(req.query);
    if (!p.success || !q.success) return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: "Invalid params" } });
    const index = await getBookIndex(p.data.book_id);
    const scope = index.headings.filter((h) => (q.data.max_level ? h.level <= q.data.max_level : true));
    const results = scope.slice(q.data.offset, q.data.offset + q.data.limit);
    const nextOffset = q.data.offset + results.length;
    return {
      book_id: p.data.book_id,
      offset: q.data.offset,
      limit: q.data.limit,
      has_more: nextOffset < scope.length,
      next_offset: nextOffset < scope.length ? nextOffset : null,
      results
    };
  });

  app.get("/books/:book_id/index/window", async (req, reply) => {
    const p = paramsSchema.safeParse(req.params);
    const q = windowQuery.safeParse(req.query);
    if (!p.success || !q.success) return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: "Invalid params" } });
    const index = await getBookIndex(p.data.book_id);
    const window = buildIndexWindow(index.headings, q.data.page, q.data.before, q.data.after);
    return { book_id: p.data.book_id, page: q.data.page, ...window };
  });
};
