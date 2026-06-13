/**
 * SERVER PROXY — the only place the scoped Florence Tools key lives.
 *
 * The browser only ever calls relative /api/florence/* paths (no key). This
 * catch-all adds the X-Florence-Tools-Key header server-side and forwards to
 * the real Florence Tools API. GET + POST + OPTIONS.
 *
 * Both `…/v1/<path>` and `…/v1/api/<path>` resolve upstream, so a client
 * fetch-shim that prefixes `/api/` works either way.
 */
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BASE = "https://askflorence.health/api/florence-tools/v1";
const KEY = process.env.FLORENCE_TOOLS_API_KEY ?? "";

async function forward(
  method: "GET" | "POST",
  slug: string[],
  req: NextRequest,
) {
  if (!KEY) {
    return Response.json(
      { error: "server_misconfigured", detail: "FLORENCE_TOOLS_API_KEY not set" },
      { status: 500 },
    );
  }
  const qs = new URL(req.url).search;
  const url = `${BASE}/${slug.join("/")}${qs}`;
  const body = method === "POST" ? await req.text() : undefined;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "X-Florence-Tools-Key": KEY,
        "Content-Type": "application/json",
      },
      body,
      cache: "no-store",
    });
    const text = await res.text();
    return new Response(text, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return Response.json(
      { error: "upstream_unreachable", detail: String(err) },
      { status: 502 },
    );
  }
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await ctx.params;
  return forward("GET", slug, req);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await ctx.params;
  return forward("POST", slug, req);
}

export function OPTIONS() {
  return new Response(null, { status: 204 });
}
