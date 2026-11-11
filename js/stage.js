"use strict";
/* MIB CBT · 차근차근 열리는 MIB — 처음엔 꼭 필요한 것만, 쓰는 만큼 하나씩 더 열린다.
   단계: 1 첫 만남 → 2 함께 자라기 → 3 나를 더 보여 주기 → 4 모두 열림
   · 단계는 활동한 날·오늘의 인터뷰·친구·다시 읽기·다시 찾아온 횟수로 쌓이는 점수로 오른다(자주 쓰면 빨리 열림).
   · 이미 써 본 기능은 단계와 상관없이 늘 열려 있다.
   · 궁금하면 '지금 열기'로 다음 단계를 바로 열 수 있고, '모두 열기'도 있다. */
const UI_LV=[null,{n:"첫 만남",d:"내 젬을 만나고, 하루 한 번 인터뷰에 답해요"},{n:"함께 자라기",d:"친구와 주고받고, 내 것을 담아 보여 줘요"},{n:"나를 더 보여 주기",d:"걸어온 길과 다른 곳의 기록을 이어요"},{n:"모두 열림",d:"MIB의 모든 기능을 써요"}];
const UI_NEED=[0,0,4,10,18];
const UI_F={
 share:{lv:2,n:"카드 이미지 · 받은 공감"},marks:{lv:2,n:"젬의 표식"},ask:{lv:2,n:"친구에게 묻기"},publish:{lv:2,n:"공개할 모습"},achieve:{lv:2,n:"업적 도감"},shelf:{lv:2,n:"나의 선반"},
 identity:{lv:3,n:"나의 휘장"},gem3d:{lv:3,n:"3D 젬"},links:{lv:3,n:"SNS·블로그 계정 연결"},shots:{lv:3,n:"화면 한 장으로 읽기"},google:{lv:3,n:"구글 계정으로 읽기"},scan:{lv:3,n:"사진 한 장으로 선반 채우기"},
 traces:{lv:4,n:"폰·PC 속 흔적"},about:{lv:4,n:"나를 소개한 글"},proof:{lv:4,n:"증명서로 휘장 새기기"},attrs:{lv:4,n:"젬의 8가지 속성"}};
const UI_CTX={st:null,stats:null,items:[]};
function uiScore(st,stats){if(!st)return 0;const s=stats||{};const hq=((st.heart&&st.heart.a)||[]).filter(x=>x&&x.a).length;const kn=(st.know||[]).filter(k=>k.a).length;
 return (s.active||0)*3+hq+Math.floor(kn/2)+(s.connections||0)*2+Math.max(0,(s.analyses||1)-1)*3+Math.min(6,(st.flags&&st.flags.returns)||0)}
function uiLevel(st,stats){if(typeof window!=="undefined"&&window.__MIB_UI_ALL)return 4;if(!st)return 1;const f=st.flags||{};if(f.uiAll)return 4;const sc=uiScore(st,stats);let lv=1;for(let k=2;k<=4;k++)if(sc>=UI_NEED[k])lv=k;return Math.max(lv,f.uiLevel||1)}
function uiUsed(k,st,items){if(!st)return false;const f=st.flags||{};if(f.used&&f.used[k])return true;const L=typeof linkList==="function"?linkList(st.sources||{}):[];const m=x=>L.some(l=>{const s=linkSvc(l.kind);return x(s,l)});
 switch(k){case "identity":return ((st.identity||{}).entries||[]).length>0;case "proof":return ((st.identity||{}).entries||[]).some(e=>e.proof);
  case "shelf":return (items||[]).length>0;case "publish":return !!(st.visibility&&st.visibility.public);case "marks":return Object.values(f.marks||{}).some(v=>v>0);
  case "achieve":return !!(f.title||(f.pins||[]).length);case "links":return m(s=>s.m==="feed"||s.m==="wall");case "shots":return m(s=>s.m==="shot");case "google":return m(s=>s.m==="google");case "traces":return m(s=>s.m==="trace");case "about":return m(s=>s.m==="about");
  default:return false}}
function uiOpen(k){const F=UI_F[k];if(!F)return true;const {st,stats,items}=UI_CTX;return uiLevel(st,stats)>=F.lv||uiUsed(k,st,items)}
function uiNext(st,stats){const lv=uiLevel(st,stats);if(lv>=4)return null;const to=lv+1;const sc=uiScore(st,stats);const feats=Object.entries(UI_F).filter(([k,f])=>f.lv===to&&!uiUsed(k,st,UI_CTX.items)).map(([k,f])=>f.n);return {to,name:UI_LV[to].n,desc:UI_LV[to].d,feats,score:sc,need:UI_NEED[to],from:UI_NEED[lv]}}
/* 다음 단계 예고 — 한 장만, 작게 */
function UnlockCard({st,stats,update,toast,demo}){const N=uiNext(st,stats);if(!N||!N.feats.length)return null;const pct=clamp(Math.round((N.score-N.from)/Math.max(1,N.need-N.from)*100),4,100);
 const open=all=>{if(demo)return;update(s=>{if(all)s.flags.uiAll=true;else s.flags.uiLevel=N.to});track("ui_open_early",{to:all?4:N.to});toast(all?"모든 기능을 열었어요.":`'${N.name}' 단계를 열었어요.`)};
 return html`<div className="panel stack unlock">
  <div className="row between"><span className="eyebrow">다음에 열려요 · ${N.to}단계</span><span className="small faint">${N.name}</span></div>
  <div className="unlock-feats">${N.feats.slice(0,5).map(t=>html`<span key=${t} className="chip plain">${t}</span>`)}${N.feats.length>5&&html`<span className="small faint">외 ${N.feats.length-5}가지</span>`}</div>
  <div className="meter" aria-label=${"다음 단계까지 "+pct+"%"}><i style=${{width:pct+"%"}}></i></div>
  <span className="small muted">인터뷰에 답하고, 한 걸음을 하고, 친구와 이어질수록 빨리 열려요.</span>
  <div className="row" style=${{gap:"14px"}}><button className="linkbtn small" disabled=${demo} onClick=${()=>open(false)}>궁금하면 지금 열기</button><button className="linkbtn small" style=${{color:"var(--ink-3)"}} disabled=${demo} onClick=${()=>open(true)}>모두 한 번에 열기</button></div>
 </div>`}
/* 새 단계가 열린 날 — 무엇이 생겼는지 한 번만 알려 준다 */
function LevelUpBanner({st,stats,update,onOpen}){const lv=uiLevel(st,stats);const seen=(st.flags&&st.flags.uiSeen)||1;
 useEffect(()=>{if(!st.flags.uiSeen&&lv<=1)update(s=>{s.flags.uiSeen=1})},[]);
 if(lv<=seen)return null;const feats=Object.entries(UI_F).filter(([k,f])=>f.lv>seen&&f.lv<=lv);if(!feats.length)return null;
 const close=()=>update(s=>{s.flags.uiSeen=lv});const firstKey=(feats.find(([k])=>["identity","shelf","achieve","publish"].includes(k))||[])[0];
 return html`<div className="panel stack levelup" role="status">
  <div className="row between"><span className="eyebrow">새로 열렸어요 · ${UI_LV[lv].n}</span><button className="linkbtn small" onClick=${close}>확인</button></div>
  <span className="small muted">${UI_LV[lv].d}</span>
  <div className="unlock-feats">${feats.map(([k,f])=>html`<span key=${k} className="chip gold">${f.n}</span>`)}</div>
  ${firstKey&&html`<button className="btn sm" style=${{alignSelf:"flex-start"}} onClick=${()=>{close();onOpen(firstKey)}}>${UI_F[firstKey].n} 둘러보기</button>`}
 </div>`}
/* 아직 열리지 않은 연결 방법을 한 줄로 — 새 기록 더하기 화면 */
function LockedLine({keys,update,toast,demo}){const hid=keys.filter(k=>!uiOpen(k));if(!hid.length)return null;const lv=Math.min(...hid.map(k=>UI_F[k].lv));
 return html`<div className="panel tint small row between" style=${{alignItems:"center",gap:"10px"}}><span>${hid.map(k=>UI_F[k].n).join(" · ")}<br/><span className="faint">${lv}단계 '${UI_LV[lv].n}'에서 열려요</span></span><button className="linkbtn small" style=${{flex:"none"}} disabled=${demo} onClick=${()=>{update(s=>{s.flags.uiLevel=Math.max(s.flags.uiLevel||1,lv)});track("ui_open_early",{to:lv,from:"connect"});toast&&toast("지금 열었어요.")}}>지금 열기</button></div>`}
