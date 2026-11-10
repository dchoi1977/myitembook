"use strict";
/* MIB CBT · 나의 휘장 — 뿌리·터전·배움·소속·영예·조명.
   내가 걸어온 길을 휘장으로 새겨 진열하고, 대표 한 줄·휘장 스탯·젬의 형질(뿌리·면·깃발·월계관·조명)에 스며들게 한다.
   터전은 그 자리에 있을 때만 인증되고, 좌표는 저장하지 않으며 다른 사람에게는 시·구까지만 보인다. */

const ID_CATS=[
 {k:"root",n:"뿌리",q:"나고 자라고 지낸 곳",types:["태어난 곳","자란 곳","지낸 곳"],ph:"예) 전남 목포, 서울 마포구, 캐나다 밴쿠버",lab:"지역",
  ask:"어디서 나고 자랐나요? 고향을 남기면 젬 아래로 뿌리가 내려요.",eff:"젬 아래 뿌리"},
 {k:"home",n:"터전",q:"지금의 터전 · 집과 일터",types:["집","일터","작업실"],verify:true,
  ask:"지금 집이나 일터에 있나요? 그 자리에서 인증하면 '터전' 휘장이 생기고, 다른 날 다시 인증할수록 단단해져요.",eff:"뿌리를 더 깊게"},
 {k:"school",n:"배움",q:"배운 곳",types:["초등학교","중학교","고등학교","대학교","대학원","배움터"],ph:"예) 홍익대학교",lab:"학교 이름",extra:"전공·과정 (선택)",
  ask:"어디서 배웠나요? 배운 곳마다 젬의 면(각)이 하나씩 더 깎여요.",eff:"젬의 면 +1"},
 {k:"org",n:"소속",q:"함께하는 곳",types:["직장","학교","교회","동호회","소모임","클럽","단체"],ph:"예) 넥서스, 창신교회, 주말 등산 모임",lab:"이름",extra:"역할·직함 (선택)",
  ask:"지금 어디에 속해 있나요? 소속마다 그곳의 빛깔로 젬 곁에 깃발이 올라요.",eff:"젬 곁 깃발"},
 {k:"honor",n:"영예",q:"상·자격·칭호",types:["상장·표창","자격·면허","크리에이터 버튼","수석·장학","기록·완주","시민상","기타 영예"],ph:"예) 정보처리기사, 용감한 시민상, 마라톤 풀코스 완주",lab:"영예 이름",extra:"수여한 곳 (선택)",
  ask:"받은 상이나 자격, 자랑하고 싶은 칭호가 있나요? 영예가 쌓이면 젬에 월계관이 둘러져요.",eff:"젬의 월계관"},
 {k:"media",n:"조명",q:"출연·소개",types:["TV","라디오","신문","잡지","온라인","팟캐스트","샤라웃","강연·무대"],ph:"예) KBS, 매일경제, 유튜브 ○○ 채널",lab:"매체·채널",extra:"프로그램·기사 제목 (선택)",
  ask:"방송·신문·온라인에 소개된 적이 있나요? 조명을 받을수록 젬 위로 스포트라이트가 내려와요.",eff:"젬 위 스포트라이트"}];
const ID_MAX_SHOW=4;
const TIERS={def:["금","은","동","특별"],button:["실버","골드","다이아"]};
const tierSet=type=>type==="크리에이터 버튼"?TIERS.button:TIERS.def;
const METAL={"금":["#F6DF98","#D4A43C","#8C6618"],"은":["#F2F5F8","#B5C3CC","#6E7884"],"동":["#F2C49A","#C27A45","#6E3A18"],"특별":["#E6D7F6","#A57FDB","#4B2E73"],"실버":["#F2F5F8","#B5C3CC","#6E7884"],"골드":["#FFE9A8","#D4A43C","#8C6618"],"다이아":["#F4FCFF","#9FDCF2","#3E7FB0"]};
const HERALD=[["#1F3A68","#D4A43C"],["#7A1F2B","#E9C25A"],["#1E5A43","#D9C08A"],["#5B3A8C","#E2BC5C"],["#8C4A18","#F2D49A"],["#1C5D73","#E7D29A"],["#2E2E36","#C9A45A"],["#3F6B2A","#EAD27A"],["#7C2E5A","#F0C9A0"],["#2D4F8C","#C9D6EA"],["#4A3A2A","#E2C27A"],["#0F5257","#BFE3D6"]];
const HOME_LV=["","터를 잡은","자리 잡은","터줏대감","오랜 터줏대감","전설의 터줏대감"];
const SCHOOL_RANK={"초등학교":1,"중학교":2,"고등학교":3,"배움터":3,"대학교":4,"대학원":5};

const idOf=st=>((st&&st.identity&&st.identity.entries)||[]);
const idCat=k=>ID_CATS.find(c=>c.k===k)||ID_CATS[0];
function hashStr(s){let h=2166136261;for(const ch of String(s||""))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0}
const crestColors=name=>HERALD[hashStr(name)%HERALD.length];
function shortSido(s){s=String(s||"").trim();const m=/^(충청|경상|전라)(남|북)도$/.exec(s);if(m)return m[1][0]+m[2];return s.replace(/(특별자치도|특별자치시|특별시|광역시|도)$/,"")||s}
const areaOf=v=>v?[shortSido(v.sido),v.gu].filter(Boolean).join(" "):"";
const homeDays=e=>((e.verify||{}).days||[]).length;
const homeLv=d=>d>=30?5:d>=14?4:d>=7?3:d>=3?2:d>=1?1:0;
function monoOf(name){let s=String(name||"").trim().replace(/^\(주\)\s*|^주식회사\s*|\s*주식회사$|\s*\(주\)$/g,"").trim();if(!s)return "?";
 if(/^[A-Za-z0-9]/.test(s)){const w=s.split(/[\s\-&.]+/).filter(x=>x&&!/^(of|the|and|for|at|inc|co|ltd)$/i.test(x));return (w.length>1?w.slice(0,3).map(x=>x[0]).join(""):w[0].slice(0,3)).toUpperCase()}
 const first=s.split(/\s+/)[0];const core=first.replace(/(여자고등학교|여자중학교|고등학교|중학교|초등학교|대학교|대학원|학교|교회|성당|협회|재단|그룹|컴퍼니|코리아)$/,"")||first;const ch=[...core];return ch.slice(0,ch.length<=3?3:2).join("")}
const schoolShort=n=>String(n||"").split(/\s+/)[0].replace(/대학교$/,"대").replace(/고등학교$/,"고").replace(/중학교$/,"중").replace(/초등학교$/,"초");

/* ───────── stats: six levels (0–5) that feed badges, the gem and the AI ───────── */
function idStats(st){const E=idOf(st);const by=k=>E.filter(e=>e.cat===k);
 const hd=Math.max(0,...by("home").map(homeDays));
 const honorW=by("honor").reduce((a,e)=>a+(["금","골드","다이아","특별"].includes(e.tier)?2:1),0);
 const mediaW=by("media").reduce((a,e)=>a+(["TV","신문","라디오"].includes(e.type)?2:1),0);
 const lv={root:clamp(by("root").length*2,0,5),home:homeLv(hd),school:clamp(by("school").length,0,5),org:clamp(by("org").length,0,5),honor:clamp(honorW,0,5),media:clamp(mediaW,0,5)};
 const n={};ID_CATS.forEach(c=>n[c.k]=by(c.k).length);
 return {lv,n,homeDays:hd,cats:ID_CATS.filter(c=>n[c.k]>0).length,shown:E.filter(e=>e.display).length,total:E.length}}
/* what the gem takes from it */
function idMarks(st){const S=idStats(st);const E=idOf(st);if(!E.length)return null;
 return {laurel:S.lv.honor,spot:S.lv.media,roots:clamp(Math.ceil((S.lv.root+S.lv.home)/2),0,5),banners:E.filter(e=>e.cat==="org").slice(0,3).map(e=>crestColors(e.name)[0]),facets:Math.min(2,S.n.school)}}

/* ───────── 대표 한 줄 ───────── */
const ORG_VERB={"직장":["에서 일하고","에서 일하는"],"학교":["에 다니고","에 다니는"],"교회":["에 다니고","에 다니는"]};
function autoLine(st){const E=idOf(st);const parts=[];
 const root=E.find(e=>e.cat==="root"&&e.type==="태어난 곳")||E.find(e=>e.cat==="root"&&e.type==="자란 곳")||E.find(e=>e.cat==="root");
 if(root){const p=String(root.name).split(/[,·]/)[0].trim();parts.push(root.type==="지낸 곳"?[`${p}에서 지내고`,`${p}에서 지낸`]:[`${p}에서 나고 자라`,`${p}에서 나고 자란`])}
 const sc=[...E.filter(e=>e.cat==="school")].sort((a,b)=>(SCHOOL_RANK[b.type]||0)-(SCHOOL_RANK[a.type]||0))[0];
 if(sc)parts.push([`${schoolShort(sc.name)}에서 배우고`,`${schoolShort(sc.name)}에서 배운`]);
 const org=E.find(e=>e.cat==="org"&&e.type==="직장")||E.find(e=>e.cat==="org");
 if(org){const v=ORG_VERB[org.type]||["에서 활동하고","에서 활동하는"];parts.push([org.name+v[0],org.name+v[1]])}
 if(!parts.length)return "";
 return parts.map((p,i)=>i<parts.length-1?p[0]:p[1]).join(" ")+" 사람"}
function idLine(st){const I=(st&&st.identity)||{};if(I.lineOff)return "";return (I.motto||"").trim()||autoLine(st)}
const shownCrests=st=>idOf(st).filter(e=>e.display).sort((a,b)=>(a.shownAt||0)-(b.shownAt||0)).slice(0,ID_MAX_SHOW);
/* what other people get: never coordinates, never the dong for 터전, never links */
function publicCrest(e){const o={sym:e.sym||"auto",cat:e.cat,type:e.type,name:e.cat==="home"?areaOf(e.verify):e.name,tier:e.tier||"",year:e.year||""};if(e.cat==="home"){o.lv=homeLv(homeDays(e));o.type="터전"}if(e.cat==="school"||e.cat==="org")o.extra="";return o}
function crestLabel(e,pub){const c=e.cat;
 if(c==="home")return {t:pub?e.name:areaOf(e.verify),s:(pub?"":e.type+" · ")+(HOME_LV[e.lv!=null?e.lv:homeLv(homeDays(e))]||"터전")};
 if(c==="school")return {t:schoolShort(e.name),s:e.type};
 if(c==="honor")return {t:e.name,s:[e.tier,e.year].filter(Boolean).join(" · ")||e.type};
 if(c==="media")return {t:e.name,s:e.type+(e.year?" · "+e.year:"")};
 return {t:e.name,s:e.type}}

/* ───────── 휘장 그림 (SVG 100×112) — 실제 로고 대신 이름에서 뽑은 이니셜·빛깔로 새긴 고유 문양 ───────── */
const IC={
 book:'<path d="M3 6c3-1.5 6-1.5 9 0v13c-3-1.5-6-1.5-9 0zM12 6c3-1.5 6-1.5 9 0v13c-3-1.5-6-1.5-9 0z"/>',
 brief:'<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3M3 13h18"/>',cross:'<path d="M12 3v18M6 9h12"/>',
 heart:'<path d="M12 20C5 15 3 11 3 8.5a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1C21 11 19 15 12 20z"/>',people:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c1-4 4-5 6-5s5 1 6 5M10 20c1-4 4-5 6-5s5 1 6 5"/>',
 star:'<path d="M12 3l2.7 5.7 6.3.8-4.6 4.4 1.2 6.2L12 17.1 6.4 20.1l1.2-6.2L3 9.5l6.3-.8z"/>',flag:'<path d="M5 21V3M5 4h12l-3 4 3 4H5"/>',
 scroll:'<path d="M6 4h11a2 2 0 0 1 0 4H8v10a2 2 0 0 1-4 0V6a2 2 0 0 1 2-2z"/><path d="M10 11h6M10 14h5"/>',check:'<circle cx="12" cy="12" r="8"/><path d="M8 12l3 3 5-6"/>',
 crown:'<path d="M3 18L2 7l5 4 5-7 5 7 5-4-1 11z"/>',finish:'<path d="M5 21V3"/><path d="M5 4h14v9H5"/><path d="M5 8.5h14M9.7 4v9M14.3 4v9"/>',shield:'<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z"/><path d="M12 16c-3-2-4-4-4-5.5a2 2 0 0 1 4-.5 2 2 0 0 1 4 .5c0 1.5-1 3.5-4 5.5z"/>',
 play:'<path d="M9 7l8 5-8 5z"/>',tv:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 3l4 4 4-4"/>',radio:'<path d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0"/><circle cx="12" cy="12" r="1.5"/><path d="M12 14v6"/>',
 paper:'<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M7 8h10M7 12h5M7 16h5M14 12h3v4h-3z"/>',mag:'<rect x="5" y="3" width="14" height="18" rx="1.5"/><path d="M8 7h8M8 17h5"/><circle cx="12" cy="12" r="2.5"/>',
 online:'<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>',mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
 mega:'<path d="M3 10v4l11 5V5zM14 9h3a3 3 0 0 1 0 6h-3M6 15l1 5"/>',stage:'<path d="M12 3l-6 9h12z"/><path d="M4 21h16M8 21v-4h8v4"/>',
 house:'<path d="M3 11L12 4l9 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>',build:'<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
 brush:'<path d="M20 3L10 13"/><path d="M10 13c-3-1-6 1-6 4 0 2-1 3-2 4 5 1 9-1 9-5z"/>',leaf:'<path d="M12 21V11"/><path d="M12 12C12 7 8 4 3 4c0 5 4 8 9 8zM12 10c0-4 3-7 9-7 0 5-4 7-9 7z"/>'};
const TYPE_IC={"직장":"brief","학교":"book","교회":"cross","동호회":"heart","소모임":"people","클럽":"star","단체":"flag","상장·표창":"scroll","자격·면허":"check","크리에이터 버튼":"play","수석·장학":"crown","기록·완주":"finish","시민상":"shield","기타 영예":"star",
 "TV":"tv","라디오":"radio","신문":"paper","잡지":"mag","온라인":"online","팟캐스트":"mic","샤라웃":"mega","강연·무대":"stage","집":"house","일터":"build","작업실":"brush","터전":"house","태어난 곳":"leaf","자란 곳":"leaf","지낸 곳":"leaf"};
const icon=(k,x,y,s,col,w=1.8)=>`<g transform="translate(${x} ${y}) scale(${s/24})" fill="none" stroke="${col}" stroke-width="${w*24/s}" stroke-linecap="round" stroke-linejoin="round">${IC[k]||IC.star}</g>`;
const monoText=(m,y,col,big)=>{const n=[...m].length;const fs=/^[A-Z0-9]+$/.test(m)?(n>=3?24:n===2?30:36):(n>=3?21:n===2?27:34);return `<text x="50" y="${y}" text-anchor="middle" dominant-baseline="central" font-family="'Noto Serif KR','Apple SD Gothic Neo',serif" font-weight="700" font-size="${big?fs+4:fs}" fill="${col}" letter-spacing="${/^[A-Z]/.test(m)?1.5:0}">${m.replace(/[<&>]/g,"")}</text>`};
/* 상징 동물 — 학교·단체가 널리 알려 온 상징 동물을 MIB 휘장 양식으로 새로 그린 문양 (각 학교 마스코트 캐릭터·로고를 옮기지 않음) */
const ANIMALS={
 tiger:{n:"호랑이",d:(W,c)=>`<path d="M5 9.5L4.5 3.5 9 6.5h6l4.5-3-.5 6c1.2 2 1.3 5 .3 7.3C18 20 15.3 21.5 12 21.5S6 20 4.7 16.8c-1-2.3-.9-5.3.3-7.3z" fill="${W}"/><path d="M12 6.8v3M9.3 7.2l.9 2.2M14.7 7.2l-.9 2.2M4.8 12.2h2.6M19.2 12.2h-2.6M5.4 15h2.2M18.6 15h-2.2" stroke="${c}" stroke-width="1.2" stroke-linecap="round"/><circle cx="9.3" cy="12.4" r="1.1" fill="${c}"/><circle cx="14.7" cy="12.4" r="1.1" fill="${c}"/><path d="M10.6 15.6h2.8L12 17.2z" fill="${c}"/><path d="M12 17.2c-.6 1.4-2 1.6-2.8 1M12 17.2c.6 1.4 2 1.6 2.8 1" stroke="${c}" stroke-width=".9" fill="none" stroke-linecap="round"/>`},
 eagle:{n:"독수리",d:(W,c)=>`<path d="M4 22c0-7.5 2.2-12.8 7.4-15C16 5 20.4 6.4 21.6 9.6l-3.2.6.9 2.6c-1.4 1-3.2.9-4.4-.1-.7 3.4-3.1 5.4-3.4 9.3z" fill="${W}"/><path d="M18.4 10.2l3.2-.6c.3 1.2-.2 2.4-1.4 3.2" fill="${c}" opacity=".35"/><circle cx="15.2" cy="9.6" r="1.1" fill="${c}"/><path d="M8 13c1.5-.4 3-.2 4.2.6M7 16.4c1.6-.3 3.1 0 4.2.8" stroke="${c}" stroke-width=".9" fill="none" stroke-linecap="round" opacity=".6"/>`},
 crane:{n:"학",d:(W,c)=>`<path d="M14.2 3.2c1.6.1 2.6 1.1 2.4 2.4l2.8.6-2.9.8c-.8.6-1.6 1.2-1.9 2.4l-.6 5.2c3.2.2 5.5 1.9 6.3 4.4-4.4 1.2-9.2.7-12.4-1.3l3.8-1.3.1-6.4c-.1-1.6.4-3 1.4-4.2.3-1.7.4-2.6 1-2.6z" fill="${W}"/><circle cx="14.6" cy="3.6" r="1.2" fill="#D9473A"/><path d="M11 18.6l-1 3.6M13.4 18.8l.6 3.4" stroke="${W}" stroke-width="1" stroke-linecap="round"/><path d="M16.8 16.4c1.4.4 2.6 1.2 3.2 2.2" stroke="${c}" stroke-width=".8" fill="none" opacity=".6"/>`},
 dragon:{n:"용",d:(W,c)=>`<path d="M4.5 20.5c3.4.2 5.2-2 5.2-5 0-3.4 2-6.6 5.8-7.6l-1-2.6 2.6 1.6 1-2.4.8 2.8c1.6.5 2.6 1.6 3 3.1l-2.6-.3c-1.5-.2-2.8.6-3.4 1.9 1.4.1 2.4 1 2.6 2.3-1.6-.5-3.1 0-3.8 1.3-.9 3.5-4 5.9-10.2 5.9z" fill="${W}"/><circle cx="17.6" cy="9.3" r=".9" fill="${c}"/><path d="M7.3 16.4l-1.6-1.4M9.5 12.8l-1.8-.9M12 10.4l-1.4-1.4" stroke="${W}" stroke-width="1.1" stroke-linecap="round"/>`},
 lion:{n:"사자",d:(W,c)=>{const P=[...Array(16)].map((_,i)=>{const a=i*Math.PI/8,r=i%2?8.6:11;return (12+Math.cos(a)*r).toFixed(1)+","+(12.5+Math.sin(a)*r).toFixed(1)}).join(" ");return `<polygon points="${P}" fill="${W}"/><circle cx="12" cy="12.8" r="6.2" fill="${c}"/><circle cx="12" cy="12.8" r="5.2" fill="${W}" opacity=".92"/><circle cx="10" cy="12" r=".9" fill="${c}"/><circle cx="14" cy="12" r=".9" fill="${c}"/><path d="M10.9 14.6h2.2L12 15.8z" fill="${c}"/><path d="M12 15.8v.8M10.6 17c.8.5 2 .5 2.8 0" stroke="${c}" stroke-width=".8" fill="none" stroke-linecap="round"/>`}},
 bull:{n:"황소",d:(W,c)=>`<path d="M3 5.5c.4 3 2.4 4.8 5.2 5M21 5.5c-.4 3-2.4 4.8-5.2 5" stroke="${W}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M7.4 9.6h9.2l1.2 5.4-1.6 4.4c-.6 1.6-2.2 2.4-4.2 2.4s-3.6-.8-4.2-2.4L6.2 15z" fill="${W}"/><path d="M6.2 11.2l-2.4.6 2.6 1.4M17.8 11.2l2.4.6-2.6 1.4" fill="${W}"/><ellipse cx="12" cy="18.6" rx="3.2" ry="1.9" fill="${c}" opacity=".35"/><circle cx="10.8" cy="18.6" r=".6" fill="${c}"/><circle cx="13.2" cy="18.6" r=".6" fill="${c}"/><circle cx="9.6" cy="13" r=".9" fill="${c}"/><circle cx="14.4" cy="13" r=".9" fill="${c}"/>`},
 elephant:{n:"코끼리",d:(W,c)=>`<path d="M7 6.5C3.4 5.4 1.8 8.4 2.4 11.8c.4 2.4 2.4 3.6 4.8 3.2z" fill="${W}"/><path d="M17 6.5c3.6-1.1 5.2 1.9 4.6 5.3-.4 2.4-2.4 3.6-4.8 3.2z" fill="${W}"/><path d="M12 4.6c3.2 0 5.4 2.4 5.4 5.6 0 2.6-1.4 4.2-2.8 5v3.4c0 1.6 1 2.4 2.2 2.4-.2 1-1.2 1.6-2.4 1.4-1.6-.3-2.4-1.6-2.4-3.4v-3.4c-1.4-.8-5.4-2.4-5.4-5.4 0-3.2 2.2-5.6 5.4-5.6z" fill="${W}"/><circle cx="10" cy="10" r=".9" fill="${c}"/><circle cx="14" cy="10" r=".9" fill="${c}"/><path d="M6.6 9.4c-1-.4-2-.2-2.6.6M17.4 9.4c1-.4 2-.2 2.6.6" stroke="${c}" stroke-width=".7" fill="none" opacity=".5"/>`},
 bear:{n:"곰",d:(W,c)=>`<circle cx="6.2" cy="6.6" r="3" fill="${W}"/><circle cx="17.8" cy="6.6" r="3" fill="${W}"/><circle cx="6.2" cy="6.6" r="1.4" fill="${c}" opacity=".45"/><circle cx="17.8" cy="6.6" r="1.4" fill="${c}" opacity=".45"/><ellipse cx="12" cy="13.2" rx="8.2" ry="7.6" fill="${W}"/><ellipse cx="12" cy="16" rx="3.6" ry="2.8" fill="${c}" opacity=".3"/><ellipse cx="12" cy="14.8" rx="1.4" ry="1" fill="${c}"/><path d="M12 15.8v1.2M10.6 17.4c.8.5 2 .5 2.8 0" stroke="${c}" stroke-width=".8" fill="none" stroke-linecap="round"/><circle cx="9" cy="11.8" r="1" fill="${c}"/><circle cx="15" cy="11.8" r="1" fill="${c}"/>`},
 albatross:{n:"알바트로스",d:(W,c)=>`<path d="M.8 10.6c4.2-.8 7.6.4 10.4 3.2.6-1 1.4-1.6 2.4-1.8 3-2.4 6.4-3.4 9.6-2.6-3.8 1-6.8 2.8-8.6 5.6l-.4 2.6-1.4-1.6c-.8.4-1.8.4-2.6 0-2-2.8-5.2-4.6-9.4-5.4z" fill="${W}"/><path d="M14.6 12.2l2.8-.6-2.2 1.4" fill="#E9C25A"/><path d="M3.4 10.8c2.4.2 4.6 1 6.4 2.4M20.6 9.8c-2.2.4-4 1.2-5.4 2.4" stroke="${c}" stroke-width=".7" fill="none" opacity=".5"/>`},
 owl:{n:"부엉이",d:(W,c)=>`<path d="M5.2 4.4l3 2.8h7.6l3-2.8.6 7.6c0 5.6-3.2 9.6-7.4 9.6S4.6 17.6 4.6 12z" fill="${W}"/><circle cx="9.2" cy="11" r="2.6" fill="${c}" opacity=".25"/><circle cx="14.8" cy="11" r="2.6" fill="${c}" opacity=".25"/><circle cx="9.2" cy="11" r="1.2" fill="${c}"/><circle cx="14.8" cy="11" r="1.2" fill="${c}"/><path d="M11.2 13.2h1.6L12 14.6z" fill="#E9C25A"/><path d="M8.4 17c1 .6 2.2.9 3.6.9s2.6-.3 3.6-.9" stroke="${c}" stroke-width=".7" fill="none" opacity=".5"/>`},
 deer:{n:"사슴",d:(W,c)=>`<path d="M8.6 9.6C6.4 7.6 5.4 5 6 2.6M6.6 6.2l-2.4-.8M7.6 8.2l-2.6.4M15.4 9.6c2.2-2 3.2-4.6 2.6-7M17.4 6.2l2.4-.8M16.4 8.2l2.6.4" stroke="${W}" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M8.4 9.4h7.2l1.6 2-1.6 1.2-1 6.4c-.3 1.8-1.4 2.8-2.6 2.8s-2.3-1-2.6-2.8l-1-6.4-1.6-1.2z" fill="${W}"/><circle cx="10.2" cy="12.6" r=".9" fill="${c}"/><circle cx="13.8" cy="12.6" r=".9" fill="${c}"/><ellipse cx="12" cy="19.6" rx="1.2" ry=".8" fill="${c}"/>`}};
const SCHOOL_SYM=[[/고려대|korea univ/i,"tiger","#8B1E2D"],[/연세대|yonsei/i,"eagle","#1D3F8A"],[/서울대|seoul national/i,"crane",null],[/중앙대|chung-?ang/i,"dragon","#1F55B5"],[/한양대|hanyang/i,"lion","#1C4C8C"],[/경희대|kyung ?hee/i,"lion","#8B1E2D"],[/건국대|konkuk/i,"bull","#11663F"],[/동국대|dongguk/i,"elephant",null],[/단국대|dankook/i,"bear",null],[/서강대|sogang/i,"albatross","#A8121B"],[/부산대|pusan national/i,"eagle",null],[/경북대|kyungpook/i,"bull",null],[/한국외대|외국어대|hufs/i,"owl",null],[/상명대|sangmyung/i,"deer",null]];
function symOf(e){if(e.sym&&e.sym!=="auto")return e.sym==="mono"?null:{a:e.sym,c:null};if(e.cat!=="school"&&!(e.cat==="org"&&e.type==="학교"))return null;const m=SCHOOL_SYM.find(([re])=>re.test(e.name||""));return m?{a:m[1],c:m[2]}:null}
const animalAt=(k,x,y,s,W,c)=>`<g transform="translate(${x} ${y}) scale(${(s/24).toFixed(3)})">${ANIMALS[k].d(W,c)}</g>`;
let __cid=0;
function rootMono(n){const w=String(n||"").trim().split(/[\s,·]+/).filter(Boolean);let t=w[w.length-1]||"?";if([...t].length>2)t=t.replace(/(특별시|광역시|시|군|구|동|읍|면)$/,"")||t;return [...t].slice(0,[...t].length<=3?3:2).join("")}
function crestSVG(e){const id="cr"+(++__cid);const SY=symOf(e);let [c1,mt]=crestColors(e.name);if(SY&&SY.c)c1=SY.c;const mono=e.cat==="root"?rootMono(e.name):monoOf(e.name);let b="";const D=`<defs><linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity="0"/><stop offset="1" stop-color="#000000" stop-opacity=".18"/></linearGradient>`;
 if(e.cat==="school"){const sh="M12 8H88V50C88 78 70 96 50 106C30 96 12 78 12 50Z";b=`<path d="${sh}" fill="${c1}" stroke="${mt}" stroke-width="3.2" stroke-linejoin="round"/><path d="${sh}" fill="url(#${id}g)"/><path d="M18 14H82V50C82 74 66 90 50 99C34 90 18 74 18 50Z" fill="none" stroke="${mt}" stroke-opacity=".55" stroke-width="1"/>${SY?"":`<path d="M12 44L50 28L88 44V52L50 36L12 52Z" fill="${mt}" opacity=".95"/>`}${SY?`<path d="M30 20h40" stroke="${mt}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>${animalAt(SY.a,25,28,50,"#FFFFFF",c1)}<text x="50" y="96" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="700" font-size="9" fill="${mt}" letter-spacing="1">${mono}</text>`:`${icon("book",41,13,18,mt,1.6)}${monoText(mono,70,"#FFFFFF")}`}`}
 else if(e.cat==="org"){b=`<circle cx="50" cy="56" r="44" fill="${c1}" stroke="${mt}" stroke-width="3.2"/><circle cx="50" cy="56" r="44" fill="url(#${id}g)"/><circle cx="50" cy="56" r="36" fill="none" stroke="${mt}" stroke-width="1" stroke-dasharray="2 3"/>${SY?`${animalAt(SY.a,29,30,42,"#FFFFFF",c1)}<text x="50" y="86" text-anchor="middle" font-family="'Noto Sans KR',sans-serif" font-weight="700" font-size="9" fill="${mt}" letter-spacing="1">${mono}</text>`:`${icon(TYPE_IC[e.type]||"flag",41,20,18,mt,1.6)}${monoText(mono,62,"#FFFFFF")}${[0,1,2].map(i=>`<circle cx="${42+i*8}" cy="86" r="1.6" fill="${mt}"/>`).join("")}`}`}
 else if(e.cat==="root"){const sh="M50 6C72 30 90 50 90 70C90 92 72 106 50 106C28 106 10 92 10 70C10 50 28 30 50 6Z";b=`<path d="${sh}" fill="${c1}" stroke="${mt}" stroke-width="3" stroke-linejoin="round"/><path d="${sh}" fill="url(#${id}g)"/><path d="M18 90L36 68L46 80L60 60L84 90Z" fill="${mt}" opacity=".32"/><path d="M50 106V96M50 100l-8 5M50 100l8 5" stroke="${mt}" stroke-width="1.6" stroke-linecap="round"/>${monoText(mono,62,"#FFFFFF")}`}
 else if(e.cat==="home"){const lv=e.lv!=null?e.lv:homeLv(homeDays(e));const rim=lv>=3?"#D4A43C":mt;b=`<path d="M50 108C50 108 12 72 12 46A38 38 0 1 1 88 46C88 72 50 108 50 108Z" fill="${c1}" stroke="${rim}" stroke-width="${lv>=3?4:3}" stroke-linejoin="round"/><path d="M50 108C50 108 12 72 12 46A38 38 0 1 1 88 46C88 72 50 108 50 108Z" fill="url(#${id}g)"/><circle cx="50" cy="46" r="24" fill="${mt}"/>${icon(TYPE_IC[e.type]||"house",36,32,28,c1,2)}${[...Array(5)].map((_,i)=>`<circle cx="${34+i*8}" cy="82" r="2.4" fill="${i<lv?rim:"none"}" stroke="${rim}" stroke-width="1"/>`).join("")}`}
 else if(e.cat==="honor"){const M=METAL[e.tier]||METAL["금"];
  if(e.type==="크리에이터 버튼"){b=`<defs><linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${M[0]}"/><stop offset=".5" stop-color="${M[1]}"/><stop offset="1" stop-color="${M[2]}"/></linearGradient></defs><rect x="10" y="14" width="80" height="88" rx="8" fill="url(#${id}m)" stroke="${M[2]}" stroke-width="2"/><rect x="18" y="22" width="64" height="58" rx="5" fill="none" stroke="${M[2]}" stroke-opacity=".6" stroke-width="1.2"/><rect x="34" y="38" width="32" height="24" rx="7" fill="${M[2]}" opacity=".85"/><path d="M46 44l10 6-10 6z" fill="${M[0]}"/><path d="M26 90h48" stroke="${M[2]}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/>${e.tier==="다이아"?`<path d="M80 22l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#FFFFFF"/>`:""}`}
  else{b=`<defs><radialGradient id="${id}m" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${M[0]}"/><stop offset=".55" stop-color="${M[1]}"/><stop offset="1" stop-color="${M[2]}"/></radialGradient></defs><path d="M30 4L42 40H30L22 14Z" fill="${c1}"/><path d="M70 4L58 40H70L78 14Z" fill="${c1}"/><path d="M30 4L42 40M70 4L58 40" stroke="${mt}" stroke-width="1"/><circle cx="50" cy="68" r="36" fill="url(#${id}m)" stroke="${M[2]}" stroke-width="2"/><circle cx="50" cy="68" r="28" fill="none" stroke="${M[2]}" stroke-opacity=".55" stroke-width="1.2"/>${icon(TYPE_IC[e.type]||"star",37,55,26,M[2],2)}${e.tier==="특별"?[0,72,144,216,288].map(a=>{const r=a*Math.PI/180;return `<circle cx="${(50+Math.cos(r)*32).toFixed(1)}" cy="${(68+Math.sin(r)*32).toFixed(1)}" r="1.6" fill="#FFFFFF"/>`}).join(""):""}`}}
 else{const pts=[...Array(16)].map((_,i)=>{const a=-Math.PI/2+i*Math.PI/8,r=i%2?36:48;return [50+Math.cos(a)*r,58+Math.sin(a)*r]});b=`<polygon points="${pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" fill="${c1}" stroke="${mt}" stroke-width="2.4" stroke-linejoin="round"/><polygon points="${pts.map(p=>p[0].toFixed(1)+","+p[1].toFixed(1)).join(" ")}" fill="url(#${id}g)"/><circle cx="50" cy="58" r="25" fill="${mt}"/>${icon(TYPE_IC[e.type]||"online",37,45,26,c1,2.1)}`}
 return `<svg viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg">${D}</defs>${b}</svg>`}

function Crest({e,pub,size=64,onClick,on}){const svg=useMemo(()=>crestSVG(e),[JSON.stringify(e)]);const L=crestLabel(e,pub);const Tag=onClick?"button":"div";
 return html`<${Tag} className=${"crest"+(on?" on":"")} onClick=${onClick} title=${L.t+" · "+L.s} style=${{width:size+22}}><span className="crest-ic" style=${{width:size,height:Math.round(size*1.12)}} dangerouslySetInnerHTML=${{__html:svg}}></span><span className="crest-t">${L.t}</span><span className="crest-s">${L.s}</span><//>`}

/* main card: motto + displayed crests */
function CrestShelf({st,onOpen}){const shown=shownCrests(st);const line=idLine(st);const E=idOf(st);
 if(!E.length)return null;
 return html`<div className="crest-shelf">
  ${line&&html`<p className="motto">${line}</p>`}
  ${shown.length?html`<div className="crest-row">${shown.map(e=>html`<${Crest} key=${e.id} e=${e} size=${42} onClick=${()=>onOpen("identity")}/>`)}</div>`:html`<button className="linkbtn small" onClick=${()=>onOpen("identity")}>＋ 휘장 ${E.length}개 중 골라 진열하기</button>`}
 </div>`}
function PublicCrests({card}){const cr=card.crests||[];if(!cr.length&&!card.motto)return null;
 return html`<div className="crest-shelf pub">${card.motto&&html`<p className="motto">${card.motto}</p>`}${cr.length>0&&html`<div className="crest-row">${cr.map((e,i)=>html`<${Crest} key=${i} e=${e} pub=${true} size=${42}/>`)}</div>`}</div>`}

/* card image (1080 wide) */
async function drawCrestRow(x,crests,motto,{top=1088,pub=false}={}){const W=1080;const SANS='"Noto Sans KR","Apple SD Gothic Neo",sans-serif',SERIF='"Noto Serif KR","Apple SD Gothic Neo",serif';
 let y=top;if(motto){x.fillStyle="#465250";x.font=`500 28px ${SERIF}`;x.textAlign="center";const l=wrapLines(x,motto,W-240,1)[0]||"";x.fillText(l+(l.length<motto.length?"…":""),W/2,y+6);y+=26}
 if(!crests.length)return;const n=crests.length,slot=200,iw=72,ih=81;const x0=W/2-(n*slot)/2;
 for(let i=0;i<n;i++){const e=crests[i];const cx=x0+slot*i+slot/2;try{const img=await svgImage(crestSVG(e),iw,ih);x.drawImage(img,cx-iw/2,y+8)}catch(_){/* skip */}
  const L=crestLabel(e,pub);x.textAlign="center";x.fillStyle="#173D3B";x.font=`700 22px ${SANS}`;let t=L.t;while(x.measureText(t).width>slot-14&&t.length>2)t=t.slice(0,-1);x.fillText(t+(t!==L.t?"…":""),cx,y+ih+34);x.fillStyle="#66706E";x.font=`500 18px ${SANS}`;let s=L.s;while(x.measureText(s).width>slot-14&&s.length>2)s=s.slice(0,-1);x.fillText(s,cx,y+ih+58)}}

/* ───────── gem: roots · banners · laurel · spotlight (rendered inside gemSVG) ───────── */
function gemInsignia(m,id){if(!m)return {back:"",under:""};let back="",under="";const L=clamp(m.laurel||0,0,5),S=clamp(m.spot||0,0,5),Ro=clamp(m.roots||0,0,5);const G="#D9B36A",GD="#A8833E";
 /* 조명: 위에서 내려오는 부드러운 빛 — 테두리 없는 한 줄기 */
 if(S)back+=`<defs><radialGradient id="${id}sp" cx="50%" cy="12%" r="90%"><stop offset="0" stop-color="#FFF1C9" stop-opacity="${(.22+S*.08).toFixed(2)}"/><stop offset=".6" stop-color="#FFF6DD" stop-opacity="${(.08+S*.03).toFixed(2)}"/><stop offset="1" stop-color="#FFF6DD" stop-opacity="0"/></radialGradient><filter id="${id}spb" x="-60%" y="-30%" width="220%" height="160%"><feGaussianBlur stdDeviation="7"/></filter></defs><ellipse class="gm-spot" cx="100" cy="58" rx="${(14+S*4).toFixed(0)}" ry="96" fill="url(#${id}sp)" filter="url(#${id}spb)"/>`;
 /* 뿌리: 받침 아래로 가늘게 */
 if(Ro){const n=1+Ro;for(let i=0;i<n;i++){const t=n===1?0:i/(n-1)-.5;const ex=100+t*70,ey=206+Math.abs(t)*-4+(i%2)*3;under+=`<path d="M100 199 Q${(100+t*30).toFixed(1)} ${(206+Math.abs(t)*2).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="${Ro>=4?G:"#9A7B52"}" stroke-width="${(1.3-Math.abs(t)*.6).toFixed(2)}" stroke-linecap="round" opacity=".55"/>`}}
 /* 월계관: 젬 아래를 받치는 작은 화관 */
 if(L){const col=L>=4?G:L>=3?"#B7A55A":"#8FA66A";const n=3+L;const side=sgn=>{let s="";const P0=[100+sgn*4,203],P1=[100+sgn*46,204],P2=[100+sgn*58,172];for(let i=0;i<n;i++){const t=.1+.9*i/Math.max(1,n-1);const u=1-t;const x=u*u*P0[0]+2*u*t*P1[0]+t*t*P2[0],y=u*u*P0[1]+2*u*t*P1[1]+t*t*P2[1];const dx=2*u*(P1[0]-P0[0])+2*t*(P2[0]-P1[0]),dy=2*u*(P1[1]-P0[1])+2*t*(P2[1]-P1[1]);const a=Math.atan2(dy,dx)*180/Math.PI+(i%2?32:-32)*sgn;s+=`<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5.2" ry="2.1" fill="${col}" opacity="${i%2?.95:.75}" transform="rotate(${a.toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`}return s};
  back+=`<g opacity="${(.62+L*.07).toFixed(2)}"><path d="M104 203 Q146 204 158 172" fill="none" stroke="${col}" stroke-width="1"/><path d="M96 203 Q54 204 42 172" fill="none" stroke="${col}" stroke-width="1"/>${side(-1)}${side(1)}</g>`}
 /* 소속: 젬 아래 리본 한 장 — 소속마다 한 줄씩 빛깔 */
 const B=(m.banners||[]).slice(0,3);if(B.length){const w=B.length*2.6+1.6;let r=`<g class="gm-ribbon">`;const y0=207;
  r+=`<path d="M70 ${y0-1} L64 ${y0+4} L70 ${y0+2} L72 ${y0+7}Z M130 ${y0-1} L136 ${y0+4} L130 ${y0+2} L128 ${y0+7}Z" fill="${B[0]}" opacity=".9"/>`;
  B.forEach((c,i)=>{const o=-w/2+1.3+i*2.6;r+=`<path d="M70 ${(y0+o).toFixed(1)} Q100 ${(y0-7+o).toFixed(1)} 130 ${(y0+o).toFixed(1)}" fill="none" stroke="${c}" stroke-width="2.7"/>`});
  r+=`<path d="M70 ${(y0-w/2).toFixed(1)} Q100 ${(y0-7-w/2).toFixed(1)} 130 ${(y0-w/2).toFixed(1)}" fill="none" stroke="${GD}" stroke-width=".6"/><path d="M70 ${(y0+w/2).toFixed(1)} Q100 ${(y0-7+w/2).toFixed(1)} 130 ${(y0+w/2).toFixed(1)}" fill="none" stroke="${GD}" stroke-width=".6"/></g>`;under+=r}
 return {back,under}}

/* ───────── 터전 인증 (지금 있는 곳의 시·구·동만 받아 옴) ───────── */
async function regionHere(){const p=await getPosition();const s=await api.session();const token=s&&s.access_token;
 const r=await fetch(PLACES_FN(),{method:"POST",headers:{"Content-Type":"application/json",apikey:MIB_CONFIG.key,...(token?{Authorization:"Bearer "+token}:{})},body:JSON.stringify({action:"region",lat:p.lat,lng:p.lng})});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw Err(j.error||"region_failed");return {sido:j.sido||"",gu:j.gu||"",dong:j.dong||""}}
const sameArea=(a,b)=>!!(a&&b)&&shortSido(a.sido)===shortSido(b.sido)&&(a.gu&&b.gu?a.gu===b.gu:(a.dong||"")===(b.dong||""));

/* ───────── 알맞은 때 한 번씩 묻기 ───────── */
function idSuggest(st,day){const E=idOf(st);const t=dayKey();const f=(st.identity||{});if(f.snooze===t)return null;
 const home=E.find(e=>e.cat==="home");if(home&&!((home.verify||{}).days||[]).includes(t))return {k:"home",re:home};
 for(let i=0;i<ID_CATS.length;i++){const c=ID_CATS[(Math.max(0,(day||1)-1)+i)%ID_CATS.length];if(!E.some(e=>e.cat===c.k))return {k:c.k}}
 if(E.length&&!E.some(e=>e.display))return {k:"show"};return null}
function IdPrompt({st,update,onOpen,day}){if(!st.analysis)return null;const s=idSuggest(st,day);if(!s)return null;
 const c=s.k==="show"?null:idCat(s.k);const snooze=()=>update(x=>{x.identity={...(x.identity||{entries:[]}),snooze:dayKey()}});
 const title=s.re?`오늘도 터전에 있나요?`:s.k==="show"?"휘장을 진열해 보세요":c.q;
 const sub=s.re?`${areaOf(s.re.verify)}에서 ${homeDays(s.re)}일 인증했어요. 다른 날 인증이 쌓일수록 '${HOME_LV[Math.min(5,homeLv(homeDays(s.re))+1)]}'에 가까워져요.`:s.k==="show"?"남긴 휘장 중 최대 네 개를 메인 카드와 카드 이미지에 걸 수 있어요.":c.ask;
 return html`<div className="panel stack idprompt"><div className="row between"><span className="eyebrow">나의 휘장 · ${s.k==="show"?"진열":c.n}</span><button className="linkbtn small" onClick=${snooze}>오늘은 그만</button></div>
  <b className="serif">${title}</b><span className="small muted">${sub}</span>
  <button className="btn sm" onClick=${()=>onOpen(s.k==="show"?"identity":"identity:"+s.k)}>${s.re?"📍 지금 인증하기":s.k==="show"?"진열하러 가기":c.n+" 남기기"}</button></div>`}

/* ───────── 나의 휘장 시트 ───────── */
function IdentitySheet({st,update,onClose,toast,demo,focus}){
 const E=idOf(st);const S=idStats(st);const [cat,setCat]=useState(focus&&idCat(focus)?focus:(ID_CATS.find(c=>!S.n[c.k])||ID_CATS[0]).k);
 const [form,setForm]=useState(focus&&focus!=="show"&&!(focus==="home"&&E.some(e=>e.cat==="home"))?{cat:focus,type:idCat(focus).types[0]}:null);
 const [editLine,setEditLine]=useState(false);const [line,setLine]=useState((st.identity||{}).motto||"");const [busy,setBusy]=useState("");
 const C=idCat(cat);const list=E.filter(e=>e.cat===cat);
 const put=fn=>{if(demo){toast("예시 모드에서는 저장하지 않아요.");return false}update(s=>{const I={entries:[],useAI:true,...(s.identity||{})};I.entries=[...(I.entries||[])];fn(I);s.identity=I});return true};
 function save(){const f=form;if(!f)return;if(f.cat!=="home"&&!String(f.name||"").trim()){toast("이름을 적어 주세요.");return}
  const e={id:f.id||rid(),sym:f.sym||"auto",cat:f.cat,type:f.type,name:String(f.name||"").trim().slice(0,40),extra:String(f.extra||"").trim().slice(0,40),year:String(f.year||"").trim().slice(0,9),tier:f.tier||"",display:!!f.display,shownAt:f.shownAt||0,verify:f.verify||null,at:f.at||Date.now()};
  if(e.cat==="honor"&&!e.tier)e.tier=tierSet(e.type)[0];
  if(put(I=>{const i=I.entries.findIndex(x=>x.id===e.id);if(i>=0)I.entries[i]=e;else{if(!I.entries.some(x=>x.display)&&I.entries.filter(x=>x.display).length<ID_MAX_SHOW){e.display=true;e.shownAt=Date.now()}I.entries.push(e)}})){track("id_add",{cat:e.cat,type:e.type});toast(f.id?"휘장을 고쳤어요.":`'${idCat(e.cat).n}' 휘장이 새겨졌어요.`);setForm(null)}}
 function toggleShow(e){const on=!e.display;if(on&&S.shown>=ID_MAX_SHOW){toast(`진열은 ${ID_MAX_SHOW}개까지예요. 하나를 내린 뒤 걸어 주세요.`);return}put(I=>{I.entries=I.entries.map(x=>x.id===e.id?{...x,display:on,shownAt:on?Date.now():0}:x)});track("id_show",{on})}
 function del(e){if(!confirm(`'${crestLabel(e).t}' 휘장을 지울까요?`))return;put(I=>{I.entries=I.entries.filter(x=>x.id!==e.id)})}
 async function verifyNew(){setBusy("v");try{const r=await regionHere();setForm(f=>({...f,verify:{...r,days:[dayKey()],first:Date.now()}}))}catch(x){toast(GEO_MSG[x.code]||"지금 있는 곳을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.")}finally{setBusy("")}}
 async function reverify(e){setBusy(e.id);try{const r=await regionHere();
  if(sameArea(r,e.verify)){const t=dayKey();if(((e.verify||{}).days||[]).includes(t)){toast("오늘은 이미 인증했어요.");return}put(I=>{I.entries=I.entries.map(x=>x.id===e.id?{...x,verify:{...x.verify,dong:r.dong||x.verify.dong,days:[...((x.verify||{}).days||[]),t].slice(-400)}}:x)});track("id_home_check",{d:homeDays(e)+1});toast(`${areaOf(e.verify)} 인증 ${homeDays(e)+1}일째 · 터전이 단단해졌어요.`)}
  else{if(confirm(`지금은 ${areaOf(r)}에 있어요. 이 ${e.type}의 터전을 ${areaOf(r)}(으)로 옮길까요? (인증 날짜는 새로 시작해요)`))put(I=>{I.entries=I.entries.map(x=>x.id===e.id?{...x,verify:{...r,days:[dayKey()],first:Date.now()}}:x)})}}
  catch(x){toast(GEO_MSG[x.code]||"지금 있는 곳을 확인하지 못했어요.")}finally{setBusy("")}}
 const shown=shownCrests(st);const auto=autoLine(st);
 return html`<${Sheet} title="나의 휘장" onClose=${onClose}>
  <div className="id-hero"><span className="eyebrow">대표 한 줄</span>
   ${editLine?html`<div className="stack" style=${{gap:"6px"}}><input type="text" maxLength="60" value=${line} onChange=${ev=>setLine(ev.target.value)} placeholder=${auto||"나를 소개하는 한 줄"} aria-label="대표 한 줄"/><div className="row"><button className="btn ghost sm grow" onClick=${()=>{setLine("");put(I=>{I.motto="";I.lineOff=false});setEditLine(false)}}>자동으로</button><button className="btn sm grow" onClick=${()=>{put(I=>{I.motto=line.trim();I.lineOff=false});setEditLine(false)}}>이 한 줄로</button></div></div>`
   :html`<p className="motto big">${idLine(st)||html`<span className="faint">휘장을 남기면 '…에서 나고 자라 …에서 배우고 …에서 일하는 사람'처럼 한 줄이 만들어져요.</span>`}</p><div className="row" style=${{gap:"12px",justifyContent:"center"}}><button className="linkbtn small" onClick=${()=>setEditLine(true)}>고쳐 쓰기</button>${(auto||(st.identity||{}).motto)&&html`<button className="linkbtn small" onClick=${()=>put(I=>{I.lineOff=!I.lineOff})}>${(st.identity||{}).lineOff?"카드에 보이기":"카드에서 숨기기"}</button>`}</div>`}
  </div>
  <div className="id-stats">${ID_CATS.map(c=>html`<button key=${c.k} className=${"id-stat"+(cat===c.k?" on":"")} onClick=${()=>{setCat(c.k);setForm(null)}}><b>${c.n}</b><span className="pips">${[1,2,3,4,5].map(i=>html`<i key=${i} className=${i<=S.lv[c.k]?"on":""}></i>`)}</span><small>${S.n[c.k]?S.n[c.k]+"개":"비어 있음"} · ${c.eff}</small></button>`)}</div>
  <div className="id-display"><div className="row between"><b>진열대</b><span className="small faint">메인 카드 · 카드 이미지 · 공개 카드 · ${shown.length}/${ID_MAX_SHOW}</span></div>
   <div className="crest-row">${shown.map(e=>html`<${Crest} key=${e.id} e=${e} size=${50} on=${true} onClick=${()=>toggleShow(e)}/>`)}${[...Array(Math.max(0,ID_MAX_SHOW-shown.length))].map((_,i)=>html`<div key=${"x"+i} className="crest empty" style=${{width:78}}><span className="crest-ic" style=${{width:50,height:56}}></span><span className="crest-s">빈 자리</span></div>`)}</div>
   <span className="small faint">휘장 옆 ☆를 눌러 걸고 내려요. 터전은 다른 사람에게 시·구까지만 보여요.</span></div>
  <div className="id-cat"><div className="row between"><b className="serif" style=${{fontSize:"18px"}}>${C.n} <span className="small muted" style=${{fontWeight:500}}>· ${C.q}</span></b></div>
   ${list.length?html`<div className="id-list">${list.map(e=>{const L=crestLabel(e);return html`<div key=${e.id} className="id-row"><${Crest} e=${e} size=${40}/><span className="grow"><b>${L.t}</b><br/><span className="small muted">${L.s}${e.extra?" · "+e.extra:""}${e.year&&e.cat!=="honor"&&e.cat!=="media"?" · "+e.year:""}</span>
     ${e.cat==="home"&&html`<br/><button className="btn quiet sm" disabled=${busy===e.id} onClick=${()=>reverify(e)}>${busy===e.id?"확인하는 중…":((e.verify||{}).days||[]).includes(dayKey())?"✓ 오늘 인증함":"📍 오늘 인증하기"}</button>`}</span>
     <span className="id-acts"><button className=${"id-star"+(e.display?" on":"")} aria-pressed=${!!e.display} aria-label=${(e.display?"진열 내리기 ":"진열하기 ")+L.t} onClick=${()=>toggleShow(e)}>${e.display?"★":"☆"}</button>${e.cat!=="home"&&html`<button className="linkbtn small" onClick=${()=>setForm({...e})}>고치기</button>`}<button className="linkbtn small" onClick=${()=>del(e)}>지우기</button></span></div>`})}</div>`:html`<p className="small muted">${C.ask}</p>`}
   ${form&&form.cat===cat?html`<div className="panel stack id-form">
     <div className="segs stay-cats" role="group" aria-label="갈래">${C.types.map(t=>html`<button key=${t} aria-pressed=${form.type===t} onClick=${()=>setForm({...form,type:t,tier:cat==="honor"?tierSet(t)[0]:form.tier})}>${t}</button>`)}</div>
     ${cat==="home"?html`${form.verify?html`<div className="id-found"><span className="eyebrow">지금 있는 곳</span><b>${areaOf(form.verify)} ${form.verify.dong||""}</b><span className="small muted">이 자리에서 '${form.type}'(으)로 인증해요. 다른 사람에게는 '${areaOf(form.verify)}'까지만 보여요.</span></div>`
       :html`<p className="small muted">터전은 그 자리에 있을 때만 등록할 수 있어요. 지금 위치로 시·구·동을 확인하고, 좌표는 저장하지 않아요.</p><button className="btn sm" disabled=${busy==="v"} onClick=${verifyNew}>${busy==="v"?"확인하는 중…":"📍 지금 있는 곳으로 인증"}</button>`}`
     :html`<div className="field" style=${{margin:0}}><label htmlFor="id-name">${C.lab}</label><input type="text" id="id-name" maxLength="40" value=${form.name||""} onChange=${ev=>setForm({...form,name:ev.target.value})} placeholder=${cat==="honor"&&form.type==="크리에이터 버튼"?"예) 구독자 10만 달성 버튼":C.ph}/></div>
      ${C.extra&&html`<div className="field" style=${{margin:0}}><label htmlFor="id-extra">${C.extra}</label><input type="text" id="id-extra" maxLength="40" value=${form.extra||""} onChange=${ev=>setForm({...form,extra:ev.target.value})}/></div>`}
      ${(cat==="school"||cat==="org")&&html`<div className="stack" style=${{gap:"6px"}}><span className="small muted">휘장 문양 ${(()=>{const m=SCHOOL_SYM.find(([re])=>re.test(form.name||""));return m&&cat==="school"?`· 자동: ${ANIMALS[m[1]].n}`:""})()}</span><div className="sym-pick" role="group" aria-label="휘장 문양">${[["auto","자동"],["mono","이니셜"],...Object.entries(ANIMALS).map(([k,v])=>[k,v.n])].map(([k,n])=>html`<button key=${k} aria-pressed=${(form.sym||"auto")===k} onClick=${()=>setForm({...form,sym:k})} title=${n}>${k==="auto"||k==="mono"?html`<span className="sym-t">${n}</span>`:html`<span className="sym-ic" dangerouslySetInnerHTML=${{__html:`<svg viewBox="0 0 24 24">${ANIMALS[k].d("currentColor","var(--card)")}</svg>`}}></span>`}</button>`)}</div></div>`}
      ${cat==="honor"&&html`<div className="segs mini" role="group" aria-label="등급">${tierSet(form.type).map(t=>html`<button key=${t} aria-pressed=${(form.tier||tierSet(form.type)[0])===t} onClick=${()=>setForm({...form,tier:t})}>${t}</button>`)}</div>`}
      <div className="field" style=${{margin:0}}><label htmlFor="id-year">${cat==="org"?"함께한 때 (선택, 예: 2019~ 또는 2015~2020)":"연도 (선택)"}</label><input type="text" id="id-year" maxLength="12" value=${form.year||""} onChange=${ev=>setForm({...form,year:ev.target.value})} placeholder=${cat==="org"?"2019~":"2024"}/></div>`}
     <div className="row"><button className="btn ghost sm grow" onClick=${()=>setForm(null)}>취소</button><button className="btn sm grow" disabled=${cat==="home"&&!form.verify} onClick=${save}>${form.id?"고치기":"휘장 새기기"}</button></div></div>`
   :html`<button className="btn ghost block" onClick=${()=>setForm({cat,type:C.types[0]})}>＋ ${C.n} 남기기</button>`}
  </div>
  <label className="checkline"><input type="checkbox" checked=${(st.identity||{}).useAI!==false} onChange=${ev=>put(I=>{I.useAI=ev.target.checked})}/><span><b>다시 읽기 때 AI가 참고</b><br/><span className="small muted">뿌리·배움·소속·영예·조명을 나의 맥락으로만 참고해요. 터전(위치)은 보내지 않아요.</span></span></label>
  <p className="note">휘장은 본인이 직접 남긴 이력이에요. 학교·회사의 실제 로고 대신 이름에서 뽑은 이니셜과 빛깔로 고유한 문양을 새겨요. 다른 사람에게는 진열한 휘장만, '공개할 모습'에서 휘장을 켰을 때 보여요.</p>
 <//>`;
}
