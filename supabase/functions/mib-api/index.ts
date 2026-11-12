// MIB CBT API — join (invite-gated sign-up), ai (Claude proxy with daily cap),
// youtube (official Data API), delete_me (full account erase), admin_reset_password.
// verify_jwt is off: join is public; every other action checks the caller's JWT here.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import nodemailer from "npm:nodemailer@6.9.16";

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
  const consent = { terms: true, privacy: true, ai: true, research: !!agree.research, at: new Date().toISOString(), version: String(agree.version || "cbt-1").slice(0, 12) };
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
    max_tokens: task === "read" ? 8000 : Math.min(4000, Math.max(600, Number(b.max) || (images.length ? 3000 : 2000))),
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
  for (const name of ["item-photos", "avatars", "feedback-shots"]) {
    const bucket = admin.storage.from(name);
    for (let i = 0; i < 20; i++) {
      const { data: files } = await bucket.list(user.id, { limit: 100 });
      if (!files || !files.length) break;
      await bucket.remove(files.map((f) => `${user.id}/${f.name}`));
      if (files.length < 100) break;
    }
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


// ───────── operator alerts (Gmail SMTP, port 465 — 25/587 are blocked on Edge) ─────────
const esc = (t: unknown) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const shortUA = (ua: string) => {
  ua = ua || "";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : "기타";
  const br = /KAKAOTALK/i.test(ua) ? "카카오톡" : /NAVER/i.test(ua) ? "네이버앱" : /Instagram/i.test(ua) ? "인스타그램" : /SamsungBrowser/.test(ua) ? "삼성인터넷" : /CriOS|Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : /Firefox/.test(ua) ? "Firefox" : "브라우저";
  return `${os} · ${br}`;
};
function mailer() {
  const user = Deno.env.get("GMAIL_USER"), pass = (Deno.env.get("GMAIL_APP_PASSWORD") || "").replace(/\s+/g, "");
  if (!user || !pass) return null;
  return { user, t: nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } }) };
}
const APP_URL = "https://dchoi1977.github.io/myitembook/";
function frame(title: string, inner: string) {
  return `<div style="font-family:-apple-system,'Apple SD Gothic Neo','Noto Sans KR',sans-serif;max-width:620px;margin:0 auto;color:#1F2A28">
  <div style="background:#173D3B;color:#F4F1E9;padding:14px 18px;border-radius:12px 12px 0 0"><b style="font-size:16px">MIB CBT 1기 · 운영 알림</b><br><span style="font-size:13px;opacity:.85">${esc(title)}</span></div>
  <div style="border:1px solid #D6DACF;border-top:0;border-radius:0 0 12px 12px;padding:14px 18px">${inner}
  <p style="font-size:12px;color:#6B7570;margin-top:18px">운영 콘솔에서 전체 내용을 볼 수 있어요 → <a href="${APP_URL}">${APP_URL}</a></p></div></div>`;
}
async function alerts() {
  const m = mailer();
  const { data: cfg } = await admin.rpc("alert_cfg_internal");
  if (!m || !cfg?.enabled) return json({ ok: true, skipped: true });
  const { data: claimed } = await admin.rpc("alert_claim");
  const rows = (claimed || []) as { kind: string; ref: number }[];
  if (!rows.length) return json({ ok: true, sent: 0 });
  const fbIds = rows.filter((r) => r.kind === "feedback").map((r) => r.ref);
  const erIds = rows.filter((r) => r.kind === "app_errors").map((r) => r.ref);
  const fbs = fbIds.length ? ((await admin.from("feedback").select("*").in("id", fbIds)).data || []) : [];
  const ers = erIds.length ? ((await admin.from("app_errors").select("*").in("id", erIds).order("id")).data || []) : [];
  const uids = [...new Set([...fbs.map((f: any) => f.user_id), ...ers.map((e: any) => e.user_id)].filter(Boolean))];
  const { data: profs } = uids.length ? await admin.from("profiles").select("id,nickname").in("id", uids) : { data: [] };
  const nick = (id: string) => (profs || []).find((p: any) => p.id === id)?.nickname || (id ? "(탈퇴)" : "로그인 전");
  // the same error is mailed once per 6 hours
  const groups: Record<string, any[]> = {};
  for (const e of ers) (groups[e.sig] ||= []).push(e);
  const freshErr: any[][] = [];
  for (const [sig, list] of Object.entries(groups)) {
    const { data: seen } = await admin.rpc("alert_seen_recent", { p_sig: sig, p_before: list[0].created_at });
    if (!seen) freshErr.push(list);
  }
  if (!fbs.length && !freshErr.length) return json({ ok: true, sent: 0 });
  const attachments: any[] = [];
  let html = "";
  for (const f of fbs as any[]) {
    const p = f.payload || {};
    const label = f.kind === "exit" ? `마무리 설문 · 추천 ${f.rating ?? "-"}점` : `${p.type || "의견"} · ${esc(f.screen || "")}`;
    let shot = "";
    if (f.shot) {
      const { data: blob } = await admin.storage.from("feedback-shots").download(f.shot);
      if (blob) { const cid = `shot${f.id}@mib`; attachments.push({ filename: `screen-${f.id}.jpg`, content: new Uint8Array(await blob.arrayBuffer()), cid }); shot = `<br><img src="cid:${cid}" style="max-width:260px;border:1px solid #D6DACF;border-radius:8px;margin-top:6px">`; }
    }
    const extra = f.kind === "exit" ? `<br><b>좋았던 순간</b> ${esc(p.best || "—")}<br><b>아쉬운 점</b> ${esc(p.worst || "—")}` : "";
    html += `<div style="padding:10px 0;border-bottom:1px solid #EEE"><b>💬 ${esc(nick(f.user_id))}</b> <span style="color:#A87B2A">${label}</span><br>
      <span style="font-size:12px;color:#6B7570">${new Date(f.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} · ${esc(shortUA(p.ua || ""))}${p.w ? ` · 폭 ${p.w}px` : ""}</span>
      ${f.body ? `<p style="white-space:pre-wrap;margin:6px 0">${esc(f.body)}</p>` : ""}${extra}${shot}</div>`;
  }
  for (const list of freshErr) {
    const e = list[list.length - 1];
    html += `<div style="padding:10px 0;border-bottom:1px solid #EEE"><b>⚠️ 앱 오류</b> <span style="color:#9A3B2E">${esc(e.message)}</span><br>
      <span style="font-size:12px;color:#6B7570">${esc(nick(e.user_id))} · 화면 ${esc(e.screen || "-")} · ${esc(shortUA(e.ua || ""))} · 버전 ${esc(e.ver || "-")}${list.length > 1 ? ` · ${list.length}회` : ""}</span>
      ${e.stack ? `<pre style="font-size:11px;background:#F6F4EE;padding:8px;border-radius:6px;white-space:pre-wrap;max-height:180px;overflow:hidden">${esc(String(e.stack).slice(0, 900))}</pre>` : ""}</div>`;
  }
  const parts = [fbs.length ? `의견 ${fbs.length}` : "", freshErr.length ? `오류 ${freshErr.length}` : ""].filter(Boolean).join(" · ");
  const first = fbs[0] as any;
  const subj = `[MIB CBT] ${parts}${first ? ` — ${nick(first.user_id)}: ${String(first.body || (first.payload || {}).type || "").slice(0, 30)}` : ""}`;
  try {
    await m.t.sendMail({ from: `MIB CBT 알림 <${m.user}>`, to: cfg.email || m.user, subject: subj, html: frame(parts, html), attachments });
  } catch (e) {
    console.error("mail", (e as Error)?.message);
    // put them back so the next event retries
    await admin.from("alert_queue").update({ sent_at: null }).in("ref", [...fbIds, ...erIds]).gte("created_at", new Date(Date.now() - 3600e3).toISOString());
    return fail("mail_failed", 502);
  }
  return json({ ok: true, sent: 1 });
}
async function alertTest(req: Request) {
  const user = await caller(req);
  if (!user) return fail("unauthorized", 401);
  const { data: me } = await admin.from("profiles").select("role,nickname").eq("id", user.id).maybeSingle();
  if (me?.role !== "admin") return fail("forbidden", 403);
  const m = mailer();
  if (!m) return fail("mail_not_configured", 503);
  const { data: cfg } = await admin.rpc("alert_cfg_internal");
  try {
    await m.t.sendMail({ from: `MIB CBT 알림 <${m.user}>`, to: cfg?.email || m.user, subject: "[MIB CBT] 알림 연결 확인", html: frame("테스트 메일", `<p>${esc(me.nickname)}님, 운영 알림이 이 주소로 잘 연결되었습니다.</p><p style="font-size:13px;color:#6B7570">새 의견·마무리 설문·앱 오류가 생기면 바로 메일이 옵니다. 같은 오류는 6시간에 한 번만 알려 드려요.</p>`) });
  } catch (e) {
    const msg = String((e as Error)?.message || "");
    console.error("mail test", msg);
    return fail(/535|Username and Password|BadCredentials/i.test(msg) ? "mail_auth" : "mail_failed", 502);
  }
  return json({ ok: true, to: cfg?.email || m.user });
}
// errors from people who are not signed in yet (gate screen)
async function clientError(b: any) {
  const msg = String(b.message || "").slice(0, 600);
  if (!msg) return fail("empty");
  await admin.from("app_errors").insert({ user_id: null, sig: String(b.sig || msg).slice(0, 200), message: msg, stack: String(b.stack || "").slice(0, 3000), screen: String(b.screen || "").slice(0, 60), ua: String(b.ua || "").slice(0, 200), ver: String(b.ver || "").slice(0, 20) });
  return json({ ok: true });
}

// ───────── places near me (device location is used for this lookup only, never stored) ─────────
const KAKAO_CATS: [string, string][] = [["CE7", "카페"], ["FD6", "음식점"], ["CT1", "문화"], ["AT4", "여행"], ["SW8", "이동"], ["CS2", "쇼핑"], ["MT1", "쇼핑"], ["AC5", "배움"], ["SC4", "배움"], ["AD5", "여행"], ["PO3", "동네"]];
function refineCat(base: string, detail: string) {
  if (/공원|산|숲|하천|해수욕장|호수|정원|수목원/.test(detail)) return "공원·자연";
  if (/도서관|서점/.test(detail)) return "배움";
  if (/헬스|체육|스포츠|요가|필라테스|수영|클라이밍|골프|볼링|당구/.test(detail)) return "운동";
  if (/병원|의원|약국|치과|한의원/.test(detail)) return "";
  return base;
}
const dist = (a: number, b: number, c: number, d: number) => { const R = 6371000, r = Math.PI / 180; const x = (d - b) * r * Math.cos(((a + c) / 2) * r), y = (c - a) * r; return Math.round(Math.sqrt(x * x + y * y) * R); };
async function kakaoNearby(key: string, lat: number, lng: number, q: string) {
  const H = { Authorization: `KakaoAK ${key}` };
  const call = async (path: string, params: Record<string, string>) => { const u = new URL("https://dapi.kakao.com/v2/local/" + path); for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v); const r = await fetch(u, { headers: H }); if (!r.ok) throw new Error("kakao_" + r.status); return r.json(); };
  const base = { x: String(lng), y: String(lat), sort: "distance", size: "15" };
  const out: any[] = [];
  if (q) {
    const j = await call("search/keyword.json", { ...base, query: q.slice(0, 40), radius: "3000" });
    for (const d of j.documents || []) out.push({ d, cat: "" });
  } else {
    const all = await Promise.all(KAKAO_CATS.map(([c, name]) => call("search/category.json", { ...base, category_group_code: c, radius: "400" }).then((j) => (j.documents || []).map((d: any) => ({ d, cat: name }))).catch(() => [])));
    all.forEach((l) => out.push(...l));
  }
  let area = "";
  try { const g = await call("geo/coord2regioncode.json", { x: String(lng), y: String(lat) }); const h = (g.documents || []).find((x: any) => x.region_type === "H") || (g.documents || [])[0]; area = h ? `${h.region_2depth_name} ${h.region_3depth_name}`.trim() : ""; } catch (_) { /* optional */ }
  const places = out.map(({ d, cat }) => {
    const detail = String(d.category_name || "");
    const c = refineCat(cat || (detail.split(">")[0] || "").trim() || "동네", detail);
    return c ? { id: "k:" + d.id, name: d.place_name, cat: c, sub: detail.split(">").slice(-1)[0]?.trim() || "", addr: d.road_address_name || d.address_name || "", dist: Number(d.distance) || dist(lat, lng, +d.y, +d.x), lat: +d.y, lng: +d.x } : null;
  }).filter(Boolean);
  return { places, area, source: "kakao" };
}
const OSM_MAP: [RegExp, string][] = [[/^amenity=(cafe)$/, "카페"], [/^amenity=(restaurant|fast_food|bar|pub|food_court|ice_cream|biergarten)$/, "음식점"], [/^amenity=(library)$/, "배움"], [/^amenity=(school|university|college|kindergarten|language_school)$/, "배움"], [/^amenity=(arts_centre|cinema|theatre|community_centre)$/, "문화"], [/^leisure=(park|garden|nature_reserve)$/, "공원·자연"], [/^leisure=(fitness_centre|sports_centre|stadium|swimming_pool|pitch)$/, "운동"], [/^tourism=/, "여행"], [/^shop=/, "쇼핑"], [/^(railway|public_transport)=(station|stop_position|platform)$/, "이동"], [/^amenity=(townhall|post_office|marketplace)$/, "동네"]];
async function osmNearby(lat: number, lng: number, q: string) {
  const r0 = q ? 1500 : 250;
  const nameF = q ? `["name"~"${q.replace(/["\\]/g, "").slice(0, 30)}",i]` : `["name"]`;
  const query = `[out:json][timeout:12];(nwr(around:${r0},${lat},${lng})${nameF}["amenity"];nwr(around:${r0},${lat},${lng})${nameF}["shop"];nwr(around:${r0},${lat},${lng})${nameF}["leisure"];nwr(around:${r0},${lat},${lng})${nameF}["tourism"];nwr(around:${r0},${lat},${lng})${nameF}["railway"="station"];);out center 80;`;
  const r = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "MIB-CBT/1.0 (myitembook)" }, body: "data=" + encodeURIComponent(query) });
  if (!r.ok) throw new Error("osm_" + r.status);
  const j = await r.json();
  const places = (j.elements || []).map((e: any) => {
    const t = e.tags || {}; const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
    if (!t.name || la == null) return null;
    if (/^(hospital|clinic|doctors|dentist|pharmacy|place_of_worship)$/.test(t.amenity || "")) return null;
    let cat = "";
    for (const k of ["amenity", "leisure", "tourism", "shop", "railway", "public_transport"]) { if (!t[k]) continue; const kv = `${k}=${t[k]}`; const m = OSM_MAP.find(([re]) => re.test(kv)); if (m) { cat = m[1]; break; } }
    if (!cat) cat = "동네";
    return { id: `o:${e.type[0]}${e.id}`, name: t["name:ko"] || t.name, cat, sub: t.cuisine || t.amenity || t.shop || t.leisure || t.tourism || "", addr: [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" "), dist: dist(lat, lng, la, lo), lat: la, lng: lo };
  }).filter(Boolean);
  return { places, area: "", source: "osm" };
}
async function placesNearby(req: Request, b: any) {
  const user = await caller(req);
  if (!user) return fail("unauthorized", 401);
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail("bad_location");
  const q = String(b.q || "").trim().slice(0, 40);
  let res: any = { places: [], area: "", source: "" };
  const key = Deno.env.get("KAKAO_REST_KEY");
  try { res = key ? await kakaoNearby(key, lat, lng, q) : await osmNearby(lat, lng, q); }
  catch (e) { console.error("places", (e as Error)?.message); if (key) { try { res = await osmNearby(lat, lng, q); } catch (_) { /* both failed */ } } }
  // my own places within ~2km
  const dLat = 0.018, dLng = 0.023;
  const { data: mine } = await admin.from("my_places").select("id,name,cat,lat,lng").eq("owner", user.id).gte("lat", lat - dLat).lte("lat", lat + dLat).gte("lng", lng - dLng).lte("lng", lng + dLng).limit(50);
  const own = (mine || []).filter((p: any) => !q || p.name.includes(q)).map((p: any) => ({ id: "m:" + p.id, name: p.name, cat: p.cat, sub: "내가 등록한 곳", addr: "", dist: dist(lat, lng, p.lat, p.lng), mine: true }));
  const seen = new Set<string>();
  const list = [...own, ...res.places].filter((p: any) => { const k = p.name + "|" + Math.round(p.dist / 30); if (seen.has(k)) return false; seen.add(k); return true; }).sort((a: any, b2: any) => (a.mine && a.dist < 200 ? -1 : 0) - (b2.mine && b2.dist < 200 ? -1 : 0) || a.dist - b2.dist).slice(0, 60).map(({ lat: _a, lng: _b, ...p }: any) => p);
  return json({ places: list, area: res.area, source: res.source || (key ? "kakao" : "osm") });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("method_not_allowed", 405);
  let b: any = {};
  try { b = await req.json(); } catch (_) { return fail("bad_json"); }
  try {
    switch (b.action) {
      case "ping": return json({ ok: true, ai: !!Deno.env.get("ANTHROPIC_API_KEY"), yt: !!Deno.env.get("YOUTUBE_API_KEY"), mail: !!(Deno.env.get("GMAIL_USER") && Deno.env.get("GMAIL_APP_PASSWORD")), places: Deno.env.get("KAKAO_REST_KEY") ? "kakao" : "osm" });
      case "places_nearby": return await placesNearby(req, b);
      case "places_health": { const key = Deno.env.get("KAKAO_REST_KEY"); try { const r = key ? await kakaoNearby(key, 37.5663, 126.9779, "") : await osmNearby(37.5663, 126.9779, ""); return json({ ok: true, source: r.source, n: r.places.length, area: r.area }); } catch (e) { return json({ ok: false, source: key ? "kakao" : "osm", error: String((e as Error)?.message || "") }); } }
      case "alerts": return await alerts();
      case "alert_test": return await alertTest(req);
      case "client_error": return await clientError(b);
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
