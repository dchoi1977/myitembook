"use strict";
/* MIB CBT · 친구에게 묻기 — 나에 대한 질문을 친구에게 한 번씩, 질문지는 날마다 하나씩 열림 */

/* 받는 사람 눈으로 — 질문 속 '나'를 묻는 사람 이름으로 바꾼다 ("나를 한마디로" → "영태님을 한마디로") */
function askFor(text,who){const W=String(who||"친구")+"님";const M={"를":"을","는":"은","의":"의","에게":"에게","한테":"한테","와":"과","랑":"이랑","도":"도","만":"만","란":"이란","라는":"이라는","에 대해":"에 대해","":""};
 return String(text||"").replace(/(^|[\s"'“‘(,])나(에게|한테|에 대해|라는|를|는|의|와|랑|도|만|란)?(?=[\s.,?!"'”’)]|$)/g,(m,a,j)=>a+W+(M[j||""]??""))
  .replace(/(^|[\s"'“‘(,])내가(?=\s)/g,(m,a)=>a+W+"이").replace(/(^|[\s"'“‘(,])내(?=\s)/g,(m,a)=>a+W+"의").replace(/(^|[\s"'“‘(,])저를(?=\s)/g,(m,a)=>a+W+"을").replace(/(^|[\s"'“‘(,])제가(?=\s)/g,(m,a)=>a+W+"이").replace(new RegExp(W+"이 잘 모르는 "+W+"의 ","g"),W+" 스스로는 잘 모르는 ")}
function askSummary(stat,skip){
 const qs=(stat&&stat.questions)||[];const sk=new Set(skip||[]);
 const next=qs.find(q=>q.open&&!q.round&&!sk.has(q.id));
 const skipped=qs.filter(q=>q.open&&!q.round&&sk.has(q.id));
 const locked=qs.find(q=>!q.open);
 const sent=qs.filter(q=>q.round);
 const answers=sent.reduce((n,q)=>n+((q.round.targets||[]).filter(t=>t.answer).length),0);
 return {qs,next,locked,sent,answers,skipped};
}

function AskPanel({stat,incoming,names,onOpen,friendsCount,st,update,toast}){
 if(!stat)return null;
 const skip=(st&&st.flags&&st.flags.askSkip)||[];
 const {next,locked,sent,answers,skipped}=askSummary(stat,skip);
 const pass=q=>{if(!update)return;update(s=>{s.flags.askSkip=[...new Set([...(s.flags.askSkip||[]),q.id])]});track("ask_skip",{q:q.ord});toast&&toast("이 질문은 넘겼어요. 나중에 다시 꺼낼 수 있어요.")};
 const unskip=()=>{update&&update(s=>{s.flags.askSkip=[]});track("ask_unskip")};
 const pending=(incoming||[]).filter(a=>!a.answer);
 return html`<div className="panel stack ask-panel">
  <div className="row between"><b>친구에게 묻기</b><span className="small faint">질문지 ${sent.length} / ${stat.questions.length}</span></div>
  ${pending.length>0&&html`<button className="ask-incoming" onClick=${()=>onOpen("answer")}><span className="ask-dot" aria-hidden="true"></span><span className="grow"><b>${nick(names,pending[0].owner)}</b>님${pending.length>1?` 외 ${pending.length-1}명`:""}이 묻고 있어요<br/><span className="small">"${askFor(pending[0].text,nick(names,pending[0].owner))}"</span></span><span className="chev">답하기 ›</span></button>`}
  ${next?html`<div className="ask-q"><span className="ask-no">Q${next.ord}</span><span className="grow"><b className="serif">${next.text}</b><br/><span className="small muted">친구들에게 한 번만 물을 수 있어요 · 답은 나만 봐요</span></span></div>
   <div className="row" style=${{gap:"8px"}}><button className="btn sm grow" disabled=${!friendsCount} onClick=${()=>onOpen("ask:"+next.id)}>${friendsCount?"친구에게 묻기":"친구를 맺으면 물을 수 있어요"}</button>${update&&html`<button className="btn ghost sm" onClick=${()=>pass(next)} aria-label="이 질문 넘기고 다른 질문 보기">다른 질문</button>`}</div>`
  :locked?html`<div className="ask-q locked"><span className="ask-no">🔒</span><span className="grow"><b>다음 질문은 Day ${locked.unlock_day}에 열려요</b><br/><span className="small muted">질문지는 하루에 하나씩 늘어나요</span></span></div>`
  :html`<p className="small muted">준비된 질문을 모두 물었어요. 새 질문이 생기면 여기 나타나요.</p>`}
  ${skipped.length>0&&html`<button className="linkbtn small" style=${{color:"var(--ink-3)"}} onClick=${unskip}>넘긴 질문 ${skipped.length}개 다시 꺼내기</button>`}
  ${sent.length>0&&html`<button className="linkbtn small" onClick=${()=>onOpen("asks")}>친구들이 본 나 · 답 ${answers}개 ›</button>`}
 </div>`;
}

function AskSheet({q,fids,names,onClose,toast,onSent,myName}){
 const [pick,setPick]=useState(()=>new Set(fids));const [busy,setBusy]=useState(false);
 const toggle=id=>setPick(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n});
 async function send(){setBusy(true);try{const r=await api.askSend(q.id,[...pick]);if(r==="sent"){track("ask_send",{q:q.ord,n:pick.size});toast(`${pick.size}명에게 물었어요. 답이 오면 알려 드릴게요.`);onSent()}else toast(r==="already_asked"?"이 질문은 이미 보냈어요.":r==="locked"?"아직 열리지 않은 질문이에요.":"보내지 못했어요.")}catch(e){toast("보내지 못했어요.")}finally{setBusy(false)}}
 return html`<${Sheet} title="친구에게 묻기" onClose=${onClose}>
  <div className="ask-hero"><span className="ask-no big">Q${q.ord}</span><h2 className="serif">${q.text}</h2><p className="small muted">친구에게는 <b>"${askFor(q.text,myName||"나")}"</b>처럼 내 이름으로 바뀌어 보여요.</p>${q.hint&&html`<p className="small muted">${q.hint} · 답은 ${q.max_len}자까지</p>`}</div>
  <div className="stack" style=${{gap:"8px"}}><div className="row between"><b>누구에게 물을까요?</b><button className="linkbtn small" onClick=${()=>setPick(pick.size===fids.length?new Set():new Set(fids))}>${pick.size===fids.length?"모두 해제":"모두 선택"}</button></div>
   <div className="ask-friends">${fids.map(id=>html`<button key=${id} className="ask-friend" aria-pressed=${pick.has(id)} onClick=${()=>toggle(id)}><${Avatar} p=${names[id]||{id}} size=${40}/><span>${nick(names,id)}</span></button>`)}</div></div>
  <div className="panel tint small">이 질문은 <b>한 번만</b> 보낼 수 있어요. 받은 답은 나만 보고, 다른 사람에게는 보이지 않아요.</div>
  <button className="btn block" disabled=${!pick.size||busy} onClick=${send}>${busy?"보내는 중…":`${pick.size}명에게 묻기`}</button>
 <//>`;
}

function AnswersSheet({stat,names,onClose,openUser}){
 const sent=askSummary(stat).sent;
 useEffect(()=>{track("open_answers")},[]);
 return html`<${Sheet} title="친구들이 본 나" onClose=${onClose}>
  <p className="small muted">친구들이 나에게 들려준 말이에요. 나만 볼 수 있어요.</p>
  ${sent.length?sent.map(q=>{const ts=q.round.targets||[];const done=ts.filter(t=>t.answer);return html`<div key=${q.id} className="stack ask-block">
   <div className="row between"><b className="serif">Q${q.ord}. ${q.text}</b><span className="small faint">${done.length} / ${ts.length}</span></div>
   ${done.length?html`<div className=${"ask-answers"+(q.max_len<=20?" words":"")}>${done.map(t=>html`<button key=${t.friend} className="ask-answer" onClick=${()=>openUser(t.friend)}><span className="ask-a">${t.answer}</span><span className="ask-by"><${Avatar} p=${names[t.friend]||{id:t.friend}} size=${20}/>${nick(names,t.friend)}</span></button>`)}</div>`:html`<p className="small faint">아직 답을 기다리는 중이에요.</p>`}
   ${ts.length>done.length&&html`<span className="small faint">기다리는 중 · ${ts.filter(t=>!t.answer).map((t,i)=>html`${i?", ":""}<${UName} key=${t.friend} id=${t.friend} names=${names} className="plain"/>`)}</span>`}
  </div>`}):html`<p className="small faint">아직 보낸 질문이 없어요.</p>`}
 <//>`;
}

function AnswerSheet({incoming,names,onClose,toast,onDone,focus,st,update}){
 const passed=(st&&st.flags&&st.flags.askPass)||{};const [showPassed,setShowPassed]=useState(false);
 if(typeof useFocusJump==="function")useFocusJump(focus?"ask-"+focus:null,(incoming||[]).length);
 const nPassed=(incoming||[]).filter(a=>!a.answer&&passed[a.round]).length;
 const pass=a=>{update(s=>{s.flags.askPass={...(s.flags.askPass||{}),[a.round]:Date.now()}});track("ask_pass");toast("이 질문은 넘겼어요. 답하지 않아도 괜찮아요.")};
 const unpass=a=>update(s=>{const m={...(s.flags.askPass||{})};delete m[a.round];s.flags.askPass=m});
 const list=[...(incoming||[])].filter(a=>showPassed||a.answer||!passed[a.round]||a.round===focus).sort((a,b)=>((focus&&b.round===focus)?1:0)-((focus&&a.round===focus)?1:0)||(a.answer?1:0)-(b.answer?1:0));
 const [vals,setVals]=useState({});const [busy,setBusy]=useState(null);
 async function answer(a){const v=(vals[a.round]||"").trim();if(!v)return;setBusy(a.round);try{const r=await api.askAnswer(a.round,v);if(r==="ok"){track("ask_answer");toast(`${nick(names,a.owner)}님에게 답을 보냈어요.`);onDone()}else toast(r==="already_answered"?"이미 답한 질문이에요.":"보내지 못했어요.")}catch(e){toast("보내지 못했어요.")}finally{setBusy(null)}}
 return html`<${Sheet} title="나에게 온 질문" onClose=${onClose}>
  ${list.length?list.map(a=>html`<div key=${a.round} data-focus=${"ask-"+a.round} className="panel stack ask-in">
   <div className="row" style=${{gap:"10px"}}><${Avatar} p=${names[a.owner]||{id:a.owner}} size=${36}/><span className="grow"><${UName} id=${a.owner} names=${names}/>님이 <b>자기 자신</b>에 대해 물어요<br/><span className="small faint">${askFor(a.hint||"",nick(names,a.owner))}</span></span></div>
   <span className="ask-about">${nick(names,a.owner)}님에 대한 질문 · 내 얘기가 아니에요</span>
   <b className="serif ask-text">"${askFor(a.text,nick(names,a.owner))}"</b>
   ${a.answer?html`<div className="ask-mine"><span className="small faint">내 답</span><span>${a.answer}</span></div>`
   :html`<div className="field" style=${{margin:0}}><label htmlFor=${"ans-"+a.round} className="sr-only">답</label><textarea id=${"ans-"+a.round} rows=${a.max_len<=20?1:2} maxLength=${a.max_len} value=${vals[a.round]||""} onChange=${e=>setVals(v=>({...v,[a.round]:e.target.value}))} placeholder=${`${nick(names,a.owner)}님은 ${a.max_len<=20?"한마디로?":"어떤 사람인가요?"}`}></textarea><span className="hint">${nick(names,a.owner)}님에 대해 적어 주세요 · ${(vals[a.round]||"").length} / ${a.max_len} · 한 번 보내면 고칠 수 없어요 · ${nick(names,a.owner)}님만 봐요</span></div>
    <div className="row" style=${{gap:"8px"}}><button className="btn sm grow" disabled=${!(vals[a.round]||"").trim()||busy===a.round} onClick=${()=>answer(a)}>${busy===a.round?"보내는 중…":"답 보내기"}</button>${update&&(passed[a.round]?html`<button className="btn ghost sm" onClick=${()=>unpass(a)}>다시 답하기</button>`:html`<button className="btn ghost sm" onClick=${()=>pass(a)} aria-label="이 질문은 답하지 않고 넘기기">넘기기</button>`)}</div>`}
  </div>`):html`<p className="small faint">${nPassed?"남은 질문은 모두 넘겼어요.":"아직 받은 질문이 없어요."}</p>`}
  ${nPassed>0&&!showPassed&&html`<button className="linkbtn small" style=${{color:"var(--ink-3)"}} onClick=${()=>setShowPassed(true)}>넘긴 질문 ${nPassed}개 보기</button>`}
  <p className="small faint">넘긴 질문은 묻는 사람에게 따로 알리지 않아요.</p>
 <//>`;
}

/* operator: the question catalogue grows here */
function AdminAskQuestions({toast}){
 const [qs,setQs]=useState(null);const [f,setF]=useState({text:"",hint:"",max_len:60,unlock_day:8});
 const load=()=>api.admin.askQuestions().then(setQs).catch(()=>setQs([]));
 useEffect(()=>{load()},[]);
 async function add(){if(!f.text.trim())return;try{await api.admin.addAskQuestion({text:f.text.trim(),hint:f.hint.trim()||null,max_len:+f.max_len||60,unlock_day:+f.unlock_day||1,ord:((qs||[]).reduce((m,q)=>Math.max(m,q.ord),0))+1});setF({text:"",hint:"",max_len:60,unlock_day:+f.unlock_day+1});toast("질문을 추가했어요.");load()}catch(e){toast("추가하지 못했어요.")}}
 return html`<div className="panel stack small"><b>친구에게 묻기 · 질문지</b><span className="muted">참여자마다 가입 후 'Day N'이 되면 그 질문이 열리고, 질문마다 친구에게 한 번씩만 물을 수 있어요. 여기서 추가하면 바로 반영됩니다.</span>
  ${qs===null?html`<span className="faint">불러오는 중…</span>`:html`<div className="list">${qs.map(q=>html`<div key=${q.id} className="list-row" style=${{cursor:"default"}}><span className="grow"><b>Q${q.ord}. ${q.text}</b><br/><span className="d">Day ${q.unlock_day}부터 · ${q.max_len}자 · ${q.hint||""}</span></span><button className="btn ghost sm" onClick=${async()=>{try{await api.admin.setAskQuestion(q.id,{active:!q.active});load()}catch(e){toast("바꾸지 못했어요.")}}}>${q.active?"켜짐":"꺼짐"}</button></div>`)}</div>`}
  <div className="field" style=${{margin:0}}><label htmlFor="aq-text">새 질문</label><input type="text" id="aq-text" value=${f.text} maxLength="60" onChange=${e=>setF({...f,text:e.target.value})} placeholder="예) 나에게 어울리는 노래 한 곡은?"/></div>
  <div className="row"><input type="text" aria-label="도움말" value=${f.hint} onChange=${e=>setF({...f,hint:e.target.value})} placeholder="도움말 (선택)" className="grow"/><input type="number" aria-label="열리는 날" min="1" max="60" value=${f.unlock_day} onChange=${e=>setF({...f,unlock_day:e.target.value})} style=${{width:"80px"}}/><input type="number" aria-label="답 글자 수" min="10" max="200" value=${f.max_len} onChange=${e=>setF({...f,max_len:e.target.value})} style=${{width:"80px"}}/></div>
  <span className="hint">숫자 칸: 열리는 날(Day) · 답 글자 수</span>
  <button className="btn sm" disabled=${!f.text.trim()} onClick=${add}>질문 추가</button>
 </div>`;
}
