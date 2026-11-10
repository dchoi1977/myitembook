"use strict";
/* MIB CBT · 머무른 곳 — 기기 위치로 주변 장소를 찾아 오늘 머문 곳을 남김 (위치 좌표는 저장하지 않음) */

const PLACE_CATS=[["카페","☕"],["음식점","🍽"],["공원·자연","🌳"],["운동","🏃"],["배움","📚"],["문화","🎭"],["일터","💼"],["집","🏠"],["쇼핑","🛍"],["이동","🚉"],["여행","🧳"],["동네","📍"],["기타","✦"]];
const placeIcon=c=>(PLACE_CATS.find(x=>x[0]===c)||[0,"📍"])[1];
const PLACES_FN=()=>MIB_CONFIG.fn.replace(/mib-api$/,"mib-places");

async function placesNearby(lat,lng,q){
 const s=await api.session();const token=s&&s.access_token;
 const r=await fetch(PLACES_FN(),{method:"POST",headers:{"Content-Type":"application/json",apikey:MIB_CONFIG.key,...(token?{Authorization:"Bearer "+token}:{})},body:JSON.stringify({lat,lng,q:q||""})});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw Err(j.error||"places_failed");return j;
}
function getPosition(){return new Promise((res,rej)=>{if(!navigator.geolocation)return rej(Err("geo_unsupported"));navigator.geolocation.getCurrentPosition(p=>res({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy}),e=>rej(Err(e.code===1?"geo_denied":e.code===3?"geo_timeout":"geo_unavailable")),{enableHighAccuracy:true,timeout:12000,maximumAge:60000})})}
const GEO_MSG={geo_denied:"위치 권한이 꺼져 있어요. 브라우저 주소창의 자물쇠(또는 설정 › 개인정보 › 위치)에서 이 사이트의 위치를 허용해 주세요.",geo_timeout:"위치를 찾는 데 시간이 걸리고 있어요. 실내라면 창가에서 다시 시도해 보세요.",geo_unavailable:"지금은 위치를 알 수 없어요. 잠시 후 다시 시도해 주세요.",geo_unsupported:"이 브라우저는 위치를 지원하지 않아요."};

/* stats from stays (kept in app state; only the chosen place, never coordinates) */
function stayStats(st){const s=st.stays||[];const byPlace={};s.forEach(x=>{const k=x.place.id;(byPlace[k]=byPlace[k]||new Set()).add(x.day)});const cats={};s.forEach(x=>{cats[x.place.cat]=(cats[x.place.cat]||0)+1});
 return {stays:s.length,places:Object.keys(byPlace).length,regular:Math.max(0,...Object.values(byPlace).map(v=>v.size)),cats:Object.keys(cats).length,catCount:cats,newPlaces:s.filter(x=>x.place.mine).map(x=>x.place.id).filter((v,i,a)=>a.indexOf(v)===i).length}}

function StayCard({st,onOpen}){
 const t=dayKey();const today=(st.stays||[]).filter(s=>s.day===t);const ss=stayStats(st);
 return html`<div className="panel stack stay-card">
  <div className="row between"><b>오늘 머무른 곳</b><span className="small faint">${ss.places?`다녀간 곳 ${ss.places} · 갈래 ${ss.cats}`:"위치는 고를 때만 써요"}</span></div>
  ${today.length?html`<div className="stay-chips">${today.map(s=>html`<span key=${s.id} className="stay-chip"><span aria-hidden="true">${placeIcon(s.place.cat)}</span>${s.place.name}</span>`)}</div>`:html`<span className="small muted">지금 있는 곳 주변에서 골라 남겨 보세요. 머문 곳이 쌓이면 젬이 나의 일상을 더 잘 읽어요.</span>`}
  <div className="row"><button className="btn sm grow" onClick=${()=>onOpen("stay")}>📍 여기 머물렀어요</button>${(st.stays||[]).length>0&&html`<button className="btn ghost sm" onClick=${()=>onOpen("stays")}>나의 발자취</button>`}</div>
 </div>`;
}

function StaySheet({st,update,onClose,toast,demo,onOpen}){
 const [phase,setPhase]=useState("idle");const [pos,setPos]=useState(null);const [res,setRes]=useState(null);const [q,setQ]=useState("");const [err,setErr]=useState("");const [adding,setAdding]=useState(false);const [nf,setNf]=useState({name:"",cat:"기타"});
 const t=dayKey();const todayIds=(st.stays||[]).filter(s=>s.day===t).map(s=>s.place.id);
 async function locate(){setErr("");setPhase("locating");try{const p=await getPosition();setPos(p);setPhase("loading");const r=await placesNearby(p.lat,p.lng,"");setRes(r);setPhase("list");track("stay_lookup",{n:r.places.length,src:r.source})}catch(e){setErr(GEO_MSG[e.code]||"주변 장소를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");setPhase("error")}}
 async function search(e){e&&e.preventDefault();if(!pos)return;setPhase("loading");try{const r=await placesNearby(pos.lat,pos.lng,q.trim());setRes(r);setPhase("list")}catch(x){setErr("검색하지 못했어요.");setPhase("error")}}
 useEffect(()=>{locate()},[]);
 function pick(p){if(demo){toast("예시 모드에서는 저장하지 않아요.");return}if(todayIds.includes(p.id)){toast("오늘 이미 남긴 곳이에요.");return}
  const area=(res&&res.area)||"";update(s=>{s.stays=[...(s.stays||[]),{id:rid(),day:t,at:Date.now(),place:{id:p.id,name:p.name,cat:p.cat,sub:p.sub||"",area,mine:!!p.mine}}].slice(-400)});track("stay_add",{cat:p.cat,mine:!!p.mine});toast(`'${p.name}'에 머물렀다고 남겼어요.`);onClose()}
 async function addNew(){const name=nf.name.trim();if(!name||!pos)return;try{const r=await api.addMyPlace({name,cat:nf.cat,lat:+pos.lat.toFixed(3),lng:+pos.lng.toFixed(3)});pick({id:"m:"+r.id,name,cat:nf.cat,mine:true});track("place_new",{cat:nf.cat})}catch(e){toast("장소를 등록하지 못했어요.")}}
 const list=(res&&res.places)||[];
 return html`<${Sheet} title="여기 머물렀어요" onClose=${onClose}>
  <p className="small muted">지금 위치로 주변 장소를 찾아요. <b>내 위치 좌표는 저장하지 않고</b>, 고른 장소 이름과 갈래만 내 기록에 남아요. 기록은 나만 봅니다.</p>
  ${phase==="locating"&&html`<div className="stay-wait"><span className="pulse">📍</span>위치를 찾는 중… 브라우저가 위치 권한을 물으면 '허용'을 눌러 주세요.</div>`}
  ${phase==="loading"&&html`<div className="stay-wait"><span className="pulse">🧭</span>주변 장소를 불러오는 중…</div>`}
  ${phase==="error"&&html`<div className="panel tint stack small"><span>${err}</span><button className="btn sm" onClick=${locate}>다시 시도</button></div>`}
  ${pos&&html`<form className="row" onSubmit=${search} role="search"><input type="text" aria-label="장소 검색" placeholder="장소 이름으로 찾기 (예: 스타벅스, 도서관)" value=${q} onChange=${e=>setQ(e.target.value)} style=${{flex:1}}/><button className="btn sm" disabled=${phase==="loading"}>찾기</button></form>`}
  ${phase==="list"&&html`<div className="stack" style=${{gap:"6px"}}>
   <div className="row between"><b>${res.area?res.area+" 근처":"지금 있는 곳 근처"}</b><span className="small faint">${list.length}곳 · ${pos&&pos.acc?`오차 약 ${Math.round(pos.acc)}m`:""}</span></div>
   ${list.length?html`<div className="list stay-list">${list.map(p=>html`<button key=${p.id} className="list-row" onClick=${()=>pick(p)} disabled=${todayIds.includes(p.id)}><span className="stay-ic" aria-hidden="true">${placeIcon(p.cat)}</span><span className="grow"><span className="t">${p.name}</span><br/><span className="d">${p.cat}${p.sub&&p.sub!==p.cat?" · "+p.sub:""}${p.mine?" · 내가 등록":""}</span></span><span className="small faint">${p.dist<1000?p.dist+"m":(p.dist/1000).toFixed(1)+"km"}</span></button>`)}</div>`:html`<p className="small faint">근처에서 찾은 장소가 없어요. 이름으로 찾거나 직접 등록해 보세요.</p>`}
   <p className="note">장소 정보: ${res.source==="kakao"?"카카오맵":"OpenStreetMap 기여자"}</p>
  </div>`}
  ${pos&&onOpen&&html`<button className="btn quiet block" onClick=${()=>onOpen("identity:home")}>🏠 지금 이곳을 나의 터전(집·일터)으로 인증</button>`}
  ${pos&&(adding?html`<div className="panel stack"><b>목록에 없는 곳 직접 등록</b><span className="small muted">지금 있는 곳(약 100m 단위)에 이 이름으로 등록돼요. 나만 보는 장소라 '우리 집', '작업실'도 괜찮아요.</span>
    <div className="field" style=${{margin:0}}><label htmlFor="np-name">장소 이름</label><input type="text" id="np-name" maxLength="40" value=${nf.name} onChange=${e=>setNf({...nf,name:e.target.value})} placeholder="예) 우리 집, 동네 뒷산, 작업실"/></div>
    <div className="segs stay-cats" role="group" aria-label="갈래">${PLACE_CATS.map(([c,i])=>html`<button key=${c} aria-pressed=${nf.cat===c} onClick=${()=>setNf({...nf,cat:c})}>${i} ${c}</button>`)}</div>
    <div className="row"><button className="btn ghost sm grow" onClick=${()=>setAdding(false)}>취소</button><button className="btn sm grow" disabled=${!nf.name.trim()} onClick=${addNew}>등록하고 남기기</button></div></div>`
   :html`<button className="btn ghost block" onClick=${()=>setAdding(true)}>＋ 목록에 없는 곳 직접 등록</button>`)}
 <//>`;
}

function StaysSheet({st,update,onClose}){
 const s=[...(st.stays||[])].reverse();const ss=stayStats(st);const cats=Object.entries(ss.catCount).sort((a,b)=>b[1]-a[1]);const max=Math.max(1,...cats.map(c=>c[1]));
 const byDay={};s.forEach(x=>{(byDay[x.day]=byDay[x.day]||[]).push(x)});
 return html`<${Sheet} title="나의 발자취" onClose=${onClose}>
  <div className="kpis stay-kpis"><div><b>${ss.places}</b><span>다녀간 곳</span></div><div><b>${ss.cats}</b><span>머문 갈래</span></div><div><b>${ss.regular}</b><span>단골 (같은 곳 다른 날)</span></div></div>
  ${cats.length>0&&html`<div className="stack" style=${{gap:"6px"}}><b>어디서 시간을 보냈나</b>${cats.map(([c,n])=>html`<div key=${c} className="stay-bar"><span>${placeIcon(c)} ${c}</span><span className="bar"><i style=${{width:(n/max*100)+"%"}}></i></span><span className="small faint">${n}</span></div>`)}</div>`}
  <p className="small muted">머문 곳의 갈래는 다시 읽기 때 AI가 나의 일상 리듬을 읽는 근거가 되고, 활동한 날로 쳐서 젬의 강(剛)을 키워요. 기기 위치 좌표는 저장하지 않고, 직접 등록한 장소만 대략적인 위치(약 100m 단위)를 나만 보게 저장해요.</p>
  <div className="stack">${Object.entries(byDay).map(([d,arr])=>html`<div key=${d} className="stack" style=${{gap:"6px"}}><span className="small faint">${d}</span>${arr.map(x=>html`<div key=${x.id} className="row stay-row"><span className="stay-ic" aria-hidden="true">${placeIcon(x.place.cat)}</span><span className="grow"><b>${x.place.name}</b><br/><span className="small faint">${x.place.cat}${x.place.area?" · "+x.place.area:""}</span></span><button className="linkbtn small" onClick=${()=>update(st2=>{st2.stays=(st2.stays||[]).filter(y=>y.id!==x.id)})} aria-label=${x.place.name+" 기록 지우기"}>지우기</button></div>`)}</div>`)}</div>
 <//>`;
}
