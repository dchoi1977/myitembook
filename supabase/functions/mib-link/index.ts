// MIB CBT — mib-link: read a member's OWN public feeds (blog, code, posts, watch/read logs)
// into a neutral list of {title, date, categories, snippet}. Public syndication feeds and
// documented public APIs only: no login walls, no page scraping of walled services, and
// never follower / like / view counts. verify_jwt is off; every action but `health`
// checks the caller's JWT and membership here, and `health` only reads fixed sample feeds.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const URL_ = Deno.env.get("SUPABASE_URL")!;
function secretKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    if (keys && keys["default"]) return keys["default"];
  } catch (_) { /* fall through */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}
const admin = createClient(URL_, secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (code: string, status = 400, extra: Record<string, unknown> = {}) => json({ error: code, ...extra }, status);
const kstDay = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
async function caller(req: Request) {
  const h = req.headers.get("authorization") || "";
  const token = h.toLowerCase().startsWith("bearer ") ? h.slice(7) : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

// ───────── guarded fetch ─────────
const UA = "Mozilla/5.0 (compatible; MIB-CBT-FeedReader/1.0; +https://dchoi1977.github.io/myitembook/)";
class LinkErr extends Error { constructor(public code: string) { super(code); } }
function hostOk(host: string): boolean {
  host = host.toLowerCase();
  if (!host.includes(".") || host.length > 253) return false;
  if (!/^[a-z0-9.-]+$/.test(host)) return false;                      // no IPv6 literals, no odd chars
  if (/^[0-9.]+$/.test(host)) return false;                            // no IPv4 literals
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
  try {
    const a = await Deno.resolveDns(host, "A");
    if (a.some(ip4Private)) return false;
  } catch (_) { /* resolver unavailable or no A record — the fetch itself will fail if unreachable */ }
  try {
    const a = await Deno.resolveDns(host, "AAAA");
    if (a.some((ip) => /^(::1$|::$|f[cd]|fe[89ab]|::ffff:)/i.test(ip))) return false;
  } catch (_) { /* same */ }
  return true;
}
type Got = { text: string; url: URL; type: string };
async function safeFetch(raw: string, o: { hosts?: RegExp; accept?: string; max?: number; headers?: Record<string, string> } = {}): Promise<Got> {
  let u: URL;
  try { u = new URL(raw); } catch (_) { throw new LinkErr("link_invalid"); }
  for (let hop = 0; hop < 4; hop++) {
    if (u.protocol === "http:") u.protocol = "https:";
    if (u.protocol !== "https:" || (u.port && u.port !== "443") || u.username || u.password) throw new LinkErr("link_invalid");
    if (!hostOk(u.hostname) || (o.hosts && !o.hosts.test(u.hostname))) throw new LinkErr("link_invalid");
    if (!(await dnsOk(u.hostname))) throw new LinkErr("link_invalid");
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 9000);
    let r: Response;
    try {
      r = await fetch(u, { redirect: "manual", signal: ctl.signal, headers: { "user-agent": UA, accept: o.accept || "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8, */*;q=0.5", "accept-language": "ko,en;q=0.8", ...(o.headers || {}) } });
    } catch (_) { clearTimeout(timer); throw new LinkErr("link_unavailable"); }
    if (r.status >= 300 && r.status < 400) {
      clearTimeout(timer);
      const loc = r.headers.get("location");
      try { await r.body?.cancel(); } catch (_) { /* ignore */ }
      if (!loc) throw new LinkErr("link_unavailable");
      try { u = new URL(loc, u); } catch (_) { throw new LinkErr("link_unavailable"); }
      continue;
    }
    if (!r.ok) {
      clearTimeout(timer);
      try { await r.body?.cancel(); } catch (_) { /* ignore */ }
      throw new LinkErr(r.status === 404 || r.status === 410 ? "link_not_found" : r.status === 401 || r.status === 403 || r.status === 429 ? "link_blocked" : "link_unavailable");
    }
    const max = o.max || 1_500_000;
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      const reader = r.body!.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        chunks.push(value);
        if (size > max) { try { await reader.cancel(); } catch (_) { /* ignore */ } break; }
      }
    } catch (_) { clearTimeout(timer); throw new LinkErr("link_unavailable"); }
    clearTimeout(timer);
    const buf = new Uint8Array(Math.min(size, max + 65536));
    let off = 0;
    for (const c of chunks) { if (off + c.length > buf.length) break; buf.set(c, off); off += c.length; }
    const type = (r.headers.get("content-type") || "").toLowerCase();
    let enc = /charset=([\w-]+)/.exec(type)?.[1] || "";
    if (!enc) { const head = new TextDecoder("latin1").decode(buf.subarray(0, 300)); enc = /encoding=["']([\w-]+)["']/i.exec(head)?.[1] || /charset=["']?([\w-]+)/i.exec(head)?.[1] || "utf-8"; }
    let text: string;
    try { text = new TextDecoder(enc.toLowerCase()).decode(buf.subarray(0, off)); } catch (_) { text = new TextDecoder().decode(buf.subarray(0, off)); }
    return { text, url: u, type };
  }
  throw new LinkErr("link_unavailable");
}

// ───────── tiny RSS / Atom reader (no DOM in the edge runtime) ─────────
const ent = (s: string) => s
  .replace(/&#(\d+);/g, (_, n) => { try { return String.fromCodePoint(+n); } catch (_) { return ""; } })
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => { try { return String.fromCodePoint(parseInt(n, 16)); } catch (_) { return ""; } })
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
const plain = (s: string) => ent(ent(String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")).replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const title1 = (s: string) => ent(ent(String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<\/?[a-z][^>]*>/gi, " "))).replace(/\s+/g, " ").trim();
const esc = (n: string) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tag = (xml: string, name: string) => { const m = new RegExp("<" + esc(name) + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + esc(name) + ">", "i").exec(xml); return m ? m[1] : ""; };
const tags = (xml: string, name: string) => { const re = new RegExp("<" + esc(name) + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + esc(name) + ">", "gi"); const out: string[] = []; let m; while ((m = re.exec(xml)) && out.length < 12) out.push(m[1]); return out; };
const iso = (s: string) => { const t = Date.parse(String(s || "").trim()); return Number.isFinite(t) && t > 0 && t < Date.now() + 2 * 864e5 ? new Date(t).toISOString() : ""; };
type Item = { t: string; d: string; c?: string[]; x?: string };
type Feed = { title: string; desc: string; items: Item[] };
function parseFeed(xml: string): Feed | null {
  if (!/<(rss|feed|rdf:RDF)[\s>]/i.test(xml.slice(0, 4000))) return null;
  const head = xml.split(/<(?:item|entry)[\s>]/i)[0];
  const atom = /<feed[\s>]/i.test(xml.slice(0, 4000));
  const blocks = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) || [];
  const items: Item[] = [];
  for (const b of blocks.slice(0, 300)) {
    const t = title1(tag(b, "title")).slice(0, 140);
    const d = iso(plain(tag(b, "pubDate") || tag(b, "published") || tag(b, "dc:date") || tag(b, "updated")));
    const cats = [...tags(b, "category").map(plain), ...[...b.matchAll(/<category[^>]*\bterm=["']([^"']+)["']/gi)].map((m) => plain(m[1])), ...plain(tag(b, "tag")).split(",")]
      .map((c) => c.trim().slice(0, 24)).filter(Boolean);
    const x = plain(tag(b, "description") || tag(b, "summary") || tag(b, "content:encoded") || tag(b, "content")).slice(0, 180);
    if (!t && !x) continue;
    items.push({ t, d, ...(cats.length ? { c: [...new Set(cats)].slice(0, 6) } : {}), ...(x && x !== t ? { x } : {}) });
  }
  return { title: title1(tag(head, "title")).slice(0, 80), desc: plain(tag(head, atom ? "subtitle" : "description")).slice(0, 300), items };
}
async function readFeed(url: string, hosts?: RegExp): Promise<Feed> {
  const g = await safeFetch(url, { hosts });
  const f = parseFeed(g.text);
  if (!f) throw new LinkErr("link_not_found");
  return f;
}

// ───────── providers ─────────
type Out = { kind: string; profile: { title: string; desc?: string; since?: string; url: string }; items: Item[]; total?: number };
const clean = (s: unknown) => String(s ?? "").trim();
function asUrl(raw: string): URL | null {
  let s = clean(raw);
  if (!s || /\s/.test(s)) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try { return new URL(s); } catch (_) { return null; }
}
const seg = (u: URL) => decodeURIComponent(u.pathname).split("/").filter(Boolean);
const bad = () => { throw new LinkErr("link_invalid"); };

const P: Record<string, (ref: string) => Promise<Out>> = {
  async naverblog(ref) {
    let id = clean(ref);
    if (!/^[a-z0-9_-]{3,30}$/i.test(id)) {
      const u = asUrl(ref); if (!u) bad();
      const h = u!.hostname.toLowerCase();
      if (/(^|\.)blog\.naver\.com$/.test(h)) id = u!.searchParams.get("blogId") || seg(u!)[0] || "";
      else if (/\.blog\.me$/.test(h)) id = h.split(".")[0];
      else bad();
      if (/\.naver$/i.test(id)) id = u!.searchParams.get("blogId") || "";
    }
    if (!/^[a-z0-9_-]{3,30}$/i.test(id)) bad();
    const f = await readFeed(`https://rss.blog.naver.com/${id}.xml`, /(^|\.)naver\.com$/);
    if (!f.items.length) throw new LinkErr("link_empty");
    return { kind: "naverblog", profile: { title: f.title || id, desc: f.desc, url: `https://blog.naver.com/${id}` }, items: f.items };
  },
  async tistory(ref) {
    let name = clean(ref).toLowerCase();
    if (!/^[a-z0-9-]{2,40}$/.test(name)) { const u = asUrl(ref); const h = u?.hostname.toLowerCase() || ""; if (!/^[a-z0-9-]{2,40}\.tistory\.com$/.test(h)) bad(); name = h.split(".")[0]; }
    const f = await readFeed(`https://${name}.tistory.com/rss`, /(^|\.)tistory\.com$/);
    if (!f.items.length) throw new LinkErr("link_empty");
    return { kind: "tistory", profile: { title: f.title || name, desc: f.desc, url: `https://${name}.tistory.com` }, items: f.items };
  },
  async brunch(ref) {
    let id = clean(ref).replace(/^@/, "");
    if (!/^[\w.-]{2,40}$/.test(id)) { const u = asUrl(ref); if (!u || !/(^|\.)brunch\.co\.kr$/.test(u.hostname.toLowerCase())) bad(); id = (seg(u!)[0] || "").replace(/^@+/, ""); }
    if (!/^[\w.-]{2,40}$/.test(id)) bad();
    const page = await safeFetch(`https://brunch.co.kr/@${id}`, { hosts: /(^|\.)brunch\.co\.kr$/, accept: "text/html" });
    const code = /brunch\.co\.kr\/rss\/@@([A-Za-z0-9]+)/.exec(page.text)?.[1] || /\/rss\/@@([A-Za-z0-9]+)/.exec(page.text)?.[1];
    if (!code) throw new LinkErr("link_not_found");
    const f = await readFeed(`https://brunch.co.kr/rss/@@${code}`, /(^|\.)brunch\.co\.kr$/);
    if (!f.items.length) throw new LinkErr("link_empty");
    return { kind: "brunch", profile: { title: f.title || id, desc: f.desc, url: `https://brunch.co.kr/@${id}` }, items: f.items };
  },
  async velog(ref) {
    let id = clean(ref).replace(/^@/, "");
    if (!/^[\w.-]{2,40}$/.test(id)) { const u = asUrl(ref); if (!u || !/(^|\.)velog\.io$/.test(u.hostname.toLowerCase())) bad(); id = (seg(u!).find((s) => s.startsWith("@")) || "").slice(1); }
    if (!/^[\w.-]{2,40}$/.test(id)) bad();
    const f = await readFeed(`https://v2.velog.io/rss/${id}`, /(^|\.)velog\.io$/);
    if (!f.items.length) throw new LinkErr("link_empty");
    return { kind: "velog", profile: { title: f.title || id, desc: f.desc, url: `https://velog.io/@${id}` }, items: f.items };
  },
  async github(ref) {
    let u0 = clean(ref).replace(/^@/, "");
    if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(u0)) { const u = asUrl(ref); if (!u || !/^(www\.)?github\.com$/.test(u.hostname.toLowerCase())) bad(); u0 = seg(u!)[0] || ""; }
    if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(u0)) bad();
    const tok = Deno.env.get("GITHUB_TOKEN");
    const headers: Record<string, string> = { "x-github-api-version": "2022-11-28", ...(tok ? { authorization: "Bearer " + tok } : {}) };
    const hosts = /^(api\.)?github\.com$/;
    try {
      const pr = JSON.parse((await safeFetch(`https://api.github.com/users/${u0}`, { hosts, accept: "application/vnd.github+json", headers })).text);
      const rp = JSON.parse((await safeFetch(`https://api.github.com/users/${u0}/repos?per_page=100&sort=pushed&type=owner`, { hosts, accept: "application/vnd.github+json", headers })).text);
      const items: Item[] = (Array.isArray(rp) ? rp : []).filter((r: any) => !r.fork).map((r: any) => ({
        t: `${r.name}${r.language ? " (" + r.language + ")" : ""}${r.description ? " — " + String(r.description).slice(0, 80) : ""}`.slice(0, 140),
        d: iso(r.pushed_at || r.created_at),
        c: [r.language, ...(Array.isArray(r.topics) ? r.topics : [])].filter(Boolean).map((x: string) => String(x).slice(0, 24)).slice(0, 6),
      }));
      if (!items.length) throw new LinkErr("link_empty");
      return { kind: "github", profile: { title: pr.name || pr.login || u0, desc: clean(pr.bio).slice(0, 300), since: iso(pr.created_at).slice(0, 10), url: `https://github.com/${u0}` }, items, total: Number(pr.public_repos) || items.length };
    } catch (e) {
      if (e instanceof LinkErr && (e.code === "link_not_found" || e.code === "link_empty")) throw e;
      const f = await readFeed(`https://github.com/${u0}.atom`, hosts);   // rate-limited API → public activity feed
      if (!f.items.length) throw new LinkErr("link_empty");
      return { kind: "github", profile: { title: u0, url: `https://github.com/${u0}` }, items: f.items.map((i) => ({ t: i.t, d: i.d })) };
    }
  },
  async medium(ref) {
    let path = "";
    const raw = clean(ref);
    if (/^@?[\w.-]{2,40}$/.test(raw)) path = "@" + raw.replace(/^@/, "");
    else { const u = asUrl(ref); if (!u) bad(); const h = u!.hostname.toLowerCase(); if (h === "medium.com" || h === "www.medium.com") path = seg(u!)[0] || ""; else if (/^[\w-]+\.medium\.com$/.test(h)) path = "@" + h.split(".")[0]; else bad(); }
    if (!/^@?[\w.-]{2,60}$/.test(path)) bad();
    const f = await readFeed(`https://medium.com/feed/${path}`, /(^|\.)medium\.com$/);
    if (!f.items.length) throw new LinkErr("link_empty");
    return { kind: "medium", profile: { title: f.title.replace(/^Stories by | on Medium$/g, "") || path, desc: f.desc, url: `https://medium.com/${path}` }, items: f.items.map((i) => ({ t: i.t, d: i.d, c: i.c })) };
  },
  async substack(ref) {
    let name = clean(ref).toLowerCase();
    if (!/^[a-z0-9-]{2,40}$/.test(name)) { const u = asUrl(ref); const h = u?.hostname.toLowerCase() || ""; if (!/^[a-z0-9-]{2,40}\.substack\.com$/.test(h)) bad(); name = h.split(".")[0]; }
    const f = await readFeed(`https://${name}.substack.com/feed`, /(^|\.)substack\.com$/);
    if (!f.items.length) throw new LinkErr("link_empty");
    return { kind: "substack", profile: { title: f.title || name, desc: f.desc, url: `https://${name}.substack.com` }, items: f.items };
  },
  async bluesky(ref) {
    let h = clean(ref).replace(/^@/, "").toLowerCase();
    if (!/^[a-z0-9.-]{3,80}$/.test(h) || !h.includes(".")) { const u = asUrl(ref); if (!u || !/^(www\.)?bsky\.app$/.test(u.hostname.toLowerCase())) bad(); const s = seg(u!); h = (s[0] === "profile" ? s[1] : "") || ""; }
    if (!/^[a-z0-9.:-]{3,80}$/i.test(h)) bad();
    const hosts = /^public\.api\.bsky\.app$/;
    const pr = JSON.parse((await safeFetch(`https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(h)}`, { hosts, accept: "application/json" })).text);
    const fd = JSON.parse((await safeFetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(h)}&limit=100&filter=posts_no_replies`, { hosts, accept: "application/json" })).text);
    const items: Item[] = (fd.feed || []).filter((x: any) => !x.reason && x.post?.record?.text).map((x: any) => ({ t: String(x.post.record.text).replace(/\s+/g, " ").slice(0, 140), d: iso(x.post.record.createdAt) }));
    if (!items.length) throw new LinkErr("link_empty");
    return { kind: "bluesky", profile: { title: pr.displayName || pr.handle || h, desc: clean(pr.description).slice(0, 300), since: iso(pr.createdAt).slice(0, 10), url: `https://bsky.app/profile/${pr.handle || h}` }, items, total: Number(pr.postsCount) || items.length };
  },
  async mastodon(ref) {
    let user = "", host = "";
    const m = /^@?([\w.-]{1,40})@([a-z0-9.-]{3,80})$/i.exec(clean(ref));
    if (m) { user = m[1]; host = m[2].toLowerCase(); }
    else { const u = asUrl(ref); if (!u) bad(); const s = seg(u!).find((x) => x.startsWith("@")) || ""; user = s.slice(1).split("@")[0]; host = u!.hostname.toLowerCase(); }
    if (!/^[\w.-]{1,40}$/.test(user) || !hostOk(host)) bad();
    const f = await readFeed(`https://${host}/@${user}.rss`);
    const items = f.items.map((i) => ({ t: (i.t || i.x || "").slice(0, 140), d: i.d })).filter((i) => i.t);
    if (!items.length) throw new LinkErr("link_empty");
    return { kind: "mastodon", profile: { title: f.title || `@${user}@${host}`, desc: f.desc, url: `https://${host}/@${user}` }, items };
  },
  async letterboxd(ref) {
    let id = clean(ref).replace(/^@/, "");
    if (!/^[\w-]{2,30}$/.test(id)) { const u = asUrl(ref); if (!u || !/^(www\.)?letterboxd\.com$/.test(u.hostname.toLowerCase())) bad(); id = seg(u!)[0] || ""; }
    if (!/^[\w-]{2,30}$/.test(id)) bad();
    const f = await readFeed(`https://letterboxd.com/${id}/rss/`, /(^|\.)letterboxd\.com$/);
    if (!f.items.length) throw new LinkErr("link_empty");
    return { kind: "letterboxd", profile: { title: f.title.replace(/^Letterboxd - /, "") || id, url: `https://letterboxd.com/${id}/` }, items: f.items.map((i) => ({ t: i.t, d: i.d })) };
  },
  async goodreads(ref) {
    let id = /^\d{3,12}$/.test(clean(ref)) ? clean(ref) : "";
    if (!id) { const u = asUrl(ref); if (!u || !/^(www\.)?goodreads\.com$/.test(u.hostname.toLowerCase())) bad(); id = /(\d{3,12})/.exec(seg(u!).slice(-1)[0] || "")?.[1] || ""; }
    if (!id) bad();
    const f = await readFeed(`https://www.goodreads.com/review/list_rss/${id}?shelf=read`, /(^|\.)goodreads\.com$/);
    if (!f.items.length) throw new LinkErr("link_empty");
    return { kind: "goodreads", profile: { title: f.title.replace(/'s bookshelf: read$/i, "") || id, url: `https://www.goodreads.com/user/show/${id}` }, items: f.items.map((i) => ({ t: i.t, d: i.d })) };
  },
  async pinterest(ref) {
    let id = clean(ref).replace(/^@/, "");
    if (!/^[\w-]{2,40}$/.test(id)) { const u = asUrl(ref); if (!u || !/(^|\.)pinterest\.(com|co\.kr)$/.test(u.hostname.toLowerCase())) bad(); id = seg(u!)[0] || ""; }
    if (!/^[\w-]{2,40}$/.test(id)) bad();
    const f = await readFeed(`https://www.pinterest.com/${id}/feed.rss`, /(^|\.)pinterest\.com$/);
    const items = f.items.map((i) => ({ t: (i.t || i.x || "").slice(0, 140), d: i.d })).filter((i) => i.t);
    if (!items.length) throw new LinkErr("link_empty");
    return { kind: "pinterest", profile: { title: f.title || id, desc: f.desc, url: `https://www.pinterest.com/${id}/` }, items };
  },
  // any other blog / podcast / newsletter: a feed address, or a homepage that advertises one
  async rss(ref) {
    const u = asUrl(ref); if (!u) bad();
    const g = await safeFetch(u!.toString());
    let f = parseFeed(g.text);
    let home = g.url;
    if (!f) {
      const links = [...g.text.slice(0, 200000).matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]).filter((l) => /rel=["']?alternate/i.test(l) && /type=["']?application\/(rss|atom)\+xml/i.test(l));
      const href = links.map((l) => /href=["']([^"']+)["']/i.exec(l)?.[1]).find(Boolean);
      if (!href) throw new LinkErr("link_no_feed");
      let fu: URL; try { fu = new URL(ent(href), g.url); } catch (_) { throw new LinkErr("link_no_feed"); }
      f = await readFeed(fu.toString());
    } else { try { home = new URL("/", g.url); } catch (_) { /* keep */ } }
    if (!f.items.length) throw new LinkErr("link_empty");
    return { kind: "rss", profile: { title: f.title || home.hostname, desc: f.desc, url: home.toString() }, items: f.items };
  },
};
const SAMPLE: Record<string, string> = {
  naverblog: "naver_diary", tistory: "notice", brunch: "brunch", velog: "velog", github: "torvalds", medium: "@ev", substack: "on",
  bluesky: "bsky.app", mastodon: "@Gargron@mastodon.social", letterboxd: "dave", goodreads: "1", pinterest: "pinterest", rss: "https://www.w3.org/blog/feed/",
};

function tidy(o: Out): Out {
  const items = o.items.filter((i) => i.t || i.x).slice(0, 200).map((i) => ({ t: i.t.slice(0, 140), d: i.d || "", ...(i.c && i.c.length ? { c: i.c.slice(0, 6) } : {}), ...(i.x ? { x: i.x.slice(0, 180) } : {}) }));
  return { kind: o.kind, profile: { title: clean(o.profile.title).slice(0, 80), desc: clean(o.profile.desc).slice(0, 300), since: o.profile.since || "", url: o.profile.url }, items, total: o.total || items.length };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("method_not_allowed", 405);
  let b: any = {};
  try { b = await req.json(); } catch (_) { return fail("bad_request"); }
  try {
    if (b.action === "health") {
      const out: Record<string, unknown> = {};
      await Promise.all(Object.keys(P).map(async (k) => {
        const t0 = Date.now();
        try { const r = tidy(await P[k](SAMPLE[k])); out[k] = { ok: true, n: r.items.length, dated: r.items.filter((i) => i.d).length, ms: Date.now() - t0 }; }
        catch (e) { out[k] = { ok: false, err: e instanceof LinkErr ? e.code : "error", ms: Date.now() - t0 }; }
      }));
      return json({ ok: true, kinds: out });
    }
    if (b.action === "kinds") return json({ kinds: Object.keys(P) });
    if (b.action !== "fetch") return fail("unknown_action");
    const user = await caller(req);
    if (!user) return fail("unauthorized", 401);
    const { data: member } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
    if (!member) return fail("forbidden", 403);
    const kind = String(b.kind || "");
    const ref = String(b.ref || "").slice(0, 300);
    if (!P[kind] || !ref.trim()) return fail("link_invalid");
    const day = kstDay();
    const { data: row } = await admin.from("link_usage").select("count").eq("user_id", user.id).eq("day", day).maybeSingle();
    const used = row?.count || 0;
    if (used >= 60) return fail("link_limit", 429);
    await admin.from("link_usage").upsert({ user_id: user.id, day, count: used + 1 });
    return json(tidy(await P[kind](ref)));
  } catch (e) {
    if (e instanceof LinkErr) return fail(e.code, e.code === "link_not_found" ? 404 : e.code === "link_invalid" || e.code === "link_empty" || e.code === "link_no_feed" ? 400 : 502);
    console.error("mib-link", (e as Error)?.message);
    return fail("link_unavailable", 502);
  }
});
