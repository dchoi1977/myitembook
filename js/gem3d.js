"use strict";
/* MIB CBT · 3D 젬 — 같은 젬 속성(색·변종·형·컷·질·각·연마)으로 입체를 빚어 손가락으로 돌려 본다. three.js는 열 때만 불러온다 */

const THREE_URL="https://cdn.jsdelivr.net/npm/three@0.147.0/build/three.min.js";
let __threeP=null;
function loadThree(){if(window.THREE)return Promise.resolve(window.THREE);if(__threeP)return __threeP;__threeP=new Promise((res,rej)=>{const s=document.createElement("script");s.src=THREE_URL;s.async=true;s.onload=()=>res(window.THREE);s.onerror=()=>{__threeP=null;rej(new Error("three_load"))};document.head.appendChild(s)});return __threeP}

/* palette & shape from the same rules as the 2D gem */
function gem3dSpec(g,seed){g=g||{};const T=gemTraits(g,seed);let st=STONES[g.stone]||STONES["오팔"];const v=variantOf(g.stone||"오팔",T);if(v.base)st={...st,base:v.base,light:v.light,deep:v.deep,tint:v.tint};
 const fp=g.fp||null;if(fp)st={...st,base:hueShift(st.base,fp.hue,fp.sat),light:hueShift(st.light,fp.hue*.6,fp.sat*.5),deep:hueShift(st.deep,fp.hue,fp.sat)};
 const pol=clamp(Math.round(g.polish||g.stage||3),1,5);const PO=POLISH[pol];st={...st,base:hueShift(st.base,T.hueX,PO.sat),light:hueShift(st.light,T.hueX*.6,PO.sat),deep:hueShift(st.deep,T.hueX,PO.sat)};
 const form=FORMS.includes(g.form)?g.form:"덩이";const aw=awakenings(g,seed,pol);const shape=aw.some(a=>a.k==="star")?"별 컷":aw.some(a=>a.k==="heart")?"하트 컷":cutOf(form,T);
 const tex=TEXTURES.includes(g.texture)?g.texture:"맑음";const facets=clamp(Math.round(g.facets||8),6,14);
 return {st,form,cut:shape,tex,facets,pol,scale:PO.sc*T.scale,ws:fp?fp.ws:1,hs:fp?fp.hs:1,bi:T.bi?hueShift(st.base,T.hue2*.6,.1):null,glow:hueShift(st.light==="#FFFFFF"?st.tint:st.light,T.glowHue,.15),R:rng(seed+"|3d|"+form+facets)}}

function buildGem3D(THREE,S){const grp=new THREE.Group();const V=THREE.Vector2,R=S.R;
 const lathe=(pts,seg,rot=0)=>{const geo=new THREE.LatheGeometry(pts.map(([x,y])=>new V(Math.max(0.0001,x),y)),seg,rot);return geo};
 const crystal=(r,h,tipT,tipB,sides,wide)=>lathe([[0,-h/2-tipB],[r*(wide?.75:1),-h/2],[r,h*.1],[r*(wide||1),h/2],[0,h/2+tipT]],sides,Math.PI/sides);
 const ws=S.ws,hs=S.hs,sides=clamp(6+Math.floor((S.facets-6)/3),6,9);const parts=[];
 if(S.cut==="하트 컷"||S.cut==="별 컷"){const sh=new THREE.Shape();if(S.cut==="별 컷"){for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.48:1.05;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?sh.lineTo(x,y):sh.moveTo(x,y)}}else{for(let i=0;i<=48;i++){const t=i/48*Math.PI*2;const x=16*Math.pow(Math.sin(t),3)/17,y=(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))/17;i?sh.lineTo(x,y):sh.moveTo(x,y)}}
  const geo=new THREE.ExtrudeGeometry(sh,{depth:.34,bevelEnabled:true,bevelThickness:.22,bevelSize:.14,bevelSegments:2,curveSegments:6});geo.center();geo.scale(.78,.78,.78);parts.push([geo,0,0,0,0])}
 else if(S.form==="결정"){const H=1.7*hs,r=.48*ws;
  if(S.cut==="바늘")parts.push([crystal(r*.68,H*1.12,.5,.38,sides),0,0,0,0]);
  else if(S.cut==="쌍뿔")parts.push([crystal(r*1.1,H*.62,.7,.7,sides),0,0,0,0]);
  else if(S.cut==="왕관")parts.push([lathe([[0,-H/2-.32],[r*.7,-H/2],[r*.74,H*.05],[r*1.25,H*.3],[r*1.15,H/2],[0,H/2+.4]],sides,Math.PI/sides),0,0,0,0]);
  else if(S.cut==="쌍정"){parts.push([crystal(r*.85,H*.85,.42,.3,sides),-.22,0,0,-.42]);parts.push([crystal(r*.9,H*.95,.45,.32,sides),.2,.05,0,.38])}
  else parts.push([crystal(r,H,.46,.36,sides),0,0,0,0])}
 else if(S.cut==="정동"){ /* 정동: 바위 껍질을 반으로 가른 단면 — 안쪽에 결정이 빼곡히 돋은 모습 (2D 카드와 같은 형태) */
  const RX=1.02*ws,RY=.9*hs,N=30,jit=[...Array(N)].map(()=>.93+R()*.12);
  const pt=(i,k)=>{const t=i/N*Math.PI*2;return [Math.cos(t)*RX*jit[i%N]*k,Math.sin(t)*RY*jit[i%N]*k]};
  const outer=new THREE.Shape();for(let i=0;i<=N;i++){const [x,y]=pt(i,1);i?outer.lineTo(x,y):outer.moveTo(x,y)}
  const hole=new THREE.Path();for(let i=N;i>=0;i--){const [x,y]=pt(i,.76);i===N?hole.moveTo(x,y):hole.lineTo(x,y)}const ringShape=outer.clone();ringShape.holes.push(hole);
  const rockC=new THREE.Color("#8C7A68"),rockD=new THREE.Color("#5E5044"),rockL=new THREE.Color("#C9B9A4");
  const rockMat=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.92,metalness:0});
  const paint=(geo,f)=>{geo=geo.index?geo.toNonIndexed():geo;const p=geo.attributes.position;const cols=[];for(let i=0;i<p.count;i+=3){const c=f((p.getZ(i)+p.getZ(i+1)+p.getZ(i+2))/3,(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3,(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3);c.offsetHSL(0,0,(R()-.5)*.07);for(let k=0;k<3;k++)cols.push(c.r,c.g,c.b)}geo.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();return geo};
  const ring=new THREE.ExtrudeGeometry(ringShape,{depth:.62,bevelEnabled:true,bevelThickness:.12,bevelSize:.07,bevelSegments:1,curveSegments:2});ring.translate(0,0,-.45);
  grp.add(new THREE.Mesh(paint(ring,z=>z>.12?rockL.clone().lerp(new THREE.Color("#E9DFD0"),.35):z>-.1?rockC.clone():rockD.clone()),rockMat));
  const back=new THREE.ExtrudeGeometry(outer,{depth:.22,bevelEnabled:true,bevelThickness:.1,bevelSize:.05,bevelSegments:1,curveSegments:2});back.translate(0,0,-.62);grp.add(new THREE.Mesh(paint(back,()=>rockD.clone()),rockMat));
  const base=new THREE.Color(S.st.base),light=new THREE.Color(S.st.light),deep=new THREE.Color(S.st.deep);
  const floor=new THREE.ShapeGeometry(new THREE.Shape(hole.getPoints().reverse()));floor.translate(0,0,-.36);
  const crysMat=new THREE.MeshPhysicalMaterial({vertexColors:true,flatShading:true,roughness:.12,metalness:.04,clearcoat:.8,clearcoatRoughness:.06,emissive:deep.clone().multiplyScalar(.18)});
  grp.add(new THREE.Mesh(paint(floor,()=>deep.clone().lerp(base,.45)),new THREE.MeshStandardMaterial({vertexColors:true,side:THREE.DoubleSide,roughness:.5,emissive:deep.clone().multiplyScalar(.25)})));
  const cones=[];const inside=(x,y)=>(x*x)/(RX*.72*RX*.72)+(y*y)/(RY*.72*RY*.72)<1;let tries=0;
  while(cones.length<120&&tries++<2000){const x=(R()*2-1)*RX*.74,y=(R()*2-1)*RY*.74;if(!inside(x,y)||cones.some(c=>Math.hypot(c.x-x,c.y-y)<.07))continue;const d=Math.sqrt((x/RX)**2+(y/RY)**2);const h=.2+R()*.26+(1-d)*.14,r=.07+R()*.07;
   const g=new THREE.ConeGeometry(r,h,4+Math.floor(R()*3),1);g.rotateX(Math.PI/2);g.rotateZ(R()*Math.PI);const lean=(1-d)*.0+d*.55;g.rotateX(-y/RY*lean);g.rotateY(x/RX*lean);g.translate(x,y,-.36+h/2);g.x=x;g.y=y;cones.push(g)}
  cones.forEach(g=>grp.add(new THREE.Mesh(paint(g,z=>deep.clone().lerp(base,clamp((z+.36)/.3,0,1)).lerp(light,clamp((z+.1)/.25,0,.6))),crysMat)));
  const sp=new THREE.PointLight(new THREE.Color(S.st.light),.55,3);sp.position.set(0,0,.6);grp.add(sp);
  grp.rotation.x=-.08}
 else if(S.form==="군집"){const H=1.45*hs,r=.36*ws;const n=S.cut==="부채"?5:4+Math.floor(R()*2);
  parts.push([crystal(r*1.1,H,.42,.2,sides),0,.12,0,0]);
  for(let i=0;i<n;i++){const a=(i/n)*Math.PI*2+R()*.4;const sc=.45+R()*.35;const tilt=.35+R()*.35;parts.push([crystal(r*sc*1.1,H*sc,.36*sc,.12,6),Math.cos(a)*.34,-.32+sc*.1,Math.sin(a)*.34,0,{tiltA:a,tilt}])}}
 else{const r=.95*ws;
  /* 2D 카드처럼 테이블(윗면)이 정면을 보도록 세운다 — 돌리면 옆모습(크라운·파빌리온)이 드러난다 */
  const faceOn=geo=>{geo.rotateX(Math.PI/2);return geo};
  if(S.cut==="브릴리언트"){const geo=faceOn(lathe([[0,.36],[r*.56,.36],[r,.06],[r,-.02],[0,-.86]],16,Math.PI/16));geo.scale(1,hs,1);parts.push([geo,0,0,0,0])}
  else if(S.cut==="마키즈"){const geo=faceOn(lathe([[0,.34],[r*.55,.34],[r,.06],[r,-.02],[0,-.8]],12,0));geo.scale(.56,1.12,1);parts.push([geo,0,0,0,0])}
  else if(S.cut==="트릴리언"){const sh=new THREE.Shape();for(let i=0;i<3;i++){const a=Math.PI/2+i*2*Math.PI/3,x=Math.cos(a)*r*1.12,y=Math.sin(a)*r*1.12;i?sh.lineTo(x,y):sh.moveTo(x,y)}sh.closePath();const geo=new THREE.ExtrudeGeometry(sh,{depth:.16,bevelEnabled:true,bevelThickness:.34,bevelSize:.2,bevelSegments:2,curveSegments:1});geo.center();geo.scale(1,hs,1);parts.push([geo,0,-.06,0,0])}
  else if(S.cut==="에메랄드 컷"){const geo=faceOn(lathe([[0,.3],[r*.62,.3],[r*.86,.12],[r*.9,-.06],[r*.6,-.46],[0,-.58]],8,Math.PI/8));geo.scale(1.04,.8,1);parts.push([geo,0,0,0,0])}
  else if(S.cut==="쿠션"){const sh=new THREE.Shape(),w=r*.86,h=r*.86,c=r*.36;sh.moveTo(-w+c,-h);sh.lineTo(w-c,-h);sh.quadraticCurveTo(w,-h,w,-h+c);sh.lineTo(w,h-c);sh.quadraticCurveTo(w,h,w-c,h);sh.lineTo(-w+c,h);sh.quadraticCurveTo(-w,h,-w,h-c);sh.lineTo(-w,-h+c);sh.quadraticCurveTo(-w,-h,-w+c,-h);
   const geo=new THREE.ExtrudeGeometry(sh,{depth:.3,bevelEnabled:true,bevelThickness:.3,bevelSize:.18,bevelSegments:3,curveSegments:5});geo.center();geo.scale(1,hs,1);parts.push([geo,0,0,0,0])}
  else if(S.cut==="카보숑"){const pts=[[0,-.18],[r*.96,-.18]];for(let i=0;i<=12;i++){const t=i/12*Math.PI/2;pts.push([Math.cos(t)*r,Math.sin(t)*r*.62])}const geo=faceOn(lathe(pts,40));geo.scale(1.06,hs*.88,1);parts.push([geo,0,0,0,0])}
  else if(S.cut==="물방울"){const pts=[];for(let i=0;i<=14;i++){const t=i/14*Math.PI;pts.push([Math.sin(t)*Math.pow(Math.sin(t/2),.9)*r*.8,-Math.cos(t)*r*1.05])}const geo=lathe(pts,S.facets+4);parts.push([geo,0,0,0,Math.PI])}
  else{const geo=new THREE.IcosahedronGeometry(r*.92,0);const p=geo.attributes.position;const seen={};for(let i=0;i<p.count;i++){const k=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(3)).join();if(!seen[k])seen[k]=.86+R()*.26;const f=seen[k];p.setXYZ(i,p.getX(i)*f*ws,p.getY(i)*f*.88*hs,p.getZ(i)*f)}geo.computeVertexNormals();parts.push([geo,0,0,0,0])}}
 /* material: faceted, two-tone by height, clear stones let light through */
 const base=new THREE.Color(S.st.base),light=new THREE.Color(S.st.light),deep=new THREE.Color(S.st.deep),bi=S.bi?new THREE.Color(S.bi):null;
 const clear=S.tex==="맑음",milky=S.tex==="유백";
 parts.forEach(([geo,x,y,z,rz,o])=>{geo=geo.index?geo.toNonIndexed():geo;geo.computeBoundingBox();const bb=geo.boundingBox;const p=geo.attributes.position;const cols=[];
  for(let i=0;i<p.count;i+=3){const cy=(p.getY(i)+p.getY(i+1)+p.getY(i+2))/3;const cx=(p.getX(i)+p.getX(i+1)+p.getX(i+2))/3;const t=(cy-bb.min.y)/((bb.max.y-bb.min.y)||1);let c=deep.clone().lerp(base,clamp(t*1.25,0,1)).lerp(light,clamp((t-.72)*1.3,0,.32));if(bi)c.lerp(bi,clamp((cx-bb.min.x)/((bb.max.x-bb.min.x)||1)-.35,0,.6));if(milky)c.lerp(new THREE.Color("#FFFFFF"),.22);const j=(R()-.5)*.08;c.offsetHSL(0,0,j);for(let k=0;k<3;k++)cols.push(c.r,c.g,c.b)}
  geo.setAttribute("color",new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();
  const mat=new THREE.MeshPhysicalMaterial({vertexColors:true,flatShading:true,roughness:clear?.06:milky?.42:S.tex==="비단결"?.24:.14,metalness:.04,clearcoat:clear?.8:.4,clearcoatRoughness:.08,transparent:clear,opacity:clear?.95:1,sheen:S.tex==="비단결"?1:0,emissive:new THREE.Color(S.st.deep).multiplyScalar(.12)});
  const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(o&&o.tilt!=null){m.rotation.z=-Math.cos(o.tiltA)*o.tilt;m.rotation.x=Math.sin(o.tiltA)*o.tilt}else m.rotation.z=rz;grp.add(m);
  const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geo,18),new THREE.LineBasicMaterial({color:new THREE.Color(S.st.light).lerp(new THREE.Color("#FFFFFF"),.5),transparent:true,opacity:S.tex==="결정질"?.45:.18}));edges.position.copy(m.position);edges.rotation.copy(m.rotation);grp.add(edges)});
 const s=S.scale*1.15;grp.scale.set(s,s,s);return grp}

/* 2D 카드의 연출(후광·나이테·발현 장식·받침·인연석·별무리·휘장)을 그대로 3D 무대에 걸어 둔다.
   뒤판(후광·받침) → 3D 보석 → 속빛(상징·금빛 결·발현의 빛) → 앞판(인연석·별) 순으로 겹쳐, 카드와 같은 젬이 입체로 돈다. */
function svgTexture(THREE,svg){const tex=new THREE.Texture();tex.encoding=THREE.sRGBEncoding;tex.anisotropy=4;const img=new Image();img.onload=()=>{const c=document.createElement("canvas");c.width=800;c.height=860;c.getContext("2d").drawImage(img,0,0,800,860);tex.image=c;tex.needsUpdate=true};img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);return tex}
function addGemStage(THREE,scene,gem,g,seed,cam,aspect){
 const L=gemSVG(g,seed,"g3",{layers:true});gem.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(gem);const gs=new THREE.Vector3();bb.getSize(gs);const gc=new THREE.Vector3();bb.getCenter(gc);
 const B=L.box;const bodyH=Math.max(10,B.y1-B.y0);const k=gs.y/bodyH;const cx=(B.x0+B.x1)/2,cy=(B.y0+B.y1)/2;
 const pcx=gc.x+(100-cx)*k,pcy=gc.y-(107.5-cy)*k;const PW=200*k,PH=215*k;
 const half=Math.tan(16*Math.PI/180);const d=Math.max((PH*.5*1.04)/half,(PW*.5*1.06)/(half*aspect));
 cam.position.set(0,pcy,d);cam.lookAt(0,pcy,0);
 const plane=(svg,z,order,o)=>{const sc=(d-z)/d;const m=new THREE.Mesh(new THREE.PlaneGeometry(PW*sc,PH*sc),new THREE.MeshBasicMaterial({map:svgTexture(THREE,svg),transparent:true,depthWrite:false,depthTest:!(o&&o.over),toneMapped:false,opacity:(o&&o.op)||1}));m.position.set(pcx*sc,pcy+(pcy-pcy)*sc,z);m.renderOrder=order;scene.add(m);return m};
 const back=plane(L.back,-Math.max(1.4,gs.z*.9),-1);const inner=plane(L.inner,0,5,{over:true,op:.88});const front=plane(L.front,Math.min(1.1,d*.3),10,{over:true});
 return {back,inner,front,d,pcy}}
function Gem3DView({g,seed,name,onClose}){useBackLayer(onClose);
 const host=useRef(null);const [state,setState]=useState("loading");
 useEffect(()=>{let alive=true,raf=0,ren=null,cleanup=()=>{};
  loadThree().then(THREE=>{if(!alive||!host.current)return;const el=host.current;const W=el.clientWidth,H=el.clientHeight;
   ren=new THREE.WebGLRenderer({antialias:true,alpha:true});ren.setPixelRatio(Math.min(2,window.devicePixelRatio||1));ren.setSize(W,H);ren.outputEncoding=THREE.sRGBEncoding;el.appendChild(ren.domElement);
   const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(32,W/H,.1,50);cam.position.set(0,.25,6.2);cam.lookAt(0,0,0);
   const S=gem3dSpec(g,seed);
   scene.add(new THREE.HemisphereLight(0xffffff,0x2a3a36,.42));const k=new THREE.DirectionalLight(0xffffff,1.05);k.position.set(-3,4,5);scene.add(k);const rim=new THREE.DirectionalLight(new THREE.Color(S.glow),.9);rim.position.set(3,-1,-4);scene.add(rim);const fill=new THREE.PointLight(new THREE.Color(S.st.light),.6,12);fill.position.set(2,1,3);scene.add(fill);
   const gem=buildGem3D(THREE,S);scene.add(gem);const stage=addGemStage(THREE,scene,gem,g,seed,cam,W/H);gem.position.y+=0;
   let rx=-.12,ry=0,vx=0,vy=.006,drag=null,idle=0;
   const down=e=>{drag={x:e.clientX,y:e.clientY};idle=0;el.setPointerCapture&&el.setPointerCapture(e.pointerId)};
   const move=e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};vy=dx*.008;vx=dy*.006;ry+=vy;rx=clamp(rx+vx,-1.1,1.1)};
   const up=()=>{drag=null};el.addEventListener("pointerdown",down);el.addEventListener("pointermove",move);window.addEventListener("pointerup",up);
   const tick=()=>{if(!drag){idle++;vy+=((idle>40?.006:0)-vy)*.04;vx*=.92;ry+=vy;rx+=(-.12-rx)*.01}gem.rotation.set(rx,ry,0);const tt=performance.now()/1000;stage.inner.material.opacity=.62+.26*Math.max(0,Math.cos(ry))*(.92+.08*Math.sin(tt*1.6));stage.back.material.opacity=.92+.08*Math.sin(tt*.9);ren.render(scene,cam);raf=requestAnimationFrame(tick)};tick();setState("ready");
   cleanup=()=>{el.removeEventListener("pointerdown",down);el.removeEventListener("pointermove",move);window.removeEventListener("pointerup",up)};
  }).catch(()=>alive&&setState("fail"));
  const k=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",k);
  return()=>{alive=false;cancelAnimationFrame(raf);cleanup();window.removeEventListener("keydown",k);if(ren){ren.dispose();ren.domElement.remove()}}},[]);
 const I=gemIdentity(g,seed);
 return html`<div className="g3" role="dialog" aria-modal="true" aria-label=${(name||"")+" 젬 3D로 보기"}>
  <button className="g3-x" onClick=${onClose} aria-label="닫기">✕</button>
  <div className="g3-eyebrow">YOUR GEM · 3D</div>
  <div className="g3-stage"><div className="g3-glow" style=${{background:`radial-gradient(circle, ${hueShift((STONES[g.stone]||STONES["오팔"]).light,0,.1)}55, transparent 62%)`}}></div><div ref=${host} className="g3-canvas"></div>${state==="loading"&&html`<div className="g3-wait">젬을 빚는 중…</div>`}${state==="fail"&&html`<div className="g3-wait">3D를 불러오지 못했어요. 네트워크를 확인해 주세요.</div>`}<div className="g3-floor"></div></div>
  <div className="g3-name serif">${gemName(g)}</div><div className="g3-sub">${I.variant} · ${I.cut}${I.pattern?" · "+I.pattern:""}</div>
  <div className="g3-hint">끌어서 돌려 보세요 · 손을 떼면 천천히 돌아요</div>
 </div>`}
