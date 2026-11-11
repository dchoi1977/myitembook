"use strict";
/* MIB CBT · social — friends, profiles (파도타기), 공감, 한 단어, 조회 기록, 소식, 알림 */
const LIKE_T={gem:"젬",crests:"휘장",badges:"업적",shelf:"선반",item:"아이템"};
function LikeBtn({to,target,refId="",soc,reloadSoc,toast,demo,label}){const [busy,setBusy]=useState(false);const m=(soc.reactFrom||[]).find(r=>r.to_id===to&&r.kind==="like"&&r.target===target&&(r.ref||"")===refId);
 async function go(e){e.stopPropagation();if(demo||busy)return;setBusy(true);try{if(m){await api.unreact(m.id)}else{await api.react(to,"like",target,refId);track("like",{target});toast(`${LIKE_T[target]}에 좋아요를 남겼어요.`)}await reloadSoc()}catch(x){toast("좋아요를 남기지 못했어요.")}finally{setBusy(false)}}
 return html`<button className=${"likebtn"+(m?" on":"")} aria-pressed=${!!m} disabled=${busy} onClick=${go} aria-label=${(label||LIKE_T[target])+" 좋아요"}><span aria-hidden="true">${m?"♥":"♡"}</span>${m?"좋아요":"좋아요"}</button>`}
const REACT={similar:{label:"닮았어요",glyph:"고리"},learn:{label:"배우고 싶어요",glyph:"책"},cheer:{label:"응원해요",glyph:"별"}};
const nick=(names,id)=>((names[id]||{}).nickname)||"MIB 참여자";
function relation(uid,other,fr){const f=(fr||[]).find(x=>(x.requester===uid&&x.addressee===other)||(x.requester===other&&x.addressee===uid));if(!f)return "none";if(f.status==="accepted")return "friend";return f.requester===uid?"sent":"incoming"}
function friendIds(uid,fr){return (fr||[]).filter(f=>f.status==="accepted").map(f=>f.requester===uid?f.addressee:f.requester)}
function ago(ts){const d=(Date.now()-new Date(ts).getTime())/1000;if(d<60)return "방금";if(d<3600)return Math.floor(d/60)+"분 전";if(d<86400)return Math.floor(d/3600)+"시간 전";if(d<86400*7)return Math.floor(d/86400)+"일 전";return new Date(ts).toLocaleDateString("ko-KR")}
function shareLink(nickname){return `${location.origin}${location.pathname}#u=${encodeURIComponent(nickname)}`}
async function copyText(t){try{await navigator.clipboard.writeText(t);return true}catch(e){try{const a=document.createElement("textarea");a.value=t;document.body.appendChild(a);a.select();const ok=document.execCommand("copy");a.remove();return ok}catch(_){return false}}}

function FriendButton({uid,other,soc,reloadSoc,toast,demo,small}){
 const [busy,setBusy]=useState(false);const rel=relation(uid,other,soc.friendships);
 async function run(fn,msg,ev){if(demo)return;setBusy(true);try{await fn();track(ev);toast(msg);await reloadSoc()}catch(e){toast("처리하지 못했습니다. 잠시 후 다시 시도해 주세요.")}finally{setBusy(false)}}
 const cls="btn"+(small?" sm":"");
 if(rel==="friend")return html`<span className="chip">서로 친구</span>`;
 if(rel==="sent")return html`<button className=${cls+" ghost"} disabled=${busy} onClick=${()=>run(()=>api.friendRemove(uid,other),"요청을 취소했어요.","friend_cancel")}>요청 보냄 · 취소</button>`;
 if(rel==="incoming")return html`<button className=${cls} disabled=${busy} onClick=${()=>run(async()=>{await api.friendAccept(other,uid);api.postFeed("friend",{})},"친구가 되었어요.","friend_accept")}>요청 수락</button>`;
 return html`<button className=${cls} disabled=${busy||demo} onClick=${()=>run(()=>api.friendRequest(other),"친구 요청을 보냈어요.","friend_request")}>친구 요청</button>`;
}

function FriendsTab({uid,st,soc,names,reloadSoc,openUser,toast,profile,demo,ensureNames}){const [sampleOpen,setSampleOpen]=useState(false);
 const [q,setQ]=useState("");const [found,setFound]=useState(null);const [cards,setCards]=useState(null);const [busy,setBusy]=useState(false);
 const fids=friendIds(uid,soc.friendships);
 const incoming=(soc.friendships||[]).filter(f=>f.status==="pending"&&f.addressee===uid);
 const outgoing=(soc.friendships||[]).filter(f=>f.status==="pending"&&f.requester===uid);
 useEffect(()=>{if(demo)return;let alive=true;api.listCards().then(r=>{if(!alive)return;setCards(r);ensureNames(r.map(c=>c.user_id))}).catch(()=>setCards([]));return()=>{alive=false}},[soc.friendships&&soc.friendships.length]);
 async function search(e){e&&e.preventDefault();if(!q.trim())return;setBusy(true);try{const r=await api.searchProfiles(q);setFound(r.filter(p=>p.id!==uid));ensureNames(r.map(p=>p.id));track("friend_search")}catch(err){toast("찾지 못했습니다.")}finally{setBusy(false)}}
 async function share(){const link=shareLink(profile.nickname);if(navigator.share){try{await navigator.share({title:"MyItemBook",text:`${profile.nickname}의 젬 카드`,url:link});track("share_link",{via:"native"});return}catch(e){}}const ok=await copyText(link);track("share_link",{via:"copy"});toast(ok?"내 프로필 링크를 복사했어요. 1기 참여자에게 보내 보세요.":"복사하지 못했습니다: "+link)}
 if(demo)return html`<div className="main wrap"><div className="stack"><div className="eyebrow">친구</div><h1 className="h2">결이 맞는 사람</h1><p className="muted">예시 모드에서는 실제 사람을 보여 주지 않습니다. 아래는 예시 카드입니다.</p></div><div className="stack"><span className="example-mark">예시</span><${PublicCardView} card=${{...EXAMPLE_PERSON,stage:2}} name="예시 인물"/><div className="reason">닮은 결 · 꾸준함 / 보완하는 결 · 설명력, 돌봄</div></div></div>`;
 const cardOf=id=>(cards||[]).find(c=>c.user_id===id);
 const others=(cards||[]).filter(c=>c.user_id!==uid&&!fids.includes(c.user_id));
 const ranked=st.analysis?others.map(c=>({c,r:resonance(st.analysis,c.data)})).sort((x,y)=>y.r.score-x.r.score):others.map(c=>({c,r:{same:[],comp:[]}}));
 return html`<div className="main wrap">
  <div className="stack"><div className="eyebrow">친구 · ${MIB_CONFIG.cohort}</div><h1 className="h2">결이 맞는 사람</h1><p className="muted small">친구가 되면 서로의 소식과 '친구만' 공개한 카드를 볼 수 있어요. 순위나 점수는 없습니다.</p></div>
  <${SampleStrip} onOpen=${()=>setSampleOpen(true)}/>
  ${sampleOpen&&html`<${SampleGallery} onClose=${()=>setSampleOpen(false)} toast=${toast}/>`}
  <${MyGems} fids=${fids} cardOf=${cardOf} names=${names} soc=${soc} uid=${uid} openUser=${openUser} toast=${toast} onFind=${()=>{const el=document.querySelector('[aria-label="닉네임으로 찾기"]');if(el){el.scrollIntoView({block:"center"});el.focus()}}}/>
  <div className="panel stack"><div className="row between"><b>내 프로필 링크</b><span className="faint small">@${profile.nickname}</span></div><span className="small muted">1기 참여자에게 보내면 바로 내 카드로 와서 친구 요청을 할 수 있어요.</span><button className="btn quiet sm" onClick=${share}><${Ico} n="share"/>링크 보내기</button></div>
  <form className="row" onSubmit=${search} role="search"><input type="text" aria-label="닉네임으로 찾기" placeholder="닉네임으로 찾기" value=${q} onChange=${e=>setQ(e.target.value)} style=${{flex:1}}/><button className="btn sm" disabled=${busy||!q.trim()}><${Ico} n="search"/>찾기</button></form>
  ${found&&html`<div className="list">${found.length?found.map(p=>html`<div className="list-row" key=${p.id} style=${{cursor:"default"}}><${Avatar} p=${p} size=${32}/><span className="grow"><button className="linkbtn" onClick=${()=>openUser(p.id)}>${p.nickname}</button>${p.role==="admin"?html` <span className="tag">운영</span>`:null}</span><${FriendButton} uid=${uid} other=${p.id} soc=${soc} reloadSoc=${reloadSoc} toast=${toast} small=${true}/></div>`):html`<p className="small faint">그 닉네임의 참여자가 없어요.</p>`}</div>`}
  ${incoming.length>0&&html`<div className="stack"><h2 className="h3">나에게 온 친구 요청</h2>${incoming.map(f=>html`<div className="panel row" key=${f.requester}><${Avatar} p=${names[f.requester]||{id:f.requester}} size=${34}/><button className="linkbtn grow" style=${{textAlign:"left"}} onClick=${()=>openUser(f.requester)}>${nick(names,f.requester)}</button><${FriendButton} uid=${uid} other=${f.requester} soc=${soc} reloadSoc=${reloadSoc} toast=${toast} small=${true}/><button className="btn ghost sm" onClick=${async()=>{await api.friendRemove(uid,f.requester);track("friend_decline");reloadSoc()}}>괜찮아요</button></div>`)}</div>`}
  ${fids.length>0&&html`<details className="mg-list"><summary>목록으로 보기 · 내 친구 ${fids.length}${outgoing.length?` · 보낸 요청 ${outgoing.length}`:""}</summary>
   ${fids.length?html`<div className="list">${fids.map(id=>{const c=cardOf(id);return html`<button className="list-row" key=${id} onClick=${()=>openUser(id)}><${Avatar} p=${names[id]||{id}} size=${42}/><span className="grow"><span className="t">${nick(names,id)} ${(()=>{const b=bondOf(uid,id,soc.friendships);return b&&(b.name?html`<${BondChip} name=${b.name}/>`:b.incoming?html`<span className="upd-new">관계 제안</span>`:null)})()}</span><br/><span className="d">${c?c.data.gemName+" · 연마 "+(c.data.stage||1)+"단계":"아직 카드 비공개"}</span></span><span className="chev">›</span></button>`})}</div>`:html`<p className="small muted">아직 친구가 없어요. 아래 1기 참여자 카드에서 결이 닮은 사람을 찾아보세요.</p>`}
  </details>`}
  <div className="stack"><h2 className="h3">1기 둘러보기</h2>
   ${!st.visibility.public&&html`<div className="panel tint stack small"><span>내 카드는 지금 <b>나만 보기</b>입니다. 다른 사람 카드는 볼 수 있지만, 공개해야 상대에게도 보여요.</span></div>`}
   ${cards===null?html`<p className="small faint">카드를 불러오는 중…</p>`:ranked.length?ranked.map(({c,r})=>html`<div className="stack" key=${c.user_id} style=${{gap:"8px"}}>
    <button className="cardbtn" onClick=${()=>openUser(c.user_id)} aria-label=${nick(names,c.user_id)+"의 카드 보기"}><${PublicCardView} card=${c.data} name=${nick(names,c.user_id)} who=${names[c.user_id]} compact=${true}/></button>
    <div className="reason">${r.same.length?`닮은 결 · ${r.same.slice(0,3).join(", ")}`:"새로운 결을 만날 수 있는 사람"}${r.comp.length?` / 보완하는 결 · ${r.comp.join(", ")}`:""}</div>
    <div className="row"><${FriendButton} uid=${uid} other=${c.user_id} soc=${soc} reloadSoc=${reloadSoc} toast=${toast} small=${true}/><button className="btn ghost sm" onClick=${()=>openUser(c.user_id)}>카드 보기</button></div>
   </div>`):html`<div className="panel small muted">아직 1기 전체에 카드를 공개한 다른 참여자가 없어요. 친구에게 내 링크를 보내 보세요.</div>`}
  </div>
 </div>`;
}

/* 알림에서 넘어왔을 때: 답해야 할 자리로 바로 데려가 잠깐 빛나게 한다 */
function useFocusJump(focus,dep){useEffect(()=>{if(!focus)return;let n=0,t;const go=()=>{const el=document.querySelector(`[data-focus="${focus}"]`);if(el){try{el.scrollIntoView({block:"center",behavior:"smooth"})}catch(e){el.scrollIntoView()}el.classList.add("focus-pulse");setTimeout(()=>el.classList.remove("focus-pulse"),2800);const inp=el.querySelector("input:not([type=checkbox]),textarea");if(inp){try{inp.focus({preventScroll:true})}catch(e){}}}else if(n++<10)t=setTimeout(go,250)};t=setTimeout(go,150);return()=>clearTimeout(t)},[focus,dep])}
function ProfileSheet({id,uid,st,soc,names,onClose,openUser,reloadSoc,toast,demo,ensureNames,focus}){
 useFocusJump(focus,id);
 const [card,setCard]=useState(undefined);const [asked,setAsked]=useState(null);const [show,setShow]=useState(false);const [words,setWords]=useState([]);const [fof,setFof]=useState([]);const [busy,setBusy]=useState(false);
 const [word,setWord]=useState("");const [rep,setRep]=useState(null);const [g3,setG3]=useState(false);
 const isMe=id===uid;const rel=relation(uid,id,soc.friendships);
 useEffect(()=>{let alive=true;setCard(undefined);(async()=>{try{ensureNames([id]);const c=await api.getCard(id);if(!alive)return;setCard(c||null);if(c){api.cardWords(id).then(w=>alive&&setWords(w||[])).catch(()=>{});if(!isMe){api.recordView(id);track("view_card",{rel})}}if(rel==="friend"||isMe){const f=await api.friendsOf(id).catch(()=>[]);if(alive){setFof((f||[]).filter(x=>x.id!==uid));ensureNames((f||[]).map(x=>x.id))}}}catch(e){if(alive)setCard(null)}})();return()=>{alive=false}},[id,rel]);
 const myWord=(soc.wordsFrom||[]).find(w=>w.to_id===id);
 useEffect(()=>{setWord(myWord?myWord.word:"")},[id,myWord&&myWord.word]);
 const mine=k=>(soc.reactFrom||[]).find(r=>r.to_id===id&&r.target==="card"&&r.kind===k);
 async function toggle(k){if(demo||isMe)return;setBusy(true);try{const m=mine(k);if(m){await api.unreact(m.id);track("unreact",{kind:k})}else{await api.react(id,k);track("react",{kind:k});toast(`'${REACT[k].label}'를 건넸어요.`)}await reloadSoc()}catch(e){toast("공감을 남기지 못했습니다.")}finally{setBusy(false)}}
 async function sendWord(){const w=word.trim().slice(0,8);if(!w)return;setBusy(true);try{await api.word(uid,id,w);track("word",{edit:!!myWord});toast("한 단어를 건넸어요.");await reloadSoc();api.cardWords(id).then(setWords).catch(()=>{})}catch(e){toast("한 단어를 남기지 못했습니다.")}finally{setBusy(false)}}
 async function requestCard(){setAsked("busy");try{const r=await api.requestCard(id);setAsked(r==='already_asked'?'already_asked':'sent');track("card_request",{r});toast(r==="sent"?`${nick(names,id)}님에게 카드 공개를 부탁했어요.`:r==="already_asked"?"오늘은 이미 요청했어요. 내일 다시 부탁할 수 있어요.":r==="already_open"?"이미 카드가 공개되어 있어요.":"요청을 보내지 못했어요.");if(r==="already_open")onClose()}catch(e){setAsked(null);toast("요청을 보내지 못했어요.")}}
 async function sendReport(){if(!rep||!rep.trim())return;try{await api.report(id,rep.trim().slice(0,500));track("report");toast("운영자에게 알렸습니다. 확인 후 조치할게요.");setRep(null)}catch(e){toast("신고를 보내지 못했습니다.")}}
 const r=card&&st.analysis&&!isMe?resonance(st.analysis,card.data):null;
 return html`<${Sheet} title=${nick(names,id)} onClose=${onClose}>
  <div className="row"><${Avatar} p=${names[id]||{id}} size=${56} ring=${rel==="friend"}/><span className="grow"><b className="serif" style=${{fontSize:"18px",color:"var(--accent)"}}>${nick(names,id)}</b><br/><span className="small faint">${isMe?"나":rel==="friend"?html`서로 친구 ${(()=>{const b=bondOf(uid,id,soc.friendships);return b&&b.name?html`<${BondChip} name=${b.name}/>`:null})()}`:rel==="sent"?"친구 요청 보냄":rel==="incoming"?"나에게 친구 요청":"1기 참여자"}</span></span></div>
  ${card===undefined?html`<p className="faint small">카드를 불러오는 중…</p>`:card?html`<div className="stack">
   <${PublicCardView} card=${card.data} name=${nick(names,id)} who=${names[id]}/>
   ${r&&html`<div className="reason">${r.same.length?`닮은 결 · ${r.same.slice(0,3).join(", ")}`:"새로운 결을 만날 수 있는 사람"}${r.comp.length?` / 보완하는 결 · ${r.comp.join(", ")}`:""}</div>`}
   ${words.length>0&&html`<div className="stack" style=${{gap:"6px"}}><span className="eyebrow">사람들이 건넨 한 단어</span><div className="wordchips">${words.map(w=>html`<span className="chip gold" key=${w.word}>${w.word}${w.n>1?" ×"+w.n:""}</span>`)}</div></div>`}
  ${card&&html`<div className="visit">
    <section className="visit-sec"><div className="visit-h"><b>젬</b><span className="grow small faint">${card.data.gemName} · 연마 ${card.data.stage||1}단계</span>${!isMe&&html`<${LikeBtn} to=${id} target="gem" soc=${soc} reloadSoc=${reloadSoc} toast=${toast} demo=${demo}/>`}</div>
     <div className="visit-gem"><${GemView} g=${card.data.gem} seed=${card.data.gemName} size=${170}/></div>
     <div className="row"><button className="btn quiet sm grow" onClick=${()=>setG3(true)}>◇ 3D로 돌려 보기</button><button className="btn quiet sm grow" onClick=${()=>setShow(true)}>✦ 카드 앞·뒷면</button></div>
     <details className="why-fold"><summary>이 젬은 왜 이런 모양일까?</summary><${GemWhy} g=${card.data.gem} seed=${card.data.gemName} own=${isMe} name=${nick(names,id)}/></details></section>
    ${((card.data.crests||[]).length>0)&&html`<section className="visit-sec"><div className="visit-h"><b>휘장</b><span className="grow small faint">진열한 ${card.data.crests.length}개</span>${!isMe&&html`<${LikeBtn} to=${id} target="crests" soc=${soc} reloadSoc=${reloadSoc} toast=${toast} demo=${demo}/>`}</div><div className="crest-row" style=${{justifyContent:"flex-start"}}>${card.data.crests.map((e,i)=>html`<${Crest} key=${i} e=${e} pub=${true} size=${52}/>`)}</div></section>`}
    ${(()=>{const B=(card.data.badgesAll||card.data.badges||[]).map(badgeById).filter(Boolean);return B.length>0&&html`<section className="visit-sec"><div className="visit-h"><b>업적 도감</b><span className="grow small faint">배지 ${B.length} / ${BADGES.length}</span>${!isMe&&html`<${LikeBtn} to=${id} target="badges" soc=${soc} reloadSoc=${reloadSoc} toast=${toast} demo=${demo}/>`}</div><div className="visit-badges">${B.map(b=>html`<div key=${b.id} className="visit-badge" title=${b.desc}><${Medal} b=${b} earned=${true} size=${46}/><span>${b.name}</span></div>`)}</div></section>`})()}
    ${card.data.shelf>0&&html`<section className="visit-sec"><div className="visit-h"><b>선반</b><span className="grow small faint">공개한 아이템 ${card.data.shelf}개</span>${!isMe&&html`<${LikeBtn} to=${id} target="shelf" soc=${soc} reloadSoc=${reloadSoc} toast=${toast} demo=${demo}/>`}</div><${SharedShelf} owner=${id} name=${nick(names,id)} bare=${true} like=${!isMe?(it=>html`<${LikeBtn} to=${id} target="item" refId=${String(it.id)} soc=${soc} reloadSoc=${reloadSoc} toast=${toast} demo=${demo} label=${it.name}/>`):null}/></section>`}
   </div>`}
  ${g3&&card&&html`<${Gem3DView} g=${card.data.gem} seed=${card.data.gemName} name=${nick(names,id)} onClose=${()=>setG3(false)}/>`}${show&&card&&html`<${CardShowcase} faces=${otherCardFaces(card,nick(names,id),id)} toast=${toast} onClose=${()=>setShow(false)}/>`}
  </div>`:rel==="friend"&&!isMe?html`<div className="panel tint stack small"><span>${nick(names,id)}님은 아직 카드를 공개하지 않았어요.</span><span className="muted">공개를 부탁하면 알림으로 전해져요. 공개되면 나에게도 알림이 와요.</span><button className="btn sm" disabled=${demo||asked==="sent"||asked==="busy"} onClick=${requestCard}>${asked==="sent"||asked==="already_asked"?"요청을 보냈어요":"카드 공개 요청하기"}</button></div>`:html`<div className="panel tint small">${isMe?"아직 카드를 공개하지 않았어요.":rel==="friend"?"아직 카드를 공개하지 않았어요.":"카드를 공개하지 않았거나, 친구에게만 공개한 참여자예요. 친구가 되면 볼 수 있을지도 몰라요."}</div>`}
  ${!isMe&&html`<div className="row" data-focus="friend"><${FriendButton} uid=${uid} other=${id} soc=${soc} reloadSoc=${reloadSoc} toast=${toast} demo=${demo}/>${rel==="friend"&&html`<button className="linkbtn small" onClick=${async()=>{await api.friendRemove(uid,id);track("unfriend");reloadSoc();toast("친구를 끊었어요.")}}>친구 끊기</button>`}</div>`}
  ${rel==="friend"&&!isMe&&html`<div data-focus="bond"><${BondPanel} uid=${uid} other=${id} name=${nick(names,id)} soc=${soc} reloadSoc=${reloadSoc} toast=${toast} demo=${demo}/></div>`}
  ${card&&!isMe&&html`<div className="stack"><span className="eyebrow">공감 남기기 — 숫자는 주인에게만 보여요</span><div className="react-row">${Object.entries(REACT).map(([k,v])=>html`<button key=${k} className="react" aria-pressed=${!!mine(k)} disabled=${busy} onClick=${()=>toggle(k)}><${Glyph} name=${v.glyph} size=${18}/>${v.label}</button>`)}</div></div>`}
  ${card&&!isMe&&card.data.acceptWords&&html`<div className="stack"><span className="eyebrow">한 단어 추천사</span><div className="row"><input type="text" aria-label="한 단어 (8자 이내)" maxLength="8" value=${word} placeholder="예) 든든함" onChange=${e=>setWord(e.target.value)} style=${{flex:1}}/><button className="btn sm" disabled=${busy||!word.trim()||(myWord&&myWord.word===word.trim())} onClick=${sendWord}>${myWord?"고치기":"건네기"}</button></div></div>`}
  ${fof.length>0&&html`<div className="stack"><span className="eyebrow">${isMe?"내 친구":nick(names,id)+"의 친구"} · 파도타기</span><div className="wordchips">${fof.map(f=>html`<button key=${f.id} className="chip plain chipbtn" onClick=${()=>openUser(f.id)}>${f.nickname}${f.has_card?" ◆":""}</button>`)}</div></div>`}
  ${!isMe&&(rep===null?html`<button className="linkbtn small" style=${{color:"var(--ink-3)"}} onClick=${()=>setRep("")}>이 카드 신고하기</button>`:html`<div className="panel stack"><label htmlFor="rep" className="small"><b>운영자에게 알릴 내용</b></label><textarea id="rep" value=${rep} maxLength="500" onChange=${e=>setRep(e.target.value)} style=${{minHeight:"70px"}}></textarea><div className="row"><button className="btn ghost sm" onClick=${()=>setRep(null)}>취소</button><button className="btn sm grow" disabled=${!rep.trim()} onClick=${sendReport}>보내기</button></div></div>`)}
 <//>`;
}

/* 받은 공감 · 나를 본 사람 (owner only) */
function MineSheet({uid,soc,names,profile,onClose,openUser,ensureNames}){
 const [vis,setVis]=useState(null);
 useEffect(()=>{api.visitors().then(v=>{setVis(v||[]);ensureNames((v||[]).map(x=>x.viewer_id))}).catch(()=>setVis([]));ensureNames([...(soc.reactTo||[]).map(r=>r.from_id),...(soc.wordsTo||[]).map(w=>w.from_id)]);track("open_mine")},[]);
 const card=(soc.reactTo||[]).filter(r=>r.target==="card");const feedCheers=(soc.reactTo||[]).filter(r=>r.target==="feed").length;
 const named=(vis||[]).filter(v=>v.viewer_id);const anon=(vis||[]).filter(v=>!v.viewer_id).length;
 const uniqNamed=[...new Map(named.map(v=>[v.viewer_id,v])).values()];
 return html`<${Sheet} title="받은 공감과 방문" onClose=${onClose}>
  <p className="small muted">이 숫자들은 나에게만 보입니다. 다른 사람과 비교하는 순위는 없어요.</p>
  ${(()=>{const L=(soc.reactTo||[]).filter(r=>r.kind==="like");return L.length>0&&html`<div className="stack"><h2 className="h3">받은 좋아요 <span className="small faint">${L.length}</span></h2><div className="stat">${Object.entries(LIKE_T).filter(([k])=>k!=="item").map(([k,t])=>html`<div key=${k}><b>${L.filter(r=>r.target===k||(k==="shelf"&&r.target==="item")).length}</b><span>${t}</span></div>`)}</div><div className="wordchips">${[...new Set(L.map(r=>r.from_id))].slice(0,30).map(fid=>html`<button key=${fid} className="chip plain chipbtn" onClick=${()=>openUser(fid)}>${nick(names,fid)} · ♥ ${[...new Set(L.filter(r=>r.from_id===fid).map(r=>LIKE_T[r.target]))].join("·")}</button>`)}</div></div>`})()}
  <div className="stack"><h2 className="h3">카드에 받은 공감</h2>
   <div className="stat">${Object.entries(REACT).map(([k,v])=>html`<div key=${k}><b>${card.filter(r=>r.kind===k).length}</b><span>${v.label}</span></div>`)}</div>
   ${card.length>0&&html`<div className="wordchips">${[...new Set(card.map(r=>r.from_id))].slice(0,30).map(fid=>html`<button key=${fid} className="chip plain chipbtn" onClick=${()=>openUser(fid)}>${nick(names,fid)} · ${card.filter(r=>r.from_id===fid).map(r=>(REACT[r.kind]||{}).label).filter(Boolean).join(", ")}</button>`)}</div>`}
   <p className="small muted">소식에 받은 응원 ${feedCheers}개</p>
  </div>
  <div className="stack"><h2 className="h3">한 단어 추천사</h2>${(soc.wordsTo||[]).length?html`<div className="wordchips">${soc.wordsTo.map(w=>html`<button key=${w.from_id} className="chip gold chipbtn" onClick=${()=>openUser(w.from_id)}>${w.word} · ${nick(names,w.from_id)}</button>`)}</div>`:html`<p className="small faint">아직 받은 한 단어가 없어요.</p>`}</div>
  <div className="stack"><h2 className="h3">최근 14일, 내 카드를 본 사람</h2>
   ${vis===null?html`<p className="small faint">불러오는 중…</p>`:profile.quiet_view?html`<p className="small muted">'조용히 보기'를 켜 두어 방문자 이름은 보이지 않아요. 방문 ${vis.length}번.</p>`:html`
    ${uniqNamed.length?html`<div className="wordchips">${uniqNamed.map(v=>html`<button key=${v.viewer_id} className="chip plain chipbtn" onClick=${()=>openUser(v.viewer_id)}>${v.nickname}</button>`)}</div>`:null}
    <p className="small muted">${uniqNamed.length?`친구 ${uniqNamed.length}명이 다녀갔어요.`:"다녀간 친구가 아직 없어요."}${anon?` 그 밖에 이름 없이 ${anon}번 다녀갔어요.`:""}</p>
    <p className="note">친구가 아니거나 '조용히 보기'를 켠 사람은 이름 없이 숫자로만 보입니다.</p>`}
  </div>
 <//>`;
}

/* 소식 — friends' growth moments + CBT 1기 collective gem */
const AW_VERB={wings:"빛의 날개가 돋았어요",nebula:"성운이 피어났어요",phoenix:"불사조빛이 타올랐어요",star:"별 컷으로 다시 깎였어요",sun:"태양 심이 떠올랐어요",holo:"홀로그램 빛이 흐르기 시작했어요",crown:"왕관이 얹혔어요",heart:"하트 컷으로 다시 깎였어요",glowsym:"상이 빛나기 시작했어요"};
const FEED_TEXT={discover:p=>`첫 젬을 발견했어요${p.gemName?" · "+p.gemName:""}`,reread:()=>"새 기록으로 나를 다시 읽었어요",stage:p=>`연마 ${p.stage}단계 · ${STAGES[p.stage]||""}에 올랐어요`,badge:p=>{const b=BADGES.find(x=>x.id===p.id);return `새 배지 · ${b?b.name:"배지"}`},step:()=>"오늘의 한 걸음을 마쳤어요",publish:p=>p.aud==="friends"?"친구에게 카드를 공개했어요":"카드를 공개했어요",friend:()=>"새 친구와 이어졌어요",week:()=>"7일의 변화를 돌아봤어요",awaken:p=>`${p.t>=4?"✦ 전설":"✧ 영웅"} 발현! 젬에 ${AW_VERB[p.k]||(p.n+"이(가) 깨어났어요")}`,mark:p=>{const m=MARKS.find(x=>x.k===p.k);return m?`젬에 새 표식 · ${markTitle(m,p.lv)||m.label}`:"젬에 새 표식이 생겼어요"}};
const FEED_GLYPH={discover:"눈",reread:"새싹",stage:"별",badge:"별",step:"발자국",publish:"문",friend:"고리",week:"산",mark:"별",awaken:"별"};
function cohortGem(c){const st=c&&c.stones?Object.entries(c.stones).sort((a,b)=>b[1]-a[1]):[];return {stone:st.length?st[0][0]:"오팔",lightName:"1기",light:"물결",form:"군집",texture:"결정질",hardness:clamp(1+Math.floor((c&&c.steps||0)/30),1,5),grain:clamp(Math.floor((c&&c.logs||0)/10),0,7),facets:clamp(6+Math.floor((c&&c.participants||0)/3),6,14),symbol:"별"}}
function FeedTab({uid,soc,names,openUser,toast,demo,reloadSoc,ensureNames}){
 const [items,setItems]=useState(null);const [co,setCo]=useState(null);const [busy,setBusy]=useState(null);
 async function load(){try{const [f,c]=await Promise.all([api.feed(),api.cohort()]);setItems(f||[]);setCo(c);ensureNames((f||[]).map(x=>x.user_id))}catch(e){setItems([])}}
 useEffect(()=>{if(!demo)load()},[]);
 const myCheer=id=>(soc.reactFrom||[]).find(r=>r.target==="feed"&&r.ref===String(id));
 const gotCheers=id=>(soc.reactTo||[]).filter(r=>r.target==="feed"&&r.ref===String(id)).length;
 async function cheer(ev){setBusy(ev.id);try{const m=myCheer(ev.id);if(m)await api.unreact(m.id);else{await api.react(ev.user_id,"cheer","feed",String(ev.id));track("feed_cheer")}await reloadSoc()}catch(e){toast("응원을 남기지 못했습니다.")}finally{setBusy(null)}}
 if(demo)return html`<div className="main wrap"><div className="stack"><div className="eyebrow">소식</div><h1 className="h2">친구들의 성장 순간</h1><p className="muted">예시 모드에서는 실제 소식을 보여 주지 않습니다.</p></div></div>`;
 const fids=friendIds(uid,soc.friendships);
 return html`<div className="main wrap">
  <div className="stack"><div className="eyebrow">소식</div><h1 className="h2">친구들의 성장 순간</h1><p className="muted small">비교 대신 응원. 소식은 서로 친구인 사람에게만 보이고, 원문 기록이나 한 걸음 내용은 올라오지 않습니다.</p></div>
  ${co&&html`<div className="panel stack cohort"><div className="row" style=${{gap:"14px",flexWrap:"nowrap"}}><${GemView} g=${cohortGem(co)} seed="cbt-1" size=${92}/><div className="grow stack" style=${{gap:"2px"}}><span className="eyebrow">${MIB_CONFIG.cohort} 공동 젬</span><b className="serif" style=${{color:"var(--accent)",fontSize:"17px"}}>함께 깎는 결</b><span className="small muted">참여 ${co.participants}명 · 첫 발견 ${co.discovered} · 한 걸음 ${co.steps} · 한 줄 ${co.logs} · 친구 연결 ${co.friendships} · 공감 ${co.cheers}</span></div></div><p className="note">1기 모두의 한 걸음과 한 줄이 쌓일수록 이 젬도 단단해지고 결이 늘어납니다.</p></div>`}
  ${items===null?html`<p className="small faint">소식을 불러오는 중…</p>`:items.length?html`<div className="list">${items.map(ev=>{const mine=ev.user_id===uid;const f=FEED_TEXT[ev.kind];const m=myCheer(ev.id);return html`<div className=${"list-row"+(ev.kind==="awaken"?" feed-aw t"+((ev.payload||{}).t||3):"")} key=${ev.id} style=${{cursor:"default",alignItems:"flex-start"}}>
    <${Avatar} p=${names[ev.user_id]||{id:ev.user_id}} size=${38}/>
    <span className="grow"><span className="t">${mine?"나":html`<button className="linkbtn" style=${{padding:0}} onClick=${()=>openUser(ev.user_id)}>${nick(names,ev.user_id)}</button>`}</span><br/><span className="small">${f?f(ev.payload||{}):"새 소식"}</span><br/><span className="d">${ago(ev.created_at)}</span></span>
    ${mine?(gotCheers(ev.id)?html`<span className="chip gold">응원 ${gotCheers(ev.id)}</span>`:null):html`<button className="react sm" aria-pressed=${!!m} disabled=${busy===ev.id} onClick=${()=>cheer(ev)}><${Glyph} name="별" size=${15}/>${m?"응원함":"응원하기"}</button>`}
   </div>`})}</div>`:html`<div className="panel stack small"><b>아직 소식이 없어요.</b><span className="muted">${fids.length?"친구들이 한 걸음을 마치거나 배지를 받으면 여기에 나타나요.":"친구가 생기면 서로의 성장 순간이 여기에 모입니다. '친구' 탭에서 1기 참여자를 찾아보세요."}</span></div>`}
  <button className="btn ghost sm" onClick=${load}>새로 고침</button>
 </div>`;
}

/* 알림함 — notifications + announcements */
const NOTE_TEXT={friend_request:"님이 친구를 요청했어요",friend_accept:"님과 친구가 되었어요",word:"님이 한 단어를 건넸어요",reaction:"님이 공감을 남겼어요",card_request:"님이 내 카드를 보고 싶어 해요",card_opened:"님이 카드를 공개했어요",ask:"님이 질문을 보냈어요",ask_answer:"님이 내 질문에 답했어요",bond_request:"님이 관계 이름을 제안했어요",bond_accept:"님이 관계 제안을 수락했어요",bond_decline:"님이 관계 제안을 사양했어요"};
function InboxSheet({uid,notes,anns,names,soc,onClose,openUser,reloadSoc,toast,onPublish,isPublic,onAsk,asksMe}){
 useEffect(()=>{const ids=notes.filter(n=>!n.read_at).map(n=>n.id);if(ids.length)api.markRead(ids).catch(()=>{});try{localStorage.setItem("mib-ann-seen",String(anns[0]?anns[0].id:0))}catch(e){}track("open_inbox",{unread:ids.length})},[]);
 const go=n=>{const p=n.payload||{};track("inbox_go",{kind:n.kind});switch(n.kind){
  case "bond_request":case "bond_accept":case "bond_decline":return openUser(n.actor_id,"bond");
  case "friend_request":case "friend_accept":return openUser(n.actor_id,"friend");
  case "ask":return onAsk&&onAsk("answer:"+(p.round||""));
  case "ask_answer":return onAsk&&onAsk("asks");
  case "word":case "reaction":return onAsk&&onAsk("mine");
  case "card_request":return (!isPublic&&onPublish)?onPublish():openUser(n.actor_id);
  default:return openUser(n.actor_id)}};
 const stop=fn=>e=>{e.stopPropagation();fn&&fn(e)};
 return html`<${Sheet} title="알림" onClose=${onClose}>
  ${anns.length>0&&html`<div className="stack"><h2 className="h3">운영 공지</h2>${anns.slice(0,5).map(a=>html`<div className="panel stack small" key=${a.id}><div className="row between"><b>${a.title}</b><span className="faint">${ago(a.created_at)}</span></div>${a.body&&html`<span className="muted prewrap">${a.body}</span>`}</div>`)}</div>`}
  <div className="stack"><h2 className="h3">나에게 온 소식</h2>
   ${notes.length?html`<div className="list">${notes.map(n=>{const p=n.payload||{};let t=NOTE_TEXT[n.kind]||"새 소식";if(n.kind==="reaction")t=p.kind==="like"?`님이 내 ${LIKE_T[p.target]||"공간"}에 좋아요를 남겼어요`:p.target==="feed"?"님이 내 소식을 응원했어요":`님이 내 카드에 '${(REACT[p.kind]||{}).label||"공감"}'를 남겼어요`;if(n.kind==="bond_request")t=p.name?`님이 우리 사이를 '${p.name}'(으)로 하자고 해요`:"님이 관계 이름을 지우자고 해요";if(n.kind==="bond_accept"&&p.name)t=`님과 이제 '${p.name}' 사이예요`;if(n.kind==="word")t=`님이 한 단어 '${p.word||""}'를 건넸어요`;if(n.kind==="ask"&&p.q)t=`님이 물어요 · "${p.q}"`;if(n.kind==="ask_answer"&&p.q)t=`님이 답했어요 · "${p.q}"`;return html`<div className="list-row note-row" key=${n.id} role="button" tabIndex="0" onClick=${()=>go(n)} onKeyDown=${e=>{if(e.key==="Enter"&&e.target===e.currentTarget)go(n)}}>
    <span className=${"dotmark"+(n.read_at?"":" on")} aria-hidden="true"></span><${Avatar} p=${names[n.actor_id]||{id:n.actor_id}} size=${32}/>
    <span className="grow small"><button className="linkbtn" style=${{padding:0}} onClick=${stop(()=>openUser(n.actor_id))}>${nick(names,n.actor_id)}</button>${t}<br/><span className="d">${ago(n.created_at)}</span></span>
    ${n.kind==="card_request"&&!isPublic&&onPublish&&html`<button className="btn sm" onClick=${stop(onPublish)}>카드 공개하기</button>`}${n.kind==="bond_request"&&html`<button className="btn sm" onClick=${stop(()=>openUser(n.actor_id,"bond"))}>답하기</button>`}${n.kind==="card_opened"&&html`<button className="btn quiet sm" onClick=${stop(()=>openUser(n.actor_id))}>카드 보기</button>`}${n.kind==="ask"&&onAsk&&html`<button className="btn sm" onClick=${stop(()=>onAsk("answer:"+((n.payload||{}).round||"")))}>${(asksMe||[]).some(x=>x.round===(n.payload||{}).round&&x.answer)?"내 답 보기":"답하기"}</button>`}${n.kind==="ask_answer"&&onAsk&&html`<button className="btn quiet sm" onClick=${stop(()=>onAsk("asks"))}>답 보기</button>`}
    ${n.kind==="friend_request"&&relation(uid,n.actor_id,soc.friendships)==="incoming"&&html`<span onClick=${e=>e.stopPropagation()}><${FriendButton} uid=${uid} other=${n.actor_id} soc=${soc} reloadSoc=${reloadSoc} toast=${toast} small=${true}/></span>`}
   </div>`})}</div>`:html`<p className="small faint">아직 알림이 없어요.</p>`}
  </div>
 <//>`;
}

/* ───────── 기다리는 요청 다시 알려 주기 ─────────
   친구 요청·관계 이름 제안·친구의 질문처럼 '내 답을 기다리는 일'이 12시간 넘게 그대로면 '나' 탭 맨 위에 다시 띄운다.
   '나중에'를 누르면 그 건은 하루 동안 쉬고, 사흘이 지나면 한 번 더 또렷하게 알려 준다. */
const REMIND_AFTER=12*36e5,REMIND_SNOOZE=24*36e5;
function pendingAsks({uid,soc,notes,asksMe}){
 const out=[];const noteAt=(kind,actor)=>{const n=(notes||[]).find(x=>x.kind===kind&&x.actor_id===actor);return n?Date.parse(n.created_at):NaN};
 ((soc&&soc.friendships)||[]).forEach(f=>{
  if(f.status==="pending"&&f.addressee===uid)out.push({key:"fr:"+f.requester,kind:"friend",who:f.requester,at:Date.parse(f.created_at)||noteAt("friend_request",f.requester)});
  if(f.status==="accepted"&&f.bond_by&&f.bond_by!==uid&&(f.requester===uid||f.addressee===uid))out.push({key:"bd:"+f.bond_by+":"+(f.bond_prop||""),kind:"bond",who:f.bond_by,name:f.bond_prop||"",at:noteAt("bond_request",f.bond_by)})});
 (asksMe||[]).filter(a=>!a.answer).forEach(a=>out.push({key:"ask:"+a.round,kind:"ask",who:a.owner,round:a.round,q:a.text,at:Date.parse(a.at)}));
 return out}
function dueReminders(p,st,now){now=now||Date.now();const sn=(st&&st.flags&&st.flags.remind)||{};return pendingAsks(p).map(x=>({...x,age:Number.isFinite(x.at)?now-x.at:REMIND_AFTER})).filter(x=>x.age>=REMIND_AFTER&&!(sn[x.key]>now)).sort((a,b)=>b.age-a.age)}
function Reminders({uid,soc,notes,asksMe,names,st,update,openUser,onOpen,toast}){
 const due=dueReminders({uid,soc,notes,asksMe},st);const shown=useRef(false);
 useEffect(()=>{if(due.length&&!shown.current){shown.current=true;track("remind_show",{n:due.length,kinds:[...new Set(due.map(d=>d.kind))].join(",")})}},[due.length]);
 useEffect(()=>{const sn=(st.flags&&st.flags.remind)||{};const live=new Set(pendingAsks({uid,soc,notes,asksMe}).map(x=>x.key));const dead=Object.keys(sn).filter(k=>!live.has(k)&&sn[k]<Date.now());if(dead.length&&soc&&soc.friendships)update(s=>{const r={...(s.flags.remind||{})};dead.forEach(k=>delete r[k]);s.flags.remind=r})},[due.length]);
 if(!due.length)return null;
 const go=d=>{track("remind_go",{kind:d.kind});if(d.kind==="ask")onOpen("answer:"+d.round);else openUser(d.who,d.kind==="bond"?"bond":"friend")};
 const later=d=>{update(s=>{s.flags.remind={...(s.flags.remind||{}),[d.key]:Date.now()+REMIND_SNOOZE}});track("remind_later",{kind:d.kind});toast("내일 다시 알려 드릴게요.")};
 const txt=d=>d.kind==="friend"?"님이 친구 요청을 보냈어요":d.kind==="bond"?(d.name?`님이 우리 사이를 '${d.name}'(으)로 하자고 해요`:"님이 관계 이름을 지우자고 해요"):`님이 물었어요 · "${String(d.q||"").slice(0,40)}"`;
 const wait=d=>{const h=Math.floor(d.age/36e5);return h>=72?`${Math.floor(h/24)}일째 기다리는 중`:h>=24?`${Math.floor(h/24)}일 전`:`${h}시간 전`};
 return html`<div className="panel stack remind" role="region" aria-label="답을 기다리는 요청">
  <div className="row between"><span className="eyebrow">답을 기다리고 있어요</span><span className="small faint">${due.length}건</span></div>
  ${due.slice(0,4).map(d=>html`<div key=${d.key} className=${"remind-row"+(d.age>=72*36e5?" old":"")}>
   <${Avatar} p=${names[d.who]||{id:d.who}} size=${34}/>
   <span className="grow small" style=${{minWidth:0}}><b>${nick(names,d.who)}</b>${txt(d)}<br/><span className="faint">${wait(d)}</span></span>
   <span className="remind-acts"><button className="btn sm" onClick=${()=>go(d)}>${d.kind==="ask"?"답하기":d.kind==="bond"?"답하기":"확인하기"}</button><button className="linkbtn small" onClick=${()=>later(d)}>나중에</button></span>
  </div>`)}
  ${due.length>4&&html`<button className="linkbtn small" onClick=${()=>onOpen("inbox")}>알림에서 모두 보기 · ${due.length-4}건 더</button>`}
 </div>`;
}
