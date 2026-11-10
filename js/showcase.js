"use strict";
/* MIB CBT · 카드 보기 — 카드덱 위의 카드, 앞면(카드 이미지)과 뒷면(육각형·선반)을 뒤집어 보기 */

function loadImg(src){return new Promise(res=>{if(!src)return res(null);const im=new Image();if(!/^data:/.test(src))im.crossOrigin="anonymous";im.onload=()=>res(im);im.onerror=()=>res(null);im.src=src})}
function rr(x,X,Y,W,H,R){x.beginPath();if(x.roundRect)x.roundRect(X,Y,W,H,R);else x.rect(X,Y,W,H)}

/* back face: 1080×1350 — six axes + shelf highlights + badges */
async function renderCardBack(d){
 const W=1080,H=1350;const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
 try{await Promise.all([document.fonts.load('700 48px "Noto Serif KR"'),document.fonts.load('500 30px "Noto Sans KR"'),document.fonts.load('700 30px "Noto Sans KR"')])}catch(e){}
 const SERIF='"Noto Serif KR","Apple SD Gothic Neo",serif',SANS='"Noto Sans KR","Apple SD Gothic Neo",sans-serif';
 const st=STONES[(d.gem||{}).stone]||STONES["비취"];
 // deep paper with a stone-coloured glow
 const bg=x.createLinearGradient(0,0,0,H);bg.addColorStop(0,"#173D3B");bg.addColorStop(1,"#0E2624");x.fillStyle=bg;x.fillRect(0,0,W,H);
 const glow=x.createRadialGradient(W/2,525,40,W/2,525,520);glow.addColorStop(0,st.base+"55");glow.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=glow;x.fillRect(0,0,W,H);
 x.strokeStyle="rgba(216,180,101,.55)";x.lineWidth=2;x.strokeRect(40,40,W-80,H-80);
 const FR={gold:"#C9A45A",rose:"#C9878F",star:"#7E95C9",dawn:"#E7A86B",ring:"#8C6A3A",crest:"#7A1F2B"};
 if(d.frame){x.lineWidth=8;if(d.frame==="seven"){const gr=x.createLinearGradient(40,40,W-40,H-40);["#E57373","#F0B65A","#E8D96A","#7CC08A","#6AA9D8","#8A7CD0","#C77BB8"].forEach((cl,i,a)=>gr.addColorStop(i/(a.length-1),cl));x.strokeStyle=gr}else x.strokeStyle=FR[d.frame]||"#C9A45A";x.strokeRect(40,40,W-80,H-80)}
 x.fillStyle="#D8B465";x.font=`700 24px ${SANS}`;x.textAlign="left";x.fillText("MYITEMBOOK · "+MIB_CONFIG.cohort,90,118);
 x.textAlign="right";x.fillStyle="rgba(244,241,233,.75)";x.fillText(d.title?d.title+" "+d.name:"@"+d.name,W-90,118);
 x.textAlign="center";x.fillStyle="#FFF4D6";x.font=`700 46px ${SERIF}`;x.fillText(d.gemName||"",W/2,190);
 x.fillStyle="rgba(244,241,233,.6)";x.font=`700 20px ${SANS}`;x.fillText("나 만 의   육 각 형",W/2,236);
 // hexagon
 const ax=(d.axes||[]).slice(0,6);while(ax.length<6)ax.push({name:"발견 중",level:null});
 const cx=W/2,cy=525,R=178;const pt=(i,v)=>{const a=-Math.PI/2+i*Math.PI/3;return [cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v]};
 x.lineWidth=1.5;[.33,.66,1].forEach(v=>{x.beginPath();ax.forEach((_,i)=>{const [px,py]=pt(i,v);i?x.lineTo(px,py):x.moveTo(px,py)});x.closePath();x.strokeStyle="rgba(244,241,233,.18)";x.stroke()});
 ax.forEach((_,i)=>{const [px,py]=pt(i,1);x.beginPath();x.moveTo(cx,cy);x.lineTo(px,py);x.strokeStyle="rgba(244,241,233,.12)";x.stroke()});
 const hasLv=ax.some(a=>typeof a.level==="number");
 if(hasLv){x.beginPath();ax.forEach((a,i)=>{const v=typeof a.level==="number"?clamp(a.level,.14,1):.14;const [px,py]=pt(i,v);i?x.lineTo(px,py):x.moveTo(px,py)});x.closePath();x.fillStyle=st.base+"8C";x.fill();x.lineWidth=4;x.strokeStyle=st.light==="#FFFFFF"?"#E6F1F5":st.light;x.lineJoin="round";x.stroke();
  ax.forEach((a,i)=>{const v=typeof a.level==="number"?clamp(a.level,.14,1):.14;const [px,py]=pt(i,v);x.beginPath();x.arc(px,py,8,0,Math.PI*2);x.fillStyle="#FFF4D6";x.fill()})}
 else{x.fillStyle="rgba(244,241,233,.5)";x.font=`500 22px ${SANS}`;x.fillText("눈금은 비공개 · 결의 이름만 보여요",cx,cy+8)}
 x.font=`700 28px ${SANS}`;ax.forEach((a,i)=>{const [px,py]=pt(i,1.24);const side=Math.abs(px-cx)>8;x.textAlign=side?(px>cx?"left":"right"):"center";x.fillStyle=a.level==null&&hasLv?"rgba(244,241,233,.55)":"#F4F1E9";const nm=String(a.name||"");const lines=side&&nm.replace(/\s/g,"").length>5&&nm.includes(" ")?nm.split(" "):[nm];lines.forEach((l,k)=>x.fillText(l,px+(side?(px>cx?-6:6):0),py+10+(k-(lines.length-1)/2)*32))});
 // shelf
 x.textAlign="left";x.fillStyle="#D8B465";x.font=`700 22px ${SANS}`;x.fillText(d.shelfTitle||"대표 아이템",90,835);
 const items=(d.items||[]).slice(0,4);
 if(items.length){const gap=20,tw=(W-180-gap*3)/4,th=290;const imgs=await Promise.all(items.map(i=>loadImg(i.thumbUrl||i.photoUrl)));
  items.forEach((it,k)=>{const X=90+k*(tw+gap),Y=860;x.save();rr(x,X,Y,tw,th,22);x.fillStyle="rgba(244,241,233,.06)";x.fill();x.strokeStyle="rgba(216,180,101,.35)";x.lineWidth=2;x.stroke();x.restore();
   const im=imgs[k];const ph=tw-24;x.save();rr(x,X+12,Y+12,ph,ph*.75,14);x.clip();if(im){const s=Math.max(ph/im.width,ph*.75/im.height);x.drawImage(im,X+12+(ph-im.width*s)/2,Y+12+(ph*.75-im.height*s)/2,im.width*s,im.height*s)}else{x.fillStyle="rgba(244,241,233,.08)";x.fillRect(X+12,Y+12,ph,ph*.75);x.fillStyle="rgba(244,241,233,.5)";x.font=`700 44px ${SANS}`;x.textAlign="center";x.fillText(({"장비":"⚙","자격":"✦","반려":"♥"})[it.category]||"◆",X+tw/2,Y+12+ph*.375+16)}x.restore();
   x.textAlign="left";x.fillStyle="#FFF4D6";x.font=`700 24px ${SANS}`;const nmL=wrapLines(x,it.name||"",tw-24,1)[0]||"";x.fillText(nmL,X+12,Y+ph*.75+50);
   x.fillStyle="rgba(244,241,233,.65)";x.font=`500 19px ${SANS}`;x.fillText(wrapLines(x,`${it.category||""}${it.since?" · "+sinceText(it.since).replace("함께한 지 ",""):""}`,tw-24,1)[0]||"",X+12,Y+ph*.75+80);
   if(it.story){x.fillStyle="rgba(244,241,233,.8)";x.font=`500 18px ${SANS}`;wrapLines(x,it.story,tw-24,1).forEach(l=>x.fillText(l,X+12,Y+ph*.75+108))}})}
 else{x.fillStyle="rgba(244,241,233,.5)";x.font=`500 24px ${SANS}`;x.fillText("아직 보여 줄 아이템이 없어요",90,890)}
 // badges
 const bs=(d.badges||[]).map(id=>BADGES.find(b=>b.id===id)).filter(Boolean).slice(0,6);
 if(bs.length){x.textAlign="center";const bw=64,gap=18,tot=bs.length*bw+(bs.length-1)*gap;let bx=(W-tot)/2;
  for(const b of bs){x.beginPath();x.arc(bx+bw/2,1210,bw/2,0,Math.PI*2);x.fillStyle=GROUPS[b.g];x.fill();x.lineWidth=3;x.strokeStyle=(RARITY[b.rar]||{}).color||"#D8B465";x.stroke();
   const g=await svgImage(`<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#F7F3EA" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${glyph(b.glyph)}</svg>`,30,30);x.drawImage(g,bx+bw/2-16,1194,32,32);bx+=bw+gap}}
 x.textAlign="center";x.fillStyle="rgba(244,241,233,.5)";x.font=`500 20px ${SANS}`;x.fillText(`연마 ${d.stage||1}단계 · ${STAGES[d.stage||1]||""}`,W/2,H-74);
 return c;
}

/* what the back shows — mine (full levels, my shelf) or someone else's (what they made public) */
function myCardFaces(st,items,stats,profile){
 const a=st.analysis;const g=livingGem(st);const eq=equipped(st,stats);
 const feat=items.filter(i=>(st.featured||[]).includes(i.id));const rest=items.filter(i=>!(st.featured||[]).includes(i.id)&&!i.private);
 const back={name:profile.nickname,gem:g,gemName:gemName(g),title:eq.title,frame:eq.frame,stage:stageOf(st,stats),axes:visibleAxes(a).map(x=>({name:x.name,level:x.level})),items:[...feat,...rest].slice(0,4),shelfTitle:feat.length?"대표 아이템":"나의 선반",badges:showcaseBadges(st,stats,6)};
 return {front:()=>renderShareImage("card",{st,stats,profile}),back:()=>renderCardBack(back),name:profile.nickname,mine:true};
}
function otherCardFaces(card,name,ownerId){
 const d=card.data||{};
 return {name,mine:false,front:()=>renderPublicCardImage(d,name),back:async()=>{let items=[];if(d.shelf>0){try{items=await api.sharedShelf(ownerId)}catch(e){}}if(!items.length)items=(d.items||[]);
  return renderCardBack({name,gem:d.gem,gemName:d.gemName,title:d.title,frame:d.frame,stage:d.stage,axes:d.showHex?d.axes:(d.axes||[]).map(x=>({name:x.name,level:null})),items,shelfTitle:d.shelf>0?"선반":"대표 아이템",badges:d.badges||[]})}};
}

async function saveCanvas(canvas,name,toast){
 const blob=await new Promise(r=>canvas.toBlob(r,"image/png"));const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
 if(window.showSaveFilePicker&&!mobile){try{const h=await window.showSaveFilePicker({suggestedName:name,types:[{description:"PNG 이미지",accept:{"image/png":[".png"]}}]});const w=await h.createWritable();await w.write(blob);await w.close();toast("이미지를 저장했어요.");return}catch(e){if(e&&e.name==="AbortError")return}}
 const file=new File([blob],name,{type:"image/png"});
 if(/iPhone|iPad|iPod/i.test(navigator.userAgent)&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file]});return}catch(e){if(e&&e.name==="AbortError")return}}
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);toast(mobile?"이미지를 저장했어요.":"다운로드 폴더에 저장했어요.")
}

function CardShowcase({faces,onClose,toast,onProfile}){
 const [img,setImg]=useState({front:null,back:null});const cvs=useRef({});const [flip,setFlip]=useState(false);const card=useRef(null);
 const reduce=useMemo(()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}},[]);
 useEffect(()=>{let alive=true;track("card_view",{mine:faces.mine});
  faces.front().then(c=>{if(!alive)return;cvs.current.front=c;setImg(s=>({...s,front:c.toDataURL("image/png")}))}).catch(()=>toast("카드를 그리지 못했어요."));
  faces.back().then(c=>{if(!alive)return;cvs.current.back=c;setImg(s=>({...s,back:c.toDataURL("image/png")}))}).catch(()=>{});
  const k=e=>{if(e.key==="Escape")onClose();if(e.key===" "||e.key==="Enter"&&document.activeElement===card.current){e.preventDefault();setFlip(f=>!f)}};window.addEventListener("keydown",k);
  const pv=document.body.style.overflow;document.body.style.overflow="hidden";
  return()=>{alive=false;window.removeEventListener("keydown",k);document.body.style.overflow=pv}},[]);
 function tilt(e){if(reduce||!card.current)return;const r=card.current.getBoundingClientRect();const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;card.current.style.setProperty("--rx",(-py*10).toFixed(2)+"deg");card.current.style.setProperty("--ry",(px*12).toFixed(2)+"deg");card.current.style.setProperty("--sx",((px+.5)*100).toFixed(1)+"%");card.current.style.setProperty("--sy",((py+.5)*100).toFixed(1)+"%")}
 function untilt(){if(!card.current)return;card.current.style.setProperty("--rx","0deg");card.current.style.setProperty("--ry","0deg")}
 const side=flip?"back":"front";
 return html`<div className="cs" role="dialog" aria-modal="true" aria-label=${faces.name+"의 카드"} onClick=${onClose}>
  <div className="cs-top" onClick=${e=>e.stopPropagation()}><span className="cs-eyebrow">${faces.mine?"MY CARD":"CARD"} · ${flip?"BACK":"FRONT"}</span><button className="cs-x" onClick=${onClose} aria-label="닫기">✕</button></div>
  <div className="cs-stage" onClick=${e=>e.stopPropagation()} onPointerMove=${tilt} onPointerLeave=${untilt}>
   <div className="cs-deck" aria-hidden="true"><i></i><i></i><i></i></div>
   <button ref=${card} className=${"cs-card"+(flip?" flipped":"")} onClick=${()=>{setFlip(f=>!f);track("card_flip")}} aria-label=${(flip?"뒷면":"앞면")+" · 눌러서 뒤집기"}>
    <span className="cs-face cs-front">${img.front?html`<img src=${img.front} alt=${faces.name+"의 카드 앞면"}/>`:html`<span className="cs-wait">카드를 펼치는 중…</span>`}<span className="cs-shine"></span></span>
    <span className="cs-face cs-back">${img.back?html`<img src=${img.back} alt=${faces.name+"의 카드 뒷면: 육각형과 선반"}/>`:html`<span className="cs-wait">뒷면을 그리는 중…</span>`}<span className="cs-shine"></span></span>
   </button>
  </div>
  <div className="cs-bar" onClick=${e=>e.stopPropagation()}>
   <div className="cs-seg" role="group" aria-label="면 고르기"><button aria-pressed=${!flip} onClick=${()=>setFlip(false)}>앞면</button><button aria-pressed=${flip} onClick=${()=>setFlip(true)}>뒷면</button></div>
   <button className="btn" disabled=${!img[side]} onClick=${()=>{saveCanvas(cvs.current[side],`mib-${faces.mine?"my":"card"}-${side}-${dayKey()}.png`,toast);track("card_save",{side,mine:faces.mine})}}>이 면 저장</button>
   ${onProfile&&html`<button className="btn ghost" onClick=${onProfile}>아뜰리에로 ›</button>`}
  </div>
  <p className="cs-hint">카드를 누르면 뒤집혀요${reduce?"":" · 마우스를 올리면 빛이 움직여요"}</p>
 </div>`;
}
