"use strict";
/* MIB CBT · 이 젬은 왜 이런 모양일까 — 젬의 각 모습이 어디서 왔는지 풀어 준다.
   내 젬은 근거(기록에서 읽은 내용)까지, 다른 사람의 젬은 규칙과 공개된 모습만 보여 준다 */
const WHY_FORM={"결정":"한 가지를 깊이 파고드는 삶의 구조가 길게 뻗은 결정으로 나타났어요.","덩이":"여러 관심이 고르게 어우러진 삶의 구조가 둥근 덩이로 나타났어요.","군집":"여러 갈래로 뻗어 가는 삶의 구조가 결정 무리로 나타났어요."};
const WHY_LIGHT={"번짐":"곁에 있는 사람에게 은은하게 스미는 방식으로 영향을 건네요.","반짝임":"순간순간 영감을 튀기듯 건네는 방식이에요.","물결":"넓게 퍼져 나가며 주변을 움직이는 방식이에요."};
const WHY_TEX={"맑음":"하루의 리듬이 가볍고 투명해서 속이 비치는 맑은 질감이 됐어요.","유백":"차분하고 부드러운 리듬이 우윳빛 질감으로 나타났어요.","결정질":"계획적이고 또렷한 리듬이 선이 살아 있는 결정질로 나타났어요.","비단결":"고르게 이어지는 리듬이 비단 같은 결로 나타났어요."};
function gemWhyRows(g,seed,own){g=g||{};const I=gemIdentity(g,seed);const st=STONES[g.stone]||STONES["오팔"];const B=(own&&g.basis)||{},Rz=(own&&g.reasons)||{};const ev=k=>[B[k],Rz[k]].filter(Boolean).join(" · ").replace(/\bnull\b/g,"아직 모름");
 const facets=clamp(Math.round(g.facets||8),6,14),layers=clamp(2+Math.floor((facets-6)/3),2,4);
 return [
  {k:"색",sub:"바탕과 속빛",v:I.variant,why:`핵심 가치 '${st.meaning}'에서 ${josa(g.stone||"오팔","이")} 됐어요. 같은 ${josa(g.stone||"오팔","이라도")} 빛깔은 사람마다 달라서, 이 젬은 '${I.variant}' 빛깔을 타고났어요.`,ev:ev("색")},
  {k:"형",sub:"실루엣",v:`${g.form||"덩이"} · ${I.cut}`,why:`${WHY_FORM[g.form]||WHY_FORM["덩이"]} 세부 모양 '${I.cut}'${(I.aw||[]).some(a=>a.kind==="모양")?"은 연마 단계가 오르며 깨어난 모양이에요.":"은 이 젬이 타고난 개성이에요."}`,ev:ev("형")},
  {k:"빛",sub:"퍼지는 방식",v:g.light||"번짐",why:`${WHY_LIGHT[g.light]||WHY_LIGHT["번짐"]} 밝기는 모든 젬이 같고, 퍼지는 무늬만 달라요.`,ev:ev("빛")},
  {k:"질",sub:"표면의 리듬",v:g.texture||"맑음",why:WHY_TEX[g.texture]||WHY_TEX["맑음"],ev:ev("질")},
  {k:"강",sub:"모서리의 선명함",v:`${clamp(g.hardness||1,1,5)} / 5`,why:"활동한 날이 3·7·21·60일을 넘을 때마다 모서리가 한 단계씩 또렷해져요. 쉬어도 줄지 않아요.",ev:ev("강")},
  {k:"결",sub:"내부의 금빛 결",v:`${g.grain||0}줄`,why:"기록 속 전환점, 그리고 쉬었다가 다시 시작한 순간마다 금빛 결이 한 줄씩 새겨져요.",ev:ev("결")},
  {k:"상",sub:"안쪽의 상징",v:g.symbol||"별",why:"이 사람을 대표하는 장면에서 고른 상징이 젬 안에 비쳐요. 주인이 직접 바꿀 수 있어요.",ev:ev("상")},
  {k:"각",sub:"결정면",v:`${facets}면 · ${layers}층`,why:"관심 영역의 수에서 출발해, 나를 다시 읽거나 연마 단계가 오르거나 배운 곳을 휘장으로 남길 때마다 면과 층이 늘어요.",ev:ev("각")}]}
function gemWhyExtras(g,seed){g=g||{};const I=gemIdentity(g,seed);const out=[];const pol=clamp(Math.round(g.polish||g.stage||1),1,5);const mk=g.marks||{},im=g.idm||{};
 out.push({t:`연마 ${pol}단계 · ${STAGES[pol]}`,d:["","갓 만난 원석이라 작고 거칠며 돌 껍질이 남아 있어요.","초벌을 거쳐 껍질이 얇아지고 윤곽이 다듬어졌어요.","연마를 거쳐 윤곽이 깨끗해지고 본래 빛깔이 드러났어요.","광택 단계라 채도가 오르고 꼭짓점이 반짝여요.","명품 단계라 가장 크고 짙으며, 무지갯빛 불꽃이 깜빡여요."][pol]+" 활동한 날과 주고받은 마음이 쌓일수록 올라요."});
 if(I.pattern)out.push({t:`무늬 · ${I.pattern}`,d:"이 젬이 타고난 무늬예요. 사람마다 정해져 있어요."});
 I.feats.forEach(k=>out.push({t:`숨은 특성 · ${INCLUSIONS[k].name}`,d:`${INCLUSIONS[k].desc}. ${INCLUSIONS[k].rar} 특성으로, 타고난 것이에요.`}));
 (I.aw||[]).forEach(a=>out.push({t:`발현 · ${a.n}`,d:`연마 ${a.at}단계에 오를 때 깨어난 ${AW_TIERS[a.t][0]} 발현이에요. 무엇이 깨어날지는 그 단계에 닿기 전까지 알 수 없어요.`}));
 MARKS.forEach(m=>{const lv=mk[m.k]||0;if(lv)out.push({t:`${m.label} · ${markTitle(m,lv)}`,d:`${m.src}${m.k==="setting"?"이 쌓여":m.k==="sat"?"가 늘어":"이 늘어"} 생긴 표식이에요.`})});
 if(im.roots)out.push({t:"뿌리",d:"나고 자란 곳과 터전을 휘장으로 남겨 젬 아래로 뿌리가 내렸어요."});
 if((im.banners||[]).length)out.push({t:`소속 리본 · ${im.banners.length}줄`,d:"속한 곳마다 그곳의 빛깔로 리본에 한 줄씩 더해져요."});
 if(im.laurel)out.push({t:"월계관",d:"받은 상과 자격을 휘장으로 남겨 젬을 받치는 화관이 생겼어요."});
 if(im.spot)out.push({t:"조명",d:"방송·신문 등에 소개된 순간을 휘장으로 남겨 위에서 빛이 내려와요."});
 if(g.rings)out.push({t:`연륜 · ${ringName(g.rings)}`,d:"살아온 시간만큼 젬 안에 나이테 같은 결이 새겨졌어요."});
 return out}
function GemWhy({g,seed,own,name}){const rows=gemWhyRows(g,seed,own);const ex=gemWhyExtras(g,seed);
 return html`<div className="why">
  <h3 className="why-h serif">여덟 가지 모습, 이렇게 만들어졌어요.</h3>
  <div className="why-grid">${rows.map(r=>html`<div key=${r.k} className="why-card"><span className="why-k">${r.k} · ${r.sub}</span><b className="serif">${r.v}</b><p>${r.why}</p>${r.ev&&html`<p className="why-ev">내 기록에서 읽은 근거 · ${r.ev}</p>`}</div>`)}</div>
  ${ex.length>0&&html`<h3 className="why-h serif">자라면서 더해진 것</h3><div className="why-list">${ex.map((e,i)=>html`<div key=${i} className="why-row"><b>${e.t}</b><span>${e.d}</span></div>`)}</div>`}
  <p className="note">같은 기록은 같은 젬이 돼요. 젬의 크기·모양·장식은 사람의 능력이나 가치를 매기지 않아요.${own?"":" 다른 사람의 젬은 만들어진 규칙과 공개된 모습만 보여 주고, 그 사람의 기록 내용은 보여 주지 않아요."}</p>
 </div>`}
function GemWhySheet({g,seed,own,name,onClose}){return html`<${Sheet} title=${own?"내 젬은 왜 이런 모양일까":(name||"")+"의 젬 이야기"} onClose=${onClose}><div className="why-top"><${GemView} g=${g} seed=${seed} size=${150}/><div><span className="eyebrow">YOUR DATA, YOUR GEM</span><div className="serif why-name">${gemName(g)}</div></div></div><${GemWhy} g=${g} seed=${seed} own=${own} name=${name}/><//>`}
