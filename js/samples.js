"use strict";
/* MIB CBT · 샘플 아틀리에 — 가상 인물 16명. 실제 사람이 아니며, 날짜가 지날수록 스스로 단계가 오르고 기록이 쌓이도록 시뮬레이션된다(서버 데이터 없음) */

const SIM_START=Date.UTC(2026,10,1);
const SAMPLE_PEOPLE=[
 {id:"s01",name:"김하은",age:"10대",job:"꾸미기를 좋아하는 고등학생",av:"p07",stone:"장미석",light:"반짝임",form:"덩이",tex:"맑음",sym:"꽃",ln:"분홍빛",s:"작은 색의 조합으로, 오늘의 나를 표현해요.",kw:["색감","꾸미기","손재주"],tags:["ISFP"],pace:1.2,birth:"04-17",
  crests:[{cat:"root",type:"자란 곳",name:"경기 수원"},{cat:"org",type:"동호회",name:"다이어리 꾸미기 모임"}],items:[["스티커 상자","취미","2023-03"],["색연필 72색","도구","2022-09"]],acts:["오늘의 색 세 가지 고르기","다이어리 한 장 꾸미기","친구 생일 카드 만들기","좋아하는 노래로 색 팔레트 짓기"]},
 {id:"s02",name:"이민준",age:"20대",job:"게임을 좋아하는 대학생",av:"p06",stone:"청금석",light:"물결",form:"결정",tex:"결정질",sym:"번개",ln:"푸른 번개",s:"한 판의 복기에서, 함께하는 법을 배워요.",kw:["복기","팀워크","집중"],tags:["INTJ"],pace:1.0,birth:"09-02",
  crests:[{cat:"school",type:"대학교",name:"한빛대학교"},{cat:"org",type:"동호회",name:"교내 e스포츠 동아리"},{cat:"honor",type:"기록·완주",name:"교내 대회 준우승",tier:"은"}],items:[["기계식 키보드","장비","2022-03"],["노트 한 권","기록","2024-01"]],acts:["경기 한 판 복기 노트","팀원에게 고마운 점 한 줄","30분 산책으로 머리 식히기"]},
 {id:"s03",name:"박소진",age:"20대",job:"운동을 좋아하는 취업준비생",av:"p12",stone:"비취",light:"번짐",form:"결정",tex:"맑음",sym:"발자국",ln:"새벽빛",s:"조금 늦은 날에도, 내 속도를 잃지 않으려고요.",kw:["꾸준함","회복","리듬"],tags:["ENFJ"],pace:1.4,birth:"06-25",
  crests:[{cat:"school",type:"대학교",name:"새빛대학교"},{cat:"honor",type:"기록·완주",name:"하프 마라톤 완주",tier:"동"}],items:[["러닝화","장비","2021-05"]],acts:["아침 3km 달리기","면접 답변 하나 다듬기","스트레칭 10분"]},
 {id:"s04",name:"정도현",age:"30대",job:"반도체 기업 회사원",av:"p18",stone:"흑요석",light:"반짝임",form:"결정",tex:"결정질",sym:"열쇠",ln:"밤하늘",s:"정밀한 하루 끝에, 나만의 여백을 남겨 둬요.",kw:["정밀함","여백","책임"],tags:["ISTJ"],pace:.9,birth:"11-30",
  crests:[{cat:"school",type:"대학원",name:"한결공과대학교"},{cat:"org",type:"직장",name:"가람반도체"},{cat:"honor",type:"자격·면허",name:"정보처리기사",tier:"은"}],items:[["만년필","도구","2018-04"],["필름 카메라","장비","2020-07"]],acts:["퇴근길 사진 한 장","책 20쪽 읽기","주말 계획 한 줄"]},
 {id:"s05",name:"윤서연",age:"30대",job:"패션몰 창업자",av:"p04",stone:"자수정",light:"물결",form:"군집",tex:"맑음",sym:"나비",ln:"보랏빛",s:"매일의 작은 결정이 모여, 내 이름이 돼요.",kw:["결단","감각","도전"],tags:["ENTP"],pace:1.3,birth:"02-14",
  crests:[{cat:"org",type:"직장",name:"서연 스튜디오"},{cat:"media",type:"잡지",name:"월간 스타일"},{cat:"honor",type:"상장·표창",name:"청년 창업 우수상",tier:"금"}],items:[["첫 재봉틀","도구","2017-03"]],acts:["새 상품 사진 한 컷","고객 후기 한 줄 답장","작업실 정리 15분"]},
 {id:"s06",name:"김지훈",age:"40대",job:"의사",av:"p05",stone:"비취",light:"번짐",form:"군집",tex:"유백",sym:"잎",ln:"이끼빛",s:"돌보는 일 사이사이, 나를 돌보는 시간도 있어요.",kw:["돌봄","침착","배움"],tags:["INFJ"],pace:.8,birth:"07-08",
  crests:[{cat:"root",type:"태어난 곳",name:"대전"},{cat:"school",type:"대학교",name:"푸른의과대학"},{cat:"org",type:"교회",name:"새솔교회"}],items:[["청진기","장비","2009-03"],["화분 하나","생활","2021-04"]],acts:["화분에 물 주기","진료 메모 정리","가족과 저녁 산책"]},
 {id:"s07",name:"최은서",age:"20대",job:"바리스타",av:"p13",stone:"호박",light:"번짐",form:"덩이",tex:"유백",sym:"커피",ln:"꿀빛",s:"한 잔에 담긴 온도로, 오늘의 마음을 건네요.",kw:["따뜻함","손맛","환대"],tags:["ESFJ"],pace:1.1,birth:"10-11",
  crests:[{cat:"org",type:"직장",name:"골목 로스터리"},{cat:"honor",type:"자격·면허",name:"바리스타 2급",tier:"은"}],items:[["핸드드립 주전자","도구","2020-02"]],acts:["새 원두 시음 노트","단골에게 안부 한마디","라떼아트 연습 5잔"]},
 {id:"s08",name:"한성우",age:"30대",job:"초등학교 교사",av:"p22",stone:"수정",light:"반짝임",form:"결정",tex:"맑음",sym:"책",ln:"맑은 아침",s:"아이들의 질문 하나가, 내 하루를 새로 열어요.",kw:["호기심","인내","나눔"],tags:["ENFP"],pace:1.0,birth:"03-03",
  crests:[{cat:"school",type:"대학교",name:"한빛교육대학교"},{cat:"org",type:"학교",name:"새움초등학교"}],items:[["손때 묻은 출석부","기록","2019-03"]],acts:["아이들 질문 하나 기록","수업 자료 한 장","퇴근 후 기타 15분"]},
 {id:"s09",name:"오유나",age:"20대",job:"일러스트레이터",av:"p03",stone:"오팔",light:"물결",form:"덩이",tex:"비단결",sym:"붓",ln:"무지개",s:"선 하나를 고르는 데 하루를 써도, 아깝지 않아요.",kw:["관찰","표현","몰입"],tags:["INFP"],pace:1.2,birth:"12-24",
  crests:[{cat:"media",type:"온라인",name:"그림 채널 소개"},{cat:"honor",type:"상장·표창",name:"신인 일러스트 공모전",tier:"특별"}],items:[["태블릿 펜","도구","2019-11"],["스케치북 32권","기록","2015-06"]],acts:["크로키 10장","색 견본 만들기","좋아하는 그림 한 점 따라 그리기"]},
 {id:"s10",name:"강태오",age:"40대",job:"요리사",av:"p16",stone:"마노",light:"번짐",form:"결정",tex:"결정질",sym:"그릇",ln:"불빛",s:"불 앞의 시간이, 나를 단단하게 만들었어요.",kw:["장인정신","열정","정직"],tags:["ESTP"],pace:.9,birth:"05-19",
  crests:[{cat:"root",type:"자란 곳",name:"부산 영도"},{cat:"org",type:"직장",name:"바다곁 식당"},{cat:"media",type:"TV",name:"동네 맛집 탐방"}],items:[["무쇠 팬","도구","2008-05"]],acts:["새 소스 시험","장보기 메모","직원들과 점심 한 상"]},
 {id:"s11",name:"서다인",age:"10대",job:"피아노를 치는 중학생",av:"p11",stone:"자수정",light:"반짝임",form:"결정",tex:"맑음",sym:"음표",ln:"달빛",s:"틀린 음도 내 음악의 일부라는 걸 배우는 중이에요.",kw:["연습","감성","용기"],tags:["ISFJ"],pace:1.3,birth:"08-08",
  crests:[{cat:"school",type:"중학교",name:"솔빛중학교"},{cat:"honor",type:"상장·표창",name:"교내 음악회 은상",tier:"은"}],items:[["메트로놈","도구","2021-01"]],acts:["스케일 연습 20분","좋아하는 곡 한 번 끝까지","연주 녹음해서 듣기"]},
 {id:"s12",name:"문재석",age:"50대",job:"목공방 운영",av:"p23",stone:"호박",light:"물결",form:"덩이",tex:"결정질",sym:"나무",ln:"나뭇결",s:"나무가 가는 길을 따라 깎다 보면, 마음도 고와져요.",kw:["손끝","기다림","정성"],tags:["ISTP"],pace:.8,birth:"01-21",
  crests:[{cat:"root",type:"태어난 곳",name:"강원 정선"},{cat:"org",type:"직장",name:"결 목공방"},{cat:"honor",type:"자격·면허",name:"가구제작기능사",tier:"금"}],items:[["대패","도구","1998-04"],["손수 만든 의자","작품","2010-09"]],acts:["나무 한 판 대패질","공방 수강생 질문 답하기","새벽 산책"]},
 {id:"s13",name:"이수아",age:"30대",job:"육아 중인 엄마",av:"p20",stone:"장미석",light:"번짐",form:"덩이",tex:"유백",sym:"하트",ln:"봄볕",s:"아이와 함께 자라는 하루, 나도 다시 배우고 있어요.",kw:["사랑","인내","회복"],tags:["ESFJ"],pace:1.0,birth:"04-30",
  crests:[{cat:"org",type:"소모임",name:"동네 육아 모임"},{cat:"home",type:"집",verify:{sido:"경기도",gu:"성남시",days:["a","b","c","d","e","f","g","h"]}}],items:[["아이와 쓰는 일기장","기록","2023-05"]],acts:["아이와 그림책 한 권","나를 위한 커피 한 잔","오늘 웃은 순간 한 줄"]},
 {id:"s14",name:"배준호",age:"60대",job:"은퇴 후 등산을 즐기는 아버지",av:"p17",stone:"비취",light:"물결",form:"결정",tex:"결정질",sym:"산",ln:"능선빛",s:"오르는 속도보다, 끝까지 가는 마음을 믿어요.",kw:["끈기","자연","여유"],tags:["ESTJ"],pace:1.1,birth:"10-03",
  crests:[{cat:"root",type:"자란 곳",name:"충북 제천"},{cat:"org",type:"동호회",name:"토요 산악회"},{cat:"honor",type:"기록·완주",name:"백두대간 종주",tier:"금"}],items:[["등산 스틱","장비","2012-04"],["산행 수첩","기록","2015-08"]],acts:["뒷산 한 바퀴","산행 사진 정리","손주에게 안부 전화"]},
 {id:"s15",name:"홍지민",age:"20대",job:"유튜버 · 브이로거",av:"p08",stone:"오팔",light:"반짝임",form:"덩이",tex:"맑음",sym:"카메라",ln:"스튜디오 빛",s:"보여 주는 삶 뒤에, 나만 아는 하루도 아껴요.",kw:["기획","솔직함","연결"],tags:["ENFP"],pace:1.5,birth:"03-21",
  crests:[{cat:"honor",type:"크리에이터 버튼",name:"구독자 10만 달성",tier:"실버"},{cat:"media",type:"온라인",name:"일상 브이로그 채널"},{cat:"media",type:"샤라웃",name:"선배 크리에이터 소개"}],items:[["첫 카메라","장비","2019-06"]],acts:["촬영 없이 산책하기","구독자 댓글 열 개 답장","다음 영상 기획 한 줄"]},
 {id:"s16",name:"남궁별",age:"40대",job:"천문대 해설사",av:"p15",stone:"청금석",light:"반짝임",form:"군집",tex:"맑음",sym:"별",ln:"은하빛",s:"오래된 빛을 보며, 지금의 나를 다정하게 봐요.",kw:["경이","설명","인내"],tags:["INTP"],pace:1.0,birth:"12-13",
  crests:[{cat:"school",type:"대학원",name:"별바다대학교"},{cat:"org",type:"직장",name:"솔봉 천문대"},{cat:"media",type:"라디오",name:"밤하늘 이야기"}],items:[["망원경","장비","2006-11"],["별자리 노트","기록","2001-02"]],acts:["오늘 밤 보이는 별 기록","관람객 질문 하나 정리","망원경 렌즈 닦기"]}];
/* 헌정 샘플 — 널리 알려진 인물의 공개된 이력만으로 만든 카드. 본인이 참여하거나 쓴 것이 아니며, 1인칭 문장·일상 기록은 지어내지 않는다 */
const REAL_PEOPLE=[
 {id:"r01",real:true,birth:"07-08",by:1992,tags:["ESFJ"],ax:[["스피드", 0.95], ["결정력", 0.93], ["양발 슈팅", 0.9], ["리더십", 0.86], ["꾸준함", 0.88], ["팬 사랑", 0.9]],photo:"img/samples/r01.jpg",credit:"Ujishadow · 크롭 DvTor8303 · CC BY-SA 4.0",name:"손흥민",age:"유명인",job:"축구 · 대한민국 국가대표",stone:"호박",light:"반짝임",form:"결정",tex:"맑음",sym:"번개",ln:"질주하는",s:"여러 리그를 거치며 한국 축구의 새 기록을 써 온 선수.",kw:["축구","국제무대","주장"],
  crests:[{cat:"root",type:"태어난 곳",name:"강원 춘천"},{cat:"org",type:"클럽",name:"LAFC"},{cat:"honor",type:"기록·완주",name:"프리미어리그 득점왕",tier:"금",year:"2022"},{cat:"honor",type:"상장·표창",name:"FIFA 푸스카스상",tier:"특별",year:"2020"}]},
 {id:"r02",real:true,birth:"09-05",by:1990,tags:["ESFJ"],ax:[["표현력", 0.96], ["점프 기술", 0.94], ["집중력", 0.92], ["우아함", 0.95], ["승부 근성", 0.9], ["나눔", 0.84]],photo:"img/samples/r02.jpg",credit:"K-POPIT 케이팝잇 · CC BY 3.0",name:"김연아",age:"유명인",job:"피겨스케이팅 · 국가대표 출신",stone:"수정",light:"반짝임",form:"덩이",tex:"맑음",sym:"눈송이",ln:"빙판빛",s:"빙판 위에서 한 시대를 연 피겨스케이팅 선수.",kw:["피겨","올림픽","우아함"],
  crests:[{cat:"root",type:"태어난 곳",name:"경기 부천"},{cat:"school",type:"대학교",name:"고려대학교"},{cat:"honor",type:"상장·표창",name:"밴쿠버 올림픽 금메달",tier:"금",year:"2010"},{cat:"honor",type:"상장·표창",name:"소치 올림픽 은메달",tier:"은",year:"2014"}]},
 {id:"r03",real:true,birth:"02-26",by:1988,tags:["ENTJ", "AB형"],ax:[["공격력", 0.94], ["리더십", 0.95], ["승부 근성", 0.93], ["국제 경험", 0.9], ["입담", 0.85], ["동료애", 0.88]],photo:"img/samples/r03.jpg",credit:"TV10 · CC BY 4.0",name:"김연경",age:"유명인",job:"배구 · 국가대표 출신",stone:"장미석",light:"물결",form:"결정",tex:"결정질",sym:"불꽃",ln:"코트 위",s:"국경을 넘나들며 코트를 이끈 배구 선수. 2025년 우승과 함께 은퇴.",kw:["배구","리더십","국제무대"],
  crests:[{cat:"root",type:"태어난 곳",name:"경기 안산"},{cat:"org",type:"클럽",name:"흥국생명"},{cat:"honor",type:"상장·표창",name:"런던 올림픽 MVP",tier:"특별",year:"2012"},{cat:"honor",type:"상장·표창",name:"V리그 챔피언결정전 MVP",tier:"금",year:"2025"}]},
 {id:"r04",real:true,birth:"05-07",by:1996,tags:["INTP"],ax:[["판단력", 0.96], ["꾸준함", 0.95], ["침착함", 0.93], ["팀 중심", 0.9], ["자기 관리", 0.92], ["겸손", 0.86]],photo:"img/samples/r04.jpg",credit:"Marie Claire · 프레임·크롭·색보정 Gauzecard · CC BY 4.0",name:"페이커 이상혁",age:"유명인",job:"e스포츠 · LoL 프로게이머",stone:"자수정",light:"반짝임",form:"군집",tex:"결정질",sym:"왕관",ln:"불멸의",s:"한 팀에서 시즌을 거듭하며 e스포츠의 기록을 새로 쓴 선수.",kw:["e스포츠","꾸준함","기록"],
  crests:[{cat:"root",type:"태어난 곳",name:"서울 강서구"},{cat:"org",type:"클럽",name:"T1"},{cat:"honor",type:"기록·완주",name:"월드 챔피언십 6회 우승",tier:"금",year:"2013~2025"},{cat:"honor",type:"상장·표창",name:"LoL 전설의 전당 헌액",tier:"특별",year:"2024"}]},
 {id:"r05",real:true,birth:"06-28",by:1971,tags:["INTJ 추정"],ax:[["도전", 0.97], ["추진력", 0.95], ["기술 이해", 0.9], ["상상력", 0.93], ["화제성", 0.94], ["위험 감수", 0.92]],photo:"img/samples/r05.jpg",credit:"U.S. Air Force / Madelyn Keech · 크롭 Ooligan · Public domain (US)",name:"일론 머스크",age:"유명인",job:"기업가 · 전기차와 우주개발",stone:"흑요석",light:"반짝임",form:"결정",tex:"결정질",sym:"비행기",ln:"궤도 위",s:"전기차와 우주개발 기업을 이끄는 기업가.",kw:["기술","기업","우주개발"],
  crests:[{cat:"root",type:"태어난 곳",name:"남아공 프리토리아"},{cat:"school",type:"대학교",name:"University of Pennsylvania"},{cat:"org",type:"직장",name:"Tesla"},{cat:"org",type:"직장",name:"SpaceX"}]},
 {id:"r06",real:true,birth:"09-09",by:1965,tags:[],ax:[["공감", 0.95], ["전달력", 0.93], ["전문성", 0.94], ["경청", 0.92], ["따뜻함", 0.9], ["단호함", 0.84]],photo:"img/samples/r06.jpg",credit:"SBS Radio 에라오 · CC BY 3.0",name:"오은영",age:"유명인",job:"정신건강의학과 전문의 · 저자",stone:"비취",light:"번짐",form:"덩이",tex:"유백",sym:"하트",ln:"다정한",s:"아이와 부모, 관계 속의 말을 방송과 책으로 풀어 온 의사.",kw:["육아","관계","상담"],
  crests:[{cat:"school",type:"대학교",name:"연세대학교"},{cat:"honor",type:"자격·면허",name:"정신건강의학과 전문의"},{cat:"media",type:"TV",name:"금쪽같은 내 새끼"}]},
 {id:"r07",real:true,birth:"05-27",by:1985,tags:["ESFJ", "O형"],ax:[["관찰력", 0.94], ["반려견 이해", 0.96], ["전달력", 0.9], ["인내", 0.88], ["현장 경험", 0.92], ["단호함", 0.85]],photo:"img/samples/r07.jpg",credit:"보더로운생활 · CC BY 3.0",name:"강형욱",age:"유명인",job:"반려견 행동 · 훈련과 보호자 교육",stone:"마노",light:"번짐",form:"덩이",tex:"결정질",sym:"강아지",ln:"산책길",s:"반려견과 보호자의 관계를 방송으로 알려 온 훈련사.",kw:["반려견","훈련","보호자 교육"],
  crests:[{cat:"org",type:"직장",name:"보듬컴퍼니"},{cat:"media",type:"TV",name:"세상에 나쁜 개는 없다"},{cat:"media",type:"TV",name:"개는 훌륭하다"}]},
 {id:"r08",real:true,birth:"09-06",by:1961,tags:[],ax:[["분석력", 0.93], ["전달력", 0.92], ["법률 지식", 0.94], ["사례 수집", 0.95], ["꾸준함", 0.9], ["공익성", 0.86]],photo:"img/samples/r08.jpg",credit:"수원시청 · 수원새빛포럼 · 공공누리 제1유형",name:"한문철",age:"유명인",job:"변호사 · 교통사고와 교통안전",stone:"청금석",light:"물결",form:"결정",tex:"맑음",sym:"바퀴",ln:"블랙박스",s:"공개된 사고 사례로 교통안전의 질문을 던져 온 변호사.",kw:["교통안전","법률","사례"],
  crests:[{cat:"school",type:"대학교",name:"서울대학교"},{cat:"honor",type:"자격·면허",name:"변호사"},{cat:"media",type:"온라인",name:"한문철TV"},{cat:"media",type:"TV",name:"한문철의 블랙박스 리뷰"}]}];
SAMPLE_PEOPLE.push(...REAL_PEOPLE);
const AGE_RINGS={"10대":1,"20대":1,"30대":2,"40대":3,"50대":4,"60대":5};

/* the simulation: each sample person lives a few days ahead of the calendar at their own pace */
function sampleState(p,now){now=now||Date.now();const R=rng("sample|"+p.id);const off=Math.floor(R()*7)-3;const day=Math.max(1,Math.floor((now-SIM_START)/864e5)+1+off);
 const active=Math.floor(day*Math.min(1,.55+p.pace*.3));const stage=active>=Math.round(14/p.pace)?5:active>=Math.round(8/p.pace)?4:active>=Math.round(4/p.pace)?3:active>=1?2:1;
 const real=!!p.real;const friends=Math.min(12,Math.floor(active*.7*p.pace)+1);const cheers=Math.floor(active*1.6*p.pace);const visitors=Math.floor(active*2.2*p.pace);
 const lv=(v,steps)=>steps.filter(x=>v>=x).length;
 const marks=real?{setting:0,sat:0,aura:3,stars:0}:{setting:lv(day,[3,7,30,100,365]),sat:lv(friends,[1,3,5,10,20]),aura:lv(cheers,[3,10,30,60,100]),stars:lv(visitors,[5,15,30,60,100])};const stg=real?5:stage;
 const ent=p.crests.map((c,i)=>({id:p.id+"c"+i,display:true,shownAt:i,...c}));
 const st={identity:{entries:ent}};const idm=idMarks(st);
 const fp=(()=>{const F=rng("fp|"+p.id);return {hue:Math.round((F()-.5)*20),sat:+((F()-.5)*.3).toFixed(2),ws:+(.92+F()*.16).toFixed(2),hs:+(.94+F()*.1).toFixed(2),tilt:Math.round((F()-.5)*12),side:2+Math.floor(F()*3),mod:[...Array(8)].map(()=>+((F()*2-1)).toFixed(2))}})();
 const gem={stone:p.stone,lightName:p.ln,light:p.light,form:p.form,texture:p.tex,symbol:p.sym,hardness:real?5:clamp(1+lv(active,[3,7,21,60]),1,5),grain:real?2:Math.min(4,Math.floor(day/5)),facets:clamp(8+stg-1,6,14),fp,polish:stg,marks,...(p.by?{rings:clamp(Math.floor((YEAR_NOW-p.by-10)/10),1,6)}:AGE_RINGS[p.age]?{rings:AGE_RINGS[p.age]}:{})};
 if(idm){gem.idm=idm;gem.facets=clamp(gem.facets+idm.facets,6,14)}
 const todayAct=real?"":p.acts[(day+off+30)%p.acts.length];const z=p.birth?(()=>{const [m,d]=p.birth.split("-").map(Number);return zodiacOf(m,d)})():null;
 const axes=(()=>{const A=rng("axes|"+p.id);const pool=["꾸준함","호기심","표현력","공감","몰입","실행력","관찰력","기록력","나눔","도전"].filter(n=>!p.kw.includes(n));const extra=[];while(!real&&extra.length<3&&pool.length){extra.push(pool.splice(Math.floor(A()*pool.length),1)[0])}
  const grow=real?0:Math.min(.08,active*.004);if(p.ax)return p.ax.map(([name,level])=>({name,level}));return [...p.kw.slice(0,real?6:3).map(n=>({name:n,level:real?.9:+Math.min(.96,.7+A()*.2+grow).toFixed(2)})),...extra.map(n=>({name:n,level:real?.9:+Math.min(.9,.42+A()*.3+grow).toFixed(2)}))]})();
 const card={v:1,sample:true,gem,gemName:`${p.ln} ${p.stone}`,stage:stg,sentence:p.s,keywords:p.kw,axes,showHex:true,badges:[],title:"",frame:"",shelf:0,
  items:(p.items||[]).map(([name,category,since])=>({name,category,since,story:"",verify:""})),tags:p.tags||[],zodiac:z?z.k:null,crests:ent.map(publicCrest),motto:real?"공개 자료로 만든 헌정 샘플 · 본인이 참여하지 않았어요":idLine(st)};
 return {p,day,active,stage:stg,friends,cheers,todayAct,card,logs:Math.floor(active*1.4)}}

function SampleGallery({onClose,toast,mine}){useBackLayer(onClose);
 const [age,setAge]=useState("전체");const [open,setOpen]=useState(null);const [g3,setG3]=useState(null);const [why,setWhy]=useState(null);const [how,setHow]=useState(null);const now=Date.now();
 const list=useMemo(()=>SAMPLE_PEOPLE.map(p=>sampleState(p,now)),[]);
 const shown=list.filter(x=>age==="전체"||x.p.age===age||(age==="50대+"&&["50대","60대"].includes(x.p.age)));
 useEffect(()=>{track("samples_open");const k=e=>{if(e.key==="Escape"&&!open&&!g3&&!how&&!why)onClose()};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)},[open,g3,how,why]);
 return html`<div className="sg" role="dialog" aria-modal="true" aria-label="샘플 아틀리에">
  <div className="sg-in">
   <div className="row between"><span className="eyebrow">A WINDOW INTO OTHER LIVES</span><button className="g3-x sg-x" onClick=${onClose} aria-label="닫기">✕</button></div>
   <h1 className="sg-h serif">삶의 모양은 달라도,<br/>쌓이는 시간은 닮아 있어요.</h1>
   <p className="small muted"><b>가상 인물 16명</b>은 날마다 스스로 한 걸음을 걷고 젬이 자라요. <b>유명인 8명</b>은 공개된 이력만으로 만든 헌정 샘플이며, 본인이 참여하거나 쓴 내용이 아니에요.</p>
   <div className="segs mini sg-f" role="group" aria-label="나이대">${["전체","유명인","10대","20대","30대","40대","50대+"].map(a=>html`<button key=${a} aria-pressed=${age===a} onClick=${()=>setAge(a)}>${a}</button>`)}</div>
   <div className="sg-grid">${shown.map(x=>html`<article key=${x.p.id} className="sg-card">
    <div className="sg-top">${x.p.real?html`<img src=${x.p.photo} alt=${x.p.name} className="sg-av sg-photo"/>`:html`<img src=${"img/avatars/"+x.p.av+".svg"} alt="" className="sg-av"/>`}<span className="grow"><b className="serif">${x.p.name}</b><br/><span className="small faint">${x.p.real?x.p.job:x.p.age+" · "+x.p.job}</span></span><span className=${"sg-badge"+(x.p.real?" real":"")}>${x.p.real?"헌정 샘플":"가상 인물"}</span></div>
    <button className="sg-gem" onClick=${()=>setOpen(x)} aria-label=${x.p.name+"의 카드 보기"}><${GemView} g=${x.card.gem} seed=${x.card.gemName} size=${132}/></button>
    <div className="sg-gn">${x.card.gemName}<span className="small faint"> · 연마 ${x.stage}단계</span></div>
    <p className="sg-s serif">${x.p.s}</p>
    <div className="kw sg-kw">${x.p.kw.map(k=>html`<span key=${k} className="chip">${k}</span>`)}</div>
    <div className="sg-foot"><span className="small faint">${x.p.real?html`공개 자료 기반 · 본인 참여 아님<br/><span className="sg-credit">사진: ${x.p.credit}</span>`:"오늘 · "+x.todayAct}</span><span className="row" style=${{gap:"8px"}}><button className="g3-btn" onClick=${()=>{setHow(x);track("sample_how",{id:x.p.id})}}>되려면?</button><button className="g3-btn" onClick=${()=>setWhy(x)}>왜?</button><button className="g3-btn" onClick=${()=>setG3(x)}>◇ 3D</button><button className="linkbtn small" onClick=${()=>setOpen(x)}>카드 보기 ›</button></span></div>
   </article>`)}</div>
   <p className="note" style=${{textAlign:"center"}}>가상 인물과 그 이야기는 지어낸 것이에요. 헌정 샘플은 공개 자료의 사실만 담았고, 해당 인물과 제휴·후원 관계가 없으며 CBT 기간에만 보여요.</p>
  </div>
  ${open&&html`<${CardShowcase} key=${open.p.id} faces=${otherCardFaces({data:open.card},open.p.name,null)} toast=${toast||(()=>{})} onClose=${()=>setOpen(null)}/>`}
  ${how&&html`<div className="sg-why"><${SampleHowSheet} x=${how} mine=${mine} onClose=${()=>setHow(null)}/></div>`}
  ${why&&html`<div className="sg-why"><${GemWhySheet} g=${why.card.gem} seed=${why.card.gemName} name=${why.p.name} onClose=${()=>setWhy(null)}/></div>`}
  ${g3&&html`<${Gem3DView} g=${g3.card.gem} seed=${g3.card.gemName} name=${g3.p.name} onClose=${()=>setG3(null)}/>`}
 </div>`}

/* a small strip that opens the gallery (Friends tab) */
function SampleStrip({onOpen}){const list=useMemo(()=>SAMPLE_PEOPLE.slice(0,6).map(p=>sampleState(p)),[]);
 return html`<button className="panel sg-strip" onClick=${onOpen}><span className="eyebrow">SAMPLE ATELIERS</span><span className="grow"><b>샘플 아틀리에 24곳 둘러보기</b><br/><span className="small muted">젬이 어떻게 자라는지 미리 보세요</span></span><span className="sg-strip-gems">${list.map(x=>html`<span key=${x.p.id}><${GemView} g=${x.card.gem} seed=${x.card.gemName} size=${34}/></span>`)}</span></button>`}

/* ── 샘플 젬처럼 되려면 — 그 젬의 각 요소가 무엇으로 생겼는지, 나는 지금 어디쯤인지 ── */
function sampleHowRows(x,mine){
 const g=x.card.gem||{};const me=(mine&&mine.g)||null;const mst=mine&&mine.st;const rows=[];
 const lvOf=(k)=>((me&&me.marks)||{})[k]||0;
 const stg=x.stage||g.polish||1;const myStg=mst?Math.max(1,(mst.flags&&mst.flags.maxStage)||(mst.analysis?1:0)):0;
 rows.push({t:`연마 ${stg}단계 · ${STAGES[stg]}`,how:STAGE_RULES.slice(2,stg+1).map((r,i)=>`${i+2}단계 ${r.need}`).join(" → ")||"첫 해석을 받으면 1단계",me:mst?`나는 ${myStg}단계`:"",done:myStg>=stg});
 MARKS.forEach(m=>{const lv=(g.marks||{})[m.k]||0;if(!lv)return;const need=m.steps[lv-1];const my=lvOf(m.k);rows.push({t:m.k==="sat"?markTitle(m,lv):`${m.label} · ${markTitle(m,lv)}`,how:`${m.src} ${need}${m.unit}`,me:me?`나는 ${my?markTitle(m,my):"아직 없음"}`:"",done:my>=lv})});
 const hd=clamp(g.hardness||1,1,5);if(hd>=3)rows.push({t:`강(모서리) ${hd} / 5`,how:`처음 해석의 '오래 이어 온 일'에 더해, 활동한 날이 ${HARD_STEPS.slice(0,Math.max(0,hd-2)).join("·")||3}일을 넘을 때마다 한 단계씩`,me:me?`나는 ${clamp(me.hardness||1,1,5)} / 5`:"",done:me&&(me.hardness||1)>=hd});
 if((g.grain||0)>=1)rows.push({t:`금빛 결 ${g.grain}줄`,how:"기록 속 전환점, 그리고 쉬었다가 다시 시작한 날마다 한 줄씩",me:me?`나는 ${me.grain||0}줄`:"",done:me&&(me.grain||0)>=g.grain});
 const im=g.idm||{};if(im.roots||im.laurel||im.spot||(im.banners||[]).length)rows.push({t:"휘장의 흔적",how:[im.roots&&"뿌리·터전 → 젬 아래 뿌리",(im.banners||[]).length&&"소속 → 빛깔 리본",im.laurel&&"영예 → 월계관",im.spot&&"조명 → 스포트라이트"].filter(Boolean).join(" · ")+" ('나의 휘장'에서 새기기)",me:"",done:!!(me&&me.idm)});
 if(g.rings)rows.push({t:"연륜 나이테",how:"'공개할 모습'에서 태어난 해를 고르면 살아온 시간만큼 나이테가 생겨요",me:"",done:!!(me&&me.rings)});
 if(x.card.zodiac)rows.push({t:"젬 뒤의 별자리",how:"'공개할 모습'에서 생일(월·일)을 고르면 떠요",me:"",done:!!(mst&&typeof myZodiac==="function"&&myZodiac(mst))});
 return rows}
function SampleHowSheet({x,mine,onClose}){
 const rows=sampleHowRows(x,mine);const I=gemIdentity(x.card.gem||{},x.card.gemName);const real=!!x.p.real;const done=rows.filter(r=>r.done).length;
 return html`<${Sheet} title=${`${x.p.name}의 젬처럼 되려면`} onClose=${onClose}>
  <div className="why-top"><${GemView} g=${x.card.gem} seed=${x.card.gemName} size=${120}/>${mine&&mine.g&&html`<span className="how-vs">→</span><${GemView} g=${mine.g} seed=${mine.seed} size=${96}/>`}</div>
  <p className="small muted" style=${{textAlign:"center",margin:"4px 0 0"}}>${mine&&mine.g?`왼쪽이 ${x.p.name}, 오른쪽이 지금의 내 젬이에요. 아래 ${rows.length}가지 중 ${done}가지를 갖췄어요.`:`이 젬의 모습은 아래처럼 쌓여서 생겼어요.`}</p>
  ${real&&html`<div className="panel tint small">헌정 샘플은 공개 이력을 바탕으로 '명품' 단계를 미리 채워 둔 상징 값이에요. 실제로는 오래 꾸준히 쌓아야 닿는 모습이에요.</div>`}
  <div className="stack"><h2 className="h3">쌓아서 생기는 것</h2>
   <div className="how-list">${rows.map(r=>html`<div key=${r.t} className=${"how-row"+(r.done?" done":"")}><span className="how-ck" aria-hidden="true">${r.done?"✓":""}</span><span className="grow"><b>${r.t}</b><br/><span className="small muted">${r.how}</span>${r.me&&html`<br/><span className="small faint">${r.me}</span>`}</span></div>`)}</div></div>
  <div className="stack"><h2 className="h3">타고나는 것</h2>
   <p className="small muted" style=${{margin:0}}>빛깔 <b>${I.variant}</b>${I.rareVariant?" (희귀 변종)":""}, 모양 <b>${I.cut}</b>${I.pattern?`, 무늬 <b>${I.pattern}</b>`:""}${I.feats.length?`, 숨은 특성 <b>${I.feats.map(k=>INCLUSIONS[k].name).join("·")}</b>`:""}은 이 사람의 기록과 고유한 무늬에서 정해져요. 따라 할 수는 없고, 내 젬에는 나만의 빛깔과 모양이 있어요.${(I.aw||[]).length?` 발현(${I.aw.map(a=>a.n).join("·")})은 연마 단계가 오를 때 깨어나는데, 무엇이 깨어날지는 사람마다 달라요.`:""}</p></div>
  <p className="note">샘플은 비교하라고 있는 게 아니라, 젬이 어떻게 자라는지 미리 보여 주려고 있어요.</p>
 <//>`;
}
