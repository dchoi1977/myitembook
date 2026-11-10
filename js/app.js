"use strict";
/* MIB CBT · app shell — session, state sync, routing, sheets */
const EMPTY_SOC={friendships:[],wordsTo:[],wordsFrom:[],reactTo:[],reactFrom:[],feedback:[]};
function App(){
 const [boot,setBoot]=useState(true);const [session,setSession]=useState(null);const [profile,setProfile]=useState(null);const [gateMsg,setGateMsg]=useState("");
 const [st,setSt]=useState(null);const [items,setItems]=useState([]);
 const [demo,setDemo]=useState(false);const [real,setReal]=useState(null);const desk=useDesktop();
 const [route,setRoute]=useState("loading");const [tab,setTab]=useState("me");const [sheet,setSheet]=useState(null);const [fbOpen,setFbOpen]=useState(false);const [fbShot,setFbShot]=useState(null);const [supportUrl,setSupportUrl]=useState("");
 const [toastMsg,setToastMsg]=useState("");const toastT=useRef(null);
 const [draft,setDraft]=useState({sources:{youtube:"",calendar:"",story:""},answers:["","",""],photos:[],quick:null});
 const [reading,setReading]=useState({status:"idle",chars:0,error:null});const ctl=useRef(null);
 const [soc,setSoc]=useState(EMPTY_SOC);const [pulse,setPulse]=useState(null);const [names,setNames]=useState({});const namesRef=useRef({});
 const [notes,setNotes]=useState([]);const [anns,setAnns]=useState([]);const [aiReady,setAiReady]=useState(null);const [ytReady,setYtReady]=useState(null);
 const [reach,setReach]=useState({visits:0,visitors:0});const freshSoc=useRef(null);const awayRef=useRef(null);const stRef=useRef(null);
 const [avTick,setAvTick]=useState(0);const verRef=useRef(null);const skipSave=useRef(false);const saveT=useRef(null);const loaded=useRef(false);const pendingHash=useRef(null);
 const toast=useCallback(m=>{setToastMsg(m);clearTimeout(toastT.current);toastT.current=setTimeout(()=>setToastMsg(""),3400)},[]);
 const uid=session&&session.user&&session.user.id;
 const initialCode=useMemo(()=>{try{return (new URLSearchParams(location.search).get("code")||"").toUpperCase()}catch(e){return ""}},[]);

 // ── names cache
 const ensureNames=useCallback(async ids=>{const need=[...new Set((ids||[]).filter(id=>id&&!namesRef.current[id]))];if(!need.length)return;try{const m=await api.profiles(need);namesRef.current={...namesRef.current,...m};setNames(namesRef.current)}catch(e){}},[]);

 // ── session bootstrap
 useEffect(()=>{
  try{const h=decodeURIComponent(location.hash||"");const m=h.match(/#u=(.+)$/);if(m)pendingHash.current=m[1]}catch(e){}
  api.admin.ping().then(r=>{setAiReady(!!r.ai);setYtReady(!!r.yt)}).catch(()=>setAiReady(null));
  api.session().then(s=>{setSession(s);if(!s){setBoot(false);setRoute("gate")}}).catch(()=>{setBoot(false);setRoute("gate")});
  const sub=api.onAuth((ev,s)=>{if(ev==="SIGNED_OUT"){setSession(null);setRoute("gate")}else if(s&&(ev==="TOKEN_REFRESHED"||ev==="SIGNED_IN"))setSession(x=>x&&x.user&&s.user&&x.user.id===s.user.id?s:x||s)});
  return()=>{try{sub.unsubscribe()}catch(e){}}
 },[]);

 useEffect(()=>{if(!uid)return;let alive=true;loaded.current=false;awayRef.current=null;freshSoc.current=null;setBoot(true);(async()=>{
  try{
   const p=await api.me(uid);if(!alive)return;
   if(!p){await api.logout();setGateMsg("초대 등록이 확인되지 않은 계정입니다. 초대 코드로 다시 등록해 주세요.");setSession(null);setRoute("gate");setBoot(false);return}
   setProfile(p);tracker.uid=uid;errReporter.uid=uid;api.supportUrl().then(setSupportUrl);namesRef.current={...namesRef.current,[uid]:p};setNames(namesRef.current);
   const [row,its]=await Promise.all([api.loadStateRow(uid),api.loadItems(uid)]);if(!alive)return;const s=row?row.data:null;verRef.current=row?row.updated_at:null;
   const ns=normState(s);setSt(ns);setItems(its);loaded.current=true;hydratePhotos(its);
   track("app_open",{day:cbtDay(p.joined_at),w:window.innerWidth});
   reloadSoc();loadInbox();
   if(ns.analysis)setRoute("home");else{setRoute("welcome");setDraft(d=>({...d,quick:ns.quick||null,sources:{youtube:ns.sources.youtube||"",youtubeChannel:ns.sources.youtubeChannel||null,calendar:ns.sources.calendar||"",story:ns.sources.story||"",links:Array.isArray(ns.sources.links)?ns.sources.links:[]},answers:ns.answers}))}
   if(pendingHash.current){const n=pendingHash.current;pendingHash.current=null;try{const t=await api.profileByNickname(n);if(t&&ns.analysis){setSheet("user:"+t.id);if(t.id!==uid)track("open_shared_link")}else if(t)toast(`${n}님의 카드는 첫 발견을 마친 뒤 볼 수 있어요.`)}catch(e){}try{history.replaceState(null,"",location.pathname+location.search)}catch(e){}}
  }catch(e){toast("기록을 불러오지 못했습니다. 연결을 확인한 뒤 새로고침해 주세요.")}
  finally{if(alive)setBoot(false)}
 })();return()=>{alive=false}},[uid]);

 async function hydratePhotos(its){const paths=its.flatMap(i=>[i.thumbPath,i.photoPath]).filter(Boolean);if(!paths.length)return;try{const m=await api.signedUrls(paths);setItems(list=>list.map(i=>({...i,thumbUrl:i.thumbUrl&&i.thumbUrl.startsWith("data:")?i.thumbUrl:m[i.thumbPath]||i.thumbUrl,photoUrl:i.photoUrl&&i.photoUrl.startsWith("data:")?i.photoUrl:m[i.photoPath]||i.photoUrl})))}catch(e){}}
 const reloadSoc=useCallback(async()=>{if(!uid)return;try{const [s,r]=await Promise.all([api.social(uid),api.reach().catch(()=>null)]);freshSoc.current=s;setSoc(s);api.pulse(uid,friendIds(uid,s.friendships)).then(setPulse).catch(()=>{});api.askStatus().then(setAskStat).catch(()=>{});api.asksForMe().then(r=>{setAsksMe(r||[]);ensureNames((r||[]).map(x=>x.owner))}).catch(()=>{});if(r)setReach({visits:+r.visits||0,visitors:+r.visitors||0});ensureNames([...s.friendships.flatMap(f=>[f.requester,f.addressee]),...s.wordsTo.map(w=>w.from_id),...s.reactTo.map(r=>r.from_id)])}catch(e){if(!freshSoc.current)freshSoc.current="fail"}},[uid]);
 const loadInbox=useCallback(async()=>{if(!uid)return;try{const [n,a]=await Promise.all([api.notifications(),api.announcements()]);setNotes(n||[]);setAnns(a||[]);ensureNames((n||[]).map(x=>x.actor_id))}catch(e){}},[uid]);
 useEffect(()=>{if(!uid)return;const t=setInterval(()=>{if(document.visibilityState==="visible"){loadInbox();reloadSoc()}},60000);const v=()=>{if(document.visibilityState==="visible"){loadInbox();reloadSoc()}else stampSeen()};document.addEventListener("visibilitychange",v);return()=>{clearInterval(t);document.removeEventListener("visibilitychange",v)}},[uid]);
 const prevTab=useRef(null);
 useEffect(()=>{if(!st||demo)return;const now=Date.now();const cur=(st.flags&&st.flags.seenTabs)||{};let nx={...cur};let ch=false;
  if(!cur.friends||!cur.feed){nx.friends=cur.friends||now;nx.feed=cur.feed||now;ch=true}
  for(const k of [prevTab.current,tab]){if(k==="friends"||k==="feed"){nx[k]=now;ch=true}if(k==="step"&&nx.step!==dayKey()){nx.step=dayKey();ch=true}}
  prevTab.current=tab;if(ch)setSt(s=>s?{...s,flags:{...s.flags,seenTabs:nx}}:s)},[tab,!!st,demo]);

 // signed urls for photo avatars this viewer may see (others fall back to the default stone)
 useEffect(()=>{const need=Object.values(names).filter(p=>p&&p.avatar==="photo"&&!(avKey(p) in AVCACHE));if(!need.length)return;need.forEach(p=>{AVCACHE[avKey(p)]=null});api.avatarUrls(need.map(p=>p.id)).then(m=>{need.forEach(p=>{AVCACHE[avKey(p)]=m[p.id]||null});setAvTick(t=>t+1)}).catch(()=>{})},[names]);
 function onAvatarSaved(next){setProfile(p=>({...p,...next}));namesRef.current={...namesRef.current,[uid]:{...(namesRef.current[uid]||{}),...next}};setNames(namesRef.current)}
 // ── persist (debounced)
 // ── persist (debounced) — another device may have saved meanwhile: never overwrite newer data with an older copy
 const newer=(a,b)=>!!a&&!!b&&new Date(a).getTime()>new Date(b).getTime()+500;
 async function pullState(why){try{const r=await api.loadStateRow(uid);if(!r)return;skipSave.current=true;verRef.current=r.updated_at;setSt(normState(r.data));if(why)toast(why)}catch(e){}}
 async function guardedSave(data){if(!uid)return;try{const cur=await api.stateStamp(uid);if(newer(cur,verRef.current)){await pullState("다른 기기에서 바뀐 내용을 불러왔어요.");return}const v=await api.saveState(uid,data);if(v)verRef.current=v}catch(e){toast("저장하지 못했습니다. 연결을 확인해 주세요.")}}
 useEffect(()=>{if(!loaded.current||!st||demo||!uid)return;if(skipSave.current){skipSave.current=false;return}clearTimeout(saveT.current);saveT.current=setTimeout(()=>guardedSave(st),800);return()=>clearTimeout(saveT.current)},[st]);
 // coming back to this tab: pick up what another device saved
 useEffect(()=>{if(!uid||demo)return;const f=async()=>{if(document.visibilityState!=="visible"||!loaded.current)return;try{const cur=await api.stateStamp(uid);if(newer(cur,verRef.current))pullState()}catch(e){}};document.addEventListener("visibilitychange",f);window.addEventListener("focus",f);return()=>{document.removeEventListener("visibilitychange",f);window.removeEventListener("focus",f)}},[uid,demo]);

 const socStats=useMemo(()=>{if(demo)return {friends:0,wordsReceived:0,wordsGiven:2,reactionsGiven:0,reactionsReceived:0,exitDone:false};return {friends:friendIds(uid,soc.friendships).length,wordsReceived:soc.wordsTo.length,wordsGiven:soc.wordsFrom.length,reactionsGiven:soc.reactFrom.length,reactionsReceived:soc.reactTo.filter(r=>r.target!=="feed").length,bonds:soc.friendships.filter(f=>f.status==="accepted"&&f.bond).length,bondKinds:new Set(soc.friendships.filter(f=>f.status==="accepted"&&f.bond).map(f=>f.bond)).size,exitDone:soc.feedback.some(f=>f.kind==="exit"),visitors:reach.visitors}},[soc,demo,uid,reach]);
 const day=profile?cbtDay(profile.joined_at):1;
 const stats=useMemo(()=>{if(!st)return null;const s={...statsOf(st,items,socStats),day,visitors:socStats.visitors||0};s.mv=markValues(st,s);return s},[st,items,socStats,day]);
 stRef.current=st;const statsRef=useRef(null);statsRef.current=stats;
 // the last moment this person was here, and what their counters read then (for the welcome-back card)
 const seenCounts=s=>({friends:s.connections,cheers:s.reactionsReceived,words:s.wordsReceived,visitors:s.visitors||0});
 function stampSeen(){const s0=stRef.current,s1=statsRef.current;if(!s0||!uid||demo||!loaded.current||!s0.analysis||!s1)return;const ns={...s0,flags:{...s0.flags,lastSeen:{at:Date.now(),c:seenCounts(s1)}}};skipSave.current=true;setSt(ns);guardedSave(ns)}
 const dailyAnswered=soc.feedback.some(f=>f.kind==="daily"&&(f.payload||{}).day===Math.min(day,7));

 // stage only rises; badges stay; a visible change of the gem plays the evolve ceremony
 const [fx,setFx]=useState([]);const [show,setShow]=useState(null);const [askStat,setAskStat]=useState(null);const [asksMe,setAsksMe]=useState([]);const evo=fx[0]||null;const pushFx=list=>setFx(q=>[...q,...list.filter(Boolean)]);const nextFx=()=>setFx(q=>q.slice(1));
 const fxOf=(evt,badges)=>{const rb=badges.filter(id=>(badgeById(id)||{}).g==="연륜");if(rb.length>1)badges=badges.filter(id=>!rb.includes(id)||id===rb.sort().slice(-1)[0]);const out=[];if(evt&&(evt.changes.length||evt.away))out.push({type:"evo",...evt,badges:[],nb:badges.length});if(badges.length)out.push({type:"badge",ids:[...badges].sort((a,b)=>RARITY[badgeById(a).rar].n-RARITY[badgeById(b).rar].n)});return out};
 const AWAY_MS=6*3600000;const AWAY_ITEMS=[["friends","새 친구"],["cheers","받은 공감"],["words","받은 한 단어"],["visitors","새로 다녀간 사람"]];
 const holdFx=sheet==="publish"||(!!sheet&&sheet.startsWith("identity"));
 useEffect(()=>{const socReady=freshSoc.current==="fail"||(!!freshSoc.current&&soc===freshSoc.current);if(!st||!stats||!st.analysis||demo||!loaded.current||!socReady||holdFx)return;
  const sg=Math.max(stageOf(st,stats),st.flags.maxStage||0);const earned=earnedIds(st,stats);const seen=st.flags.badgesSeen||[];const nw=earned.filter(id=>!seen.includes(id));
  const marks=marksOf(st,stats);
  const g=livingGem({...st,flags:{...st.flags,maxStage:sg,marks}});const snap=gemSnap(g,sg);const prev=st.flags.seenGem;
  const ovKey=JSON.stringify(st.gemOverride||{});const ovChanged=!!prev&&prev.ov!==undefined&&prev.ov!==ovKey;
  const ID_K=["laurel","spot","roots","banners"];const raw=prev?evoDiff(prev,snap):[];const idDown=raw.some(c=>ID_K.includes(c.k)&&c.to<(c.from||0));const changes=raw.filter(c=>!(ID_K.includes(c.k)&&c.to<(c.from||0)));
  // first pass of a session: was the person away, and what piled up meanwhile?
  let away=null;const now=Date.now();const cur=seenCounts(stats);const ls=st.flags.lastSeen;
  if(awayRef.current===null){awayRef.current=true;if(ls&&now-ls.at>=AWAY_MS){const items=AWAY_ITEMS.map(([k,label])=>({k,label,n:Math.max(0,(cur[k]||0)-((ls.c||{})[k]||0))})).filter(x=>x.n>0);away={ms:now-ls.at,label:awayLabel(now-ls.at),items}}}
  if(away&&away.ms>=3*86400000){setSt(s=>({...s,flags:{...s.flags,returns:(s.flags.returns||0)+1}}));away.back=true}
  const marksChanged=JSON.stringify(marks)!==JSON.stringify(st.flags.marks||{});
  const atMissing=earned.some(id=>!(st.flags.badgeAt||{})[id]);
  const stampDue=!ls||JSON.stringify(ls.c)!==JSON.stringify(cur)||now-ls.at>10*60000;
  if(prev&&!changes.length&&!idDown&&!nw.length&&sg===(st.flags.maxStage||0)&&!marksChanged&&!atMissing){
   if(away&&away.items.length)toast(`${away.label} 그사이 ${away.items.map(x=>`${x.label} ${x.n}`).join(", ")}`);
   if(stampDue)setSt(s=>({...s,flags:{...s.flags,lastSeen:{at:now,c:cur}}}));return}
  const silent=!prev||(ovChanged&&!st.flags.celebrate&&changes.every(c=>c.k==="stone"||c.k==="symbol"));
  const prevStage=st.flags.maxStage||0;
  setSt(s=>({...s,flags:{...s.flags,maxStage:Math.max(sg,s.flags.maxStage||0),marks,badgesSeen:[...new Set([...(s.flags.badgesSeen||[]),...earned])],badgeAt:(()=>{const m={...(s.flags.badgeAt||{})};earned.forEach(id=>{if(!m[id])m[id]=now});return m})(),seenGem:{...snap,ov:ovKey},celebrate:false,lastSeen:{at:now,c:cur}}}));
  if(sg>prevStage&&prevStage>0){api.postFeed("stage",{stage:sg});track("stage_up",{stage:sg})}
  nw.forEach(id=>{const b=badgeById(id);if(!silent&&b&&b.g!=="연륜"&&(b.rar!=="common"||["step1","shelf","refine"].includes(id)))api.postFeed("badge",{id});track("badge",{id})});
  if(!silent){const sc=changes.find(c=>c.k==="stage");if(sc&&sc.to>(sc.from||0))for(let k=(sc.from||1)+1;k<=sc.to;k++){const aw=awakenAt(g,st.createdAt,k);if(aw){track("awaken",{k:aw.k,t:aw.t,stage:k});if(aw.t>=3)api.postFeed("awaken",{k:aw.k,t:aw.t,n:aw.n,stage:k})}}}
  if(!silent){const ups=changes.filter(c=>MARK_KEYS.includes(c.k)&&c.to>(c.from||0));ups.forEach(c=>track("mark",{k:c.k,lv:c.to}));if(ups.length)api.postFeed("mark",{k:ups[0].k,lv:ups[0].to})}
  if(!silent&&(changes.length||nw.length))pushFx(fxOf({from:prev,to:snap,changes,head:(()=>{const h=evoHeadline(changes,nw,stats);const sc=changes.find(c=>c.k==="stage");if(sc&&sc.to>(sc.from||0)){const aw=awakenAt(g,st.createdAt,sc.to);if(aw){const tier=AW_TIERS[aw.t][0];return aw.t>=2?{...h,title:`${tier} 발현 · ${aw.n}!`,sub:`${h.title} ${h.sub}`,aw}:{...h,sub:`${h.sub} · 새 발현 ${aw.n}`,aw}}}return h})(),away:away&&(away.items.length||away.ms>=86400000)?away:null},nw));
  else if(away&&away.items.length)toast(`${away.label} 그사이 ${away.items.map(x=>`${x.label} ${x.n}`).join(", ")}`);
 },[stats,holdFx]);
 function previewAway(){const base=st&&st.analysis?livingGem(st):{stone:"비취",lightName:"새벽빛",light:"물결",form:"덩이",texture:"맑음",symbol:"산",hardness:2,grain:1,facets:8,marks:{}};const from=gemSnap({...base,marks:{setting:1,sat:1,aura:1,stars:0}},3);const to={...from,setting:2,sat:2,aura:2,stars:1,marks:{setting:2,sat:2,aura:2,stars:1}};const changes=evoDiff(from,to);pushFx(fxOf({from,to,changes,head:evoHeadline(changes,["linked"],{mv:{setting:7,sat:3,aura:12,stars:6}}),away:{ms:3*86400000,label:"3일 만이에요",items:[{k:"friends",label:"새 친구",n:2},{k:"cheers",label:"받은 공감",n:9},{k:"words",label:"받은 한 단어",n:3},{k:"visitors",label:"새로 다녀간 사람",n:6}]}},["friend3","back"]))}
 function previewBadges(){pushFx([{type:"badge",ids:["log1","friend3","loved10","allweek"]}])}
 function replayBadge(id){pushFx([{type:"badge",ids:[id],replay:true}])}
 function previewEvo(){const base=st&&st.analysis?livingGem(st):{stone:"비취",lightName:"새벽빛",light:"물결",form:"덩이",texture:"맑음",symbol:"산",hardness:2,grain:1,facets:8};const from=gemSnap(base,2);const to={...from,stage:3,hardness:Math.min(5,(from.hardness||1)+1),facets:Math.min(14,(from.facets||8)+1),form:from.form==="군집"?"결정":"군집"};const changes=evoDiff(from,to);pushFx(fxOf({from,to,changes,head:evoHeadline(changes,["step7"],{active:7})},["step7"]))}

 // shared shelf: an item is visible to others when the shelf is on and the item isn't hidden
 useEffect(()=>{if(demo||!uid||!st||!loaded.current)return;const on=!!(st.visibility.fields.shelf);const diff=items.filter(i=>!!i._shared!==(on&&!i.private));if(!diff.length)return;
  Promise.all(diff.map(i=>api.setItemShared(uid,i.id,on&&!i.private).then(()=>i.id).catch(()=>null))).then(ids=>{const ok=ids.filter(Boolean);if(ok.length)setItems(list=>list.map(i=>ok.includes(i.id)?{...i,_shared:on&&!i.private}:i))})},[items,st&&st.visibility.fields.shelf,demo,uid]);
 // keep the public card fresh
 const pubT=useRef(null);
 useEffect(()=>{if(demo||!uid||!st||!st.visibility.public||!st.analysis||!loaded.current)return;clearTimeout(pubT.current);pubT.current=setTimeout(()=>{api.publishCard(uid,buildPublicCard(st,items,stats),st.visibility.audience||"all").catch(()=>{})},1500);return()=>clearTimeout(pubT.current)},[st&&JSON.stringify([st.analysis,st.visibility,st.gemOverride,st.featured,activeDays(st),st.quick&&st.quick.answers&&[st.quick.answers.mbti,st.quick.answers.blood],st.flags&&[st.flags.title,st.flags.frame,st.flags.pins,st.flags.marks,(st.flags.badgesSeen||[]).length]]),items.length,items.filter(i=>i.private).length,stats&&stageOf(st,stats),stats&&stats.connections]);

 const update=useCallback(fn=>setSt(s=>{const n=clone(s);fn(n);return n}),[]);
 useEffect(()=>{try{window.scrollTo(0,0)}catch(e){}},[route,tab]);
 const screen=sheet||(route==="home"?tab:route);curScreen.v=screen;
 async function openFeedback(){let shot=null;try{toast("화면을 담는 중…");shot=await Promise.race([captureScreen(),new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")),5000))])}catch(e){}setToastMsg("");setFbShot(shot);setFbOpen(true)}
 useEffect(()=>{if(uid&&route!=="loading"&&route!=="gate")track("view",{s:String(screen).split(":")[0]})},[screen]);
 const canAI=aiReady!==false&&!demo;

 function startDemo(){setReal({st,items,route});setSt(normState(demoState()));setItems(DEMO_ITEMS);setDemo(true);setRoute("home");setTab("me");setSheet(null);track("demo_start")}
 function endDemo(){if(real){setSt(real.st);setItems(real.items)}setDemo(false);setSheet(null);setRoute(real&&real.st&&real.st.analysis?"home":"welcome");setReal(null)}
 function startFlow(){setSheet(null);setRoute(draft.quick&&draft.quick.done?"quickdone":"quick");track("flow_start")}

 async function runAnalysis(feedback){
  ctl.current=new AbortController();setReading({status:"waiting",chars:0,error:null});setRoute("reading");
  const prev=st.analysis;const t0=Date.now();
  const quick=draft.quick||st.quick||null;window.__promptStays=(st.stays||[]).slice(-60);window.__promptIdentity=(()=>{const I=st.identity||{};if(I.useAI===false)return null;const E=(I.entries||[]).filter(e=>e.cat!=="home"&&!e.hidden);return ID_CATS.filter(c=>c.k!=="home"&&!c.noAI).map(c=>{const L=E.filter(e=>e.cat===c.k);return L.length?`- ${c.n}(${c.q}): ${L.map(e=>[e.name,e.type,e.extra,e.tier,e.year].filter(Boolean).join(" · ")).join(" / ")}`:null}).filter(Boolean)})();const prompt=buildPrompt({quick,know:st.know,sources:draft.sources,answers:draft.answers,photoCount:draft.photos.length,items,feedback,prev,logs:prev?st.logs:null,stepsDone:prev?(st.steps.done.length?[(st.steps.current||prev.firstStep).title]:[]):null,reflections:prev?st.reflections:null});
  track("analysis_start",{re:!!prev,fb:!!feedback,photos:draft.photos.length,len:prompt.length});
  try{
   const images=[];for(const f of draft.photos.slice(0,4))images.push(await imageForAI(f));
   const j=await api.aiJSON({task:"read",prompt,images,signal:ctl.current.signal});
   const an=normAnalysis(j,{quick,know:st.know,links:draft.sources.links});
   setSt(s=>{const n=clone(s);if(n.analysis){n.axesHistory=[...(n.axesHistory||[]),{at:n.analysis.at,axes:n.analysis.axes.map(x=>({name:x.name,level:x.level}))}].slice(-4)}if(!n.first)n.first={at:Date.now(),gem:{...an.gem},sentence:an.sentence,keywords:an.keywords,axes:an.axes.map(x=>({name:x.name,level:x.level}))};if(quick)n.quick=quick;if(n.analysis){settleReread(an,n.analysis);if(an.stoneSuggest&&an.stoneSuggest===(n.gemOverride||{}).stone)an.stoneSuggest=null}n.analysis=an;n.analyses=(n.analyses||0)+1;n.sources={youtube:draft.sources.youtube,youtubeChannel:draft.sources.youtube.trim()?(draft.sources.youtubeChannel||null):null,calendar:draft.sources.calendar,story:draft.sources.story,links:(typeof linkList==="function"?linkList(draft.sources):[]).slice(-8),photos:draft.photos.length,at:Date.now()};n.answers=draft.answers;n.steps.current=an.firstStep;n.steps.ideaIdx=0;return n});
   api.postFeed(prev?"reread":"discover",{gemName:gemName(an.gem)});track("analysis_done",{re:!!prev,ms:Date.now()-t0});
   setDraft(d=>({...d,photos:[]}));setReading({status:"done",chars:0,error:null});setRoute("reveal");
  }catch(e){const err=e&&e.code?e:{code:"upstream_error"};track("analysis_fail",{code:err.code});setReading({status:"error",chars:0,error:err})}
 }
 function stopAnalysis(){ctl.current&&ctl.current.abort()}

 async function saveItem(item,opt,onlyFeature){
  if(demo)return;
  if(onlyFeature){update(s=>{const f=(s.featured||[]).filter(x=>x!==item.id);if(opt.feature){if(f.length>=4){toast("대표 아이템은 4개까지예요. 다른 아이템의 대표 표시를 먼저 풀어 주세요.");s.featured=f.concat([]);return}f.push(item.id)}s.featured=f});return}
  const exists=items.some(i=>i.id===item.id);
  try{const body=await api.saveItem(uid,item);const old=items.find(i=>i.id===item.id)||{};const view={...body,id:item.id,_shared:old._shared,thumbUrl:item._removePhoto?null:(item.thumb||old.thumbUrl),photoUrl:item._removePhoto?null:(item.photo||old.photoUrl)};setItems(list=>exists?list.map(i=>i.id===item.id?view:i):[view,...list]);track(exists?"item_edit":"item_add",{cat:item.category,photo:!!body.photoPath});toast(exists?"아이템을 저장했습니다.":"선반에 담았습니다.");setSheet("shelf")}catch(e){toast("저장하지 못했습니다. 사진이 너무 크면 다른 사진으로 시도해 주세요.")}
 }
 async function setItemPrivate(item,priv){if(demo)return;try{const clean={...item,private:priv,photo:"",thumb:""};delete clean._shared;await api.saveItem(uid,clean);setItems(list=>list.map(i=>i.id===item.id?{...i,private:priv}:i));track("item_private",{on:priv})}catch(e){toast("바꾸지 못했습니다.")}}
 async function deleteItem(id){const it=items.find(i=>i.id===id);try{await api.deleteItem(uid,it||{id});setItems(list=>list.filter(i=>i.id!==id));update(s=>{s.featured=(s.featured||[]).filter(x=>x!==id)});track("item_delete");toast("선반에서 뺐습니다.");setSheet("shelf")}catch(e){toast("지우지 못했습니다.")}}
 async function wipe(){try{await tracker.flush();if(profile&&profile.avatar==="photo")await api.removeAvatarPhoto(uid).catch(()=>{});await api.deleteMe();await api.logout();setSt(null);setItems([]);setProfile(null);setSession(null);setSheet(null);setRoute("gate");setGateMsg("계정과 모든 기록을 지웠습니다. 함께해 주셔서 고맙습니다.")}catch(e){toast("일부를 지우지 못했습니다. 다시 시도해 주세요.")}}
 async function logout(){await tracker.flush();await api.logout();setSheet(null);setSt(null);setProfile(null);setSession(null);setRoute("gate");tracker.uid=null}
 function reread(){setDraft(d=>({...d,quick:st.quick||d.quick||null,sources:{youtube:st.sources.youtube||"",youtubeChannel:st.sources.youtubeChannel||null,calendar:st.sources.calendar||"",story:st.sources.story||"",links:Array.isArray(st.sources.links)?st.sources.links:[]},answers:st.answers||["","",""]}));setSheet(null);setRoute("connect");track("reread_open")}
 async function setQuiet(v){try{await api.setQuiet(uid,v);setProfile(p=>({...p,quiet_view:v}));track("quiet",{on:v});toast(v?"조용히 보기를 켰어요.":"조용히 보기를 껐어요.")}catch(e){toast("바꾸지 못했습니다.")}}

 function openSheet(k){
  if(k==="home"){setRoute("home");setTab("me");setSheet(null);return}
  if(k==="reread"){if(demo){toast("예시 모드에서는 다시 읽지 않습니다.");return}reread();return}
  if(k.startsWith("tab:")){setRoute("home");setTab(k.slice(4));setSheet(null);return}
  if(k==="cardview"){if(st&&st.analysis)setShow(myCardFaces(st,items,stats,profile));return}
  if(k==="week"&&day<7&&!(profile&&profile.role==="admin")){toast("7일 비교 카드는 Day 7에 열립니다.");return}
  setSheet(k);
 }
 const openUser=id=>{if(!id)return;setSheet("user:"+id)};
 window.__openUser=openUser;window.__uid=uid;

 // ── render
 if(boot||route==="loading")return html`<div className="app"><div className="splash wrap"><div className="stack" style=${{alignItems:"center"}}><div className="pulse"><${GemView} g=${{stone:"오팔",form:"결정",texture:"유백",light:"번짐",hardness:2,grain:1,facets:8}} seed="splash" size=${120}/></div><p className="faint small">MyItemBook을 여는 중</p></div></div></div>`;
 if(route==="gate"||!session||!profile||!st)return html`<div className=${desk?"app flow":"app"}>${desk&&html`<${BrandPanel}/>`}<div className="flowcol">${gateMsg&&html`<div className="demo-bar wrap"><span>${gateMsg}</span><button onClick=${()=>setGateMsg("")}>닫기</button></div>`}<${Gate} initialCode=${initialCode} onSession=${(s,isNew)=>{setGateMsg("");setSession(s);if(isNew)setTimeout(()=>track("signup"),1500)}}/><${Toast} msg=${toastMsg}/></div></div>`;
 const fxEl=evo&&(evo.type==="badge"?html`<${BadgeOverlay} key=${evo.ids.join(",")} ids=${evo.ids} replay=${!!evo.replay} equippedTitle=${st&&st.flags.title} onClose=${nextFx} onEquip=${id=>{setSt(s=>({...s,flags:{...s.flags,title:id}}));toast(`칭호 '${badgeById(id).title}'를 달았어요.`)}} onBook=${route==="admin"?null:id=>{setFx([]);setRoute("home");setSheet("achieve")}}/>`:html`<${EvolveOverlay} evt=${evo} seed=${st.createdAt} onClose=${nextFx} onShare=${route==="admin"?null:()=>{setFx([]);setRoute("home");setSheet("cardimg")}}/>`);
 if(route==="admin"&&profile.role==="admin")return html`<div className="app wide"><${AdminScreen} uid=${uid} toast=${toast} onPreviewEvo=${previewEvo} onPreviewAway=${previewAway} onPreviewBadges=${previewBadges} onExit=${()=>setRoute(st.analysis?"home":"welcome")}/>${fxEl}<${Toast} msg=${toastMsg}/></div>`;

 const unread=notes.filter(n=>!n.read_at).length;
 let annSeen=0;try{annSeen=Number(localStorage.getItem("mib-ann-seen")||0)}catch(e){}
 const newAnn=anns.length&&anns[0].id>annSeen;
 const header=html`<header className="top wrap"><div className="logo">mib<small>${MIB_CONFIG.cohort}</small></div><div className="row" style=${{gap:"8px",flexWrap:"nowrap"}}>
  <span className="chip gold" title="CBT 날짜">D${Math.min(day,99)}</span>
  <button className="iconbtn" aria-label="도움말" onClick=${()=>setSheet("help")}><${Ico} n="help"/></button>
  ${profile.role==="admin"&&html`<button className="iconbtn" aria-label="운영 콘솔" onClick=${()=>{setRoute("admin");setSheet(null)}}><${Ico} n="cog"/></button>`}
  <button className="iconbtn badged" aria-label=${"알림"+(unread+(newAnn?1:0)?` ${unread+(newAnn?1:0)}개`:"")} onClick=${()=>setSheet("inbox")}><${Ico} n="bell"/>${(unread>0||newAnn)&&html`<span className="count">${unread+(newAnn?1:0)}</span>`}</button>
  ${route==="home"&&html`<button className="iconbtn" aria-label="연결 지도와 내 데이터" onClick=${()=>setSheet("data")}><${Ico} n="data"/></button>`}
 </div></header>`;
 const demoBar=demo&&html`<div className="demo-bar wrap"><span>예시 인물 '서윤'으로 둘러보는 중 · 저장되지 않음</span><button onClick=${endDemo}>${real&&real.st&&real.st.analysis?"내 카드로 돌아가기":"나의 결 찾기"}</button></div>`;
 const rt={aiReady,ytReady};

 const top=!demo&&html`<div className="stack">
  ${!desk&&html`<button className="merow" onClick=${()=>setSheet("avatar")}><${Avatar} p=${profile} size=${46}/><span className="grow"><b>${profile.nickname}</b><br/><span className="small faint">${profile.avatar?"프로필 이미지 바꾸기":"프로필 이미지 고르기 · 캐릭터 16종 또는 내 사진"}</span></span><span className="chev">›</span></button>`}
  ${!desk&&typeof hasNewUpdate==="function"&&hasNewUpdate(st)&&html`<button className="panel updbar" onClick=${()=>setSheet("updates")}><span className="upd-new">NEW</span><span className="grow"><b>업데이트 소식</b><br/><span className="small muted">${latestUpdate().date} · ${latestUpdate().title}</span></span><span className="chev">›</span></button>`}
  ${!!newAnn&&html`<button className="panel ann" onClick=${()=>setSheet("inbox")}><span className="eyebrow">운영 공지</span><b>${anns[0].title}</b></button>`}
  <${DailyQuestion} key=${"dq"+day} day=${day} answered=${dailyAnswered} toast=${toast} onDone=${reloadSoc}/>
</div>`;
 const mid=!demo&&html`<div className="stack">
  <${IdPrompt} st=${st} update=${update} onOpen=${openSheet} day=${day}/>
  <${AskPanel} stat=${askStat} incoming=${asksMe} names=${names} onOpen=${openSheet} friendsCount=${friendIds(uid,soc.friendships).length}/>
  <${KnowCard} st=${st} update=${update} toast=${toast} demo=${demo} onReread=${()=>openSheet("reread")}/>
  <${Missions} day=${day} stats=${stats} onOpen=${openSheet}/>
  ${day>=4&&stats.analyses<2&&html`<div className="panel tint stack"><b>중간 다시 읽기 · Day 4</b><span className="small muted">사흘 동안 남긴 한 줄과 한 걸음을 더해 나를 다시 읽어 보세요. 육각형에 지난 모습이 점선으로 겹쳐 보입니다.</span><button className="btn sm" onClick=${()=>openSheet("reread")}>새 기록 더해 다시 읽기</button></div>`}
  ${day>=7&&html`<div className="panel stack weekcard"><b className="serif" style=${{color:"var(--accent)",fontSize:"18px"}}>일주일 전 vs 지금</b><span className="small muted">Day 1의 젬과 오늘의 젬을 한 장에 담았어요.</span><div className="row"><button className="btn sm grow" onClick=${()=>{openSheet("week");api.postFeed("week",{})}}>7일 비교 카드 보기</button>${!stats.exitDone&&html`<button className="btn ghost sm grow" onClick=${()=>setSheet("exit")}>마무리 설문</button>`}</div></div>`}
 </div>`;

 let body=null;
 if(route==="welcome")body=html`<${Welcome} onStart=${startFlow} onDemo=${startDemo} rt=${rt} nickname=${profile.nickname}/>`;
 else if(route==="quick")body=html`<${QuickStart} draft=${draft} setDraft=${setDraft} onExit=${()=>setRoute("welcome")} onDone=${()=>setRoute("quickdone")}/>`;
 else if(route==="quickdone")body=html`<${QuickDone} draft=${draft} setDraft=${setDraft} aiReady=${aiReady} onMore=${()=>setRoute("connect")} onGo=${()=>runAnalysis()}/>`;
 else if(route==="connect")body=html`<${Connect} draft=${draft} setDraft=${setDraft} toast=${toast} rt=${rt} hasItems=${items.length>0} allowEmpty=${!!(draft.quick&&draft.quick.done)||!!st.analysis} nextLabel=${st.analysis?"새 기록으로 다시 읽기":draft.quick&&draft.quick.done?"자료 담고 돌아가기":"다음"} onBack=${()=>setRoute(st.analysis?"home":draft.quick&&draft.quick.done?"quickdone":"welcome")} onNext=${()=>st.analysis?runAnalysis():draft.quick&&draft.quick.done?setRoute("quickdone"):setRoute("quick")}/>`;
 else if(route==="questions")body=html`<${Questions} draft=${draft} setDraft=${setDraft} onBack=${()=>setRoute("connect")} onNext=${()=>runAnalysis()}/>`;
 else if(route==="reading")body=html`<${Reading} status=${reading.status} chars=${reading.chars} error=${reading.error} onStop=${stopAnalysis} onRetry=${()=>runAnalysis()} onBack=${()=>setRoute(st.analysis?"connect":"quickdone")} onDemo=${startDemo}/>`;
 else if(route==="reveal"&&st.analysis)body=html`<${Reveal} st=${st} onOpen=${openSheet} onConfirm=${()=>{update(s=>{s.analysis.status="yes"});track("reveal_yes")}} onEdit=${(sent,kw)=>{update(s=>{s.analysis.editSentence=sent||s.analysis.sentence;s.analysis.editKeywords=kw.length?kw:s.analysis.keywords;s.analysis.status="edited";s.flags.edited=true});track("reveal_edit")}} onDiffer=${fb=>{track("reveal_differ");runAnalysis(fb)}}/>`;
 else if(st.analysis){
  if(tab==="me")body=html`<${MeTab} me=${profile} st=${st} items=${items} soc=${demo?EMPTY_SOC:soc} stats=${stats} onOpen=${openSheet} names=${names} top=${desk?null:top} mid=${desk?null:mid}/>`;
  else if(tab==="step")body=html`<${StepTab} st=${st} update=${update} stats=${stats} canAI=${canAI} toast=${toast} onOpen=${openSheet} demo=${demo}/>`;
  else if(tab==="feed")body=html`<${FeedTab} uid=${uid} soc=${soc} names=${names} openUser=${openUser} toast=${toast} demo=${demo} reloadSoc=${reloadSoc} ensureNames=${ensureNames}/>`;
  else body=html`<${FriendsTab} uid=${uid} st=${st} soc=${soc} names=${names} reloadSoc=${reloadSoc} openUser=${openUser} toast=${toast} profile=${profile} demo=${demo} ensureNames=${ensureNames}/>`;
 } else body=html`<${Welcome} onStart=${startFlow} onDemo=${startDemo} rt=${rt} nickname=${profile.nickname}/>`;

 let sheetEl=null;const close=()=>setSheet(null);
 if(sheet==="help")sheetEl=html`<${HelpSheet} supportUrl=${supportUrl} onClose=${close} onFeedback=${()=>{setSheet(null);openFeedback()}}/>`;
 else if(sheet==="avatar")sheetEl=html`<${AvatarSheet} profile=${profile} uid=${uid} onClose=${close} onSaved=${onAvatarSaved} toast=${toast}/>`;
 else if(sheet==="inbox")sheetEl=html`<${InboxSheet} uid=${uid} notes=${notes} anns=${anns} names=${names} soc=${soc} onClose=${()=>{close();loadInbox()}} openUser=${openUser} reloadSoc=${reloadSoc} toast=${toast} isPublic=${!!(st&&st.visibility.public)} onPublish=${st&&st.analysis?()=>setSheet("publish"):null} onAsk=${k=>setSheet(k)} asksMe=${asksMe}/>`;
 else if(sheet==="data")sheetEl=html`<${DataSheet} st=${st} items=${items} profile=${profile} onClose=${close} onWipe=${wipe} onReread=${()=>openSheet("reread")} onLogout=${logout} toast=${toast} demo=${demo} setQuiet=${setQuiet}/>`;
 else if(sheet&&sheet.startsWith("user:"))sheetEl=html`<${ProfileSheet} key=${sheet} id=${sheet.slice(5)} uid=${uid} st=${st} soc=${soc} names=${names} onClose=${close} openUser=${openUser} reloadSoc=${reloadSoc} toast=${toast} demo=${demo} ensureNames=${ensureNames}/>`;
 else if(sheet&&st.analysis){
  if(sheet==="evidence")sheetEl=html`<${EvidenceSheet} st=${st} update=${update} onClose=${close}/>`;
  else if(sheet==="attrs")sheetEl=html`<${AttrsSheet} st=${st} update=${update} onClose=${close}/>`;
  else if(sheet==="shelf")sheetEl=html`<${ShelfSheet} st=${st} items=${items} onOpen=${openSheet} onClose=${close}/>`;
  else if(sheet.startsWith("item:")){const id=sheet.slice(5);const it=id==="new"?null:items.find(i=>i.id===id);sheetEl=html`<${ItemEditor} key=${sheet} item=${it} st=${st} canAI=${canAI} demo=${demo} toast=${toast} onSave=${saveItem} onDelete=${deleteItem} onClose=${()=>setSheet("shelf")}/>`}
  else if(sheet.startsWith("ask:")){const q=askStat&&askStat.questions.find(x=>String(x.id)===sheet.slice(4));sheetEl=q?html`<${AskSheet} q=${q} fids=${friendIds(uid,soc.friendships)} names=${names} toast=${toast} onClose=${close} onSent=${()=>{close();reloadSoc()}}/>`:null}
  else if(sheet==="asks")sheetEl=html`<${AnswersSheet} stat=${askStat} names=${names} onClose=${close} openUser=${openUser}/>`;
  else if(sheet==="answer"||sheet.startsWith("answer:"))sheetEl=html`<${AnswerSheet} incoming=${asksMe} names=${names} focus=${+sheet.split(":")[1]||null} toast=${toast} onClose=${close} onDone=${reloadSoc}/>`;
  else if(sheet==="updates")sheetEl=html`<${UpdatesSheet} st=${st} update=${update} onClose=${close} onOpen=${k=>setSheet(k)}/>`;
  else if(sheet==="gemwhy"&&st&&st.analysis)sheetEl=html`<${GemWhySheet} g=${livingGem(st)} seed=${st.createdAt} own=${true} onClose=${close}/>`;
  else if(sheet==="gem3d"&&st&&st.analysis)sheetEl=html`<${Gem3DView} g=${livingGem(st)} seed=${st.createdAt} name=${profile.nickname} onClose=${close}/>`;
  else if(sheet==="identity"||sheet.startsWith("identity:"))sheetEl=html`<${IdentitySheet} key=${sheet} st=${st} update=${update} onClose=${close} toast=${toast} demo=${demo} focus=${sheet.split(":")[1]||null}/>`;
  else if(sheet==="stay")sheetEl=html`<${StaySheet} st=${st} update=${update} onClose=${close} toast=${toast} demo=${demo} onOpen=${k=>setSheet(k)}/>`;
  else if(sheet==="stays")sheetEl=html`<${StaysSheet} st=${st} update=${update} onClose=${close}/>`;
  else if(sheet==="achieve"||sheet==="badgebox")sheetEl=html`<${AchieveSheet} st=${st} stats=${stats} update=${update} meName=${profile.nickname} start=${sheet==="badgebox"?"box":"book"} onClose=${close} onReplay=${replayBadge}/>`;
  else if(sheet==="publish")sheetEl=html`<${PublishSheet} st=${st} items=${items} stats=${stats} update=${update} onClose=${close} toast=${toast} demo=${demo} meName=${profile.nickname} uid=${uid} me=${profile} onItemPrivate=${setItemPrivate}/>`;
  else if(sheet==="mine")sheetEl=demo?null:html`<${MineSheet} uid=${uid} soc=${soc} names=${names} profile=${profile} onClose=${close} openUser=${openUser} ensureNames=${ensureNames}/>`;
  else if(sheet==="cardimg"||sheet==="week")sheetEl=html`<${ShareImageSheet} kind=${sheet==="week"?"week":"card"} st=${st} stats=${stats} profile=${profile} onClose=${close} toast=${toast} exitDone=${stats.exitDone} onExit=${()=>setSheet("exit")}/>`;
  else if(sheet==="exit")sheetEl=html`<${ExitSurvey} onClose=${close} stats=${stats} toast=${toast} onDone=${()=>{close();reloadSoc()}}/>`;
 }
 const seenT=(st&&st.flags&&st.flags.seenTabs)||{};const tdy=dayKey();
 const newFriend=!!st&&((pulse&&pulse.card>(seenT.friends||0))||soc.friendships.some(f=>f.status==="accepted"&&Date.parse(f.created_at||0)>(seenT.friends||0)))&&!!seenT.friends;
 const newFeed=!!(pulse&&pulse.feed>(seenT.feed||0))&&!!seenT.feed;
 const newStep=!!st&&seenT.step!==tdy&&(!(st.steps.done||[]).includes(tdy)||!(st.logs||[]).some(l=>l.day===tdy));
 const newTabs={me:!desk&&!!st&&typeof hasNewUpdate==="function"&&hasNewUpdate(st),friends:newFriend&&tab!=="friends",feed:newFeed&&tab!=="feed",step:newStep&&tab!=="step"};
 const tabs=route==="home"&&st.analysis&&html`<nav className="tabbar" aria-label="메인">${[["me","나","me"],["step","한 걸음","step"],["feed","소식","feed"],["friends","친구","people"]].map(([k,t,ic])=>html`<button key=${k} className="tab" aria-current=${tab===k?"page":undefined} onClick=${()=>{setTab(k);setSheet(null);window.scrollTo(0,0)}}><${Ico} n=${ic}/>${t}${newTabs[k]?html`<span className="upd-new tabnew" aria-label="새 소식">NEW</span>`:k==="friends"&&soc.friendships.some(f=>f.status==="pending"&&f.addressee===uid)?html`<i className="tabdot" aria-label="새 친구 요청"></i>`:null}</button>`)}</nav>`;
 const fab=!demo&&!fbOpen&&route!=="reading"&&html`<button className=${"fab"+(tabs?" up":"")} onClick=${openFeedback} aria-label="이 화면에 대한 의견 보내기"><${Ico} n="chat"/>의견</button>`;
 const pending=soc.friendships.some(f=>f.status==="pending"&&f.addressee===uid);
 if(desk&&route==="home"&&st.analysis)return html`<div className="app desk">${header}${demoBar}<div className="shell"><${DeskSide} newTabs=${newTabs} updNew=${typeof hasNewUpdate==="function"&&hasNewUpdate(st)} tab=${tab} setTab=${setTab} setSheet=${setSheet} openSheet=${openSheet} profile=${profile} day=${day} pending=${pending} unread=${unread} onFeedback=${openFeedback} onAdmin=${profile.role==="admin"?()=>{setRoute("admin");setSheet(null)}:null}/><div className="content">${body}</div><${DeskRail} tab=${tab} st=${st} stats=${stats} openSheet=${openSheet} setTab=${setTab} top=${demo?null:top} mid=${demo?null:mid}/></div>${sheetEl}${fab}${(route==="home"||route==="reveal")&&fxEl}${fbOpen&&html`<${FeedbackSheet} screen=${screen} shot=${fbShot} onClose=${()=>{setFbOpen(false);setFbShot(null)}} onHelp=${()=>{setFbOpen(false);setFbShot(null);setSheet("help")}} toast=${toast}/>`}${show&&html`<${CardShowcase} faces=${show} toast=${toast} onClose=${()=>setShow(null)}/>`}<${Toast} msg=${toastMsg}/></div>`;
 if(desk)return html`<div className="app flow"><${BrandPanel}/><div className="flowcol">${header}${demoBar}${body}${tabs}${sheetEl}${fab}${(route==="home"||route==="reveal")&&fxEl}${fbOpen&&html`<${FeedbackSheet} screen=${screen} shot=${fbShot} onClose=${()=>{setFbOpen(false);setFbShot(null)}} onHelp=${()=>{setFbOpen(false);setFbShot(null);setSheet("help")}} toast=${toast}/>`}<${Toast} msg=${toastMsg}/></div></div>`;
 return html`<div className="app">${header}${demoBar}${body}${tabs}${sheetEl}${fab}${(route==="home"||route==="reveal")&&fxEl}${fbOpen&&html`<${FeedbackSheet} screen=${screen} shot=${fbShot} onClose=${()=>{setFbOpen(false);setFbShot(null)}} onHelp=${()=>{setFbOpen(false);setFbShot(null);setSheet("help")}} toast=${toast}/>`}${show&&html`<${CardShowcase} faces=${show} toast=${toast} onClose=${()=>setShow(null)}/>`}<${Toast} msg=${toastMsg}/></div>`;
}
function TopNotes(){const nv=useNewVersion();return html`${nv&&html`<${NewVersionBar}/>`}<${InAppBar}/>`}
ReactDOM.createRoot(document.getElementById("root")).render(html`<${ErrorBoundary}><${TopNotes}/><${App}/><//>`);
