"use strict";
/* MIB CBT · 젬 변신 이벤트 — 조건이 채워져 젬이 눈에 띄게 바뀌는 순간의 보상 연출 */

/* re-read settles gently: the same gem keeps growing instead of becoming another gem */
const SHAPE_KEYS=[["form","형"],["texture","질"],["light","빛"]];
function settleReread(an,prev){
 const pg=(prev&&prev.gem)||{};const g=an.gem;g.basis={...(g.basis||{})};const changed=[];
 if(pg.stone&&g.stone!==pg.stone){an.stoneSuggest=g.stone;g.stone=pg.stone;g.value=pg.value;g.basis["색"]=(pg.basis||{})["색"]||g.basis["색"]}
 if(pg.lightName)g.lightName=pg.lightName;
 for(const [k,label] of SHAPE_KEYS){if(pg[k]&&g[k]!==pg[k]){if(!changed.length)changed.push({k,label,from:pg[k],to:g[k]});else{g[k]=pg[k];g.basis[label]=(pg.basis||{})[label]||g.basis[label]}}}
 g.hardness=Math.max(g.hardness||1,pg.hardness||1);g.grain=Math.max(g.grain||0,pg.grain||0);g.facets=Math.max(g.facets||6,pg.facets||6);
 if(pg.fp)g.fp=pg.fp;
 an.changed=changed;return an;
}

/* what the person can see change */
const EVO_FIELDS=[["stage","단계"],["stone","색"],["form","형"],["texture","질"],["light","빛"],["symbol","상"],["setting","받침"],["sat","인연석"],["aura","광채"],["stars","별무리"],["hardness","강"],["grain","결"],["facets","각"],["rings","연륜"],["laurel","월계관"],["spot","조명"],["roots","뿌리"],["banners","깃발"]];
const MARK_KEYS=["setting","sat","aura","stars"];
function gemSnap(g,stage){const m=g.marks||{};return {stone:g.stone,form:g.form,texture:g.texture,light:g.light,symbol:g.symbol,hardness:g.hardness,grain:g.grain,facets:g.facets,lightName:g.lightName,fp:g.fp,stage,setting:m.setting||0,sat:m.sat||0,aura:m.aura||0,stars:m.stars||0,rings:g.rings||0,polish:stage,laurel:(g.idm||{}).laurel||0,spot:(g.idm||{}).spot||0,roots:(g.idm||{}).roots||0,banners:((g.idm||{}).banners||[]).length,idm:g.idm?{...g.idm}:null,marks:{...m}}}
/* a field the old snapshot never had (older app version) is adopted quietly, not celebrated */
function evoDiff(a,b){if(!a||!b)return [];const av=k=>["rings","laurel","spot","roots","banners"].includes(k)&&a[k]===undefined?0:a[k];return EVO_FIELDS.filter(([k])=>av(k)!==undefined&&av(k)!==b[k]).map(([k,label])=>({k,label,from:av(k),to:b[k]}))}
function evoHeadline(changes,badges,stats){
 const has=k=>changes.find(c=>c.k===k);const mv=(stats&&stats.mv)||{};
 if(has("stage")){const c=has("stage");return {title:`${STAGES[c.to]} 단계 달성!`,sub:`연마 ${c.to}단계 · ${STAGE_RULES[c.to].why}`,tone:"stage"}}
 if(has("stone"))return {title:"젬의 색이 바뀌었어요",sub:`${has("stone").to} · ${STONES[has("stone").to].meaning}`,tone:"reshape"};
 if(has("form")||has("texture")||has("light")||has("symbol"))return {title:"젬이 새 모습을 찾았어요",sub:"새 관점으로 다시 깎였습니다",tone:"reshape"};
 for(const m of MARKS){const c=has(m.k);if(c)return {title:m.head,sub:`${m.desc(mv[m.k]!=null?mv[m.k]:m.steps[c.to-1])} · ${markTitle(m,c.to)}`,tone:"mark"}}
 {const ID_HEAD={laurel:["젬에 월계관이 둘러졌어요","영예"],spot:["젬 위로 조명이 내려왔어요","조명"],roots:["젬이 뿌리를 내렸어요","뿌리와 터전"],banners:["젬 곁에 깃발이 올랐어요","소속"]};for(const k of ["laurel","spot","roots","banners"]){const c=has(k);if(c&&c.to>(c.from||0))return {title:ID_HEAD[k][0],sub:`나의 휘장 · ${ID_HEAD[k][1]} ${k==="banners"?c.to+"개":fmtVal(k,c.to)}`,tone:"mark"}}}
 if(has("rings")){const c=has("rings");return c.to>(c.from||0)?{title:"살아온 시간이 젬에 새겨졌어요",sub:`연륜 · ${ringName(c.to)} · 나이테 같은 결과 깊이가 더해졌어요`,tone:"grain"}:{title:"젬의 연륜 결을 거뒀어요",sub:"태어난 해를 지워 나이테가 사라졌어요",tone:"reshape"}}
 if(has("hardness")){const c=has("hardness");return {title:"젬이 단단해졌어요",sub:`활동 ${stats?stats.active:""}일 · 강(剛) ${c.from} → ${c.to}`,tone:"harden"}}
 if(has("grain"))return {title:"금빛 결이 새겨졌어요",sub:"멈췄다가 다시 시작한 순간이 젬에 남았어요",tone:"grain"};
 if(has("facets")){const c=has("facets");return {title:"새 면이 깎였어요",sub:`각(角) ${c.from}면 → ${c.to}면`,tone:"facet"}}
 if(badges&&badges.length){const b=BADGES.find(x=>x.id===badges[0]);return {title:"배지 획득!",sub:b?`${b.name} · ${b.desc}`:"",tone:"badge"}}
 return {title:"젬이 반응했어요",sub:"",tone:"stage"};
}
const fmtVal=(k,v)=>MARK_KEYS.includes(k)?(MARKS.find(m=>m.k===k).names[v]||"없음"):k==="stage"?`${v}단계 ${STAGES[v]||""}`:k==="facets"?`${v}면`:k==="hardness"?`${v}/5`:k==="grain"?`${v}줄`:k==="rings"?(ringName(v)||"없음"):k==="laurel"?["없음","올리브 잎","올리브 관","금빛 잎","금빛 관","찬란한 월계관"][v]||"":k==="spot"?["없음","한 줄기 빛","스포트라이트","세 줄기 조명","무대 조명","레드카펫"][v]||"":k==="roots"?["없음","잔뿌리","곧은 뿌리","깊은 뿌리","금빛 뿌리","천년 뿌리"][v]||"":k==="banners"?`${v}개`:String(v);

/* numbers that tick up on the welcome-back card */
function CountUp({n,ms=900}){const [v,setV]=useState(0);useEffect(()=>{let raf,t0;const f=t=>{if(!t0)t0=t;const k=Math.min(1,(t-t0)/ms);setV(Math.round(n*(1-Math.pow(1-k,3))));if(k<1)raf=requestAnimationFrame(f)};raf=requestAnimationFrame(f);return()=>cancelAnimationFrame(raf)},[n]);return v}
function awayLabel(ms){const h=ms/3600000;if(h<24)return `${Math.max(1,Math.round(h))}시간 만이에요`;const d=Math.floor(h/24);return d>=2?`${d}일 만이에요`:"하루 만이에요"}
function EvolveOverlay({evt,seed,onClose,onShare}){
 const reduce=useMemo(()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}},[]);
 const gemChange=evt.changes.length>0;const start=reduce||!gemChange?2:0;const [phase,setPhase]=useState(evt.away?-1:start);
 useEffect(()=>{track("evolve_show",{tone:evt.head.tone,n:evt.changes.length,b:evt.badges.length,away:!!evt.away})},[]);
 const begun=phase!==-1;
 useEffect(()=>{if(!begun)return;if(start===2){try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}return}
  const t1=setTimeout(()=>setPhase(p=>p<1?1:p),1500),t2=setTimeout(()=>{setPhase(2);try{navigator.vibrate&&navigator.vibrate([20,50,70])}catch(e){}},1850);return()=>{clearTimeout(t1);clearTimeout(t2)}},[begun]);
 const skip=()=>{if(phase===-1){if(!gemChange)onClose();else setPhase(start)}else if(phase<2)setPhase(2)};
 const IN=useMemo(()=>[...Array(12)].map((_,i)=>{const a=i/12*Math.PI*2;return {x:Math.cos(a)*150,y:Math.sin(a)*150,d:(i%4)*.12}}),[]);
 const OUT=useMemo(()=>[...Array(18)].map((_,i)=>{const a=i/18*Math.PI*2+(i%2)*.15;const r=120+(i%3)*30;return {x:Math.cos(a)*r,y:Math.sin(a)*r,d:(i%5)*.04}}),[]);
 if(phase===-1)return html`<div className="evo pa tone-away" role="dialog" aria-modal="true" aria-label="다시 오셨군요" onClick=${skip}>
  <div className="evo-text">
   <div className="evo-eyebrow">WELCOME BACK</div>
   <h2 className="evo-title">${evt.away.label}</h2>
   <p className="evo-sub">자리를 비운 사이 이런 일이 있었어요</p>
  </div>
  <div className="evo-away">${evt.away.items.map((x,i)=>html`<div key=${x.k} className="evo-away-tile" style=${{animationDelay:(.15+i*.12)+"s"}}><b>+${reduce?x.n:html`<${CountUp} n=${x.n}/>`}</b><span>${x.label}</span></div>`)}</div>
  <div className="evo-stage sm"><div className="evo-hint"><${GemView} g=${evt.from} seed=${seed} size=${150}/></div></div>
  <p className="evo-wait">${gemChange?"젬이 무언가에 반응하고 있어요…":evt.nb?"새 배지가 기다리고 있어요…":""}</p>
  <div className="evo-actions"><button className="btn" onClick=${e=>{e.stopPropagation();skip()}}>${gemChange?"젬 확인하기":evt.nb?"배지 확인하기":"좋아요"}</button></div>
 </div>`;
 const medals=evt.badges.map(id=>BADGES.find(b=>b.id===id)).filter(Boolean);
 return html`<div className=${"evo p"+phase+" tone-"+evt.head.tone} role="dialog" aria-modal="true" aria-label=${evt.head.title} onClick=${skip}>
  <div className="evo-flash"></div>
  <div className="evo-stage">
   <div className="evo-rays"></div>
   ${phase<2&&html`<div className="evo-glow"></div>${IN.map((p,i)=>html`<i key=${"in"+i} className="evo-in" style=${{"--x":p.x+"px","--y":p.y+"px",animationDelay:p.d+"s"}}></i>`)}<div className="evo-old"><${GemView} g=${evt.from} seed=${seed} size=${200}/></div>`}
   ${phase===2&&html`${!reduce&&OUT.map((p,i)=>html`<i key=${"out"+i} className="evo-out" style=${{"--x":p.x+"px","--y":p.y+"px",animationDelay:p.d+"s"}}></i>`)}
    ${gemChange?html`<div className="evo-new"><div className="float"><${GemView} g=${evt.to} seed=${seed} size=${210}/></div></div>`:html`<div className="evo-new evo-medal">${medals[0]&&html`<${Medal} b=${medals[0]} earned=${true} size=${150}/>`}</div>`}`}
  </div>
  ${phase<2?html`<p className="evo-wait">${gemChange?"젬이 반응하고 있어요…":""}</p>`:html`<div className="evo-text">
   <div className="evo-eyebrow">${evt.head.tone==="badge"?"ACHIEVEMENT":evt.head.tone==="stage"?"STAGE UP":evt.head.tone==="mark"?"MILESTONE":"GEM EVOLVED"}</div>
   <h2 className="evo-title">${evt.head.title}</h2>
   ${evt.head.sub&&html`<p className="evo-sub">${evt.head.sub}</p>`}
   ${gemChange&&html`<div className="evo-name">${gemName(evt.to)}</div>`}
   ${evt.changes.length>0&&html`<div className="evo-chips">${evt.changes.map(c=>html`<span key=${c.k} className="evo-chip"><b>${c.label}</b> ${fmtVal(c.k,c.from)} <i>→</i> ${fmtVal(c.k,c.to)}</span>`)}</div>`}
   ${gemChange&&medals.length>0&&html`<div className="evo-medals">${medals.map(b=>html`<span key=${b.id} className="evo-medal-mini"><${Medal} b=${b} earned=${true} size=${44}/><small>${b.name}</small></span>`)}</div>`}
   <div className="evo-actions"><button className="btn" onClick=${e=>{e.stopPropagation();onClose()}}>${evt.nb?`멋지다! · 배지 ${evt.nb}개 받기`:"멋지다!"}</button>${onShare&&gemChange?html`<button className="btn ghost" onClick=${e=>{e.stopPropagation();onShare()}}>카드 이미지로 남기기</button>`:null}</div>
  </div>`}
  ${phase<2&&html`<button className="evo-skip" onClick=${e=>{e.stopPropagation();setPhase(2)}}>건너뛰기</button>`}
 </div>`;
}

/* 표식 진행 — 다음 이정표까지 얼마나 남았는지 */
function MarksPanel({st,stats}){
 const lv=marksOf(st,stats),mv=stats.mv||markValues(st,stats);
 return html`<div className="panel stack marks"><div className="row between"><b>젬의 표식</b><span className="small faint">자리를 비운 사이에도 쌓여요</span></div>
  ${MARKS.map(m=>{const l=lv[m.k]||0;const nx=markNext(m,l,mv[m.k]);return html`<div key=${m.k} className="mark-row"><div className="row between"><span><b className="small">${m.label}</b> <span className="small muted">${l?m.names[l]:"아직"}</span></span><span className="small faint">${nx?`${m.src} ${mv[m.k]}${m.unit} · ${nx.left}${m.unit} 더`:"최고 단계"}</span></div><div className="mark-bar"><i style=${{width:(nx?nx.pct:100)+"%"}}></i></div></div>`})}
 </div>`;
}
