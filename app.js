/* ================================================
   초록 지구 지킴이 — app.js
   ================================================ */

/* ── 상수 ── */
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbyAKHaytykpZHEInGk6lrs4cpfoQ_IP3QobaCAGbnrOw86FYh5EndH4v61AbYqjBAeqlg/exec";

const STUDENTS = [
  {no:1,name:"강하영"},{no:2,name:"김루하"},{no:3,name:"김소은"},
  {no:4,name:"김지유"},{no:5,name:"남시하"},{no:6,name:"손유하"},
  {no:7,name:"윤수아"},{no:8,name:"윤승아"},{no:9,name:"이하민"},
  {no:10,name:"임아윤"},{no:11,name:"전서현"},{no:12,name:"조율희"},
  {no:13,name:"최한별"},{no:14,name:"한지원"},{no:15,name:"김동빈"},
  {no:16,name:"김시윤"},{no:17,name:"김주원"},{no:18,name:"김효찬"},
  {no:19,name:"남지후"},{no:20,name:"노시온"},{no:21,name:"방준영"},
  {no:22,name:"송건우"},{no:23,name:"임환희"},{no:24,name:"조유찬"},
  {no:25,name:"주은호"},{no:26,name:"한진우"},{no:27,name:"허시준"},
  {no:28,name:"서현우"},
];

const LEVELS = [
  {name:"씨앗 지킴이", emoji:"🌱", minScore:0},
  {name:"새싹 지킴이", emoji:"🌿", minScore:300},
  {name:"나무 지킴이", emoji:"🌳", minScore:1000},
  {name:"숲 지킴이",   emoji:"🌲", minScore:3000},
  {name:"지구 지킴이", emoji:"🌍", minScore:6000},
];



/* 미션 키와 이름 — 순서가 appendRow 순서와 완전히 일치해야 함 */
const MISSION_KEYS  = ["m_meal","m1","m2","m3","m4","m5","m6","m7","m8"];
const MISSION_NAMES = [
  "급식 다 먹기","전등 끄기","물 아끼기","분리수거",
  "쓰레기 없는 하루","교실 청결","식물 돌보기","플러그 뽑기","물건 아끼기",
];

/* ── 상태 ── */
let totalScore    = 0;
let missionScores = {};
let currentStreak = 0;
let currentNo     = "";
let currentName   = "";
let allServerData = [];
let calViewYear   = new Date().getFullYear();
let calViewMonth  = new Date().getMonth();
let scoreChart    = null;
let classChart    = null;
let selectedDate  = "";   // "YYYY-M-D" 형식, 날짜 선택 화면에서 설정

/* ══════════════════════════════
   localStorage 유틸
══════════════════════════════ */
const lsKey           = s => `eco_${currentNo}_${currentName}_${s}`;
const getTodayStr     = () => { const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; };
const getSelectedStr  = () => selectedDate || getTodayStr();
const hasSubmitted    = () => localStorage.getItem(lsKey("lastSubmit")) === getSelectedStr();
const markSubmit      = () => localStorage.setItem(lsKey("lastSubmit"), getSelectedStr());
const getCumScore  = () => Number(localStorage.getItem(lsKey("cumScore"))||0);
const addCumScore  = n  => { const v=getCumScore()+n; localStorage.setItem(lsKey("cumScore"),v); return v; };

const getStreakData= () => { const r=localStorage.getItem(lsKey("streakData")); return r?JSON.parse(r):{count:0,lastDate:""}; };
const saveStreak   = obj=> localStorage.setItem(lsKey("streakData"),JSON.stringify(obj));

/* ══════════════════════════════
   레벨 / 배지 유틸
══════════════════════════════ */
function getLevel(cum) {
  let lv=LEVELS[0];
  for(const l of LEVELS) if(cum>=l.minScore) lv=l;
  return lv;
}
function getNextLevel(cum) {
  for(const l of LEVELS) if(cum<l.minScore) return l;
  return null;
}
/* ══════════════════════════════
   연속 streak 계산
   전날 제출했을 때만 연속, 빠지면 1로 초기화
══════════════════════════════ */
function calcStreak() {
  const sd   = getStreakData();
  const sel  = getSelectedStr();
  // 선택 날짜의 전날 계산
  const parts = sel.split("-").map(Number);
  const selD  = new Date(parts[0], parts[1]-1, parts[2]);
  const prevD = new Date(selD); prevD.setDate(selD.getDate()-1);
  const prevStr = `${prevD.getFullYear()}-${prevD.getMonth()+1}-${prevD.getDate()}`;
  if(sd.lastDate===sel)      return sd.count;      // 이미 이 날짜 제출
  if(sd.lastDate===prevStr)  return sd.count+1;    // 연속
  return 1;                                         // 끊김
}

/* ══════════════════════════════
   탭 전환
══════════════════════════════ */
function switchTab(tabId, btn) {
  document.querySelectorAll(".tab-page").forEach(p=>p.classList.add("hidden"));
  document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
  document.getElementById(tabId).classList.remove("hidden");
  btn.classList.add("active");

  // 학급현황판 진입 시 데이터 로드
  if(tabId==="class-page") loadClassRanking();
}

/* ══════════════════════════════
   로그인
══════════════════════════════ */
function login() {
  const no   = document.getElementById("user-no").value.trim();
  const name = document.getElementById("user-name").value.trim();
  if(!no||!name){ alert("번호와 이름을 입력하세요!"); return; }

  const found = STUDENTS.find(s=> String(s.no)===String(no) && s.name===name);
  if(!found){ alert("번호 또는 이름이 명단과 일치하지 않아요 😅\n(예: 번호 3, 이름 김소은)"); return; }

  currentNo     = no;
  currentName   = name;
  currentStreak = getStreakData().count;

  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("header-sub").textContent = `${name} 지킴이의 환경 기록 🌱`;

  // 날짜 선택 화면으로 이동
  showDatePage();
}

function showDatePage() {
  // 오늘 날짜를 기본값으로 설정
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth()+1).padStart(2,"0");
  const dd   = String(now.getDate()).padStart(2,"0");
  const todayVal = `${yyyy}-${mm}-${dd}`;

  const picker = document.getElementById("date-picker");
  picker.value = todayVal;
  picker.max   = todayVal; // 미래 날짜 선택 불가

  // 제출 여부 미리 표시
  updateDateStatus(picker.value);
  picker.addEventListener("change", () => updateDateStatus(picker.value));

  document.getElementById("date-page").classList.remove("hidden");
}

function updateDateStatus(isoVal) {
  // isoVal: "2025-06-03" 형식
  const [y,m,d] = isoVal.split("-").map(Number);
  const dateStr = `${y}-${m}-${d}`;
  const submitted = localStorage.getItem(lsKey("lastSubmit")) === dateStr;
  const statusEl = document.getElementById("date-submit-status");
  if(submitted){
    statusEl.textContent = "✅ 이 날짜는 이미 제출했어요";
    statusEl.style.color = "#43a047";
    document.getElementById("date-confirm-btn").textContent = "이미 제출한 날짜예요";
    document.getElementById("date-confirm-btn").style.background = "#aaa";
  } else {
    statusEl.textContent = "";
    document.getElementById("date-confirm-btn").textContent = "이 날짜로 입력하기 ✏️";
    document.getElementById("date-confirm-btn").style.background = "#43a047";
  }
}

function confirmDate() {
  const picker = document.getElementById("date-picker");
  const isoVal = picker.value; // "2025-06-03"
  if(!isoVal){ alert("날짜를 선택해주세요!"); return; }

  const [y,m,d] = isoVal.split("-").map(Number);
  selectedDate = `${y}-${m}-${d}`;

  // 이미 제출한 날짜 차단
  if(hasSubmitted()){
    alert(`${selectedDate} 은(는) 이미 제출한 날짜예요 😊`);
    return;
  }

  // 달력을 선택 날짜의 월로 맞추기
  calViewYear  = y;
  calViewMonth = m - 1;

  document.getElementById("date-page").classList.add("hidden");
  document.getElementById("app-body").classList.remove("hidden");

  renderCalendar();
  loadAllData();
}

/* ══════════════════════════════
   급식판
══════════════════════════════ */
document.querySelectorAll(".food-slot").forEach(slot=>{
  slot.addEventListener("click",()=>{
    slot.classList.toggle("active");
    updateTotalScore();
  });
});

/* ══════════════════════════════
   미션 버튼
══════════════════════════════ */
function setMission(btn, id, score) {
  missionScores[id]=score;
  btn.parentElement.querySelectorAll(".mission-btn").forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected");
  updateTotalScore();
}

function updateTotalScore() {
  let s=0;
  document.querySelectorAll(".food-slot.active").forEach(()=>s+=4);
  Object.values(missionScores).forEach(v=>s+=v);
  totalScore=s;
  document.getElementById("total-score").innerText=s+"점";
}

/* ══════════════════════════════
   점수 제출
══════════════════════════════ */
function submitScore() {
  if(hasSubmitted()){ alert("오늘은 이미 제출했어요 😊\n내일 다시 도전해봐요!"); return; }

  const selParts   = getSelectedStr().split("-").map(Number);
  const today      = selParts[2];  // 선택된 날짜의 일(day)
  const newStreak  = calcStreak();
  const streakBonus= (newStreak%5===0)?10:0;

  const prevCum    = getCumScore();
  const prevLevel  = getLevel(prevCum);

  const baseScore  = totalScore+streakBonus;
  const tempCum    = prevCum+baseScore;
  const newLevel   = getLevel(tempCum);
  const levelUp    = newLevel.name!==prevLevel.name;
  const bonusExtra = levelUp ? 50 : 0;
  const finalScore = baseScore+bonusExtra;
  const newCum     = prevCum+finalScore;

  markSubmit();
  addCumScore(finalScore);
  saveStreak({count:newStreak, lastDate:getSelectedStr()});
  currentStreak=newStreak;

  // 달력 발자국
  const targetDay=document.querySelector(`.day[data-day="${today}"]`);
  if(targetDay){
    const pawClass=(newStreak%5===0)?"gold-paw":"green-paw";
    targetDay.innerHTML=`<div>${today}</div><div class="${pawClass}">🐾</div>`;
  }

  renderLevelBadge(finalScore,newCum);

  const mealScore = document.querySelectorAll(".food-slot.active").length*4;
  const payload={
    date: getSelectedStr(),
    no:currentNo, name:currentName,
    score:finalScore, streak:newStreak,
    badges:"", level:newLevel.name,
    m_meal: mealScore,
    m1: missionScores[1]||0,
    m2: missionScores[2]||0,
    m3: missionScores[3]||0,
    m4: missionScores[4]||0,
    m5: missionScores[5]||0,
    m6: missionScores[6]||0,
    m7: missionScores[7]||0,
    m8: missionScores[8]||0,
  };

  console.log("📤 전송 payload:", payload); // 디버그용

  fetch(WEB_APP_URL,{method:"POST",body:JSON.stringify(payload),headers:{"Content-Type":"text/plain"}})
    .then(r=>r.json())
    .then(res=>{
      console.log("✅ 서버 응답:", res);
      showSubmitPopup(finalScore,streakBonus,bonusExtra,levelUp,newLevel,newCum);
    })
    .catch(err=>{ console.error(err); alert("저장 실패! 인터넷 연결을 확인해주세요."); });
}

/* ══════════════════════════════
   팝업
══════════════════════════════ */
function showSubmitPopup(score,streakBonus,bonusExtra,levelUp,level,cum) {
  const nextLv=getNextLevel(cum);
  const progress=nextLv
    ? Math.min(100,Math.round(((cum-level.minScore)/(nextLv.minScore-level.minScore))*100))
    : 100;

  let bonusLines="";
  if(streakBonus>0)
    bonusLines+=`<div class="popup-bonus">🔥 연속 5일 달성! +${streakBonus}점</div>`;
  if(levelUp)
    bonusLines+=`<div class="popup-bonus" style="border-color:#43a047;color:#2e7d32">🎉 레벨업! +50점</div>`;

  const popup=document.createElement("div");
  popup.className="popup";
  popup.innerHTML=`
    <div class="popup-box">
      <div class="bear">🐻‍❄️</div>
      <h2>빙하가 지켜졌어요!</h2>
      <p class="popup-text">${score}점의 노력으로<br>해수면이 0.0001cm 낮아졌어요!</p>
      ${bonusLines}
      <div class="popup-level">
        <span class="level-emoji">${level.emoji}</span>
        <span class="level-name">${level.name}</span>
        ${nextLv
          ?`<div class="popup-progress-bar"><div class="popup-progress-fill" style="width:${progress}%"></div></div>
            <p class="popup-progress-text">다음 레벨까지 ${nextLv.minScore-cum}점</p>`
          :`<p style="color:#43a047;font-weight:bold;margin:4px 0">🎊 최고 레벨 달성!</p>`}
      </div>
      <button onclick="closePopup();switchTab('my-page',document.querySelector('[data-tab=my-page]'))">마이페이지 보기</button>
    </div>`;
  document.body.appendChild(popup);
}

function closePopup(){ const p=document.querySelector(".popup"); if(p) p.remove(); }

/* ══════════════════════════════
   레벨 & 배지 렌더링
══════════════════════════════ */
function renderLevelBadge(todayScore=0,overrideCum=null){
  const cum=overrideCum!==null?overrideCum:getCumScore();
  const level=getLevel(cum);
  const nextLv=getNextLevel(cum);
  const progress=nextLv&&nextLv.minScore>level.minScore
    ?Math.min(100,Math.round(((cum-level.minScore)/(nextLv.minScore-level.minScore))*100)):100;

  const el=document.getElementById("level-section");
  if(!el) return;
  el.innerHTML=`
    <div class="level-display">
      <div class="level-icon">${level.emoji}</div>
      <div class="level-info">
        <div class="level-title">${level.name}</div>
        <div class="level-cumulative">누적 ${cum}점</div>
        ${nextLv
          ?`<div class="progress-wrap">
               <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
               <div class="progress-label">다음 레벨 ${nextLv.name}까지 ${nextLv.minScore-cum}점</div>
             </div>`
          :`<div class="progress-label" style="color:#43a047;font-weight:bold">🎊 최고 레벨 달성!</div>`}
      </div>
    </div>
    <div class="level-ladder">
      ${LEVELS.map(l=>{
        const active=l.name===level.name, done=cum>=l.minScore;
        return `<div class="ladder-step ${active?"ladder-active":done?"ladder-done":""}">
          <span>${l.emoji}</span><span class="ladder-name">${l.name}</span>
          <span class="ladder-score">${l.minScore}점~</span>
        </div>`;
      }).join("")}
    </div>`;
}

/* ══════════════════════════════
   달력 (월 이동)
══════════════════════════════ */
function renderCalendar(){
  const calTitle=document.getElementById("cal-title");
  const grid=document.getElementById("calendar-grid");
  if(!grid) return;
  calTitle.textContent=`${calViewYear}년 ${calViewMonth+1}월`;
  grid.innerHTML="";
  ["일","월","화","수","목","금","토"].forEach(d=>{ grid.innerHTML+=`<div class="week-name">${d}</div>`; });
  const firstDay=new Date(calViewYear,calViewMonth,1).getDay();
  const lastDate=new Date(calViewYear,calViewMonth+1,0).getDate();
  for(let i=0;i<firstDay;i++) grid.innerHTML+="<div></div>";
  for(let d=1;d<=lastDate;d++)
    grid.innerHTML+=`<div class="day" data-day="${d}" data-year="${calViewYear}" data-month="${calViewMonth+1}">${d}</div>`;
  if(allServerData.length>0) markCalendarPaws();
  renderMissionAnalysis();
}

function prevMonth(){ calViewMonth--; if(calViewMonth<0){calViewMonth=11;calViewYear--;} renderCalendar(); }
function nextMonth(){ calViewMonth++; if(calViewMonth>11){calViewMonth=0;calViewYear++;} renderCalendar(); }

function markCalendarPaws(){
  const myRecords=allServerData
    .filter(r=>Number(r.no)===Number(currentNo))
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  // 전체 streak 재계산 (연속 판단)
  const streakOrder=[];
  for(let i=0;i<myRecords.length;i++){
    if(i===0){ streakOrder.push(1); continue; }
    const prev=new Date(myRecords[i-1].date.split("T")[0]);
    const curr=new Date(myRecords[i].date.split("T")[0]);
    const diff=Math.round((curr-prev)/(1000*60*60*24));
    streakOrder.push(diff===1?streakOrder[i-1]+1:1);
  }

  myRecords.forEach((rec,idx)=>{
    const ds=rec.date.split("T")[0];
    const [y,m,d]=ds.split("-").map(Number);
    if(y!==calViewYear||m!==calViewMonth+1) return;
    const pawClass=(streakOrder[idx]%5===0)?"gold-paw":"green-paw";
    const target=document.querySelector(`.day[data-day="${d}"]`);
    if(target) target.innerHTML=`<div>${d}</div><div class="${pawClass}">🐾</div>`;
  });
}

/* ══════════════════════════════
   개인 미션 분석
══════════════════════════════ */
function renderMissionAnalysis(){
  const el=document.getElementById("mission-analysis");
  if(!el) return;
  const myRecords=allServerData.filter(r=>{
    const ds=r.date.split("T")[0]; const [y,m]=ds.split("-").map(Number);
    return Number(r.no)===Number(currentNo)&&y===calViewYear&&m===calViewMonth+1;
  });
  if(myRecords.length===0){
    el.innerHTML=`<p class="analysis-empty">아직 이번 달 기록이 없어요 🌱</p>`; return;
  }
  const sums=MISSION_KEYS.map(()=>0);
  myRecords.forEach(r=>{
    MISSION_KEYS.forEach((k,i)=>{ sums[i]+=Number(r[k]||0); });
  });
  const avgs=MISSION_NAMES.map((name,i)=>({name,avg:sums[i]/myRecords.length}));
  const sorted=[...avgs].sort((a,b)=>b.avg-a.avg);
  const best=sorted[0], worst=sorted[sorted.length-1];
  el.innerHTML=`
    <div class="analysis-row">
      <div class="analysis-card best">
        <div class="analysis-label">👍 제일 잘 지킨 항목</div>
        <div class="analysis-name">${best.name}</div>
        <div class="analysis-avg">평균 ${best.avg.toFixed(1)}점</div>
      </div>
      <div class="analysis-card worst">
        <div class="analysis-label">💪 더 노력할 항목</div>
        <div class="analysis-name">${worst.name}</div>
        <div class="analysis-avg">평균 ${worst.avg.toFixed(1)}점</div>
      </div>
    </div>`;
}

/* ══════════════════════════════
   개인 그래프 (이번 달 전체)
══════════════════════════════ */
async function renderGraph(){
  const container=document.getElementById("score-chart-container");
  if(!container) return;
  const now=new Date(); const year=now.getFullYear(); const month=now.getMonth();
  const lastDate=new Date(year,month+1,0).getDate();
  const labels=Array.from({length:lastDate},(_,i)=>`${month+1}/${i+1}`);
  const scoreMap={};
  allServerData.filter(r=>Number(r.no)===Number(currentNo)).forEach(r=>{
    const [y,m,d]=r.date.split("T")[0].split("-").map(Number);
    if(y===year&&m===month+1) scoreMap[d]=Number(r.score||0);
  });
  const scores=labels.map((_,i)=>scoreMap[i+1]!==undefined?scoreMap[i+1]:null);
  if(!scores.some(s=>s!==null)){
    container.innerHTML=`<p style="text-align:center;color:#888;padding:30px 0">아직 이번 달 기록이 없어요 🌱</p>`;
    return;
  }
  container.innerHTML=`<div style="position:relative;width:100%;height:210px;"><canvas id="myScoreChart"></canvas></div>`;
  if(!window.Chart) await loadChartJs();
  if(scoreChart){ scoreChart.destroy(); scoreChart=null; }
  scoreChart=new Chart(document.getElementById("myScoreChart"),{
    type:"bar",
    data:{labels,datasets:[{
      label:"점수", data:scores,
      backgroundColor:scores.map(s=>s===null?"transparent":s>=80?"rgba(251,192,45,.8)":"rgba(67,160,71,.7)"),
      borderColor:scores.map(s=>s===null?"transparent":s>=80?"#f57f17":"#2e7d32"),
      borderWidth:1.5, borderRadius:4,
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.parsed.y!==null?`${ctx.parsed.y}점`:"미제출"}}},
      scales:{
        y:{beginAtZero:true,max:130,ticks:{callback:v=>v+"점",font:{size:11}},grid:{color:"rgba(0,0,0,.05)"}},
        x:{ticks:{font:{size:9},autoSkip:true,maxRotation:45},grid:{display:false}},
      }},
  });
}

/* ══════════════════════════════
   전체 데이터 불러오기
══════════════════════════════ */
async function loadAllData(){
  try{
    const res=await fetch(WEB_APP_URL);
    allServerData=await res.json();
    console.log("📥 서버 데이터 샘플:", allServerData[0]); // 헤더 확인용
    markCalendarPaws();
    renderGraph();
    renderLevelBadge();
    renderMissionAnalysis();
  }catch(e){ console.error("데이터 로드 실패",e); }
}

/* ══════════════════════════════
   학급 현황판
══════════════════════════════ */
async function loadClassRanking(){
  document.getElementById("top3-section").innerHTML="<p style='color:#888'>불러오는 중...</p>";
  try{
    const res=await fetch(WEB_APP_URL);
    const data=await res.json();

    const now=new Date(); const y=now.getFullYear(); const m=now.getMonth()+1;

    // 학생별 집계 초기화 (STUDENTS 순서 = 번호순 고정)
    const monthlyMap={};
    const totalMap={};
    STUDENTS.forEach(s=>{
      monthlyMap[s.name]={score:0, ms:Array(MISSION_KEYS.length).fill(0)};
      totalMap[s.name]=0;
    });

    data.forEach(r=>{
      const nm=r.name;
      if(!monthlyMap[nm]) return;
      const [ry,rm]=r.date.split("T")[0].split("-").map(Number);
      totalMap[nm]=(totalMap[nm]||0)+Number(r.score||0);
      if(ry===y&&rm===m){
        monthlyMap[nm].score+=Number(r.score||0);
        MISSION_KEYS.forEach((k,i)=>{
          monthlyMap[nm].ms[i]+=Number(r[k]||0);
        });
      }
    });

    // 이번 달 점수 기준 순위 → 동점자 공동 순위
    const scored=STUDENTS.map(s=>({...s,monthScore:monthlyMap[s.name].score}))
      .sort((a,b)=>b.monthScore-a.monthScore);
    const rankMap={};
    let rank=1;
    for(let i=0;i<scored.length;i++){
      if(i>0&&scored[i].monthScore<scored[i-1].monthScore) rank=i+1;
      rankMap[scored[i].name]=rank;
    }

    // 항목별 1위 — 동점 시 이번 달 총점 높은 사람 1명
    const missionWinners=MISSION_KEYS.map((k,i)=>{
      let maxScore=-1;
      STUDENTS.forEach(s=>{ const v=monthlyMap[s.name].ms[i]; if(v>maxScore) maxScore=v; });
      if(maxScore<=0) return {missionName:MISSION_NAMES[i], name:"-", score:0};
      const tied=STUDENTS.filter(s=>monthlyMap[s.name].ms[i]===maxScore);
      // 동점 시 이번 달 총점 높은 사람 선택
      tied.sort((a,b)=>monthlyMap[b.name].score - monthlyMap[a.name].score);
      return {missionName:MISSION_NAMES[i], name:tied[0].name, score:maxScore};
    });

    buildClassPage(monthlyMap, missionWinners, totalMap, rankMap, scored);
  }catch(e){
    console.error(e);
    document.getElementById("top3-section").innerHTML="<p>불러오기 실패 😢</p>";
  }
}

function buildClassPage(monthlyMap, missionWinners, totalMap, rankMap, scored){

  /* TOP 3 — 텍스트 순위, 동점자 공동 */
  const rankLabels={1:"1위",2:"2위",3:"3위"};
  let topHtml=`<div class="class-section-title">🏆 이번 달 TOP 3</div>`;
  [1,2,3].forEach(r=>{
    const group=scored.filter(s=>rankMap[s.name]===r);
    if(!group.length) return;
    group.forEach(s=>{
      const isMe=s.name===currentName;
      topHtml+=`<div class="ranking-item ${isMe?"ranking-me":""}">
        <span class="rank-medal top-rank">${rankLabels[r]}</span>
        <span class="rank-name">${s.name}${isMe?" (나)":""}</span>
        <span class="rank-score">${s.monthScore}점</span>
      </div>`;
    });
  });
  document.getElementById("top3-section").innerHTML=topHtml;

  /* 항목별 1위 — 단일 이름 */
  let mwHtml=`<div class="class-section-title">⭐ 이번 달 항목별 1위</div><div class="mission-winner-grid">`;
  missionWinners.forEach(w=>{
    mwHtml+=`<div class="mission-winner-card">
      <div class="mw-mission">${w.missionName}</div>
      <div class="mw-name">${w.name}</div>
      <div class="mw-score">${w.score>0?w.score+"점":"기록 없음"}</div>
    </div>`;
  });
  mwHtml+="</div>";
  document.getElementById("mission-winner-section").innerHTML=mwHtml;

  /* 전체 명단 — 번호순 고정, 순위 텍스트 */
  let listHtml=`<div class="class-section-title">📋 우리 반 전체 명단 (번호순)</div>
    <div class="student-header">
      <span>번호</span><span>이름</span><span>레벨</span><span>이번달</span><span>순위</span>
    </div>`;
  STUDENTS.forEach(s=>{
    const lv=getLevel(totalMap[s.name]||0);
    const isMe=s.name===currentName;
    const r=rankMap[s.name];
    const rankStr=r<=3?`<b>${r}위</b>`:`${r}위`;
    listHtml+=`<div class="student-row ${isMe?"student-me":""}">
      <span class="student-no">${s.no}</span>
      <span class="student-name">${s.name}${isMe?" (나)":""}</span>
      <span class="student-level">${lv.emoji} <small>${lv.name}</small></span>
      <span class="student-score">${monthlyMap[s.name].score}점</span>
      <span class="student-rank-col">${rankStr}</span>
    </div>`;
  });
  document.getElementById("ranking-list").innerHTML=listHtml;

  /* 그래프 */
  renderClassChart(STUDENTS.map(s=>({name:s.name,score:monthlyMap[s.name].score})));

  /* 룰 안내 */
  document.getElementById("rules-section").innerHTML=`
    <div class="class-section-title">📖 점수 규칙 안내</div>
    <div class="rules-box">
      <div class="rule-item">🔥 <b>5일 연속 달성</b> — +10점 보너스 (중간에 하루라도 빠지면 초기화!)</div>
      <div class="rule-item">🎉 <b>레벨업 시</b> — +50점 보너스</div>
      <div class="rule-item">🏆 <b>동점자</b> — 전체 순위는 공동 순위 표시 / 항목별 1위 동점은 이번 달 총점 높은 학생</div>
      <div class="rule-item rule-levels"><b>레벨 기준</b><br>
        🌱 씨앗 0점~ | 🌿 새싹 300점~ | 🌳 나무 1,000점~ | 🌲 숲 3,000점~ | 🌍 지구 6,000점~
      </div>
    </div>`;
}

/* ══════════════════════════════
   학급 그래프
══════════════════════════════ */
async function renderClassChart(studentScores){
  const container=document.getElementById("class-chart-container");
  if(!container) return;
  // 번호순(입력 순서) 유지
  const labels=studentScores.map(s=>s.name);
  const scores=studentScores.map(s=>s.score);
  container.innerHTML=`
    <div class="class-section-title">📊 이번 달 누적 점수 그래프</div>
    <div style="position:relative;width:100%;height:${Math.max(320,labels.length*30)}px;">
      <canvas id="classChart"></canvas>
    </div>`;
  if(!window.Chart) await loadChartJs();
  if(classChart){ classChart.destroy(); classChart=null; }
  classChart=new Chart(document.getElementById("classChart"),{
    type:"bar",
    data:{labels,datasets:[{
      label:"이번 달 점수", data:scores,
      backgroundColor:scores.map(s=>s>0?"rgba(67,160,71,.75)":"rgba(200,200,200,.5)"),
      borderRadius:4, borderWidth:0,
    }]},
    options:{indexAxis:"y",responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.parsed.x}점`}}},
      scales:{
        x:{beginAtZero:true,ticks:{callback:v=>v+"점",font:{size:11}},grid:{color:"rgba(0,0,0,.05)"}},
        y:{ticks:{font:{size:11}},grid:{display:false}},
      }},
  });
}

function loadChartJs(){
  return new Promise((res,rej)=>{
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });
}

/* ══════════════════════════════
   window.onload
══════════════════════════════ */
window.onload=function(){
  const btn=document.getElementById("login-btn");
  btn.addEventListener("click",login);

  // 엔터키 로그인
  ["user-no","user-name"].forEach(id=>{
    document.getElementById(id).addEventListener("keydown",e=>{
      if(e.key==="Enter") login();
    });
  });

  // 날짜 확인 버튼
  document.getElementById("date-confirm-btn").addEventListener("click", confirmDate);
};
