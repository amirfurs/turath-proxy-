import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { turathGet } from "../turath/client.js";
import { dedupeSearchResults, normalizeSearchItem } from "../turath/search-utils.js";

const qSchema = z.object({
  q: z.string().min(1),
  book_id: z.coerce.number().int().positive().optional(),
  author_id: z.coerce.number().int().positive().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.string().optional()
});

export const searchRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/search/text", async (req, reply) => {
    const parsed = qSchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
    const { q, book_id, author_id, page, limit, sort } = parsed.data;
    const data = await turathGet("/search", { q, book: book_id, author: author_id, page, sort });
    const rawItems = Array.isArray(data?.results) ? data.results : [];
    const clean = dedupeSearchResults(rawItems.map(normalizeSearchItem)).slice(0, limit);
    return {
      query: q,
      page,
      count: typeof data?.count === "number" ? data.count : clean.length,
      results: clean
    };
  });
};
