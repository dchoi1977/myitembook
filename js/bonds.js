"use strict";
/* MIB CBT · 관계 — 친구 둘이 합의해서 정하는 관계 이름(절친·연인·가족…). 한쪽이 제안하고 다른 쪽이 수락하면 확정되고, 친구를 끊으면 사라진다 */

const BONDS=[
 {n:"절친",g:"별",c:"#F2B84B",re:/절친|베프|단짝|찐친|bff/i},
 {n:"연인",g:"하트",c:"#EE7C92",re:/연인|애인|커플|남친|여친|자기/},
 {n:"부부",g:"고리",c:"#E88FA6",re:/부부|남편|아내|배우자|신랑|신부/},
 {n:"가족",g:"집",c:"#F29E6B",re:/가족|엄마|아빠|부모|형제|자매|남매|딸|아들|언니|오빠|누나|동생|형$/},
 {n:"소울메이트",g:"무한",c:"#A98BE0",re:/소울|영혼|운명/},
 {n:"사제",g:"책",c:"#6FA8DC",re:/사제|스승|제자|선생|교수|은사|멘토|멘티/},
 {n:"선후배",g:"새싹",c:"#7CC08A",re:/선후배|선배|후배/},
 {n:"직장동료",g:"커피",c:"#B48A6A",re:/직장|동료|회사|팀원|동기|상사/},
 {n:"동창",g:"펜",c:"#5FB3B3",re:/동창|동문|학우|같은 반|급우/},
 {n:"이웃",g:"나무",c:"#8DBF67",re:/이웃|동네|옆집/},
 {n:"운동메이트",g:"자전거",c:"#58A6E0",re:/운동|러닝|헬스|등산|골프|테니스|산악/},
 {n:"여행메이트",g:"비행기",c:"#5CC0D6",re:/여행|캠핑|트립/},
 {n:"덕질메이트",g:"음표",c:"#E07BB5",re:/덕질|덕메|팬|음악|밴드|공연/},
 {n:"교회친구",g:"해",c:"#E6B655",re:/교회|성당|신앙|목장|셀|구역/},
 {n:"길동무",g:"발자국",c:"#9AA7B8",re:/길동무|동행|산책/}];
const BOND_FALLBACK=[["꽃","#F08FB0"],["달","#8E9BE8"],["구름","#7FBCE6"],["나비","#C08BE0"],["불꽃","#F28C5B"],["눈송이","#79C7E3"],["열쇠","#D9A94B"],["잎","#74C088"]];
function bondStyle(name){const b=BONDS.find(x=>x.n===name)||BONDS.find(x=>x.re.test(name||""));if(b)return {g:b.g,c:b.c};let h=0;for(const ch of String(name||""))h=(h*31+ch.charCodeAt(0))>>>0;const f=BOND_FALLBACK[h%BOND_FALLBACK.length];return {g:f[0],c:f[1]}}
/* 이모티콘 같은 스티커: 말랑한 원 + 흰 테 + 그림 + 작은 볼터치와 미소 */
function bondIconSVG(name){const {g,c}=bondStyle(name);const hi=mix(c,"#FFFFFF",.45),lo=mix(c,"#000000",.18);const id="bd"+Math.abs([...String(name)].reduce((a,ch)=>a*33+ch.charCodeAt(0)|0,7));
 return `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="${id}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${hi}"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="${lo}"/></radialGradient></defs><circle cx="20" cy="20" r="18.5" fill="#FFFFFF"/><circle cx="20" cy="20" r="16.5" fill="url(#${id})"/><ellipse cx="14" cy="11" rx="6" ry="3.2" fill="#FFFFFF" opacity=".35" transform="rotate(-28 14 11)"/><g transform="translate(10.2 6.6) scale(.65)" fill="none" stroke="#FFFFFF" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${glyph(g)}</g><circle cx="11.6" cy="29.2" r="2" fill="#FFFFFF" opacity=".45"/><circle cx="28.4" cy="29.2" r="2" fill="#FFFFFF" opacity=".45"/><circle cx="16.2" cy="28" r="1.1" fill="#FFFFFF"/><circle cx="23.8" cy="28" r="1.1" fill="#FFFFFF"/><path d="M17.6 30.6q2.4 2 4.8 0" fill="none" stroke="#FFFFFF" stroke-width="1.2" stroke-linecap="round"/></svg>`}
function BondIcon({name,size=20}){const svg=useMemo(()=>bondIconSVG(name),[name]);return html`<span className="bond-ic" aria-hidden="true" style=${{width:size,height:size}} dangerouslySetInnerHTML=${{__html:svg}}></span>`}
function BondChip({name,size=18,pending}){if(!name)return null;return html`<span className=${"bond-chip"+(pending?" pending":"")}><${BondIcon} name=${name} size=${size}/>${name}</span>`}

/* my side of a friendship row */
function bondOf(uid,other,friendships){const f=(friendships||[]).find(x=>x.status==="accepted"&&((x.requester===uid&&x.addressee===other)||(x.requester===other&&x.addressee===uid)));if(!f)return null;
 return {name:f.bond||"",prop:f.bond_prop,byMe:f.bond_by===uid,incoming:f.bond_prop!=null&&f.bond_by===other,outgoing:f.bond_prop!=null&&f.bond_by===uid}}

function BondPanel({uid,other,name,soc,reloadSoc,toast,demo}){
 const b=bondOf(uid,other,soc.friendships);const [edit,setEdit]=useState(false);const [val,setVal]=useState("");const [busy,setBusy]=useState(false);
 if(!b)return null;
 async function run(fn,msg){if(demo){toast("예시 모드에서는 저장하지 않아요.");return}setBusy(true);try{const r=await fn();if(r==="same")toast("지금 관계와 같아요.");else toast(msg);await reloadSoc();setEdit(false)}catch(e){toast("처리하지 못했어요. 잠시 후 다시 시도해 주세요.")}finally{setBusy(false)}}
 const propose=n=>run(()=>{track("bond_propose",{preset:BONDS.some(x=>x.n===n)});return api.bondPropose(other,n)},n?`${name}님에게 '${n}' 관계를 제안했어요.`:`${name}님에게 관계 이름을 지우자고 제안했어요.`);
 return html`<div className="panel stack bond-panel">
  <div className="row between"><span className="eyebrow">우리 사이</span>${b.name&&!b.incoming&&!b.outgoing&&!edit&&html`<button className="linkbtn small" onClick=${()=>setEdit(true)}>바꾸기</button>`}</div>
  ${b.name?html`<div className="bond-now"><${BondIcon} name=${b.name} size=${44}/><span><b className="serif">${b.name}</b><br/><span className="small muted">${name}님과 함께 정한 관계예요</span></span></div>`:!b.incoming&&!b.outgoing&&!edit&&html`<span className="small muted">${name}님과 어떤 사이인가요? 관계 이름을 제안하고, 상대가 수락하면 둘에게만 보이는 이름표가 생겨요.</span>`}
  ${b.incoming&&html`<div className="bond-ask"><${BondIcon} name=${b.prop||"길동무"} size=${36}/><span className="grow"><b>${name}</b>님이 ${b.prop?html`우리 사이를 <b>'${b.prop}'</b>${josa(b.prop,"으로").slice(b.prop.length)} 하자고 해요`:"관계 이름을 지우자고 해요"}</span></div><div className="row"><button className="btn ghost sm grow" disabled=${busy} onClick=${()=>run(()=>api.bondRespond(other,false),"이번에는 사양했어요.")}>사양하기</button><button className="btn sm grow" disabled=${busy} onClick=${()=>run(()=>{track("bond_accept");return api.bondRespond(other,true)},b.prop?`이제 ${name}님과 '${b.prop}'이에요.`:"관계 이름을 지웠어요.")}>수락하기</button></div>`}
  ${b.outgoing&&html`<div className="bond-ask"><${BondIcon} name=${b.prop||"길동무"} size=${36}/><span className="grow">${b.prop?html`<b>'${b.prop}'</b> 제안을 보냈어요`:"관계 이름을 지우자고 제안했어요"}<br/><span className="small muted">${name}님이 수락하면 확정돼요</span></span><button className="linkbtn small" disabled=${busy} onClick=${()=>run(()=>api.bondCancel(other),"제안을 거뒀어요.")}>거두기</button></div>`}
  ${!b.incoming&&!b.outgoing&&(edit||!b.name)&&html`<div className="stack" style=${{gap:"8px"}}>
   <div className="bond-pick">${BONDS.map(x=>html`<button key=${x.n} disabled=${busy||x.n===b.name} onClick=${()=>propose(x.n)}><${BondIcon} name=${x.n} size=${26}/><span>${x.n}</span></button>`)}</div>
   <form className="row" onSubmit=${e=>{e.preventDefault();const v=val.trim().slice(0,10);if(v)propose(v)}}><input type="text" maxLength="10" value=${val} onChange=${e=>setVal(e.target.value)} placeholder="직접 짓기 (10자까지) 예) 새벽 러닝 짝꿍" aria-label="관계 이름 직접 짓기" style=${{flex:1}}/>${val.trim()&&html`<${BondIcon} name=${val.trim()} size=${30}/>`}<button className="btn sm" disabled=${busy||!val.trim()}>제안</button></form>
   ${b.name&&html`<div className="row between"><button className="linkbtn small" onClick=${()=>setEdit(false)}>그대로 두기</button><button className="linkbtn small" disabled=${busy} onClick=${()=>propose("")}>관계 이름 지우자고 제안</button></div>`}
  </div>`}
  <span className="small faint">관계 이름은 두 사람에게만 보이고, 바꿀 때도 서로 합의해야 해요. 친구를 끊으면 함께 사라져요.</span>
 </div>`}
