// MIB CBT · places near me — Kakao Local (when KAKAO_REST_KEY is set) or OpenStreetMap, plus places the person added.
// The device location is used for this one lookup and is never stored or logged.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";
const URL_ = Deno.env.get("SUPABASE_URL")!;
function secretKey(): string {
  try { const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"); if (keys && keys["default"]) return keys["default"]; } catch (_) { /* fall through */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
}
const admin = createClient(URL_, secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const fail = (code: string, status = 400) => json({ error: code }, status);
async function caller(req: Request) {
  const h = req.headers.get("authorization") || ""; const token = h.toLowerCase().startsWith("bearer ") ? h.slice(7) : "";
  if (!token) return null; const { data, error } = await admin.auth.getUser(token); if (error || !data?.user) return null;
  const { data: p } = await admin.from("profiles").select("id").eq("id", data.user.id).maybeSingle(); return p ? data.user : null;
}
const OVERPASS = ["https://overpass.kumi.systems/api/interpreter", "https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

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
  let j: any = null; const errs: string[] = [];
  // ask every mirror at once and take the first good answer
  try {
    j = await Promise.any(OVERPASS.map(async (ep) => {
      try {
        const r = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json", "User-Agent": "MIB-CBT/1.0 (https://dchoi1977.github.io/myitembook/)" }, body: "data=" + encodeURIComponent(query), signal: AbortSignal.timeout(8000) });
        if (!r.ok) throw new Error(`${new URL(ep).host}:${r.status}`);
        return await r.json();
      } catch (e) { errs.push(String((e as Error)?.message || (e as Error)?.name)); throw e; }
    }));
  } catch (_) { j = null; }
  const last = errs.join(" ");
  if (!j) return await photonNearby(lat, lng, q, last);
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
// Photon (komoot) — OSM-based, used when every Overpass mirror is busy
async function photonNearby(lat: number, lng: number, q: string, why: string) {
  const u = q ? `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&limit=30` : `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=40&radius=0.4`;
  const r = await fetch(u, { headers: { "Accept": "application/json", "User-Agent": "MIB-CBT/1.0 (https://dchoi1977.github.io/myitembook/)" }, signal: AbortSignal.timeout(7000) });
  if (!r.ok) throw new Error("osm" + why + " photon:" + r.status);
  const j = await r.json();
  const places = (j.features || []).map((f: any) => {
    const p = f.properties || {}; const [lo, la] = (f.geometry && f.geometry.coordinates) || [];
    if (!p.name || la == null) return null;
    if (/^(hospital|clinic|doctors|dentist|pharmacy|place_of_worship)$/.test(p.osm_value || "")) return null;
    if (!/^(amenity|shop|leisure|tourism|railway|public_transport|office|building|historic)$/.test(p.osm_key || "")) return null;
    const kv = `${p.osm_key}=${p.osm_value}`; const m = OSM_MAP.find(([re]) => re.test(kv));
    return { id: `o:${(p.osm_type || "n")[0].toLowerCase()}${p.osm_id}`, name: p.name, cat: m ? m[1] : "동네", sub: p.osm_value || "", addr: [p.street, p.housenumber].filter(Boolean).join(" "), dist: dist(lat, lng, la, lo), lat: la, lng: lo };
  }).filter(Boolean);
  const area = j.features && j.features[0] && j.features[0].properties ? [j.features[0].properties.district || j.features[0].properties.city || ""].join("") : "";
  return { places, area, source: "osm" };
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

// ───────── region of where I am right now (for "터전" check-in). Only the region names leave; coordinates are not stored ─────────
function pickRegion(vals: string[]) {
  const v = vals.filter((x) => typeof x === "string" && x.trim()).map((x) => x.trim());
  const sido = v.find((x) => /(특별시|광역시|특별자치시|특별자치도|도)$/.test(x)) || v.find((x) => /^(서울|부산|대구|인천|광주|대전|울산|세종|제주)$/.test(x)) || "";
  const gu = v.find((x) => x !== sido && /(구|군)$/.test(x) && !/(동|가)$/.test(x)) || v.find((x) => x !== sido && /시$/.test(x)) || "";
  const dong = v.find((x) => x !== gu && /(동|읍|면|가|리)$/.test(x)) || "";
  return { sido, gu, dong };
}
const UA = { "Accept": "application/json", "User-Agent": "MIB-CBT/1.0 (https://dchoi1977.github.io/myitembook/)" };
async function regionOf(lat: number, lng: number, debug = false) {
  const key = Deno.env.get("KAKAO_REST_KEY"); const dbg: any = {};
  if (key) {
    try {
      const u = new URL("https://dapi.kakao.com/v2/local/geo/coord2regioncode.json"); u.searchParams.set("x", String(lng)); u.searchParams.set("y", String(lat));
      const r = await fetch(u, { headers: { Authorization: `KakaoAK ${key}` }, signal: AbortSignal.timeout(6000) });
      if (r.ok) { const j = await r.json(); const h = (j.documents || []).find((x: any) => x.region_type === "H") || (j.documents || [])[0]; if (h) return { sido: h.region_1depth_name || "", gu: h.region_2depth_name || "", dong: h.region_3depth_name || "", source: "kakao" }; }
    } catch (_) { /* fall back */ }
  }
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=16&accept-language=ko`, { headers: UA, signal: AbortSignal.timeout(7000) });
    dbg.nominatim = r.status;
    if (r.ok) { const j = await r.json(); const a = j.address || {}; const vals = Object.entries(a).filter(([k]) => !/postcode|country|road|house|ISO/i.test(k)).map(([, v]) => String(v)); dbg.nparts = vals; const g = pickRegion(vals); if (g.sido || g.gu) return { ...g, source: "osm", ...(debug ? { dbg } : {}) }; }
  } catch (e) { dbg.nerr = String((e as Error)?.message || ""); }
  const r = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=3`, { headers: UA, signal: AbortSignal.timeout(7000) });
  if (!r.ok) throw new Error("region_" + r.status);
  const j = await r.json(); const props = (j.features || []).map((f: any) => f.properties || {});
  const vals: string[] = []; props.forEach((p: any) => { for (const k of ["state", "city", "county", "district", "locality", "name"]) if (p[k]) vals.push(String(p[k])); });
  dbg.pparts = vals; const g = pickRegion(vals);
  return { ...g, source: "osm", ...(debug ? { dbg } : {}) };
}
async function region(req: Request, b: any) {
  const user = await caller(req); if (!user) return fail("unauthorized", 401);
  const lat = Number(b.lat), lng = Number(b.lng);
  if (!isFinite(lat) || !isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return fail("bad_location");
  try { const r = await regionOf(lat, lng); if (!r.sido && !r.gu) return fail("region_unknown", 404); return json(r); } catch (e) { console.error("region", (e as Error)?.message); return fail("region_failed", 502); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return fail("method_not_allowed", 405);
  let b: any = {}; try { b = await req.json(); } catch (_) { return fail("bad_json"); }
  try {
    if (b.action === "health") { const key = Deno.env.get("KAKAO_REST_KEY"); try { const r = key ? await kakaoNearby(key, 37.5663, 126.9779, "") : await osmNearby(37.5663, 126.9779, ""); return json({ ok: true, source: r.source, n: r.places.length, area: r.area, sample: r.places.slice(0, 5).map((p: any) => p.name + "/" + p.cat) }); } catch (e) { return json({ ok: false, source: key ? "kakao" : "osm", error: String((e as Error)?.message || "") }); } }
    if (b.action === "region_health") { try { return json({ ok: true, ...(await regionOf(37.5006, 127.0366, true)) }); } catch (e) { return json({ ok: false, error: String((e as Error)?.message || "") }); } }
    if (b.action === "region") return await region(req, b);
    return await placesNearby(req, b);
  } catch (e) { console.error("places_fn", (e as Error)?.message); return fail("server_error", 500); }
});
