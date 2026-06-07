/* =========================
기본 데이터
========================= */

let totalScore = 0;
let savedDays = [];
const missionScores = {};
let currentStreak = 0;
let currentNo = "";
let currentName = "";

const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzh-XqLW1rCkOfzj_arB6xP9EHUkql9uKjbJwP6H8F1QLpl0QJSH1nMSeGUT9VDUW6eiA/exec";

/* =========================
레벨 시스템
========================= */

const LEVELS = [
  { name: "씨앗 지킴이",   emoji: "🌱", minScore: 0   },
  { name: "새싹 지킴이",   emoji: "🌿", minScore: 50  },
  { name: "나무 지킴이",   emoji: "🌳", minScore: 150 },
  { name: "숲 지킴이",     emoji: "🌲", minScore: 300 },
  { name: "지구 수호자",   emoji: "🌍", minScore: 500 },
];

const BADGES = [
  { id: "first",    name: "첫 발걸음",   emoji: "👣", desc: "첫 점수 제출",       condition: (streak, cum) => cum > 0 },
  { id: "streak3",  name: "3일 연속",    emoji: "🔥", desc: "3일 연속 실천",      condition: (streak) => streak >= 3 },
  { id: "streak5",  name: "5일 연속",    emoji: "⭐", desc: "5일 연속 달성",      condition: (streak) => streak >= 5 },
  { id: "perfect",  name: "완벽한 하루", emoji: "💯", desc: "하루 100점 달성",    condition: (streak, cum, score) => score >= 100 },
  { id: "eco100",   name: "환경 영웅",   emoji: "🦸", desc: "누적 100점 돌파",   condition: (streak, cum) => cum >= 100 },
  { id: "eco300",   name: "지구 수호자", emoji: "🌍", desc: "누적 300점 돌파",   condition: (streak, cum) => cum >= 300 },
];

function getLevel(cumulativeScore) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (cumulativeScore >= l.minScore) level = l;
  }
  return level;
}

function getNextLevel(cumulativeScore) {
  for (const l of LEVELS) {
    if (cumulativeScore < l.minScore) return l;
  }
  return null;
}

function getEarnedBadges(streak, cumulativeScore, todayScore) {
  return BADGES.filter(b => b.condition(streak, cumulativeScore, todayScore));
}

/* =========================
localStorage 유틸
========================= */

function getStorageKey(suffix) {
  return `eco_${currentNo}_${currentName}_${suffix}`;
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function hasSubmittedToday() {
  return localStorage.getItem(getStorageKey("lastSubmit")) === getTodayString();
}

function markSubmittedToday() {
  localStorage.setItem(getStorageKey("lastSubmit"), getTodayString());
}

function getCumulativeScore() {
  return Number(localStorage.getItem(getStorageKey("cumScore")) || 0);
}

function addCumulativeScore(score) {
  const current = getCumulativeScore();
  localStorage.setItem(getStorageKey("cumScore"), current + score);
  return current + score;
}

function getEarnedBadgeIds() {
  const raw = localStorage.getItem(getStorageKey("badges"));
  return raw ? JSON.parse(raw) : [];
}

function saveEarnedBadgeIds(ids) {
  localStorage.setItem(getStorageKey("badges"), JSON.stringify(ids));
}

/* =========================
로그인
========================= */

function login() {
  const no   = document.getElementById("user-no").value.trim();
  const name = document.getElementById("user-name").value.trim();

  if (!no || !name) {
    alert("번호와 이름을 입력하세요!");
    return;
  }

  currentNo   = no;
  currentName = name;

  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("main-page").classList.remove("hidden");

  renderCalendar();
  loadCalendarData();
  renderLevelBadge();
}

/* =========================
급식판
========================= */

const foodSlots = document.querySelectorAll(".food-slot");

foodSlots.forEach(slot => {
  slot.addEventListener("click", () => {
    slot.classList.toggle("active");
    updateTotalScore();
  });
});

/* =========================
미션 버튼
========================= */

function setMission(btn, missionId, score) {
  missionScores[missionId] = score;

  const buttons = btn.parentElement.querySelectorAll(".mission-btn");
  buttons.forEach(b => b.classList.remove("selected"));
  btn.classList.add("selected");

  updateTotalScore();
}

/* =========================
총점 계산
========================= */

function updateTotalScore() {
  let score = 0;

  const activeFoods = document.querySelectorAll(".food-slot.active");
  score += activeFoods.length * 4;

  Object.values(missionScores).forEach(v => { score += v; });

  totalScore = score;
  document.getElementById("total-score").innerText = score + "점";
}

/* =========================
점수 제출
========================= */

function submitScore() {
  if (hasSubmittedToday()) {
    alert("오늘은 이미 제출했어요 😊\n내일 다시 도전해봐요!");
    return;
  }

  const today       = new Date().getDate();
  const todayStr    = getTodayString();

  /* 연속 기록 확인 및 streak 보너스 */
  const newStreak     = currentStreak + 1;
  const streakBonus   = (newStreak % 5 === 0) ? 10 : 0;
  const finalScore    = totalScore + streakBonus;

  /* localStorage 저장 */
  markSubmittedToday();
  const newCumulative = addCumulativeScore(finalScore);
  savedDays.push(today);

  /* 달력 발자국 업데이트 */
  const targetDay = document.querySelector(`.day[data-day="${today}"]`);
  if (targetDay) {
    const pawClass = (newStreak % 5 === 0) ? "gold-paw" : "green-paw";
    targetDay.innerHTML = `<div>${today}</div><div class="${pawClass}">🐾</div>`;
  }

  /* 레벨/배지 업데이트 */
  renderLevelBadge(finalScore, newCumulative);

  /* 서버 전송 */
  const todayDate = new Date();
  const level     = getLevel(newCumulative);

  const earnedIds  = getEarnedBadgeIds();
  const newBadges  = getEarnedBadges(newStreak, newCumulative, finalScore)
    .filter(b => !earnedIds.includes(b.id));
  const allIds     = [...earnedIds, ...newBadges.map(b => b.id)];
  saveEarnedBadgeIds(allIds);

  const payload = {
    date:   `${todayDate.getFullYear()}-${todayDate.getMonth() + 1}-${todayDate.getDate()}`,
    no:     currentNo,
    name:   currentName,
    score:  finalScore,
    streak: newStreak,
    badges: allIds.join(","),
    level:  level.name,
  };

  fetch(WEB_APP_URL, {
    method:  "POST",
    body:    JSON.stringify(payload),
    headers: { "Content-Type": "text/plain" },
  })
    .then(res => res.json())
    .then(() => {
      currentStreak = newStreak;
      showSubmitPopup(finalScore, streakBonus, newBadges, newCumulative);
    })
    .catch(err => {
      console.error(err);
      alert("저장 실패! 인터넷 연결을 확인해주세요.");
    });
}

/* =========================
팝업
========================= */

function showSubmitPopup(score, bonus, newBadges, cumulative) {
  const level     = getLevel(cumulative);
  const nextLevel = getNextLevel(cumulative);
  const progress  = nextLevel
    ? Math.min(100, Math.round(((cumulative - getLevel(cumulative - score).minScore) /
        (nextLevel.minScore - getLevel(cumulative - score).minScore)) * 100))
    : 100;

  const bonusHTML = bonus > 0
    ? `<div class="popup-bonus">🎉 연속 5일 달성! +${bonus}점 보너스!</div>`
    : "";

  const badgesHTML = newBadges.length > 0
    ? `<div class="popup-new-badges">
        <p style="font-size:14px;color:#666;margin-bottom:8px;">새 배지 획득!</p>
        ${newBadges.map(b => `<span class="badge-chip">${b.emoji} ${b.name}</span>`).join("")}
       </div>`
    : "";

  const popup = document.createElement("div");
  popup.className = "popup";
  popup.innerHTML = `
    <div class="popup-box">
      <div class="bear">🐻‍❄️</div>
      <h2>빙하가 지켜졌어요!</h2>
      <p class="popup-text">${score}점의 노력으로<br>해수면이 0.0001cm 낮아졌어요!</p>
      ${bonusHTML}
      ${badgesHTML}
      <div class="popup-level">
        <span class="level-emoji">${level.emoji}</span>
        <span class="level-name">${level.name}</span>
        ${nextLevel ? `<div class="popup-progress-bar"><div class="popup-progress-fill" style="width:${progress}%"></div></div>
        <p class="popup-progress-text">다음 레벨까지 ${nextLevel.minScore - cumulative}점</p>` : `<p style="color:#43a047;font-weight:bold;">최고 레벨 달성! 🎊</p>`}
      </div>
      <button onclick="goClassPage()">학급 현황판 보기</button>
    </div>
  `;
  document.body.appendChild(popup);
}

function closePopup() {
  const popup = document.querySelector(".popup");
  if (popup) popup.remove();
}

/* =========================
레벨 & 배지 렌더링
========================= */

function renderLevelBadge(todayScore = 0, overrideCumulative = null) {
  const cumulative = overrideCumulative !== null ? overrideCumulative : getCumulativeScore();
  const level      = getLevel(cumulative);
  const nextLevel  = getNextLevel(cumulative);
  const earned     = getEarnedBadges(currentStreak, cumulative, todayScore);

  const progress = nextLevel && nextLevel.minScore > level.minScore
    ? Math.min(100, Math.round(((cumulative - level.minScore) / (nextLevel.minScore - level.minScore)) * 100))
    : 100;

  const levelEl = document.getElementById("level-section");
  if (!levelEl) return;

  levelEl.innerHTML = `
    <div class="level-display">
      <div class="level-icon">${level.emoji}</div>
      <div class="level-info">
        <div class="level-title">${level.name}</div>
        <div class="level-cumulative">누적 ${cumulative}점</div>
        ${nextLevel
          ? `<div class="progress-wrap">
               <div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div>
               <div class="progress-label">다음 레벨 ${nextLevel.name} (${nextLevel.minScore}점)까지 ${nextLevel.minScore - cumulative}점</div>
             </div>`
          : `<div class="progress-label" style="color:#43a047;font-weight:bold;">🎊 최고 레벨 달성!</div>`
        }
      </div>
    </div>

    <div class="badge-grid">
      ${BADGES.map(b => {
        const got = earned.some(e => e.id === b.id);
        return `
          <div class="badge-item ${got ? "badge-earned" : "badge-locked"}">
            <div class="badge-emoji">${got ? b.emoji : "🔒"}</div>
            <div class="badge-name">${b.name}</div>
            <div class="badge-desc">${b.desc}</div>
          </div>
        `;
      }).join("")}
    </div>

    <div class="level-ladder">
      ${LEVELS.map(l => {
        const active = l.name === level.name;
        return `<div class="ladder-step ${active ? "ladder-active" : cumulative >= l.minScore ? "ladder-done" : ""}">
          <span>${l.emoji}</span>
          <span class="ladder-name">${l.name}</span>
          <span class="ladder-score">${l.minScore}점~</span>
        </div>`;
      }).join("")}
    </div>
  `;
}

/* =========================
그래프 렌더링 (Chart.js)
========================= */

let scoreChart = null;

async function renderGraph(records) {
  const chartContainer = document.getElementById("score-chart-container");
  if (!chartContainer) return;

  if (!records || records.length === 0) {
    chartContainer.innerHTML = `<p style="text-align:center;color:#888;padding:40px 0">아직 제출한 기록이 없어요 🌱<br>오늘 첫 점수를 제출해봐요!</p>`;
    return;
  }

  /* 날짜순 정렬 후 최근 14일 */
  const sorted = [...records]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14);

  const labels = sorted.map(r => {
    const d = new Date(r.date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });
  const scores = sorted.map(r => Number(r.score || 0));

  chartContainer.innerHTML = `
    <div style="position:relative;width:100%;height:220px;">
      <canvas id="myScoreChart" role="img" aria-label="날짜별 환경 점수 그래프"></canvas>
    </div>
  `;

  /* Chart.js가 아직 없으면 로드 */
  if (!window.Chart) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  if (scoreChart) { scoreChart.destroy(); scoreChart = null; }

  scoreChart = new Chart(document.getElementById("myScoreChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "환경 점수",
        data: scores,
        borderColor: "#43a047",
        backgroundColor: "rgba(67,160,71,0.15)",
        borderWidth: 2.5,
        pointBackgroundColor: scores.map(s => s >= 80 ? "#fbc02d" : "#43a047"),
        pointRadius: 5,
        tension: 0.35,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.parsed.y}점`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 110,
          ticks: { callback: v => v + "점", font: { size: 12 } },
          grid: { color: "rgba(0,0,0,0.06)" },
        },
        x: {
          ticks: { font: { size: 11 }, autoSkip: false, maxRotation: 45 },
          grid: { display: false },
        },
      },
    },
  });
}

/* =========================
달력 생성
========================= */

function renderCalendar() {
  const calendar = document.getElementById("calendar-grid");
  if (!calendar) return;

  calendar.innerHTML = "";

  ["일","월","화","수","목","금","토"].forEach(day => {
    calendar.innerHTML += `<div class="week-name">${day}</div>`;
  });

  const now      = new Date();
  const year     = now.getFullYear();
  const month    = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    calendar.innerHTML += "<div></div>";
  }
  for (let d = 1; d <= lastDate; d++) {
    calendar.innerHTML += `<div class="day" data-day="${d}">${d}</div>`;
  }
}

/* =========================
달력 데이터 불러오기
========================= */

async function loadCalendarData() {
  try {
    const response = await fetch(WEB_APP_URL);
    const data     = await response.json();

    const myRecords = data.filter(r => Number(r.no) === Number(currentNo));

    /* 날짜별 중복 제거 (하루 1개만) */
    const uniqueRecords = [...new Map(
      myRecords.map(item => [item.date.split("T")[0], item])
    ).values()];

    currentStreak = uniqueRecords.length;

    uniqueRecords.forEach((record, index) => {
      const dayNumber  = Number(record.date.split("T")[0].split("-")[2]);
      const streakNum  = index + 1;
      const pawClass   = (streakNum % 5 === 0) ? "gold-paw" : "green-paw";
      const targetDay  = document.querySelector(`.day[data-day="${dayNumber}"]`);

      if (targetDay) {
        targetDay.innerHTML = `<div>${dayNumber}</div><div class="${pawClass}">🐾</div>`;
      }
    });

    /* 그래프 그리기 */
    renderGraph(uniqueRecords);

    /* 레벨/배지 갱신 */
    renderLevelBadge();

  } catch (error) {
    console.error("달력 데이터 로드 실패:", error);
    renderGraph([]);
  }
}

/* =========================
현황판 이동
========================= */

function goClassPage() {
  closePopup();
  document.getElementById("main-page").classList.add("hidden");
  document.getElementById("class-page").classList.remove("hidden");
  loadClassRanking();
}

function backToMain() {
  document.getElementById("class-page").classList.add("hidden");
  document.getElementById("main-page").classList.remove("hidden");
}

/* =========================
학급 현황판
========================= */

async function loadClassRanking() {
  const response = await fetch(WEB_APP_URL);
  const data     = await response.json();

  const studentScores = {};
  data.forEach(record => {
    const name  = record.name;
    const score = Number(record.score || 0);
    if (!studentScores[name]) studentScores[name] = 0;
    studentScores[name] += score;
  });

  const ranking = Object.entries(studentScores).sort((a, b) => b[1] - a[1]);

  const medals = ["🥇", "🥈", "🥉"];
  let html = "";
  ranking.forEach((item, index) => {
    const isMe  = item[0] === currentName;
    const medal = medals[index] || `${index + 1}위`;
    html += `
      <div class="ranking-item ${isMe ? "ranking-me" : ""}">
        <span class="rank-medal">${medal}</span>
        <span class="rank-name">${item[0]}${isMe ? " (나)" : ""}</span>
        <span class="rank-score">${item[1]}점</span>
      </div>
    `;
  });

  document.getElementById("ranking-list").innerHTML = html;
}

/* =========================
로그인 버튼 연결
========================= */

window.onload = function () {
  document.getElementById("login-btn").addEventListener("click", login);
};
