"use strict";
/* ───────── screens ───────── */
function Welcome({onStart,onDemo,rt,nickname}){
 const g={stone:"오팔",lightName:"새벽빛",light:"번짐",form:"결정",texture:"유백",hardness:3,grain:3,facets:9,symbol:"카메라"};
 return html`<div className="welcome wrap">
  <div className="eyebrow">MyItemBook · ${MIB_CONFIG.cohort}</div>
  <h1 className="h1">${nickname?html`${nickname}님,<br/>`:null}나다운 결을<br/>발견하다.</h1>
  <p className="lead">고민 없이 몇 가지를 고르기만 하면, AI가 당신의 결을 읽어 세상에 하나뿐인 젬과 한 장의 카드로 보여 줍니다. 쓰면서 조금씩 더 알아 갈수록 젬은 선명해집니다.</p>
  <${GemView} g=${g} seed="welcome" size=${220} className="float"/>
  <p className="serif" style=${{textAlign:"center",color:"var(--accent)",fontSize:"17px"}}>누구나 원석으로 태어난다. 살아가는 만큼, 보석이 된다.</p>
  <div className="promises">
   <div className="promise"><b>1분, 탭 몇 번</b><span>고민 없이 고르기만 하면 첫 젬이 나옵니다</span></div>
   <div className="promise"><b>기본값은 나만 보기</b><span>공개는 항목별로, 내가 고릅니다</span></div>
   <div className="promise"><b>근거가 보이는 AI</b><span>모든 해석을 누르면 이유가 나옵니다</span></div>
   <div className="promise"><b>팔지 않는다</b><span>내 기록은 광고나 판매에 쓰지 않습니다</span></div>
  </div>
  <div className="stack">
   <button className="btn block" onClick=${onStart}>1분 만에 나의 젬 만들기</button>
   <button className="btn ghost block" onClick=${onDemo}>예시 인물 '서윤'으로 둘러보기</button>
  </div>
  <p className="note">기록은 내 계정에만 보이는 저장소에 보관됩니다. 공개는 내가 고른 항목만, 고른 사람에게만 보입니다.${rt.aiReady===false?" 지금은 AI 해석을 준비 중이라, 먼저 예시 인물로 흐름을 둘러볼 수 있습니다.":""}</p>
 </div>`;
}
function Progress({n}){return html`<div className="progress" aria-label=${`3단계 중 ${n}단계`}>${[1,2,3].map(i=>html`<i key=${i} className=${i<=n?"on":""}></i>`)}</div>`}
function SourceCard({icon,title,desc,open,onToggle,filled,children}){
 return html`<div className="source"><button className="source-head" onClick=${onToggle} aria-expanded=${open}><span className="source-ico"><${Ico} n=${icon}/></span><span className="grow"><b>${title}</b><br/><span className="small faint">${desc}</span></span>${filled?html`<span className="chip">담김</span>`:html`<span className="faint">${open?"접기":"열기"}</span>`}</button>${open&&html`<div className="source-body">${children}</div>`}</div>`;
}
function Connect({draft,setDraft,rt,onNext,onBack,hasItems,allowEmpty,nextLabel}){
 const [open,setOpen]=useState("story");const s=draft.sources;const set=(k,v)=>setDraft(d=>({...d,sources:{...d.sources,[k]:v}}));
 const maxPhotos=4;
 const canPhotos=true;
 const urls=useMemo(()=>draft.photos.map(f=>URL.createObjectURL(f)),[draft.photos]);
 useEffect(()=>()=>urls.forEach(u=>URL.revokeObjectURL(u)),[urls]);
 const any=s.youtube.trim()||s.calendar.trim()||s.story.trim()||draft.photos.length;
 const tog=k=>setOpen(o=>o===k?null:k);
 return html`<div className="main wrap">
  <${Progress} n=${1}/>
  <div className="stack"><div className="eyebrow">첫 연결</div><h1 className="h2">무엇으로 나를 읽을까요?</h1><p className="muted">하나만 건네도 충분합니다. 유튜브는 채널 주소만 넣으면 자동으로 읽어오고, 나머지는 붙여 넣거나 골라서 건넵니다.</p></div>
  <div className="stack">
   <${SourceCard} icon="pen" title="나의 이야기" desc="요즘 하는 일, 오래 해 온 것, 다시 시작한 것" open=${open==="story"} onToggle=${()=>tog("story")} filled=${!!s.story.trim()}>
    <div className="field"><label htmlFor="src-story">자유롭게 적어 주세요</label><textarea id="src-story" value=${s.story} onChange=${e=>set("story",e.target.value)} placeholder="예) 3년째 주말마다 동네 뒷산을 오르고, 다녀오면 사진과 짧은 글을 블로그에 올립니다. 작년에 잠시 쉬었다가 올봄 다시 시작했어요."></textarea></div>
   <//>
   <${SourceCard} icon="yt" title="유튜브 채널" desc="채널 주소만 넣으면 업로드 목록을 읽어옵니다" open=${open==="youtube"} onToggle=${()=>tog("youtube")} filled=${!!s.youtube.trim()}>
    <${YouTubeSource} s=${s} set=${set} setDraft=${setDraft} ready=${rt.ytReady}/>
   <//>
   <${SourceCard} icon="cal" title="캘린더" desc="반복 일정이나 지난 한 달의 일정" open=${open==="calendar"} onToggle=${()=>tog("calendar")} filled=${!!s.calendar.trim()}>
    <div className="field"><label htmlFor="src-cal">일정 붙여 넣기</label><textarea id="src-cal" value=${s.calendar} onChange=${e=>set("calendar",e.target.value)} placeholder=${"예)\n매주 토 07:00 등산 모임\n화·목 20:00 영어 스터디\n11/3 후배 이력서 봐 주기"}></textarea></div>
    <div className="reads"><b>읽는 것</b><span>반복·주기·활동 종류</span><b>읽지 않음</b><span>함께한 사람 이름 (지워도 됩니다)</span></div>
   <//>
   ${canPhotos?html`<${SourceCard} icon="photo" title="사진 갤러리" desc=${`나를 보여 주는 사진 최대 ${maxPhotos}장`} open=${open==="photo"} onToggle=${()=>tog("photo")} filled=${draft.photos.length>0}>
    <p className="small muted">취미·여가·특기·관심사가 드러나는 사진을 골라 주세요. 사진은 해석에만 쓰고 저장하지 않으며, 얼굴로 사람을 알아보지 않습니다.</p>
    <div className="thumbs">${urls.map((u,i)=>html`<img key=${i} src=${u} alt=${`고른 사진 ${i+1}`}/>`)}</div>
    <div className="row"><label className="btn quiet sm filebtn">사진 고르기<input type="file" id="src-photos" accept="image/jpeg,image/png,image/webp" multiple onChange=${e=>{const f=[...e.target.files].slice(0,maxPhotos);setDraft(d=>({...d,photos:f}))}}/></label>${draft.photos.length>0&&html`<button className="linkbtn" onClick=${()=>setDraft(d=>({...d,photos:[]}))}>모두 빼기</button>`}</div>
   <//>`:null}
  </div>
  ${hasItems&&html`<p className="small muted">선반에 담은 아이템도 함께 읽습니다.</p>`}
  <div className="panel tint small"><b>이렇게 다룹니다</b><br/>건네준 글과 사진만 읽고, 사람을 이름으로 찾거나 건강·종교·정치를 추정하지 않습니다. 해석 결과와 내가 적은 글은 나만 보기로 저장됩니다. AI 해석은 Anthropic의 Claude가 처리하며, MIB는 내 기록을 광고나 판매에 쓰지 않습니다.</div>
  <div className="row"><button className="btn ghost" onClick=${onBack}>이전</button><button className="btn grow" disabled=${!any&&!allowEmpty} onClick=${onNext}>${nextLabel||"다음"}</button></div>
 </div>`;
}
/* ───────── YouTube: channel URL → upload titles & dates (via mib-api) ───────── */
const YT_ERR={yt_not_configured:"채널 자동 읽기는 운영자가 준비 중이에요. 지금은 아래에 목록을 직접 붙여 넣어 주세요.",yt_quota:"오늘 유튜브 조회 한도를 다 썼어요. 내일 다시 시도하거나 직접 붙여 넣어 주세요.",yt_invalid:"채널 주소를 확인해 주세요. 예) youtube.com/@핸들, @핸들, youtube.com/channel/UC…",yt_not_found:"그 주소로 채널을 찾지 못했습니다. 채널 홈 주소를 그대로 붙여 넣어 보세요.",yt_unavailable:"유튜브에서 목록을 받지 못했습니다. 잠시 뒤 다시 시도하거나 아래에 직접 붙여 넣어 주세요.",network:"인터넷 연결을 확인해 주세요."};
function fmtSec(n){if(!n)return "";const h=Math.floor(n/3600),m=Math.floor(n%3600/60),s=n%60;return h?`${h}:${pad(m)}:${pad(s)}`:`${m}:${pad(s)}`}
function ytDigest(res){
 const ch=res.channel||{};const v=(res.videos||[]).filter(x=>x.t&&x.d).sort((a,b)=>a.d<b.d?1:-1);
 const dates=v.map(x=>x.d).sort();const L=[];
 L.push(`채널: ${ch.title||"(이름 없음)"}${ch.since&&ch.since>="2005"?` · ${ch.since.slice(0,4)}년 개설`:""} · ${res.source==="api"?`업로드 ${v.length}편${ch.total&&ch.total>v.length?` (전체 ${ch.total}편 중 최근)`:""}`:`최근 업로드 ${v.length}편`}`);
 if(dates.length>=3){const span=daysBetween(dates[0],dates[dates.length-1]);const avg=span/(dates.length-1);L.push(`업로드 주기: ${avg<1.5?"거의 매일":`평균 ${Math.round(avg)}일마다`} (${dates[0].replace(/-/g,".")} ~ ${dates[dates.length-1].replace(/-/g,".")})`)}
 if(ch.description)L.push(`채널 소개: ${ch.description.replace(/\s+/g," ").slice(0,200)}`);
 L.push("");v.forEach(x=>L.push(`${x.d.replace(/-/g,".")}  ${x.t}${x.sec?`  (${fmtSec(x.sec)})`:""}`));
 return {text:L.join("\n"),count:v.length};
}
function YouTubeSource({s,set,setDraft,ready}){
 const [url,setUrl]=useState((s.youtubeChannel&&s.youtubeChannel.url)||"");const [busy,setBusy]=useState(false);const [err,setErr]=useState("");
 const ch=s.youtubeChannel;
 async function fetchYT(e){e&&e.preventDefault();if(!url.trim())return;setBusy(true);setErr("");try{const r=await api.youtube(url.trim());const d=ytDigest(r);if(!d.count){setErr("공개된 영상이 없는 채널이에요. 영상이 올라온 뒤 다시 시도해 주세요.");track("yt_empty");return}
  setDraft(x=>({...x,sources:{...x.sources,youtube:d.text,youtubeChannel:{id:r.channel.id,title:r.channel.title,count:d.count,source:r.source,url:url.trim(),at:Date.now()}}}));track("yt_fetch",{n:d.count,src:r.source})}
  catch(x){setErr(YT_ERR[x.code]||"목록을 가져오지 못했습니다. 잠시 뒤 다시 시도해 주세요.");track("yt_fail",{code:x.code})}finally{setBusy(false)}}
 return html`<div className="stack">
  <form className="field" onSubmit=${fetchYT}><label htmlFor="src-yt-url">내 채널 주소 또는 @핸들</label>
   <div className="row" style=${{flexWrap:"nowrap"}}><input type="text" id="src-yt-url" value=${url} onChange=${e=>setUrl(e.target.value)} placeholder="예) youtube.com/@mychannel" autoCapitalize="off" autoCorrect="off" style=${{flex:1,minWidth:0}}/><button className="btn sm" disabled=${busy||!url.trim()||ready===false}>${busy?"읽는 중…":"가져오기"}</button></div>
   <span className="hint">${ready===false?"채널 자동 읽기는 운영자가 준비 중이에요. 지금은 아래에 목록을 직접 붙여 넣어 주세요.":"채널 주소, @핸들, 내 영상 링크 중 아무거나 됩니다. 공개 영상의 제목·날짜·길이만 읽어요."}</span></form>
  ${err&&html`<p className="err" role="alert">${err}</p>`}
  ${ch&&s.youtube.trim()&&html`<div className="panel tint small row" style=${{flexWrap:"nowrap"}}><span className="ytmark"><${Ico} n="yt"/></span><span className="grow"><b>${ch.title}</b> · 영상 ${ch.count}편을 가져왔어요</span><button className="linkbtn small" onClick=${()=>setDraft(x=>({...x,sources:{...x.sources,youtube:"",youtubeChannel:null}}))}>빼기</button></div>`}
  <div className="field"><label htmlFor="src-yt">${ch?"가져온 목록 — 빼고 싶은 영상은 지워도 돼요":"또는 업로드 목록 직접 붙여 넣기"}</label><textarea id="src-yt" value=${s.youtube} onChange=${e=>set("youtube",e.target.value)} style=${{minHeight:ch?"160px":"110px"}} placeholder=${"예)\n2025.03.02  10분 김치찌개\n2025.03.16  자취생 일주일 장보기"}></textarea></div>
  <div className="reads"><b>읽는 것</b><span>공개 영상 제목·날짜·길이, 업로드 주기</span><b>읽지 않음</b><span>조회수, 구독자 수, 댓글, 수익</span></div>
 </div>`;
}
function Questions({draft,setDraft,onNext,onBack}){
 const set=(i,v)=>setDraft(d=>{const a=[...d.answers];a[i]=v;return {...d,answers:a}});
 return html`<div className="main wrap">
  <${Progress} n=${2}/>
  <div className="stack"><div className="eyebrow">질문 3개 · 선택</div><h1 className="h2">데이터만으로는 알 수 없는 '왜'</h1><p className="muted">30초면 됩니다. 건너뛰어도 괜찮아요.</p></div>
  ${QUESTIONS.map((q,i)=>html`<div className="field" key=${i}><label htmlFor=${"q"+i}>${q}</label><input type="text" id=${"q"+i} value=${draft.answers[i]} onChange=${e=>set(i,e.target.value)} maxLength="160"/></div>`)}
  <div className="row"><button className="btn ghost" onClick=${onBack}>이전</button><button className="btn grow" onClick=${onNext}>기록 읽기 시작</button></div>
 </div>`;
}
const READ_STAGES=["기록을 나누는 중","반복되는 장면을 찾는 중","두드러진 결을 고르는 중","젬을 깎는 중"];
function Reading({status,chars,error,onStop,onRetry,onBack,onDemo}){
 const [t,setT]=useState(0);useEffect(()=>{const id=setInterval(()=>setT(x=>x+1),1000);return()=>clearInterval(id)},[]);
 const stage=chars>0?3:Math.min(2,Math.floor(t/8));
 return html`<div className="main wrap"><div className="reading">
  <${Progress} n=${3}/>
  <div className="pulse"><${GemView} g=${{stone:"수정",light:"번짐",form:"덩이",texture:"유백",hardness:1,grain:0,facets:7}} seed="reading" size=${150}/></div>
  ${error?html`<div className="stack" style=${{alignItems:"center"}}><h1 className="h3">${error.code==="cancelled"?"읽기를 멈췄습니다":"잠시 문제가 생겼어요"}</h1><p className="err" role="alert">${errCopy(error)}</p><div className="row" style=${{justifyContent:"center"}}><button className="btn ghost" onClick=${onBack}>기록 고치기</button>${["ai_not_configured","daily_limit"].includes(error.code)?html`<button className="btn" onClick=${onDemo}>예시로 둘러보기</button>`:html`<button className="btn" onClick=${onRetry}>다시 시도</button>`}</div></div>`:html`
   <h1 className="h2">기록을 읽는 시간</h1>
   <div className="stagelist" aria-live="polite">${READ_STAGES.map((s,i)=>html`<div key=${i} className=${i<stage?"done":i===stage?"on":""}>${i<stage?"✓ ":i===stage?"· ":"  "}${s}</div>`)}</div>
   <p className="note">${status==="consent"?"AI 해석을 허락하는 창이 뜨면 확인해 주세요.":chars>0?`해석을 받는 중 · ${chars.toLocaleString()}자`:"보통 30초에서 1분쯤 걸립니다. 완성 시간은 약속하지 않습니다."}</p>
   <button className="btn ghost sm" onClick=${onStop}>멈추기</button>`}
 </div></div>`;
}
function Reveal({st,onConfirm,onEdit,onDiffer,onOpen}){
 const a=st.analysis;const g=livingGem(st);const [mode,setMode]=useState(a.status?"done":"ask");
 const [sent,setSent]=useState(displaySentence(a));const [kw,setKw]=useState(displayKeywords(a).join(", "));const [fb,setFb]=useState("");
 return html`<div className="main wrap">
  <div className="eyebrow" style=${{textAlign:"center"}}>첫 발견</div>
  <div className="reveal-in"><${GemView} g=${g} seed=${st.createdAt} size=${230}/></div>
  <div className="stack" style=${{textAlign:"center",alignItems:"center"}}>
   <h1 className="h2">${gemName(g)}</h1>
   <p className="serif" style=${{fontSize:"19px",lineHeight:1.6,textWrap:"balance"}}>${displaySentence(a)}</p>
   <div className="kw">${displayKeywords(a).map(k=>html`<span className="chip" key=${k}>${k}</span>`)}${st.visibility.fields.tags&&cardTags(st).map(t=>html`<span className="chip plain tagchip" key=${"t"+t}>${t}</span>`)}</div>
   <${AiLabel} status=${a.status}/>
   ${(a.changed||[]).length>0&&html`<span className="chip gold">이번에 새로 깎인 곳 · ${a.changed.map(c=>`${c.label} ${c.from} → ${c.to}`).join(", ")}</span>`}
   ${a.stoneSuggest&&html`<button className="linkbtn small" onClick=${()=>onOpen("attrs")}>새 색 제안이 있어요 · ${a.stoneSuggest}</button>`}
   <button className="linkbtn" onClick=${()=>onOpen("evidence")}>이렇게 읽은 이유 보기</button>
  </div>
  ${mode==="ask"&&html`<div className="stack"><p className="small muted" style=${{textAlign:"center"}}>이 해석이 나와 맞나요?</p><button className="btn block" onClick=${()=>{onConfirm();setMode("done")}}>맞아요</button><div className="row"><button className="btn ghost grow" onClick=${()=>setMode("edit")}>조금 다듬을게요</button><button className="btn ghost grow" onClick=${()=>setMode("differ")}>나와 달라요</button></div></div>`}
  ${mode==="edit"&&html`<div className="panel stack"><div className="field"><label htmlFor="ed-s">한 문장</label><textarea id="ed-s" value=${sent} onChange=${e=>setSent(e.target.value)} maxLength="90" style=${{minHeight:"80px"}}></textarea></div><div className="field"><label htmlFor="ed-k">키워드 3개 (쉼표로 구분)</label><input type="text" id="ed-k" value=${kw} onChange=${e=>setKw(e.target.value)}/></div><div className="row"><button className="btn ghost" onClick=${()=>setMode("ask")}>취소</button><button className="btn grow" onClick=${()=>{onEdit(sent.trim(),kw.split(",").map(x=>x.trim()).filter(Boolean).slice(0,3));setMode("done")}}>내 말로 저장</button></div></div>`}
  ${mode==="differ"&&html`<div className="panel stack"><div className="field"><label htmlFor="df">무엇이 다른가요?</label><textarea id="df" value=${fb} onChange=${e=>setFb(e.target.value)} placeholder="예) 사진보다 사람들과 함께하는 시간이 더 중요해요"></textarea><span className="hint">이 말을 바탕으로 다시 읽습니다.</span></div><div className="row"><button className="btn ghost" onClick=${()=>setMode("ask")}>취소</button><button className="btn grow" disabled=${!fb.trim()} onClick=${()=>onDiffer(fb.trim())}>다시 읽기</button></div></div>`}
  ${mode==="done"&&html`<div className="stack">
   <div className="todaystep"><div className="eyebrow" style=${{color:"inherit",opacity:.8}}>첫 한 걸음 · ${a.firstStep.minutes}분</div><h2>${a.firstStep.title}</h2>${a.firstStep.why&&html`<p className="why">${a.firstStep.why}</p>`}</div>
   <div className="panel small row"><span style=${{color:"var(--accent)"}}><${Ico} n="lock"/></span><span className="grow">카드는 지금 <b>나만 보기</b>입니다. 공개는 미리보기를 확인한 뒤에만 켤 수 있어요.</span></div>
   <button className="btn block" onClick=${()=>onOpen("home")}>나의 카드로 가기</button>
  </div>`}
 </div>`;
}

/* ───────── home: me ───────── */
function LifeCard({st,items,stats,onOpen,me}){
 const desk=useDesktop();const a=st.analysis;const g=livingGem(st);const [back,setBack]=useState(false);
 const earned=BADGES.filter(b=>isEarned(st,stats,b));const stage=stageOf(st,stats);
 const prev=(st.axesHistory||[]).length?st.axesHistory[st.axesHistory.length-1].axes:null;
 const eq=equipped(st,stats);const show=showcaseBadges(st,stats).map(badgeById);
 return html`<div className=${"lifecard"+(eq.frame?" frame-"+eq.frame:"")} data-age=${g&&g.rings?g.rings:undefined}>
  <div className="row between"><span className="row" style=${{gap:"6px"}}><span className="chip gold">연마 ${stage}단계 · ${STAGES[stage]}</span>${eq.title&&html`<span className="chip plain title-chip">${eq.title}</span>`}</span><span className="row" style=${{gap:"10px"}}><button className="g3-btn" onClick=${()=>onOpen("gem3d")} aria-label="젬 3D로 보기">◇ 3D</button><button className="linkbtn small" onClick=${()=>setBack(b=>!b)} aria-pressed=${back}>${back?"앞면 보기":"뒷면 · 육각형"}</button></span></div>
  ${!back&&desk?html`<div className="lc-split"><div className="lc-gem">
   <${ZodiacSky} z=${myZodiac(st)} size=${210}/>
   <${GemView} g=${g} seed=${st.createdAt} size=${210}/>
   <div className="gemname">${gemName(g)}</div>
   ${(()=>{const I=gemIdentity(g,st.createdAt);return html`<div className="gemfeat"><span className="gf-id">${I.rareVariant?"✦ ":""}${I.variant} · ${I.cut}${I.pattern?" · "+I.pattern:""}</span>${I.feats.map(k=>html`<span key=${k} title=${INCLUSIONS[k].desc}>✧ ${INCLUSIONS[k].name}</span>`)}${(I.aw||[]).map(x=>html`<span key=${x.k} className=${"aw t"+x.t} title=${AW_TIERS[x.t][0]+" 발현 · 연마 "+x.at+"단계"}>✺ ${x.n}</span>`)}</div>`})()}
   <button className="linkbtn small" onClick=${()=>onOpen("gemwhy")}>왜 이런 모양일까 ›</button>
  </div><div className="lc-story"><span className="eyebrow">THE STORY OF</span>
   <div className="lc-who">${me&&html`<${Avatar} p=${me} size=${46}/>`}<b className="serif">${(me&&me.nickname)||"나"}</b><span>의 결</span></div>
   <p className="sentence">${displaySentence(a)}</p>
   <div className="kw">${displayKeywords(a).map(k=>html`<span className="chip" key=${k}>${k}</span>`)}${st.visibility.fields.tags&&cardTags(st).map(t=>html`<span className="chip plain tagchip" key=${"t"+t}>${t}</span>`)}</div>
   <${AiLabel} status=${a.status}/>
   <${CrestShelf} st=${st} onOpen=${onOpen}/>

  </div></div>`:!back?html`<div className="stack" style=${{alignItems:"center"}}>
   <${ZodiacSky} z=${myZodiac(st)} size=${210}/>
   <${GemView} g=${g} seed=${st.createdAt} size=${210}/>
   <div className="gemname">${gemName(g)}</div>
   ${(()=>{const I=gemIdentity(g,st.createdAt);return html`<div className="gemfeat"><span className="gf-id">${I.rareVariant?"✦ ":""}${I.variant} · ${I.cut}${I.pattern?" · "+I.pattern:""}</span>${I.feats.map(k=>html`<span key=${k} title=${INCLUSIONS[k].desc}>✧ ${INCLUSIONS[k].name}</span>`)}${(I.aw||[]).map(x=>html`<span key=${x.k} className=${"aw t"+x.t} title=${AW_TIERS[x.t][0]+" 발현 · 연마 "+x.at+"단계"}>✺ ${x.n}</span>`)}</div>`})()}
   <button className="linkbtn small" onClick=${()=>onOpen("gemwhy")}>왜 이런 모양일까 ›</button>
   <p className="sentence">${displaySentence(a)}</p>
   <div className="kw">${displayKeywords(a).map(k=>html`<span className="chip" key=${k}>${k}</span>`)}${st.visibility.fields.tags&&cardTags(st).map(t=>html`<span className="chip plain tagchip" key=${"t"+t}>${t}</span>`)}</div>
   <${AiLabel} status=${a.status}/>
   <${CrestShelf} st=${st} onOpen=${onOpen}/>

  </div>`:html`<div className="stack" style=${{alignItems:"center"}}>
   <div className="eyebrow">나만의 육각형</div>
   <${Hexagon} axes=${visibleAxes(a)} prev=${prev} size=${290}/>
   <div className="legend"><span><i></i>지금의 나</span>${prev&&html`<span><i className="dash"></i>지난 나</span>`}</div>
   <p className="note" style=${{textAlign:"center"}}>여섯 축은 사람마다 다릅니다. 눈금은 기록에서 드러난 정도이며 능력 점수가 아니고, 오직 나의 지난 모습과만 겹쳐 봅니다.</p>
  </div>`}
  <div className="card-foot">
   <span className=${"chip"+(st.visibility.public?"":" plain")}><${Ico} n=${st.visibility.public?"globe":"lock"}/>${st.visibility.public?(st.visibility.audience==="friends"?"친구 공개":"1기 공개"):"나만 보기"}</span>
   <button className="minibadges linkbtn" onClick=${()=>onOpen("badgebox")} aria-label=${"대표 배지: "+(show.map(b=>b.name).join(", ")||"없음")+" · 배지 보관함 열기"}>${show.map(b=>html`<${Medal} key=${b.id} b=${b} earned=${true} frame=${b.g==="지속"?frameOf(stats.days):0} size=${30}/>`)}${!show.length&&html`<span className="small faint">배지 보관함</span>`}</button</div>
  </div>
 </div>`;
}
function MeTab({st,items,soc,stats,onOpen,names,top,mid,me}){
 const desk=useDesktop();
 const featured=items.filter(i=>(st.featured||[]).includes(i.id)).slice(0,4);
 const rows=[["evidence","눈","이렇게 읽은 이유","사실과 AI 해석을 나눠 보고, 맞다·숨기기"],["attrs","별","젬의 8가지 속성","결·색·빛·형·질·강·상·각"],["shelf","선반","나의 선반",`실제로 가진 것 ${items.length}개 · 얼마나 함께했는가`],["publish","문","공개할 모습",st.visibility.public?(st.visibility.audience==="friends"?"친구에게 공개 중":"CBT 1기에 공개 중")+" · 항목별로 고르기":"지금은 나만 보기"],["reread","새싹","새 기록 더하기",`나를 다시 읽기 · 지금까지 ${st.analyses||1}번`]];
 const achN=earnedIds(st,stats).length;rows.splice(2,0,["achieve","별","업적 도감 · 배지 보관함",`배지 ${achN}/${BADGES.length} · 칭호와 대표 배지 고르기`]);rows.splice(3,0,["identity","왕관","나의 휘장",(()=>{const I=idStats(st);return I.total?`휘장 ${I.total}개 · 진열 ${I.shown}/${ID_MAX_SHOW} · 뿌리·터전·배움·소속·영예·조명`:"뿌리·터전·배움·소속·영예·조명을 새겨 진열하기"})()]);
 return html`<div className="main wrap">
  ${top}
  <${LifeCard} st=${st} items=${items} stats=${stats} onOpen=${onOpen} me=${me}/>
  <button className="btn block cardview-btn" onClick=${()=>onOpen("cardview")}><span aria-hidden="true">✦</span> 카드 보기 · 앞면과 뒷면</button>
  <div className="row"><button className="btn quiet sm grow" onClick=${()=>onOpen("cardimg")}><${Ico} n="share"/>카드 이미지 저장</button><button className="btn quiet sm grow" onClick=${()=>onOpen("mine")}><${Ico} n="chat"/>받은 공감 ${stats.reactionsReceived+stats.wordsReceived}</button></div>
  ${(()=>{const ns=nextStage(st,stats);if(!ns)return html`<p className="note" style=${{textAlign:"center"}}>명품 단계에 이르렀어요.</p>`;const DT={3:3,4:5,5:7};const tgt=DT[ns.to];const cur=tgt?Math.min(stats.active,tgt):(stats.confirmed?1:0);const max=tgt||1;const pct=Math.round(cur/max*100);
   return html`<div className="nextcard"><div className="row between"><span className="eyebrow">LITTLE DAYS, NEW FACETS</span><span className="chip plain">연마 ${ns.to-1}단계</span></div><b className="serif nc-title">다음 변화는, ${tgt?`활동 ${tgt}일에.`:`${ns.need}에서.`}</b><span className="small muted">${ns.need} · 단계가 오르면 젬이 더 커지고 맑아지며, 무엇이 깨어날지 몰라요.</span><div className="nc-bar"><i style=${{width:pct+"%"}}></i></div><div className="row between small faint"><span>지금까지 ${tgt?`활동 ${stats.active}일`:cur?"확인함":"아직"}</span><span>${ns.name} 단계까지 ${tgt?Math.max(0,tgt-stats.active)+"일":"한 걸음"}</span></div></div>`})()}
  <${MarksPanel} st=${st} stats=${stats}/>
  ${mid}
  ${featured.length>0&&html`<div className="stack"><div className="row between"><h2 className="h3">대표 아이템</h2><button className="linkbtn small" onClick=${()=>onOpen("shelf")}>선반 열기</button></div><div className="shelf feat">${featured.map(i=>html`<${ItemTile} key=${i.id} item=${i} featured=${true} onClick=${()=>onOpen("item:"+i.id)}/>`)}</div></div>`}
  ${soc.wordsTo.length>0&&html`<div className="stack"><h2 className="h3">사람들이 건넨 한 단어</h2><div className="wordchips">${soc.wordsTo.map((w,i)=>html`<span className="chip gold" key=${i} title=${(names[w.from_id]||{}).nickname||""}>${w.word}</span>`)}</div></div>`}
  <div className="list">${rows.map(([k,gl,t,d])=>html`<button key=${k} className="list-row" onClick=${()=>onOpen(k)}><span className="ico"><${Glyph} name=${gl} size=${19}/></span><span className="grow"><span className="t">${t}</span><br/><span className="d">${d}</span></span><span className="chev">›</span></button>`)}</div>
  ${!desk&&typeof UPDATES!=="undefined"&&html`<div className="list"><button className="list-row upd-row" onClick=${()=>onOpen("updates")}><span className="ico"><${Glyph} name="새싹" size=${19}/></span><span className="grow"><span className="t">업데이트 소식${hasNewUpdate(st)&&html` <span className="upd-new">NEW</span>`}</span><br/><span className="d">${latestUpdate().date} · ${latestUpdate().title}</span></span><span className="chev">›</span></button></div>`}
 </div>`;
}
function EvidenceSheet({st,update,onClose}){
 const a=st.analysis;const hidden=a.hiddenAxes||[];const ok=a.axisOk||[];const [editing,setEditing]=useState(null);const [nm,setNm]=useState("");
 const src=st.sources;const used=[["이야기",src.story],["유튜브",src.youtube],["캘린더",src.calendar]].filter(x=>(x[1]||"").trim());
 const setAx=(fn)=>update(s=>{fn(s.analysis);s.flags.edited=true});
 return html`<${Sheet} title="이렇게 읽은 이유" onClose=${onClose}>
  <div className="panel small stack"><b>읽은 기록</b><div className="row">${used.map(([k,v])=>html`<span className="chip plain" key=${k}>${k} · ${v.trim().length.toLocaleString()}자</span>`)}${src.photos?html`<span className="chip plain">사진 ${src.photos}장 (저장 안 함)</span>`:null}</div><span className="faint">${src.at?new Date(src.at).toLocaleDateString("ko-KR")+"에 읽음":""}</span></div>
  <p className="small muted"><span className="tag">사실</span>기록에 실제로 있던 것 · <span className="tag" style=${{color:"var(--gold)",borderColor:"var(--gold)"}}>AI 해석</span>그 사실을 읽은 방식</p>
  <div className="stack-lg">${a.axes.map((x,i)=>{const isH=hidden.includes(i);return html`<div className="axis" key=${i}>
   <div className="row between"><h3>${x.name}</h3>${x.level==null?html`<span className="chip plain">아직 발견 중</span>`:ok.includes(i)?html`<span className="chip">내가 확인함</span>`:null}</div>
   ${isH?html`<p className="small faint">숨긴 결입니다. 카드와 육각형에 보이지 않습니다.</p>`:html`
    ${x.evidence.map((e,j)=>html`<div className="evi" key=${j}><span className="tag">사실</span><span>${e}</span></div>`)}
    ${x.reading&&html`<div className="evi"><span className="tag" style=${{color:"var(--gold)",borderColor:"var(--gold)"}}>AI 해석</span><span>${x.reading}</span></div>`}`}
   ${editing===i?html`<div className="row"><input type="text" aria-label="결 이름" value=${nm} onChange=${e=>setNm(e.target.value)} maxLength="8" style=${{flex:1}}/><button className="btn sm" onClick=${()=>{if(nm.trim())setAx(an=>{an.axes[i].name=nm.trim()});setEditing(null)}}>저장</button></div>`:html`<div className="row">
    ${!isH&&x.level!=null&&!ok.includes(i)&&html`<button className="btn quiet sm" onClick=${()=>update(s=>{s.analysis.axisOk=[...(s.analysis.axisOk||[]),i]})}>맞아요</button>`}
    <button className="btn ghost sm" onClick=${()=>{setEditing(i);setNm(x.name)}}>이름 다듬기</button>
    <button className="btn ghost sm" onClick=${()=>update(s=>{const h=s.analysis.hiddenAxes||[];s.analysis.hiddenAxes=isH?h.filter(x=>x!==i):[...h,i]})}>${isH?"다시 보이기":"숨기기"}</button></div>`}
  </div>`})}</div>
  ${(a.turningPoints||[]).length>0&&html`<div className="panel stack small"><b>젬의 금빛 결 — 기록에서 보인 전환점</b>${a.turningPoints.map((t,i)=>html`<span key=${i}>· ${t}</span>`)}</div>`}
 <//>`;
}
function AttrsSheet({st,update,onClose}){
 const a=st.analysis;const g=livingGem(st);const r=a.gem.reasons||{};
 const val={"결":`금빛 결 ${g.grain}줄`,"색":`${g.stone}${a.gem.value?" · "+a.gem.value:""}`,"빛":`${g.lightName} · ${g.light}`,"형":g.form,"질":g.texture,"강":`${g.hardness} / 5`,"상":g.symbol,"각":`${g.facets}면`};
 const growth={"결":st.steps.comebacks?`다시 시작한 순간 ${st.steps.comebacks}번이 더해졌어요`:"",
  "강":`한 걸음 ${st.steps.done.length}일이 쌓였어요`,"각":(st.analyses||1)>1?`새 관점 ${st.analyses-1}번이 더해졌어요`:""};
 return html`<${Sheet} title="젬의 8가지 속성" onClose=${onClose}>
  <${GemView} g=${g} seed=${st.createdAt} size=${200}/>
  <p className="small muted" style=${{textAlign:"center"}}>모든 젬은 같은 크기와 같은 밝기로 그려집니다. 다른 것은 모양과 결이고, 좋고 나쁜 값은 없습니다.</p>
  ${a.stoneSuggest&&a.stoneSuggest!==g.stone&&html`<div className="panel tint stack small"><span>다시 읽어 보니 <b>${a.stoneSuggest}</b>(${STONES[a.stoneSuggest].meaning})의 결이 짙어졌어요. 젬의 색을 바꿀까요?</span><div className="row"><button className="btn sm" onClick=${()=>{update(x=>{x.gemOverride={...x.gemOverride,stone:x.analysis.stoneSuggest};x.analysis.stoneSuggest=null;x.flags.celebrate=true});track("stone_accept")}}>${a.stoneSuggest}로 바꾸기</button><button className="btn ghost sm" onClick=${()=>{update(x=>{x.analysis.stoneSuggest=null});track("stone_keep")}}>지금 색 그대로</button></div></div>`}
  <div>${ATTRS.map(t=>html`<div className="attr" key=${t.k}>
   <div className="k">${t.k}${t.h&&html`<small>${t.h}</small>`}</div>
   <div className="stack" style=${{gap:"4px"}}>
    <div className="row between"><span className="v">${val[t.k]}</span><span className="faint small">${t.speed}</span></div>
    <span className="small muted">${t.mean} — ${t.look}</span>
    ${r[t.k]&&html`<span className="small"><span className="tag">근거</span>${r[t.k]}</span>`}
    ${(a.gem.basis||{})[t.k]&&html`<span className="small faint"><span className="tag">계산</span>${a.gem.basis[t.k]}</span>`}
    ${growth[t.k]&&html`<span className="small" style=${{color:"var(--gold)"}}>${growth[t.k]}</span>`}
    ${t.k==="색"&&html`<div className="picker" role="group" aria-label="돌 고르기">${STONE_NAMES.map(s=>html`<button key=${s} aria-pressed=${g.stone===s} onClick=${()=>update(x=>{x.gemOverride={...x.gemOverride,stone:s}})}>${s}</button>`)}</div>`}
    ${t.k==="상"&&html`<div className="picker" role="group" aria-label="상 고르기">${SYMBOLS.map(s=>html`<button key=${s} aria-pressed=${g.symbol===s} onClick=${()=>update(x=>{x.gemOverride={...x.gemOverride,symbol:s}})}>${s}</button>`)}</div>`}
   </div></div>`)}</div>
  ${Object.keys(st.gemOverride||{}).length>0&&html`<button className="linkbtn" onClick=${()=>update(x=>{x.gemOverride={}})}>AI가 고른 색과 상으로 되돌리기</button>`}
 <//>`;
}

/* ───────── shelf ───────── */
const CATS=[["장비","카메라"],["자격","자격"],["반려","발자국"]];
function ItemTile({item,featured,onClick}){
 const gl=item.glyph||(CATS.find(c=>c[0]===item.category)||[0,"선반"])[1];
 return html`<button className="item" onClick=${onClick}><div className="ph">${(item.thumbUrl||item.photo)?html`<img src=${item.thumbUrl||item.photo} alt=${item.name}/>`:html`<${Glyph} name=${gl} size=${44}/>`}${featured&&html`<span className="star">대표</span>`}${item.private&&html`<span className="star lock" title="공개 선반에서 숨김">숨김</span>`}</div><div className="meta"><b>${item.name}</b><span>${item.category} · ${sinceText(item.since)||"기간 미정"}</span><span>${item.verify||"내가 적은 이야기"}</span></div></button>`;
}
function ShelfSheet({st,items,onOpen,onClose}){
 const [cat,setCat]=useState("전체");const list=items.filter(i=>cat==="전체"||i.category===cat);
 return html`<${Sheet} title="나의 선반" onClose=${onClose}>
  <p className="serif" style=${{color:"var(--accent)",fontSize:"17px"}}>"얼마짜리인가"가 아니라 "얼마나 함께했는가".</p>
  <p className="small muted">실제로 가지고, 쓰고, 돌보는 것을 담습니다. 가격·시세 칸은 없고, 소유물은 젬의 크기나 밝기에 반영되지 않습니다.</p>
  <div className="panel tint small row between" style=${{alignItems:"center"}}><span>${st.visibility.public&&st.visibility.fields.shelf?html`<b>선반 공개 중</b> · ${items.filter(i=>!i.private).length}개 보임${items.some(i=>i.private)?` · ${items.filter(i=>i.private).length}개 숨김`:""}`:html`<b>선반은 나만 보기</b> · 카드 공개 설정에서 켤 수 있어요`}</span><button className="linkbtn small" onClick=${()=>onOpen("publish")}>공개 설정</button></div>
  <div className="segs" role="group" aria-label="카테고리">${["전체","장비","자격","반려"].map(c=>html`<button key=${c} aria-pressed=${cat===c} onClick=${()=>setCat(c)}>${c}</button>`)}</div>
  ${list.length?html`<div className="shelf">${list.map(i=>html`<${ItemTile} key=${i.id} item=${i} featured=${(st.featured||[]).includes(i.id)} onClick=${()=>onOpen("item:"+i.id)}/>`)}</div>`:html`<div className="panel tint small">아직 담은 아이템이 없습니다. 오래 쓴 카메라, 함께 사는 반려견, 준비해서 딴 자격증처럼 나와 함께한 것을 하나 담아 보세요.</div>`}
  <button className="btn block" onClick=${()=>onOpen("item:new")}>아이템 담기</button>
  <p className="note">CBT에서는 장비·자격·반려 세 카테고리를 엽니다. 공간·이동·컬렉션·디지털 자산·기억의 물건은 다음 버전에서 열립니다.</p>
 <//>`;
}
function ItemEditor({item,st,canAI,onSave,onDelete,onClose,toast,demo}){
 const isNew=!item;const [f,setF]=useState(item?{...item,photo:item.photoUrl||""}:{id:"item-"+rid(),name:"",category:"장비",since:"",story:"",photo:"",thumb:"",verify:"내가 적은 이야기",at:Date.now()});
 const [file,setFile]=useState(null);const [busy,setBusy]=useState(false);const [ai,setAi]=useState(null);const [confirmDel,setConfirmDel]=useState(false);
 const featured=(st.featured||[]).includes(f.id);
 const imgOk=canAI;
 async function pick(e){const fl=e.target.files&&e.target.files[0];e.target.value="";if(!fl)return;setBusy(true);try{const photo=await compressImage(fl,720,.74);const thumb=await compressImage(fl,200,.7);const fresh=Date.now()-(fl.lastModified||0)<10*60*1000;setF(x=>({...x,photo,thumb,verify:fresh?"사진 인증 · 방금 촬영":"사진 첨부"}));setFile(fl)}catch(err){toast("사진을 읽지 못했습니다. 다른 사진을 골라 주세요.")}finally{setBusy(false)}}
 async function recognize(){if(!file)return;setBusy(true);setAi(null);try{const img=await imageForAI(file);const j=await api.aiJSON({task:"quick",images:[img],prompt:`사진 속 물건(또는 반려동물·자격증) 하나를 보고 다음 JSON으로만 답한다: {"name":"짧은 이름, 브랜드·모델은 확실할 때만","category":"장비|자격|반려 중 하나","why":"그렇게 본 이유 한 줄"}. 사람 얼굴, 번호판, 주소, 증서 번호는 언급하지 않는다. 가격이나 시세는 말하지 않는다.`});track("item_ai");const cat=["장비","자격","반려"].includes(j.category)?j.category:f.category;setAi({name:String(j.name||"").slice(0,30),category:cat,why:String(j.why||"").slice(0,100)})}catch(e){toast(errCopy(e))}finally{setBusy(false)}}
 const valid=f.name.trim().length>0;
 return html`<${Sheet} title=${isNew?"아이템 담기":"아이템"} onClose=${onClose}>
  <label className="photo-pick" htmlFor="item-photo-lib">${f.photo?html`<img src=${f.photo} alt=${f.name||"아이템 사진"}/><span className="photo-badge">사진 바꾸기</span>`:html`<span className="small">${busy?"사진을 준비하는 중…":"눌러서 사진 고르기"}<br/><span className="faint">위치 정보는 지워져 저장됩니다</span></span>`}</label>
  <input type="file" id="item-photo-lib" className="sr-only" accept="image/*" onChange=${pick} disabled=${demo}/>
  <input type="file" id="item-photo" className="sr-only" accept="image/*" capture="environment" onChange=${pick} disabled=${demo}/>
  <div className="row"><label className="btn quiet sm grow" htmlFor="item-photo">📷 사진 찍기</label><label className="btn quiet sm grow" htmlFor="item-photo-lib">🖼 앨범에서</label>${f.photo&&html`<button className="btn ghost sm" onClick=${()=>{setF(x=>({...x,photo:"",thumb:"",photoPath:null,thumbPath:null,verify:"내가 적은 이야기",_removePhoto:true}));setFile(null)}}>사진 빼기</button>`}</div>
  ${imgOk&&file&&html`<button className="btn quiet" disabled=${busy} onClick=${recognize}>${busy?"알아보는 중…":"AI로 알아보기"}</button>`}
  ${ai&&html`<div className="panel small stack"><span><span className="ai-label"><i></i>AI 추정</span> ${ai.category} · <b>${ai.name}</b></span><span className="muted">${ai.why}</span><div className="row"><button className="btn sm" onClick=${()=>{setF(x=>({...x,name:ai.name||x.name,category:ai.category}));setAi(null)}}>이렇게 적기</button><button className="btn ghost sm" onClick=${()=>setAi(null)}>아니에요</button></div></div>`}
  <div className="field"><span className="lbl">카테고리</span><div className="segs" role="group" aria-label="카테고리">${CATS.map(([c])=>html`<button key=${c} aria-pressed=${f.category===c} onClick=${()=>setF(x=>({...x,category:c}))}>${c}</button>`)}</div></div>
  <div className="field"><label htmlFor="it-name">이름</label><input type="text" id="it-name" value=${f.name} maxLength="30" onChange=${e=>setF(x=>({...x,name:e.target.value}))} placeholder="예) 필름 카메라, 반려견 솜이, 정보처리기사"/></div>
  <div className="field"><label htmlFor="it-since">함께하기 시작한 때</label><input type="month" id="it-since" value=${f.since} onChange=${e=>setF(x=>({...x,since:e.target.value}))}/>${f.since&&html`<span className="hint">${sinceText(f.since)}</span>`}</div>
  <div className="field"><label htmlFor="it-story">사연 한 줄</label><input type="text" id="it-story" value=${f.story} maxLength="60" onChange=${e=>setF(x=>({...x,story:e.target.value}))} placeholder="예) 아버지께 물려받아 첫 출사를 함께한 카메라"/></div>
  <label className="checkline"><input type="checkbox" id="it-feat" checked=${featured} onChange=${e=>onSave(f,{feature:e.target.checked},true)} disabled=${isNew||demo}/><span><b>대표 아이템</b><br/><span className="small muted">카드 아래와 공개 카드에 최대 4개까지 보입니다.</span></span></label>
  <label className="checkline"><input type="checkbox" id="it-private" checked=${!!f.private} onChange=${e=>setF(x=>({...x,private:e.target.checked}))} disabled=${demo}/><span><b>공개 선반에서 숨기기</b><br/><span className="small muted">선반을 공개해도 이 아이템은 나만 봅니다. 저장을 눌러야 반영돼요.</span></span></label>
  <div className="panel tint small">인증 표시 · <b>${f.verify}</b><br/><span className="muted">이번 CBT는 '내가 적은 이야기'와 '사진 첨부', 방금 찍은 사진이면 '사진 인증'까지 표시합니다. 서류·기관 인증은 다음 버전입니다.</span></div>
  <button className="btn block" disabled=${!valid||busy||demo} onClick=${()=>onSave({...f,name:f.name.trim(),story:f.story.trim(),at:f.at||Date.now(),photo:(f.photo||"").startsWith("data:")?f.photo:"",thumb:(f.thumb||"").startsWith("data:")?f.thumb:""},{},false)}>${demo?"예시 모드에서는 저장하지 않습니다":isNew?"선반에 담기":"저장"}</button>
  ${!isNew&&!demo&&(confirmDel?html`<div className="panel stack"><span>이 아이템을 선반에서 지울까요? 되돌릴 수 없습니다.</span><div className="row"><button className="btn ghost grow" onClick=${()=>setConfirmDel(false)}>취소</button><button className="btn danger grow" onClick=${()=>onDelete(f.id)}>지우기</button></div></div>`:html`<button className="btn ghost block" onClick=${()=>setConfirmDel(true)}>선반에서 빼기</button>`)}
 <//>`;
}

/* ───────── publish ───────── */
/* per-item: show or hide on the shared shelf */
function ShelfPicker({items,onToggle}){
 if(!items.length)return html`<div className="tag-editor small faint">선반에 담은 아이템이 아직 없어요.</div>`;
 return html`<div className="tag-editor stack small"><span className="muted">탭해서 보이기/숨기기 · 숨긴 아이템은 나만 봅니다</span><div className="shelf-pick">${items.map(i=>html`<button key=${i.id} className=${"sp-item"+(i.private?" off":"")} aria-pressed=${!i.private} onClick=${()=>onToggle&&onToggle(i,!i.private)}><span className="sp-ph">${i.thumbUrl?html`<img src=${i.thumbUrl} alt=""/>`:html`<${Glyph} name=${(CATS.find(c=>c[0]===i.category)||[0,"선반"])[1]} size=${22}/>`}</span><span className="sp-nm">${i.name}</span><span className="sp-st">${i.private?"숨김":"보임"}</span></button>`)}</div></div>`;
}
function SharedShelf({owner,name,bare,like}){
 const [list,setList]=useState(null);const [open,setOpen]=useState(null);
 useEffect(()=>{let alive=true;api.sharedShelf(owner).then(r=>alive&&setList(r)).catch(()=>alive&&setList([]));return()=>{alive=false}},[owner]);
 if(list===null)return html`<p className="small faint">선반을 불러오는 중…</p>`;
 if(!list.length)return null;
 const it=open&&list.find(i=>i.id===open);
 return html`<div className="stack" style=${{gap:"8px"}}>${!bare&&html`<h3 className="h3">${name}님의 선반 <span className="small faint">${list.length}</span></h3>`}<div className="shelf">${list.map(i=>html`<${ItemTile} key=${i.id} item=${i} onClick=${()=>{setOpen(i.id);track("view_shared_item")}}/>`)}</div>
  ${it&&html`<${Sheet} title=${it.name} onClose=${()=>setOpen(null)}><div className="stack">
   ${it.photoUrl||it.thumbUrl?html`<img className="item-photo-lg" src=${it.photoUrl||it.thumbUrl} alt=${it.name}/>`:html`<div className="item-photo-lg ph-empty"><${Glyph} name=${(CATS.find(c=>c[0]===it.category)||[0,"선반"])[1]} size=${64}/></div>`}
   <div className="row" style=${{gap:"6px"}}><span className="chip">${it.category}</span>${it.since&&html`<span className="chip plain">${sinceText(it.since)}</span>`}<span className="chip plain">${it.verify||"내가 적은 이야기"}</span></div>
   ${it.story?html`<p className="serif" style=${{fontSize:"17px",lineHeight:1.7}}>${it.story}</p>`:html`<p className="small faint">사연은 아직 적지 않았어요.</p>`}
   ${like&&html`<div className="row" style=${{justifyContent:"flex-end"}}>${like(it)}</div>`}
  </div><//>`}
 </div>`;
}
/* MBTI·blood type the person chose in quick start (only complete answers) */
function cardTags(st){const a=(st&&st.quick&&st.quick.answers)||{};const t=[];if(typeof a.mbti==="string"&&/^[EI][NS][FT][JP]$/.test(a.mbti))t.push(a.mbti);if(["A형","B형","O형","AB형"].includes(a.blood))t.push(a.blood);return t}
function TagEditor({st,update}){const a=(st.quick&&st.quick.answers)||{};const m=typeof a.mbti==="string"&&a.mbti.length===4?a.mbti.split(""):[null,null,null,null];
 const setAns=(k,v)=>update(s=>{s.quick=s.quick||{};s.quick.answers={...(s.quick.answers||{}),[k]:v}});
 const setM=(i,c)=>{const n=[...m];n[i]=n[i]===c?null:c;setAns("mbti",n.every(Boolean)?n.join(""):n.map(x=>x||"·").join(""))};
 return html`<div className="tag-editor stack small"><span className="muted">카드에 붙일 태그 · 탭해서 고르거나 바꾸세요 (해석에는 쓰지 않아요)</span>
  <div className="row" style=${{gap:"6px",flexWrap:"wrap"}}>${[["E","I"],["N","S"],["F","T"],["J","P"]].map((pair,i)=>html`<span key=${i} className="segs mini">${pair.map(c=>html`<button key=${c} aria-pressed=${m[i]===c} onClick=${()=>setM(i,c)}>${c}</button>`)}</span>`)}</div>
  <div className="segs mini">${["A형","B형","O형","AB형"].map(b=>html`<button key=${b} aria-pressed=${a.blood===b} onClick=${()=>setAns("blood",a.blood===b?null:b)}>${b}</button>`)}</div>
  ${!cardTags(st).length&&html`<span className="faint">MBTI 네 글자나 혈액형 중 하나 이상 고르면 카드에 보여요.</span>`}
  <${BirthPicker} st=${st} update=${update}/>
 </div>`}
function buildPublicCard(st,items,stats){
 const fl=st.visibility.fields;const a=st.analysis;const g=livingGem(st);
 const card={v:1,updatedAt:Date.now(),gem:(x=>fl.crests===false?(({idm,...r})=>r)(x):x)(fl.tags?g:(({rings,...r})=>r)(g||{})),gemName:gemName(g),stage:stageOf(st,stats),
  sentence:fl.sentence?displaySentence(a):"",keywords:fl.keywords?displayKeywords(a):[],
  axes:fl.hexagon?visibleAxes(a).map(x=>({name:x.name,level:x.level})):visibleAxes(a).map(x=>({name:x.name})),
  showHex:!!fl.hexagon,badgesAll:fl.badges?earnedIds(st,stats).filter(id=>fl.tags||(badgeById(id)||{}).g!=="연륜"):[],badges:fl.badges?showcaseBadges(st,stats,12).filter(id=>fl.tags||(badgeById(id)||{}).g!=="연륜").slice(0,8):[],...(()=>{const e=equipped(st,stats);const src=id=>BADGES.find(b=>b.title===id);const hideT=!fl.tags&&e.title&&(src(e.title)||{}).g==="연륜";return {title:hideT?"":e.title,frame:!fl.tags&&e.frame==="ring"?"":e.frame}})(),
  shelf:fl.shelf?items.filter(i=>!i.private).length:0,
  items:fl.items?items.filter(i=>(st.featured||[]).includes(i.id)).slice(0,4).map(i=>({name:i.name,category:i.category,since:i.since||"",story:i.story||"",verify:i.verify||""})):[],
  acceptWords:!!fl.words,tags:fl.tags?cardTags(st):[],crests:fl.crests!==false?shownCrests(st).map(publicCrest):[],motto:fl.crests!==false?idLine(st):"",mottoOwn:!!((st.identity||{}).motto||"").trim(),zodiac:fl.tags&&myZodiac(st)?myZodiac(st).k:null};
 return card;
}
function PublicCardView({card,name,compact,who}){
 return html`<div className=${"person"+(card.frame?" frame-"+card.frame:"")}><div className="person-head"><${GemView} g=${card.gem} seed=${card.gemName} size=${compact?64:84}/><div className="grow"><b className="serif" style=${{color:"var(--accent)",fontSize:"17px"}}>${card.gemName}</b><br/><span className="small faint whoname">${who?html`<${Avatar} p=${who} size=${22}/>`:null}${card.title?card.title+" ":""}${name||"MIB 사용자"} · 연마 ${card.stage||1}단계</span></div></div>
  ${!compact&&card.gem&&(()=>{const I=gemIdentity(card.gem,card.gemName);return html`<div className="gemfeat" style=${{justifyContent:"flex-start"}}><span className="gf-id">${I.rareVariant?"✦ ":""}${I.variant} · ${I.cut}</span>${(I.aw||[]).filter(x=>x.t>=2).map(x=>html`<span key=${x.k} className=${"aw t"+x.t}>✺ ${x.n}</span>`)}</div>`})()}
  ${card.sentence&&html`<p className="serif" style=${{fontSize:"15.5px",lineHeight:1.6}}>${card.sentence}</p>`}
  ${((card.keywords||[]).length>0||(card.tags||[]).length>0||card.zodiac)&&html`<div className="row">${(card.keywords||[]).map(k=>html`<span className="chip" key=${k}>${k}</span>`)}${(card.tags||[]).map(t=>html`<span className="chip plain tagchip" key=${"t"+t}>${t}</span>`)}${zodiacByKey(card.zodiac)&&html`<span className="chip plain tagchip zchip-c"><span aria-hidden="true">${zodiacByKey(card.zodiac).sym+"\uFE0E"}</span> ${zodiacByKey(card.zodiac).ko}</span>`}</div>`}
  ${!compact&&html`<${PublicCrests} card=${card}/>`}
  ${card.showHex&&!compact&&html`<${Hexagon} axes=${card.axes} size=${240}/>`}
  ${(card.items||[]).length>0&&!compact&&html`<div className="row">${card.items.map((i,k)=>html`<span className="chip plain" key=${k}>${i.category} · ${i.name}${i.since?" · "+sinceText(i.since).replace("함께한 지 ",""):""}</span>`)}</div>`}
  ${(card.badges||[]).length>0&&!compact&&html`<div className="minibadges">${card.badges.slice(0,6).map(id=>{const b=BADGES.find(x=>x.id===id);return b?html`<${Medal} key=${id} b=${b} earned=${true} size=${30}/>`:null})}</div>`}
 </div>`;
}
function PublishSheet({st,items,stats,update,onClose,toast,demo,meName,uid,me,onItemPrivate}){
 const fl=st.visibility.fields;const [seen,setSeen]=useState(false);const [busy,setBusy]=useState(false);
 const card=buildPublicCard(st,items,stats);const can=!demo;const aud=st.visibility.audience||"all";
 const setF=(k,v)=>update(s=>{s.visibility.fields[k]=v});
 async function publish(on){setBusy(true);try{if(on){await api.publishCard(uid,card,aud)}else{await api.unpublishCard(uid)}const first=on&&!st.visibility.public;update(s=>{s.visibility.public=on});track(on?"publish":"unpublish",{aud});if(first)api.postFeed("publish",{aud});toast(on?"카드를 공개했습니다.":"공개를 멈췄습니다. 이제 나만 봅니다.")}catch(e){toast("공개 상태를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.")}finally{setBusy(false)}}
 const OPTS=[["sentence","한 문장","AI 해석 문장, 또는 내가 다듬은 문장"],["keywords","키워드","세 단어"],["hexagon","육각형 눈금","축 이름은 늘 보이고, 눈금은 고를 때만"],["badges","배지","받은 배지 목록"],["items","대표 아이템 요약","카드 안에 이름·기간·사연만 (사진 없이)"],["shelf","선반 공개","사진과 사연까지 선반 전체를 보여 줘요. 아래에서 숨길 아이템을 고르세요"],["words","한 단어 추천사 받기","사람들이 나에게 한 단어를 남길 수 있음"],["tags","MBTI·혈액형·별자리·연륜","공개 카드와 카드 이미지에 태그·별자리와 젬의 연륜 결을 함께 보여요 (나이 숫자는 어디에도 나오지 않아요)"],["crests","나의 휘장","진열한 휘장과 대표 한 줄, 젬의 월계관·조명·뿌리·깃발 (터전은 시·구까지만)"]];
 return html`<${Sheet} title="공개할 모습" onClose=${onClose}>
  <p className="muted small">처음엔 모두 비공개입니다. 젬과 보석 이름은 공개 카드의 기본이고, 나머지는 항목별로 고릅니다. 원본 기록과 근거는 공개되지 않습니다.</p>
  <div className="field"><span className="lbl">누구에게 보일까요?</span><div className="segs" role="group" aria-label="공개 범위">${[["all","CBT 1기 전체"],["friends","친구만"]].map(([k,t])=>html`<button key=${k} aria-pressed=${aud===k} onClick=${()=>update(s=>{s.visibility.audience=k})}>${t}</button>`)}</div><span className="hint">${aud==="all"?"함께 테스트하는 1기 참여자 누구나 볼 수 있어요.":"서로 친구를 맺은 사람만 볼 수 있어요."}</span></div>
  <div>${OPTS.map(([k,t,d])=>html`<label className="checkline" key=${k}><input type="checkbox" id=${"pub-"+k} checked=${!!fl[k]} onChange=${e=>setF(k,e.target.checked)}/><span><b>${t}</b><br/><span className="small muted">${d}</span></span></label>${k==="tags"&&html`<${TagEditor} st=${st} update=${update}/>`}${k==="shelf"&&fl.shelf&&html`<${ShelfPicker} items=${items} onToggle=${onItemPrivate}/>`}`)}</div>
  <div className="stack"><div className="eyebrow">공개 미리보기 — 다른 사람에게 이렇게 보입니다</div><${PublicCardView} card=${card} name=${meName} who=${me}/></div>
  ${!can?html`<div className="panel tint small">예시 모드에서는 공개하지 않습니다.</div>`:st.visibility.public?html`<div className="stack"><button className="btn block" disabled=${busy} onClick=${()=>publish(true)}>공개 카드 새로 고치기</button><button className="btn ghost block" disabled=${busy} onClick=${()=>publish(false)}>공개 멈추기</button></div>`:html`<div className="stack"><label className="checkline"><input type="checkbox" id="pub-seen" checked=${seen} onChange=${e=>setSeen(e.target.checked)}/><span>미리보기를 확인했어요</span></label><button className="btn block" disabled=${!seen||busy} onClick=${()=>publish(true)}>공개하기</button></div>`}
 <//>`;
}

/* ───────── data sheet ───────── */
function DataSheet({st,items,profile,onClose,onWipe,onReread,onLogout,toast,demo,setQuiet}){
 const [confirm,setConfirm]=useState(false);const [pw,setPw]=useState("");const [busy,setBusy]=useState(false);
 const src=st.sources;
 function exportAll(){try{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),profile:{nickname:profile.nickname,joined_at:profile.joined_at},state:st,items:items.map(i=>{const {photoUrl,thumbUrl,...rest}=i;return rest})},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`myitembook-${dayKey()}.json`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);track("export");toast("내보내기 파일을 저장했습니다.")}catch(e){toast("내보내기를 마치지 못했습니다.")}}
 async function changePw(){if(pw.length<8){toast("비밀번호는 8자 이상이어야 합니다.");return}setBusy(true);try{await api.changePassword(pw);setPw("");toast("비밀번호를 바꿨습니다.")}catch(e){toast("비밀번호를 바꾸지 못했습니다. 다른 비밀번호로 시도해 주세요.")}finally{setBusy(false)}}
 return html`<${Sheet} title="연결 지도와 내 데이터" onClose=${onClose}>
  <div className="panel stack small"><b>${profile.nickname} · ${MIB_CONFIG.cohort}</b><span>${demo?"예시 모드 · 저장하지 않음":"기록은 내 계정에만 보이는 서버 저장소에 보관됩니다. 운영 화면에는 원문 기록이 나타나지 않고, 테스트 지표는 사용 횟수만 집계합니다."}</span></div>
  <div className="stack"><h2 className="h3">연결 지도</h2>
   <div className="list">${[["yt","유튜브 채널",src.youtube],["cal","캘린더",src.calendar],["pen","나의 이야기",src.story]].map(([ic,t,v])=>html`<div className="list-row" key=${t} style=${{cursor:"default"}}><span className="ico"><${Ico} n=${ic}/></span><span className="grow"><span className="t">${t}</span><br/><span className="d">${(v||"").trim()?(ic==="yt"&&src.youtubeChannel?`${src.youtubeChannel.title} · 영상 ${src.youtubeChannel.count}편 · 해석에 사용`:`${v.trim().length.toLocaleString()}자 · 해석에 사용`):"연결 안 함"}</span></span></div>`)}
   <div className="list-row" style=${{cursor:"default"}}><span className="ico"><${Ico} n="photo"/></span><span className="grow"><span className="t">사진 갤러리</span><br/><span className="d">${src.photos?`${src.photos}장 · 해석에만 쓰고 저장 안 함`:"연결 안 함"}</span></span></div></div>
   <p className="note">마지막으로 읽은 때: ${src.at?new Date(src.at).toLocaleString("ko-KR"):"없음"}</p>
  </div>
  <button className="btn quiet block" onClick=${onReread}>새 기록 더하기 · 다시 읽기</button>
  <div className="stack"><h2 className="h3">보는 기록</h2>
   <label className="checkline"><input type="checkbox" id="quiet" checked=${!!profile.quiet_view} disabled=${demo} onChange=${e=>setQuiet(e.target.checked)}/><span><b>조용히 보기</b><br/><span className="small muted">친구 카드를 봐도 내 이름 없이 '누군가'로만 남습니다. 대신 나도 방문자 이름을 볼 수 없어요. 서로 공평하게.</span></span></label>
  </div>
  <div className="stack"><h2 className="h3">계정</h2>
   <div className="row"><input type="password" aria-label="새 비밀번호" placeholder="새 비밀번호 (8자 이상)" value=${pw} onChange=${e=>setPw(e.target.value)} style=${{flex:1}} autoComplete="new-password"/><button className="btn ghost sm" disabled=${busy||demo} onClick=${changePw}>바꾸기</button></div>
   <button className="btn ghost block" onClick=${onLogout}>로그아웃</button>
  </div>
  <div className="stack"><h2 className="h3">떠날 자유</h2><p className="small muted">언제든 전체를 내보내고, 계정째 완전히 지울 수 있습니다.</p>
   <button className="btn ghost block" disabled=${demo} onClick=${exportAll}>전체 내보내기 (JSON)</button>
   ${confirm?html`<div className="panel stack"><span>해석, 기록, 선반과 사진, 공개 카드, 친구·공감·한 단어, 의견까지 계정과 함께 모두 지웁니다. 되돌릴 수 없습니다.</span><div className="row"><button className="btn ghost grow" onClick=${()=>setConfirm(false)}>취소</button><button className="btn danger grow" onClick=${onWipe}>계정까지 모두 지우기</button></div></div>`:html`<button className="btn danger block" disabled=${demo} onClick=${()=>setConfirm(true)}>완전 삭제</button>`}
  </div>
  <p className="note">이번 CBT는 MyItemBook 서비스 기획안 v1.0의 1단계(발견)와 일부 연결 기능을 7일간 시험하는 버전입니다. 계정 연동(유튜브·캘린더 OAuth), 서류·기관 인증, 멘토링은 포함하지 않습니다. ${MIB_CONFIG.version}</p>
 <//>`;
}

/* ───────── steps tab ───────── */
function StepTab({st,update,stats,canAI,toast,onOpen,demo}){
 const t=dayKey();const a=st.analysis;const cur=st.steps.current||a.firstStep;
 const doneToday=st.steps.done.includes(t),restToday=st.steps.rests.includes(t);
 const [busy,setBusy]=useState(false);const [badge,setBadge]=useState(null);
 const week=[...Array(7)].map((_,i)=>addDays(t,i-6));const dn=["일","월","화","수","목","금","토"];
 function complete(){update(s=>{const last=[...s.steps.done].sort().pop();if(last&&daysBetween(last,t)>3)s.steps.comebacks=(s.steps.comebacks||0)+1;if(!s.steps.done.includes(t))s.steps.done.push(t);s.steps.done=s.steps.done.slice(-400);s.steps.rests=s.steps.rests.filter(r=>r!==t)});track("step_done",{title:cur.title.slice(0,60)});if(!demo&&!doneToday)api.postFeed("step",{});toast("오늘의 한 걸음을 마쳤어요. 결이 조금 단단해졌습니다.")}
 function rest(){update(s=>{if(!s.steps.rests.includes(t))s.steps.rests.push(t);s.steps.rests=s.steps.rests.slice(-200)});track("step_rest");toast("쉬는 날도 기록입니다. 젬은 흐려지지 않아요.")}
 function another(){const ideas=a.stepIdeas||[];if(!ideas.length)return;update(s=>{const i=((s.steps.ideaIdx||0)+1)%ideas.length;s.steps.ideaIdx=i;s.steps.current={title:ideas[i],minutes:10,why:"AI가 해석에서 함께 제안한 걸음입니다."}});track("step_other")}
 async function fresh(){setBusy(true);try{const j=await api.aiJSON({task:"quick",prompt:`MIB 사용자에게 내일 할 수 있는 아주 작은 한 걸음 하나를 제안한다. 이 사람의 결: ${visibleAxes(a).map(x=>x.name).join(", ")}. 키워드: ${displayKeywords(a).join(", ")}. 지금까지 한 걸음 ${st.steps.done.length}일. 최근 걸음: ${cur.title}. 겹치지 않게, 10분 안팎, 평가·훈계 없이. JSON으로만: {"title":"한 문장","minutes":5~20 정수,"why":"이 사람의 결과 이어지는 이유 한 줄"}`});track("step_ai");update(s=>{s.steps.current={title:String(j.title||cur.title).slice(0,100),minutes:clamp(Number(j.minutes)||10,3,30),why:String(j.why||"").slice(0,120)}})}catch(e){toast(errCopy(e))}finally{setBusy(false)}}
 const wk=weekKey();const thisRef=(st.reflections||[]).find(r=>r.week===wk);
 const groups=["지속","도약","회복","함께"];
 return html`<div className="main wrap">
  <div className="todaystep">
   <div className="row between"><span className="eyebrow" style=${{color:"inherit",opacity:.8}}>오늘의 한 걸음 · ${cur.minutes||10}분</span>${doneToday&&html`<span className="chip">완료</span>`}${restToday&&!doneToday&&html`<span className="chip">쉬는 날</span>`}</div>
   <h2>${cur.title}</h2>${cur.why&&html`<p className="why">${cur.why}</p>`}
   ${!doneToday?html`<button className="btn block" onClick=${complete}>했어요</button>
    <div className="row"><button className="btn ghost sm grow" onClick=${another} disabled=${!(a.stepIdeas||[]).length}>다른 걸음</button><button className="btn ghost sm grow" onClick=${rest} disabled=${restToday}>오늘은 쉬어가기</button></div>
    ${canAI&&html`<button className="btn ghost sm" disabled=${busy} onClick=${fresh}>${busy?"새 걸음을 고르는 중…":"AI에게 새 걸음 받기"}</button>`}`:html`<p className="why">내일 또 하나의 걸음이 기다립니다.</p>`}
  </div>
  <${DailyLog} st=${st} update=${update} toast=${toast} demo=${demo}/>
  <${StayCard} st=${st} onOpen=${onOpen}/>
  <div className="stack"><h2 className="h3">이번 주</h2><div className="week">${week.map(d=>{const dt=new Date(d+"T00:00:00");const c=st.steps.done.includes(d)?"done":st.steps.rests.includes(d)?"rest":"";return html`<div className="day" key=${d}><span>${dn[dt.getDay()]}</span><span className=${"dot "+c+(d===t?" today":"")} aria-label=${d+(c==="done"?" 완료":c==="rest"?" 쉼":"")}>${c==="done"?"✓":c==="rest"?"쉼":dt.getDate()}</span></div>`})}</div></div>
  <div className="stat"><div><b>${stats.days}</b><span>걸어온 날</span></div><div><b>${stats.logs}</b><span>남긴 한 줄</span></div><div><b>${stats.rests}</b><span>쉬어간 날</span></div><div><b>${stats.comebacks}</b><span>다시 시작</span></div></div>
  <p className="note">남은 거리 대신 걸어온 거리를 셉니다. 연속 기록이 끊겨도 아무것도 잃지 않아요.</p>
  <${Reflection} st=${st} update=${update} canAI=${canAI} existing=${thisRef} wk=${wk} toast=${toast}/>
  <div className="stack"><div className="row between"><h2 className="h3">배지 시즌 1</h2><span className="small faint">${earnedIds(st,stats).length} / ${BADGES.length}</span></div>
   <p className="small muted">배지는 능력 인증이나 등급이 아니라, 나의 시간이 남긴 작은 표식입니다. 배지마다 칭호가 따라오고, 영웅·전설 배지는 카드 테두리도 열어 줘요.</p>
   ${(()=>{const near=BADGES.filter(b=>!isEarned(st,stats,b)&&!b.secret).map(b=>({b,p:badgeProg(b,stats)})).sort((x,y)=>y.p.pct-x.p.pct).slice(0,2);return near.map(({b,p})=>html`<button key=${b.id} className="ach-row" onClick=${()=>onOpen("achieve")}><span className="ach-medal"><${Medal} b=${b} earned=${false} size=${40}/></span><span className="grow ach-body"><span className="row between"><b className="ach-name">${b.name}</b><span className="small faint">${p.cur} / ${p.tgt}</span></span><${ProgressBar} pct=${p.pct} color=${RARITY[b.rar].color}/><span className="small muted">${b.cond}</span></span></button>`)})()}
   <div className="row"><button className="btn quiet sm grow" onClick=${()=>onOpen("achieve")}>업적 도감</button><button className="btn quiet sm grow" onClick=${()=>onOpen("badgebox")}>배지 보관함</button></div>
  </div>
 </div>`;
}
function Reflection({st,update,canAI,existing,wk,toast}){
 const [f,setF]=useState({good:"",hard:"",next:""});const [busy,setBusy]=useState(false);
 async function save(){const r={week:wk,...f,at:Date.now(),summary:""};update(s=>{s.reflections=[...(s.reflections||[]).filter(x=>x.week!==wk),r].slice(-26)});track("reflection");toast("이번 주 회고를 남겼어요.")}
 async function summarize(){if(!existing)return;setBusy(true);try{const r=await api.ai({task:"quick",prompt:`다음 주간 회고를 판단이나 조언 없이 따뜻하게 한 문장(45자 이내)으로 정리한다. 문장만 쓴다.\n잘한 것: ${existing.good}\n어려웠던 것: ${existing.hard}\n다음 주 한 가지: ${existing.next}`});update(s=>{const x=s.reflections.find(y=>y.week===wk);if(x)x.summary=r.text.trim().slice(0,90)})}catch(e){toast(errCopy(e))}finally{setBusy(false)}}
 return html`<div className="panel stack"><div className="row between"><h2 className="h3">이번 주의 나</h2><span className="faint small">${wk}</span></div>
  ${existing?html`<div className="stack small"><span><span className="tag">잘한 것</span>${existing.good||"—"}</span><span><span className="tag">어려웠던 것</span>${existing.hard||"—"}</span><span><span className="tag">다음 주</span>${existing.next||"—"}</span>${existing.summary?html`<p className="serif" style=${{color:"var(--accent)",fontSize:"15.5px"}}>${existing.summary}</p>`:canAI&&html`<button className="btn quiet sm" disabled=${busy} onClick=${summarize}>${busy?"정리하는 중…":"AI로 한 줄 정리"}</button>`}</div>`:html`
   <div className="field"><label htmlFor="rf-g">이번 주 잘한 것</label><input type="text" id="rf-g" value=${f.good} maxLength="80" onChange=${e=>setF(x=>({...x,good:e.target.value}))}/></div>
   <div className="field"><label htmlFor="rf-h">어려웠던 것</label><input type="text" id="rf-h" value=${f.hard} maxLength="80" onChange=${e=>setF(x=>({...x,hard:e.target.value}))}/></div>
   <div className="field"><label htmlFor="rf-n">다음 주 한 가지</label><input type="text" id="rf-n" value=${f.next} maxLength="80" onChange=${e=>setF(x=>({...x,next:e.target.value}))}/></div>
   <button className="btn quiet" disabled=${!(f.good||f.hard||f.next).trim()} onClick=${save}>회고 남기기</button>`}
 </div>`;
}

/* ───────── today's one line (feeds the gem: activity days) ───────── */
function DailyLog({st,update,toast,demo}){
 const t=dayKey();const mine=(st.logs||[]).find(l=>l.day===t);const [txt,setTxt]=useState(mine?mine.text:"");const [edit,setEdit]=useState(!mine);
 useEffect(()=>{setTxt(mine?mine.text:"");setEdit(!mine)},[mine&&mine.text]);
 function save(){const v=txt.trim().slice(0,120);if(!v)return;const first=!mine;update(s=>{s.logs=[...(s.logs||[]).filter(l=>l.day!==t),{day:t,text:v,at:Date.now()}].slice(-120)});setEdit(false);track("log_saved",{len:v.length,first});toast(first?"오늘의 한 줄을 남겼어요. 젬이 한 겹 단단해집니다.":"오늘의 한 줄을 고쳤어요.")}
 const recent=[...(st.logs||[])].sort((a,b)=>a.day<b.day?1:-1).slice(0,5);
 return html`<div className="panel stack">
  <div className="row between"><h2 className="h3">오늘의 한 줄</h2><span className="faint small">나만 보기</span></div>
  ${edit?html`<div className="field"><label htmlFor="log">오늘, 나다웠던 순간 하나</label><textarea id="log" value=${txt} maxLength="120" onChange=${e=>setTxt(e.target.value)} style=${{minHeight:"76px"}} placeholder="예) 점심시간에 동료에게 단축키를 알려 주고 뿌듯했다"></textarea><span className="hint">${txt.length}/120 · 한 걸음을 못 해도, 한 줄만 남겨도 활동한 날로 셉니다.</span></div>
   <div className="row">${mine&&html`<button className="btn ghost sm" onClick=${()=>{setTxt(mine.text);setEdit(false)}}>취소</button>`}<button className="btn quiet sm grow" disabled=${!txt.trim()||demo} onClick=${save}>${demo?"예시 모드":"남기기"}</button></div>`:html`<p className="serif" style=${{fontSize:"16px",color:"var(--accent)"}}>${mine.text}</p><button className="linkbtn small" onClick=${()=>setEdit(true)}>고치기</button>`}
  ${recent.filter(l=>l.day!==t).length>0&&html`<div className="stack small" style=${{gap:"4px"}}>${recent.filter(l=>l.day!==t).slice(0,4).map(l=>html`<span key=${l.day}><span className="tag">${l.day.slice(5).replace("-","/")}</span>${l.text}</span>`)}</div>`}
 </div>`;
}

/* ───────── resonance between two cards ───────── */
function resonance(mine,other){
 const ma=visibleAxes(mine).map(a=>a.name),oa=(other.axes||[]).map(a=>a.name);const mk=displayKeywords(mine),ok=other.keywords||[];
 const same=[...new Set([...ma.filter(n=>oa.includes(n)),...mk.filter(k=>ok.includes(k))])];const comp=oa.filter(n=>!ma.includes(n)&&n!=="아직 발견 중").slice(0,2);
 return {score:same.length*2+((mine.gem&&other.gem&&mine.gem.stone===other.gem.stone)?1:0)+(comp.length?.5:0),same,comp};
}
