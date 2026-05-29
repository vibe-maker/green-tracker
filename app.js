/* =========================
기본 데이터
========================= */

let totalScore = 0;

let savedDays = [];

const missionScores = {};

const WEB_APP_URL =
"https://script.google.com/macros/s/AKfycbySqlpRMSMEvQ-2lQaX_P1DkyOrDaKNBdB4D29iG7DLQ9HRuIrifsbeObQcbYnrEUdUNw/exec";

/* =========================
로그인
========================= */

function login(){

const no =
document.getElementById("user-no").value;

const name =
document.getElementById("user-name").value;

if(!no || !name){

alert("번호와 이름을 입력하세요!");
return;

}

document
.getElementById("login-page")
.classList.add("hidden");

document
.getElementById("main-page")
.classList.remove("hidden");
loadCalendarData();
}

/* =========================
급식판
========================= */

const foodSlots =
document.querySelectorAll(".food-slot");

foodSlots.forEach(slot=>{

slot.addEventListener("click", ()=>{

slot.classList.toggle("active");

updateTotalScore();

});

});

/* =========================
미션 버튼
========================= */

function setMission(btn, missionId, score){

missionScores[missionId] = score;

const parent =
btn.parentElement;

const buttons =
parent.querySelectorAll(".mission-btn");

buttons.forEach(b=>{

b.classList.remove("selected");

});

btn.classList.add("selected");

updateTotalScore();

}

/* =========================
총점 계산
========================= */

function updateTotalScore(){

let score = 0;

/* 급식판 */

const activeFoods =
document.querySelectorAll(".food-slot.active");

score += activeFoods.length * 4;

/* 미션 */

Object.values(missionScores).forEach(v=>{

score += v;

});

totalScore = score;

document.getElementById("total-score").innerText =
score + "점";

}

/* =========================
점수 제출
========================= */

function submitScore(){

const today = new Date().getDate();

if(savedDays.includes(today)){

alert("오늘은 이미 제출했어요 😊");
return;

}

savedDays.push(today);

const days =
document.querySelectorAll(".day");

days.forEach(day=>{

if(day.innerText == today){

const streak = savedDays.length;

let pawClass = "green-paw";

if(streak % 5 === 0){
pawClass = "gold-paw";
}


day.innerHTML = `
<div>${today}</div>
<div class="${pawClass}">
🐾
</div>
`;

}

});

const todayDate = new Date();

const payload = {

date:
todayDate.getFullYear() + "-" +
(todayDate.getMonth()+1) + "-" +
todayDate.getDate(),

no:
document.getElementById("user-no").value,

name:
document.getElementById("user-name").value,

score: totalScore,

streak: 1,

badges: "",

level: "씨앗 지킴이"

};

fetch(WEB_APP_URL, {

method:"POST",

body: JSON.stringify(payload),

headers:{
"Content-Type":"text/plain"
}

})
.then(res => res.json())
.then(data => {

console.log("저장 성공", data);

showSubmitPopup();

})
.catch(err => {

console.error(err);

alert("저장 실패!");

});
}

/* =========================
팝업
========================= */

function showSubmitPopup(){

const popup =
document.createElement("div");

popup.className = "popup";

popup.innerHTML = `

<div class="popup-box">

<div class="bear">
🐻‍❄️
</div>

<h2>
빙하가 지켜졌어요!
</h2>

<p class="popup-text">
${totalScore}점의 노력으로<br>
해수면이 0.0001cm 낮아졌어요!
</p>

<button onclick="goClassPage()">
학급 현황판 보기
</button>

</div>

`;

document.body.appendChild(popup);

}

function closePopup(){

const popup =
document.querySelector(".popup");

if(popup){

popup.remove();

}

}

/* =========================
현황판 이동
========================= */

function goClassPage(){

closePopup();

alert("다음 단계에서 연결됩니다!");

}

/* =========================
달력 불러오기
========================= */

async function loadCalendarData(){

try{

const response =
await fetch(WEB_APP_URL);

const data =
await response.json();

const myNo =
document.getElementById("user-no").value;

const myRecords =
data.filter(r => r.no == myNo);

myRecords.forEach(record => {

const dateText = record.date;

const dayNumber =
Number(dateText.split("-")[2]);

const days =
document.querySelectorAll(".day");

days.forEach(day => {

if(day.innerText == dayNumber){

day.innerHTML = `
<div>${dayNumber}</div>
<div style="
font-size:22px;
margin-top:5px;
">
🐾
</div>
`;

}

});

});

}catch(error){

console.error(error);

}

}
                      
/* =========================
로그인 버튼 연결
========================= */

window.onload = function(){

document
.getElementById("login-btn")
.addEventListener("click", login);



};

