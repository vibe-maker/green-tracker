// =========================
// GOOGLE SHEET URL
// =========================

const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzkHeM_7ntBjutO-NiRMhKlk5zZvWOee7v1Q7j1fJe1N_ADRXVKYy3RhpZDCvNdBO5Tjg/exec";

// =========================
// SAVE DATA
// =========================

async function saveToSheet(data){

try{

await fetch(WEB_APP_URL,{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify(data)

});

return true;

}catch(error){

console.error(error);

return false;

}

}

// =========================
// LOAD DATA
// =========================

async function loadSheetData(){

try{

const response = await fetch(WEB_APP_URL);

const data = await response.json();

return data;

}catch(error){

console.error(error);

return [];

}

}
