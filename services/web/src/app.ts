import { Hono } from "hono";
import urls from "./routes/urls.js";

export const app = new Hono();

app.get("/health", (c) => {
  return c.json({ ok: true });
});

app.route("/", urls);
