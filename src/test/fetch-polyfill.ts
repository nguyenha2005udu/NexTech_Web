// jsdom không có Headers/Request/Response; RTK Query (fetchBaseQuery) cần cả ba. Bản tối thiểu đủ cho test
// component gọi `/api/...` với `global.fetch` được mock (không phải bản triển khai đầy đủ của Fetch API).
type HeadersInit = Record<string, string> | [string, string][] | HeadersPoly;

class HeadersPoly {
  private map = new Map<string, string>();
  constructor(init?: HeadersInit) {
    if (init instanceof HeadersPoly) init.forEach((v, k) => this.set(k, v));
    else if (Array.isArray(init)) init.forEach(([k, v]) => this.set(k, v));
    else if (init) Object.entries(init).forEach(([k, v]) => this.set(k, v));
  }
  get(name: string) {
    return this.map.get(name.toLowerCase()) ?? null;
  }
  set(name: string, value: string) {
    this.map.set(name.toLowerCase(), String(value));
  }
  has(name: string) {
    return this.map.has(name.toLowerCase());
  }
  delete(name: string) {
    this.map.delete(name.toLowerCase());
  }
  forEach(cb: (value: string, key: string) => void) {
    this.map.forEach((v, k) => cb(v, k));
  }
  entries() {
    return this.map.entries();
  }
  [Symbol.iterator]() {
    return this.map.entries();
  }
}

class ResponsePoly {
  readonly status: number;
  readonly ok: boolean;
  readonly headers: HeadersPoly;
  private readonly text_: string;
  constructor(body?: string | null, init: { status?: number; headers?: HeadersInit } = {}) {
    this.text_ = body ?? "";
    this.status = init.status ?? 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new HeadersPoly(init.headers);
  }
  clone() {
    return new ResponsePoly(this.text_, { status: this.status, headers: this.headers });
  }
  async text() {
    return this.text_;
  }
  async json(): Promise<unknown> {
    return JSON.parse(this.text_);
  }
}

class RequestPoly {
  readonly url: string;
  readonly method: string;
  readonly headers: HeadersPoly;
  readonly body: string | null;
  readonly signal: AbortSignal | null;
  constructor(input: string | RequestPoly, init: { method?: string; headers?: HeadersInit; body?: unknown; signal?: AbortSignal | null } = {}) {
    this.url = typeof input === "string" ? input : input.url;
    this.method = (init.method ?? "GET").toUpperCase();
    this.headers = new HeadersPoly(init.headers);
    this.body = init.body == null ? null : String(init.body);
    this.signal = init.signal ?? null;
  }
  clone() {
    return new RequestPoly(this.url, { method: this.method, headers: this.headers, body: this.body, signal: this.signal });
  }
  async text() {
    return this.body ?? "";
  }
  async json(): Promise<unknown> {
    return JSON.parse(this.body ?? "");
  }
}

export function installFetchPolyfill(): void {
  const g = globalThis as Record<string, unknown>;
  if (typeof g.Headers === "undefined") g.Headers = HeadersPoly;
  if (typeof g.Request === "undefined") g.Request = RequestPoly;
  if (typeof g.Response === "undefined") g.Response = ResponsePoly;
}
