import { buildApp } from "./app.js";
import { config } from "./config.js";

const app = buildApp();

app
  .listen({ port: config.port, host: config.host })
  .then(() => app.log.info(`Server running at http://${config.host}:${config.port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
