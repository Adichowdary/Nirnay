import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock NextResponse & NextRequest for API route tests
vi.mock("next/server", () => {
  class MockNextRequest extends Request {
    nextUrl: URL;
    cookies: {
      get: (name: string) => { value: string } | undefined;
      getAll: () => { name: string; value: string }[];
    };

    constructor(input: RequestInfo | URL, init?: RequestInit) {
      super(input, init);
      const urlStr = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      this.nextUrl = new URL(urlStr);

      const cookieHeader = this.headers.get("cookie") || "";
      const cookieMap = new Map<string, string>();
      cookieHeader.split(";").forEach((pair) => {
        const [k, v] = pair.trim().split("=");
        if (k && v) cookieMap.set(k, decodeURIComponent(v));
      });

      this.cookies = {
        get: (name: string) => {
          const val = cookieMap.get(name);
          return val ? { value: val } : undefined;
        },
        getAll: () => Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value })),
      };
    }
  }

  return {
    NextRequest: MockNextRequest,
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => {
        return new Response(JSON.stringify(data), {
          status: init?.status ?? 200,
          headers: { "Content-Type": "application/json", ...init?.headers },
        });
      },
      next: () => new Response(null, { status: 200 }),
      redirect: (url: string | URL) => {
        const dest = typeof url === "string" ? url : url.toString();
        return new Response(null, { status: 307, headers: { Location: dest } });
      },
    },
  };
});

// Mock Supabase client
vi.mock("@/lib/db", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: null, error: null }),
  }),
}));

// Mock crypto.subtle for geofence tests
Object.defineProperty(globalThis, "crypto", {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32])),
    },
  },
});
