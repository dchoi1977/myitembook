"use strict";
/* MIB CBT · profile avatars — default "원석" + 16 original characters (each wears a tiny gem) */
const AVATARS=[
 {id:"01",name:"고양이",bg:"#F6E3CF",c:"#E8A15A",c2:"#F7D9B5",ear:"cat",face:"cat",stripe:true,gem:"#B07AD6"},
 {id:"02",name:"강아지",bg:"#E9E1D4",c:"#B98552",c2:"#F1E2CC",ear:"flop",face:"muzzle",gem:"#5B976F"},
 {id:"03",name:"곰",bg:"#E6DED3",c:"#8C6A4F",c2:"#D9C2A5",ear:"round",face:"muzzle",gem:"#E39A36"},
 {id:"04",name:"토끼",bg:"#D9E6EE",c:"#F1ECE6",c2:"#F6C9D3",ear:"long",face:"bunny",gem:"#E8ADB7"},
 {id:"05",name:"여우",bg:"#F7E4D2",c:"#E07B39",c2:"#FFF6EC",ear:"point",face:"fox",gem:"#2F4D9B"},
 {id:"06",name:"펭귄",bg:"#DCE7F2",c:"#2E3A4F",c2:"#FBFAF5",ear:"none",face:"penguin",gem:"#E39A36"},
 {id:"07",name:"부엉이",bg:"#E8E0D0",c:"#9C7B5B",c2:"#EFE2CB",ear:"tuft",face:"owl",gem:"#5B976F"},
 {id:"08",name:"고슴도치",bg:"#EEE6D8",c:"#7A5C48",c2:"#ECD9C0",ear:"spike",face:"muzzle",gem:"#8967B5"},
 {id:"09",name:"수달",bg:"#DDE9E6",c:"#8A6E58",c2:"#E7D6C2",ear:"small",face:"otter",gem:"#9EC9E8"},
 {id:"10",name:"판다",bg:"#E3EDE0",c:"#FBFAF5",c2:"#2B2F33",ear:"round-dark",face:"panda",gem:"#5B976F"},
 {id:"11",name:"다람쥐",bg:"#F3E5D3",c:"#C7834A",c2:"#F5E3CC",ear:"tuft-small",face:"muzzle",tail:true,gem:"#B07AD6"},
 {id:"12",name:"거북",bg:"#E2EEDB",c:"#7FAF7A",c2:"#CFE5C6",ear:"none",face:"turtle",shell:true,gem:"#E39A36"},
 {id:"13",name:"고래",bg:"#DCEAF5",c:"#6A9FD0",c2:"#E8F2FA",ear:"none",face:"whale",spout:true,gem:"#F1B6C6"},
 {id:"14",name:"사슴",bg:"#F2E8DA",c:"#C19A6B",c2:"#F4E6D0",ear:"deer",face:"muzzle",spots:true,gem:"#2F4D9B"},
 {id:"15",name:"개구리",bg:"#E6F1DA",c:"#8CC47A",c2:"#E9F5DD",ear:"frog",face:"frog",gem:"#E8ADB7"},
 {id:"16",name:"너구리",bg:"#E6E8EA",c:"#8E9399",c2:"#E9EBEE",ear:"round-dark",face:"raccoon",gem:"#E39A36"}
];
const AV_INK="#2B2F33";
function avatarCharSVG(id){
 const a=AVATARS.find(x=>x.id===id)||AVATARS[0];const c=a.c,c2=a.c2;let back="",front="";
 // ears & things behind the head
 switch(a.ear){
  case "cat":back+=`<path d="M27 40 L30 16 L46 31 Z" fill="${c}"/><path d="M73 40 L70 16 L54 31 Z" fill="${c}"/><path d="M31 34 L32 22 L41 30 Z" fill="#F4B9B2"/><path d="M69 34 L68 22 L59 30 Z" fill="#F4B9B2"/>`;break;
  case "flop":front+=`<ellipse cx="25" cy="50" rx="8" ry="17" transform="rotate(14 25 50)" fill="#8E6238"/><ellipse cx="75" cy="50" rx="8" ry="17" transform="rotate(-14 75 50)" fill="#8E6238"/>`;break;
  case "round":back+=`<circle cx="29" cy="31" r="9" fill="${c}"/><circle cx="71" cy="31" r="9" fill="${c}"/><circle cx="29" cy="31" r="4.5" fill="${c2}"/><circle cx="71" cy="31" r="4.5" fill="${c2}"/>`;break;
  case "round-dark":back+=`<circle cx="29" cy="31" r="9" fill="${AV_INK}"/><circle cx="71" cy="31" r="9" fill="${AV_INK}"/>`;break;
  case "long":back+=`<ellipse cx="39" cy="17" rx="7" ry="19" fill="${c}"/><ellipse cx="61" cy="17" rx="7" ry="19" fill="${c}"/><ellipse cx="39" cy="18" rx="3.5" ry="14" fill="${c2}"/><ellipse cx="61" cy="18" rx="3.5" ry="14" fill="${c2}"/>`;break;
  case "point":back+=`<path d="M25 42 L27 13 L46 30 Z" fill="${c}"/><path d="M75 42 L73 13 L54 30 Z" fill="${c}"/><path d="M29 36 L29 20 L40 30 Z" fill="${AV_INK}" opacity=".75"/><path d="M71 36 L71 20 L60 30 Z" fill="${AV_INK}" opacity=".75"/>`;break;
  case "tuft":back+=`<path d="M28 34 L24 16 L41 28 Z" fill="${c}"/><path d="M72 34 L76 16 L59 28 Z" fill="${c}"/>`;break;
  case "tuft-small":back+=`<path d="M30 35 L29 18 L42 29 Z" fill="${c}"/><path d="M70 35 L71 18 L58 29 Z" fill="${c}"/><path d="M29 18 l-2 -5 M71 18 l2 -5" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`;break;
  case "spike":{let d="";const N=11;for(let i=0;i<N;i++){const t0=Math.PI*(1.02+i*0.96/N),t1=Math.PI*(1.02+(i+.5)*0.96/N),t2=Math.PI*(1.02+(i+1)*0.96/N);const p=(t,r)=>[(50+Math.cos(t)*r*1.08).toFixed(1),(54+Math.sin(t)*r).toFixed(1)];const A=p(t0,22),B=p(t1,37+(i%2)*3),C=p(t2,22);d+=`${i?"L":"M"}${A[0]} ${A[1]} L${B[0]} ${B[1]} L${C[0]} ${C[1]} `}back+=`<path d="${d}Z" fill="#5E4535"/>`;break}
  case "small":back+=`<circle cx="30" cy="35" r="5.5" fill="${c}"/><circle cx="70" cy="35" r="5.5" fill="${c}"/>`;break;
  case "deer":back+=`<path d="M33 30 C30 20 26 16 22 13 M30 22 L22 22 M67 30 C70 20 74 16 78 13 M70 22 L78 22" stroke="#8C6A4F" stroke-width="3.2" stroke-linecap="round" fill="none"/><ellipse cx="25" cy="38" rx="9" ry="5" transform="rotate(-25 25 38)" fill="${c}"/><ellipse cx="75" cy="38" rx="9" ry="5" transform="rotate(25 75 38)" fill="${c}"/>`;break;
  case "frog":back+=`<circle cx="36" cy="32" r="10" fill="${c}"/><circle cx="64" cy="32" r="10" fill="${c}"/>`;break;
 }
 if(a.tail)back=`<path d="M78 92 C96 80 92 52 76 50 C68 50 66 60 74 62" fill="none" stroke="#B06E38" stroke-width="10" stroke-linecap="round"/>`+back;
 if(a.shell)back=`<ellipse cx="50" cy="96" rx="38" ry="22" fill="#6F8F5A"/><path d="M28 86 L40 78 L60 78 L72 86" fill="none" stroke="#56724A" stroke-width="2"/>`+back;
 if(a.spout)back+=`<path d="M50 24 C47 16 42 14 38 15 M50 24 C53 16 58 14 62 15 M50 24 L50 12" stroke="#8FBDE6" stroke-width="3" stroke-linecap="round" fill="none"/>`;
 // body + head
 let body=`<ellipse cx="50" cy="102" rx="34" ry="24" fill="${a.face==="panda"?AV_INK:a.face==="penguin"?c:c}"/>`;
 if(a.face==="penguin")body+=`<ellipse cx="50" cy="104" rx="20" ry="18" fill="${c2}"/>`;
 let head=`<ellipse cx="50" cy="54" rx="${a.face==="whale"?30:27}" ry="${a.face==="whale"?24:25}" fill="${c}"/>`;
 if(a.stripe)head+=`<path d="M44 31 L46 38 M50 30 L50 38 M56 31 L54 38" stroke="#C9783A" stroke-width="2.6" stroke-linecap="round"/>`;
 if(a.spots)head+=`<circle cx="37" cy="42" r="1.8" fill="#FFF6EC"/><circle cx="62" cy="40" r="1.6" fill="#FFF6EC"/><circle cx="66" cy="46" r="1.4" fill="#FFF6EC"/>`;
 // faces
 const eye=(x,y,r=3.1)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${AV_INK}"/><circle cx="${x+1}" cy="${y-1.1}" r="${(r*.36).toFixed(2)}" fill="#fff"/>`;
 const blush=`<ellipse cx="34" cy="62" rx="4.4" ry="2.6" fill="#F08F86" opacity=".42"/><ellipse cx="66" cy="62" rx="4.4" ry="2.6" fill="#F08F86" opacity=".42"/>`;
 let face="";
 switch(a.face){
  case "cat":face=eye(40,53)+eye(60,53)+`<path d="M48 59 L52 59 L50 61.5 Z" fill="#C9665E"/><path d="M45 63 Q47.5 66 50 63 Q52.5 66 55 63" fill="none" stroke="${AV_INK}" stroke-width="1.6" stroke-linecap="round"/><path d="M30 58 H22 M30 61 L23 63 M70 58 H78 M70 61 L77 63" stroke="${AV_INK}" stroke-width="1" opacity=".45"/>`+blush;break;
  case "muzzle":face=`<ellipse cx="50" cy="63" rx="11" ry="8.5" fill="${c2}"/>`+eye(40,51)+eye(60,51)+`<ellipse cx="50" cy="59.5" rx="3.6" ry="2.6" fill="${AV_INK}"/><path d="M50 62 V65 M46 66 Q50 69 54 66" fill="none" stroke="${AV_INK}" stroke-width="1.6" stroke-linecap="round"/>`+blush;break;
  case "bunny":face=eye(41,53)+eye(59,53)+`<path d="M48.3 59 L51.7 59 L50 61 Z" fill="#E58C9B"/><path d="M50 61 V63.5 M46.5 64 Q50 67 53.5 64" fill="none" stroke="${AV_INK}" stroke-width="1.5" stroke-linecap="round"/>`+blush;break;
  case "fox":face=`<path d="M23 56 Q36 54 50 72 Q64 54 77 56 Q74 76 50 79 Q26 76 23 56 Z" fill="${c2}"/>`+eye(40,52)+eye(60,52)+`<ellipse cx="50" cy="66" rx="3.4" ry="2.4" fill="${AV_INK}"/><path d="M47 70 Q50 72.5 53 70" fill="none" stroke="${AV_INK}" stroke-width="1.5" stroke-linecap="round"/>`;break;
  case "penguin":face=`<path d="M30 58 Q30 38 50 46 Q70 38 70 58 Q70 76 50 77 Q30 76 30 58 Z" fill="${c2}"/>`+eye(41,56)+eye(59,56)+`<path d="M45 62 L55 62 L50 68 Z" fill="#F0A33A"/>`+blush;break;
  case "owl":face=`<circle cx="39" cy="53" r="9" fill="${c2}"/><circle cx="61" cy="53" r="9" fill="${c2}"/>`+eye(39,53,4)+eye(61,53,4)+`<path d="M46.5 60 L53.5 60 L50 66 Z" fill="#E39A36"/><path d="M36 70 Q43 67 50 70 Q57 67 64 70" fill="none" stroke="${c2}" stroke-width="2" opacity=".8"/>`;break;
  case "otter":face=`<ellipse cx="50" cy="62" rx="15" ry="9.5" fill="${c2}"/>`+eye(40,51)+eye(60,51)+`<ellipse cx="50" cy="58.5" rx="4" ry="2.8" fill="${AV_INK}"/><path d="M46 64 Q50 67 54 64" fill="none" stroke="${AV_INK}" stroke-width="1.5" stroke-linecap="round"/><path d="M38 61 H29 M38 64 L30 66 M62 61 H71 M62 64 L70 66" stroke="${AV_INK}" stroke-width="1" opacity=".45"/>`+blush;break;
  case "panda":face=`<ellipse cx="39" cy="53" rx="6.5" ry="8" transform="rotate(-20 39 53)" fill="${AV_INK}"/><ellipse cx="61" cy="53" rx="6.5" ry="8" transform="rotate(20 61 53)" fill="${AV_INK}"/><circle cx="40" cy="52.5" r="2.4" fill="#fff"/><circle cx="60" cy="52.5" r="2.4" fill="#fff"/><ellipse cx="50" cy="61" rx="3.6" ry="2.6" fill="${AV_INK}"/><path d="M46 65 Q50 68 54 65" fill="none" stroke="${AV_INK}" stroke-width="1.5" stroke-linecap="round"/>`+blush;break;
  case "turtle":face=eye(40,52)+eye(60,52)+`<path d="M43 62 Q50 67 57 62" fill="none" stroke="${AV_INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M38 36 Q50 30 62 36" fill="none" stroke="${c2}" stroke-width="3" stroke-linecap="round"/>`+blush;break;
  case "whale":face=eye(38,55)+eye(62,55)+`<path d="M40 64 Q50 70 60 64" fill="none" stroke="${AV_INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M26 68 Q50 82 74 68 Q70 76 50 78 Q30 76 26 68 Z" fill="${c2}"/>`+blush;break;
  case "frog":face=`<circle cx="36" cy="32" r="6.5" fill="#fff"/><circle cx="64" cy="32" r="6.5" fill="#fff"/>`+eye(36,32.5,3.4)+eye(64,32.5,3.4)+`<path d="M34 60 Q50 72 66 60" fill="none" stroke="${AV_INK}" stroke-width="2" stroke-linecap="round"/><circle cx="46" cy="53" r="1" fill="${AV_INK}"/><circle cx="54" cy="53" r="1" fill="${AV_INK}"/>`+blush;break;
  case "raccoon":face=`<path d="M25 51 Q38 42 50 52 Q62 42 75 51 Q70 60 60 58 Q50 54 40 58 Q30 60 25 51 Z" fill="#4A4F55"/><ellipse cx="50" cy="64" rx="10" ry="7" fill="${c2}"/>`+`<circle cx="39" cy="52" r="3" fill="#fff"/><circle cx="61" cy="52" r="3" fill="#fff"/><circle cx="39" cy="52" r="1.9" fill="${AV_INK}"/><circle cx="61" cy="52" r="1.9" fill="${AV_INK}"/><ellipse cx="50" cy="61" rx="3.3" ry="2.4" fill="${AV_INK}"/><path d="M46.5 66 Q50 68.5 53.5 66" fill="none" stroke="${AV_INK}" stroke-width="1.5" stroke-linecap="round"/>`;break;
 }
 // tiny gem pendant
 const gem=`<path d="M50 80 C46 79 44 78 42 76 M50 80 C54 79 56 78 58 76" stroke="#D9C3A0" stroke-width="1.2" fill="none"/><path d="M50 79.5 L55.5 84.5 L50 92 L44.5 84.5 Z" fill="${a.gem}"/><path d="M50 79.5 L52.6 84.5 L50 92 Z" fill="#fff" opacity=".28"/><path d="M44.5 84.5 H55.5" stroke="#fff" stroke-width=".8" opacity=".5"/>`;
 return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><clipPath id="avc${a.id}"><circle cx="50" cy="50" r="50"/></clipPath></defs><g clip-path="url(#avc${a.id})"><rect width="100" height="100" fill="${a.bg}"/>${back}${body}${front}${head}${face}${gem}</g></svg>`;
}
/* default for people who chose nothing: an uncut stone — "누구나 원석으로 태어난다" */
function avatarDefaultSVG(seed){
 const R=rng("av|"+(seed||""));const P=[];const n=7;for(let i=0;i<n;i++){const ang=-Math.PI/2+i*2*Math.PI/n+(R()-.5)*.5;const r=19+R()*6;P.push([50+Math.cos(ang)*r,56+Math.sin(ang)*r*.9])}
 const pts=P.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ");
 return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#E4E9DF"/><ellipse cx="50" cy="80" rx="22" ry="4" fill="#A7B5A1" opacity=".45"/><polygon points="${pts}" fill="#B9C4B4"/><polygon points="${P.slice(0,4).map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")} 50,56" fill="#CFD8CA"/><polygon points="${pts}" fill="none" stroke="#8FA08A" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}
/* <Avatar> — p: profile row (avatar, avatar_v), url: signed photo url when visible to this viewer */
function Avatar({p,url,size=40,ring}){
 const av=p&&p.avatar;if(url===undefined&&av==="photo")url=AVCACHE[avKey(p)];let inner;
 if(av==="photo"&&url)inner=html`<img src=${url} alt="" style=${{width:"100%",height:"100%",objectFit:"cover",display:"block"}}/>`;
 else if(av&&av.startsWith("char:"))inner=html`<span style=${{display:"block",width:"100%",height:"100%"}} dangerouslySetInnerHTML=${{__html:avatarCharSVG(av.slice(5))}}></span>`;
 else inner=html`<span style=${{display:"block",width:"100%",height:"100%"}} dangerouslySetInnerHTML=${{__html:avatarDefaultSVG(p&&p.id)}}></span>`;
 return html`<span className="avatar" role="img" aria-label=${((p&&p.nickname)||"참여자")+" 프로필"} style=${{width:size,height:size,boxShadow:ring?"0 0 0 2px var(--paper),0 0 0 3.5px var(--gold)":undefined}}>${inner}</span>`;
}

/* signed photo urls, keyed by "<id>:<avatar_v>" — filled by the app, read by <Avatar> */
const AVCACHE={};
const avKey=p=>p?`${p.id}:${p.avatar_v||0}`:"";
async function squareImage(file,size){const url=URL.createObjectURL(file);try{const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=url});const m=Math.min(img.naturalWidth,img.naturalHeight);const c=document.createElement("canvas");c.width=size;c.height=size;c.getContext("2d").drawImage(img,(img.naturalWidth-m)/2,(img.naturalHeight-m)/2,m,m,0,0,size,size);return c.toDataURL("image/jpeg",.86)}finally{URL.revokeObjectURL(url)}}

function AvatarSheet({profile,uid,onClose,onSaved,toast}){
 const cur=profile.avatar||null;const [mode,setMode]=useState(cur==="photo"?"photo":cur?"char":"char");
 const [pick,setPick]=useState(cur&&cur.startsWith("char:")?cur.slice(5):null);
 const [photo,setPhoto]=useState(null);const [scope,setScope]=useState(profile.avatar_scope||"friends");const [busy,setBusy]=useState(false);
 const existingUrl=cur==="photo"?AVCACHE[avKey(profile)]:null;
 const preview=mode==="photo"?{...profile,avatar:(photo||existingUrl)?"photo":null}:mode==="char"&&pick?{...profile,avatar:"char:"+pick}:{...profile,avatar:null};
 async function choose(e){const f=e.target.files&&e.target.files[0];if(!f)return;try{setPhoto(await squareImage(f,480))}catch(err){toast("사진을 읽지 못했습니다. 다른 사진을 골라 주세요.")}}
 async function save(){setBusy(true);try{let next;
   if(mode==="photo"){if(photo){await api.uploadAvatar(uid,photo)}else if(cur!=="photo"){toast("사진을 먼저 골라 주세요.");setBusy(false);return}
    next=await api.setAvatar(uid,{avatar:"photo",avatar_scope:scope,avatar_v:(profile.avatar_v||0)+(photo?1:0)});if(photo)AVCACHE[avKey(next)]=photo}
   else if(mode==="char"){if(!pick){toast("캐릭터를 하나 골라 주세요.");setBusy(false);return}next=await api.setAvatar(uid,{avatar:"char:"+pick});if(cur==="photo")api.removeAvatarPhoto(uid).catch(()=>{})}
   else{next=await api.setAvatar(uid,{avatar:null});if(cur==="photo")api.removeAvatarPhoto(uid).catch(()=>{})}
   track("avatar_set",{mode,scope:mode==="photo"?scope:undefined});onSaved(next);toast("프로필 이미지를 바꿨어요.");onClose()}
  catch(e){toast("저장하지 못했습니다. 사진이 너무 크면 다른 사진으로 시도해 주세요.")}finally{setBusy(false)}}
 return html`<${Sheet} title="프로필 이미지" onClose=${onClose}>
  <div className="stack" style=${{alignItems:"center"}}><${Avatar} p=${preview} url=${mode==="photo"?(photo||existingUrl):null} size=${120} ring=${true}/><b className="serif" style=${{color:"var(--accent)",fontSize:"17px"}}>${profile.nickname}</b><span className="small faint">닉네임 옆 작은 원에 보여요. 카드의 주인공은 여전히 젬입니다.</span></div>
  <div className="segs" role="tablist">${[["char","캐릭터"],["photo","내 사진"],["none","기본 원석"]].map(([k,t])=>html`<button key=${k} role="tab" aria-pressed=${mode===k} onClick=${()=>setMode(k)}>${t}</button>`)}</div>
  ${mode==="char"&&html`<div className="avgrid">${AVATARS.map(a=>html`<button key=${a.id} className="avpick" aria-pressed=${pick===a.id} aria-label=${a.name} onClick=${()=>setPick(a.id)}><span dangerouslySetInnerHTML=${{__html:avatarCharSVG(a.id)}}></span><small>${a.name}</small></button>`)}</div>`}
  ${mode==="photo"&&html`<div className="stack">
   <label className="btn quiet filebtn">${photo||existingUrl?"다른 사진 고르기":"사진 고르기"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange=${choose}/></label>
   <div className="field"><span className="lbl">누구에게 보일까요?</span><div className="segs" role="group">${[["friends","친구만"],["all","1기 전체"]].map(([k,t])=>html`<button key=${k} aria-pressed=${scope===k} onClick=${()=>setScope(k)}>${t}</button>`)}</div><span className="hint">${scope==="friends"?"친구가 아닌 사람에게는 기본 원석으로 보여요.":"함께 테스트하는 1기 참여자 모두에게 보여요."}</span></div>
   <p className="note">가운데를 정사각형으로 잘라 저장하고, 위치 같은 사진 정보는 지워집니다. 본인 사진만 올려 주세요. 신고가 들어오면 운영자가 내릴 수 있어요.</p></div>`}
  ${mode==="none"&&html`<p className="small muted">아무것도 고르지 않으면 "원석"이 들어갑니다. 누구나 원석으로 태어나니까요.</p>`}
  <button className="btn block" disabled=${busy} onClick=${save}>${busy?"저장하는 중…":"이대로 쓰기"}</button>
 <//>`;
}
