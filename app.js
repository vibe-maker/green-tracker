
/* =========================
기본 데이터
========================= */

let currentUser = null;
let selectedScores = {};
let classData = [];
let todaySaved = false;

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzkHeM_7ntBjutO-NiRMhKlk5zZvWOee7v1Q7j1fJe1N_ADRXVKYy3RhpZDCvNdBO5Tjg/exec";

/* =========================
로그인
========================= */

document.getElementById("login-btn").addEventListener("click", login);

function login(){

  const no = document.getElementById("user-no").value.trim();
  const name = document.getElementById("user-name").value.trim();

  if(!no || !name){
    alert("번호(00)와 이름(김초록)을 입력하세요!");
    return;
  }

  currentUser = {
    no,
    name
  };

  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("main-page").classList.remove("hidden");

  renderMissions();
  setupMealTray();
  renderCalendar();
  renderTracker();
  renderBestWorst();
  loadClassData();

}

/* =========================
급식판
========================= */

function setupMealTray(){

  const slots = document.querySelectorAll(".food-slot");

  slots.forEach(slot=>{

    slot.addEventListener("click", ()=>{

      slot.classList.toggle("eaten");

      calculateTotal();

    });

  });

}

function calculateMealScore(){

  const eatenCount = document.querySelectorAll(".food-slot.eaten").length;

  return eatenCount * 4;

}

/* =========================
미션
========================= */

function renderMissions(){

  const container = document.getElementById("mission-container");

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

  document.getElementById("total-score").innerText = total + "점";

  const meal = calculateMealScore();

  document.getElementById("meal-score").innerText =
  `급식 점수 : ${meal}점 / 20점`;

  return total;

}

/* =========================
저장
========================= */

const saveBtn = document.querySelector(".save-btn");

saveBtn.addEventListener("click", saveToday);

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

  const dateStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;

  const payload = {
    date: dateStr,
    no: currentUser.no,
    name: currentUser.name,
    score: total
  };

  try{

    const response = await fetch(WEB_APP_URL, {
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

    alert("저장 실패!\n웹앱 URL 확인 필요");

  }

}

/* =========================
결과 팝업
========================= */

function showResultPopup(score){

  const type = Math.floor(Math.random()*3);

  let title = "";
  let value = "";
  let emoji = "";

  if(type === 0){
    title = "🌳 나무 성장";
    value = "+0.4cm";
    emoji = "🌳";
  }

  if(type === 1){
    title = "🌊 해수면 감소";
    value = "-0.02cm";
    emoji = "🐻‍❄️";
  }

  if(type === 2){
    title = "🌡️ 지구온도 감소";
    value = "-0.001℃";
    emoji = "🌎";
  }

  const popup = document.createElement("div");

  popup.className = "result-popup";

  popup.innerHTML = `

  <div class="popup-box">

    <div class="popup-emoji">${emoji}</div>

    <h2>${title}</h2>

    <div class="popup-value">
      ${value}
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

  const popup = document.querySelector(".result-popup");

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

      <h2>전체 누적 점수</h2>

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

    <button onclick="backToMain()">
      마이페이지로 돌아가기
    </button>

  </div>

  `;

  document.body.innerHTML = html;

}

function backToMain(){
  location.reload();
}

/* =========================
구글시트 불러오기
========================= */

async function loadClassData(){

  try{

    const response = await fetch(WEB_APP_URL);

    classData = await response.json();

    console.log(classData);

  }catch(error){

    console.error(error);

  }

}

/* =========================
달력
========================= */

function renderCalendar(){

  const old = document.getElementById("calendar-card");

  if(old){
    old.remove();
  }

  const card = document.createElement("div");

  card.className = "card";
  card.id = "calendar-card";

  card.innerHTML = `

  <h2>📅 나의 환경 달력</h2>

  <div class="calendar-grid">

    <div>일</div>
    <div>월</div>
    <div>화</div>
    <div>수</div>
    <div>목</div>
    <div>금</div>
    <div>토</div>

  </div>

  `;

  document.getElementById("main-page").appendChild(card);

}

/* =========================
그래프
========================= */

function renderTracker(){

  const card = document.createElement("div");

  card.className = "card";

  card.innerHTML = `

  <h2>📈 이번 달 점수 변화</h2>

  <div style="height:200px;display:flex;align-items:center;justify-content:center;color:#999;">
  그래프 준비중
  </div>

  `;

  document.getElementById("main-page").appendChild(card);

}

/* =========================
잘한 항목
========================= */

function renderBestWorst(){

  const card = document.createElement("div");

  card.className = "card";

  card.innerHTML = `

  <h2>🌟 이번 달 환경 분석</h2>

  <div style="margin-bottom:15px;">
  👍 가장 잘 지킨 행동 : 전기 절약
  </div>

  <div>
  📌 더 노력하면 좋은 행동 : 재활용
  </div>

  `;

  document.getElementById("main-page").appendChild(card);

}

```
