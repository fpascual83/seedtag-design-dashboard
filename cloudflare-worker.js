/**
 * Cloudflare Worker — CORS proxy for Atlassian Jira Cloud
 *
 * Purpose: forward browser requests from the SDS Service Dashboard
 * (hosted on github.io) to seedtag.atlassian.net, adding the CORS
 * headers Atlassian doesn't send.
 *
 * Deploy:
 *   1. Cloudflare dashboard → Workers & Pages → Create → Hello World
 *   2. Replace the default code with this file
 *   3. Save and Deploy
 *   4. Copy the worker URL (e.g. https://sds-jira-proxy.<your-subdomain>.workers.dev)
 *   5. Paste it as CONFIG.JIRA_BASE in index.html
 */

const JIRA_HOST = "https://seedtag.atlassian.net";

// Optional: lock the proxy to your dashboard origin so it can't be abused
// by any random page on the internet. Comment out to allow any origin.
const ALLOWED_ORIGINS = new Set([
  "https://fpascual83.github.io",
  "http://localhost:5173",
  "http://localhost:8000",
]);

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://fpascual83.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(origin) });
    }

    // Health check
    if (url.pathname === "/" || url.pathname === "") {
      return new Response("SDS Jira proxy: OK", {
        status: 200,
        headers: { "Content-Type": "text/plain", ...corsHeaders(origin) },
      });
    }

    // Forward everything else to Atlassian under the same path/query
    const target = JIRA_HOST + url.pathname + url.search;

    const init = {
      method: request.method,
      headers: {
        "Authorization": request.headers.get("Authorization") || "",
        "Accept": request.headers.get("Accept") || "application/json",
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        "User-Agent": "SDS-Service-Dashboard/1.0",
      },
    };
    if (!["GET", "HEAD"].includes(request.method)) {
      init.body = await request.text();
    }

    let upstream;
    try {
      upstream = await fetch(target, init);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Upstream fetch failed", detail: String(e) }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders(origin) } }
      );
    }

    const newHeaders = new Headers(upstream.headers);
    for (const [k, v] of Object.entries(corsHeaders(origin))) {
      newHeaders.set(k, v);
    }
    // Strip any cookie/auth that shouldn't bleed back to the browser
    newHeaders.delete("Set-Cookie");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: newHeaders,
    });
  },
};
