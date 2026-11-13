"use strict";
/* MIB CBT · 함께 자라기 · 롤모델
   ① 함께 자라기 5지표 — 연결력·소통력·협업력·신뢰도·전수력. 숫자보다 질: '몇 번'이 아니라 '몇 사람과' 오갔는지로 센다.
      숫자는 나만 본다(과시 루프 차단).
   ② 롤모델 — 최대 3명(1기 참여자·헌정 샘플·가상 인물). 무엇을 닮고 싶은지 고르면 로드맵(이미 닮은 점·가져올 3가지·걸어온 길)과
      이번 주 미션, '출발점에서 걸어온 거리'를 보여 준다. 지정 사실은 이름 없이 숫자로만 알리고, 지정을 막을 수 있다. */

const GROW_DEFS=[
 {k:"link",n:"연결력",d:"서로 친구가 된 사람과 관계 이름을 맺은 사이",steps:[1,2,4,7,12]},
 {k:"talk",n:"소통력",d:"공감·한 단어·묻고 답하기가 오간 사람 수",steps:[1,3,5,8,12]},
 {k:"co",n:"협업력",d:"함께 답을 주고받은 질문과 함께하기로 맺은 관계",steps:[1,2,4,6,10]},
 {k:"trust",n:"신뢰도",d:"나에게 한 단어·'배우고 싶어요'를 건넨 사람 수",steps:[1,2,4,6,10]},
 {k:"pass",n:"전수력",d:"다른 사람의 질문에 답한 수와 나를 롤모델로 삼은 사람",steps:[1,2,4,7,12]}];
function growValues({uid,soc,askStat,asksMe,roleFans}){soc=soc||{};const F=(soc.friendships||[]).filter(f=>f.status==="accepted");const peer=f=>f.requester===uid?f.addressee:f.requester;
 const friends=new Set(F.map(peer));const bonds=F.filter(f=>f.bond).length;
 const talk=new Set([...(soc.wordsFrom||[]).map(w=>w.to_id),...(soc.wordsTo||[]).map(w=>w.from_id),...(soc.reactFrom||[]).map(r=>r.to_id),...(soc.reactTo||[]).map(r=>r.from_id),...(asksMe||[]).filter(a=>a.answer).map(a=>a.owner)].filter(Boolean));
 const sent=((askStat&&askStat.questions)||[]).filter(q=>q.round);const answeredToMe=new Set(sent.flatMap(q=>(q.round.targets||[]).filter(t=>t.answer).map(t=>t.friend)));
 const trust=new Set([...(soc.wordsTo||[]).map(w=>w.from_id),...(soc.reactTo||[]).filter(r=>r.kind==="learn").map(r=>r.from_id)].filter(Boolean));
 const myAnswers=(asksMe||[]).filter(a=>a.answer).length;
 return {link:friends.size+bonds,talk:talk.size,co:answeredToMe.size+bonds,trust:trust.size,pass:myAnswers+(roleFans||0)*2}}
function GrowPanel({vals}){if(!vals)return null;const lv=(d,v)=>d.steps.filter(x=>v>=x).length;
 return html`<div className="panel stack grow-panel">
  <div className="row between"><b>함께 자라기</b><span className="small faint">나만 보는 숫자예요</span></div>
  <div className="grow-rows">${GROW_DEFS.map(d=>{const v=vals[d.k]||0,l=lv(d,v);const nx=d.steps[l];return html`<div key=${d.k} className="grow-row" title=${d.d}><span className="grow-n">${d.n}</span><span className="grow-pips">${[1,2,3,4,5].map(i=>html`<i key=${i} className=${i<=l?"on":""}></i>`)}</span><span className="small faint grow-v">${v}${nx?` / ${nx}`:" · 최고"}</span></div>`})}</div>
  <span className="small muted">누군가와 마음을 주고받고, 함께 답하고, 누군가에게 길이 되어 줄 때 자라요. 같은 사람과 여러 번보다 여러 사람과 오간 연결을 더 크게 세요.</span>
 </div>`}

/* ── Resonance 2.0 — 1기 둘러보기에서 함께하기 결과를 미리 한 줄로 ── */
function resonancePreview(st,card){try{if(!st||!st.analysis||!card||!card.gem||typeof tgMatch!=="function")return null;const me={shape:tgShape(livingGem(st),Math.max(1,(st.flags&&st.flags.maxStage)||1)),name:"나"};const ot={shape:tgShape(card.gem,card.stage||card.gem.polish),name:"상대"};return tgMatch(me,ot)}catch(e){return null}}

/* ── 롤모델 ── */
const ROLE_TRAITS=["꾸준함","도전 정신","말하기","글쓰기","기록","나눔","몰입","배움","실행력","따뜻함","리더십","창의성"];
function roleBase(stats,st){return {active:stats.active||0,badges:typeof earnedIds==="function"?earnedIds(st,stats).length:0,stage:Math.max(1,(st.flags&&st.flags.maxStage)||1),honors:stats.honorsN||0,crests:stats.idShown||0,at:Date.now()}}
function RolePick({target,st,stats,onClose,toast,onSaved}){/* target: {kind:"user"|"sample",id,name,card:{gem,gemName,stage,keywords,axes,badgesAll},real} */
 const cand=[...new Set([...(target.card.keywords||[]),...(target.card.axes||[]).map(a=>a.name).filter(n=>n&&n!=="아직 발견 중"),...ROLE_TRAITS])].slice(0,14);
 const [pick,setPick]=useState([]);const [busy,setBusy]=useState(false);
 const tog=t=>setPick(p=>p.includes(t)?p.filter(x=>x!==t):p.length>=3?p:[...p,t]);
 async function save(){if(!pick.length||busy)return;setBusy(true);try{
   const t={name:target.name,gem:target.card.gem,gemName:target.card.gemName,stage:target.card.stage||1,kw:(target.card.keywords||[]).slice(0,6),axes:(target.card.axes||[]).map(a=>a.name).slice(0,6),badges:(target.card.badgesAll||target.card.badges||[]).slice(0,40),real:!!target.real};
   await api.roleAdd({target_id:target.kind==="user"?target.id:null,sample_id:target.kind==="sample"?target.id:null,traits:pick,base:{me:roleBase(stats,st),t}});
   track("role_add",{kind:target.kind,n:pick.length});toast(`${target.name}님을 롤모델로 정했어요. '나' 화면에 로드맵이 생겼어요.`);onSaved&&onSaved();onClose()}
  catch(e){const m=String((e&&e.message)||"");toast(/duplicate|unique/i.test(m)?"이미 롤모델로 정한 분이에요.":/row-level|policy/i.test(m)?"롤모델은 세 명까지예요. 또는 이분은 롤모델 지정을 받지 않아요.":"정하지 못했어요.")}finally{setBusy(false)}}
 return html`<div className="aw-pop" role="dialog" aria-modal="true" aria-label="롤모델로 정하기" onClick=${e=>{if(e.target===e.currentTarget)onClose()}}><div className="aw-pop-in role-pick">
  <${GemView} g=${target.card.gem} seed=${target.card.gemName} size=${96}/>
  <span className="eyebrow">롤모델로 정하기</span><h3 className="serif">${target.name}님의 무엇을 닮고 싶나요?</h3>
  <p className="small muted">세 가지까지 고르면, 그 결을 나의 길로 '번역'한 로드맵과 미션이 생겨요. 그대로 따라 하는 게 아니라 나답게요.</p>
  <div className="role-traits">${cand.map(t=>html`<button key=${t} type="button" className=${"chip role-t"+(pick.includes(t)?" on":"")} aria-pressed=${pick.includes(t)} onClick=${()=>tog(t)}>${t}</button>`)}</div>
  ${target.real&&html`<p className="small muted">헌정 샘플은 공개 자료로 만든 상징이에요 · 본인이 참여하지 않았어요</p>`}
  <div className="row" style=${{gap:"8px",justifyContent:"center"}}><button className="btn sm" disabled=${!pick.length||busy} onClick=${save}>${busy?"정하는 중…":`롤모델로 정하기 (${pick.length}/3)`}</button><button className="btn ghost sm" onClick=${onClose}>취소</button></div>
 </div></div>`}

/* 로드맵 — 규칙으로 만든다(같은 입력이면 같은 결과). 비교는 면적이 아니라 문장으로. */
function roleRoadmap(r,st,stats){const t=(r.base&&r.base.t)||{};const meG=livingGem(st);const myStage=Math.max(1,(st.flags&&st.flags.maxStage)||1);
 let m=null;try{m=tgMatch({shape:tgShape(meG,myStage),name:"나"},{shape:tgShape(t.gem||{},t.stage||1),name:t.name||"롤모델"})}catch(e){}
 const same=m?m.rows.filter(x=>x.tag==="닮음").map(x=>x.k==="색"?`같은 ${x.a}의 색`:x.k==="강"?"오래 이어 온 힘":x.k==="결"?"지나온 전환점의 수":x.k==="각"?"관심 갈래의 넓이":`같은 ${x.k}(${x.a})`).slice(0,3):[];
 const myKw=displayKeywords(st.analysis||{});const kwSame=(t.kw||[]).filter(k=>myKw.includes(k));
 const mine=new Set(earnedIds(st,stats));const gap=(t.badges||[]).map(badgeById).filter(b=>b&&!mine.has(b.id)&&!b.secret);
 const take=[...(r.traits||[]).map(tr=>({t:`'${tr}'의 결`,how:`${josa(tr,"을")} 닮는 작은 걸음을 한 걸음 탭에서 골라 보세요`})),...gap.slice(0,3).map(b=>({t:`배지 '${b.name}'`,how:b.cond}))].slice(0,3);
 if(t.stage>myStage)take.push({t:`연마 ${t.stage}단계 · ${STAGES[t.stage]}`,how:STAGE_RULES.slice(myStage+1,t.stage+1).map((x,i)=>`${myStage+1+i}단계 ${x.need}`).slice(0,2).join(" → ")});
 const mission=gap[0]?{t:gap[0].name,how:gap[0].cond}:{t:`'${(r.traits||["꾸준함"])[0]}' 한 걸음`,how:"이번 주에 한 번, 롤모델의 그 결을 닮은 작은 걸음을 해 보세요"};
 const b=(r.base&&r.base.me)||{};const walked=[(stats.active||0)-(b.active||0)>0&&`활동 +${(stats.active||0)-(b.active||0)}일`,(mine.size-(b.badges||0))>0&&`배지 +${mine.size-(b.badges||0)}`,(myStage-(b.stage||1))>0&&`연마 +${myStage-(b.stage||1)}단계`,((stats.honorsN||0)-(b.honors||0))>0&&`명예 +${(stats.honorsN||0)-(b.honors||0)}`].filter(Boolean);
 return {same:[...kwSame.map(k=>`둘 다 '${k}'`),...same].slice(0,3),take:take.slice(0,3),path:t.stage?`연마 ${t.stage}단계 · ${STAGES[t.stage]}${(t.badges||[]).length?` · 배지 ${(t.badges||[]).length}개`:""}`:"",mission,walked,match:m}}
function RolePanel({st,stats,update,toast,openUser,roles,fans,reload}){
 const [open,setOpen]=useState(null);
 if(!roles)return null;const noRole=!!(st.flags&&st.flags.noRole);
 async function drop(r){try{await api.roleDel(r.id);track("role_drop");reload()}catch(e){toast("지우지 못했어요.")}}
 return html`<div className="panel stack role-panel">
  <div className="row between"><b>나의 롤모델 ${roles.length}/3</b>${fans>0&&html`<span className="chip gold">✦ ${fans}명이 나를 롤모델로 삼았어요</span>`}</div>
  ${roles.length?roles.map(r=>{const t=(r.base&&r.base.t)||{};const R=roleRoadmap(r,st,stats);const op=open===r.id;return html`<div key=${r.id} className="role-item">
   <button type="button" className="role-head" onClick=${()=>setOpen(op?null:r.id)} aria-expanded=${op}><${GemView} g=${t.gem||{}} seed=${t.gemName||""} size=${48}/><span className="grow"><b>${t.name||"롤모델"}</b>${r.sample_id?html` <span className="small faint">${t.real?"헌정 샘플":"가상 인물"}</span>`:""}<br/><span className="small muted">닮고 싶은 결 · ${(r.traits||[]).join(", ")}</span></span><span className="chev">${op?"접기":"로드맵 ›"}</span></button>
   ${op&&html`<div className="role-map">
    <div><span className="eyebrow">출발점에서 걸어온 거리</span><p className="small">${R.walked.length?R.walked.join(" · "):"오늘이 출발점이에요. 한 걸음부터 시작해요."}</p></div>
    ${R.same.length>0&&html`<div><span className="eyebrow">이미 닮은 점</span><p className="small">${R.same.join(" · ")}</p></div>`}
    <div><span className="eyebrow">가져올 것</span>${R.take.map(x=>html`<p key=${x.t} className="small"><b>${x.t}</b><br/><span className="muted">${x.how}</span></p>`)}</div>
    ${R.path&&html`<div><span className="eyebrow">${t.name}님이 걸어온 길</span><p className="small">${R.path}</p></div>`}
    <div className="role-mission"><span className="eyebrow">이번 주 롤모델 미션</span><p className="small"><b>${R.mission.t}</b><br/><span className="muted">${R.mission.how}</span></p></div>
    <div className="row" style=${{gap:"12px"}}>${r.target_id&&openUser&&html`<button className="linkbtn small" onClick=${()=>openUser(r.target_id)}>${t.name}님 카드 보기</button>`}<button className="linkbtn small" style=${{color:"var(--ink-3)"}} onClick=${()=>drop(r)}>롤모델에서 내리기</button></div>
    <p className="note">남과 견주지 않고, 롤모델을 정한 날의 나와 견줘요.</p>
   </div>`}
  </div>`}):html`<p className="small muted" style=${{margin:0}}>친구 카드나 샘플 아틀리에에서 '롤모델로 정하기'를 누르면, 그 사람을 향한 나만의 로드맵이 생겨요.</p>`}
  <label className="checkline" style=${{marginTop:"4px"}}><input type="checkbox" checked=${noRole} onChange=${e=>update(s=>{s.flags.noRole=e.target.checked})}/><span className="small">다른 사람이 나를 롤모델로 정하지 못하게 하기</span></label>
 </div>`}
