/* ==============================================
   초록 지구 지킴이 — app.js  (전면 개정판)
   ============================================== */

/* ── 상수 ── */
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzh-XqLW1rCkOfzj_arB6xP9EHUkql9uKjbJwP6H8F1QLpl0QJSH1nMSeGUT9VDUW6eiA/exec";

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

const BADGES = [
  {id:"perfect", name:"완벽한 하루", emoji:"💯", short:"완벽",
   desc:"하루 100점 달성", check:(cum,score)=> score>=100},
  {id:"b1000",   name:"1000점",      emoji:"🥉", short:"1K",
   desc:"누적 1000점",    check:(cum)=> cum>=1000},
  {id:"b2500",   name:"2500점",      emoji:"🥈", short:"25C",
   desc:"누적 2500점",    check:(cum)=> cum>=2500},
  {id:"b5000",   name:"5000점",      emoji:"🥇", short:"5K",
   desc:"누적 5000점",    check:(cum)=> cum>=5000},
  {id:"b7500",   name:"7500점",      emoji:"🏆", short:"75C",
   desc:"누적 7500점",    check:(cum)=> cum>=7500},
  {id:"b10000",  name:"10000점",     emoji:"👑", short:"10K",
   desc:"누적 10000점",   check:(cum)=> cum>=10000},
];

const MISSION_NAMES = [
  "급식 다 먹기",
  "전등 끄기",
  "물 아끼기",
  "분리수거",
  "쓰레기 없는 하루",
  "교실 청결",
  "식물 돌보기",
  "플러그 뽑기",
  "물건 아끼기",
];

/* ── 상태 ── */
let totalScore   = 0;
let missionScores= {};   // {mealCount, 1..8}
let currentStreak= 0;
let currentNo    = "";
let currentName  = "";
let allServerData= [];   // 서버에서 불러온 전체 레코드
let calViewYear  = new Date().getFullYear();
let calViewMonth = new Date().getMonth();   // 0-based
let scoreChart   = null;
let classChart   = null;

/* ══════════════════════════════
   localStorage 유틸
══════════════════════════════ */
const lsKey = s => `eco_${currentNo}_${currentName}_${s}`;

const getTodayStr = () => {
  const d=new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
};

const hasSubmittedToday = () =>
  localStorage.getItem(lsKey("lastSubmit")) === getTodayStr();

const markSubmittedToday = () =>
  localStorage.setItem(lsKey("lastSubmit"), getTodayStr());

const getCumScore = () => Number(localStorage.getItem(lsKey("cumScore"))||0);

const addCumScore = n => {
  const v = getCumScore()+n;
  localStorage.setItem(lsKey("cumScore"), v);
  return v;
};

const getBadgeIds = () => {
  const r=localStorage.getItem(lsKey("badges"));
  return r ? JSON.parse(r) : [];
};

const saveBadgeIds = ids =>
  localStorage.setItem(lsKey("badges"), JSON.stringify(ids));

/* 연속 날짜 streak 저장 */
const getStreakData = () => {
  const r=localStorage.getItem(lsKey("streakData"));
  return r ? JSON.parse(r) : {count:0, lastDate:""};
};

const saveStreakData = obj =>
  localStorage.setItem(lsKey("streakData"), JSON.stringify(obj));

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
function calcNewBadges(cum, score, existingIds) {
  return BADGES.filter(b=>
    !existingIds.includes(b.id) && b.check(cum, score)
  );
}

/* ══════════════════════════════
   연속 streak 계산
   (전날 제출했을 때만 연속, 중간 빠지면 1로 초기화)
══════════════════════════════ */
function calcStreak() {
  const sd   = getStreakData();
  const today = getTodayStr();

  // 어제 날짜 문자열
  const yd  = new Date();
  yd.setDate(yd.getDate()-1);
  const yesterday = `${yd.getFullYear()}-${yd.getMonth()+1}-${yd.getDate()}`;

  let newCount;
  if(sd.lastDate === yesterday) {
    newCount = sd.count + 1;          // 연속
  } else if(sd.lastDate === today) {
    newCount = sd.count;              // 오늘 이미 제출 (방어)
  } else {
    newCount = 1;                     // 끊김 → 새로 시작
  }
  return newCount;
}

function commitStreak(count) {
  saveStreakData({count, lastDate: getTodayStr()});
  currentStreak = count;
}

/* ══════════════════════════════
   로그인
══════════════════════════════ */
function login() {
  const no   = document.getElementById("user-no").value.trim();
  const name = document.getElementById("user-name").value.trim();
  if(!no||!name){ alert("번호와 이름을 입력하세요!"); return; }

  // 명단 검증
  const found = STUDENTS.find(s=> String(s.no)===no && s.name===name);
  if(!found){ alert("번호 또는 이름이 명단과 일치하지 않아요 😅"); return; }

  currentNo   = no;
  currentName = name;
  currentStreak = getStreakData().count;

  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("main-page").classList.remove("hidden");

  renderCalendar();
  loadAllData();
}

/* ══════════════════════════════
   급식판 클릭
══════════════════════════════ */
document.querySelectorAll(".food-slot").forEach(slot=>{
  slot.addEventListener("click", ()=>{
    slot.classList.toggle("active");
    updateTotalScore();
  });
});

/* ══════════════════════════════
   미션 버튼
══════════════════════════════ */
function setMission(btn, id, score) {
  missionScores[id] = score;
  btn.parentElement.querySelectorAll(".mission-btn")
     .forEach(b=>b.classList.remove("selected"));
  btn.classList.add("selected");
  updateTotalScore();
}

/* ══════════════════════════════
   총점 계산
══════════════════════════════ */
function updateTotalScore() {
  let s = 0;
  const active = document.querySelectorAll(".food-slot.active");
  s += active.length * 4;
  Object.values(missionScores).forEach(v=>{ s+=v; });
  totalScore = s;
  document.getElementById("total-score").innerText = s+"점";
}

/* ══════════════════════════════
   점수 제출
══════════════════════════════ */
function submitScore() {
  if(hasSubmittedToday()){
    alert("오늘은 이미 제출했어요 😊\n내일 다시 도전해봐요!"); return;
  }

  const today     = new Date().getDate();
  const newStreak = calcStreak();
  const streakBonus = (newStreak % 5 === 0) ? 10 : 0;

  // 레벨/배지 보너스 계산
  const prevCum   = getCumScore();
  const prevLevel = getLevel(prevCum);
  const prevIds   = getBadgeIds();

  let baseScore = totalScore + streakBonus;

  // 임시 누적으로 새 배지/레벨 미리 계산
  const tempCum   = prevCum + baseScore;
  const newBadges = calcNewBadges(tempCum, baseScore, prevIds);
  const newLevel  = getLevel(tempCum);
  const levelUp   = newLevel.name !== prevLevel.name;

  const bonusExtra = (newBadges.length * 50) + (levelUp ? 50 : 0);
  const finalScore = baseScore + bonusExtra;
  const newCum     = prevCum + finalScore;
  const allBadgeIds= [...prevIds, ...newBadges.map(b=>b.id)];

  // 저장
  markSubmittedToday();
  addCumScore(finalScore);
  commitStreak(newStreak);
  saveBadgeIds(allBadgeIds);

  // 달력 발자국
  const targetDay = document.querySelector(`.day[data-day="${today}"]`);
  if(targetDay){
    const pawClass = (newStreak%5===0) ? "gold-paw":"green-paw";
    targetDay.innerHTML = `<div>${today}</div><div class="${pawClass}">🐾</div>`;
  }

  renderLevelBadge(finalScore, newCum);

  // 미션별 점수 분해
  const mealScore = document.querySelectorAll(".food-slot.active").length * 4;
  const todayDate = new Date();

  const payload = {
    date:   `${todayDate.getFullYear()}-${todayDate.getMonth()+1}-${todayDate.getDate()}`,
    no:     currentNo,
    name:   currentName,
    score:  finalScore,
    streak: newStreak,
    badges: allBadgeIds.join(","),
    level:  newLevel.name,
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

  fetch(WEB_APP_URL,{
    method:"POST",
    body:JSON.stringify(payload),
    headers:{"Content-Type":"text/plain"},
  })
  .then(r=>r.json())
  .then(()=>{
    showSubmitPopup(finalScore, streakBonus, bonusExtra, newBadges, levelUp, newLevel, newCum);
  })
  .catch(err=>{
    console.error(err);
    alert("저장 실패! 인터넷 연결을 확인해주세요.");
  });
}

/* ══════════════════════════════
   팝업
══════════════════════════════ */
function showSubmitPopup(score, streakBonus, bonusExtra, newBadges, levelUp, level, cum) {
  const nextLevel = getNextLevel(cum);
  const progress  = nextLevel
    ? Math.min(100,Math.round(((cum-level.minScore)/(nextLevel.minScore-level.minScore))*100))
    : 100;

  let bonusLines = "";
  if(streakBonus>0)
    bonusLines += `<div class="popup-bonus">🔥 연속 5일 달성! +${streakBonus}점</div>`;
  if(levelUp)
    bonusLines += `<div class="popup-bonus" style="border-color:#43a047;color:#2e7d32">🎉 레벨업! +50점</div>`;
  if(newBadges.length>0)
    bonusLines += `<div class="popup-bonus" style="border-color:#7b1fa2;color:#7b1fa2">🏅 새 배지 ${newBadges.length}개 획득! +${newBadges.length*50}점</div>`;

  const badgesHTML = newBadges.length>0
    ? `<div class="popup-new-badges">
        ${newBadges.map(b=>`<span class="badge-chip">${b.emoji} ${b.name}</span>`).join("")}
       </div>` : "";

  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
    <div class="popup-box">
      <div class="bear">🐻‍❄️</div>
      <h2>빙하가 지켜졌어요!</h2>
      <p class="popup-text">${score}점의 노력으로<br>해수면이 0.0001cm 낮아졌어요!</p>
      ${bonusLines}
      ${badgesHTML}
      <div class="popup-level">
        <span class="level-emoji">${level.emoji}</span>
        <span class="level-name">${level.name}</span>
        ${nextLevel
          ? `<div class="popup-progress-bar"><div class="popup-progress-fill" style="width:${progress}%"></div></div>
             <p class="popup-progress-text">다음 레벨까지 ${nextLevel.minScore-cum}점</p>`
          : `<p style="color:#43a047;font-weight:bold;margin:4px 0">🎊 최고 레벨 달성!</p>`}
      </div>
      <button onclick="goClassPage()">학급 현황판 보기</button>
    </div>`;
  document.body.appendChild(popup);
}

function closePopup(){
  const p=document.querySelector(".popup"); if(p) p.remove();
}

/* ══════════════════════════════
   레벨 & 배지 렌더링
══════════════════════════════ */
function renderLevelBadge(todayScore=0, overrideCum=null) {
  const cum     = overrideCum!==null ? overrideCum : getCumScore();
  const level   = getLevel(cum);
  const nextLv  = getNextLevel(cum);
  const earnedIds = getBadgeIds();
  const progress= nextLv && nextLv.minScore>level.minScore
    ? Math.min(100,Math.round(((cum-level.minScore)/(nextLv.minScore-level.minScore))*100))
    : 100;

  const el = document.getElementById("level-section");
  if(!el) return;

  el.innerHTML = `
    <div class="level-display">
      <div class="level-icon">${level.emoji}</div>
      <div class="level-info">
        <div class="level-title">${level.name}</div>
        <div class="level-cumulative">누적 ${cum}점</div>
        ${nextLv
          ? `<div class="progress-wrap">
               <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
               <div class="progress-label">다음 레벨 ${nextLv.name}까지 ${nextLv.minScore-cum}점</div>
             </div>`
          : `<div class="progress-label" style="color:#43a047;font-weight:bold">🎊 최고 레벨 달성!</div>`}
      </div>
    </div>

    <div class="badge-grid">
      ${BADGES.map(b=>{
        const got = earnedIds.includes(b.id);
        return `<div class="badge-item ${got?"badge-earned":"badge-locked"}">
          <div class="badge-emoji">${got?b.emoji:"🔒"}</div>
          <div class="badge-name">${b.short}</div>
          <div class="badge-desc">${b.desc}</div>
        </div>`;
      }).join("")}
    </div>

    <div class="level-ladder">
      ${LEVELS.map(l=>{
        const active = l.name===level.name;
        const done   = cum>=l.minScore;
        return `<div class="ladder-step ${active?"ladder-active":done?"ladder-done":""}">
          <span>${l.emoji}</span>
          <span class="ladder-name">${l.name}</span>
          <span class="ladder-score">${l.minScore}점~</span>
        </div>`;
      }).join("")}
    </div>`;
}

/* ══════════════════════════════
   달력 (월 이동 가능)
══════════════════════════════ */
function renderCalendar() {
  const calTitle = document.getElementById("cal-title");
  const grid     = document.getElementById("calendar-grid");
  if(!grid) return;

  calTitle.textContent = `${calViewYear}년 ${calViewMonth+1}월`;
  grid.innerHTML = "";

  ["일","월","화","수","목","금","토"].forEach(d=>{
    grid.innerHTML += `<div class="week-name">${d}</div>`;
  });

  const firstDay = new Date(calViewYear, calViewMonth, 1).getDay();
  const lastDate = new Date(calViewYear, calViewMonth+1, 0).getDate();

  for(let i=0;i<firstDay;i++) grid.innerHTML += "<div></div>";
  for(let d=1;d<=lastDate;d++){
    grid.innerHTML += `<div class="day" data-day="${d}" data-year="${calViewYear}" data-month="${calViewMonth+1}">${d}</div>`;
  }

  // 서버 데이터 있으면 즉시 발자국 표시
  if(allServerData.length>0) markCalendarPaws();
  // 개인 분석도 갱신
  renderMissionAnalysis();
}

function prevMonth(){
  calViewMonth--;
  if(calViewMonth<0){ calViewMonth=11; calViewYear--; }
  renderCalendar();
}
function nextMonth(){
  calViewMonth++;
  if(calViewMonth>11){ calViewMonth=0; calViewYear++; }
  renderCalendar();
}

/* 발자국 표시 — 연속 5일째마다 금색 */
function markCalendarPaws() {
  const myRecords = allServerData
    .filter(r=>Number(r.no)===Number(currentNo))
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  // 전체 streak 순서 재계산 (연속 판단)
  const streakOrder = [];
  for(let i=0;i<myRecords.length;i++){
    if(i===0){
      streakOrder.push(1);
    } else {
      const prev = new Date(myRecords[i-1].date.split("T")[0]);
      const curr = new Date(myRecords[i].date.split("T")[0]);
      const diff = Math.round((curr-prev)/(1000*60*60*24));
      streakOrder.push(diff===1 ? streakOrder[i-1]+1 : 1);
    }
  }

  myRecords.forEach((rec,idx)=>{
    const ds    = rec.date.split("T")[0];
    const parts = ds.split("-");
    const y=Number(parts[0]), m=Number(parts[1]), d=Number(parts[2]);
    if(y!==calViewYear || m!==calViewMonth+1) return;

    const streak  = streakOrder[idx];
    const pawClass= (streak%5===0) ? "gold-paw":"green-paw";
    const target  = document.querySelector(`.day[data-day="${d}"]`);
    if(target) target.innerHTML=`<div>${d}</div><div class="${pawClass}">🐾</div>`;
  });
}

/* ══════════════════════════════
   개인 미션 분석 (잘한/못한 항목)
══════════════════════════════ */
function renderMissionAnalysis() {
  const el = document.getElementById("mission-analysis");
  if(!el) return;

  // 현재 보고 있는 달 기준
  const myRecords = allServerData.filter(r=>{
    const ds=r.date.split("T")[0];
    const parts=ds.split("-");
    return Number(r.no)===Number(currentNo)
      && Number(parts[0])===calViewYear
      && Number(parts[1])===calViewMonth+1;
  });

  if(myRecords.length===0){
    el.innerHTML=`<p class="analysis-empty">아직 이번 달 기록이 없어요 🌱</p>`;
    return;
  }

  // 항목별 합산 (m_meal, m1~m8)
  const keys  = ["m_meal","m1","m2","m3","m4","m5","m6","m7","m8"];
  const sums  = {};
  const counts= {};
  keys.forEach(k=>{ sums[k]=0; counts[k]=0; });

  myRecords.forEach(r=>{
    keys.forEach(k=>{
      const v=Number(r[k]||0);
      sums[k]+=v;
      if(v>0) counts[k]++;
    });
  });

  // 평균
  const avgs = keys.map((k,i)=>({
    key:k, name:MISSION_NAMES[i],
    avg: myRecords.length>0 ? sums[k]/myRecords.length : 0,
  }));

  avgs.sort((a,b)=>b.avg-a.avg);
  const best  = avgs[0];
  const worst = avgs[avgs.length-1];

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
   개인 그래프 (해당 월 전체 날짜)
══════════════════════════════ */
async function renderGraph() {
  const container = document.getElementById("score-chart-container");
  if(!container) return;

  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const lastDate = new Date(year, month+1, 0).getDate();

  // 해당 월 1일~말일 라벨
  const labels = Array.from({length:lastDate},(_,i)=>`${month+1}/${i+1}`);

  // 내 기록을 날짜별 점수로 매핑
  const scoreMap = {};
  allServerData
    .filter(r=>Number(r.no)===Number(currentNo))
    .forEach(r=>{
      const ds=r.date.split("T")[0];
      const parts=ds.split("-");
      if(Number(parts[0])===year && Number(parts[1])===month+1){
        scoreMap[Number(parts[2])] = Number(r.score||0);
      }
    });

  const scores = labels.map((_,i)=> scoreMap[i+1]!==undefined ? scoreMap[i+1] : null);
  const hasData = scores.some(s=>s!==null);

  if(!hasData){
    container.innerHTML=`<p style="text-align:center;color:#888;padding:40px 0">아직 이번 달 기록이 없어요 🌱</p>`;
    return;
  }

  container.innerHTML=`
    <div style="position:relative;width:100%;height:220px;">
      <canvas id="myScoreChart" role="img" aria-label="이번 달 환경 점수 그래프"></canvas>
    </div>`;

  if(!window.Chart){
    await new Promise((res,rej)=>{
      const s=document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      s.onload=res; s.onerror=rej;
      document.head.appendChild(s);
    });
  }

  if(scoreChart){ scoreChart.destroy(); scoreChart=null; }

  scoreChart = new Chart(document.getElementById("myScoreChart"),{
    type:"bar",
    data:{
      labels,
      datasets:[{
        label:"점수",
        data:scores,
        backgroundColor: scores.map(s=>
          s===null?"transparent": s>=80?"rgba(251,192,45,0.8)":"rgba(67,160,71,0.7)"
        ),
        borderColor: scores.map(s=>
          s===null?"transparent": s>=80?"#f57f17":"#2e7d32"
        ),
        borderWidth:1.5,
        borderRadius:4,
      }],
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:ctx=>ctx.parsed.y!==null?`${ctx.parsed.y}점`:"미제출"}},
      },
      scales:{
        y:{beginAtZero:true, max:110,
           ticks:{callback:v=>v+"점", font:{size:11}},
           grid:{color:"rgba(0,0,0,0.05)"}},
        x:{ticks:{font:{size:9}, autoSkip:true, maxRotation:45},
           grid:{display:false}},
      },
    },
  });
}

/* ══════════════════════════════
   전체 데이터 불러오기
══════════════════════════════ */
async function loadAllData() {
  try{
    const res  = await fetch(WEB_APP_URL);
    allServerData = await res.json();
    markCalendarPaws();
    renderGraph();
    renderLevelBadge();
    renderMissionAnalysis();
  } catch(e){
    console.error("데이터 로드 실패",e);
  }
}

/* ══════════════════════════════
   현황판 이동
══════════════════════════════ */
function goClassPage(){
  closePopup();
  document.getElementById("main-page").classList.add("hidden");
  document.getElementById("class-page").classList.remove("hidden");
  loadClassRanking();
}
function backToMain(){
  document.getElementById("class-page").classList.add("hidden");
  document.getElementById("main-page").classList.remove("hidden");
}

/* ══════════════════════════════
   학급 현황판
══════════════════════════════ */
async function loadClassRanking(){
  const rankingEl = document.getElementById("ranking-list");
  rankingEl.innerHTML = "불러오는 중...";

  try{
    const res  = await fetch(WEB_APP_URL);
    const data = await res.json();

    // 이번 달 기간
    const now   = new Date();
    const y     = now.getFullYear();
    const m     = now.getMonth()+1;

    // 학생별 집계 (이번 달 누적)
    const monthlyMap = {}; // name -> {score, missionSums}
    const totalMap   = {}; // name -> 전체 누적
    const levelMap   = {}; // name -> level (최신)
    const badgeMap   = {}; // name -> badge ids
    const mKeys = ["m_meal","m1","m2","m3","m4","m5","m6","m7","m8"];

    STUDENTS.forEach(s=>{
      monthlyMap[s.name]={score:0, ms:Array(9).fill(0)};
      totalMap[s.name]=0;
    });

    data.forEach(r=>{
      const nm = r.name;
      if(!monthlyMap[nm]) return;

      const ds=String(r.date).split("T")[0];
      const parts=ds.split("-");
      const ry=Number(parts[0]), rm=Number(parts[1]);

      // 전체 누적
      totalMap[nm] = (totalMap[nm]||0) + Number(r.score||0);
      levelMap[nm] = r.level || "";
      if(r.badges) badgeMap[nm] = r.badges;

      // 이번 달
      if(ry===y && rm===m){
        monthlyMap[nm].score += Number(r.score||0);
        mKeys.forEach((k,i)=>{
          monthlyMap[nm].ms[i] += Number(r[k]||0);
        });
      }
    });

    // 이번 달 순위
    const monthlyRanking = STUDENTS
      .map(s=>({...s, score:monthlyMap[s.name].score}))
      .sort((a,b)=>b.score-a.score);

    // 항목별 1위 (이번 달)
    const missionWinners = mKeys.map((k,i)=>{
      let best={name:"-", score:-1};
      STUDENTS.forEach(s=>{
        const v=monthlyMap[s.name].ms[i];
        if(v>best.score) best={name:s.name, score:v};
      });
      return {missionName:MISSION_NAMES[i], ...best};
    });

    // 렌더링
    buildClassPage(monthlyRanking, missionWinners, totalMap, levelMap, badgeMap);

  } catch(e){
    console.error(e);
    rankingEl.innerHTML="<p>불러오기 실패 😢</p>";
  }
}

function buildClassPage(monthlyRanking, missionWinners, totalMap, levelMap, badgeMap){
  // 1~3위
  const top3 = monthlyRanking.slice(0,3);
  const medals=["🥇","🥈","🥉"];

  let topHtml=`<div class="class-section-title">🏆 이번 달 TOP 3</div>`;
  top3.forEach((s,i)=>{
    topHtml+=`
      <div class="ranking-item ${s.name===currentName?"ranking-me":""}">
        <span class="rank-medal">${medals[i]}</span>
        <span class="rank-name">${s.name}${s.name===currentName?" (나)":""}</span>
        <span class="rank-score">${s.score}점</span>
      </div>`;
  });
  document.getElementById("top3-section").innerHTML=topHtml;

  // 항목별 1위
  let mwHtml=`<div class="class-section-title">⭐ 이번 달 항목별 1위</div><div class="mission-winner-grid">`;
  missionWinners.forEach(w=>{
    mwHtml+=`
      <div class="mission-winner-card">
        <div class="mw-mission">${w.missionName}</div>
        <div class="mw-name">${w.name}</div>
        <div class="mw-score">${w.score}점</div>
      </div>`;
  });
  mwHtml+="</div>";
  document.getElementById("mission-winner-section").innerHTML=mwHtml;

  // 전체 명단 (28명)
  let listHtml=`<div class="class-section-title">📋 우리 반 전체 명단</div>`;
  monthlyRanking.forEach((s,i)=>{
    const lv    = getLevel(totalMap[s.name]||0);
    const bids  = badgeMap[s.name] ? badgeMap[s.name].split(",") : [];
    const earned= BADGES.filter(b=>bids.includes(b.id));
    const isMe  = s.name===currentName;
    listHtml+=`
      <div class="student-row ${isMe?"student-me":""}">
        <span class="student-rank">${i+1}</span>
        <span class="student-name">${s.name}${isMe?" (나)":""}</span>
        <span class="student-level">${lv.emoji} ${lv.name}</span>
        <span class="student-badges">${earned.map(b=>b.emoji).join(" ")||"-"}</span>
        <span class="student-score">${s.score}점</span>
      </div>`;
  });
  document.getElementById("ranking-list").innerHTML=listHtml;

  // 학급 누적 그래프
  renderClassChart(monthlyRanking);

  // 룰 안내
  document.getElementById("rules-section").innerHTML=`
    <div class="class-section-title">📖 점수 규칙 안내</div>
    <div class="rules-box">
      <div class="rule-item">🍱 급식 다 먹기 — 칸마다 <b>+4점</b> (최대 5칸 = 20점)</div>
      <div class="rule-item">🌎 환경 미션 — ❌ 0점 / 🔺 5점 / ⭕ 10점 (8개 미션)</div>
      <div class="rule-item">🔥 5일 연속 달성 — <b>+10점 보너스</b> (중간에 하루라도 빠지면 초기화!)</div>
      <div class="rule-item">🎉 레벨업 시 — <b>+50점 보너스</b></div>
      <div class="rule-item">🏅 배지 획득 시 — <b>배지 1개당 +50점 보너스</b></div>
      <div class="rule-item rule-levels">
        <b>레벨 기준</b><br>
        🌱 씨앗 지킴이 0점~ &nbsp;|&nbsp;
        🌿 새싹 지킴이 300점~ &nbsp;|&nbsp;
        🌳 나무 지킴이 1000점~ &nbsp;|&nbsp;
        🌲 숲 지킴이 3000점~ &nbsp;|&nbsp;
        🌍 지구 지킴이 6000점~
      </div>
      <div class="rule-item rule-levels">
        <b>배지 기준</b><br>
        💯 완벽한 하루(100점) &nbsp;|&nbsp;
        🥉 누적 1000점 &nbsp;|&nbsp;
        🥈 2500점 &nbsp;|&nbsp;
        🥇 5000점 &nbsp;|&nbsp;
        🏆 7500점 &nbsp;|&nbsp;
        👑 10000점
      </div>
    </div>`;
}

/* ══════════════════════════════
   학급 전체 누적 그래프
══════════════════════════════ */
async function renderClassChart(monthlyRanking) {
  const container = document.getElementById("class-chart-container");
  if(!container) return;

  const labels = monthlyRanking.map(s=>s.name);
  const scores = monthlyRanking.map(s=>s.score);

  container.innerHTML=`
    <div class="class-section-title">📊 이번 달 누적 점수 그래프</div>
    <div style="position:relative;width:100%;height:${Math.max(300, labels.length*32)}px;">
      <canvas id="classChart" role="img" aria-label="학급 이번 달 누적 점수"></canvas>
    </div>`;

  if(!window.Chart){
    await new Promise((res,rej)=>{
      const s=document.createElement("script");
      s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      s.onload=res; s.onerror=rej;
      document.head.appendChild(s);
    });
  }

  if(classChart){ classChart.destroy(); classChart=null; }

  const colors = scores.map(s=>
    s>=100?"rgba(251,192,45,0.8)":"rgba(67,160,71,0.7)"
  );

  classChart = new Chart(document.getElementById("classChart"),{
    type:"bar",
    data:{
      labels,
      datasets:[{
        label:"이번 달 점수",
        data:scores,
        backgroundColor:colors,
        borderColor:colors.map(c=>c.replace("0.8","1").replace("0.7","1")),
        borderWidth:1,
        borderRadius:4,
      }],
    },
    options:{
      indexAxis:"y",
      responsive:true,
      maintainAspectRatio:false,
      plugins:{legend:{display:false},
        tooltip:{callbacks:{label:ctx=>`${ctx.parsed.x}점`}}},
      scales:{
        x:{beginAtZero:true,
           ticks:{callback:v=>v+"점", font:{size:11}},
           grid:{color:"rgba(0,0,0,0.05)"}},
        y:{ticks:{font:{size:12}}, grid:{display:false}},
      },
    },
  });
}

/* ══════════════════════════════
   window.onload
══════════════════════════════ */
window.onload = function(){
  document.getElementById("login-btn").addEventListener("click", login);
};
