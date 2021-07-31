import { Ban } from "./ban.ts";
import { Cache } from "./cache.ts";
import { Context, CustomResponse } from "./context.ts";
import { Session } from "./session.ts";

export interface AppOptions {
  port?: number;
  host?: string;
}

export type HandlerFunc = (
  context: Context
) =>
  | CustomResponse
  | void
  | Record<string, unknown>
  | Promise<CustomResponse>
  | Promise<void>
  | Promise<Record<string, unknown>>;

export class App {
  #port: number;
  #host: string;
  #routes: Map<string, Map<string, HandlerFunc>> = new Map();
  #decoder = new TextDecoder("utf-8");
  #mimeTypes: { "-extension": string; "-type": string }[] = [];
  #notFoundHandler = (context: Context): CustomResponse => {
    return context.response.redirect("/");
  };
  #publicHandler = (ctx: Context): CustomResponse => {
    try {
      const mimeType =
        this.#mimeTypes.find(
          (type) =>
            type["-extension"] ===
            ctx.url.pathname.substring(ctx.url.pathname.lastIndexOf("."))
        )?.["-type"] || "application/octet-stream";
      return ctx.response
        .body(Deno.readFileSync(`${Deno.cwd()}/public${ctx.url.pathname}`))
        .header("content-type", mimeType)
        .status(200);
    } catch (_) {
      return this.#notFoundHandler(ctx);
    }
  };

  constructor(options: AppOptions | undefined = {}) {
    this.#port = options.port || 8080;
    this.#host = options.host || "0.0.0.0";
    Cache.load();
    Deno.readTextFile(Deno.cwd() + "/mimetypes.json").then((data) => {
      this.#mimeTypes = JSON.parse(data);
    });
    Ban.cleanup();
    Session.cleanup();
    setInterval(() => {
      Ban.cleanup();
      Session.cleanup();
    }, 30000);
  }

  #normalizeUrl(path: string) {
    if (path.charAt(0) !== "/") path = "/" + path;
    if (path.endsWith("/")) path.substring(0, path.length - 2);
    return path.replaceAll(/\/{2,}/gim, "/").toLowerCase();
  }

  #add(method: string, path: string, handler: HandlerFunc) {
    path = this.#normalizeUrl(path);
    const router = this.#routes.get(path) || new Map();
    router.set(method.toLowerCase(), handler);
    this.#routes.set(path, router);
  }

  public all(path: string, handler: HandlerFunc): App {
    for (const method of [
      "GET",
      "POST",
      "OPTIONS",
      "HEAD",
      "DELETE",
      "PUT",
      "PATCH",
      "TRACE",
    ]) {
      this.#add(method, path, handler);
    }

    return this;
  }

  public get(path: string, handler: HandlerFunc): App {
    this.#add("GET", path, handler);
    return this;
  }

  public post(path: string, handler: HandlerFunc): App {
    this.#add("POST", path, handler);
    return this;
  }

  async #serveClient(
    requestEvent: Deno.RequestEvent,
    connection: Deno.Conn
  ): Promise<void> {
    const context = new Context(requestEvent);
    context.ip =
      context.request.headers.get("X-Forwarded-For") ||
      (connection.remoteAddr as Deno.NetAddr).hostname;
    const path = this.#normalizeUrl(new URL(requestEvent.request.url).pathname);
    const method = requestEvent.request.method.toLowerCase();
    const router = this.#routes.get(path) || new Map();
    const handler = router.get(method) || this.#publicHandler;
    try {
      const result = await handler(context);
      if (result instanceof CustomResponse || !result)
        return await context.response.send();
      return await context.response
        .body(JSON.stringify(result))
        .header("content-type", "application/json")
        .status(200)
        .send();
    } catch (err) {
      console.log(err);
      return await context.response
        .status(500)
        .body("<h1>Internal Server error</h1>")
        .header("content-type", "text/html")
        .send();
    }
  }

  public start() {
    Deno.signal(Deno.Signal.SIGINT).then(() => {
      Deno.exit(0);
    });
    const server = Deno.listen({ port: this.#port, hostname: this.#host });
    (async () => {
      try {
        for await (const client of server) {
          (async () => {
            try {
              const httpConn = Deno.serveHttp(client);
              for await (const requestEvent of httpConn) {
                await this.#serveClient(requestEvent, client);
              }
            } catch (_) {
              // ignored
            }
          })();
        }
      } catch (_) {
        // ignore
      }
    })();
  }
}
