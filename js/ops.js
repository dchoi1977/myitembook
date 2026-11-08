"use strict";
/* MIB CBT · entry gate, 7-day missions, surveys, feedback, card images, operator console */

/* ───────── gate: invite code sign-up & login ───────── */
const JOIN_ERR={invalid_code:"초대 코드를 다시 확인해 주세요.",code_used:"이미 사용된 초대 코드입니다. 운영자에게 새 코드를 요청해 주세요.",full:"이번 CBT는 정원이 모두 찼습니다. 관심 가져 주셔서 고맙습니다.",nickname_taken:"이미 쓰고 있는 닉네임입니다. 다른 닉네임을 골라 주세요.",invalid_nickname:"닉네임은 한글·영문·숫자 2~12자로 정해 주세요.",email_taken:"이미 가입한 이메일입니다. '로그인'으로 들어와 주세요.",invalid_email:"이메일 형식을 확인해 주세요.",weak_password:"비밀번호는 8자 이상으로 정해 주세요.",consent_required:"필수 동의 항목을 확인해 주세요.",network:"인터넷 연결을 확인해 주세요."};
function Gate({onSession,initialCode}){
 const [mode,setMode]=useState(initialCode?"join":"start");const [f,setF]=useState({code:initialCode||"",nickname:"",email:"",password:"",terms:false,privacy:false,ai:false,research:false});
 const [busy,setBusy]=useState(false);const [err,setErr]=useState("");
 const set=(k,v)=>setF(x=>({...x,[k]:v}));
 async function join(e){e.preventDefault();setErr("");setBusy(true);try{await api.join({code:f.code,nickname:f.nickname,email:f.email,password:f.password,agree:{terms:f.terms,privacy:f.privacy,ai:f.ai,research:f.research}});const s=await api.login(f.email,f.password);onSession(s,true)}catch(x){setErr(JOIN_ERR[x.code]||"가입을 마치지 못했습니다. 잠시 후 다시 시도해 주세요.")}finally{setBusy(false)}}
 async function login(e){e.preventDefault();setErr("");setBusy(true);try{const s=await api.login(f.email,f.password);onSession(s,false)}catch(x){setErr(x.code==="network"?JOIN_ERR.network:"이메일 또는 비밀번호가 맞지 않습니다.")}finally{setBusy(false)}}
 const g={stone:"오팔",lightName:"새벽빛",light:"번짐",form:"결정",texture:"유백",hardness:3,grain:3,facets:9,symbol:"카메라"};
 const canJoin=f.code.trim()&&f.nickname.trim().length>=2&&f.email.includes("@")&&f.password.length>=8&&f.terms&&f.privacy&&f.ai;
 return html`<div className="welcome wrap">
  <div className="eyebrow">MyItemBook · ${MIB_CONFIG.cohort}</div>
  <h1 className="h1">나다운 결을<br/>발견하다.</h1>
  <${GemView} g=${g} seed="gate" size=${mode==="start"?200:120} className="float"/>
  ${mode==="start"&&html`<div className="stack">
   <p className="lead">초대받은 30명이 일주일 동안 먼저 써 보는 비공개 테스트입니다. 기록을 건네면 AI가 당신의 결을 읽어 세상에 하나뿐인 젬과 카드로 보여 주고, 1기 친구들과 서로의 성장을 응원할 수 있어요.</p>
   <div className="promises">
    <div className="promise"><b>7일, 한 장의 변화</b><span>하루 한 걸음과 한 줄이 젬을 깎습니다</span></div>
    <div className="promise"><b>기본값은 나만 보기</b><span>공개는 항목별로, 내가 고릅니다</span></div>
    <div className="promise"><b>순위 없는 응원</b><span>공감 숫자는 주인에게만 보입니다</span></div>
    <div className="promise"><b>떠날 자유</b><span>언제든 내보내고 계정째 지웁니다</span></div>
   </div>
   <button className="btn block" onClick=${()=>setMode("join")}>초대 코드로 시작하기</button>
   <button className="btn ghost block" onClick=${()=>setMode("login")}>이미 가입했어요 · 로그인</button>
  </div>`}
  ${mode==="join"&&html`<form className="stack" onSubmit=${join}>
   <h2 className="h2">CBT 참여 등록</h2>
   <div className="field"><label htmlFor="g-code">초대 코드</label><input type="text" id="g-code" value=${f.code} onChange=${e=>set("code",e.target.value.toUpperCase())} placeholder="MIB-XXXXX" autoComplete="off" autoCapitalize="characters"/></div>
   <div className="field"><label htmlFor="g-nick">닉네임</label><input type="text" id="g-nick" value=${f.nickname} maxLength="12" onChange=${e=>set("nickname",e.target.value)} placeholder="1기 친구들에게 보일 이름 (2~12자)"/><span className="hint">실명이 아니어도 됩니다. 친구 찾기와 카드에 이 이름이 보여요.</span></div>
   <div className="field"><label htmlFor="g-email">이메일</label><input type="email" id="g-email" value=${f.email} onChange=${e=>set("email",e.target.value)} autoComplete="email" placeholder="로그인에만 씁니다"/></div>
   <div className="field"><label htmlFor="g-pw">비밀번호</label><input type="password" id="g-pw" value=${f.password} onChange=${e=>set("password",e.target.value)} autoComplete="new-password" placeholder="8자 이상"/></div>
   <div className="consents">
    <label className="checkline"><input type="checkbox" checked=${f.terms&&f.privacy&&f.ai&&f.research} onChange=${e=>setF(x=>({...x,terms:e.target.checked,privacy:e.target.checked,ai:e.target.checked,research:e.target.checked}))}/><span><b>모두 동의</b></span></label>
    <label className="checkline"><input type="checkbox" checked=${f.terms} onChange=${e=>set("terms",e.target.checked)}/><span><b>(필수) CBT 참여 안내</b><br/><span className="small muted">테스트 기간 중 기능이 바뀌거나 멈출 수 있고, 종료 후 데이터는 안내에 따라 지워집니다.</span></span></label>
    <label className="checkline"><input type="checkbox" checked=${f.privacy} onChange=${e=>set("privacy",e.target.checked)}/><span><b>(필수) 개인정보 수집·이용</b><br/><span className="small muted">이메일·닉네임, 내가 건넨 기록과 그 해석, 앱 사용 기록을 테스트 운영에만 씁니다. 언제든 계정째 지울 수 있어요.</span></span></label>
    <label className="checkline"><input type="checkbox" checked=${f.ai} onChange=${e=>set("ai",e.target.checked)}/><span><b>(필수) AI 처리</b><br/><span className="small muted">해석을 위해 내가 건넨 글과 사진이 Anthropic의 Claude API로 전송됩니다. 사진은 해석에만 쓰고 저장하지 않습니다.</span></span></label>
    <label className="checkline"><input type="checkbox" checked=${f.research} onChange=${e=>set("research",e.target.checked)}/><span><b>(선택) 서비스 개선 연구</b><br/><span className="small muted">설문 응답과 사용 통계를 이름 없이 정식 서비스 설계에 활용합니다.</span></span></label>
   </div>
   ${err&&html`<p className="err" role="alert">${err}</p>`}
   <button className="btn block" disabled=${!canJoin||busy}>${busy?"등록하는 중…":"등록하고 시작하기"}</button>
   <button type="button" className="linkbtn" onClick=${()=>{setErr("");setMode("login")}}>이미 가입했어요 · 로그인</button>
  </form>`}
  ${mode==="login"&&html`<form className="stack" onSubmit=${login}>
   <h2 className="h2">로그인</h2>
   <div className="field"><label htmlFor="l-email">이메일</label><input type="email" id="l-email" value=${f.email} onChange=${e=>set("email",e.target.value)} autoComplete="email"/></div>
   <div className="field"><label htmlFor="l-pw">비밀번호</label><input type="password" id="l-pw" value=${f.password} onChange=${e=>set("password",e.target.value)} autoComplete="current-password"/></div>
   ${err&&html`<p className="err" role="alert">${err}</p>`}
   <button className="btn block" disabled=${!f.email||!f.password||busy}>${busy?"들어가는 중…":"로그인"}</button>
   <p className="note">비밀번호를 잊었다면 CBT 운영자에게 닉네임을 알려 주세요. 임시 비밀번호를 드립니다.</p>
   <button type="button" className="linkbtn" onClick=${()=>{setErr("");setMode("join")}}>초대 코드로 처음 등록하기</button>
  </form>`}
 </div>`;
}

/* ───────── 7-day missions ───────── */
const MISSIONS=[
 {d:1,t:"첫 발견",desc:"해석을 확인하거나 내 말로 다듬기",test:s=>s.confirmed,go:"home"},
 {d:2,t:"나의 선반",desc:"나와 함께한 아이템 하나 담기",test:s=>s.items>=1,go:"shelf"},
 {d:3,t:"첫 친구",desc:"1기 참여자 한 명과 친구 맺기",test:s=>s.connections>=1,go:"tab:friends"},
 {d:4,t:"중간 다시 읽기",desc:"알아가기 답과 한 줄을 더해 나를 다시 읽기",test:s=>s.analyses>=2,go:"reread"},
 {d:5,t:"결을 건네기",desc:"친구 카드에 공감이나 한 단어 남기기",test:s=>s.reactionsGiven>=1||s.wordsGiven>=1,go:"tab:friends"},
 {d:6,t:"문을 열다",desc:"공개할 모습을 골라 카드 공개하기",test:s=>s.isPublic,go:"publish"},
 {d:7,t:"일주일의 변화",desc:"7일 비교 카드를 보고 마무리 설문 남기기",test:s=>s.exitDone,go:"week"}
];
function Missions({day,stats,onOpen}){
 const done=MISSIONS.filter(m=>m.test(stats)).length;const [open,setOpen]=useState(false);
 const next=MISSIONS.find(m=>m.d<=day&&!m.test(stats));
 const row=m=>{const ok=m.test(stats);const locked=m.d>day;return html`<button key=${m.d} className=${"list-row mission"+(locked?" locked":"")} disabled=${locked} onClick=${()=>onOpen(m.go)}>
   <span className=${"mdot"+(ok?" ok":"")}>${ok?"✓":m.d}</span>
   <span className="grow"><span className="t">${m.t}</span><br/><span className="d">${locked?`Day ${m.d}에 열려요`:m.desc}</span></span>${!locked&&!ok?html`<span className="chev">›</span>`:null}</button>`};
 return html`<div className="panel stack missions">
  <button className="row between plainbtn" onClick=${()=>setOpen(o=>!o)} aria-expanded=${open}><span className="row" style=${{gap:"8px"}}><b className="serif" style=${{color:"var(--accent)",fontSize:"17px"}}>7일 미션</b><span className="chip gold">Day ${Math.min(day,7)} / 7</span></span><span className="small faint">${done}/7 ${open?"접기":"펼치기"}</span></button>
  <div className="progress">${MISSIONS.map(m=>html`<i key=${m.d} className=${m.test(stats)?"on":""}></i>`)}</div>
  ${!open&&(next?html`<div className="list">${row(next)}</div>`:html`<p className="small muted">${done===7?"일곱 개의 미션을 모두 마쳤어요.":"오늘 열린 미션을 모두 마쳤어요. 내일 새 미션이 열립니다."}</p>`)}
  ${open&&html`<div className="list">${MISSIONS.map(row)}</div>
  <p className="note">매일 함께: 오늘의 한 걸음, 오늘의 한 줄. 미션은 순서대로 열리지만, 못 해도 아무것도 잃지 않아요.</p>`}
 </div>`;
}

/* ───────── daily one question & exit survey ───────── */
const DAILY_Q=[
 {d:1,q:"처음 받은 해석이 나와 얼마나 닮았나요?",type:"scale",lo:"전혀 아님",hi:"정말 나 같음"},
 {d:2,q:"오늘 MIB를 연 이유는 무엇이었나요?",type:"choice",opts:["한 걸음","오늘의 한 줄","친구 소식","알림을 보고","그냥 궁금해서"]},
 {d:3,q:"젬(GEM)이 나를 표현한다고 느끼나요?",type:"scale",lo:"아니요",hi:"네, 꼭 그래요"},
 {d:4,q:"다시 읽은 해석은 첫 해석보다 어땠나요?",type:"choice",opts:["더 나 같아요","비슷해요","덜 나 같아요","아직 안 해 봤어요"]},
 {d:5,q:"친구의 카드를 볼 때 어떤 기분이었나요?",type:"choice",opts:["궁금하고 반가움","배우고 싶음","비교되는 느낌","별 느낌 없음"]},
 {d:6,q:"공개 카드에서 가장 보여 주고 싶은 것은?",type:"choice",opts:["한 문장","젬","대표 아이템","배지","육각형"]},
 {d:7,q:"이번 주 MIB가 일상에 작은 변화를 주었나요?",type:"scale",lo:"없었어요",hi:"분명히 있었어요"}
];
function DailyQuestion({day,answered,onDone,toast}){
 const Q=DAILY_Q[Math.min(day,7)-1];const [v,setV]=useState(null);const [txt,setTxt]=useState("");const [busy,setBusy]=useState(false);
 if(!Q||answered)return null;
 async function send(){setBusy(true);try{await api.feedback({kind:"daily",screen:"home",rating:Q.type==="scale"?v:null,body:txt.trim(),payload:{day:Q.d,q:Q.q,choice:Q.type==="choice"?v:null}});track("daily_answer",{day:Q.d});toast("고맙습니다. 오늘의 질문에 답했어요.");onDone()}catch(e){toast("답을 보내지 못했습니다.")}finally{setBusy(false)}}
 return html`<div className="panel stack dq">
  <div className="row between"><span className="eyebrow">오늘의 질문 · Day ${Q.d}</span><span className="small faint">10초</span></div>
  <b>${Q.q}</b>
  ${Q.type==="scale"?html`<div className="scale" role="group" aria-label=${Q.q}>${[1,2,3,4,5].map(n=>html`<button key=${n} aria-pressed=${v===n} onClick=${()=>setV(n)}>${n}</button>`)}</div><div className="row between small faint"><span>${Q.lo}</span><span>${Q.hi}</span></div>`:html`<div className="segs" role="group" aria-label=${Q.q}>${Q.opts.map(o=>html`<button key=${o} aria-pressed=${v===o} onClick=${()=>setV(o)}>${o}</button>`)}</div>`}
  ${v!=null&&html`<input type="text" aria-label="한 줄 더 (선택)" placeholder="한 줄 더 (선택)" maxLength="200" value=${txt} onChange=${e=>setTxt(e.target.value)}/>`}
  <button className="btn quiet sm" disabled=${v==null||busy} onClick=${send}>보내기</button>
 </div>`;
}
function ExitSurvey({onClose,onDone,toast,stats}){
 const [f,setF]=useState({nps:null,best:"",worst:"",intent:null,wish:""});const [busy,setBusy]=useState(false);const set=(k,v)=>setF(x=>({...x,[k]:v}));
 async function send(){setBusy(true);try{await api.feedback({kind:"exit",screen:"exit",rating:f.nps,body:f.wish.trim(),payload:{best:f.best.trim(),worst:f.worst.trim(),intent:f.intent,active:stats.active,friends:stats.connections}});track("exit_survey",{nps:f.nps});toast("마무리 설문을 보냈어요. 일주일 동안 함께해 주셔서 고맙습니다.");onDone()}catch(e){toast("설문을 보내지 못했습니다.")}finally{setBusy(false)}}
 return html`<${Sheet} title="마무리 설문" onClose=${onClose}>
  <p className="muted">일주일 동안 고맙습니다. 2분이면 됩니다. 솔직한 의견이 정식 MIB를 만듭니다.</p>
  <div className="field"><span className="lbl">MIB를 친구나 동료에게 추천할 가능성은? (0~10)</span><div className="scale wide" role="group" aria-label="추천 가능성">${[...Array(11)].map((_,n)=>html`<button key=${n} aria-pressed=${f.nps===n} onClick=${()=>set("nps",n)}>${n}</button>`)}</div></div>
  <div className="field"><label htmlFor="x-best">가장 좋았던 순간</label><textarea id="x-best" value=${f.best} maxLength="500" onChange=${e=>set("best",e.target.value)} style=${{minHeight:"80px"}}></textarea></div>
  <div className="field"><label htmlFor="x-worst">가장 불편하거나 아쉬웠던 점</label><textarea id="x-worst" value=${f.worst} maxLength="500" onChange=${e=>set("worst",e.target.value)} style=${{minHeight:"80px"}}></textarea></div>
  <div className="field"><span className="lbl">정식 서비스가 나오면?</span><div className="segs" role="group" aria-label="이용 의향">${["바로 쓸래요","조금 지켜볼래요","안 쓸 것 같아요"].map(o=>html`<button key=${o} aria-pressed=${f.intent===o} onClick=${()=>set("intent",o)}>${o}</button>`)}</div></div>
  <div className="field"><label htmlFor="x-wish">꼭 있었으면 하는 기능 (선택)</label><input type="text" id="x-wish" value=${f.wish} maxLength="300" onChange=${e=>set("wish",e.target.value)}/></div>
  <button className="btn block" disabled=${f.nps==null||!f.intent||busy} onClick=${send}>${busy?"보내는 중…":"설문 보내기"}</button>
 <//>`;
}

/* ───────── feedback on any screen ───────── */
const FB_KIND=["좋았어요","헷갈려요","불편해요","오류","제안"];
function FeedbackSheet({screen,onClose,toast}){
 const [k,setK]=useState(null);const [txt,setTxt]=useState("");const [busy,setBusy]=useState(false);
 async function send(){setBusy(true);try{await api.feedback({kind:"screen",screen:String(screen).slice(0,60),body:txt.trim(),payload:{type:k,ua:navigator.userAgent.slice(0,160),w:window.innerWidth}});track("feedback",{type:k,screen});toast("의견을 보냈어요. 고맙습니다!");onClose()}catch(e){toast("의견을 보내지 못했습니다.")}finally{setBusy(false)}}
 return html`<${Sheet} title="의견 보내기" onClose=${onClose}>
  <p className="small muted">지금 보고 있는 화면(<b>${screenLabel(screen)}</b>)과 함께 운영자에게 전달됩니다.</p>
  <div className="segs" role="group" aria-label="의견 종류">${FB_KIND.map(x=>html`<button key=${x} aria-pressed=${k===x} onClick=${()=>setK(x)}>${x}</button>`)}</div>
  <div className="field"><label htmlFor="fb">자세히 (선택)</label><textarea id="fb" value=${txt} maxLength="2000" onChange=${e=>setTxt(e.target.value)} placeholder=${k==="오류"?"무엇을 하다가 어떤 일이 생겼나요?":"자유롭게 적어 주세요"}></textarea></div>
  <button className="btn block" disabled=${!k||busy} onClick=${send}>${busy?"보내는 중…":"보내기"}</button>
 <//>`;
}
const SCREEN_LABEL={welcome:"시작",connect:"기록 건네기",questions:"질문 3개",reading:"읽는 중",reveal:"첫 발견",me:"나",step:"한 걸음",feed:"소식",friends:"친구",evidence:"이렇게 읽은 이유",attrs:"젬 속성",shelf:"선반",publish:"공개할 모습",data:"내 데이터",inbox:"알림",mine:"받은 공감",week:"7일 비교",cardimg:"카드 이미지",user:"친구 카드",item:"아이템",exit:"마무리 설문"};
function screenLabel(s){const k=String(s||"").split(":")[0];return SCREEN_LABEL[k]||s}

/* ───────── shareable images: life card & 7-day compare ───────── */
async function svgImage(svg,w,h){const s=svg.replace("<svg ",`<svg width="${w}" height="${h}" `);const img=new Image();await new Promise((res,rej)=>{img.onload=res;img.onerror=rej;img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(s)});return img}
function wrapLines(ctx,text,maxW,maxLines){const out=[];let line="";for(const ch of String(text||"")){const t=line+ch;if(ctx.measureText(t).width>maxW&&line){out.push(line);line=ch.trimStart()}else line=t}if(line)out.push(line);if(out.length>maxLines){const k=out.slice(0,maxLines);k[maxLines-1]=k[maxLines-1].slice(0,-1)+"…";return k}return out}
async function renderShareImage(kind,{st,stats,profile}){
 const W=1080,H=1350;const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");
 try{await Promise.all([document.fonts.load('700 48px "Noto Serif KR"'),document.fonts.load('500 30px "Noto Sans KR"'),document.fonts.load('700 30px "Noto Sans KR"')])}catch(e){}
 const SERIF='"Noto Serif KR","Apple SD Gothic Neo",serif',SANS='"Noto Sans KR","Apple SD Gothic Neo",sans-serif';
 x.fillStyle="#F4F1E9";x.fillRect(0,0,W,H);x.strokeStyle="#D6DACF";x.lineWidth=2;x.strokeRect(40,40,W-80,H-80);
 x.fillStyle="#66706E";x.font=`700 26px ${SANS}`;x.textAlign="left";x.fillText("MYITEMBOOK · "+MIB_CONFIG.cohort,90,120);
 x.textAlign="right";x.fillText("@"+profile.nickname,W-90,120);x.textAlign="center";
 const a=st.analysis;const now=livingGem(st);
 if(kind==="week"){
  const f=st.first||{gem:a.gem,sentence:displaySentence(a),keywords:displayKeywords(a),at:a.at};
  x.fillStyle="#173D3B";x.font=`700 54px ${SERIF}`;x.fillText("일주일 전과 지금",W/2,215);
  const g1=await svgImage(gemSVG({...f.gem},st.createdAt,"s1"),360,387),g2=await svgImage(gemSVG(now,st.createdAt,"s2"),360,387);
  x.drawImage(g1,110,270);x.drawImage(g2,W-470,270);
  x.font=`700 30px ${SANS}`;x.fillStyle="#66706E";x.fillText("Day 1",290,700);x.fillText("Day "+Math.min(stats.day||7,99),W-290,700);
  x.font=`700 34px ${SERIF}`;x.fillStyle="#173D3B";x.fillText(gemName(f.gem),290,750);x.fillText(gemName(now),W-290,750);
  x.fillStyle="#A87B2A";x.font=`700 60px ${SANS}`;x.fillText("→",W/2,470);
  const rows=[["걸어온 날",stats.days],["남긴 한 줄",stats.logs],["다시 읽기",Math.max(0,stats.analyses-1)],["친구",stats.connections],["받은 공감",stats.reactionsReceived+stats.wordsReceived]];
  const bw=(W-180)/rows.length;rows.forEach(([k,v],i)=>{const cx=90+bw*i+bw/2;x.fillStyle="#FBFAF5";x.fillRect(90+bw*i+8,820,bw-16,150);x.fillStyle="#173D3B";x.font=`700 56px ${SERIF}`;x.fillText(String(v),cx,905);x.fillStyle="#66706E";x.font=`500 24px ${SANS}`;x.fillText(k,cx,945)});
  const diff=[];if(now.hardness>(f.gem.hardness||1))diff.push(`강(剛) ${f.gem.hardness}→${now.hardness}`);if(now.grain>(f.gem.grain||0))diff.push(`금빛 결 +${now.grain-(f.gem.grain||0)}`);if(now.facets>(f.gem.facets||8))diff.push(`각(角) ${f.gem.facets}→${now.facets}면`);if(now.stone!==f.gem.stone)diff.push(`색 ${f.gem.stone}→${now.stone}`);
  x.fillStyle="#1F2A28";x.font=`500 32px ${SANS}`;x.fillText(diff.length?"젬이 달라진 곳 · "+diff.join(" · "):"젬의 모양은 그대로, 걸어온 시간은 쌓였습니다",W/2,1050);
  x.fillStyle="#173D3B";x.font=`700 38px ${SERIF}`;wrapLines(x,displaySentence(a),W-240,2).forEach((l,i)=>x.fillText(l,W/2,1135+i*54));
 }else{
  const g=await svgImage(gemSVG(now,st.createdAt,"s0"),520,559);x.drawImage(g,(W-520)/2,170);
  x.fillStyle="#173D3B";x.font=`700 60px ${SERIF}`;x.fillText(gemName(now),W/2,800);
  x.fillStyle="#1F2A28";x.font=`500 40px ${SERIF}`;wrapLines(x,displaySentence(a),W-220,3).forEach((l,i)=>x.fillText(l,W/2,880+i*60));
  const kw=displayKeywords(a);x.font=`700 30px ${SANS}`;let tot=kw.reduce((s,k)=>s+x.measureText(k).width+60,0)-16;let cx=(W-tot)/2;kw.forEach(k=>{const w=x.measureText(k).width+44;x.fillStyle="#E4E9DF";x.beginPath();x.roundRect?x.roundRect(cx,1080,w,56,28):x.rect(cx,1080,w,56);x.fill();x.fillStyle="#173D3B";x.textAlign="center";x.fillText(k,cx+w/2,1118);cx+=w+16});
  x.fillStyle="#66706E";x.font=`500 26px ${SANS}`;x.fillText(`연마 ${stageOf(st,stats)}단계 · ${STAGES[stageOf(st,stats)]} · 걸어온 날 ${stats.active}`,W/2,1210);
 }
 x.fillStyle="#93A09B";x.font=`500 22px ${SANS}`;x.fillText("누구나 원석으로 태어난다. 살아가는 만큼, 보석이 된다.",W/2,H-80);
 return c;
}
function ShareImageSheet({kind,st,stats,profile,onClose,toast,onExit,exitDone}){
 const [url,setUrl]=useState(null);const cv=useRef(null);
 useEffect(()=>{let alive=true;renderShareImage(kind,{st,stats,profile}).then(c=>{if(!alive)return;cv.current=c;setUrl(c.toDataURL("image/png"))}).catch(()=>toast("이미지를 만들지 못했습니다."));track(kind==="week"?"open_week":"open_cardimg");return()=>{alive=false}},[]);
 async function save(){const c=cv.current;if(!c)return;const blob=await new Promise(r=>c.toBlob(r,"image/png"));const name=`mib-${kind==="week"?"7days":"card"}-${dayKey()}.png`;const file=new File([blob],name,{type:"image/png"});
  if(navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({files:[file],title:"MyItemBook"});track("share_image",{kind,via:"native"});return}catch(e){if(e&&e.name==="AbortError")return}}
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800);track("share_image",{kind,via:"download"});toast("이미지를 저장했어요.")}
 return html`<${Sheet} title=${kind==="week"?"7일 비교 카드":"카드 이미지"} onClose=${onClose}>
  ${url?html`<img src=${url} alt=${kind==="week"?"일주일 전과 지금의 젬 비교 이미지":"내 젬 카드 이미지"} className="shareimg"/>`:html`<p className="small faint">이미지를 만드는 중…</p>`}
  <button className="btn block" disabled=${!url} onClick=${save}><${Ico} n="share"/>저장하거나 공유하기</button>
  <p className="note">이미지에는 젬, 한 문장, 키워드와 닉네임만 담깁니다. 원문 기록과 근거는 들어가지 않아요.</p>
  ${kind==="week"&&!exitDone&&html`<div className="panel tint stack"><b>마지막 미션 · 마무리 설문</b><span className="small muted">일주일을 돌아본 지금, 솔직한 의견을 들려주세요.</span><button className="btn sm" onClick=${onExit}>마무리 설문 열기</button></div>`}
 <//>`;
}

/* ───────── operator console ───────── */
function csv(rows){if(!rows.length)return "";const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];const esc=v=>{if(v==null)return "";const s=typeof v==="object"?JSON.stringify(v):String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s};return "﻿"+keys.join(",")+"\n"+rows.map(r=>keys.map(k=>esc(r[k])).join(",")).join("\n")}
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:type||"text/csv"}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},800)}
function AdminScreen({onExit,toast,uid,onPreviewEvo,onPreviewAway,onPreviewBadges}){
 const [tab,setTab]=useState("kpi");const [ov,setOv]=useState(null);const [fb,setFb]=useState(null);const [reps,setReps]=useState(null);const [anns,setAnns]=useState([]);const [aiOk,setAiOk]=useState(null);const [ytOk,setYtOk]=useState(null);
 const [busy,setBusy]=useState(false);const [avs,setAvs]=useState({});
 async function load(){try{const [o,a,av]=await Promise.all([api.admin.overview(),api.announcements(),api.admin.avatars().catch(()=>[])]);setOv(o);setAnns(a||[]);const m={};(av||[]).forEach(x=>m[x.id]=x.avatar);setAvs(m)}catch(e){toast("운영 데이터를 불러오지 못했습니다.")}api.admin.ping().then(r=>{setAiOk(!!r.ai);setYtOk(!!r.yt)}).catch(()=>setAiOk(null))}
 useEffect(()=>{load()},[]);
 useEffect(()=>{if(tab==="fb"&&!fb)api.admin.feedback().then(setFb).catch(()=>setFb([]));if(tab==="rep"&&!reps)api.admin.reports().then(setReps).catch(()=>setReps([]))},[tab]);
 if(!ov)return html`<div className="main wrap"><p className="faint">운영 데이터를 불러오는 중…</p><button className="btn ghost" onClick=${onExit}>앱으로 돌아가기</button></div>`;
 const people=ov.people||[];const testers=people.filter(p=>p.role==="tester");const byId={};people.forEach(p=>byId[p.id]=p);
 const n=testers.length||1;const today=kstDay();const daily=ov.daily||[];const todayRow=daily.find(d=>d.day===today);
 const pct=v=>Math.round(v*100)+"%";
 const disc=testers.filter(p=>p.analyses>0);const agree=disc.filter(p=>p.status==="yes"||p.status==="edited");
 const kpis=[["참여자",`${testers.length} / ${(ov.settings||{}).tester_cap||30}`],["오늘 활성",todayRow?todayRow.users:0],["첫 발견 완료",pct(disc.length/n)],["해석 수용률",disc.length?pct(agree.length/disc.length):"—"],["평균 활동일",(testers.reduce((s,p)=>s+p.active_days,0)/n).toFixed(1)],["3일+ 활동",pct(testers.filter(p=>p.active_days>=3).length/n)],["5일+ 활동",pct(testers.filter(p=>p.active_days>=5).length/n)],["카드 공개",pct(testers.filter(p=>p.public).length/n)],["친구 연결",Math.round(people.reduce((s,p)=>s+p.friends,0)/2)],["공감·응원",people.reduce((s,p)=>s+p.reactions_given,0)],["마무리 설문",testers.filter(p=>p.exit_done).length],["AI 호출",people.reduce((s,p)=>s+Number(p.ai_calls||0),0)]];
 const maxU=Math.max(1,...daily.map(d=>d.users));
 async function act(fn,msg){setBusy(true);try{await fn();toast(msg);await load()}catch(e){toast("처리하지 못했습니다: "+(e.message||e.code||""))}finally{setBusy(false)}}
 const TABS=[["kpi","현황"],["people","참여자"],["fb","의견·설문"],["inv","초대 코드"],["ann","공지"],["rep","신고"],["set","설정"]];
 return html`<div className="main wrap admin">
  <div className="row between"><div><div className="eyebrow">운영 콘솔</div><h1 className="h2">${MIB_CONFIG.cohort} 운영</h1></div><button className="btn ghost sm" onClick=${onExit}>앱으로</button></div>
  <div className="segs scrollx" role="tablist">${TABS.map(([k,t])=>html`<button key=${k} role="tab" aria-pressed=${tab===k} aria-selected=${tab===k} onClick=${()=>setTab(k)}>${t}</button>`)}</div>
  ${tab==="kpi"&&html`<div className="stack-lg">
   ${aiOk===false&&html`<div className="panel" style=${{borderColor:"var(--danger)"}}><b className="err">AI 키가 아직 등록되지 않았습니다.</b><p className="small muted">Supabase › Edge Functions › Secrets에 ANTHROPIC_API_KEY를 추가하면 바로 켜집니다. 재배포는 필요 없습니다.</p></div>`}
   <div className="kpis">${kpis.map(([k,v])=>html`<div key=${k}><b>${v}</b><span>${k}</span></div>`)}</div>
   <div className="stack"><h2 className="h3">일별 활성 참여자</h2><div className="bars">${daily.map(d=>html`<div key=${d.day} className="bar"><i style=${{height:Math.round(d.users/maxU*100)+"%"}} title=${d.users+"명 · 이벤트 "+d.events}></i><span>${d.day.slice(5)}</span><b>${d.users}</b></div>`)}</div></div>
   <div className="stack"><h2 className="h3">활동일 분포</h2><div className="bars">${[0,1,2,3,4,5,6,7].map(k=>{const c=testers.filter(p=>Math.min(p.active_days,7)===k).length;return html`<div key=${k} className="bar"><i style=${{height:Math.round(c/Math.max(1,n)*100)+"%"}}></i><span>${k}${k===7?"+":""}일</span><b>${c}</b></div>`})}</div></div>
   <div className="stack"><h2 className="h3">많이 일어난 행동</h2><div className="wordchips">${(ov.top_events||[]).map(e=>html`<span key=${e.name} className="chip plain">${e.name} · ${e.n}</span>`)}</div></div>
   <div className="row"><button className="btn ghost sm" onClick=${load}>새로 고침</button><button className="btn ghost sm" onClick=${async()=>{try{const ev=await api.admin.events();download(`mib-events-${today}.csv`,csv(ev.map(e=>({...e,nickname:(byId[e.user_id]||{}).nickname}))));track("admin_export",{t:"events"})}catch(e){toast("내보내지 못했습니다.")}}}>이벤트 CSV</button><button className="btn ghost sm" onClick=${()=>download(`mib-people-${today}.csv`,csv(people))}>참여자 CSV</button></div>
  </div>`}
  ${tab==="people"&&html`<div className="stack"><p className="small muted">원문 기록은 이곳에 나타나지 않습니다. 사용 횟수와 상태만 집계합니다.</p><div className="tablewrap"><table className="tbl"><thead><tr><th>닉네임</th><th>가입</th><th>활동일</th><th>최근</th><th>해석</th><th>상태</th><th>걸음</th><th>한 줄</th><th>선반</th><th>공개</th><th>친구</th><th>공감 준/받은</th><th>의견</th><th>AI</th><th>관리</th></tr></thead><tbody>
   ${people.map(p=>html`<tr key=${p.id}><td><span className="row" style=${{gap:"6px",flexWrap:"nowrap"}}><${Avatar} p=${{id:p.id,nickname:p.nickname,avatar:avs[p.id]==="photo"?null:avs[p.id]}} size=${24}/><b>${p.nickname}</b></span>${p.role==="admin"?html` <span className="tag">운영</span>`:null}<br/><span className="faint">${p.email||""}</span></td><td>D${cbtDay(p.joined_at)}</td><td>${p.active_days}</td><td>${p.last_active?ago(p.last_active):"—"}</td><td>${p.analyses}</td><td>${p.status||"—"}</td><td>${p.steps}</td><td>${p.logs}</td><td>${p.items}</td><td>${p.public?(p.card_hidden?"숨김":"공개"):"—"}</td><td>${p.friends}</td><td>${p.reactions_given}/${p.reactions_got}</td><td>${p.feedback}${p.exit_done?" ✓":""}</td><td>${p.ai_calls}</td>
    <td className="nowrap">${p.public&&html`<button className="linkbtn small" disabled=${busy} onClick=${()=>act(()=>api.admin.hideCard(p.id,!p.card_hidden),p.card_hidden?"카드를 다시 보이게 했어요.":"카드를 숨겼어요.")}>${p.card_hidden?"숨김 해제":"카드 숨김"}</button>`} ${avs[p.id]==="photo"&&html`<button className="linkbtn small" disabled=${busy} onClick=${()=>act(()=>api.admin.clearAvatar(p.id),"프로필 사진을 내렸어요. 기본 원석으로 보입니다.")}>사진 내리기</button>`} <button className="linkbtn small" disabled=${busy} onClick=${()=>{const pw=prompt(p.nickname+"님의 임시 비밀번호 (8자 이상)");if(pw&&pw.length>=8)act(()=>api.admin.resetPassword(p.id,pw),"임시 비밀번호를 설정했어요. 본인에게 따로 전달해 주세요.")}}>비번 재설정</button></td></tr>`)}
   </tbody></table></div></div>`}
  ${tab==="fb"&&html`<${AdminFeedback} fb=${fb} byId=${byId} today=${today}/>`}
  ${tab==="inv"&&html`<${AdminInvites} invites=${ov.invites||[]} act=${act} busy=${busy} toast=${toast}/>`}
  ${tab==="ann"&&html`<${AdminAnn} anns=${anns} act=${act} busy=${busy}/>`}
  ${tab==="rep"&&html`<div className="stack">${reps===null?html`<p className="faint small">불러오는 중…</p>`:reps.length?reps.map(r=>html`<div key=${r.id} className="panel stack small"><div className="row between"><b>${(byId[r.target_id]||{}).nickname||"(탈퇴)"} 신고</b><span className="faint">${ago(r.created_at)} · ${(byId[r.reporter]||{}).nickname||""}</span></div><span className="prewrap">${r.reason}</span><div className="row">${!r.resolved?html`<button className="btn ghost sm" onClick=${()=>act(async()=>{await api.admin.resolveReport(r.id);setReps(null);api.admin.reports().then(setReps)},"처리 완료로 표시했어요.")}>처리 완료</button>`:html`<span className="chip">처리됨</span>`}<button className="btn ghost sm" onClick=${()=>act(()=>api.admin.hideCard(r.target_id,true),"카드를 숨겼어요.")}>카드 숨기기</button></div></div>`):html`<p className="small muted">들어온 신고가 없습니다.</p>`}</div>`}
  ${tab==="set"&&html`<${AdminSettings} settings=${ov.settings||{}} act=${act} busy=${busy} aiOk=${aiOk} ytOk=${ytOk} onPreviewEvo=${onPreviewEvo} onPreviewAway=${onPreviewAway} onPreviewBadges=${onPreviewBadges}/>`}
 </div>`;
}
function AdminFeedback({fb,byId,today}){
 const [kind,setKind]=useState("screen");
 if(fb===null)return html`<p className="faint small">불러오는 중…</p>`;
 const rows=fb.filter(f=>f.kind===kind);const nick=id=>(byId[id]||{}).nickname||"(탈퇴)";
 let summary=null;
 if(kind==="exit"&&rows.length){const s=rows.filter(r=>r.rating!=null);const pro=s.filter(r=>r.rating>=9).length,det=s.filter(r=>r.rating<=6).length;const nps=s.length?Math.round((pro-det)/s.length*100):0;const intents={};rows.forEach(r=>{const k=(r.payload||{}).intent||"—";intents[k]=(intents[k]||0)+1});summary=html`<div className="kpis"><div><b>${nps}</b><span>NPS (${s.length}명)</span></div>${Object.entries(intents).map(([k,v])=>html`<div key=${k}><b>${v}</b><span>${k}</span></div>`)}</div>`}
 if(kind==="daily"&&rows.length){summary=html`<div className="stack">${DAILY_Q.map(q=>{const rs=rows.filter(r=>(r.payload||{}).day===q.d);if(!rs.length)return null;let res;if(q.type==="scale"){const avg=rs.reduce((s,r)=>s+(r.rating||0),0)/rs.length;res=`평균 ${avg.toFixed(2)} / 5 (${rs.length}명)`}else{const m={};rs.forEach(r=>{const c=(r.payload||{}).choice||"—";m[c]=(m[c]||0)+1});res=Object.entries(m).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${k} ${v}`).join(" · ")}return html`<div key=${q.d} className="panel small"><b>Day ${q.d}. ${q.q}</b><br/><span className="muted">${res}</span></div>`})}</div>`}
 if(kind==="screen"&&rows.length){const m={};rows.forEach(r=>{const k=(r.payload||{}).type||"—";m[k]=(m[k]||0)+1});summary=html`<div className="wordchips">${Object.entries(m).map(([k,v])=>html`<span key=${k} className="chip plain">${k} ${v}</span>`)}</div>`}
 return html`<div className="stack">
  <div className="segs">${[["screen","화면 의견"],["daily","오늘의 질문"],["exit","마무리 설문"]].map(([k,t])=>html`<button key=${k} aria-pressed=${kind===k} onClick=${()=>setKind(k)}>${t} ${fb.filter(f=>f.kind===k).length}</button>`)}</div>
  ${summary}
  <button className="btn ghost sm" onClick=${()=>download(`mib-feedback-${kind}-${today}.csv`,csv(rows.map(r=>({...r,nickname:nick(r.user_id)}))))}>CSV로 내보내기</button>
  ${rows.map(r=>html`<div key=${r.id} className="panel stack small"><div className="row between"><b>${nick(r.user_id)}</b><span className="faint">${new Date(r.created_at).toLocaleString("ko-KR")}</span></div>
   <span>${kind==="screen"?html`<span className="tag">${(r.payload||{}).type||""}</span><span className="tag">${screenLabel(r.screen)}</span>`:kind==="daily"?html`<span className="tag">Day ${(r.payload||{}).day}</span>${r.rating!=null?`★${r.rating} `:""}${(r.payload||{}).choice||""}`:html`<span className="tag">추천 ${r.rating}</span><span className="tag">${(r.payload||{}).intent||""}</span>`}</span>
   ${kind==="exit"&&html`<span><b>좋았던 순간</b> ${(r.payload||{}).best||"—"}</span><span><b>아쉬운 점</b> ${(r.payload||{}).worst||"—"}</span>`}
   ${r.body&&html`<span className="prewrap">${r.body}</span>`}</div>`)}
  ${!rows.length&&html`<p className="small muted">아직 없습니다.</p>`}
 </div>`;
}
function AdminInvites({invites,act,busy,toast}){
 const [cnt,setCnt]=useState(5);const [label,setLabel]=useState("");const [uses,setUses]=useState(1);
 const base=`${location.origin}${location.pathname}`;
 return html`<div className="stack">
  <div className="panel stack"><b>새 초대 코드</b><div className="row"><input type="text" aria-label="메모" placeholder="메모 (예: 2차 모집)" value=${label} onChange=${e=>setLabel(e.target.value)} style=${{flex:2}}/><input type="number" aria-label="개수" min="1" max="50" value=${cnt} onChange=${e=>setCnt(+e.target.value)} style=${{width:"80px"}}/><input type="number" aria-label="코드당 사용 횟수" min="1" max="100" value=${uses} onChange=${e=>setUses(+e.target.value)} style=${{width:"80px"}}/></div><span className="hint">개수 · 코드당 사용 횟수. 정원(설정 탭)을 넘는 가입은 코드가 남아도 막힙니다.</span><button className="btn sm" disabled=${busy} onClick=${()=>act(()=>api.admin.createInvites(cnt,"MIB",label,uses),"초대 코드를 만들었어요.")}>만들기</button></div>
  <button className="btn ghost sm" onClick=${async()=>{const t=invites.filter(i=>i.active&&i.used<i.max_uses&&i.role==="tester").map(i=>`${i.label}\t${i.code}\t${base}?code=${i.code}`).join("\n");const ok=await copyText(t);toast(ok?"남은 테스터 코드와 링크를 복사했어요.":"복사하지 못했습니다.")}}>남은 코드·링크 모두 복사</button>
  <div className="tablewrap"><table className="tbl"><thead><tr><th>코드</th><th>메모</th><th>역할</th><th>사용</th><th>상태</th><th></th></tr></thead><tbody>${invites.map(i=>html`<tr key=${i.code}><td className="mono">${i.code}</td><td>${i.label}</td><td>${i.role==="admin"?"운영":"테스터"}</td><td>${i.used}/${i.max_uses}</td><td>${i.active?(i.used>=i.max_uses?"소진":"사용 가능"):"중지"}</td><td className="nowrap"><button className="linkbtn small" onClick=${async()=>{const ok=await copyText(`${base}?code=${i.code}`);toast(ok?"초대 링크를 복사했어요.":"복사 실패")}}>링크</button> <button className="linkbtn small" disabled=${busy} onClick=${()=>act(()=>api.admin.setInviteActive(i.code,!i.active),i.active?"코드를 중지했어요.":"코드를 다시 켰어요.")}>${i.active?"중지":"재개"}</button></td></tr>`)}</tbody></table></div>
 </div>`;
}
function AdminAnn({anns,act,busy}){
 const [t,setT]=useState("");const [b,setB]=useState("");
 return html`<div className="stack">
  <div className="panel stack"><b>새 공지</b><input type="text" aria-label="공지 제목" placeholder="제목" maxLength="80" value=${t} onChange=${e=>setT(e.target.value)}/><textarea aria-label="공지 내용" placeholder="내용 (선택)" maxLength="2000" value=${b} onChange=${e=>setB(e.target.value)}></textarea><button className="btn sm" disabled=${busy||!t.trim()} onClick=${()=>act(async()=>{await api.admin.announce(t.trim(),b.trim());setT("");setB("")},"공지를 올렸어요. 참여자 알림함과 홈에 보입니다.")}>공지 올리기</button></div>
  ${anns.map(a=>html`<div key=${a.id} className="panel stack small"><div className="row between"><b>${a.title}</b><span className="faint">${ago(a.created_at)}</span></div>${a.body&&html`<span className="prewrap muted">${a.body}</span>`}<button className="linkbtn small" onClick=${()=>act(()=>api.admin.delAnnouncement(a.id),"공지를 내렸어요.")}>내리기</button></div>`)}
 </div>`;
}
function AdminSettings({settings,act,busy,aiOk,ytOk,onPreviewEvo,onPreviewAway,onPreviewBadges}){
 const [cap,setCap]=useState(Number(settings.tester_cap||30));const [lim,setLim]=useState(Number(settings.ai_daily_limit||40));
 return html`<div className="stack">
  <div className="panel stack small"><b>AI 연결</b><span>${aiOk===null?"확인 중…":aiOk?"ANTHROPIC_API_KEY가 등록되어 AI 해석이 켜져 있습니다.":"키가 없습니다. Supabase › Edge Functions › Secrets에서 ANTHROPIC_API_KEY를 추가하세요."}</span><span className="muted">모델은 기본값(해석: claude-sonnet-5-5, 짧은 작업: claude-haiku-5-5)을 씁니다. 바꾸려면 같은 곳에 ANTHROPIC_MODEL, ANTHROPIC_MODEL_QUICK를 추가하세요.</span></div>
  <div className="panel stack small"><b>유튜브 채널 읽기</b><span>${ytOk===null?"확인 중…":ytOk?"YOUTUBE_API_KEY가 등록되어, 참여자가 채널 주소만 넣으면 최근 업로드 최대 200편의 제목·날짜·길이를 읽어옵니다.":"키가 없습니다. 참여자는 업로드 목록을 직접 붙여 넣어야 합니다. 같은 Secrets에 YOUTUBE_API_KEY를 추가하면 채널 자동 읽기가 켜집니다."}</span></div>
  <div className="panel stack small"><b>젬 변신 연출</b><span className="muted">단계가 오르거나 강·결·각·형이 바뀌는 순간, 배지를 받는 순간, 그리고 받침·인연석·광채·별자리 같은 표식이 오르는 순간에 재생됩니다. 6시간 넘게 자리를 비웠다 돌아오면 그사이 쌓인 공감·친구·방문을 먼저 보여 준 뒤 이어서 재생됩니다.</span><div className="row"><button className="btn quiet sm grow" onClick=${onPreviewEvo}>변신 연출 미리보기</button><button className="btn quiet sm grow" onClick=${onPreviewAway}>돌아왔을 때 연출 미리보기</button></div><button className="btn quiet sm" onClick=${onPreviewBadges}>배지 획득 연출 미리보기 (일반 → 희귀 → 영웅 → 전설)</button></div>
  <div className="field"><label htmlFor="s-cap">테스터 정원</label><div className="row"><input type="number" id="s-cap" min="1" max="200" value=${cap} onChange=${e=>setCap(+e.target.value)} style=${{width:"110px"}}/><button className="btn ghost sm" disabled=${busy} onClick=${()=>act(()=>api.admin.setSetting("tester_cap",cap),"정원을 바꿨어요.")}>저장</button></div></div>
  <div className="field"><label htmlFor="s-lim">1인당 하루 AI 호출 한도</label><div className="row"><input type="number" id="s-lim" min="1" max="500" value=${lim} onChange=${e=>setLim(+e.target.value)} style=${{width:"110px"}}/><button className="btn ghost sm" disabled=${busy} onClick=${()=>act(()=>api.admin.setSetting("ai_daily_limit",lim),"한도를 바꿨어요.")}>저장</button></div><span className="hint">첫 해석 1회는 긴 작업, 나머지(새 걸음·회고 정리·아이템 알아보기)는 짧은 작업입니다.</span></div>
 </div>`;
}
