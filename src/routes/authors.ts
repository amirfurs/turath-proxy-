import { z } from "zod";
import type { FastifyInstance } from "fastify";
import { turathGet } from "../turath/client.js";

const paramsSchema = z.object({ author_id: z.coerce.number().int().positive() });

export const authorsRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/authors/:author_id", async (req, reply) => {
    const parsed = paramsSchema.safeParse(req.params);
    if (!parsed.success) return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message: parsed.error.message } });
    const data = await turathGet("/author", { id: parsed.data.author_id });
    if (!data) return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Author not found" } });
    return data;
  });
};
