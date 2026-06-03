import { Hono } from "hono"
import { z } from "zod"
import { zValidator } from "@hono/zod-validator"

const app = new Hono().basePath("/urls")

const UrlSchema = z.object({
  url: z.url()
})

app.post("/", zValidator("json", UrlSchema), (c) => {
  return c.json({ success: true, url: c.req.valid("json").url })
})

export default app