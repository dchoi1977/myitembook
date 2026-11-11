"use strict";
/* MIB CBT · 구글 계정으로 읽기 — 본인이 구글 화면에서 직접 허락하면, 이 브라우저가 구글에서 바로 읽어 온다.
   읽기 전용 권한(캘린더·유튜브)만 청하고, 받은 출입증(토큰)은 서버에 보내지도 저장하지도 않으며 읽은 뒤 바로 반납한다.
   서버와 AI에는 요약만 간다. 운영자가 settings.google_client_id 를 넣어야 켜진다. */
LINK_SVCS.push({k:"g_calendar",n:"구글 캘린더",mono:"캘",col:"#4A7FC1",m:"google"});
LINK_SVCS.push({k:"g_youtube",n:"유튜브 · 구독과 좋아요",mono:"유",col:"#B04A45",m:"google",passive:true});
Object.assign(LINK_ERR,{g_not_ready:"구글 연동은 운영자가 준비 중이에요.",g_denied:"구글에서 허락하지 않았어요. 다시 시도하려면 버튼을 한 번 더 눌러 주세요.",g_load:"구글 로그인 창을 불러오지 못했어요. 연결을 확인하거나, 카카오톡 안이라면 브라우저(사파리·크롬)로 열어 주세요.",g_api:"구글에서 읽어오지 못했어요. 잠시 뒤 다시 시도해 주세요.",g_empty:"읽을 수 있는 기록이 없어요."});
const G_SCOPE={cal:"https://www.googleapis.com/auth/calendar.readonly",yt:"https://www.googleapis.com/auth/youtube.readonly"};
let gisP=null;
function loadGIS(){if(window.google&&google.accounts&&google.accounts.oauth2)return Promise.resolve();if(!gisP)gisP=new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";s.async=true;s.onload=()=>res();s.onerror=()=>{gisP=null;rej({code:"g_load"})};document.head.appendChild(s)});return gisP}
function gToken(clientId,scope){return new Promise((res,rej)=>{let done=false;try{const tc=google.accounts.oauth2.initTokenClient({client_id:clientId,scope,prompt:"",callback:r=>{done=true;if(r&&r.access_token)res(r);else rej({code:"g_denied"})},error_callback:()=>{if(!done)rej({code:"g_denied"})}});tc.requestAccessToken()}catch(e){rej({code:"g_load"})}})}
async function gGet(token,url){let r;try{r=await fetch(url,{headers:{Authorization:"Bearer "+token}})}catch(e){throw {code:"network"}}const j=await r.json().catch(()=>null);if(!r.ok||!j)throw {code:"g_api",status:r.status};return j}
async function gCalendar(token){
 const now=Date.now();const q=new URLSearchParams({timeMin:new Date(now-120*864e5).toISOString(),timeMax:new Date(now+30*864e5).toISOString(),singleEvents:"true",orderBy:"startTime",maxResults:"2500",fields:"items(summary,start,recurringEventId,status,eventType)"});
 const j=await gGet(token,"https://www.googleapis.com/calendar/v3/calendars/primary/events?"+q);
 const ev=(j.items||[]).filter(e=>e&&e.status!=="cancelled"&&e.start&&!["birthday","workingLocation","outOfOffice","fromGmail"].includes(e.eventType)).map(e=>({t:linkScrub(e.summary||"").slice(0,40),ts:Date.parse(e.start.dateTime||e.start.date),allDay:!e.start.dateTime,rid:e.recurringEventId||""})).filter(e=>Number.isFinite(e.ts));
 if(ev.length<3)throw {code:"g_empty"};
 const past=ev.filter(e=>e.ts<=now),timed=ev.filter(e=>!e.allDay);const weeks=120/7;
 const R={};ev.filter(e=>e.rid).forEach(e=>{(R[e.rid]=R[e.rid]||{t:e.t,n:0}).n++});const rec=Object.values(R).filter(r=>r.t&&r.n>=3).sort((a,b)=>b.n-a.n).slice(0,12);const recPw=Math.min(7,lkR1(past.filter(e=>e.rid).length/weeks));
 const byD=[0,0,0,0,0,0,0];timed.forEach(e=>byD[new Date(e.ts).getDay()]++);const DN="일월화수목금토";const busy=byD.map((n,i)=>[DN[i],n]).sort((a,b)=>b[1]-a[1]).slice(0,2).filter(x=>x[1]);
 const L=[`구글 캘린더 · 본인이 구글에서 직접 허락해 읽음 (지난 120일과 앞으로 30일)`,`규모: 일정 ${ev.length}건 · 주 평균 ${lkR1(past.length/weeks)}건 · 반복 일정이 주 ${recPw}건 · 종일 일정 ${ev.filter(e=>e.allDay).length}건`];
 if(timed.length>=5)L.push(trRhythm(timed.map(e=>e.ts)).join(" · ")+(busy.length?` · 일정이 몰리는 요일: ${busy.map(x=>x[0]).join(", ")}`:""));
 if(rec.length)L.push("반복되는 일정: "+rec.map(r=>`${r.t}(${r.n}회)`).join(", "));
 const one=ev.filter(e=>!e.rid&&e.t);const seen=new Set();const uniq=one.filter(e=>{if(seen.has(e.t))return false;seen.add(e.t);return true});
 const near=uniq.filter(e=>e.ts>now).slice(0,8),was=uniq.filter(e=>e.ts<=now).slice(-20).reverse();
 if(was.length){L.push("");L.push("지난 일정:");was.forEach(e=>L.push(`${lkYmd(e.ts)}  ${e.t}`))}
 if(near.length){L.push("");L.push("다가오는 일정:");near.forEach(e=>L.push(`${lkYmd(e.ts)}  ${e.t}`))}
 L.push("→ 반복되는 일정과 요일·시간대에서 생활의 계획성(structure)과 밀도(pace), 주당 반복(perWeek), 꾸준히 이어 가는 활동의 종류를 읽는다. 일정 제목에 나오는 다른 사람의 이름은 언급하지 않고, 참석자·장소·메모는 읽지 않았다.");
 return {id:"g_calendar",kind:"g_calendar",via:"google",ref:"",title:"구글 캘린더",n:ev.length,total:0,first:ev[0].ts,last:ev[ev.length-1].ts,years:0,pw:recPw,sum:`일정 ${ev.length}건 · 반복 주 ${recPw}건`,text:L.join("\n").slice(0,3200),at:now};
}
async function gYouTube(token){
 const subs=[];let pt="";for(let i=0;i<4;i++){const j=await gGet(token,"https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50&order=relevance"+(pt?"&pageToken="+pt:""));(j.items||[]).forEach(x=>{const t=linkScrub(x.snippet&&x.snippet.title||"").slice(0,40);if(t)subs.push(t)});pt=j.nextPageToken||"";if(!pt)break}
 let likes=[];try{const j=await gGet(token,"https://www.googleapis.com/youtube/v3/videos?part=snippet&myRating=like&maxResults=50");likes=(j.items||[]).map(x=>({t:linkScrub(x.snippet&&x.snippet.title||"").slice(0,70),c:linkScrub(x.snippet&&x.snippet.channelTitle||"").slice(0,24)})).filter(x=>x.t)}catch(e){}
 if(!subs.length&&!likes.length)throw {code:"g_empty"};
 const L=[`유튜브 · 본인이 구글에서 직접 허락해 읽음 (내가 구독한 채널과 좋아요를 누른 영상)`,`규모: 구독 채널 ${subs.length}${subs.length>=200?"개 이상":"개"} · 최근 좋아요 ${likes.length}편`];
 if(subs.length)L.push("구독 채널(자주 보는 순): "+subs.slice(0,70).join(", "));
 if(likes.length){L.push("");L.push("최근 좋아요를 누른 영상:");likes.slice(0,36).forEach(v=>L.push(`- ${v.t}${v.c?" — "+v.c:""}`))}
 L.push("→ 만드는 사람이 아니라 보는 사람으로서의 취향이다. 반복되는 갈래에서 관심 영역(domains)과 한 곳에 쏠린 정도(focus)를 읽는다. 조회수·구독자 수는 읽지 않았다.");
 return {id:"g_youtube",kind:"g_youtube",via:"google",ref:"",title:"유튜브 · 구독과 좋아요",n:subs.length+likes.length,total:0,first:null,last:null,years:0,pw:0,sum:`구독 ${subs.length}개 · 좋아요 ${likes.length}편`,text:L.join("\n").slice(0,3400),at:Date.now()};
}
LINK_VIA.google="구글에서 직접 읽음";
function GoogleSource({s,setDraft,toast}){
 const mine=linkList(s).filter(l=>linkSvc(l.kind).m==="google");const [cid,setCid]=useState(null);const [want,setWant]=useState({cal:true,yt:true});const [busy,setBusy]=useState(false);const [err,setErr]=useState("");const [note,setNote]=useState("");
 useEffect(()=>{let live=true;api.googleClientId().then(v=>{if(!live)return;setCid(v||"");if(v)loadGIS().catch(()=>{})});return()=>{live=false}},[]);
 async function go(){if(!cid||busy||(!want.cal&&!want.yt))return;setBusy(true);setErr("");setNote("구글 창에서 허락해 주세요…");let tok=null;
  try{const scope=[want.cal&&G_SCOPE.cal,want.yt&&G_SCOPE.yt].filter(Boolean).join(" ");/* 사파리는 누른 순간 바로 창을 열어야 팝업을 막지 않으므로, 준비돼 있으면 기다림 없이 연다 */const r=await((window.google&&google.accounts&&google.accounts.oauth2)?gToken(cid,scope):loadGIS().then(()=>gToken(cid,scope)));tok=r.access_token;const granted=String(r.scope||"");const got=[];let lastErr=null;
   if(want.cal&&(!granted||granted.includes(G_SCOPE.cal))){setNote("캘린더를 읽는 중…");try{const l=await gCalendar(tok);trPut(setDraft,l);got.push("캘린더")}catch(e){lastErr=e}}
   if(want.yt&&(!granted||granted.includes(G_SCOPE.yt))){setNote("유튜브를 읽는 중…");try{const l=await gYouTube(tok);trPut(setDraft,l);got.push("유튜브")}catch(e){lastErr=e}}
   if(got.length){toast(`구글 ${got.join("·")} · 읽었어요`);track("google_add",{got:got.join(",")})}if(!got.length||lastErr){if(!got.length)throw lastErr||{code:"g_empty"};setErr(`일부는 읽지 못했어요. ${LINK_ERR[lastErr.code]||""}`)}}
  catch(e){setErr(LINK_ERR[e&&e.code]||LINK_ERR.g_api);track("google_fail",{code:(e&&e.code)||"error"})}
  finally{if(tok){try{google.accounts.oauth2.revoke(tok,()=>{})}catch(e){}}setBusy(false);setNote("")}}
 return html`<div className="stack">
  <p className="small muted" style=${{margin:0}}>구글 화면에서 직접 허락하면 캘린더와 유튜브를 한 번에 읽어요. 읽기 전용이고, 비밀번호는 MIB가 볼 수 없어요.</p>
  <${TraceRows} links=${mine} setDraft=${setDraft}/>
  ${cid===""?html`<div className="panel tint small">구글 연동은 운영자가 준비 중이에요. 준비되면 여기에서 바로 쓸 수 있어요. 그동안은 '캘린더'에 일정을 붙여 넣거나, '계정 연결'의 유튜브 재생목록을 써 주세요.</div>`
  :html`<div className="stack">
   <label className="lk-mine"><input type="checkbox" checked=${want.cal} onChange=${e=>setWant(w=>({...w,cal:e.target.checked}))}/><span><b>캘린더</b> · 지난 넉 달과 앞으로 한 달의 일정 제목·시각·반복</span></label>
   <label className="lk-mine" style=${{marginTop:0}}><input type="checkbox" checked=${want.yt} onChange=${e=>setWant(w=>({...w,yt:e.target.checked}))}/><span><b>유튜브</b> · 구독한 채널 이름과 좋아요 누른 영상 제목</span></label>
   <div className="row"><button className="btn sm" disabled=${busy||cid==null||(!want.cal&&!want.yt)} onClick=${go}>${busy?"읽는 중…":mine.length?"구글에서 다시 읽기":"구글로 읽어오기"}</button></div>
   <span className="hint">'확인되지 않은 앱' 안내가 보이면 CBT 테스트 앱이라 그래요. '고급 → 이동'을 누르면 돼요. 허락받은 출입증은 읽은 직후 바로 반납하고 저장하지 않아요.</span></div>`}
  ${note&&busy&&html`<p className="small muted" role="status" style=${{margin:0}}>${note}</p>`}
  ${err&&html`<p className="err" role="alert" style=${{margin:0}}>${err}</p>`}
  <div className="reads"><b>읽는 것</b><span>일정 제목·시각·반복, 구독 채널 이름, 좋아요 누른 영상 제목</span><b>읽지 않음</b><span>참석자·장소·메모, 메일, 드라이브, 시청 기록, 댓글</span></div>
 </div>`;
}
