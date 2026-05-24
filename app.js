let selectedScores = {};

let totalScore = 0;

/* =========================
LOGIN
========================= */

const loginBtn =
document.getElementById('login-btn');

loginBtn.addEventListener('click',login);

function login(){

const no =
document.getElementById('user-no').value;

const name =
document.getElementById('user-name').value;

if(!no || !name){

alert("번호와 이름을 입력해주세요 😊");
return;

}

document
.getElementById('login-page')
.classList.add('hidden');

document
.getElementById('main-page')
.classList.remove('hidden');

renderMissions();

setupMealTray();

}

/* =========================
MISSION RENDER
========================= */

function renderMissions(){

const container =
document.getElementById('mission-container');

container.innerHTML = "";

missions.forEach(m=>{

container.innerHTML += `

<div class="card mission-card">

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
id="btn-${m.id}-0"
onclick="setMissionScore(${m.id},0)">
❌ 안 했어요
</button>

<button
class="mission-btn"
id="btn-${m.id}-5"
onclick="setMissionScore(${m.id},5)">
🔺 조금 했어요
</button>

<button
class="mission-btn"
id="btn-${m.id}-10"
onclick="setMissionScore(${m.id},10)">
⭕ 완벽해요
</button>

</div>

</div>

`;

});

}

/* =========================
MISSION SCORE
========================= */

function setMissionScore(id,score){

selectedScores[id] = score;

document
.querySelectorAll(`[id^="btn-${id}-"]`)
.forEach(btn=>{

btn.classList.remove(
'active0',
'active5',
'active10'
);

});

document
.getElementById(`btn-${id}-${score}`)
.classList.add(`active${score}`);

calculateTotal();

}

/* =========================
MEAL TRAY
========================= */

function setupMealTray(){

const foods =
document.querySelectorAll('.food-slot');

foods.forEach(food=>{

food.addEventListener('click',()=>{

food.classList.toggle('eaten');

calculateTotal();

});

});

}

function calculateMealScore(){

const eatenCount =
document.querySelectorAll('.food-slot.eaten')
.length;

return eatenCount * 4;

}

/* =========================
TOTAL SCORE
========================= */

function calculateTotal(){

let missionScore = 0;

Object.values(selectedScores)
.forEach(score=>{

missionScore += score;

});

const mealScore =
calculateMealScore();

totalScore =
missionScore + mealScore;

document.getElementById(
'total-score'
).innerText =
totalScore + "점";

document.getElementById(
'meal-score'
).innerText =
`급식 점수 : ${mealScore}점 / 20점`;

}

/* =========================
SAVE
========================= */

const saveBtn =
document.querySelector('.save-btn');

saveBtn.addEventListener('click',saveToday);

function saveToday(){

if(Object.keys(selectedScores).length < 8){

alert("모든 미션을 체크해주세요 😊");
return;

}

const compliment =

compliments[
Math.floor(
Math.random() * compliments.length
)
];

alert(
`저장 완료!\n\n현재 점수 : ${totalScore}점\n\n${compliment}`
);

}