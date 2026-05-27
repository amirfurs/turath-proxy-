import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { turathGet } from "../turath/client.js";
import { normalizeArabic } from "../turath/normalize.js";
import { extractSearchItems, normalizeSearchItem } from "../turath/search-utils.js";

const qSchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10)
});

export const booksRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/books/search", async (req, reply) => {
    const parsed = qSchema.safeParse(req.query);
    if (!parsed.success) return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
    const { q, limit } = parsed.data;
    const res = await turathGet("/search", { q });
    const items = extractSearchItems(res);
    const grouped = new Map<number, { book_id: number; book_name: string; author_id: number | null; author_name: string; score: number }>();
    const qn = normalizeArabic(q);
    for (const raw of items) {
      const item = normalizeSearchItem(raw);
      if (!item.book_id || !item.book_name) continue;
      const bn = normalizeArabic(item.book_name);
      const score =
        bn === qn ? 1 : bn.includes(qn) ? 0.95 : qn.split(" ").filter(Boolean).filter((t) => bn.includes(t)).length / Math.max(1, qn.split(" ").length);
      const prev = grouped.get(item.book_id);
      if (!prev || score > prev.score) {
        grouped.set(item.book_id, {
          book_id: item.book_id,
          book_name: item.book_name,
          author_id: item.author_id,
          author_name: item.author_name ?? "",
          score: Number(score.toFixed(3))
        });
      }
    }
    const results = [...grouped.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => ({ ...r, matched_from: "search_meta" as const }));
    return { query: q, results };
  });
};
