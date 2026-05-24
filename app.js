// =========================
// GLOBAL
// =========================

let currentUser = null;
let currentData = [];

let selectedScores = {};

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// =========================
// STUDENTS
// =========================

const STUDENTS = [

"강하영","김루하","김소은","김지유","남시하","손유하","윤수아",
"윤승아","이하민","임아윤","전서현","조율희","최한별","한지원",
"김동빈","김시윤","김주원","김효찬","남지후","노시온","방준영",
"송건우","임환희","조유찬","주은호","한진우","허시준","서현우"

];

// =========================
// MISSIONS
// =========================

const MISSIONS = [

{id:1,icon:"💡",title:"빈 교실, 빈 방 전등 끄기"},
{id:2,icon:"💧",title:"이 닦을 때 물컵 사용"},
{id:3,icon:"🥛",title:"우유팩 씻어 말리기"},
{id:4,icon:"🗑️",title:"쓰레기 없는 하루"},
{id:5,icon:"🧹",title:"교실 깨끗하게 유지"},
{id:6,icon:"🌱",title:"식물 돌보기"},
{id:7,icon:"🔌",title:"플러그 뽑기"},
{id:8,icon:"🏃",title:"물건 아껴쓰기"}

];

// =========================
// COMPLIMENTS
// =========================

const COMPLIMENTS = [

"오늘의 작은 실천이 지구를 웃게 했어요 🌍",
"여러분 덕분에 지구가 시원해졌어요 ❄️",
"초록 지구 지킴이 최고! 🌱",
"오늘도 환경 수호 완료 🌳",
"꾸준함이 세상을 바꿔요 💚"

];

// =========================
// LOGIN
// =========================

document
.getElementById("login-btn")
.addEventListener("click",login);

async function login(){

const no =
document.getElementById("user-no").value;

const name =
document.getElementById("user-name").value;

if(!no || !name){

alert("번호와 이름 입력!");
return;

}

currentUser = {
no:no,
name:name
};

document
.getElementById("login-page")
.classList.add("hidden");

document
.getElementById("main-page")
.classList.remove("hidden");

renderMissions();

await loadAllData();

renderCalendar();

renderStats();

}

// =========================
// RENDER MISSIONS
// =========================

function renderMissions(){

const container =
document.getElementById("mission-container");

container.innerHTML="";

MISSIONS.forEach(m=>{

container.innerHTML += `

<div class="mission">

<div class="mission-top">

<div class="icon-box">
${m.icon}
</div>

<div class="mission-title">
${m.title}
</div>

</div>

<div class="btn-group">

<button
class="score-btn"
onclick="setScore(${m.id},0)">
❌
</button>

<button
class="score-btn"
onclick="setScore(${m.id},5)">
🔺
</button>

<button
class="score-btn"
onclick="setScore(${m.id},10)">
⭕
</button>

</div>

</div>

`;

});

}

// =========================
// SCORE
// =========================

function setScore(id,score){

selectedScores[id]=score;

calculateTotal();

}

function toggleFood(el){

el.classList.toggle("eaten");

calculateTotal();

}

function calculateMealScore(){

const eaten =
document.querySelectorAll(".food-slot.eaten").length;

return eaten * 4;

}

function calculateTotal(){

let total = 0;

Object.values(selectedScores)
.forEach(v=>{
total += v;
});

total += calculateMealScore();

document
.getElementById("total-score")
.innerText = total + "점";

document
.getElementById("meal-score")
.innerText =
`급식 점수 : ${calculateMealScore()}점 / 20점`;

return total;

}

// =========================
// SAVE
// =========================

async function saveToday(){

const today =
new Date().toDateString();

const already =
currentData.find(d=>

d.date === today &&
d.no == currentUser.no

);

if(already){

alert("오늘은 이미 저장했어요 😊");
return;

}

if(Object.keys(selectedScores).length < 8){

alert("모든 미션 체크!");
return;

}

const score =
calculateTotal();

const streak =
calculateStreak();

const level =
calculateLevel(score);

const badges =
calculateBadges();

const payload = {

date:today,
no:currentUser.no,
name:currentUser.name,
score:score,
streak:streak,
badges:badges.join(", "),
level:level

};

const success =
await saveToSheet(payload);

if(success){

await loadAllData();

showPopup(score);

}else{

alert("저장 실패 😢");

}

}

// =========================
// POPUP
// =========================

function showPopup(score){

const modal =
document.getElementById("modal");

const popupScore =
document.getElementById("popup-score");

const compliment =
document.getElementById("compliment");

popupScore.innerText =
score + "점";

const randomText =
COMPLIMENTS[
Math.floor(Math.random()*COMPLIMENTS.length)
];

compliment.innerText =
randomText;

const randomType =
Math.floor(Math.random()*3);

let message = "";

if(randomType===0){

message =
`🌳 나무가 ${(score*0.03).toFixed(1)}cm 자랐어요!`;

}

if(randomType===1){

message =
`🌊 해수면이 ${(score*0.001).toFixed(3)}cm 낮아졌어요!`;

}

if(randomType===2){

message =
`🌡️ 지구온도가 ${(score*0.0001).toFixed(4)}℃ 낮아졌어요!`;

}

document
.getElementById("eco-result")
.innerText = message;

modal.style.display="flex";

}

// =========================
// LOAD DATA
// =========================

async function loadAllData(){

currentData =
await loadSheetData();

}

// =========================
// LEVEL
// =========================

function calculateLevel(score){

let total = getMyTotalScore();

if(total >= 7000) return "🌍 초록 지구 지킴이";
if(total >= 6000) return "💚 생명 지킴이";
if(total >= 5000) return "🦋 자연 지킴이";
if(total >= 4000) return "🍎 열매 지킴이";
if(total >= 3000) return "🌸 꽃 지킴이";
if(total >= 2000) return "🌳 나무 지킴이";
if(total >= 1000) return "🌿 새싹 지킴이";

return "🌱 씨앗 지킴이";

}

// =========================
// BADGES
// =========================

function calculateBadges(){

let badges = [];

const myData =
currentData.filter(d=>
d.no == currentUser.no
);

if(myData.length >= 1){

badges.push("👍 첫 실천 배지");

}

if(myData.length >= 7){

badges.push("🔥 일주일 지킴이");

}

if(myData.length >= 30){

badges.push("🌙 한달 지킴이");

}

return badges;

}

// =========================
// STREAK
// =========================

function calculateStreak(){

const myData =
currentData.filter(d=>
d.no == currentUser.no
);

return myData.length + 1;

}

// =========================
// TOTAL SCORE
// =========================

function getMyTotalScore(){

let total = 0;

currentData.forEach(d=>{

if(d.no == currentUser.no){

total += Number(d.score);

}

});

return total;

}

// =========================
// CALENDAR
// =========================

function renderCalendar(){

const grid =
document.getElementById("calendar-grid");

if(!grid) return;

grid.innerHTML="";

const firstDay =
new Date(currentYear,currentMonth,1).getDay();

const lastDate =
new Date(currentYear,currentMonth+1,0).getDate();

for(let i=0;i<firstDay;i++){

grid.innerHTML += `<div></div>`;

}

for(let d=1; d<=lastDate; d++){

const stamp = "🐾";

grid.innerHTML += `

<div class="day-stamp">

<div class="day-number">
${d}
</div>

<div style="font-size:26px;">
${stamp}
</div>

</div>

`;

}

}

// =========================
// STATS
// =========================

function renderStats(){

renderDashboard();

}

// =========================
// DASHBOARD
// =========================

function renderDashboard(){

const body =
document.getElementById("rank-body");

if(!body) return;

body.innerHTML="";

let totals = {};

STUDENTS.forEach((name,index)=>{

totals[index+1]={
name:name,
score:0
};

});

currentData.forEach(d=>{

if(totals[d.no]){

totals[d.no].score +=
Number(d.score);

}

});

Object.keys(totals).forEach(no=>{

const student =
totals[no];

const level =
calculateLevel(student.score);

body.innerHTML += `

<tr>

<td>${no}</td>

<td>${student.name}</td>

<td>${student.score}</td>

<td>${level}</td>

</tr>

`;

});

}

// =========================
// GO DASHBOARD
// =========================

function goDashboard(){

document
.getElementById("modal")
.style.display="none";

document
.getElementById("main-page")
.classList.add("hidden");

document
.getElementById("dashboard-page")
.classList.remove("hidden");

renderDashboard();

}

// =========================
// BUTTON EVENT
// =========================

const saveBtn =
document.querySelector(".save-btn");

if(saveBtn){

saveBtn.addEventListener(
"click",
saveToday
);

}
