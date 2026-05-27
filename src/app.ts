import Fastify, { type FastifyInstance } from "fastify";
import { authorsRoutes } from "./routes/authors.js";
import { booksRoutes } from "./routes/books.js";
import { healthRoutes } from "./routes/health.js";
import { indexRoutes } from "./routes/index.js";
import { pagesRoutes } from "./routes/pages.js";
import { searchRoutes } from "./routes/search.js";
import { UpstreamError } from "./turath/client.js";

export const buildApp = (): FastifyInstance => {
  const app = Fastify({ logger: true });

  app.addHook("onRequest", (req, _reply, done) => {
    req.raw.url = req.raw.url?.replace(/^\/{2,}/, "/") ?? req.raw.url;
    done();
  });

  app.register(healthRoutes);
  app.register(booksRoutes);
  app.register(searchRoutes);
  app.register(pagesRoutes);
  app.register(indexRoutes);
  app.register(authorsRoutes);

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof UpstreamError) {
      const status = err.statusCode === 504 ? 504 : err.statusCode >= 500 ? 502 : err.statusCode;
      return reply.status(status).send({
        error: {
          code: status === 504 ? "TURATH_TIMEOUT" : "TURATH_UPSTREAM_ERROR",
          message: err.message
        }
      });
    }
    if (typeof err === "object" && err !== null && "validation" in err) {
      const message = "message" in err && typeof err.message === "string" ? err.message : "Validation error";
      return reply.status(400).send({ error: { code: "VALIDATION_ERROR", message } });
    }
    return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "Unexpected error" } });
  });

  return app;
};
