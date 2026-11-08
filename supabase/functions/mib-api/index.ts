// MIB CBT API — join (invite-gated sign-up), ai (Claude proxy with daily cap),
// youtube (official Data API), delete_me (full account erase), admin_reset_password.
// verify_jwt is off: join is public; every other action checks the caller's JWT here.
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

async function caller(req: Request) {
  const h = req.headers.get("authorization") || "";
  const token = h.toLowerCase().startsWith("bearer ") ? h.slice(7) : "";
  if (!token) return null;
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
async function setting<T>(key: string, d: T): Promise<T> {
  const { data } = await admin.from("settings").select("value").eq("key", key).maybeSingle();
  return (data?.value ?? d) as T;
}
const kstDay = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

// ───────── join ─────────
async function join(b: any) {
  const code = String(b.code || "").trim().toUpperCase();
  const email = String(b.email || "").trim().toLowerCase();
  const password = String(b.password || "");
  const nickname = String(b.nickname || "").trim();
  const agree = b.agree || {};
  if (!code) return fail("invalid_code");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) return fail("invalid_email");
  if (password.length < 8 || password.length > 72) return fail("weak_password");
  if (!/^[0-9A-Za-z가-힣_.·]{2,12}$/.test(nickname)) return fail("invalid_nickname");
  if (!agree.terms || !agree.privacy || !agree.ai) return fail("consent_required");

  const { data: inv0 } = await admin.from("invites").select("*").eq("code", code).maybeSingle();
  if (!inv0 || !inv0.active) return fail("invalid_code");
  if (inv0.used >= inv0.max_uses) return fail("code_used");

  if (inv0.role !== "admin") {
    const cap = Number(await setting("tester_cap", 30)) || 30;
    const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "tester");
    if ((count || 0) >= cap) return fail("full");
  }
  const { data: taken } = await admin.from("profiles").select("id").ilike("nickname", nickname).maybeSingle();
  if (taken) return fail("nickname_taken");

  // reserve one use atomically in SQL (used < max_uses checked inside the UPDATE)
  const { data: role, error: rErr } = await admin.rpc("invite_reserve", { c: code });
  if (rErr) return fail("signup_failed", 500);
  if (!role) return fail("code_used");
  const inv = { ...inv0, role };
  const release = () => admin.rpc("invite_release", { c: code });

  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email, password, email_confirm: true, user_metadata: { nickname }, app_metadata: { mib: "invited" },
  });
  if (cErr || !created?.user) {
    await release();
    const msg = (cErr?.message || "").toLowerCase();
    if (msg.includes("already") || msg.includes("exists") || (cErr as any)?.code === "email_exists") return fail("email_taken");
    if (msg.includes("password")) return fail("weak_password");
    console.error("createUser", cErr);
    return fail("signup_failed", 500);
  }
  const uid = created.user.id;
  const consent = { terms: true, privacy: true, ai: true, research: !!agree.research, at: new Date().toISOString(), version: "cbt-1" };
  const { error: pErr } = await admin.from("profiles").insert({ id: uid, nickname, role: inv.role, consent });
  if (pErr) {
    await admin.auth.admin.deleteUser(uid);
    await release();
    return fail(pErr.code === "23505" ? "nickname_taken" : "signup_failed", pErr.code === "23505" ? 400 : 500);
  }
  await admin.from("invite_redemptions").insert({ code, user_id: uid });
  return json({ ok: true, role: inv.role });
}

// ───────── ai ─────────
const MODEL_DEEP = () => Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-5-5";
const MODEL_QUICK = () => Deno.env.get("ANTHROPIC_MODEL_QUICK") || "claude-haiku-5-5";
const SYSTEM = `너는 MyItemBook(MIB) 서비스의 AI다. 사용자가 건넨 기록과 지시만 근거로 답한다.
- 성격 유형, 질병·건강, 종교, 정치 성향, 성적 지향, 재정 상태를 추정하지 않는다.
- 사진 속 얼굴로 사람을 식별하지 않고, 신분증·증서 번호·주소·번호판을 옮겨 적지 않는다.
- 부정적 평가나 훈계를 하지 않는다. 한국어로 담백하게 쓴다.
- JSON을 요구받으면 JSON 객체 하나만 출력한다.`;

async function ai(req: Request, b: any) {
  const user = await caller(req);
  if (!user) return fail("unauthorized", 401);
  const { data: member } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!member) return fail("forbidden", 403);
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return fail("ai_not_configured", 503);

  const task = b.task === "read" ? "read" : "quick";
  const prompt = String(b.prompt || "");
  if (!prompt.trim()) return fail("empty_prompt");
  if (prompt.length > 60000) return fail("prompt_too_large", 413);
  const images = Array.isArray(b.images) ? b.images.slice(0, 4) : [];
  for (const im of images) {
    if (!im || !["image/jpeg", "image/png", "image/webp"].includes(im.type) || typeof im.data !== "string") return fail("image_rejected");
    if (im.data.length > 2_000_000) return fail("image_rejected");
  }

  const limit = Number(await setting("ai_daily_limit", 40)) || 40;
  const day = kstDay();
  const { data: row } = await admin.from("ai_usage").select("count").eq("user_id", user.id).eq("day", day).maybeSingle();
  const used = row?.count || 0;
  if (used >= limit) return fail("daily_limit", 429, { limit });
  await admin.from("ai_usage").upsert({ user_id: user.id, day, count: used + 1 });

  const content: any[] = images.map((im: any) => ({ type: "image", source: { type: "base64", media_type: im.type, data: im.data } }));
  content.push({ type: "text", text: prompt });
  const body = {
    model: task === "read" ? MODEL_DEEP() : MODEL_QUICK(),
    max_tokens: task === "read" ? 4000 : 700,
    system: SYSTEM,
    messages: [{ role: "user", content }],
  };
  let r: Response;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (_) {
    return fail("upstream_error", 502);
  }
  const out = await r.json().catch(() => null);
  if (!r.ok || !out) {
    const t = out?.error?.type || "";
    console.error("anthropic", r.status, t, out?.error?.message);
    // give back the reserved call on upstream failure
    await admin.from("ai_usage").upsert({ user_id: user.id, day, count: used });
    if (r.status === 429 || t === "rate_limit_error" || t === "overloaded_error") return fail("rate_limited", 429);
    if (r.status === 401 || r.status === 403) return fail("ai_not_configured", 503);
    if (r.status === 400 && /image/i.test(out?.error?.message || "")) return fail("image_rejected");
    return fail("upstream_error", 502);
  }
  const text = (out.content || []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("");
  if (out.stop_reason === "refusal") return fail("refused");
  return json({ text, truncated: out.stop_reason === "max_tokens", remaining: Math.max(0, limit - used - 1) });
}

// ───────── youtube: public channel → upload titles & dates ─────────
// Official YouTube Data API v3 only (YOUTUBE_API_KEY). No page scraping.
// Returns titles, dates and durations; views/subscribers are never returned.
type ChRef = { id?: string; handle?: string; user?: string; custom?: string; video?: string };
function parseChannelRef(raw: string): ChRef | null {
  let s = String(raw || "").trim();
  if (!s) return null;
  if (/^UC[\w-]{22}$/.test(s)) return { id: s };
  if (/^@[\w.\-가-힣]{2,100}$/.test(s)) return { handle: s.slice(1) };
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let u: URL;
  try { u = new URL(s); } catch (_) { return null; }
  const host = u.hostname.toLowerCase();
  if (host === "youtu.be") { const v = u.pathname.slice(1).split("/")[0]; return /^[\w-]{11}$/.test(v) ? { video: v } : null; }
  if (!/(^|\.)youtube\.com$/.test(host)) return null;
  const parts = decodeURIComponent(u.pathname).split("/").filter(Boolean);
  if (parts[0] === "watch" || (!parts.length && u.searchParams.get("v"))) { const v = u.searchParams.get("v") || ""; return /^[\w-]{11}$/.test(v) ? { video: v } : null; }
  if (parts[0] === "shorts" && /^[\w-]{11}$/.test(parts[1] || "")) return { video: parts[1] };
  if (!parts.length) return null;
  if (parts[0].startsWith("@")) return { handle: parts[0].slice(1) };
  if (parts[0] === "channel" && /^UC[\w-]{22}$/.test(parts[1] || "")) return { id: parts[1] };
  if (parts[0] === "user" && parts[1]) return { user: parts[1] };
  if (parts[0] === "c" && parts[1]) return { custom: parts[1] };
  return null;
}
const isoDur = (d: string) => { const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(d || ""); return m ? (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0)) : null; };
async function youtube(req: Request, b: any) {
  const user = await caller(req);
  if (!user) return fail("unauthorized", 401);
  const { data: member } = await admin.from("profiles").select("id").eq("id", user.id).maybeSingle();
  if (!member) return fail("forbidden", 403);
  const ref = parseChannelRef(b.channel);
  if (!ref) return fail("yt_invalid");
  const key = Deno.env.get("YOUTUBE_API_KEY");
  if (!key) return fail("yt_not_configured", 503);
  const api = async (path: string, params: Record<string, string>) => {
    const u = new URL("https://www.googleapis.com/youtube/v3/" + path);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    u.searchParams.set("key", key);
    const r = await fetch(u);
    const j = await r.json().catch(() => null);
    if (!r.ok || !j) {
      console.error("yt api", path, r.status, j?.error?.message);
      const reason = j?.error?.errors?.[0]?.reason || "";
      throw new Error(r.status === 403 && /quota/i.test(reason) ? "yt_quota" : r.status === 400 || r.status === 403 ? "yt_key" : "yt_unavailable");
    }
    return j;
  };
  try {
    const q: Record<string, string> = { part: "snippet,contentDetails,statistics" };
    if (ref.id) q.id = ref.id;
    else if (ref.handle) q.forHandle = "@" + ref.handle;
    else if (ref.user) q.forUsername = ref.user;
    else if (ref.video) {
      const v = await api("videos", { part: "snippet", id: ref.video });
      const cid = v.items?.[0]?.snippet?.channelId;
      if (!cid) return fail("yt_not_found", 404);
      q.id = cid;
    } else {
      const sr = await api("search", { part: "snippet", type: "channel", q: ref.custom || "", maxResults: "1" });
      const cid = sr.items?.[0]?.snippet?.channelId || sr.items?.[0]?.id?.channelId;
      if (!cid) return fail("yt_not_found", 404);
      q.id = cid;
    }
    const ch = await api("channels", q);
    const c = ch.items?.[0];
    if (!c) return fail("yt_not_found", 404);
    const uploads = c.contentDetails?.relatedPlaylists?.uploads;
    const vids: any[] = [];
    let token = "";
    for (let i = 0; i < 4 && uploads; i++) {
      const pl = await api("playlistItems", { part: "snippet,contentDetails", playlistId: uploads, maxResults: "50", ...(token ? { pageToken: token } : {}) });
      for (const it of pl.items || []) vids.push({ id: it.contentDetails?.videoId, t: it.snippet?.title || "", d: (it.contentDetails?.videoPublishedAt || it.snippet?.publishedAt || "").slice(0, 10) });
      token = pl.nextPageToken || "";
      if (!token) break;
    }
    for (let i = 0; i < vids.length; i += 50) {
      const ids = vids.slice(i, i + 50).map((v) => v.id).filter(Boolean).join(",");
      if (!ids) continue;
      const vd = await api("videos", { part: "contentDetails", id: ids });
      const dur: Record<string, number | null> = {};
      for (const it of vd.items || []) dur[it.id] = isoDur(it.contentDetails?.duration);
      vids.slice(i, i + 50).forEach((v) => { v.sec = dur[v.id] ?? null; });
    }
    return json({
      source: "api",
      channel: { id: c.id, title: c.snippet?.title || "", description: String(c.snippet?.description || "").slice(0, 400), since: (c.snippet?.publishedAt || "").slice(0, 10), total: Number(c.statistics?.videoCount || vids.length) },
      videos: vids.filter((v) => v.t && v.t !== "Private video" && v.t !== "Deleted video").map((v) => ({ t: v.t.slice(0, 120), d: v.d, sec: v.sec ?? null })),
    });
  } catch (e) {
    const code = String((e as Error)?.message || "");
    if (code === "yt_quota") return fail("yt_quota", 429);
    if (code === "yt_key") return fail("yt_not_configured", 503);
    return fail("yt_unavailable", 502);
  }
}

// ───────── delete_me ─────────
async function deleteMe(req: Request) {
  const user = await caller(req);
  if (!user) return fail("unauthorized", 401);
  const bucket = admin.storage.from("item-photos");
  for (let i = 0; i < 20; i++) {
    const { data: files } = await bucket.list(user.id, { limit: 100 });
    if (!files || !files.length) break;
    await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
    if (files.length < 100) break;
  }
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return fail("delete_failed", 500);
  return json({ ok: true });
}

// ───────── admin ─────────
async function adminReset(req: Request, b: any) {
  const user = await caller(req);
  if (!user) return fail("unauthorized", 401);
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return fail("forbidden", 403);
  const target = String(b.user_id || "");
  const pw = String(b.password || "");
  if (pw.length < 8) return fail("weak_password");
  const { error } = await admin.auth.admin.updateUserById(target, { password: pw });
  if (error) return fail("reset_failed", 500);
  return json({ ok: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("method_not_allowed", 405);
  let b: any = {};
  try { b = await req.json(); } catch (_) { return fail("bad_json"); }
  try {
    switch (b.action) {
      case "ping": return json({ ok: true, ai: !!Deno.env.get("ANTHROPIC_API_KEY"), yt: !!Deno.env.get("YOUTUBE_API_KEY") });
      case "youtube": return await youtube(req, b);
      case "join": return await join(b);
      case "ai": return await ai(req, b);
      case "delete_me": return await deleteMe(req);
      case "admin_reset_password": return await adminReset(req, b);
      default: return fail("unknown_action");
    }
  } catch (e) {
    console.error(e);
    return fail("server_error", 500);
  }
});
