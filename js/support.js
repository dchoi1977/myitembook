"use strict";
/* MIB CBT · 테스터 지원 — 오류 자동 보고, 화면이 깨졌을 때의 안전망, 새 버전 알림, 인앱 브라우저 안내, 도움말 */

const APP_VER=(()=>{try{const s=[...document.scripts].map(x=>x.src).find(x=>/app\.js\?v=/.test(x));return (s&&s.match(/v=(\w+)/)[1])||"dev"}catch(e){return "dev"}})();
const curScreen={v:"boot"};

/* ── error reporting: the same error is sent once per session, at most 20 per session ── */
const errReporter={sent:new Set(),n:0,uid:null,
 sig(msg,stack){const top=String(stack||"").split("\n").find(l=>/\.js/.test(l))||"";return (String(msg).slice(0,120)+"|"+top.replace(/\?v=\w+/,"").replace(/:\d+:\d+\)?$/,"").trim().slice(-80)).slice(0,200)},
 report(err,ctx){try{
  const msg=String((err&&err.message)||err||"알 수 없는 오류").slice(0,600);
  if(/ResizeObserver loop|Script error\.?$|AbortError|The user aborted|Load failed$/i.test(msg))return;
  const stack=String((err&&err.stack)||"").slice(0,3000);const sig=(ctx&&ctx.sig)||this.sig(msg,stack);
  if(this.sent.has(sig)||this.n>=20)return;this.sent.add(sig);this.n++;
  const row={sig,message:(ctx&&ctx.prefix?ctx.prefix+" · ":"")+msg,stack,screen:String(curScreen.v).slice(0,60),ua:navigator.userAgent.slice(0,200),ver:APP_VER};
  if(this.uid)sb.from("app_errors").insert(row).then(()=>{},()=>{});
  else fetch(MIB_CONFIG.fn,{method:"POST",headers:{"Content-Type":"application/json",apikey:MIB_CONFIG.key},body:JSON.stringify({action:"client_error",...row})}).catch(()=>{});
 }catch(e){}}
};
const reportError=(e,ctx)=>errReporter.report(e,ctx);
window.addEventListener("error",e=>{if(e&&e.target&&e.target!==window&&(e.target.src||e.target.href)){reportError(new Error("리소스를 불러오지 못함: "+(e.target.src||e.target.href)),{sig:"res|"+(e.target.src||e.target.href)});return}reportError(e.error||e.message)},true);
window.addEventListener("unhandledrejection",e=>{const r=e.reason;if(r&&r.code&&/^(network|unauthorized|daily_limit|rate_limited|yt_|invalid_|code_used|nickname_taken|email_taken|weak_password|consent_required|full|PGRST116)/.test(String(r.code)))return;reportError(r||"Promise 거부")});
(window.__mibEarlyErr||[]).forEach(e=>reportError(e));window.__mibEarlyErr=null;

/* ── when a screen crashes: a calm fallback instead of a white page ── */
class ErrorBoundary extends React.Component{
 constructor(p){super(p);this.state={err:null}}
 static getDerivedStateFromError(err){return {err}}
 componentDidCatch(err,info){reportError(err,{prefix:"화면 오류"});try{track("crash",{screen:curScreen.v})}catch(e){}}
 render(){if(!this.state.err)return this.props.children;
  return html`<div className="crash wrap"><div className="stack" style=${{alignItems:"center",textAlign:"center",gap:"14px"}}>
   <div className="crash-gem" dangerouslySetInnerHTML=${{__html:gemSVG({stone:"수정",form:"덩이",texture:"맑음",light:"번짐",facets:7,hardness:2},"crash","cr")}}></div>
   <h1 className="h2">잠깐 젬이 흔들렸어요</h1>
   <p className="muted">화면을 그리다 문제가 생겼어요. 운영자에게 자동으로 알렸고, 지금까지 남긴 기록은 안전합니다.</p>
   <button className="btn block" onClick=${()=>location.reload()}>새로고침</button>
   <button className="btn ghost block" onClick=${()=>this.setState({err:null})}>이전 화면으로 돌아가기</button>
  </div></div>`}
}

/* ── a new version was published: offer a refresh (GitHub Pages caches for a while) ── */
function useNewVersion(){
 const [nv,setNv]=useState(false);
 useEffect(()=>{if(APP_VER==="dev"||location.protocol==="file:")return;let alive=true;
  const check=async()=>{if(document.visibilityState!=="visible")return;try{const r=await fetch(location.pathname+"?_="+Date.now(),{cache:"no-store"});const t=await r.text();const m=t.match(/js\/app\.js\?v=(\w+)/);if(alive&&m&&m[1]!==APP_VER)setNv(true)}catch(e){}};
  const t=setInterval(check,5*60000);document.addEventListener("visibilitychange",check);setTimeout(check,20000);
  return()=>{alive=false;clearInterval(t);document.removeEventListener("visibilitychange",check)}},[]);
 return nv;
}
function NewVersionBar(){return html`<button className="topbar-note" onClick=${()=>location.reload()}><b>새 버전이 나왔어요</b> · 탭해서 새로고침</button>`}

/* ── in-app browsers (KakaoTalk, Instagram, Naver …) ── */
const INAPP=(()=>{const ua=navigator.userAgent||"";if(/KAKAOTALK/i.test(ua))return "kakao";if(/Instagram|FBAN|FBAV|Line\/|NAVER\(inapp|DaumApps|everytimeApp|BAND\//i.test(ua))return "other";return null})();
function openExternal(){const url=location.href;if(INAPP==="kakao"){location.href="kakaotalk://web/openExternal?url="+encodeURIComponent(url);return}
 if(/Android/i.test(navigator.userAgent)){location.href="intent://"+url.replace(/^https?:\/\//,"")+"#Intent;scheme=https;package=com.android.chrome;end";return}
 try{navigator.clipboard.writeText(url)}catch(e){}alert("주소를 복사했어요. Safari를 열고 주소창에 붙여 넣어 주세요.")}
function InAppBar(){const [hide,setHide]=useState(()=>{try{return sessionStorage.getItem("mib_inapp_hide")==="1"}catch(e){return false}});
 if(!INAPP||hide)return null;
 return html`<div className="topbar-note warn" role="note"><span><b>${INAPP==="kakao"?"카카오톡":"앱"} 안에서 열렸어요.</b> 사진 올리기와 로그인 유지가 불안정할 수 있어요.</span><span className="row" style=${{gap:"6px",flexWrap:"nowrap"}}><button className="btn sm" onClick=${openExternal}>${/iPhone|iPad/i.test(navigator.userAgent)&&INAPP!=="kakao"?"주소 복사":"브라우저로 열기"}</button><button className="linkbtn small" onClick=${()=>{setHide(true);try{sessionStorage.setItem("mib_inapp_hide","1")}catch(e){}}} aria-label="안내 닫기">닫기</button></span></div>`}

/* ── help & FAQ ── */
const FAQ=[
 ["CBT는 어떻게 참여하나요?","7일 동안 하루 5분이면 충분해요. 첫날 1분짜리 '빠른 시작'으로 젬을 만들고, 매일 '한 걸음'이나 '오늘의 한 줄' 하나만 남겨 주세요. 미션은 홈 화면에 하루씩 열립니다."],
 ["홈 화면에 앱처럼 두려면?","iPhone은 Safari 아래쪽 공유 버튼 → '홈 화면에 추가', 갤럭시는 Chrome 메뉴(⋮) → '홈 화면에 추가'를 눌러 주세요. 카카오톡 안에서는 추가가 안 되니 먼저 브라우저로 열어 주세요."],
 ["비밀번호를 잊어버렸어요","이메일 인증 없이 운영되는 테스트라 운영자가 임시 비밀번호를 만들어 드려요. 아래 '의견 보내기'나 운영 채팅방으로 닉네임을 알려 주세요."],
 ["사진이 안 올라가요","카카오톡·인스타그램 안 브라우저에서는 사진 선택이 막힐 수 있어요. 위쪽 '브라우저로 열기'를 누르거나 Safari/Chrome에서 열어 주세요. 사진은 자동으로 줄여서 올려요."],
 ["젬이 왜 이렇게 나왔나요?","'나' 탭 → '이렇게 읽은 이유'에서 근거를, '젬의 8가지 속성'에서 계산 방식을 볼 수 있어요. 다르다고 느끼면 '내 말로 다듬기'나 '새 기록 더하기'로 바꿀 수 있어요."],
 ["젬이 안 바뀌어요","젬은 활동한 날(3·7·21일), 다시 읽기, 친구·공감·방문 같은 조건이 채워질 때 바뀌어요. '나' 탭의 다음 단계 안내와 '업적 도감'에서 남은 조건을 확인해 보세요."],
 ["내 기록은 누가 보나요?","원문 기록은 나만 봅니다. 카드는 내가 '공개'를 켠 항목만, 고른 범위(친구/1기 전체)에만 보여요. 운영자는 통계와 의견만 봅니다."],
 ["AI가 몇 번까지 되나요?","해석·다듬기 등 AI 기능은 1인 하루 40회까지예요. 넘으면 다음 날 다시 열립니다."],
 ["화면이 이상하거나 멈췄어요","먼저 새로고침해 주세요. 그래도 같으면 '의견 보내기 → 오류'로 알려 주세요. 화면 캡처가 함께 가서 바로 확인할 수 있어요. 앱 오류는 자동으로도 운영자에게 전달됩니다."],
 ["그만두거나 내 데이터를 지우려면?","오른쪽 위 데이터 아이콘 → '계정과 기록 모두 지우기'로 언제든 바로 지울 수 있어요. CBT가 끝나면 30일 안에 모든 기록을 지웁니다."]
];
function HelpSheet({onClose,onFeedback,supportUrl}){
 const [open,setOpen]=useState(null);
 useEffect(()=>{track("open_help")},[]);
 return html`<${Sheet} title="도움말" onClose=${onClose}>
  <div className="panel stack small"><b>막히면 이렇게 알려 주세요</b><span className="muted">어느 화면에서든 오른쪽 아래 <b>의견</b> 버튼 → '오류'를 고르면 지금 화면 캡처와 함께 운영자에게 바로 전달돼요.</span>
   <div className="row"><button className="btn sm grow" onClick=${onFeedback}>의견 보내기</button>${supportUrl&&html`<a className="btn ghost sm grow" href=${supportUrl} target="_blank" rel="noopener">운영 채팅방</a>`}</div></div>
  <div className="faq">${FAQ.map(([q,a],i)=>html`<div key=${i} className="faq-item"><button className="faq-q" aria-expanded=${open===i} onClick=${()=>setOpen(open===i?null:i)}><span>${q}</span><span className="chev">${open===i?"−":"+"}</span></button>${open===i&&html`<p className="faq-a">${a}</p>`}</div>`)}</div>
  <p className="small faint center">버전 ${APP_VER} · ${MIB_CONFIG.cohort}</p>
 <//>`;
}

/* ── screenshot for feedback (html2canvas, loaded only when needed) ── */
let h2cP=null;
function loadH2C(){if(window.html2canvas)return Promise.resolve(window.html2canvas);if(!h2cP)h2cP=new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";s.onload=()=>res(window.html2canvas);s.onerror=()=>{h2cP=null;rej(new Error("h2c"))};document.head.appendChild(s)});return h2cP}
async function captureScreen(){
 const h2c=await loadH2C();const root=document.getElementById("root");
 const bg=getComputedStyle(document.body).backgroundColor||"#F4F1E9";
 const c=await h2c(root,{backgroundColor:bg,scale:Math.min(1.5,window.devicePixelRatio||1),x:window.scrollX,y:window.scrollY,width:window.innerWidth,height:window.innerHeight,windowWidth:window.innerWidth,windowHeight:window.innerHeight,logging:false,useCORS:true,ignoreElements:el=>el.classList&&(el.classList.contains("fab")||el.classList.contains("toast"))});
 const max=900;const s=Math.min(1,max/Math.max(c.width,c.height));const o=document.createElement("canvas");o.width=Math.round(c.width*s);o.height=Math.round(c.height*s);o.getContext("2d").drawImage(c,0,0,o.width,o.height);
 return o.toDataURL("image/jpeg",.78);
}

/* ── desktop layout ── */
const DESK_Q="(min-width:1024px)";
function useDesktop(){const [d,setD]=useState(()=>{try{return matchMedia(DESK_Q).matches}catch(e){return false}});
 useEffect(()=>{let m;try{m=matchMedia(DESK_Q)}catch(e){return}const f=()=>setD(m.matches);m.addEventListener?m.addEventListener("change",f):m.addListener(f);return()=>{m.removeEventListener?m.removeEventListener("change",f):m.removeListener(f)}},[]);return d}
const DESK_NAV=[["me","나","me"],["step","한 걸음","step"],["feed","소식","feed"],["friends","친구","people"]];
function DeskSide({tab,setTab,openSheet,profile,day,pending,unread,onFeedback,onAdmin,setSheet}){
 const go=k=>{setTab(k);setSheet(null);window.scrollTo(0,0)};
 const more=[["achieve","별","업적 도감"],["shelf","선반","나의 선반"],["publish","문","공개할 모습"],["inbox","말풍선","알림"+(unread?` ${unread}`:"")],["help","눈","도움말"]];
 return html`<aside className="side" aria-label="메뉴">
  <button className="side-me" onClick=${()=>setSheet("avatar")}><${Avatar} p=${profile} size=${40}/><span className="grow"><b>${profile.nickname}</b><br/><span className="small faint">${MIB_CONFIG.cohort} · Day ${Math.min(day,99)}</span></span></button>
  <nav className="side-nav" aria-label="메인">${DESK_NAV.map(([k,t,ic])=>html`<button key=${k} className="side-item" aria-current=${tab===k?"page":undefined} onClick=${()=>go(k)}><${Ico} n=${ic}/><span className="grow">${t}</span>${k==="friends"&&pending?html`<i className="side-dot" aria-label="새 친구 요청"></i>`:null}</button>`)}</nav>
  <div className="side-sep"></div>
  ${more.map(([k,gl,t])=>html`<button key=${k} className="side-item sub" onClick=${()=>openSheet(k)}><${Glyph} name=${gl} size=${18}/><span className="grow">${t}</span></button>`)}
  <div className="side-foot">
   <button className="btn quiet sm block" onClick=${onFeedback}><${Ico} n="chat"/>의견 보내기</button>
   ${onAdmin&&html`<button className="linkbtn small" onClick=${onAdmin}>운영 콘솔</button>`}
  </div>
 </aside>`;
}
function DeskRail({tab,st,stats,openSheet,setTab,top,mid}){
 const g=livingGem(st);const stage=stageOf(st,stats);const ns=nextStage(st,stats);
 const near=BADGES.filter(b=>!isEarned(st,stats,b)&&!b.secret).map(b=>({b,p:badgeProg(b,stats)})).sort((x,y)=>y.p.pct-x.p.pct).slice(0,2);
 return html`<aside className="rail" aria-label="요약">
  ${tab==="me"?html`${top}${mid}`:html`
   <button className="rail-gem" onClick=${()=>{setTab("me");window.scrollTo(0,0)}} aria-label="내 카드로">
    <${GemView} g=${g} seed=${st.createdAt} size=${120}/>
    <span className="stack" style=${{gap:"2px",alignItems:"flex-start",textAlign:"left"}}><b className="serif" style=${{color:"var(--accent)",fontSize:"17px"}}>${gemName(g)}</b><span className="chip gold">연마 ${stage}단계 · ${STAGES[stage]}</span>${ns&&html`<span className="small muted">다음 ${ns.name} · ${ns.need}</span>`}</span>
   </button>
   ${mid}
  `}
  ${near.length>0&&html`<div className="stack" style=${{gap:"6px"}}><div className="row between"><b>곧 받을 업적</b><button className="linkbtn small" onClick=${()=>openSheet("achieve")}>도감</button></div>${near.map(({b,p})=>html`<button key=${b.id} className="ach-row" onClick=${()=>openSheet("achieve")}><span className="ach-medal"><${Medal} b=${b} earned=${false} size=${36}/></span><span className="grow ach-body"><span className="row between"><b className="ach-name">${b.name}</b><span className="small faint">${p.cur}/${p.tgt}</span></span><${ProgressBar} pct=${p.pct} color=${RARITY[b.rar].color}/></span></button>`)}</div>`}
 </aside>`;
}
function BrandPanel(){
 return html`<aside className="brand" aria-hidden="true">
  <div className="brand-in">
   <div className="eyebrow">MYITEMBOOK · ${MIB_CONFIG.cohort}</div>
   <h1 className="brand-h">나다운 결을<br/>발견하다.</h1>
   <div className="float brand-gem"><${GemView} g=${{stone:"자수정",lightName:"새벽빛",light:"반짝임",form:"군집",texture:"결정질",hardness:3,grain:2,facets:10,symbol:"별",marks:{setting:2,sat:2,aura:2,stars:2}}} seed="brand" size=${260}/></div>
   <ul className="brand-list"><li>내가 남긴 기록과 아끼는 물건을 AI가 읽어 <b>나만의 젬</b>으로</li><li>쓰는 만큼 젬이 <b>변신</b>하고 배지·칭호가 쌓여요</li><li>휴대폰과 PC에서 <b>같은 계정</b>으로 이어서 쓸 수 있어요</li></ul>
  </div>
 </aside>`;
}
