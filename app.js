const missions = [

{
id:1,
icon:"💡",
title:"빈 교실, 빈 방 전등 끄기"
},

{
id:2,
icon:"💧",
title:"양치할 때 컵 사용, 손 비누칠 할 때 수도 잠그기"
},

{
id:3,
icon:"♻️",
title:"물컵이나 텀블러 사용하기, 재활용하기(우유팩 씻어 말리기)"
},

{
id:4,
icon:"🗑️",
title:"쓰레기 없는 하루 보내기"
},

{
id:5,
icon:"🧹",
title:"자리 주변과 교실 깨끗하게 유지하기"
},

{
id:6,
icon:"🌱",
title:"교실 식물 돌보기, 식물 소중히 여기기"
},

{
id:7,
icon:"🔌",
title:"안 쓰는 전기기구(충전기 등) 플러그 뽑기"
},

{
id:8,
icon:"🏃",
title:"교과서와 학용품 등 물건 아껴쓰기"
}

];

let totalScore = 0;
let selectedScores = {};

const loginBtn =
document.getElementById("login-btn");

loginBtn.addEventListener("click", login);

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

renderMissions();

renderCalendar();

}

/* 급식판 */

const foodSlots =
document.querySelectorAll(".food-slot");

foodSlots.forEach(slot=>{

slot.addEventListener("click", ()=>{

slot.classList.toggle("eaten");

calculateTotal();

});

});

/* 미션 */

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

<button
class="mission-btn"
onclick="setMission(${m.id},0,this)">
❌
</button>

<button
class="mission-btn"
onclick="setMission(${m.id},5,this)">
🔺
</button>

<button
class="mission-btn"
onclick="setMission(${m.id},10,this)">
⭕
</button>

</div>

</div>

`;

});

}

function setMission(id, score, btn){

selectedScores[id] = score;

const parent =
btn.parentElement;

parent
.querySelectorAll(".mission-btn")
.forEach(b=>{

b.classList.remove("selected-btn");

});

btn.classList.add("selected-btn");

calculateTotal();

}

/* 점수 계산 */

function calculateTotal(){

let mealScore = 0;

document
.querySelectorAll(".food-slot.eaten")
.forEach(()=>{

mealScore += 4;

});

let missionScore = 0;

Object.values(selectedScores)
.forEach(score=>{

missionScore += score;

});

totalScore =
mealScore + missionScore;

document
.getElementById("total-score")
.innerText = totalScore + "점";

}

/* 달력 */

function renderCalendar(){

const grid =
document.getElementById("calendar-grid");

const now = new Date();

const year = now.getFullYear();

const month = now.getMonth();

const firstDay =
new Date(year, month, 1).getDay();

const lastDate =
new Date(year, month+1, 0).getDate();

grid.innerHTML = "";

for(let i=0;i<firstDay;i++){

grid.innerHTML += `<div></div>`;

}

for(let d=1; d<=lastDate; d++){

grid.innerHTML += `

<div class="calendar-day">

<div class="day-number">
${d}
</div>

</div>

`;

}

}

/* 저장 */

const saveBtn =
document.getElementById("save-btn");

saveBtn.addEventListener("click", saveScore);

function saveScore(){

const popup =
document.createElement("div");

popup.className = "popup";

popup.innerHTML = `

<div class="popup-box">

<div class="popup-emoji">
🐻‍❄️
</div>

<h2>
빙하가 지켜졌어요!
</h2>

<div class="popup-score">
${totalScore}점
</div>

<p>
여러분의 노력으로<br>
해수면이 0.0001cm 낮아졌어요!
</p>

<button onclick="closePopup()">
학급 현황판 보기 🏆
</button>

</div>

`;

document.body.appendChild(popup);

}

function closePopup(){

document.querySelector(".popup").remove();

alert("다음 단계에서 학급 현황판 연결 예정!");

}
