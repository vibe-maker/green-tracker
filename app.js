/* =========================
기본 데이터
========================= */

let currentUser = null;
let selectedScores = {};
let classData = [];
let todaySaved = false;

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbzkHeM_7ntBjutO-NiRMhKlk5zZvWOee7v1Q7j1fJe1N_ADRXVKYy3RhpZDCvNdBO5Tjg/exec";

/* =========================
로그인
========================= */

function login(){

  const no =
  document.getElementById("user-no").value.trim();

  const name =
  document.getElementById("user-name").value.trim();

  if(!no || !name){

    alert("번호와 이름을 입력하세요!");
    return;

  }

  currentUser = {
    no,
    name
  };

  document
  .getElementById("login-page")
  .classList.add("hidden");

  document
  .getElementById("main-page")
  .classList.remove("hidden");

  renderMissions();
  setupMealTray();
  calculateTotal();


  renderCalendar();
  renderTracker();
  renderBestWorst();

  loadClassData();

  calculateTotal();

}

/* =========================
급식판
========================= */

function setupMealTray(){

  const slots =
  document.querySelectorAll(".food-slot");

  slots.forEach(slot=>{

    slot.addEventListener("click", ()=>{

      slot.classList.toggle("eaten");

      calculateTotal();

    });

  });

}

function calculateMealScore(){

  const eatenCount =
  document.querySelectorAll(".food-slot.eaten").length;

  return eatenCount * 4;

}

/* =========================
미션
========================= */

function renderMissions(){

  const container =
  document.getElementById("mission-container");

  container.innerHTML = "";

  missions.forEach(m=>{

    container.innerHTML += `

    <div class="mission-card">

      <div class="mission-top">

        <div class="mission-icon">
          ${m.icon}
        </div>

        <div class="mission-title">
          ${m.title}
        </div>

      </div>

      <div class="mission-buttons">

        <button class="mission-btn"
        onclick="setMissionScore(${m.id},0,this)">
        ❌
        </button>

        <button class="mission-btn"
        onclick="setMissionScore(${m.id},5,this)">
        🔺
        </button>

        <button class="mission-btn"
        onclick="setMissionScore(${m.id},10,this)">
        ⭕
        </button>

      </div>

    </div>

    `;

  });

}

function setMissionScore(id, score, btn){

  selectedScores[id] = score;

  const parent = btn.parentElement;

  parent.querySelectorAll("button").forEach(b=>{

    b.classList.remove("selected-btn");

  });

  btn.classList.add("selected-btn");

  calculateTotal();

}

/* =========================
점수 계산
========================= */

function calculateTotal(){

  let total = calculateMealScore();

  Object.values(selectedScores).forEach(score=>{

    total += score;

  });

  document.getElementById("total-score").innerText =
  total + "점";

  document.getElementById("meal-score").innerText =
  `급식 점수 : ${calculateMealScore()}점 / 20점`;

  return total;

}

/* =========================
저장
========================= */

async function saveToday(){

  if(todaySaved){

    alert("오늘은 이미 저장했어요 😊");
    return;

  }

  if(Object.keys(selectedScores).length < 8){

    alert("모든 미션을 체크해주세요!");
    return;

  }

  const total = calculateTotal();

  const today = new Date();

  const dateStr =
  `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const payload = {

    date: dateStr,
    no: currentUser.no,
    name: currentUser.name,
    score: total

  };

  try{

    const response = await fetch(WEB_APP_URL,{

      method:"POST",
      body:JSON.stringify(payload),
      headers:{
        "Content-Type":"text/plain"
      }

    });

    const result = await response.text();

    console.log(result);

    todaySaved = true;

    showResultPopup(total);

    loadClassData();

  }catch(error){

    console.error(error);

    alert("저장 실패!");

  }

}

/* =========================
팝업
========================= */

function showResultPopup(score){

  const popup =
  document.createElement("div");

  popup.className = "result-popup";

  popup.innerHTML = `

  <div class="popup-box">

    <div class="popup-emoji">
      🌍
    </div>

    <h2>
      지구가 건강해졌어요!
    </h2>

    <div class="popup-value">
      🌳 나무 성장 +0.4cm
    </div>

    <div class="popup-score2">
      내 점수 ${score}점
    </div>

    <button onclick="goDashboard()">
      우리 반 현황 보기
    </button>

  </div>

  `;

  document.body.appendChild(popup);

}

/* =========================
현황판
========================= */

function goDashboard(){

  const popup =
  document.querySelector(".result-popup");

  if(popup){
    popup.remove();
  }

  renderDashboard();

}

function renderDashboard(){

  let html = `

  <div class="dashboard-page">

    <h1>🏆 우리 반 환경 현황판</h1>

    <div class="card">

      <table class="rank-table">

        <tr>
          <th>번호</th>
          <th>이름</th>
          <th>점수</th>
        </tr>

  `;

  classData.forEach(s=>{

    html += `

    <tr>

      <td>${s.no}</td>
      <td>${s.name}</td>
      <td>${s.score}</td>

    </tr>

    `;

  });

  html += `

      </table>

    </div>

    <button onclick="location.reload()">
      마이페이지로 돌아가기
    </button>

  </div>

  `;

  document.body.innerHTML = html;

}

/* =========================
시트 불러오기
========================= */

async function loadClassData(){

  try{

    const response =
    await fetch(WEB_APP_URL);

    classData =
    await response.json();

    console.log(classData);

  }catch(error){

    console.error(error);

  }

}

/* =========================
달력
========================= */

/* =========================
MISSION BUTTON
========================= */

.mission-buttons{
display:flex;
gap:10px;
margin-top:12px;
}

.mission-btn{
flex:1;
padding:12px;
border:none;
border-radius:14px;
background:#e0e0e0;
font-size:20px;
cursor:pointer;
transition:0.2s;
}

.mission-btn:hover{
transform:scale(1.03);
}

.selected-btn{
background:#43a047;
color:white;
font-weight:bold;
}

/* =========================
CALENDAR
========================= */

function renderCalendar(){
  if(old){
    old.remove();
  }

  const card = document.createElement("div");

  card.className = "card";
  card.id = "calendar-card";

  const now = new Date();

  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  let html = `

  <h2>📅 나의 환경 달력</h2>

  <div class="calendar-wrap">

    <div class="calendar-week">
      <div>일</div>
      <div>월</div>
      <div>화</div>
      <div>수</div>
      <div>목</div>
      <div>금</div>
      <div>토</div>
    </div>

    <div class="calendar-grid">
  `;

  for(let i=0;i<firstDay;i++){
    html += `<div></div>`;
  }

  for(let d=1; d<=lastDate; d++){

    let stamp = "";
    let bonus = "";

    if(d % 5 === 0){
      stamp = "🐾";
      bonus = `<div class="gold-plus">+10</div>`;
    }else if(d < now.getDate()){
      stamp = "🐾";
    }

    html += `

    <div class="calendar-day">

      <div class="day-number">${d}</div>

      <div class="day-stamp">${stamp}</div>

      ${bonus}

    </div>

    `;

  }

  html += `
    </div>
  </div>
  `;

  card.innerHTML = html;

  document.getElementById("main-page").appendChild(card);

}

/* =========================
그래프
========================= */

function renderTracker(){

  const oldCards = document.querySelectorAll(".tracker-card");

  oldCards.forEach(c=>c.remove());

  const card = document.createElement("div");

  card.className = "card tracker-card";

  const scores = [70,82,65,90,75,88,95];

  let bars = "";

  scores.forEach(score=>{

    bars += `

    <div class="graph-bar"
    style="height:${score * 1.5}px">

      <div class="graph-score">
      ${score}
      </div>

    </div>

    `;

  });

  card.innerHTML = `

  <h2>📈 이번 달 점수 변화</h2>

  <div class="graph-box">
    ${bars}
  </div>

  `;

  document.getElementById("main-page").appendChild(card);

}

/* =========================
환경 분석
========================= */

function renderBestWorst(){

  const oldCards = document.querySelectorAll(".analysis-card");

  oldCards.forEach(c=>c.remove());

  const card = document.createElement("div");

  card.className = "card analysis-card";

  card.innerHTML = `

  <h2>🌱 이번 달 반성</h2>

  <div class="analysis-item">

  👍 가장 잘 지킨 행동<br>
  안 쓰는 전기기구 플러그 뽑기

  </div>

  <div class="analysis-item">

  📌 더 노력하면 좋은 행동<br>
  우유 마시고 우유팩 씻어 말리기

  </div>

  `;

  document.getElementById("main-page").appendChild(card);

}

/* =========================
초기 실행
========================= */

window.onload = function(){

  const loginBtn =
  document.getElementById("login-btn");

  if(loginBtn){

    loginBtn.addEventListener("click", login);

  }

  const saveBtn =
  document.querySelector(".save-btn");

  if(saveBtn){

    saveBtn.addEventListener("click", saveToday);

  }

};
