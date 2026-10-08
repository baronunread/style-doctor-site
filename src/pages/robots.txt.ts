import type { APIRoute } from "astro";
export const GET: APIRoute = ({ site }) => {
  if (!site) throw new Error("Canonical site URL is missing.");
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${new URL("/sitemap.xml", site).href}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
