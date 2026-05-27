let currentUser = null;
let selectedScores = {};
let classData = [];

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzkHeM_7ntBjutO-NiRMhKlk5zZvWOee7v1Q7j1fJe1N_ADRXVKYy3RhpZDCvNdBO5Tjg/exec";

/* LOGIN */
document.getElementById("login-btn").addEventListener("click", login);

function login(){

const no = document.getElementById("user-no").value;
const name = document.getElementById("user-name").value;

if(!no || !name){
alert("입력하세요");
return;
}

currentUser = {no,name};

document.getElementById("login-page").classList.add("hidden");
document.getElementById("main-page").classList.remove("hidden");

renderMissions();
setupMeal();
renderCalendar();
renderGraph();
renderAnalysis();
}

/* MEAL */
function setupMeal(){
document.querySelectorAll(".food-slot").forEach(el=>{
el.addEventListener("click", ()=>{
el.classList.toggle("eaten");
updateScore();
});
});
}

/* MISSIONS */
function renderMissions(){
const container = document.getElementById("mission-container");

container.innerHTML = "";

missions.forEach(m=>{
container.innerHTML += `
<div>
  <div>${m.icon} ${m.title}</div>
  <button class="mission-btn" onclick="setScore(${m.id},10,this)">⭕</button>
</div>`;
});
}

function setScore(id,score,btn){
selectedScores[id]=score;

btn.parentNode.querySelectorAll("button").forEach(b=>{
b.classList.remove("selected-btn");
});

btn.classList.add("selected-btn");

updateScore();
}

/* SCORE */
function updateScore(){

let total = 0;

Object.values(selectedScores).forEach(v=>total+=v);

document.getElementById("total-score").innerText = total+"점";

const meal = document.querySelectorAll(".food-slot.eaten").length * 4;

document.getElementById("meal-score").innerText = meal+"점";
}

/* SAVE */
function save(){
alert("저장 완료");
}

/* CALENDAR */
function renderCalendar(){

const days = 30;
let html = `<div class="calendar-week">
<div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
</div><div class="calendar-grid">`;

for(let i=1;i<=days;i++){
html += `<div class="calendar-day">${i}</div>`;
}

html += "</div>";

document.getElementById("calendar-card").innerHTML =
"<h2>달력</h2>"+html;
}

/* GRAPH */
function renderGraph(){
document.getElementById("graph-card").innerHTML =
"<h2>그래프</h2><div class='graph-bar' style='width:80%'></div>";
}

/* ANALYSIS */
function renderAnalysis(){
document.getElementById("analysis-card").innerHTML =
`
<h2>이번 달 반성</h2>
<div class="analysis-item">전기 절약</div>
<div class="analysis-item">재활용</div>
`;
}

document.addEventListener("DOMContentLoaded", ()=>{

  const saveBtn =
  document.querySelector(".save-btn");

  if(saveBtn){

    saveBtn.addEventListener(
      "click",
      saveToday
    );

  }

});
