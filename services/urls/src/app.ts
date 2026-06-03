import { Hono } from "hono";
import { requestLogger } from "./middleware/request-logger.js";
import urls from "./routes/urls.js";

export const app = new Hono();

app.use(requestLogger);

app.get("/health", (c) => {
  return c.json({ ok: true });
});

app.route("/", urls);
