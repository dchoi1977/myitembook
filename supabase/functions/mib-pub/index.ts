// MIB CBT — mib-pub: a member's own PUBLIC lists on fixed hosts only
// (YouTube public playlist / public subscriptions via the official Data API, Steam public profile XML).
// Titles and dates only — never view, like or subscriber counts. verify_jwt off; JWT checked here.
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
const clean = (s: unknown) => String(s ?? "").trim();
const iso = (s: unknown) => { const t = Date.parse(String(s || "")); return Number.isFinite(t) && t > 0 ? new Date(t).toISOString() : ""; };
function asUrl(raw: string): URL | null { let s = clean(raw); if (!s || /\s/.test(s)) return null; if (!/^https?:\/\//i.test(s)) s = "https://" + s; try { return new URL(s); } catch (_) { return null; } }
async function get(url: string, accept: string): Promise<Response> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
  try { return await fetch(url, { signal: ctl.signal, headers: { accept, "accept-language": "ko,en;q=0.8", "user-agent": "Mozilla/5.0 (compatible; MIB-CBT-FeedReader/1.0)" } }); }
  catch (_) { throw new E("link_unavailable"); } finally { clearTimeout(t); }
}
async function yt(path: string, params: Record<string, string>) {
  const key = Deno.env.get("YOUTUBE_API_KEY"); if (!key) throw new E("yt_not_configured");
  const u = new URL("https://www.googleapis.com/youtube/v3/" + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("key", key);
  const r = await get(u.toString(), "application/json");
  const j = await r.json().catch(() => null);
  if (!r.ok || !j) {
    const reason = j?.error?.errors?.[0]?.reason || "";
    if (r.status === 403 && /subscriptionForbidden/i.test(reason)) throw new E("link_private");
    if (r.status === 404 || /NotFound/i.test(reason)) throw new E("link_not_found");
    if (r.status === 403 && /quota/i.test(reason)) throw new E("link_limit");
    throw new E("link_unavailable");
  }
  return j;
}
type Item = { t: string; d: string; c?: string[] };
type Out = { kind: string; profile: { title: string; desc?: string; since?: string; url: string }; items: Item[]; total?: number };
const xml = (s: string, name: string) => { const m = new RegExp("<" + name + ">\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</" + name + ">", "i").exec(s); return m ? m[1].trim() : ""; };

const P: Record<string, (ref: string) => Promise<Out>> = {
  async ytlist(ref) {
    let id = clean(ref);
    if (!/^(PL|UU|FL|OL|LL|RD)[\w-]{8,60}$/.test(id)) { const u = asUrl(ref); if (!u || !/(^|\.)youtube\.com$|^youtu\.be$/.test(u.hostname.toLowerCase())) throw new E("link_invalid"); id = u.searchParams.get("list") || ""; }
    if (!/^(PL|UU|FL|OL)[\w-]{8,60}$/.test(id)) throw new E("link_invalid");
    const pl = await yt("playlists", { part: "snippet,contentDetails", id });
    const p = pl.items?.[0]; if (!p) throw new E("link_not_found");
    const items: Item[] = []; let token = "";
    for (let i = 0; i < 4; i++) {
      const r = await yt("playlistItems", { part: "snippet", playlistId: id, maxResults: "50", ...(token ? { pageToken: token } : {}) });
      for (const it of r.items || []) { const t = clean(it.snippet?.title); if (!t || t === "Private video" || t === "Deleted video") continue; const ch = clean(it.snippet?.videoOwnerChannelTitle).replace(/ - Topic$/, ""); items.push({ t: t.slice(0, 120), d: iso(it.snippet?.publishedAt), ...(ch ? { c: [ch.slice(0, 24)] } : {}) }); }
      token = r.nextPageToken || ""; if (!token) break;
    }
    if (!items.length) throw new E("link_empty");
    return { kind: "ytlist", profile: { title: clean(p.snippet?.title).slice(0, 80), desc: clean(p.snippet?.description).slice(0, 200), url: "https://www.youtube.com/playlist?list=" + id }, items, total: Number(p.contentDetails?.itemCount) || items.length };
  },
  async ytsubs(ref) {
    const q: Record<string, string> = { part: "snippet" };
    const raw = clean(ref);
    if (/^UC[\w-]{22}$/.test(raw)) q.id = raw;
    else if (/^@[\w.\-가-힣]{2,100}$/.test(raw)) q.forHandle = raw;
    else { const u = asUrl(ref); if (!u || !/(^|\.)youtube\.com$/.test(u.hostname.toLowerCase())) throw new E("link_invalid"); const s = decodeURIComponent(u.pathname).split("/").filter(Boolean); if (s[0]?.startsWith("@")) q.forHandle = s[0]; else if (s[0] === "channel" && /^UC[\w-]{22}$/.test(s[1] || "")) q.id = s[1]; else throw new E("link_invalid"); }
    const ch = await yt("channels", q); const c = ch.items?.[0]; if (!c) throw new E("link_not_found");
    const items: Item[] = []; let token = ""; let total = 0;
    for (let i = 0; i < 4; i++) {
      const r = await yt("subscriptions", { part: "snippet", channelId: c.id, maxResults: "50", order: "relevance", ...(token ? { pageToken: token } : {}) });
      total = Number(r.pageInfo?.totalResults) || total;
      for (const it of r.items || []) { const t = clean(it.snippet?.title); if (t) items.push({ t: t.slice(0, 80), d: iso(it.snippet?.publishedAt) }); }
      token = r.nextPageToken || ""; if (!token) break;
    }
    if (!items.length) throw new E("link_empty");
    return { kind: "ytsubs", profile: { title: clean(c.snippet?.title).slice(0, 80), url: "https://www.youtube.com/channel/" + c.id }, items, total: total || items.length };
  },
  async steam(ref) {
    let path = "";
    const raw = clean(ref);
    if (/^\d{17}$/.test(raw)) path = "profiles/" + raw;
    else if (/^[\w-]{2,32}$/.test(raw)) path = "id/" + raw;
    else { const u = asUrl(ref); if (!u || u.hostname.toLowerCase() !== "steamcommunity.com") throw new E("link_invalid"); const s = u.pathname.split("/").filter(Boolean); if ((s[0] === "id" && /^[\w-]{2,32}$/.test(s[1] || "")) || (s[0] === "profiles" && /^\d{17}$/.test(s[1] || ""))) path = s[0] + "/" + s[1]; else throw new E("link_invalid"); }
    const r = await get(`https://steamcommunity.com/${path}/?xml=1`, "text/xml");
    if (!r.ok) throw new E(r.status === 404 ? "link_not_found" : "link_unavailable");
    const body = (await r.text()).slice(0, 400000);
    if (!/<profile>/i.test(body)) throw new E("link_not_found");
    if (xml(body, "privacyState") && xml(body, "privacyState") !== "public") throw new E("link_private");
    const games = body.match(/<mostPlayedGame>[\s\S]*?<\/mostPlayedGame>/gi) || [];
    const items: Item[] = games.map((g) => { const n = xml(g, "gameName"); const rec = xml(g, "hoursOnRecord").replace(/,/g, ""); const two = xml(g, "hoursPlayed"); return { t: `${n}${rec ? ` — 누적 ${rec}시간` : ""}${two && two !== "0.0" ? ` · 최근 2주 ${two}시간` : ""}`.slice(0, 120), d: "" }; }).filter((i) => i.t);
    if (!items.length) throw new E("link_empty");
    const since = Date.parse(xml(body, "memberSince"));
    return { kind: "steam", profile: { title: xml(body, "steamID").slice(0, 60), desc: xml(body, "headline").replace(/<[^>]+>/g, " ").slice(0, 160), since: Number.isFinite(since) ? new Date(since).toISOString().slice(0, 10) : "", url: `https://steamcommunity.com/${path}` }, items };
  },
};
const SAMPLE: Record<string, string> = { ytlist: "https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI", ytsubs: "@YouTube", steam: "gabelogannewell" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("method_not_allowed", 405);
  let b: any = {};
  try { b = await req.json(); } catch (_) { return fail("bad_request"); }
  try {
    if (b.action === "health") {
      const out: Record<string, unknown> = {};
      await Promise.all(Object.keys(P).map(async (k) => { try { const r = await P[k](SAMPLE[k]); out[k] = { ok: true, n: r.items.length, total: r.total || 0 }; } catch (e) { out[k] = { ok: false, err: e instanceof E ? e.code : "error" }; } }));
      return json({ ok: true, kinds: out });
    }
    if (b.action !== "fetch") return fail("unknown_action");
    const h = req.headers.get("authorization") || ""; const token = h.toLowerCase().startsWith("bearer ") ? h.slice(7) : "";
    const { data: au } = token ? await admin.auth.getUser(token) : { data: null as any };
    if (!au?.user) return fail("unauthorized", 401);
    const { data: member } = await admin.from("profiles").select("id").eq("id", au.user.id).maybeSingle();
    if (!member) return fail("forbidden", 403);
    const kind = String(b.kind || ""); const ref = String(b.ref || "").slice(0, 300);
    if (!P[kind] || !ref.trim()) return fail("link_invalid");
    const day = kstDay();
    const { data: row } = await admin.from("link_usage").select("count").eq("user_id", au.user.id).eq("day", day).maybeSingle();
    const used = row?.count || 0; if (used >= 60) return fail("link_limit", 429);
    await admin.from("link_usage").upsert({ user_id: au.user.id, day, count: used + 1 });
    const o = await P[kind](ref);
    return json({ kind: o.kind, profile: { title: o.profile.title, desc: o.profile.desc || "", since: o.profile.since || "", url: o.profile.url }, items: o.items.slice(0, 200), total: o.total || o.items.length });
  } catch (e) {
    if (e instanceof E) return fail(e.code, e.code === "link_not_found" ? 404 : /invalid|empty|private/.test(e.code) ? 400 : e.code === "yt_not_configured" ? 503 : 502);
    console.error("mib-pub", (e as Error)?.message);
    return fail("link_unavailable", 502);
  }
});
