"use strict";
/* MIB CBT · 빠른 시작(탭 몇 번으로 첫 젬) + 알아가기(쓰면서 조금씩 더 묻기) */

/* ───────── question banks ───────── */
const QUICK_COLORS=[["새벽 하늘","#9EC9E8"],["숲","#5B976F"],["노을","#E89A5B"],["라벤더","#B39DDB"],["모래","#D9C3A0"],["밤하늘","#2F4D9B"],["벚꽃","#F1B6C6"],["먹","#3B4147"]];
const WORD_VALUE={"자유":"호기심·자유","온기":"따뜻함·돌봄","깊이":"진실·깊이","정직":"명료함·정직","다정":"다정함·관계","조화":"균형·조화","지혜":"성찰·지혜","신뢰":"신뢰·안정","용기":"용기·결단"};
const QUICK=[
 {id:"color",q:"지금 가장 편안하게 느껴지는 색은?",type:"color",opts:QUICK_COLORS.map(c=>c[0])},
 {id:"word",q:"가장 마음이 끌리는 단어는?",type:"one",opts:Object.keys(WORD_VALUE)},
 {id:"energy",q:"에너지가 차오르는 때는?",type:"two",opts:["혼자만의 시간","사람들과 함께"]},
 {id:"rest",q:"내 마음의 휴식처는?",type:"one",opts:["바다","숲","산","동네 카페","내 방","낯선 여행지","음악 속","부엌"]},
 {id:"plan",q:"무언가를 시작할 때 나는?",type:"two",opts:["계획부터 세운다","일단 해 보고 맞춘다"]},
 {id:"focus",q:"관심사를 대하는 나는?",type:"two",opts:["한 가지를 깊게","여러 가지를 넓게"]},
 {id:"help",q:"사람들에게 내가 주로 건네는 것은?",type:"one",opts:["곁에서 들어주기","새로운 아이디어","꾸준히 챙기기"]},
 {id:"time",q:"요즘 시간을 가장 많이 쓰는 일은?",hint:"최대 4개",type:"multi",max:4,opts:["일·공부","운동","음악","요리","여행","사진·영상","글쓰기","독서","게임","가족·반려","봉사","만들기","살림","배움"]},
 {id:"years",q:"그중 가장 오래 이어 온 일은 얼마나 됐나요?",type:"one",opts:["1년 미만","1~3년","3~10년","10년 이상"]},
 {id:"symbol",q:"나를 닮은 그림 하나를 고른다면?",type:"symbol",opts:SYMBOLS_QUICK},
 {id:"mbti",q:"MBTI를 알고 있나요?",hint:"본인이 아는 대로 고르면 돼요",type:"mbti",optional:true},
 {id:"blood",q:"혈액형은?",hint:"재미로 묻는 질문이에요. 해석에는 쓰지 않아요",type:"one",optional:true,opts:["A형","B형","O형","AB형"]}
];
const KNOW=[
 {id:"k_pace",q:"내가 좋아하는 하루는?",type:"two",opts:["느긋하고 여유롭게","꽉 차고 바쁘게"]},
 {id:"k_praise",q:"사람들에게 자주 듣는 말은?",type:"one",opts:["꼼꼼하다","재밌다","믿음직하다","따뜻하다","새롭다","차분하다"]},
 {id:"k_recover",q:"지칠 때 나를 회복시키는 것은?",type:"one",opts:["푹 자기","사람 만나기","몸 움직이기","혼자 정리하기","맛있는 것","자연 속"]},
 {id:"k_long",q:"가장 오래 이어 온 일은 무엇인가요?",type:"text",ph:"예) 주말 등산 3년째"},
 {id:"k_team",q:"함께 일할 때 나의 자리는?",type:"one",opts:["앞에서 이끌기","옆에서 돕기","뒤에서 받치기","아이디어 내기"]},
 {id:"k_thanks",q:"최근 누군가에게 고맙다는 말을 들은 일이 있나요?",type:"text",ph:"예) 후배에게 노출 맞추는 법을 알려 줬다"},
 {id:"k_child",q:"어릴 때 가장 좋아했던 놀이는?",type:"one",opts:["그리기·만들기","밖에서 뛰어놀기","책 읽기","역할 놀이","모으기","음악·춤"]},
 {id:"k_weekend",q:"주말 아침, 나는 주로?",type:"one",opts:["늦잠","운동","가족과 함께","취미 시간","한 주 정리","산책"]},
 {id:"k_item",q:"오래 함께한 물건 하나를 꼽는다면?",type:"text",ph:"예) 아버지께 받은 필름 카메라"},
 {id:"k_learn",q:"요즘 배워 보고 싶은 것은?",type:"text",ph:"예) 드럼, 영어 회화, 사진 보정"},
 {id:"k_proud",q:"최근 스스로 뿌듯했던 순간은?",type:"text",ph:"예) 미루던 정리를 끝냈다"},
 {id:"k_future",q:"1년 뒤, 어떤 모습이 되어 있으면 좋겠나요?",type:"text",ph:"예) 내 사진으로 작은 전시 열기"}
];
const MBTI_AXES=[["E","외향","I","내향"],["S","감각","N","직관"],["T","사고","F","감정"],["J","계획","P","탐색"]];

/* ───────── prompt sections & gem anchors ───────── */
function quickLines(quick){
 if(!quick||!quick.answers)return "";const a=quick.answers;const L=[];
 const say=(id,label)=>{const v=a[id];if(v==null||v===""||(Array.isArray(v)&&!v.length))return;L.push(`- ${label}: ${Array.isArray(v)?v.join(", "):v}`)};
 say("color","편안한 색");say("word","끌리는 단어");say("energy","에너지가 차오르는 때");say("rest","마음의 휴식처");say("plan","시작할 때");say("focus","관심사를 대하는 방식");say("help","사람들에게 건네는 것");say("time","요즘 시간을 쓰는 일");say("years","가장 오래 이어 온 일의 기간");say("symbol","나를 닮은 그림");
 if(a.mbti)L.push(`- MBTI(본인이 밝힌 자기소개, 참고만): ${a.mbti}`);
 return L.length?`[빠른 시작 — 본인이 직접 고른 답]\n${L.join("\n")}`:"";
}
function knowLines(know){
 const k=(know||[]).filter(x=>x&&x.a&&String(x.a).trim());if(!k.length)return "";
 return `[알아가기 — 앱을 쓰며 답한 것]\n`+k.slice(-20).map(x=>`- ${x.q} ${x.a}`).join("\n");
}
/* taps the person made shape the gem visibly: blend 65% self-report, 35% AI reading */
function anchorGemInputs(g,quick,know){
 g={...(g||{})};const a=(quick&&quick.answers)||{};const kv=id=>((know||[]).find(x=>x.id===id)||{}).a;
 const bl=(anchor,ai)=>{const n=Number(ai);return Number.isFinite(n)?Math.round(.65*anchor+.35*clamp(n,0,100)):anchor};
 if(a.plan)g.structure=bl(a.plan==="계획부터 세운다"?86:18,g.structure);
 if(a.focus)g.focus=bl(a.focus==="한 가지를 깊게"?90:20,g.focus);
 const pace=kv("k_pace");if(pace)g.pace=bl(pace==="꽉 차고 바쁘게"?80:25,g.pace);
 const inf={deep:Number((g.influence||{}).deep)||40,spark:Number((g.influence||{}).spark)||40,wave:Number((g.influence||{}).wave)||40};
 if(a.help==="곁에서 들어주기")inf.deep+=22;if(a.help==="새로운 아이디어")inf.spark+=22;if(a.help==="꾸준히 챙기기")inf.wave+=22;
 if(a.energy==="혼자만의 시간")inf.deep+=8;if(a.energy==="사람들과 함께")inf.wave+=8;
 if(a.help||a.energy)g.influence={deep:clamp(inf.deep,0,100),spark:clamp(inf.spark,0,100),wave:clamp(inf.wave,0,100)};
 if(a.word&&WORD_VALUE[a.word]){const v=WORD_VALUE[a.word];const vals=Array.isArray(g.values)?g.values.map(x=>({...x})):[];const hit=vals.find(x=>String(x.name||"").replace(/\s/g,"")===v.replace(/\s/g,""));if(hit)hit.score=clamp((Number(hit.score)||0)+20,0,100);else vals.push({name:v,score:72});g.values=vals}
 if(Array.isArray(a.time)&&a.time.length){const d=Array.isArray(g.domains)?[...g.domains]:[];a.time.forEach(t=>{if(!d.some(x=>String(x).includes(t.split("·")[0])))d.push(t)});g.domains=d.slice(0,8)}
 if(a.years){const y={"1년 미만":.5,"1~3년":2,"3~10년":5,"10년 이상":12}[a.years];if(y!=null)g.years=Math.max(Number(g.years)||0,y)}
 if(a.symbol&&SYMBOLS.includes(a.symbol))g.symbol=a.symbol;
 return g;
}
function quickTint(quick){const c=quick&&quick.answers&&quick.answers.color;const f=QUICK_COLORS.find(x=>x[0]===c);return f?f[1]:null}
function clarityOf(st){
 let v=0;if(st.quick&&st.quick.done)v+=30;const s=st.sources||{};if((s.story||"").trim())v+=12;if((s.youtube||"").trim())v+=15;if((s.calendar||"").trim())v+=10;if(s.photos)v+=8;
 v+=Math.min(30,(st.know||[]).filter(k=>k.a).length*5);v+=Math.min(10,(st.logs||[]).length*2);if((st.analyses||0)>1)v+=5;return clamp(v,st.analysis?10:0,100);
}

/* ───────── 빠른 시작 screens ───────── */
function QuickStart({draft,setDraft,onDone,onExit}){
 const answers=(draft.quick&&draft.quick.answers)||{};const [i,setI]=useState(0);const t0=useRef(Date.now());
 const Q=QUICK[i];const v=answers[Q.id];
 const setA=(val)=>setDraft(d=>({...d,quick:{...(d.quick||{}),answers:{...((d.quick||{}).answers||{}),[Q.id]:val}}}));
 const next=()=>{track("quick_answer",{id:Q.id,skip:answers[Q.id]==null});if(i<QUICK.length-1)setI(i+1);else{setDraft(d=>({...d,quick:{...(d.quick||{}),done:true,at:Date.now()}}));track("quick_done",{ms:Date.now()-t0.current});onDone()}};
 const pick=(val)=>{setA(val);setTimeout(()=>{if(i<QUICK.length-1)setI(x=>x+1);else next()},180);track("quick_answer",{id:Q.id})};
 useEffect(()=>{try{window.scrollTo(0,0)}catch(e){}},[i]);
 let body=null;
 if(Q.type==="color")body=html`<div className="qc-colors">${QUICK_COLORS.map(([n,hex])=>html`<button key=${n} className="qc-color" aria-pressed=${v===n} onClick=${()=>pick(n)}><span style=${{background:hex}}></span>${n}</button>`)}</div>`;
 else if(Q.type==="two")body=html`<div className="qc-two">${Q.opts.map(o=>html`<button key=${o} className="qc-opt big" aria-pressed=${v===o} onClick=${()=>pick(o)}>${o}</button>`)}</div>`;
 else if(Q.type==="one")body=html`<div className=${"qc-grid"+(Q.opts.length<=4?" two":"")}>${Q.opts.map(o=>html`<button key=${o} className="qc-opt" aria-pressed=${v===o} onClick=${()=>pick(o)}>${o}</button>`)}</div>`;
 else if(Q.type==="symbol")body=html`<div className="qc-grid five">${Q.opts.map(o=>html`<button key=${o} className="qc-opt sym" aria-pressed=${v===o} onClick=${()=>pick(o)} aria-label=${o}><${Glyph} name=${o} size=${30}/><span>${o}</span></button>`)}</div>`;
 else if(Q.type==="multi"){const arr=Array.isArray(v)?v:[];body=html`<div className="qc-grid">${Q.opts.map(o=>{const on=arr.includes(o);return html`<button key=${o} className="qc-opt" aria-pressed=${on} onClick=${()=>setA(on?arr.filter(x=>x!==o):arr.length>=Q.max?arr:[...arr,o])}>${o}</button>`})}</div><button className="btn block" disabled=${!arr.length} onClick=${next}>다음 ${arr.length?`(${arr.length})`:""}</button>`}
 else if(Q.type==="mbti"){const m=typeof v==="string"&&v.length===4?v.split(""):[null,null,null,null];const setM=(k,c)=>{const n=[...m];n[k]=c;setA(n.every(Boolean)?n.join(""):n.map(x=>x||"·").join(""))};
  body=html`<div className="stack">${MBTI_AXES.map(([a,al,b,bl],k)=>html`<div className="qc-two slim" key=${k}>${[[a,al],[b,bl]].map(([c,l])=>html`<button key=${c} className="qc-opt" aria-pressed=${m[k]===c} onClick=${()=>setM(k,c)}><b>${c}</b> ${l}</button>`)}</div>`)}</div>
  <button className="btn block" disabled=${!(typeof v==="string"&&/^[EI][SN][TF][JP]$/.test(v))} onClick=${next}>${typeof v==="string"&&/^[EI][SN][TF][JP]$/.test(v)?v+" · 다음":"네 가지를 골라 주세요"}</button>`}
 return html`<div className="main wrap quick">
  <div className="row between"><button className="iconbtn" aria-label="이전" onClick=${()=>i?setI(i-1):onExit()}><${Ico} n="back"/></button><span className="small faint">${i+1} / ${QUICK.length}</span></div>
  <div className="progress">${QUICK.map((_,k)=>html`<i key=${k} className=${k<=i?"on":""}></i>`)}</div>
  <div className="stack qc-head"><div className="eyebrow">빠른 시작 · 고민 없이 탭</div><h1 className="h2">${Q.q}</h1>${Q.hint&&html`<p className="small muted">${Q.hint}</p>`}</div>
  ${body}
  ${Q.optional&&html`<button className="linkbtn" style=${{alignSelf:"center"}} onClick=${()=>{setA(null);next()}}>잘 몰라요 · 건너뛰기</button>`}
 </div>`;
}
function QuickDone({draft,setDraft,onMore,onGo,aiReady}){
 const a=(draft.quick&&draft.quick.answers)||{};const s=draft.sources;
 const extra=[(s.youtube||"").trim()&&"유튜브",(s.calendar||"").trim()&&"캘린더",draft.photos.length&&`사진 ${draft.photos.length}장`].filter(Boolean);
 const g={stone:(STONE_NAMES.find(n=>STONES[n].meaning===WORD_VALUE[a.word])||"오팔"),light:a.help==="새로운 아이디어"?"반짝임":a.help==="꾸준히 챙기기"?"물결":"번짐",form:a.focus==="한 가지를 깊게"?"결정":"덩이",texture:a.plan==="계획부터 세운다"?"맑음":"비단결",hardness:1,grain:0,facets:7,symbol:a.symbol||"별"};
 return html`<div className="main wrap">
  <div className="stack" style=${{alignItems:"center",textAlign:"center"}}><div className="eyebrow">원석이 모였어요</div>
   <div className="pulse"><${GemView} g=${g} seed="quick-preview" size=${150}/></div>
   <h1 className="h2">이제 나의 젬을 깎아 볼게요</h1><p className="muted small">고른 답이 젬의 색과 모양, 빛에 그대로 스며듭니다.</p></div>
  <div className="field"><label htmlFor="intro">한 줄로 나를 소개한다면? <span className="faint">(선택)</span></label><input type="text" id="intro" maxLength="120" value=${s.story} onChange=${e=>setDraft(d=>({...d,sources:{...d.sources,story:e.target.value}}))} placeholder="예) 주말마다 산에 오르고 사진으로 남기는 직장인"/><span className="hint">한 줄만 있어도 해석이 훨씬 나다워져요.</span></div>
  <button className="btn block" disabled=${aiReady===false} onClick=${onGo}>내 젬 만들기</button>
  <button className="btn ghost block" onClick=${onMore}>${extra.length?`더한 자료: ${extra.join(", ")} · 고치기`:"더 정확하게 — 유튜브·캘린더·사진 더하기 (선택)"}</button>
  ${aiReady===false&&html`<p className="note">AI 해석이 아직 준비 중이에요. 운영자가 설정을 마치면 바로 만들 수 있어요.</p>`}
 </div>`;
}

/* ───────── 알아가기 card on home ───────── */
function KnowCard({st,update,toast,demo,onReread}){
 const t=dayKey();const know=st.know||[];const todayN=know.filter(k=>k.day===t).length;
 const nextQ=KNOW.find(q=>!know.some(k=>k.id===q.id));
 const [txt,setTxt]=useState("");const [sel,setSel]=useState(null);
 const since=st.analysis?know.filter(k=>k.at>(st.analysis.at||0)).length:0;const clar=clarityOf(st);
 function save(val){if(demo||!nextQ)return;const v=String(val||"").trim().slice(0,160);if(!v)return;update(s=>{s.know=[...(s.know||[]).filter(k=>k.id!==nextQ.id),{id:nextQ.id,q:nextQ.q,a:v,day:t,at:Date.now()}]});setTxt("");setSel(null);track("know_answer",{id:nextQ.id});toast(`젬이 조금 더 선명해졌어요 · 선명도 ${clarityOf({...st,know:[...know,{a:v}]})}%`)}
 const done=!nextQ||todayN>=2;
 return html`<div className="panel stack know">
  <div className="row between"><span className="eyebrow">알아가기 · 하루 두 개까지</span><span className="small faint">젬 선명도 ${clar}%</span></div>
  <div className="meter" aria-label=${"젬 선명도 "+clar+"%"}><i style=${{width:clar+"%"}}></i></div>
  ${done?html`<p className="small muted">${nextQ?"오늘은 여기까지! 내일 새 질문이 기다려요.":"준비한 질문에 모두 답했어요. 고맙습니다."}</p>`:html`
   <b className="serif" style=${{fontSize:"17px",color:"var(--accent)"}}>${nextQ.q}</b>
   ${nextQ.type==="text"?html`<div className="row" style=${{flexWrap:"nowrap"}}><input type="text" aria-label=${nextQ.q} value=${txt} maxLength="160" placeholder=${nextQ.ph||""} onChange=${e=>setTxt(e.target.value)} style=${{flex:1,minWidth:0}}/><button className="btn sm" disabled=${!txt.trim()||demo} onClick=${()=>save(txt)}>답하기</button></div>`:
    html`<div className=${nextQ.type==="two"?"qc-two slim":"qc-grid"}>${nextQ.opts.map(o=>html`<button key=${o} className="qc-opt" aria-pressed=${sel===o} disabled=${demo} onClick=${()=>{setSel(o);setTimeout(()=>save(o),160)}}>${o}</button>`)}</div>`}
   <button className="linkbtn small" style=${{alignSelf:"flex-start",color:"var(--ink-3)"}} onClick=${()=>{if(demo)return;update(s=>{s.know=[...(s.know||[]),{id:nextQ.id,q:nextQ.q,a:"",day:t,at:Date.now(),skip:true}]});track("know_skip",{id:nextQ.id})}}>이 질문은 넘기기</button>`}
  ${since>=3&&html`<div className="panel tint stack small"><span>새로 알게 된 것이 ${since}개 쌓였어요. 다시 읽으면 젬이 더 나다워집니다.</span><button className="btn sm" onClick=${onReread}>새로 알게 된 것으로 다시 읽기</button></div>`}
 </div>`;
}
