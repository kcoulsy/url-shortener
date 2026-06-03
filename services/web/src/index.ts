import { createServer } from "node:http"
import { Readable } from "node:stream"
import { Hono } from "hono"
import urls from "./urls/routes.js"

const app = new Hono()

app.get("/", (c) => {
  return c.text("Hello Hono!")
})

app.get("/health", (c) => {
  return c.json({ ok: true })
})

app.route("/", urls)

const port = Number(process.env.PORT ?? 3000)

createServer(async (incoming, outgoing) => {
  try {
    const host = incoming.headers.host ?? `localhost:${port}`
    const url = new URL(incoming.url ?? "/", `http://${host}`)
    const headers = new Headers()

    for (const [key, value] of Object.entries(incoming.headers)) {
      if (Array.isArray(value)) {
        for (const item of value) headers.append(key, item)
      } else if (value !== undefined) {
        headers.set(key, value)
      }
    }

    const hasBody = incoming.method !== "GET" && incoming.method !== "HEAD"
    const init: RequestInit & { duplex?: "half" } = {
      method: incoming.method,
      headers,
      body: hasBody ? (Readable.toWeb(incoming) as ReadableStream) : undefined,
      duplex: hasBody ? "half" : undefined,
    }

    const response = await app.fetch(new Request(url, init))

    outgoing.statusCode = response.status
    response.headers.forEach((value, key) => outgoing.setHeader(key, value))

    if (incoming.method === "HEAD" || !response.body) {
      outgoing.end()
      return
    }

    Readable.fromWeb(response.body as import("node:stream/web").ReadableStream).pipe(outgoing)
  } catch (error) {
    console.error(error)
    outgoing.statusCode = 500
    outgoing.end("Internal Server Error")
  }
}).listen(port, () => {
  console.log(`Web service listening on http://localhost:${port}`)
})
