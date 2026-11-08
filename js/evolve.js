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
const EVO_FIELDS=[["stage","단계"],["stone","색"],["form","형"],["texture","질"],["light","빛"],["symbol","상"],["hardness","강"],["grain","결"],["facets","각"]];
function gemSnap(g,stage){return {stone:g.stone,form:g.form,texture:g.texture,light:g.light,symbol:g.symbol,hardness:g.hardness,grain:g.grain,facets:g.facets,lightName:g.lightName,fp:g.fp,stage}}
function evoDiff(a,b){if(!a||!b)return [];return EVO_FIELDS.filter(([k])=>a[k]!==b[k]).map(([k,label])=>({k,label,from:a[k],to:b[k]}))}
function evoHeadline(changes,badges,stats){
 const has=k=>changes.find(c=>c.k===k);
 if(has("stage")){const c=has("stage");return {title:`${STAGES[c.to]} 단계 달성!`,sub:`연마 ${c.to}단계 · ${STAGE_RULES[c.to].why}`,tone:"stage"}}
 if(has("stone"))return {title:"젬의 색이 바뀌었어요",sub:`${has("stone").to} · ${STONES[has("stone").to].meaning}`,tone:"reshape"};
 if(has("form")||has("texture")||has("light")||has("symbol"))return {title:"젬이 새 모습을 찾았어요",sub:"새 관점으로 다시 깎였습니다",tone:"reshape"};
 if(has("hardness")){const c=has("hardness");return {title:"젬이 단단해졌어요",sub:`활동 ${stats?stats.active:""}일 · 강(剛) ${c.from} → ${c.to}`,tone:"harden"}}
 if(has("grain"))return {title:"금빛 결이 새겨졌어요",sub:"멈췄다가 다시 시작한 순간이 젬에 남았어요",tone:"grain"};
 if(has("facets")){const c=has("facets");return {title:"새 면이 깎였어요",sub:`각(角) ${c.from}면 → ${c.to}면`,tone:"facet"}}
 if(badges&&badges.length){const b=BADGES.find(x=>x.id===badges[0]);return {title:"배지 획득!",sub:b?`${b.name} · ${b.desc}`:"",tone:"badge"}}
 return {title:"젬이 반응했어요",sub:"",tone:"stage"};
}
const fmtVal=(k,v)=>k==="stage"?`${v}단계 ${STAGES[v]||""}`:k==="facets"?`${v}면`:k==="hardness"?`${v}/5`:k==="grain"?`${v}줄`:String(v);

function EvolveOverlay({evt,seed,onClose,onShare}){
 const reduce=useMemo(()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}},[]);
 const gemChange=evt.changes.length>0;const [phase,setPhase]=useState(reduce||!gemChange?2:0);
 useEffect(()=>{track("evolve_show",{tone:evt.head.tone,n:evt.changes.length,b:evt.badges.length});if(reduce||!gemChange){try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}return}
  const t1=setTimeout(()=>setPhase(1),1500),t2=setTimeout(()=>{setPhase(2);try{navigator.vibrate&&navigator.vibrate([20,50,70])}catch(e){}},1850);return()=>{clearTimeout(t1);clearTimeout(t2)}},[]);
 const skip=()=>{if(phase<2)setPhase(2)};
 const IN=useMemo(()=>[...Array(12)].map((_,i)=>{const a=i/12*Math.PI*2;return {x:Math.cos(a)*150,y:Math.sin(a)*150,d:(i%4)*.12}}),[]);
 const OUT=useMemo(()=>[...Array(18)].map((_,i)=>{const a=i/18*Math.PI*2+(i%2)*.15;const r=120+(i%3)*30;return {x:Math.cos(a)*r,y:Math.sin(a)*r,d:(i%5)*.04}}),[]);
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
   <div className="evo-eyebrow">${evt.head.tone==="badge"?"ACHIEVEMENT":evt.head.tone==="stage"?"STAGE UP":"GEM EVOLVED"}</div>
   <h2 className="evo-title">${evt.head.title}</h2>
   ${evt.head.sub&&html`<p className="evo-sub">${evt.head.sub}</p>`}
   ${gemChange&&html`<div className="evo-name">${gemName(evt.to)}</div>`}
   ${evt.changes.length>0&&html`<div className="evo-chips">${evt.changes.map(c=>html`<span key=${c.k} className="evo-chip"><b>${c.label}</b> ${fmtVal(c.k,c.from)} <i>→</i> ${fmtVal(c.k,c.to)}</span>`)}</div>`}
   ${gemChange&&medals.length>0&&html`<div className="evo-medals">${medals.map(b=>html`<span key=${b.id} className="evo-medal-mini"><${Medal} b=${b} earned=${true} size=${44}/><small>${b.name}</small></span>`)}</div>`}
   <div className="evo-actions"><button className="btn" onClick=${e=>{e.stopPropagation();onClose()}}>멋지다!</button>${onShare&&gemChange?html`<button className="btn ghost" onClick=${e=>{e.stopPropagation();onShare()}}>카드 이미지로 남기기</button>`:null}</div>
  </div>`}
  ${phase<2&&html`<button className="evo-skip" onClick=${e=>{e.stopPropagation();setPhase(2)}}>건너뛰기</button>`}
 </div>`;
}
