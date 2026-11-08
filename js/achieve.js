"use strict";
/* MIB CBT · 업적 도감 · 배지 보관함 · 배지별 획득 연출 */

const BADGE_GROUPS=["지속","도약","회복","함께","비밀"];
const badgeById=id=>BADGES.find(b=>b.id===id);
function badgeProg(b,stats){const [c,t]=b.prog?b.prog(stats):[b.test(stats)?1:0,1];return {cur:c,tgt:t,pct:Math.round(Math.min(1,c/t)*100)}}
function badgeReward(b){const r=[{k:"title",label:"칭호",v:`'${b.title}'`}];if(b.frame)r.push({k:"frame",label:"카드 테두리",v:CARD_FRAMES[b.frame].name});return r}
/* what the person chose to wear */
function equipped(st,stats){
 const f=st.flags||{};const earned=earnedIds(st,stats);
 const title=f.title&&earned.includes(f.title)?badgeById(f.title).title:"";
 const frame=f.frame&&BADGES.some(b=>b.frame===f.frame&&earned.includes(b.id))?f.frame:"";
 const pins=(f.pins||[]).filter(id=>earned.includes(id)).slice(0,3);
 return {title,frame,pins,earned};
}
/* pinned badges first, then the most recent ones */
function showcaseBadges(st,stats,n=3){const e=equipped(st,stats);const at=(st.flags&&st.flags.badgeAt)||{};const rest=e.earned.filter(id=>!e.pins.includes(id)).sort((a,b)=>(at[b]||0)-(at[a]||0));return [...e.pins,...rest].slice(0,n)}
const fmtDate=t=>{if(!t)return "";const d=new Date(t);return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`};

function ProgressBar({pct,color}){return html`<div className="ach-bar"><i style=${{width:pct+"%",background:color||undefined}}></i></div>`}

function BadgeRow({b,st,stats,onOpen}){
 const e=isEarned(st,stats,b);const p=badgeProg(b,stats);const hidden=b.secret&&!e;const rar=RARITY[b.rar];
 return html`<button className=${"ach-row"+(e?" got":"")} onClick=${()=>onOpen(b.id)}>
  <span className="ach-medal"><${Medal} b=${b} earned=${e} frame=${b.g==="지속"&&e?frameOf(stats.days):0} size=${48}/></span>
  <span className="grow ach-body">
   <span className="row between"><b className="ach-name">${hidden?"???":b.name}</b><span className="ach-rar" style=${{color:rar.color,borderColor:rar.color}}>${rar.name}</span></span>
   <span className="small muted">${hidden?b.hint:b.cond}</span>
   ${e?html`<span className="small ach-done">획득 · ${fmtDate(((st.flags||{}).badgeAt||{})[b.id])||"완료"}</span>`:html`<span className="ach-prog"><${ProgressBar} pct=${hidden?0:p.pct} color=${rar.color}/><span className="small faint">${hidden?"? / ?":`${p.cur} / ${p.tgt}`}</span></span>`}
   <span className="small ach-reward">보상 · 칭호 '${hidden?"???":b.title}'${b.frame?` + ${CARD_FRAMES[b.frame].name}`:""}</span>
  </span>
 </button>`;
}

function BadgeDetail({b,st,stats,update,onClose,onReplay,meName}){
 const e=isEarned(st,stats,b);const p=badgeProg(b,stats);const hidden=b.secret&&!e;const rar=RARITY[b.rar];const f=st.flags||{};
 const pinned=(f.pins||[]).includes(b.id);
 const togglePin=()=>update(s=>{const cur=(s.flags.pins||[]).filter(x=>x!==b.id);s.flags.pins=pinned?cur:[b.id,...cur].slice(0,3)});
 return html`<${Sheet} title=${hidden?"비밀 업적":b.name} onClose=${onClose}><div className="stack ach-detail">
  <div className=${"ach-hero rar-"+b.rar}><${Medal} b=${b} earned=${e} frame=${b.g==="지속"&&e?frameOf(stats.days):0} size=${132}/></div>
  <div className="row" style=${{justifyContent:"center",gap:"6px"}}><span className="ach-rar" style=${{color:rar.color,borderColor:rar.color}}>${rar.name}</span><span className="chip plain">${b.g}</span></div>
  <p className="center">${hidden?b.hint:b.desc}</p>
  <div className="panel stack small">
   <div className="row between"><b>달성 조건</b><span className="muted">${hidden?"숨겨져 있어요":b.cond}</span></div>
   ${!e&&!hidden&&html`<div className="stack" style=${{gap:"4px"}}><${ProgressBar} pct=${p.pct} color=${rar.color}/><span className="faint">${p.cur} / ${p.tgt} · ${p.tgt-p.cur>0?`${p.tgt-p.cur} 남음`:"곧 획득"}</span></div>`}
   ${e&&html`<div className="row between"><b>획득한 날</b><span className="muted">${fmtDate((f.badgeAt||{})[b.id])||"-"}</span></div>`}
   <div className="row between" style=${{alignItems:"flex-start"}}><b>보상</b><span className="stack" style=${{gap:"2px",alignItems:"flex-end"}}>${badgeReward(b).map(r=>html`<span key=${r.k} className="muted">${r.label} ${hidden&&r.k==="title"?"'???'":r.v}</span>`)}</span></div>
  </div>
  ${e&&html`<div className="stack">
   <button className="btn" onClick=${()=>onReplay(b.id)}>획득 연출 다시 보기</button>
   <div className="row"><button className="btn quiet sm grow" aria-pressed=${f.title===b.id} onClick=${()=>update(s=>{s.flags.title=s.flags.title===b.id?"":b.id})}>${f.title===b.id?"칭호 내리기":"칭호 달기"}</button><button className="btn quiet sm grow" aria-pressed=${pinned} onClick=${togglePin}>${pinned?"대표에서 빼기":"대표 배지로 걸기"}</button></div>
   ${b.frame&&html`<button className="btn quiet sm" onClick=${()=>update(s=>{s.flags.frame=s.flags.frame===b.frame?"":b.frame})}>${f.frame===b.frame?"테두리 벗기":`${CARD_FRAMES[b.frame].name} 두르기`}</button>`}
   ${f.title===b.id&&html`<p className="note center">카드에는 <b>${b.title} ${meName||"나"}</b>로 보여요.</p>`}
  </div>`}
 </div><//>`;
}

function AchieveSheet({st,stats,update,onClose,onReplay,meName,start}){
 const [tab,setTab]=useState(start==="box"?"box":"book");const [filter,setFilter]=useState("all");const [open,setOpen]=useState(null);
 useEffect(()=>{track("open_achieve",{tab})},[tab]);
 const eq=equipped(st,stats);const total=BADGES.length;const got=eq.earned.length;
 const near=BADGES.filter(b=>!isEarned(st,stats,b)&&!b.secret).map(b=>({b,p:badgeProg(b,stats)})).sort((x,y)=>y.p.pct-x.p.pct||(x.p.tgt-x.p.cur)-(y.p.tgt-y.p.cur)).slice(0,3);
 const shown=b=>{const e=isEarned(st,stats,b);return filter==="all"||(filter==="got"&&e)||(filter==="todo"&&!e)};
 const stage=stageOf(st,stats);const lv=marksOf(st,stats);const mv=stats.mv||markValues(st,stats);
 const marksGot=MARKS.reduce((n,m)=>n+(lv[m.k]||0),0);
 return html`<${Sheet} title="업적 도감" onClose=${onClose}>
  <div className="segs" role="tablist"><button role="tab" aria-pressed=${tab==="book"} aria-selected=${tab==="book"} onClick=${()=>setTab("book")}>업적 도감</button><button role="tab" aria-pressed=${tab==="box"} aria-selected=${tab==="box"} onClick=${()=>setTab("box")}>배지 보관함</button></div>
  <div className="panel ach-summary">
   <div className="ach-ring" style=${{"--p":Math.round(got/total*100)}}><b>${got}</b><span>/ ${total}</span></div>
   <div className="stack grow" style=${{gap:"4px"}}>
    <b>시즌 1 배지 ${Math.round(got/total*100)}%</b>
    <span className="small muted">연마 ${stage}/5단계 · 표식 ${marksGot}/${MARKS.length*5}</span>
    <span className="small muted">${eq.title?html`지금 칭호 <b>${eq.title}</b>`:"아직 단 칭호가 없어요"}</span>
   </div>
  </div>
  ${tab==="book"?html`
   ${near.length>0&&html`<div className="stack"><h2 className="h3">곧 받을 업적</h2><div className="ach-near">${near.map(({b,p})=>html`<button key=${b.id} className="ach-nearcard" onClick=${()=>setOpen(b.id)}><${Medal} b=${b} earned=${false} size=${40}/><b>${b.name}</b><${ProgressBar} pct=${p.pct} color=${RARITY[b.rar].color}/><span className="small faint">${p.tgt-p.cur>0?`${p.tgt-p.cur} 남음`:"곧 획득"}</span></button>`)}</div></div>`}
   <div className="row chips-filter" role="group" aria-label="보기">${[["all","전체"],["todo","진행 중"],["got","획득"]].map(([k,l])=>html`<button key=${k} className="chip" aria-pressed=${filter===k} onClick=${()=>setFilter(k)}>${l}</button>`)}</div>
   ${BADGE_GROUPS.map(gn=>{const list=BADGES.filter(b=>b.g===gn&&shown(b));if(!list.length)return null;const gg=BADGES.filter(b=>b.g===gn);return html`<div className="stack" key=${gn} style=${{gap:"6px"}}><div className="row between"><span><b>${gn}</b> <span className="small faint">${GROUP_DESC[gn]}</span></span><span className="small faint">${gg.filter(b=>isEarned(st,stats,b)).length}/${gg.length}</span></div><div className="ach-list">${list.map(b=>html`<${BadgeRow} key=${b.id} b=${b} st=${st} stats=${stats} onOpen=${setOpen}/>`)}</div></div>`})}
   <div className="stack"><h2 className="h3">연마 단계</h2><div className="ach-list">${[1,2,3,4,5].map(k=>{const done=stage>=k;const cur=stage+1===k;return html`<div key=${k} className=${"ach-row static"+(done?" got":"")}><span className="ach-step">${k}</span><span className="grow ach-body"><span className="row between"><b className="ach-name">${STAGES[k]}</b><span className="small ${done?"ach-done":"faint"}">${done?"달성":cur?"다음 목표":"잠김"}</span></span><span className="small muted">${STAGE_RULES[k].need}</span><span className="small ach-reward">보상 · 젬 각 +1${k>1?" · 변신 연출":""}${k===5?" · 명품 단계 이름":""}</span></span></div>`})}</div></div>
   <div className="stack"><h2 className="h3">젬의 표식</h2><p className="small muted">자리를 비운 사이에도 쌓이고, 한번 오르면 줄지 않아요. 젬 모양이 직접 바뀝니다.</p><div className="ach-list">${MARKS.map(m=>{const l=lv[m.k]||0;const nx=markNext(m,l,mv[m.k]);return html`<div key=${m.k} className="ach-row static"><span className="ach-step">${l}</span><span className="grow ach-body"><span className="row between"><b className="ach-name">${m.label}</b><span className="small faint">${l?markTitle(m,l):"아직"}</span></span><span className="small muted">${m.src} ${m.steps.join(" · ")}${m.unit}</span><span className="ach-lvls">${m.steps.map((t,i)=>html`<i key=${i} className=${i<l?"on":""} title=${`${t}${m.unit} · ${markTitle(m,i+1)}`}></i>`)}</span>${nx?html`<span className="ach-prog"><${ProgressBar} pct=${nx.pct}/><span className="small faint">${mv[m.k]} / ${nx.target}${m.unit}</span></span>`:html`<span className="small ach-done">최고 단계</span>`}<span className="small ach-reward">보상 · ${nx?markTitle(m,l+1):"완성"}</span></span></div>`})}</div></div>
  `:html`
   <div className="stack"><h2 className="h3">칭호</h2><p className="small muted">배지마다 칭호가 하나씩 따라와요. 하나를 골라 카드의 닉네임 앞에 달 수 있습니다.</p>
    ${eq.earned.length?html`<div className="row wrap-chips">${eq.earned.map(id=>{const b=badgeById(id);return html`<button key=${id} className="chip" aria-pressed=${st.flags.title===id} onClick=${()=>update(s=>{s.flags.title=s.flags.title===id?"":id})}>${b.title}</button>`})}</div>
    <p className="note">카드에 보이는 이름 · <b>${eq.title?eq.title+" ":""}${meName||"나"}</b></p>`:html`<p className="small faint">첫 배지를 받으면 칭호가 생겨요.</p>`}
   </div>
   <div className="stack"><div className="row between"><h2 className="h3">대표 배지</h2><span className="small faint">${eq.pins.length} / 3</span></div><p className="small muted">카드에 먼저 보일 배지를 최대 3개 고르세요. 안 고르면 최근 배지가 보여요.</p>
    <div className="ach-box">${eq.earned.map(id=>{const b=badgeById(id);const on=eq.pins.includes(id);return html`<button key=${id} className=${"ach-slot"+(on?" on":"")} aria-pressed=${on} onClick=${()=>update(s=>{const cur=(s.flags.pins||[]).filter(x=>x!==id&&eq.earned.includes(x));s.flags.pins=on?cur:[...cur,id].slice(-3)})} onDoubleClick=${()=>setOpen(id)}><${Medal} b=${b} earned=${true} frame=${b.g==="지속"?frameOf(stats.days):0} size=${54}/><b>${b.name}</b><span>${on?"대표 "+(eq.pins.indexOf(id)+1):fmtDate((st.flags.badgeAt||{})[id])}</span></button>`})}
     ${BADGES.filter(b=>!eq.earned.includes(b.id)).map(b=>html`<button key=${b.id} className="ach-slot empty" onClick=${()=>setOpen(b.id)} aria-label=${(b.secret?"비밀 업적":b.name)+" 아직"}><${Medal} b=${b} earned=${false} size=${54}/><b>${b.secret?"???":b.name}</b><span>아직</span></button>`)}
    </div><p className="small faint">배지를 길게 보려면 도감 탭에서 눌러 보세요.</p>
   </div>
   <div className="stack"><h2 className="h3">카드 테두리</h2><div className="ach-frames">${Object.entries(CARD_FRAMES).map(([k,fr])=>{const src=BADGES.find(b=>b.frame===k);const ok=src&&eq.earned.includes(src.id);return html`<button key=${k} className=${"ach-frame frame-"+k+(ok?"":" locked")} disabled=${!ok} aria-pressed=${eq.frame===k} onClick=${()=>update(s=>{s.flags.frame=s.flags.frame===k?"":k})}><b>${fr.name}</b><span className="small">${ok?(eq.frame===k?"두르는 중":"두르기"):`'${src.secret?"???":src.name}' 배지 보상`}</span></button>`})}</div></div>
  `}
  ${open&&html`<${BadgeDetail} b=${badgeById(open)} st=${st} stats=${stats} update=${update} meName=${meName} onClose=${()=>setOpen(null)} onReplay=${onReplay}/>`}
 <//>`;
}

/* 배지 하나하나의 획득 연출 — 희귀도에 따라 커지고, 배지의 그림이 파편이 되어 터진다 */
function BadgeOverlay({ids,onClose,onEquip,onBook,equippedTitle,replay}){
 const [i,setI]=useState(0);const b=badgeById(ids[i]);const rar=RARITY[b.rar];
 const reduce=useMemo(()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}},[]);
 const dur=[0,900,1300,1700,2300][rar.n];
 const [phase,setPhase]=useState(reduce?2:0);
 useEffect(()=>{track(replay?"badge_replay":"badge_show",{id:b.id,rar:b.rar});if(reduce){setPhase(2);return}setPhase(0);
  const t1=setTimeout(()=>setPhase(1),dur),t2=setTimeout(()=>{setPhase(2);try{navigator.vibrate&&navigator.vibrate(rar.n>=3?[30,40,30,40,90]:[20,40,60])}catch(e){}},dur+(rar.n>=2?320:60));return()=>{clearTimeout(t1);clearTimeout(t2)}},[i]);
 const parts=useMemo(()=>[...Array(8+rar.n*6)].map((_,k)=>{const a=k/(8+rar.n*6)*Math.PI*2+(k%2)*.2;const r=110+(k%4)*28+rar.n*8;return {x:Math.cos(a)*r,y:Math.sin(a)*r,d:(k%5)*.05,s:.5+(k%3)*.25,glyph:k%3===0}}),[i]);
 const gsvg=useMemo(()=>`<svg viewBox="0 0 30 30" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${glyph(b.glyph)}</svg>`,[i]);
 const last=i>=ids.length-1;const next=()=>{if(last)onClose();else setI(i+1)};
 const skip=()=>{if(phase<2)setPhase(2)};
 return html`<div className=${"bdg p"+phase+" rar-"+b.rar} role="dialog" aria-modal="true" aria-label=${"배지 획득: "+b.name} onClick=${skip} style=${{"--rc":rar.color,"--gc":GROUPS[b.g]}} key=${i}>
  <div className="bdg-flash"></div>
  <div className="bdg-stage">
   <div className="bdg-rays"></div><div className="bdg-halo"></div>
   ${phase===2&&!reduce&&parts.map((p,k)=>p.glyph?html`<span key=${k} className="bdg-part g" style=${{"--x":p.x+"px","--y":p.y+"px","--s":p.s,animationDelay:p.d+"s"}} dangerouslySetInnerHTML=${{__html:gsvg}}></span>`:html`<i key=${k} className="bdg-part" style=${{"--x":p.x+"px","--y":p.y+"px","--s":p.s,animationDelay:p.d+"s"}}></i>`)}
   <div className="bdg-medal"><${Medal} b=${b} earned=${true} frame=${b.g==="지속"?1:0} size=${170}/></div>
  </div>
  ${phase<2?html`<p className="evo-wait">${b.rar==="legend"?"전설의 빛이 모이고 있어요…":b.rar==="epic"?"특별한 무언가가 다가와요…":"새 배지가 도착했어요…"}</p>`:html`<div className="evo-text">
   <div className="evo-eyebrow" style=${{color:rar.color}}>${replay?"REPLAY · ":""}${rar.en}</div>
   <h2 className="evo-title">${b.name}</h2>
   <p className="evo-sub">${b.desc}</p>
   <div className="evo-chips">${badgeReward(b).map(r=>html`<span key=${r.k} className="evo-chip"><b>${r.label}</b> ${r.v}</span>`)}</div>
   <div className="evo-actions">
    <button className="btn" onClick=${e=>{e.stopPropagation();next()}}>${last?"좋아요!":`다음 배지 (${i+2}/${ids.length})`}</button>
    ${equippedTitle!==b.id&&onEquip&&html`<button className="btn ghost" onClick=${e=>{e.stopPropagation();onEquip(b.id);next()}}>칭호 '${b.title}' 달기</button>`}
    ${onBook&&html`<button className="linkbtn evo-link" onClick=${e=>{e.stopPropagation();onBook(b.id)}}>업적 도감에서 보기</button>`}
   </div>
  </div>`}
  ${phase<2&&html`<button className="evo-skip" onClick=${e=>{e.stopPropagation();setPhase(2)}}>건너뛰기</button>`}
 </div>`;
}
