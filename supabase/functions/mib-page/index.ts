// MIB CBT — mib-page: read the text of ONE public web page the member picked as "a page about me".
// Guarded against internal addresses; returns title + main text only. verify_jwt off; JWT checked here.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const URL_ = Deno.env.get("SUPABASE_URL")!;
function secretKey(): string {
  try { const k = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (k && k["default"]) return k["default"]; } catch (_) { /* fall through */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}
const admin = createClient(URL_, secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (code: string, status = 400) => json({ error: code }, status);
class E extends Error { constructor(public code: string) { super(code); } }
const kstDay = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
function asUrl(raw: string): URL | null { let s = String(raw ?? "").trim(); if (!s || /\s/.test(s)) return null; if (!/^https?:\/\//i.test(s)) s = "https://" + s; try { return new URL(s); } catch (_) { return null; } }
// ── guarded fetch for a page the member picked themselves (any public https host) ──
function hostOk(host: string): boolean {
  host = host.toLowerCase();
  if (!host.includes(".") || host.length > 253 || !/^[a-z0-9.-]+$/.test(host) || /^[0-9.]+$/.test(host)) return false;
  if (/(^|\.)(localhost|local|internal|lan|home|corp|intranet|test|invalid|example|onion)$/.test(host)) return false;
  if (/(^|\.)supabase\.(co|com|in|red|net)$/.test(host)) return false;
  return true;
}
function ip4Private(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n))) return true;
  return p[0] === 0 || p[0] === 10 || p[0] === 127 || (p[0] === 100 && p[1] >= 64 && p[1] <= 127) || (p[0] === 169 && p[1] === 254) ||
    (p[0] === 172 && p[1] >= 16 && p[1] <= 31) || (p[0] === 192 && p[1] === 168) || (p[0] === 192 && p[1] === 0) || p[0] >= 224;
}
async function dnsOk(host: string): Promise<boolean> {
  try { if ((await Deno.resolveDns(host, "A")).some(ip4Private)) return false; } catch (_) { /* resolver unavailable */ }
  try { if ((await Deno.resolveDns(host, "AAAA")).some((ip) => /^(::1$|::$|f[cd]|fe[89ab]|::ffff:)/i.test(ip))) return false; } catch (_) { /* same */ }
  return true;
}
async function safePage(raw: string): Promise<{ text: string; url: URL }> {
  let u = asUrl(raw); if (!u) throw new E("link_invalid");
  for (let hop = 0; hop < 4; hop++) {
    if (u.protocol === "http:") u.protocol = "https:";
    if (u.protocol !== "https:" || (u.port && u.port !== "443") || u.username || u.password || !hostOk(u.hostname) || !(await dnsOk(u.hostname))) throw new E("link_invalid");
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 9000);
    let r: Response;
    try { r = await fetch(u, { redirect: "manual", signal: ctl.signal, headers: { "user-agent": "Mozilla/5.0 (compatible; MIB-CBT-FeedReader/1.0; +https://dchoi1977.github.io/myitembook/)", accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5", "accept-language": "ko,en;q=0.8" } }); }
    catch (_) { clearTimeout(timer); throw new E("link_unavailable"); }
    if (r.status >= 300 && r.status < 400) { clearTimeout(timer); const loc = r.headers.get("location"); try { await r.body?.cancel(); } catch (_) { /* ignore */ } if (!loc) throw new E("link_unavailable"); try { u = new URL(loc, u); } catch (_) { throw new E("link_unavailable"); } continue; }
    if (!r.ok) { clearTimeout(timer); try { await r.body?.cancel(); } catch (_) { /* ignore */ } throw new E(r.status === 404 || r.status === 410 ? "link_not_found" : r.status === 401 || r.status === 403 || r.status === 429 ? "link_blocked" : "link_unavailable"); }
    const type = (r.headers.get("content-type") || "").toLowerCase();
    if (type && !/html|text\/plain/.test(type)) { clearTimeout(timer); try { await r.body?.cancel(); } catch (_) { /* ignore */ } throw new E("link_no_text"); }
    const chunks: Uint8Array[] = []; let size = 0; const max = 2_000_000;
    try { const reader = r.body!.getReader(); for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; chunks.push(value); if (size > max) { try { await reader.cancel(); } catch (_) { /* ignore */ } break; } } }
    catch (_) { clearTimeout(timer); throw new E("link_unavailable"); }
    clearTimeout(timer);
    const buf = new Uint8Array(Math.min(size, max + 70000)); let off = 0;
    for (const c of chunks) { if (off + c.length > buf.length) break; buf.set(c, off); off += c.length; }
    let enc = /charset=([\w-]+)/.exec(type)?.[1] || "";
    if (!enc) enc = /<meta[^>]+charset=["']?([\w-]+)/i.exec(new TextDecoder("latin1").decode(buf.subarray(0, 2000)))?.[1] || "utf-8";
    let text: string; try { text = new TextDecoder(enc.toLowerCase()).decode(buf.subarray(0, off)); } catch (_) { text = new TextDecoder().decode(buf.subarray(0, off)); }
    return { text, url: u };
  }
  throw new E("link_unavailable");
}
const ent = (s: string) => s.replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(+n); } catch (_) { return ""; } }).replace(/&#x([0-9a-f]+);/gi, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch (_) { return ""; } })
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
function pageText(html: string): { title: string; text: string } {
  const meta = (n: string) => { const m = new RegExp("<meta[^>]+(?:property|name)=[\"']" + n + "[\"'][^>]*>", "i").exec(html); return m ? ent(/content=["']([^"']*)["']/i.exec(m[0])?.[1] || "") : ""; };
  const title = (meta("og:title") || ent((/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] || "").replace(/<[^>]+>/g, " "))).replace(/\s+/g, " ").trim().slice(0, 120);
  let body = html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe|select|button)\b[\s\S]*?<\/\1>/gi, " ");
  const main = /<article\b[\s\S]*<\/article>/i.exec(body)?.[0] || /<main\b[\s\S]*<\/main>/i.exec(body)?.[0] || "";
  const strip = (h: string) => ent(h.replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, "\n").replace(/<[^>]+>/g, " ")).replace(/[ \t\u00a0]+/g, " ").replace(/\s*\n\s*/g, "\n").trim();
  let text = strip(main); if (text.length < 400) text = strip(/<body\b[\s\S]*/i.exec(body)?.[0] || body);
  const desc = meta("og:description") || meta("description");
  return { title, text: ((desc ? desc + "\n" : "") + text).slice(0, 7000) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("method_not_allowed", 405);
  let b: any = {};
  try { b = await req.json(); } catch (_) { return fail("bad_request"); }
  try {
    if (b.action === "health") {
      const out: Record<string, unknown> = {};
      for (const [k, u] of [["wiki", "https://ko.wikipedia.org/wiki/%EC%84%B8%EC%A2%85"], ["namu", "https://namu.wiki/w/%EC%84%B8%EC%A2%85"], ["internal", "https://169.254.169.254/"]]) {
        try { const g = await safePage(u); const pt = pageText(g.text); out[k] = { ok: true, n: pt.text.length, title: pt.title.slice(0, 30) }; } catch (e) { out[k] = { ok: false, err: e instanceof E ? e.code : "error" }; }
      }
      return json({ ok: true, kinds: out });
    }
    if (b.action !== "page") return fail("unknown_action");
    const h = req.headers.get("authorization") || ""; const token = h.toLowerCase().startsWith("bearer ") ? h.slice(7) : "";
    const { data: au } = token ? await admin.auth.getUser(token) : { data: null as any };
    if (!au?.user) return fail("unauthorized", 401);
    const { data: member } = await admin.from("profiles").select("id").eq("id", au.user.id).maybeSingle();
    if (!member) return fail("forbidden", 403);
    const ref = String(b.ref || "").slice(0, 400);
    if (!ref.trim()) return fail("link_invalid");
    const day = kstDay();
    const { data: row } = await admin.from("link_usage").select("count").eq("user_id", au.user.id).eq("day", day).maybeSingle();
    const used = row?.count || 0; if (used >= 60) return fail("link_limit", 429);
    await admin.from("link_usage").upsert({ user_id: au.user.id, day, count: used + 1 });
    const g = await safePage(ref); const pt = pageText(g.text);
    if (pt.text.length < 80) throw new E("link_no_text");
    return json({ title: pt.title, host: g.url.hostname.replace(/^www\./, ""), url: g.url.origin + g.url.pathname, text: pt.text });
  } catch (e) {
    if (e instanceof E) return fail(e.code, e.code === "link_not_found" ? 404 : /invalid|no_text/.test(e.code) ? 400 : 502);
    console.error("mib-page", (e as Error)?.message);
    return fail("link_unavailable", 502);
  }
});
