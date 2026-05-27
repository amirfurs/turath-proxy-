import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { turathGet } from "../turath/client.js";
import { parseMeta } from "../turath/search-utils.js";

const paramsSchema = z.object({
  book_id: z.coerce.number().int().positive(),
  page: z.coerce.number().int().positive()
});

export const pagesRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/books/:book_id/pages/:page", async (req, reply) => {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
    const { book_id, page } = parsed.data;
    const data = await turathGet("/page", { book_id, pg: page });
    if (!data) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Page not found" } });
    const parsedMeta = parseMeta(data.meta);
    return {
      book_id,
      page,
      ...(parsedMeta ? { meta: parsedMeta } : { meta_raw: data.meta }),
      text: typeof data.text === "string" ? data.text : ""
    };
  });
};
