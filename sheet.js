// =========================
// GOOGLE SHEET URL
// =========================

const WEB_APP_URL = "여기에_웹앱_URL";

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
