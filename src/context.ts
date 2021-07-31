import { Data, parseTemplate } from "./template.ts";
import { User } from "./user.ts";

export interface CookieOptions {
  httpOnly?: boolean;
  expires?: Date;
  sameSite?: "Strict" | "Lax" | "None";
  path?: string;
  maxAge?: number;
  domain?: string;
  secure?: boolean;
}

export class CustomResponse {
  #responseWith: (r: Response | Promise<Response>) => Promise<void>;
  #headers: [string, string][] = [];
  #body: BodyInit = "";
  #status = 200;

  constructor(
    responseWith: (r: Response | Promise<Response>) => Promise<void>
  ) {
    this.#responseWith = responseWith;
  }

  public cookie(
    key: string,
    value: string,
    options: CookieOptions = {}
  ): CustomResponse {
    let cookie = `${key}=${encodeURIComponent(value)}; `;
    if (options.expires) cookie += `Expires=${options.expires.toUTCString()}; `;
    if (options.maxAge) cookie += `Max-Age=${options.maxAge}; `;
    if (options.domain)
      cookie += `Domain=${encodeURIComponent(options.domain)}; `;
    if (options.path) cookie += `Path=${encodeURIComponent(options.path)}; `;
    if (options.secure) cookie += `Secure; `;
    if (options.httpOnly) cookie += `HttpOnly; `;
    if (options.sameSite)
      cookie += `SameSite=${encodeURIComponent(options.sameSite)}; `;
    this.#headers.push(["Set-Cookie", cookie]);
    return this;
  }

  public status(status: number): CustomResponse {
    this.#status = status;
    return this;
  }

  public body(data: BodyInit): CustomResponse {
    this.#headers.push(["content-type", "application/json"]);
    this.#body = data;
    return this;
  }

  public render(
    template: string,
    data?: Data
  ): CustomResponse {
    this.#headers.push(["content-type", "text/html"]);
    this.#body = parseTemplate(template, data);
    return this.status(200);
  }

  public redirect(location: string): CustomResponse {
    this.#status = 302;
    this.#headers.push(["Location", decodeURIComponent(location)]);
    return this;
  }

  public header(key: string, value: string): CustomResponse {
    this.#headers.push([key, value]);
    return this;
  }

  public async send(): Promise<void> {
    await this.#responseWith(
      new Response(this.#body, {
        status: this.#status,
        headers: this.#headers,
      })
    );
  }
}

export class Context {
  #requestEvent: Deno.RequestEvent;
  #response: CustomResponse;
  #url: URL;
  #cookies: Map<string, string> = new Map();
  #user: User | undefined = undefined;
  #ip = "::1";

  constructor(requestEvent: Deno.RequestEvent) {
    this.#requestEvent = requestEvent;
    this.#response = new CustomResponse(this.#requestEvent.respondWith);
    this.#url = new URL(requestEvent.request.url);
    for (const cookie of (this.#requestEvent.request.headers.get("Cookie") || "").split("; ")) {
      this.#cookies.set(cookie.split("=")[0], decodeURIComponent(cookie.split("=")[1]));
    }
  }

  public get request(): Request {
    return this.#requestEvent.request;
  }

  public get response(): CustomResponse {
    return this.#response;
  }

  public get url(): URL {
    return this.#url;
  }

  public get cookies(): Map<string, string> {
    return this.#cookies;
  }

  public get user(): User | undefined {
    return this.#user;
  }

  public set user(user: User | undefined) {
    this.#user = user;
  }

  public get ip(): string {
    return this.#ip;
  }

  public set ip(ip: string) {
    this.#ip = ip;
  }
}
