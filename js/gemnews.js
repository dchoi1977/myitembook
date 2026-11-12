"use strict";
/* MIB CBT · 친구 젬 소식 — My GEMS에서 NEW가 붙은 친구의 젬을 누르면
   지난번에 본 모습 → 지금 모습으로 바뀌는 연출을 보여 주고, 바뀐 것을 카드뉴스로 넘겨 본다.
   · 비교 기준(지난번에 본 모습)은 이 기기에만 저장한다(친구 한 명당 1KB 남짓, 서버에 보내지 않음).
   · 실제로 달라진 것이 있을 때만 NEW. 같은 변화는 한 번만 보여 준다. */

const GN_KEY=uid=>"mib_gemsnap_"+uid;
function gnLoad(uid){try{const v=JSON.parse(localStorage.getItem(GN_KEY(uid))||"null");return v&&typeof v==="object"?v:{}}catch(e){return {}}}
function gnSave(uid,all){try{localStorage.setItem(GN_KEY(uid),JSON.stringify(all))}catch(e){}}
const gnName=x=>typeof x==="string"?x:(x&&(x.name||x.n||x.title))||"";
/* 카드에서 비교에 쓸 것만 추린다 */
function friendSnap(card){const d=(card&&card.data)||{};const g={...(d.gem||{})};delete g.basis;delete g.reasons;
 return {at:Date.now(),g,n:d.gemName||"",s:d.stage||1,t:d.title||"",b:[...(d.badgesAll||d.badges||[])],c:(d.crests||[]).map(gnName).filter(Boolean),i:(d.items||[]).map(gnName).filter(Boolean),sh:+d.shelf||0,sen:String(d.sentence||"").slice(0,80)}}
/* 바뀐 것 목록 — 중요한 순서대로 */
function friendDiff(p,c){if(!p||!c)return [];const out=[];const pg=p.g||{},cg=c.g||{};
 if(c.s>p.s)out.push({k:"stage",big:true,glyph:"별",h:`연마 ${c.s}단계 · ${STAGES[c.s]||""}`,d:`${STAGES[p.s]||"원석"}에서 ${josa(STAGES[c.s]||"","으로")} ${c.s-p.s>1?(c.s-p.s)+"단계를 단숨에 올랐어요":"한 단계 더 깎였어요"}. 젬이 더 커지고 맑아졌어요.`});
 if(cg.stone&&pg.stone&&cg.stone!==pg.stone)out.push({k:"stone",big:true,glyph:"눈",h:`${pg.stone} → ${josa(cg.stone,"으로")}`,d:"다시 읽은 결이 짙어져 젬의 원석이 바뀌었어요."});
 else if(c.n&&p.n&&c.n!==p.n)out.push({k:"name",glyph:"눈",h:`새 이름 · ${c.n}`,d:`'${p.n}'에서 '${josa(c.n,"으로")}' 빛깔이 달라졌어요.`});
 try{const pa=new Set((gemIdentity(pg,p.n).aw||[]).map(a=>a.k));(gemIdentity(cg,c.n).aw||[]).filter(a=>!pa.has(a.k)).forEach(a=>out.push({k:"aw:"+a.k,big:true,glyph:"별",h:`깨어남 · ${a.n}`,d:"연마가 오르며 젬 속에 숨어 있던 것이 깨어났어요."}))}catch(e){}
 if((cg.facets||0)>(pg.facets||0))out.push({k:"facets",glyph:"산",h:`면 ${cg.facets-pg.facets}개 더`,d:`젬의 면이 ${pg.facets}개에서 ${cg.facets}개가 됐어요. 관심 갈래가 넓어졌다는 뜻이에요.`});
 if((cg.hardness||0)>(pg.hardness||0))out.push({k:"hard",glyph:"산",h:`단단함 ${cg.hardness}/5`,d:"오래 이어 온 일이 쌓여 젬이 더 단단해졌어요."});
 if((cg.grain||0)>(pg.grain||0))out.push({k:"grain",glyph:"새싹",h:`결 ${cg.grain-pg.grain}줄 더`,d:"기록 속 전환점이 늘어 젬에 결이 새겨졌어요."});
 const pm=pg.marks||{},cm=cg.marks||{};(typeof MARKS!=="undefined"?MARKS:[]).forEach(m=>{const a=pm[m.k]||0,b=cm[m.k]||0;if(b>a)out.push({k:"mark:"+m.k,glyph:"별",h:`${m.label} · ${markTitle(m,b)}`,d:m.head+"."})});
 const pb=new Set(p.b||[]);(c.b||[]).filter(id=>!pb.has(id)).forEach(id=>{const b=typeof badgeById==="function"?badgeById(id):null;if(b)out.push({k:"b:"+id,glyph:b.glyph||"별",h:`새 배지 · ${b.name}`,d:b.desc||""})});
 if(c.t&&c.t!==p.t)out.push({k:"title",glyph:"왕관",h:`칭호 · ${c.t}`,d:p.t?`'${p.t}'에서 새 칭호로 바꿔 달았어요.`:"새 칭호를 달았어요."});
 const pc=new Set(p.c||[]);(c.c||[]).filter(x=>!pc.has(x)).forEach(x=>out.push({k:"c:"+x,glyph:"왕관",h:`휘장 · ${x}`,d:"휘장 선반에 새 휘장을 진열했어요."}));
 const pi=new Set(p.i||[]);const ni=(c.i||[]).filter(x=>!pi.has(x));if(ni.length)out.push({k:"items",glyph:"선반",h:`선반 · ${ni.slice(0,2).join(", ")}${ni.length>2?` 외 ${ni.length-2}개`:""}`,d:"선반에 새로 담은 것이 있어요."});
 else if(c.sh>p.sh)out.push({k:"shelf",glyph:"선반",h:`선반 +${c.sh-p.sh}`,d:"선반에 담은 것이 늘었어요."});
 if(c.sen&&p.sen&&c.sen!==p.sen)out.push({k:"sen",glyph:"펜",h:"새 한 문장",d:`"${c.sen}"`});
 return out}
const gnGemChanged=ch=>ch.some(x=>x.k==="stage"||x.k==="stone"||x.k==="name"||x.k==="facets"||x.k.startsWith("aw:")||x.k.startsWith("mark:")||x.k==="hard"||x.k==="grain");

/* 연출 + 카드뉴스 */
function GemNews({name,prev,card,changes,feed,onClose,onCard,onProfile,uid,fid,soc,reloadSoc,toast,demo}){
 const cur=friendSnap(card);const reduce=typeof matchMedia==="function"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 const morph=!!prev&&gnGemChanged(changes)&&!reduce;
 const [phase,setPhase]=useState(morph?"old":"cards");const [i,setI]=useState(0);const track_=useRef(null);
 useBackLayer(onClose);
 useEffect(()=>{if(phase==="cards")return;const t1=setTimeout(()=>setPhase("shift"),1100),t2=setTimeout(()=>setPhase("new"),2300),t3=setTimeout(()=>setPhase("cards"),3600);return()=>{clearTimeout(t1);clearTimeout(t2);clearTimeout(t3)}},[]);
 useEffect(()=>{const k=e=>{if(e.key==="Escape")onClose();if(phase==="cards"&&e.key==="ArrowRight")go(i+1);if(phase==="cards"&&e.key==="ArrowLeft")go(i-1)};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[phase,i]);
 const list=prev?changes.slice(0,5):(feed||[]).slice(0,4).map(ev=>({k:"f"+ev.id,glyph:FEED_GLYPH[ev.kind]||"별",h:FEED_TEXT[ev.kind]?FEED_TEXT[ev.kind](ev.payload||{}):"새 소식",d:ago(ev.created_at)}));
 const more=prev?Math.max(0,changes.length-5):0;
 const pages=[{k:"cover"},...list.map(x=>({k:"c",x})),{k:"end"}];
 const go=n=>{n=clamp(n,0,pages.length-1);setI(n);const el=track_.current;if(el)el.scrollTo({left:el.clientWidth*n,behavior:reduce?"auto":"smooth"})};
 const onScroll=e=>{const el=e.currentTarget;const n=Math.round(el.scrollLeft/Math.max(1,el.clientWidth));if(n!==i)setI(n)};
 const g0=prev?{...cur.g,...prev.g}:cur.g;
 if(phase!=="cards")return html`<div className=${"gn gn-stage "+phase} role="dialog" aria-modal="true" aria-label=${name+"님의 젬이 달라졌어요"} onClick=${()=>setPhase("cards")}>
  <div className="gn-rays" aria-hidden="true"></div>
  <div className="gn-morph"><span className="gn-old"><${GemView} g=${g0} seed=${prev.n||cur.n} size=${200}/></span><span className="gn-new"><${GemView} g=${cur.g} seed=${cur.n} size=${200}/></span><i className="gn-flash" aria-hidden="true"></i></div>
  <div className="gn-cap"><span className="eyebrow">FRIEND'S GEM</span><b>${phase==="old"?`지난번에 본 ${name}님의 젬`:`${name}님의 젬이 달라졌어요`}</b><span className="small">${phase==="new"?cur.n:prev.n||""}</span></div>
  <span className="gn-skip">눌러서 건너뛰기</span>
 </div>`;
 return html`<div className="gn gn-cards" role="dialog" aria-modal="true" aria-label=${name+"님의 젬 소식"}>
  <div className="gn-top"><span className="small">${name}님의 젬 소식 · ${i+1}/${pages.length}</span><button className="gn-x" aria-label="닫기" onClick=${onClose}>×</button></div>
  <div className="gn-track" ref=${track_} onScroll=${onScroll}>
   ${pages.map((p,n)=>html`<section key=${n} className=${"gn-card"+(p.k==="cover"?" cover":p.k==="end"?" end":"")} aria-hidden=${n!==i}>
    ${p.k==="cover"?html`<span className="eyebrow">${prev?"지난번 이후":"최근 소식"}</span>
      <h2 className="serif">${prev?`${name}님의 젬이\n이렇게 자랐어요`:`${name}님의\n요즘 이야기`}</h2>
      ${prev&&gnGemChanged(changes)?html`<div className="gn-ba"><span><${GemView} g=${g0} seed=${prev.n||cur.n} size=${88}/><small>지난번</small></span><b aria-hidden="true">→</b><span><${GemView} g=${cur.g} seed=${cur.n} size=${110}/><small>지금</small></span></div>`:html`<div className="gn-ba one"><${GemView} g=${cur.g} seed=${cur.n} size=${120}/></div>`}
      <p className="gn-gname">${cur.n}</p>
      <p className="small">${prev?`달라진 것 ${changes.length}가지`:list.length?`최근 소식 ${list.length}개`:"아직 소식이 없어요"} · 옆으로 넘겨 보세요 ›</p>`
    :p.k==="c"?html`<span className="gn-glyph"><${Glyph} name=${p.x.glyph} size=${34}/></span><h3 className="serif">${p.x.h}</h3><p>${p.x.d}</p>${p.x.big&&html`<div className="gn-mini"><${GemView} g=${cur.g} seed=${cur.n} size=${96}/></div>`}`
    :html`<span className="eyebrow">함께 기뻐하기</span><h3 className="serif">${name}님에게\n마음을 건네 볼까요?</h3>${more>0&&html`<p className="small">그 밖에 달라진 것 ${more}가지는 카드에서 볼 수 있어요.</p>`}
      <${MnSend} fid=${fid} name=${name} ctx=${prev&&changes[0]?changes[0].h:(list[0]&&list[0].h)||"젬 소식"} toast=${toast} demo=${demo}/>
      <div className="gn-acts"><button className="btn ghost block" onClick=${onCard}>카드 펼쳐 보기</button><button className="linkbtn small" onClick=${onProfile}>프로필로 가기</button></div>`}
   </section>`)}
  </div>
  <div className="gn-nav"><button className="gn-arrow" aria-label="이전" disabled=${i===0} onClick=${()=>go(i-1)}>‹</button><div className="gn-dots">${pages.map((_,n)=>html`<i key=${n} className=${n===i?"on":""}></i>`)}</div><button className="gn-arrow" aria-label="다음" disabled=${i===pages.length-1} onClick=${()=>go(i+1)}>›</button></div>
 </div>`;
}


