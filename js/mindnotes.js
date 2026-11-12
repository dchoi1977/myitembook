"use strict";
/* MIB CBT · 도착한 마음 — 친구 젬 소식 마지막 장에서 건넨 감정 아이콘과 한마디.
   받은 사람은 다음에 들어왔을 때 카드뉴스로 하나씩 보고, 본 마음은 바로 사라진다(서버에서도 지운다). */
const MN_EMO=[["👏","박수"],["🎉","축하"],["😍","멋져요"],["🥹","뭉클"],["🔥","불타오르네"],["💎","빛나요"],["🙌","최고"],["✨","반짝"]];
const MN_TXT_MAX=40;
const MN_DUST=Array.from({length:18},(_,k)=>{const a=k/18*Math.PI*2;return [Math.round(Math.cos(a)*(60+(k%3)*40)),Math.round(-120-(k%5)*36+Math.sin(a)*30),(k%6)*.05,k%3===0?"♡":k%3===1?"✦":"·"]});
function MnSend({fid,name,ctx,toast,demo}){
 const [sent,setSent]=useState([]);const [txt,setTxt]=useState("");const [busy,setBusy]=useState(false);const [err,setErr]=useState("");
 async function send(kind,body){if(demo||busy||!fid||!body)return;setBusy(true);setErr("");try{await api.heartSend(fid,kind,body,ctx);setSent(L=>[...L,{kind,body}]);if(kind==="text")setTxt("");track("mind_send",{kind});toast&&toast(kind==="emoji"?`${body} 를 건넸어요. ${name}님이 다음에 들어오면 보여요.`:`한마디를 건넸어요. ${name}님이 다음에 들어오면 보여요.`)}catch(e){const m=/row-level|policy|violates/i.test(String(e&&e.message||""))?"오늘은 충분히 건넸어요. 내일 또 건네 주세요.":"마음을 건네지 못했어요. 잠시 뒤 다시 눌러 주세요.";setErr(m);toast&&toast(m);track("mind_fail",{kind,code:String((e&&e.code)||"error").slice(0,20)})}finally{setBusy(false)}}
 return html`<div className="gn-cheer">
  <div className="mn-emos" role="group" aria-label="감정 아이콘 건네기">${MN_EMO.map(([e,l])=>html`<button key=${e} type="button" className=${"mn-emo"+(sent.some(x=>x.body===e)?" on":"")} aria-label=${l+" 건네기"} title=${l} disabled=${busy||demo} onClick=${()=>send("emoji",e)}>${e}</button>`)}</div>
  <div className="gn-word"><input type="text" aria-label=${name+"님에게 한마디"} maxLength=${MN_TXT_MAX} value=${txt} placeholder=${`${name}님에게 한마디`} onChange=${e=>setTxt(e.target.value)} onKeyDown=${e=>{if(e.key==="Enter"&&!e.isComposing)send("text",txt.trim())}}/><button className="btn sm" disabled=${busy||demo||!txt.trim()} onClick=${()=>send("text",txt.trim())}>건네기</button></div>
  ${err&&html`<p className="small mn-err" role="alert">${err}</p>`}
  ${sent.length>0&&html`<p className="small">건넨 마음 ${sent.map(x=>x.kind==="emoji"?x.body:"💬").join(" ")} · 한 번 보면 사라지는 쪽지예요</p>`}
 </div>`}

/* 받은 쪽 — 보낸 사람별로 한 장씩 */
function MnInbox({notes,names,onClose,openUser}){
 const groups=useMemo(()=>{const m=new Map();notes.forEach(n=>{if(!m.has(n.from_id))m.set(n.from_id,[]);m.get(n.from_id).push(n)});return [...m.entries()].map(([from,list])=>({from,list}))},[notes]);
 const pages=[{k:"cover"},...groups.map(g=>({k:"g",g})),{k:"end"}];
 const [i,setI]=useState(0);const seen=useRef(new Set());const track_=useRef(null);const reduce=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 useBackLayer(()=>close());
 useEffect(()=>{const p=pages[i];if(p&&p.k==="g"){p.g.list.forEach(n=>seen.current.add(n.id));try{!reduce&&navigator.vibrate&&navigator.vibrate([12,40,18])}catch(e){}}},[i]);
 function close(){const ids=[...seen.current];onClose(ids)}
 const go=n=>{n=clamp(n,0,pages.length-1);setI(n);const el=track_.current;if(el)el.scrollTo({left:el.clientWidth*n,behavior:reduce?"auto":"smooth"})};
 const onScroll=e=>{const el=e.currentTarget;const n=Math.round(el.scrollLeft/Math.max(1,el.clientWidth));if(n!==i)setI(n)};
 const emos=notes.filter(n=>n.kind==="emoji").map(n=>n.body);
 return html`<div className="gn gn-cards mn" role="dialog" aria-modal="true" aria-label="도착한 마음">
  <div className="gn-top"><span className="small">도착한 마음 · ${i+1}/${pages.length}</span><button className="gn-x" aria-label="닫기" onClick=${close}>×</button></div>
  <div className="gn-track" ref=${track_} onScroll=${onScroll}>
   ${pages.map((p,n)=>html`<section key=${n} className=${"gn-card mn-card"+(p.k==="cover"?" cover":p.k==="end"?" end":"")+(n===i?" on":"")+(n<i&&p.k==="g"?" gone":"")} aria-hidden=${n!==i}>
    ${n<i&&p.k==="g"&&html`<div className="mn-dust" aria-hidden="true">${MN_DUST.map((d,k)=>html`<i key=${k} style=${{"--dx":d[0]+"px","--dy":d[1]+"px",animationDelay:d[2]+"s"}}>${d[3]}</i>`)}</div>`}
    <div className="mn-inner" key=${n===i?"on":"off"}>
    ${p.k==="cover"?html`<div className="mn-env" aria-hidden="true"><i className="mn-env-back"></i><i className="mn-env-letter">💌</i><i className="mn-env-front"></i><i className="mn-env-flap"></i></div><span className="eyebrow">WHILE YOU WERE AWAY</span><h2 className="serif">${groups.length}명이\n마음을 보냈어요</h2>
      <div className="mn-rain" aria-hidden="true">${emos.slice(0,14).map((e,k)=>html`<span key=${k} style=${{animationDelay:(k*.12)+"s"}}>${e}</span>`)}${notes.some(n=>n.kind==="text")&&html`<span>💬</span>`}</div>
      <p className="small">한 장씩 넘겨 보세요 ›<br/>본 마음은 그대로 사라져요</p>`
    :p.k==="g"?html`<button type="button" className="mn-who" onClick=${()=>{close();openUser&&openUser(p.g.from)}}><${Avatar} p=${names[p.g.from]||{id:p.g.from}} size=${56}/><b>${nick(names,p.g.from)}</b></button>
      ${p.g.list[0].ctx&&html`<p className="small">'${p.g.list[0].ctx}' 소식을 보고</p>`}
      ${p.g.list.some(n=>n.kind==="emoji")&&html`<div className="mn-big">${p.g.list.filter(n=>n.kind==="emoji").map((n,k)=>html`<span key=${n.id} style=${{"--k":k}}>${n.body}</span>`)}</div>`}
      ${p.g.list.filter(n=>n.kind==="text").map(n=>html`<blockquote key=${n.id} className="mn-msg serif">"${n.body}"</blockquote>`)}
      <p className="small">${ago(p.g.list[p.g.list.length-1].created_at)}</p>`
    :html`<div className="mn-keep" aria-hidden="true"><span>♡</span></div><span className="eyebrow">다 봤어요</span><h3 className="serif">고마운 마음은\n가슴에 담고</h3><p>본 쪽지는 이제 사라져요. 답례하고 싶다면 친구의 젬을 찾아가 보세요.</p><div className="gn-acts"><button className="btn block" onClick=${close}>닫기</button></div>`}
    </div>
   </section>`)}
  </div>
  <div className="gn-nav"><button className="gn-arrow" aria-label="이전" disabled=${i===0} onClick=${()=>go(i-1)}>‹</button><div className="gn-dots">${pages.map((_,n)=>html`<i key=${n} className=${n===i?"on":""}></i>`)}</div><button className="gn-arrow" aria-label="다음" disabled=${i===pages.length-1} onClick=${()=>go(i+1)}>›</button></div>
 </div>`}
/* '나' 위쪽에 — 아직 안 본 마음이 있을 때 */
function MnBanner({n,onOpen}){if(!n)return null;return html`<button type="button" className="panel mn-banner" onClick=${onOpen}><span className="mn-b-emo" aria-hidden="true">💌</span><span className="grow"><b>도착한 마음 ${n}개</b><br/><span className="small muted">친구들이 내 젬 소식을 보고 건넨 마음이에요 · 보면 사라져요</span></span><span className="chev">›</span></button>`}
