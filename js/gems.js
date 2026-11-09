"use strict";
/* MIB CBT · My GEMS — 친구들의 젬을 보석함 인벤토리로, 누르면 카드 이미지를 크게 */

/* public card → the same 1080×1350 card image as '카드 이미지 저장' */
async function renderPublicCardImage(card,name){
 const d=card||{};const W=1080,H=1350;const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
 try{await Promise.all([document.fonts.load('700 48px "Noto Serif KR"'),document.fonts.load('500 30px "Noto Sans KR"'),document.fonts.load('700 30px "Noto Sans KR"')])}catch(e){}
 const SERIF='"Noto Serif KR","Apple SD Gothic Neo",serif',SANS='"Noto Sans KR","Apple SD Gothic Neo",sans-serif';
 x.fillStyle="#F4F1E9";x.fillRect(0,0,W,H);x.strokeStyle="#D6DACF";x.lineWidth=2;x.strokeRect(40,40,W-80,H-80);
 const FR={gold:"#C9A45A",rose:"#C9878F",star:"#7E95C9",dawn:"#E7A86B"};
 if(d.frame){x.lineWidth=8;if(d.frame==="seven"){const gr=x.createLinearGradient(40,40,W-40,H-40);["#E57373","#F0B65A","#E8D96A","#7CC08A","#6AA9D8","#8A7CD0","#C77BB8"].forEach((cl,i,a)=>gr.addColorStop(i/(a.length-1),cl));x.strokeStyle=gr}else x.strokeStyle=FR[d.frame]||"#C9A45A";x.strokeRect(40,40,W-80,H-80)}
 x.fillStyle="#66706E";x.font=`700 26px ${SANS}`;x.textAlign="left";x.fillText("MYITEMBOOK · "+MIB_CONFIG.cohort,90,120);
 x.textAlign="right";x.fillText(d.title?d.title+" "+name:"@"+name,W-90,120);x.textAlign="center";
 if(typeof drawConstellation==="function"&&d.zodiac)drawConstellation(x,zodiacByKey(d.zodiac));
 const g=await svgImage(gemSVG(d.gem||{},d.gemName||name,"pc"),520,559);x.drawImage(g,(W-520)/2,170);
 x.fillStyle="#173D3B";x.font=`700 60px ${SERIF}`;x.fillText(d.gemName||"",W/2,800);
 if(d.sentence){x.fillStyle="#1F2A28";x.font=`500 40px ${SERIF}`;wrapLines(x,d.sentence,W-220,3).forEach((l,i)=>x.fillText(l,W/2,880+i*60))}
 const kw=(d.keywords||[]).map(t=>({t,tag:false})).concat((d.tags||[]).map(t=>({t,tag:true})));
 if(kw.length){x.font=`700 30px ${SANS}`;const tot=kw.reduce((s,k)=>s+x.measureText(k.t).width+60,0)-16;let cx=(W-tot)/2;kw.forEach(({t,tag})=>{const w=x.measureText(t).width+44;x.beginPath();x.roundRect?x.roundRect(cx,1080,w,56,28):x.rect(cx,1080,w,56);if(tag){x.strokeStyle="#A7B5A1";x.lineWidth=2.5;x.stroke()}else{x.fillStyle="#E4E9DF";x.fill()}x.fillStyle=tag?"#465250":"#173D3B";x.textAlign="center";x.fillText(t,cx+w/2,1118);cx+=w+16})}
 const stg=d.stage||1;x.fillStyle="#66706E";x.font=`500 26px ${SANS}`;x.fillText(`연마 ${stg}단계 · ${STAGES[stg]||""}`,W/2,1210);
 x.fillStyle="#93A09B";x.font=`500 22px ${SANS}`;x.fillText("누구나 원석으로 태어난다. 살아가는 만큼, 보석이 된다.",W/2,H-80);
 return c;
}

const UNCUT={stone:"수정",form:"덩이",texture:"유백",light:"번짐",facets:6,hardness:1,grain:0};
function MyGems({fids,cardOf,names,soc,uid,openUser,toast,onFind}){
 const desk=useDesktop();const cols=desk?6:4;
 const sorted=[...fids].sort((a,b)=>(cardOf(b)?1:0)-(cardOf(a)?1:0)||nick(names,a).localeCompare(nick(names,b)));
 const slots=Math.max(cols*2,Math.ceil((sorted.length+1)/cols)*cols);
 const [pop,setPop]=useState(null);
 const shown=sorted.filter(id=>cardOf(id)).length;
 return html`<section className="mygems" aria-label="My GEMS">
  <div className="mg-head"><div><div className="mg-eyebrow">INVENTORY</div><h2 className="mg-title">My GEMS</h2></div><span className="mg-count">${sorted.length}<small> 개의 젬 · 빛나는 ${shown}</small></span></div>
  <div className="mg-tray" style=${{gridTemplateColumns:`repeat(${cols},minmax(0,1fr))`}}>
   ${Array.from({length:slots}).map((_,i)=>{const id=sorted[i];
    if(!id)return i===sorted.length?html`<button key=${"add"+i} className="mg-slot add" onClick=${onFind}><span className="mg-plus" aria-hidden="true">+</span><span className="mg-name">친구 찾기</span></button>`:html`<div key=${"e"+i} className="mg-slot empty" aria-hidden="true"></div>`;
    const c=cardOf(id);const g=c?c.data.gem:UNCUT;
    return html`<button key=${id} className=${"mg-slot"+(c?"":" sealed")} onClick=${()=>{setPop(id);track("mygems_open",{card:!!c})}} aria-label=${nick(names,id)+(c?" · "+c.data.gemName:" · 아직 원석")}>
     <span className="mg-gem"><${GemView} g=${g} seed=${c?c.data.gemName:id} size=${desk?74:54}/></span>
     ${c&&html`<span className="mg-stage" aria-hidden="true">${[1,2,3,4,5].map(k=>html`<i key=${k} className=${k<=(c.data.stage||1)?"on":""}></i>`)}</span>`}
     <span className="mg-name">${nick(names,id)}</span>
    </button>`})}
  </div>
  <p className="mg-note">카드를 공개한 친구는 빛나는 젬으로, 아직 공개 전인 친구는 깎이기 전 원석으로 담겨요. 젬을 누르면 카드가 열립니다.</p>
  ${pop&&(cardOf(pop)?html`<${CardShowcase} key=${pop} faces=${otherCardFaces(cardOf(pop),nick(names,pop),pop)} toast=${toast} onClose=${()=>setPop(null)} onProfile=${()=>{const id=pop;setPop(null);openUser(id)}}/>`:html`<${GemPopup} id=${pop} card=${null} names=${names} onClose=${()=>setPop(null)} openUser=${id=>{setPop(null);openUser(id)}} toast=${toast}/>`)}
 </section>`;
}
function GemPopup({id,card,names,onClose,openUser,toast}){
 const [url,setUrl]=useState(null);const [asked,setAsked]=useState(false);const name=nick(names,id);
 useEffect(()=>{if(!card)return;let alive=true;renderPublicCardImage(card.data,name).then(c=>alive&&setUrl(c.toDataURL("image/png"))).catch(()=>{});return()=>{alive=false}},[id]);
 useEffect(()=>{const k=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[]);
 async function ask(){setAsked(true);try{const r=await api.requestCard(id);toast(r==="sent"?`${name}님에게 카드 공개를 부탁했어요.`:r==="already_asked"?"오늘은 이미 요청했어요.":"요청을 보내지 못했어요.")}catch(e){setAsked(false);toast("요청을 보내지 못했어요.")}}
 return html`<div className="gp" role="dialog" aria-modal="true" aria-label=${name+"의 카드"} onClick=${onClose}>
  <div className="gp-in" onClick=${e=>e.stopPropagation()}>
   ${card?html`${url?html`<img className="gp-img" src=${url} alt=${name+"의 젬 카드: "+(card.data.gemName||"")}/>`:html`<div className="gp-loading"><div className="pulse"><${GemView} g=${card.data.gem} seed=${card.data.gemName} size=${200}/></div><span>카드를 펼치는 중…</span></div>`}
     <div className="gp-actions"><button className="btn" onClick=${()=>openUser(id)}>카드 자세히 · 공감 남기기</button><button className="btn ghost" onClick=${onClose}>닫기</button></div>`
   :html`<div className="gp-sealed"><${GemView} g=${UNCUT} seed=${id} size=${200} className="float"/><b className="serif">${name}님의 원석</b><span>아직 카드를 공개하지 않았어요. 공개하면 이 원석이 젬으로 빛나요.</span>
     <div className="gp-actions"><button className="btn" disabled=${asked} onClick=${ask}>${asked?"요청을 보냈어요":"카드 공개 요청하기"}</button><button className="btn ghost" onClick=${()=>openUser(id)}>프로필 보기</button><button className="btn ghost" onClick=${onClose}>닫기</button></div></div>`}
  </div>
 </div>`;
}
