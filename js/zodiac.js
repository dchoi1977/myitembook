"use strict";
/* MIB CBT · 별자리 — 생일(월·일)만 받아 카드 앞면 젬 뒤 하늘에 별자리를 띄움. 연도는 받지 않음 */

/* stars: normalized [x,y] (y down), mag 1 = bright · lines: index pairs */
const ZODIAC=[
 {k:"capricorn",ko:"염소자리",en:"CAPRICORNUS",sym:"♑",from:[12,22],stars:[[.04,.22,1],[.2,.38,2],[.44,.82,2],[.66,.66,2],[.82,.32,2],[.96,.14,1]],lines:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,0]]},
 {k:"aquarius",ko:"물병자리",en:"AQUARIUS",sym:"♒",from:[1,20],stars:[[.04,.3,2],[.3,.18,1],[.46,.34,1],[.62,.28,2],[.56,.6,2],[.76,.76,2],[.96,.92,2],[.38,.86,2]],lines:[[0,1],[1,2],[2,3],[2,4],[4,5],[5,6],[4,7]]},
 {k:"pisces",ko:"물고기자리",en:"PISCES",sym:"♓",from:[2,19],stars:[[.04,.24,2],[.14,.1,2],[.26,.2,2],[.16,.34,2],[.52,.9,1],[.78,.52,2],[.92,.1,2]],lines:[[0,1],[1,2],[2,3],[3,0],[2,4],[4,5],[5,6]]},
 {k:"aries",ko:"양자리",en:"ARIES",sym:"♈",from:[3,21],stars:[[.04,.7,2],[.4,.4,1],[.66,.32,2],[.96,.56,2]],lines:[[0,1],[1,2],[2,3]]},
 {k:"taurus",ko:"황소자리",en:"TAURUS",sym:"♉",from:[4,20],stars:[[.04,.08,1],[.18,.58,2],[.46,.44,2],[.56,.6,1],[.62,.42,2],[.74,.5,2],[.96,.28,2]],lines:[[0,4],[4,5],[1,3],[3,5],[5,6],[2,4]]},
 {k:"gemini",ko:"쌍둥이자리",en:"GEMINI",sym:"♊",from:[5,21],stars:[[.1,.08,1],[.24,.46,2],[.34,.9,2],[.32,.02,1],[.52,.4,2],[.7,.84,2],[.9,.96,2]],lines:[[0,3],[0,1],[1,2],[3,4],[4,5],[5,6]]},
 {k:"cancer",ko:"게자리",en:"CANCER",sym:"♋",from:[6,22],stars:[[.5,.46,2],[.46,.04,2],[.1,.94,2],[.9,.84,2],[.56,.62,2]],lines:[[1,0],[0,4],[4,2],[4,3]]},
 {k:"leo",ko:"사자자리",en:"LEO",sym:"♌",from:[7,23],stars:[[.24,.84,1],[.24,.52,2],[.14,.3,2],[.24,.08,2],[.42,.12,2],[.44,.5,1],[.78,.44,2],[.98,.74,1],[.74,.8,2]],lines:[[0,1],[1,2],[2,3],[3,4],[1,5],[5,6],[6,7],[7,8],[8,0]]},
 {k:"virgo",ko:"처녀자리",en:"VIRGO",sym:"♍",from:[8,23],stars:[[.04,.28,2],[.28,.34,2],[.44,.54,2],[.68,.44,2],[.9,.18,2],[.54,.96,1],[.86,.74,2]],lines:[[0,1],[1,2],[2,3],[3,4],[2,5],[3,6]]},
 {k:"libra",ko:"천칭자리",en:"LIBRA",sym:"♎",from:[9,23],stars:[[.5,.04,2],[.16,.42,1],[.84,.46,1],[.22,.86,2],[.9,.96,2]],lines:[[0,1],[0,2],[1,2],[1,3],[2,4]]},
 {k:"scorpio",ko:"전갈자리",en:"SCORPIUS",sym:"♏",from:[10,23],stars:[[.04,.06,2],[.08,.3,2],[.2,.38,2],[.34,.46,1],[.44,.58,2],[.5,.76,2],[.6,.9,2],[.8,.96,2],[.95,.8,1],[.9,.64,2]],lines:[[0,2],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9]]},
 {k:"sagittarius",ko:"궁수자리",en:"SAGITTARIUS",sym:"♐",from:[11,23],stars:[[.06,.62,2],[.3,.4,2],[.34,.78,1],[.56,.3,2],[.6,.62,1],[.86,.36,2],[.92,.72,2],[.46,.08,2]],lines:[[0,1],[0,2],[1,2],[1,3],[2,4],[3,4],[3,5],[4,6],[5,6],[1,7],[3,7]]}
];
const MONTH_DAYS=[31,29,31,30,31,30,31,31,30,31,30,31];

function birthMD(st){const b=st&&st.quick&&st.quick.answers&&st.quick.answers.birth;if(typeof b!=="string")return null;const m=/^(\d{2})-(\d{2})$/.exec(b);if(!m)return null;const mo=+m[1],d=+m[2];return mo>=1&&mo<=12&&d>=1&&d<=MONTH_DAYS[mo-1]?[mo,d]:null}
function zodiacOf(mo,d){let z=ZODIAC[0];for(const s of ZODIAC){const [fm,fd]=s.from;if(mo>fm||(mo===fm&&d>=fd))z=s}if(mo===12&&d>=22)z=ZODIAC[0];return z}
const zodiacByKey=k=>ZODIAC.find(z=>z.k===k)||null;
function myZodiac(st){const b=birthMD(st);return b?zodiacOf(b[0],b[1]):null}
/* what the card shows (follows the same 'tags' switch as MBTI·blood type on public surfaces) */
function cardZodiac(st,pub){if(pub&&!(st.visibility&&st.visibility.fields&&st.visibility.fields.tags))return null;return myZodiac(st)}

/* fit the figure into a box, keeping its aspect */
function zFit(z,bw,bh,pad,stretch=1.7){const xs=z.stars.map(s=>s[0]),ys=z.stars.map(s=>s[1]);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);const sw=Math.max(.2,x1-x0),sh=Math.max(.2,y1-y0);const ky=Math.min((bh-2*pad)/sh,(bw-2*pad)/sw);const kx=Math.min((bw-2*pad)/sw,ky*stretch);const ox=(bw-sw*kx)/2-x0*kx,oy=(bh-sh*ky)/2-y0*ky;return z.stars.map(([x,y,m])=>[ox+x*kx,oy+y*ky,m])}

function constellationSVG(z,w,h,uid){const p=zFit(z,w,h,Math.min(w,h)*.08);const id="zg"+uid;
 const lines=z.lines.map(([a,b])=>`<line x1="${p[a][0].toFixed(1)}" y1="${p[a][1].toFixed(1)}" x2="${p[b][0].toFixed(1)}" y2="${p[b][1].toFixed(1)}"/>`).join("");
 const stars=p.map(([x,y,m],i)=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${m===1?7:4.6}" fill="url(#${id})" class="zs" style="animation-delay:${(i*0.37)%2.4}s"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${m===1?1.9:1.3}" fill="currentColor"/>`).join("");
 return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" aria-hidden="true"><defs><radialGradient id="${id}"><stop offset="0" stop-color="currentColor" stop-opacity=".55"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs><g stroke="currentColor" stroke-width="1" stroke-opacity=".38" stroke-dasharray="1 3.2" stroke-linecap="round">${lines}</g>${stars}</svg>`}

/* sits behind the gem; label rides on top of the sky */
function ZodiacSky({z,size=210}){
 const uid=useMemo(()=>rid(),[]);if(!z)return null;
 const w=Math.round(size*1.75),h=Math.round(size*.9);
 return html`<div className="zsky" style=${{width:w,height:h,marginBottom:-Math.round(h*.86)}}><span className="zsky-label">✦ ${z.ko} ✦</span><div className="zsky-fig" dangerouslySetInnerHTML=${{__html:constellationSVG(z,w,h,uid)}}></div></div>`;
}

/* canvas: the card image (1080 wide). Draw before the gem so the gem stands in front of the sky. */
function drawConstellation(x,z,{left=110,top=185,w=860,h=330,label=true}={}){
 if(!z)return;const p=zFit(z,w,h,22).map(([a,b,m])=>[left+a,top+b,m]);const GOLD="#B08A3E";
 x.save();x.strokeStyle=GOLD;x.globalAlpha=.42;x.lineWidth=2;x.setLineDash([2,9]);x.lineCap="round";
 z.lines.forEach(([a,b])=>{x.beginPath();x.moveTo(p[a][0],p[a][1]);x.lineTo(p[b][0],p[b][1]);x.stroke()});x.setLineDash([]);
 p.forEach(([sx,sy,m])=>{const r=m===1?26:17;const g=x.createRadialGradient(sx,sy,0,sx,sy,r);g.addColorStop(0,"rgba(201,164,90,.55)");g.addColorStop(1,"rgba(201,164,90,0)");x.globalAlpha=1;x.fillStyle=g;x.beginPath();x.arc(sx,sy,r,0,Math.PI*2);x.fill();x.fillStyle=GOLD;x.beginPath();x.arc(sx,sy,m===1?5.5:3.8,0,Math.PI*2);x.fill()});
 if(label){x.globalAlpha=.9;x.fillStyle=GOLD;x.font='700 24px "Noto Sans KR","Apple SD Gothic Neo",sans-serif';x.textAlign="center";const t=`✦  ${z.ko} · ${z.en}  ✦`;x.fillText(t.split("").join(String.fromCharCode(8202)),540,top-8)}
 x.restore();
}

/* 연륜 — 살아온 시간이 젬에 새기는 결. 나이는 숫자로 어디에도 보이지 않음 */
const RING_NAMES=["","맑은 결","단단해지는 결","깊어지는 결","짙은 결","원숙한 결","그윽한 결"];
const YEAR_NOW=new Date().getFullYear();
function birthYear(st){const y=st&&st.quick&&st.quick.answers&&st.quick.answers.birthYear;return Number.isInteger(y)&&y>=1920&&y<=YEAR_NOW-10?y:null}
function ringsOf(st){const y=birthYear(st);if(!y)return 0;const age=YEAR_NOW-y;return clamp(Math.floor((age-10)/10),1,6)}
const ringName=r=>RING_NAMES[clamp(r||0,0,6)]||"";

/* card image: a warm depth that deepens with the rings, behind gem and sky */
function drawAgeDepth(x,rg,cx=540,cy=450){if(!rg)return;x.save();const R=560;const g=x.createRadialGradient(cx,cy,60,cx,cy,R);g.addColorStop(0,`rgba(176,138,62,${(.04+rg*.022).toFixed(3)})`);g.addColorStop(.7,`rgba(120,96,60,${(.02+rg*.012).toFixed(3)})`);g.addColorStop(1,"rgba(120,96,60,0)");x.fillStyle=g;x.fillRect(42,42,996,1266);
 const n=rg+2;for(let i=0;i<n;i++){const r=300+i*(240/n);x.strokeStyle=`rgba(140,106,52,${(.05+rg*.01-i*.004).toFixed(3)})`;x.lineWidth=1.4;x.beginPath();x.ellipse(cx,cy,r,r*.97,0,0,Math.PI*2);x.stroke()}x.restore()}

/* birthday picker (year optional · month · day) */
function BirthPicker({st,update}){
 const b=birthMD(st)||[0,0];const [mo,setMo]=useState(b[0]||"");const [d,setD]=useState(b[1]||"");const [yr,setYr]=useState(birthYear(st)||"");
 function save(m,dd,y){setMo(m);setD(dd);setYr(y);update(s=>{s.quick=s.quick||{answers:{}};const a={...(s.quick.answers||{})};if(m&&dd&&dd<=MONTH_DAYS[m-1])a.birth=String(m).padStart(2,"0")+"-"+String(dd).padStart(2,"0");else delete a.birth;if(y)a.birthYear=+y;else delete a.birthYear;s.quick.answers=a})}
 const z=mo&&d?zodiacOf(+mo,+d):null;const rg=yr?clamp(Math.floor((YEAR_NOW-yr-10)/10),1,6):0;
 const years=[];for(let y=YEAR_NOW-10;y>=1930;y--)years.push(y);
 return html`<div className="stack birth" style=${{gap:"6px"}}>
  <div className="row" style=${{gap:"6px",alignItems:"center",flexWrap:"wrap"}}><span className="muted">생일</span>
   <select id="bd-y" aria-label="태어난 해 (선택)" value=${yr} onChange=${e=>save(mo,d,+e.target.value||"")}><option value="">연도</option>${years.map(y=>html`<option key=${y} value=${y}>${y}년</option>`)}</select>
   <select id="bd-m" aria-label="생일 월" value=${mo} onChange=${e=>save(+e.target.value||"",d&&+e.target.value&&d>MONTH_DAYS[+e.target.value-1]?"":d,yr)}><option value="">월</option>${MONTH_DAYS.map((_,i)=>html`<option key=${i} value=${i+1}>${i+1}월</option>`)}</select>
   <select id="bd-d" aria-label="생일 일" value=${d} onChange=${e=>save(mo,+e.target.value||"",yr)}><option value="">일</option>${Array.from({length:mo?MONTH_DAYS[mo-1]:31},(_,i)=>html`<option key=${i} value=${i+1}>${i+1}일</option>`)}</select>
   ${(mo||d||yr)&&html`<button className="linkbtn small" onClick=${()=>save("","","")}>지우기</button>`}
  </div>
  ${(z||rg>0)&&html`<div className="row" style=${{gap:"6px",flexWrap:"wrap"}}>${z&&html`<span className="zchip"><span aria-hidden="true">${z.sym+"\uFE0E"}</span> ${z.ko}</span>`}${rg>0&&html`<span className="zchip ring"><span aria-hidden="true">◎</span> 연륜 · ${ringName(rg)}</span>`}</div>`}
  <span className="faint">모두 선택이에요. 월·일을 고르면 젬 뒤 하늘에 별자리가, 연도까지 고르면 살아온 시간만큼 젬 안에 나이테 같은 결과 깊이가 새겨져요. 나이는 숫자로 어디에도 보이지 않고, 해석(AI)에도 보내지 않아요.</span>
 </div>`;
}
