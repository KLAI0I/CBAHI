const SHEET_NAME = 'Sheet1'; // 🔁 Change if your tab has a different name

function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('CBAHI Checklist - Nursing')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Get all checklist items from the sheet
function getToDoData() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  if (lastRow < 2) {
    return [];
  }

  const range = sheet.getRange(1, 1, lastRow, lastCol);
  const values = range.getValues();

  // First row = headers
  const rawHeaders = values.shift();
  const headers = rawHeaders.map(h => h.toString().trim());

  const items = [];

  values.forEach((row, index) => {
    // Skip completely empty rows
    if (row.join('').toString().trim() === '') return;

    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });

    // Actual row number in sheet (because header is row 1)
    obj.rowNumber = index + 2;

    items.push(obj);
  });

  return items;
}

// Save (add or update) an item
function saveToDoItem(item) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();

  const headers = sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(h => h.toString().trim());

  const headerIndex = {};
  headers.forEach((h, i) => {
    headerIndex[h] = i; // 0-based
  });

  // Prepare row values
  const rowValues = new Array(headers.length).fill('');

  function setValue(fieldName, value) {
    if (fieldName in headerIndex) {
      rowValues[headerIndex[fieldName]] = value === undefined ? '' : value;
    }
  }

  // Map expected fields
  setValue('#', item['#']);
  setValue('Date', item['Date']);
  setValue('Points', item['Points']);
  setValue('Category', item['Category']);
  setValue('Responsibility', item['Responsibility']);
  setValue('Status', item['Status']);
  setValue('Comment', item['Comment']);

  const rowNumber = item.rowNumber ? Number(item.rowNumber) : null;

  if (rowNumber && rowNumber > 1 && rowNumber <= lastRow) {
    // UPDATE existing row
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([rowValues]);
  } else {
    // APPEND new row
    const currentLastRow = sheet.getLastRow(); // before append
    // Auto-number '#' column based on existing rows
    if ('#' in headerIndex && !item['#']) {
      rowValues[headerIndex['#']] = currentLastRow; // header is row 1 → data index = row-1
    }
    sheet.appendRow(rowValues);
  }

  // Return updated data for refresh
  return getToDoData();
}

// Delete an item by its sheet row
function deleteToDoItem(rowNumber) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();

  if (rowNumber && rowNumber > 1 && rowNumber <= lastRow) {
    sheet.deleteRow(rowNumber);
  }

  return getToDoData();
}
