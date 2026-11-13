"use strict";
/* MIB CBT · 함께하기 — 두 젬을 우주에 나란히 띄우고, 다가가게 해 궁합(매칭률·관계 이름·해석)을 보여 준다.
   · 같은 두 젬이면 언제나 같은 결과: 결과는 두 젬의 '지문'(8속성·연마 단계·표식·휘장 형질)으로만 정한다.
     A가 B를 놓든 B가 A를 놓든 같고, 젬이 자라거나 바뀌면 결과도 달라진다. 규칙이 바뀌면 TG_VER를 올린다.
   · 상처가 될 수 있는 이름은 쓰지 않고, 오해를 부를 이름은 성장 지향의 표현으로 바꿔 쓴다. */
const TG_VER="t1";
function tgHash(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return h>>>0}
function tgHue(hex){const m=/^#?([0-9a-f]{6})$/i.exec(hex||"");if(!m)return 0;const n=parseInt(m[1],16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return 0;let h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (h*60+360)%360}
/* 비교에 쓰는 것만 — 이름·문장·능력치 눈금·나이테는 쓰지 않는다 */
function tgShape(g,stage,seed){g=g||{};const m=g.marks||{};const im=g.idm||{}; return {stone:g.stone||"오팔",light:g.light||"",form:g.form||"",texture:g.texture||"",symbol:g.symbol||"",hardness:clamp(Math.round(g.hardness||1),1,5),grain:clamp(Math.round(g.grain||0),0,7),facets:clamp(Math.round(g.facets||8),6,14),stage:clamp(Math.round(stage||g.polish||1),1,7),marks:[m.setting||0,m.sat||0,m.aura||0,m.stars||0],idm:[im.laurel||0,im.spot||0,im.roots||0,(im.banners||[]).length]}}
const tgFp=s=>JSON.stringify([s.stone,s.light,s.form,s.texture,s.symbol,s.hardness,s.grain,s.facets,s.stage,s.marks,s.idm]);
const TG_ATTRS=[
 {k:"색",n:"색 · 핵심 가치",v:s=>s.stone,cmp:(a,b)=>{const ha=tgHue((STONES[a.stone]||{}).base),hb=tgHue((STONES[b.stone]||{}).base);let d=Math.abs(ha-hb);d=Math.min(d,360-d);if(a.stone===b.stone)return [1,.1];return [clamp(1-d/120,0,.7),clamp(d/150,0,1)]}},
 {k:"빛",n:"빛 · 퍼지는 방식",v:s=>s.light,cmp:(a,b)=>a.light===b.light?[1,.1]:[.25,.8]},
 {k:"형",n:"형 · 관심의 모양",v:s=>s.form,cmp:(a,b)=>a.form===b.form?[1,.1]:[.3,.75]},
 {k:"질",n:"질 · 생활의 결",v:s=>s.texture,cmp:(a,b)=>a.texture===b.texture?[1,.1]:[.35,.7]},
 {k:"상",n:"상 · 상징",v:s=>s.symbol,cmp:(a,b)=>a.symbol===b.symbol?[1,.15]:[.2,.55]},
 {k:"강",n:"강 · 오래 이어 온 힘",v:s=>s.hardness+" / 5",cmp:(a,b)=>{const d=Math.abs(a.hardness-b.hardness)/4;return [1-d,d*.9]}},
 {k:"결",n:"결 · 지나온 전환점",v:s=>s.grain+"줄",cmp:(a,b)=>{const d=Math.abs(a.grain-b.grain)/5;return [clamp(1-d,0,1),clamp(d,0,1)*.8]}},
 {k:"각",n:"각 · 관심의 갈래",v:s=>s.facets+"면",cmp:(a,b)=>{const d=Math.abs(a.facets-b.facets)/8;return [clamp(1-d,0,1),clamp(d,0,1)*.9]}}];
/* 관계 이름과 해석 — {a}·{b}는 역할이 있는 관계에서 앞(이끄는 쪽)·뒤 */
const TG_REL={
 "쌍둥이":"같은 결을 타고난 듯, 서로를 보면 나를 보는 것 같은 사이예요.",
 "도플갱어":"색도 빛도 모양도 겹쳐요. 서로의 다음 걸음이 궁금해지는 사이예요.",
 "거울 같은 존재":"서로를 비추며 내가 미처 못 본 나를 알려 주는 사이예요.",
 "이심전심":"말하지 않아도 마음이 먼저 닿는 사이예요.",
 "같은 마음":"같은 것을 소중히 여기며 같은 쪽을 바라보는 사이예요.",
 "서로를 알아보는 마음":"비슷한 길을 지나와, 말하지 않아도 서로의 수고를 아는 사이예요.",
 "한 뿌리의 두 가지":"같은 결에서 나와 각자의 방향으로 뻗어 가는 사이예요.",
 "멘토와 멘티":"{a}님이 먼저 걸은 길을 {b}님이 이어 걸으며, 함께 더 멀리 가는 사이예요.",
 "교학상장":"가르치며 배우고 배우며 가르쳐, 둘 다 자라는 사이예요.",
 "정신적 지주":"{a}님이 든든한 기둥이 되어 {b}님의 도전을 받쳐 주는 사이예요.",
 "바라보기":"{b}님이 {a}님의 길을 바라보며 자기만의 걸음을 키워 가는 사이예요.",
 "뿌리와 새싹":"{a}님이 든든히 받치고 {b}님이 힘차게 자라는 사이예요.",
 "실과 바늘":"한쪽이 길을 내면 한쪽이 이어 붙여, 함께일 때 완성되는 사이예요.",
 "왼팔 오른팔":"서로의 빈손을 채워 무엇이든 해내는 사이예요.",
 "창과 방패":"한쪽은 앞으로 나아가고 한쪽은 지켜 내, 함께라서 단단한 사이예요.",
 "환상의 콤비":"다른 재능이 맞물려 둘이 함께일 때 가장 빛나는 사이예요.",
 "상부상조":"서로의 부족함을 기꺼이 메워 주는 사이예요.",
 "공생관계":"서로가 있어 각자의 결이 더 깊어지는 사이예요.",
 "상호보완":"내게 없는 빛을 서로가 가지고 있는 사이예요.",
 "윈윈관계":"함께할수록 둘 다 얻는 것이 많아지는 사이예요.",
 "서로 다른 빛깔":"다르기에 서로에게 없는 색을 보여 주는 사이예요. 함께 있으면 세상이 더 넓어 보여요.",
 "두 갈래의 꿈":"같은 자리에서 다른 꿈을 키워, 서로의 시야를 넓혀 주는 사이예요.",
 "막상막하":"어느 쪽도 뒤지지 않아, 나란히 서면 서로를 더 높이 끌어올리는 사이예요.",
 "용호상박":"힘이 대등한 두 사람이 서로를 단련시키는 멋진 맞수예요.",
 "호적수":"서로가 있어 더 열심히 하게 되는, 고마운 맞수예요.",
 "선의의 경쟁자":"앞서거니 뒤서거니 하며 함께 성장하는 사이예요.",
 "관포지교":"서로를 깊이 믿고 끝까지 알아주는 사이예요.",
 "백년지기":"오래도록 곁에 두고 싶은, 결이 깊이 맞닿은 사이예요.",
 "평생지기":"삶의 굽이마다 서로를 떠올릴 사이예요.",
 "결의 단짝":"결이 깊이 맞닿아 오래 함께 자랄 사이예요.",
 "필연":"우연처럼 만났지만 만날 수밖에 없었던 것 같은 사이예요.",
 "운명의 관계":"서로의 이야기에 꼭 필요한 한 장을 채워 주는 사이예요.",
 "나란히 빛나는 한 쌍":"함께 있을 때 서로가 더 빛나는 사이예요.",
 "나란히 걷기":"같은 속도로 곁을 걸으며 서로의 걸음을 응원하는 사이예요.",
 "러닝메이트":"같은 목표를 향해 함께 달리는 든든한 동행이에요."};
const TG_GROUPS={twin:["쌍둥이","도플갱어","거울 같은 존재","이심전심"],guide:["멘토와 멘티","교학상장","정신적 지주","바라보기","뿌리와 새싹"],fill:["실과 바늘","왼팔 오른팔","창과 방패","환상의 콤비","상부상조","공생관계","상호보완"],diff:["서로 다른 빛깔","두 갈래의 꿈"],rival:["막상막하","용호상박","호적수","선의의 경쟁자"],deep:["관포지교","백년지기","평생지기","결의 단짝","필연","운명의 관계","나란히 빛나는 한 쌍"],kin:["같은 마음","서로를 알아보는 마음","한 뿌리의 두 가지","이심전심"],walk:["나란히 걷기","러닝메이트","윈윈관계","상부상조"]};
const TG_ROLE={"멘토와 멘티":["멘토","멘티"],"정신적 지주":["기둥","도전하는 이"],"바라보기":["앞서 걷는 이","바라보는 이"],"뿌리와 새싹":["뿌리","새싹"]};
function tgMatch(A,B){/* A,B: {shape,name} */
 const fa=tgFp(A.shape),fb=tgFp(B.shape);const [X,Y]=fa<=fb?[A,B]:[B,A];const h=tgHash(TG_VER+"|"+tgFp(X.shape)+"|"+tgFp(Y.shape));
 const rows=TG_ATTRS.map(t=>{const [sim,comp]=t.cmp(A.shape,B.shape);return {k:t.k,n:t.n,a:t.v(A.shape),b:t.v(B.shape),sim,comp,tag:sim>=.75?"닮음":comp>=.6?"채움":"나란히"}});
 const S=rows.reduce((s,r)=>s+r.sim,0)/rows.length,C=rows.reduce((s,r)=>s+r.comp,0)/rows.length;const harmony=rows.reduce((s,r)=>s+Math.max(r.sim,r.comp),0)/rows.length;
 const G=Math.abs(A.shape.stage-B.shape.stage),L=(A.shape.stage+B.shape.stage)/2;const mk=A.shape.marks.concat(B.shape.marks).reduce((s,v)=>s+v,0);
 const score=clamp(Math.round(60+34*harmony+Math.min(3,mk/6)+(h%4)),55,99);
 const grp=S>=.82?"twin":S<.44?"diff":C>=.44?"fill":G>=4?"guide":(Math.abs(S-C)<.16&&G<=1)?"rival":(L>=4.5&&score>=90)?"deep":S>=.64?"kin":"walk";
 const list=TG_GROUPS[grp];const name=list[(h>>>3)%list.length];
 const lead=A.shape.stage!==B.shape.stage?(A.shape.stage>B.shape.stage?A:B):((h&1)?X:Y);const follow=lead===A?B:A;
 const role=TG_ROLE[name]?{lead:lead.name,follow:follow.name,labels:TG_ROLE[name]}:null;
 const text=(TG_REL[name]||"서로의 결을 비추며 함께 자라는 사이예요.").replace("{a}",lead.name).replace("{b}",follow.name);
 const same=rows.filter(r=>r.tag==="닮음").sort((p,q)=>q.sim-p.sim).slice(0,2),fill=rows.filter(r=>r.tag==="채움").sort((p,q)=>q.comp-p.comp).slice(0,2);
 const why=[same.length&&`닮은 결 · ${same.map(r=>r.k==="색"?`둘 다 ${A.shape.stone}`:r.k==="강"||r.k==="결"||r.k==="각"?`${r.n.split(" · ")[1]}이 비슷`:`같은 ${r.k}(${r.a})`).join(", ")}`,fill.length&&`채우는 결 · ${fill.map(r=>`${r.k} ${r.a} ↔ ${r.b}`).join(", ")}`].filter(Boolean);
 return {ver:TG_VER,score,name,text,role,rows,S,C,group:grp,why,seed:h}}

/* ── 우주 배경 — 별이 반짝이며 천천히 흐른다 ── */
function TgStars({warp}){const ref=useRef(null);const wr=useRef(warp);wr.current=warp;
 useEffect(()=>{const c=ref.current;if(!c)return;const ctx=c.getContext("2d");let raf=0,W=0,H=0;const dpr=Math.min(2,window.devicePixelRatio||1);const R=rng("tg-stars");
  const stars=[...Array(220)].map(()=>({x:R(),y:R(),z:.2+R()*.8,t:R()*6.28}));
  const fit=()=>{W=c.clientWidth;H=c.clientHeight;c.width=W*dpr;c.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};fit();window.addEventListener("resize",fit);
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const draw=t=>{ctx.clearRect(0,0,W,H);const w=wr.current;stars.forEach(s=>{const sp=(reduce?0:(.00002+.00010*w)*s.z);s.y+=sp*16;if(s.y>1)s.y-=1;const tw=.55+.45*Math.sin(t*.002*s.z+s.t);const x=(s.x-.5)*(1+w*.6*s.z)+.5,y=s.y;ctx.globalAlpha=tw*s.z;ctx.fillStyle="#fff";const r=s.z*1.4+(w>.5?.3:0);if(w>.5&&!reduce){ctx.fillRect(x*W,y*H,r*.8,r*(1+w*6*s.z))}else{ctx.beginPath();ctx.arc(x*W,y*H,r,0,6.283);ctx.fill()}});ctx.globalAlpha=1;raf=requestAnimationFrame(draw)};raf=requestAnimationFrame(draw);
  return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",fit)}},[]);
 return html`<canvas className="tg-stars" ref=${ref} aria-hidden="true"></canvas>`}

/* ── 함께하기 화면 ── */
function TogetherView({me,other,onClose,canBond,onBond,toast}){
 const res=useMemo(()=>tgMatch({shape:tgShape(me.g,me.stage,me.seed),name:me.name},{shape:tgShape(other.g,other.stage,other.seed),name:other.name}),[me.seed,other.seed,tgFp(tgShape(me.g,me.stage,me.seed)),tgFp(tgShape(other.g,other.stage,other.seed))]);
 const [phase,setPhase]=useState("float");const [n,setN]=useState(0);const [busy,setBusy]=useState(false);const card=useRef(null);
 const reduce=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 useBackLayer(onClose);
 useEffect(()=>{track("together_open",{sample:!!other.sample});const k=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[]);
 const sa=STONES[me.g.stone]||STONES["오팔"],sb=STONES[other.g.stone]||STONES["오팔"];
 const ca=sa.light==="#FFFFFF"?sa.tint:sa.light,cb=sb.light==="#FFFFFF"?sb.tint:sb.light;
 const shA=tgShape(me.g,me.stage,me.seed),shB=tgShape(other.g,other.stage,other.seed);
 const amp=((shA.hardness+shB.hardness)/2).toFixed(1);const orbN=Math.round((shA.facets+shB.facets)/2);const trails=clamp(Math.round((shA.grain+shB.grain)/2)+2,2,7);
 function approach(){if(phase!=="float")return;track("together_approach",{name:res.name});if(reduce){setPhase("result");setN(res.score);return}setPhase("near");setTimeout(()=>setPhase("fx"),1500);setTimeout(()=>setPhase("burst"),4300);setTimeout(()=>setPhase("result"),5200);try{navigator.vibrate&&navigator.vibrate([20,60,20,60,40,120,80])}catch(e){}}
 useEffect(()=>{if(phase!=="result")return;if(reduce){setN(res.score);return}let v=0;const t=setInterval(()=>{v+=Math.max(1,Math.round((res.score-v)/7));if(v>=res.score){v=res.score;clearInterval(t)}setN(v)},40);return()=>clearInterval(t)},[phase]);
 const [share,setShare]=useState(false);
 const bondName=res.name.length>10?res.name.replace(/\s/g,"").slice(0,10):res.name;
 return ReactDOM.createPortal(html`<div className=${"tg ph-"+phase} role="dialog" aria-modal="true" aria-label=${`함께하기 · ${me.name}과 ${other.name}`} style=${{"--ca":ca,"--cb":cb,"--amp":amp+"px"}}>
  <div className="tg-neb" aria-hidden="true"></div><${TgStars} warp=${phase==="near"?1:phase==="fx"?.4:0}/>
  <div className="tg-top"><span className="small">함께하기 · ${phase==="float"?"광활한 우주에 두 젬이 떠 있어요":phase==="result"?"우리 둘의 결":"두 젬이 서로를 느끼는 중…"}</span><button className="gn-x" aria-label="닫기" onClick=${onClose}>×</button></div>
  <div className="tg-stage">
   <svg className="tg-fx" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <defs><linearGradient id="tgbeam" x1="0" x2="1"><stop offset="0" stop-color=${ca}/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color=${cb}/></linearGradient><radialGradient id="tgcore"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".35" stop-color=${ca} stop-opacity=".8"/><stop offset="1" stop-color=${cb} stop-opacity="0"/></radialGradient></defs>
    <g className="tg-trails">${[...Array(trails)].map((_,i)=>{const r=50+i*14,d=i%2?1:-1;return html`<path key=${i} d=${`M${200-r} 150 C ${200-r*.5} ${150-70*d}, ${200+r*.5} ${150-70*d}, ${200+r} 150 S ${200-r*.5} ${150+70*d}, ${200-r} 150`} fill="none" stroke=${i%2?ca:cb} strokeWidth=${1.2+((i*7)%3)*.4} strokeLinecap="round" style=${{animationDelay:(i*.18)+"s"}}/>`})}</g>
    <line className="tg-beam" x1="120" y1="150" x2="280" y2="150" stroke="url(#tgbeam)" strokeWidth="5" strokeLinecap="round"/>
    <g className="tg-orbit">${[...Array(orbN)].map((_,i)=>{const a=i/orbN*6.283;return html`<circle key=${i} cx=${(200+Math.cos(a)*130).toFixed(1)} cy=${(150+Math.sin(a)*46).toFixed(1)} r=${i%3?1.8:3} fill=${i%2?ca:cb}/>`})}</g>
    <circle className="tg-core" cx="200" cy="150" r="70" fill="url(#tgcore)"/>
    <g className="tg-burst">${[...Array(28)].map((_,i)=>{const a=i/28*6.283,r=60+(i%4)*30;return html`<circle key=${i} cx="200" cy="150" r=${i%3?2:3.4} fill=${i%2?ca:cb} style=${{"--dx":(Math.cos(a)*r).toFixed(1)+"px","--dy":(Math.sin(a)*r).toFixed(1)+"px"}}/>`})}</g>
   </svg>
   <div className="tg-gem a"><div className="tg-bob"><${GemView} g=${me.g} seed=${me.seed} size=${170}/></div><span className="tg-name">${me.name}</span></div>
   <div className="tg-gem b"><div className="tg-bob"><${GemView} g=${other.g} seed=${other.seed} size=${170}/></div><span className="tg-name">${other.name}</span></div>
  </div>
  ${phase==="float"&&html`<div className="tg-cta"><p className="small">두 젬의 8가지 속성이 서로를 어떻게 비추는지 볼까요?</p><button className="btn tg-go" onClick=${approach}>✦ 다가가기</button></div>`}
  ${share&&html`<${TgShare} res=${res} me=${me} other=${other} toast=${toast} onClose=${()=>setShare(false)}/>`}
  ${phase==="result"&&html`<div className="tg-res" role="region" aria-label="함께하기 결과">
   <div className="tg-card" ref=${card}>
    <div className="tg-mini"><${GemView} g=${me.g} seed=${me.seed} size=${54}/><span className="tg-x">✦</span><${GemView} g=${other.g} seed=${other.seed} size=${54}/></div>
    <span className="eyebrow">${me.name} × ${other.name} · 우리 둘의 결</span>
    <div className="tg-score"><b>${n}</b><span>%</span></div>
    <h2 className="serif tg-rel">${res.name}</h2>
    ${res.role&&html`<p className="tg-role">${res.role.lead}님 · ${res.role.labels[0]}  ⟶  ${res.role.follow}님 · ${res.role.labels[1]}</p>`}
    <p className="tg-text">${res.text}</p>
    ${res.why.map(w=>html`<p key=${w} className="tg-why small">${w}</p>`)}
    <div className="tg-rows">${res.rows.map(r=>html`<div key=${r.k} className="tg-row"><span className="tg-k">${r.k}</span><span className="tg-v a">${r.a}</span><span className="tg-bar"><i style=${{width:Math.round(Math.max(r.sim,r.comp)*100)+"%"}}></i></span><span className="tg-v b">${r.b}</span><span className=${"tg-tag t-"+(r.tag==="닮음"?"s":r.tag==="채움"?"c":"w")}>${r.tag}</span></div>`)}</div>
    ${other.sample&&html`<p className="tg-note">${other.real?"공개 자료로 만든 헌정 샘플과의 궁합이에요 · 본인이 참여하지 않았어요":"가상 인물과의 궁합이에요"}</p>`}
    <p className="tg-sig">MyItemBook · 같은 두 젬이면 언제나 같은 결과예요 (${res.ver})</p>
   </div>
   <div className="tg-acts">
    ${canBond&&html`<button className="btn block tg-bond" onClick=${()=>onBond&&onBond(bondName)}>'${bondName}'${josa(bondName,"으로").slice(bondName.length)} 관계 명칭 제안하기</button>`}
    <div className="row" style=${{gap:"8px"}}><button className="btn ghost grow" onClick=${()=>setShare(true)}>결과 이미지 저장·공유</button><button className="btn ghost grow" onClick=${()=>{setPhase("float");setN(0)}}>다시 보기</button></div>
    <button className="linkbtn small" onClick=${onClose}>닫기</button>
   </div>
  </div>`}
 </div>`,document.body);
}

/* ── 결과 이미지 — 화면을 찍지 않고 캔버스에 바로 그린다(빠르고 매번 같은 모양) ── */
/* 낱말 단위로 줄바꿈 — 낱말이 줄 끝에서 갈라지지 않게 */
function tgWrap(x,text,maxW,max){const out=[];let line="";for(const w of String(text||"").split(/\s+/)){const t=line?line+" "+w:w;if(x.measureText(t).width>maxW&&line){out.push(line);line=w}else line=t}if(line)out.push(line);return out.slice(0,max)}
async function tgImage(res,me,other){
 const W=1080,H=1700,cv=document.createElement("canvas");cv.width=W;cv.height=H;const x=cv.getContext("2d");
 try{await document.fonts.ready}catch(e){}
 const SERIF='"Noto Serif KR","Apple SD Gothic Neo",serif',SANS='"Noto Sans KR","Apple SD Gothic Neo",sans-serif';
 const sa=STONES[me.g.stone]||STONES["오팔"],sb=STONES[other.g.stone]||STONES["오팔"];const ca=sa.light==="#FFFFFF"?sa.tint:sa.light,cb=sb.light==="#FFFFFF"?sb.tint:sb.light;
 const bg=x.createRadialGradient(W/2,H*.32,40,W/2,H*.4,H*.9);bg.addColorStop(0,"#1E2A5C");bg.addColorStop(.5,"#0D1230");bg.addColorStop(1,"#05060F");x.fillStyle=bg;x.fillRect(0,0,W,H);
 const nb=(cx,cy,c)=>{const g=x.createRadialGradient(cx,cy,10,cx,cy,380);g.addColorStop(0,c+"66");g.addColorStop(1,c+"00");x.fillStyle=g;x.fillRect(0,0,W,H)};nb(W*.3,H*.24,ca);nb(W*.7,H*.28,cb);
 const R=rng("tg-img|"+res.seed);for(let i=0;i<260;i++){x.globalAlpha=.25+R()*.75;x.fillStyle="#fff";x.beginPath();x.arc(R()*W,R()*H,R()*1.8+.3,0,6.283);x.fill()}x.globalAlpha=1;
 const gl=x.createLinearGradient(W*.3,0,W*.7,0);gl.addColorStop(0,ca);gl.addColorStop(.5,"#FFFFFF");gl.addColorStop(1,cb);x.strokeStyle=gl;x.lineWidth=6;x.lineCap="round";x.globalAlpha=.85;x.beginPath();x.moveTo(W*.34,360);x.lineTo(W*.66,360);x.stroke();x.globalAlpha=1;
 const [ia,ib]=await Promise.all([svgImage(gemSVG(me.g,me.seed,"tgia"),340,365),svgImage(gemSVG(other.g,other.seed,"tgib"),340,365)]);
 x.drawImage(ia,W*.30-170,170,340,365);x.drawImage(ib,W*.70-170,170,340,365);
 x.textAlign="center";x.fillStyle="#DCE4F4";x.font=`600 30px ${SANS}`;x.fillText(me.name,W*.30,575);x.fillText(other.name,W*.70,575);
 x.fillStyle="#D8B465";x.font=`700 26px ${SANS}`;x.fillText("우 리  둘 의  결",W/2,660);
 x.fillStyle="#FFF3D6";x.font=`800 150px ${SERIF}`;const sw=x.measureText(String(res.score)).width;x.font=`700 54px ${SERIF}`;const pw=x.measureText("%").width;const sx=W/2-(sw+pw+6)/2;x.textAlign="left";x.font=`800 150px ${SERIF}`;x.fillText(String(res.score),sx,810);x.font=`700 54px ${SERIF}`;x.fillText("%",sx+sw+6,810);x.textAlign="center";
 x.shadowColor="rgba(255,214,140,.55)";x.shadowBlur=30;x.fillStyle="#FFE2A0";x.font=`800 76px ${SERIF}`;x.fillText(res.name,W/2,915);x.shadowBlur=0;
 let y=995;if(res.role){x.fillStyle="#E9C77A";x.font=`600 30px ${SANS}`;x.fillText(`${res.role.lead} · ${res.role.labels[0]}   ⟶   ${res.role.follow} · ${res.role.labels[1]}`,W/2,y);y+=56}
 x.fillStyle="#E6EBF5";x.font=`500 36px ${SANS}`;tgWrap(x,res.text,W-200,3).forEach(l=>{x.fillText(l,W/2,y);y+=54});
 y+=16;const rows=res.rows;const top=y,cw=(W-200)/4;rows.forEach((r,i)=>{const cx=100+cw*(i%4)+cw/2,cy=top+Math.floor(i/4)*120;x.fillStyle="rgba(255,255,255,.07)";x.beginPath();x.roundRect?x.roundRect(cx-cw/2+8,cy,cw-16,104,20):x.rect(cx-cw/2+8,cy,cw-16,104);x.fill();
  x.fillStyle="#D8B465";x.font=`800 30px ${SERIF}`;x.fillText(r.k,cx,cy+40);x.fillStyle=r.tag==="닮음"?"#FFE2A0":r.tag==="채움"?"#BFE0FF":"#DCE4F4";x.font=`700 26px ${SANS}`;x.fillText(r.tag,cx,cy+82)});
 y=top+240+52;
 x.fillStyle="#9CA7C2";x.font=`500 24px ${SANS}`;if(other.sample){x.fillText(other.real?"공개 자료로 만든 헌정 샘플과의 궁합 · 본인이 참여하지 않았어요":"가상 인물과의 궁합이에요",W/2,y);y+=56}
 y+=24;x.fillStyle="#D8B465";x.font=`700 30px ${SERIF}`;x.fillText("MyItemBook",W/2,y);y+=40;x.fillStyle="#7F8AA6";x.font=`500 22px ${SANS}`;x.fillText(`함께하기 · 같은 두 젬이면 언제나 같은 결과 (${res.ver})`,W/2,y);y+=44;
 /* 내용 높이에 맞춰 자른다 — 글이 길어도 겹치지 않게 */
 const FH=Math.min(H,Math.ceil(y));if(FH===H)return cv;const out=document.createElement("canvas");out.width=W;out.height=FH;out.getContext("2d").drawImage(cv,0,0);return out}
function TgShare({res,me,other,toast,onClose}){
 const [st,setSt]=useState("make");const [url,setUrl]=useState("");const blobR=useRef(null);const [err,setErr]=useState("");
 const name=`MIB-함께하기-${me.name}-${other.name}.png`.replace(/[\\/:*?"<>|\s]+/g,"_");
 const isMobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
 const canShare=useMemo(()=>{try{return !!(navigator.canShare&&navigator.canShare({files:[new File([new Blob(["x"])],"x.png",{type:"image/png"})]}))}catch(e){return false}},[]);
 useEffect(()=>{let alive=true;const t0=Date.now();(async()=>{try{const cv=await tgImage(res,me,other);const blob=await new Promise(r=>cv.toBlob(r,"image/png"));if(!alive)return;blobR.current=blob;setUrl(URL.createObjectURL(blob));setSt("ready");track("together_image",{ms:Date.now()-t0})}catch(e){if(alive){setSt("error");setErr("이미지를 만들지 못했어요. 다시 시도해 주세요.")}}})();return()=>{alive=false}},[]);
 useEffect(()=>()=>{if(url)URL.revokeObjectURL(url)},[url]);
 async function save(){const blob=blobR.current;if(!blob)return;setSt("saving");try{
   if(window.showSaveFilePicker&&!isMobile){try{const h=await window.showSaveFilePicker({suggestedName:name,types:[{description:"PNG 이미지",accept:{"image/png":[".png"]}}]});const w=await h.createWritable();await w.write(blob);await w.close();setSt("saved");track("together_save",{via:"picker"});return}catch(e){if(e&&e.name==="AbortError"){setSt("ready");return}}}
   if(/iPhone|iPad|iPod/i.test(navigator.userAgent)&&canShare){try{await navigator.share({files:[new File([blob],name,{type:"image/png"})]});setSt("saved");track("together_save",{via:"ios-share"});return}catch(e){if(e&&e.name==="AbortError"){setSt("ready");return}}}
   const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);setSt("saved");track("together_save",{via:"download"})}catch(e){setSt("ready");setErr("저장하지 못했어요. 이미지를 길게 눌러 저장해 보세요.")}}
 async function doShare(){const blob=blobR.current;if(!blob)return;setSt("sharing");try{await navigator.share({files:[new File([blob],name,{type:"image/png"})],title:`${me.name} × ${other.name} · ${res.name}`});setSt("shared");track("together_share")}catch(e){setSt("ready");if(e&&e.name!=="AbortError")setErr("공유하지 못했어요. '이미지 저장'을 써 주세요.")}}
 const label={make:"이미지를 만드는 중…",ready:"이미지가 준비됐어요",saving:"저장하는 중…",saved:isMobile?"저장했어요 · 사진첩이나 다운로드에서 확인하세요":"저장했어요 · 다운로드 폴더를 확인하세요",sharing:"공유 창을 여는 중…",shared:"공유했어요",error:"이미지를 만들지 못했어요"}[st];
 const busy=st==="make"||st==="saving"||st==="sharing";
 return html`<div className="tg-share" role="dialog" aria-modal="true" aria-label="결과 이미지 저장·공유" onClick=${e=>{if(e.target===e.currentTarget&&!busy)onClose()}}><div className="tg-share-in">
  <div className=${"tg-share-st st-"+st} role="status" aria-live="polite">${busy?html`<i className="tg-spin" aria-hidden="true"></i>`:st==="saved"||st==="shared"?html`<b aria-hidden="true">✓</b>`:null}<span>${label}</span></div>
  <div className="tg-share-img">${url?html`<img src=${url} alt=${`${me.name}과 ${other.name}의 함께하기 결과 · ${res.name} ${res.score}%`}/>`:html`<div className="tg-share-ph"><i className="tg-spin big" aria-hidden="true"></i></div>`}</div>
  ${err&&html`<p className="small mn-err" role="alert">${err}</p>`}
  <div className="row" style=${{gap:"8px"}}><button className="btn grow tg-bond" disabled=${!url||busy} onClick=${save}>이미지 저장</button>${canShare&&html`<button className="btn ghost grow" disabled=${!url||busy} onClick=${doShare}>공유하기</button>`}</div>
  ${!isMobile&&url&&html`<p className="small" style=${{color:"#AFBAD0",margin:0}}>이미지를 마우스 오른쪽 버튼으로 눌러 저장해도 돼요.</p>`}
  ${isMobile&&url&&html`<p className="small" style=${{color:"#AFBAD0",margin:0}}>저장이 안 되면 이미지를 길게 눌러 저장하세요.</p>`}
  <button className="linkbtn small" style=${{color:"#C9D3E6"}} disabled=${busy&&st!=="make"} onClick=${onClose}>닫기</button>
 </div></div>`}
