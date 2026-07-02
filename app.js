const SHEET_NAME = "records";

// ★ 처음 실행 시 헤더가 없으면 자동 생성
function ensureHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const firstRow = sheet.getRange(1, 1, 1, 16).getValues()[0];
  const expected = ["date","no","name","score","streak","badges","level",
                    "m_meal","m1","m2","m3","m4","m5","m6","m7","m8"];
  // 헤더가 비어 있거나 첫 셀이 다르면 1행에 헤더 입력
  if(!firstRow[0] || firstRow[0] !== "date") {
    sheet.getRange(1, 1, 1, 16).setValues([expected]);
  }
}

function doGet(e) {
  ensureHeaders();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  const result = data.map(row => {
    let obj = {};
    headers.forEach((h, i) => { obj[String(h).trim()] = row[i]; });
    return obj;
  });
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  ensureHeaders();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const data = JSON.parse(e.postData.contents);

  const today = String(data.date).trim();
  const no    = String(data.no).trim();

  // 중복 차단 (같은 학생 + 같은 날짜)
  const rows = sheet.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    const rowDate = String(rows[i][0]).trim();
    const rowNo   = String(rows[i][1]).trim();
    if (rowDate === today && rowNo === no) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: "duplicate" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  // ★ 헤더 순서와 동일하게 appendRow
  // date | no | name | score | streak | badges | level | m_meal | m1~m8
  sheet.appendRow([
    data.date    || "",
    data.no      || "",
    data.name    || "",
    Number(data.score   || 0),
    Number(data.streak  || 0),
    data.badges  || "",
    data.level   || "",
    Number(data.m_meal  || 0),
    Number(data.m1      || 0),
    Number(data.m2      || 0),
    Number(data.m3      || 0),
    Number(data.m4      || 0),
    Number(data.m5      || 0),
    Number(data.m6      || 0),
    Number(data.m7      || 0),
    Number(data.m8      || 0),
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: "success" }))
    .setMimeType(ContentService.MimeType.JSON);
}
