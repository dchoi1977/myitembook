"use strict";
/* MIB CBT · My GEMS — 친구들의 젬을 보석함 인벤토리로, 누르면 카드 이미지를 크게 */

/* public card → the same 1080×1350 card image as '카드 이미지 저장' */
async function renderPublicCardImage(card,name){
 const d=card||{};const W=1080,H=1350;const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
 try{await Promise.all([document.fonts.load('700 48px "Noto Serif KR"'),document.fonts.load('500 30px "Noto Sans KR"'),document.fonts.load('700 30px "Noto Sans KR"')])}catch(e){}
 const SERIF='"Noto Serif KR","Apple SD Gothic Neo",serif',SANS='"Noto Sans KR","Apple SD Gothic Neo",sans-serif';
 x.fillStyle="#F4F1E9";x.fillRect(0,0,W,H);x.strokeStyle="#D6DACF";x.lineWidth=2;x.strokeRect(40,40,W-80,H-80);
 const FR={gold:"#C9A45A",rose:"#C9878F",star:"#7E95C9",dawn:"#E7A86B",ring:"#8C6A3A",crest:"#7A1F2B"};
 if(d.frame){x.lineWidth=8;if(d.frame==="seven"){const gr=x.createLinearGradient(40,40,W-40,H-40);["#E57373","#F0B65A","#E8D96A","#7CC08A","#6AA9D8","#8A7CD0","#C77BB8"].forEach((cl,i,a)=>gr.addColorStop(i/(a.length-1),cl));x.strokeStyle=gr}else x.strokeStyle=FR[d.frame]||"#C9A45A";x.strokeRect(40,40,W-80,H-80)}
 x.fillStyle="#66706E";x.font=`700 26px ${SANS}`;x.textAlign="left";x.fillText("MYITEMBOOK · "+MIB_CONFIG.cohort,90,120);
 x.textAlign="right";x.fillText(d.title?d.title+" "+name:"@"+name,W-90,120);x.textAlign="center";
 if(typeof drawAgeDepth==="function")drawAgeDepth(x,d.gem&&d.gem.rings);
 if(typeof drawConstellation==="function"&&d.zodiac)drawConstellation(x,zodiacByKey(d.zodiac));
 const g=await svgImage(gemSVG(d.gem||{},d.gemName||name,"pc"),520,559);x.drawImage(g,(W-520)/2,170);
 x.fillStyle="#173D3B";x.font=`700 60px ${SERIF}`;x.fillText(d.gemName||"",W/2,800);
 const CR=d.crests||[],ML=(d.sample||d.mottoOwn)?(d.motto||""):"",IDL=CR.length>0||!!ML;
 if(d.sentence){x.fillStyle="#1F2A28";x.font=`500 40px ${SERIF}`;wrapLines(x,d.sentence,W-220,IDL?2:3).forEach((l,i)=>x.fillText(l,W/2,880+i*60))}
 const kw=(d.keywords||[]).map(t=>({t,tag:false})).concat((d.tags||[]).map(t=>({t,tag:true})));
 if(kw.length){x.font=`700 30px ${SANS}`;const tot=kw.reduce((s,k)=>s+x.measureText(k.t).width+60,0)-16;let cx=(W-tot)/2;kw.forEach(({t,tag})=>{const w=x.measureText(t).width+44;x.beginPath();const KY=IDL?975:1080;x.roundRect?x.roundRect(cx,KY,w,56,28):x.rect(cx,KY,w,56);if(tag){x.strokeStyle="#A7B5A1";x.lineWidth=2.5;x.stroke()}else{x.fillStyle="#E4E9DF";x.fill()}x.fillStyle=tag?"#465250":"#173D3B";x.textAlign="center";x.fillText(t,cx+w/2,KY+38);cx+=w+16})}
 if(IDL&&typeof drawCrestRow==="function")await drawCrestRow(x,CR,ML,{top:1060,pub:true});
 const stg=d.stage||1;x.fillStyle="#66706E";x.font=`500 ${IDL?22:26}px ${SANS}`;x.textAlign="center";x.fillText(`연마 ${stg}단계 · ${STAGES[stg]||""}`,W/2,IDL?(CR.length?1262:1200):1210);
 x.fillStyle="#93A09B";x.font=`500 ${IDL?19:22}px ${SANS}`;x.fillText("누구나 원석으로 태어난다. 살아가는 만큼, 보석이 된다.",W/2,IDL?H-56:H-80);
 return c;
}

const UNCUT={stone:"수정",form:"덩이",texture:"유백",light:"번짐",facets:6,hardness:1,grain:0,polish:1};
function MyGems({fids,cardOf,names,soc,uid,openUser,toast,onFind,reloadSoc,demo}){
 const desk=useDesktop();const cols=desk?6:4;
 const sorted=[...fids].sort((a,b)=>(cardOf(b)?1:0)-(cardOf(a)?1:0)||nick(names,a).localeCompare(nick(names,b)));
 const slots=Math.max(cols*2,Math.ceil((sorted.length+1)/cols)*cols);
 const [pop,setPop]=useState(null);
 const SK="mib_gemseen_"+uid;const NEW_MS=72*36e5;const upAt=id=>{const c=cardOf(id);return c?Math.max(Date.parse(c.updated_at||0)||0,(c.data&&c.data.updatedAt)||0):0};
 const [seen,setSeen]=useState(()=>{try{const v=JSON.parse(localStorage.getItem(SK)||"null");if(v&&typeof v==="object")return v}catch(e){}return null});
 const [snaps,setSnaps]=useState(()=>gnLoad(uid));const [news,setNews]=useState(null);
 useEffect(()=>{if(seen||!fids.length)return;const base={_t:Date.now()};setSeen(base);try{localStorage.setItem(SK,JSON.stringify(base))}catch(e){}},[fids.length,!!seen]);
 /* 처음 보는 친구는 지금 모습을 기준으로 조용히 기억(옛 방식으로 NEW인 친구는 소식으로 대신 보여 준다) */
 const oldNew=id=>{if(!seen)return false;const u=upAt(id);return u>0&&u>(seen[id]||seen._t||0)&&Date.now()-u<NEW_MS};
 useEffect(()=>{if(!seen)return;let ch=false;const nx={...snaps};fids.forEach(id=>{const c=cardOf(id);if(c&&!nx[id]&&!oldNew(id)){nx[id]=friendSnap(c);ch=true}});if(ch){setSnaps(nx);gnSave(uid,nx)}},[fids.join(","),!!seen,fids.map(id=>upAt(id)).join(",")]);
 const diffOf=id=>{const c=cardOf(id);const p=snaps[id];return c&&p?friendDiff(p,friendSnap(c)):[]};
 const isNew=id=>{const c=cardOf(id);if(!c)return false;return snaps[id]?diffOf(id).length>0:oldNew(id)};
 const remember=id=>{const c=cardOf(id);if(!c)return;const nx={...snaps,[id]:friendSnap(c)};setSnaps(nx);gnSave(uid,nx);const sv={...(seen||{_t:Date.now()}),[id]:Date.now()};setSeen(sv);try{localStorage.setItem(SK,JSON.stringify(sv))}catch(e){}};
 async function openNews(id){const c=cardOf(id);const prev=snaps[id]||null;const changes=prev?diffOf(id):[];let feed=[];
  if(!prev){try{const f=await api.feed();const since=(seen&&(seen[id]||seen._t))||0;feed=(f||[]).filter(ev=>ev.user_id===id&&Date.parse(ev.created_at)>since-864e5)}catch(e){}}
  setNews({id,prev,card:c,changes,feed});track("gemnews_open",{n:changes.length,first:!prev})}
 const closeNews=then=>{const id=news&&news.id;if(id)remember(id);setNews(null);if(then)then(id)};
 const shown=sorted.filter(id=>cardOf(id)).length;
 return html`<section className="mygems" aria-label="My GEMS">
  <div className="mg-head"><div><div className="mg-eyebrow">INVENTORY</div><h2 className="mg-title">My GEMS</h2></div><span className="mg-count">${sorted.length}<small> 개의 젬 · 빛나는 ${shown}</small></span></div>
  ${(()=>{const gems=sorted.map(id=>cardOf(id)).filter(Boolean).map(c=>c.data);const ids=gems.map(d=>({...gemIdentity(d.gem||{},d.gemName),stone:d.gem&&d.gem.stone}));
   const vars=new Set(ids.map(x=>x.variant)),cuts=new Set(ids.map(x=>x.cut)),feats=new Set(ids.flatMap(x=>x.feats));const FK=["bubbles","needles","phantom","bicolor","cat","star"];const ALLC=[...new Set(Object.values(CUTS).flat().map(c=>c[0])),"하트 컷","별 컷"];const nV=Object.values(VARIANTS).flat().length;
   return html`<details className="mg-codex"><summary><span>수집 도감</span><span className="mg-cx-n"><span>빛깔 <b>${vars.size}</b>/${nV}</span> · <span>모양 <b>${cuts.size}</b>/${ALLC.length}</span> · <span>발현 <b>${new Set(ids.flatMap(x=>(x.aw||[]).map(a=>a.k))).size}</b>/${AWAKEN.length}</span> · <span>특성 <b>${feats.size}</b>/${FK.length}</span></span></summary>
    <div className="mg-cx-h">빛깔 · 원석 9종 × 세 갈래 (✦ 희귀 변종)</div>
    <div className="mg-cx-vars">${STONE_NAMES.map(n=>html`<div key=${n} className="mg-cx-vrow"><span className="mg-cx-vn">${n}</span>${VARIANTS[n].map((v,k)=>{const on=vars.has(v.n);const c=v.base||STONES[n].base;return html`<span key=${k} className=${"mg-cx-v"+(on?" on":"")} title=${on?v.n:"？？？"}><i style=${{background:on?c:"transparent",borderColor:c}}></i>${on?v.n:(v.rare?"✦ ？？？":"？？？")}</span>`})}</div>`)}</div>
    <div className="mg-cx-h">모양</div>
    <div className="mg-cx-row">${ALLC.map(k=>html`<span key=${k} className=${"mg-cx-feat"+(cuts.has(k)?" on":"")}>${cuts.has(k)?k:"？？？"}</span>`)}</div>
    <div className="mg-cx-h">발현 · 연마 단계가 오를 때 깨어나는 것</div>
    <div className="mg-cx-row">${(()=>{const got=new Set(ids.flatMap(x=>(x.aw||[]).map(a=>a.k)));return AWAKEN.map(a=>html`<span key=${a.k} className=${"mg-cx-feat"+(got.has(a.k)?" on":"")+" r-"+AW_TIERS[a.t][0]}>${got.has(a.k)?a.n:"？？？"}<small>${AW_TIERS[a.t][0]}</small></span>`)})()}</div>
    <div className="mg-cx-h">숨은 특성</div>
    <div className="mg-cx-row">${FK.map(k=>html`<span key=${k} className=${"mg-cx-feat"+(feats.has(k)?" on":"")+" r-"+INCLUSIONS[k].rar}>${feats.has(k)?INCLUSIONS[k].name:"？？？"}<small>${INCLUSIONS[k].rar}</small></span>`)}</div>
    <p className="mg-note">같은 원석이라도 빛깔·모양·무늬·숨은 특성이 사람마다 달라요. 친구를 맺고 카드를 열어 도감을 채워 보세요.</p></details>`})()}
  <div className="mg-tray" style=${{gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`}}>
   ${Array.from({length:slots}).map((_,i)=>{const id=sorted[i];
    if(!id)return i===sorted.length?html`<button key=${"add"+i} className="mg-slot add" onClick=${onFind}><span className="mg-plus" aria-hidden="true">+</span><span className="mg-name">친구 찾기</span></button>`:html`<div key=${"e"+i} className="mg-slot empty" aria-hidden="true"></div>`;
    const c=cardOf(id);const g=c?c.data.gem:UNCUT;
    return html`<button key=${id} className=${"mg-slot"+(c?"":" sealed")} onClick=${()=>{const nw=isNew(id);track("mygems_open",{card:!!c,fresh:nw});if(nw){openNews(id);return}if(c)remember(id);setPop(id)}} aria-label=${nick(names,id)+(c?" · "+c.data.gemName:" · 아직 원석")+(isNew(id)?" · 달라진 것: "+(diffOf(id).map(x=>x.h).slice(0,3).join(", ")||"새 소식"):"")}>
     ${isNew(id)&&html`<span className="mg-new">NEW</span>`}
     <span className="mg-gem"><${GemView} g=${g} seed=${c?c.data.gemName:id} size=${desk?74:54}/></span>
     ${c&&(()=>{const f=gemFeatures(c.data.gem||{},c.data.gemName);const I=gemIdentity(c.data.gem||{},c.data.gemName);const r=f.find(k=>k==="star"||k==="cat");const ep=(I.aw||[]).some(a=>a.t>=3);return (r||I.rareVariant||ep)?html`<span className="mg-rare" title=${r?INCLUSIONS[r].name:I.variant}>✦</span>`:null})()}
     ${c&&html`<span className="mg-stage" aria-hidden="true">${Array.from({length:STAGE_MAX},(_,i)=>i+1).map(k=>html`<i key=${k} className=${k<=(c.data.stage||1)?"on":""}></i>`)}</span>`}
     ${(()=>{const b=bondOf(uid,id,soc.friendships);return b&&b.name?html`<span className="mg-bond" title=${b.name}><${BondIcon} name=${b.name} size=${20}/></span>`:null})()}
     <span className="mg-name">${nick(names,id)}</span>
    </button>`})}
  </div>
  <p className="mg-note">카드를 공개한 친구는 빛나는 젬으로, 아직 공개 전인 친구는 깎이기 전 원석으로 담겨요. 젬을 누르면 카드가 열립니다.</p>
  ${news&&html`<${GemNews} key=${news.id} name=${nick(names,news.id)} prev=${news.prev} card=${news.card} changes=${news.changes} feed=${news.feed} onClose=${()=>closeNews()} onCard=${()=>closeNews(id=>setPop(id))} onProfile=${()=>closeNews(id=>openUser(id,"cheer"))} uid=${uid} fid=${news.id} soc=${soc} reloadSoc=${reloadSoc} toast=${toast} demo=${demo}/>`}
  ${pop&&(cardOf(pop)?html`<${CardShowcase} key=${pop} faces=${otherCardFaces(cardOf(pop),nick(names,pop),pop)} toast=${toast} onClose=${()=>setPop(null)} onProfile=${()=>{const id=pop;setPop(null);openUser(id)}}/>`:html`<${GemPopup} id=${pop} card=${null} names=${names} onClose=${()=>setPop(null)} openUser=${id=>{setPop(null);openUser(id)}} toast=${toast}/>`)}
 </section>`;
}
function GemPopup({id,card,names,onClose,openUser,toast}){useBackLayer(onClose);
 const [url,setUrl]=useState(null);const [asked,setAsked]=useState(false);const name=nick(names,id);
 useEffect(()=>{if(!card)return;let alive=true;renderPublicCardImage(card.data,name).then(c=>alive&&setUrl(c.toDataURL("image/png"))).catch(()=>{});return()=>{alive=false}},[id]);
 useEffect(()=>{const k=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[]);
 async function ask(){setAsked(true);try{const r=await api.requestCard(id);toast(r==="sent"?`${name}님에게 카드 공개를 부탁했어요.`:r==="already_asked"?"오늘은 이미 요청했어요.":"요청을 보내지 못했어요.")}catch(e){setAsked(false);toast("요청을 보내지 못했어요.")}}
 return html`<div className="gp" role="dialog" aria-modal="true" aria-label=${name+"의 카드"} onClick=${onClose}>
  <div className="gp-in" onClick=${e=>e.stopPropagation()}>
   ${card?html`${url?html`<img className="gp-img" src=${url} alt=${name+"의 젬 카드: "+(card.data.gemName||"")}/>`:html`<div className="gp-loading"><div className="pulse"><${GemView} g=${card.data.gem} seed=${card.data.gemName} size=${200}/></div><span>카드를 펼치는 중…</span></div>`}
     <div className="gp-actions"><button className="btn" onClick=${()=>openUser(id)}>아틀리에로 ›</button><button className="btn ghost" onClick=${onClose}>닫기</button></div>`
   :html`<div className="gp-sealed"><${GemView} g=${UNCUT} seed=${id} size=${200} className="float"/><b className="serif">${name}님의 원석</b><span>아직 카드를 공개하지 않았어요. 공개하면 이 원석이 젬으로 빛나요.</span>
     <div className="gp-actions"><button className="btn" disabled=${asked} onClick=${ask}>${asked?"요청을 보냈어요":"카드 공개 요청하기"}</button><button className="btn ghost" onClick=${()=>openUser(id)}>프로필 보기</button><button className="btn ghost" onClick=${onClose}>닫기</button></div></div>`}
  </div>
 </div>`;
}
