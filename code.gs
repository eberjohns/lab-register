// Smart Lab Register - Google Apps Script Backend

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === "getCategories") {
    return _jsonResponse(getCategories());
  } else if (action === "getInventory") {
    const category = e.parameter.category;
    return _jsonResponse(getInventory(category));
  } else if (action === "getAllInventory") {
    return _jsonResponse(getAllInventory());
  } else if (action === "getRecentActivity") {
    return _jsonResponse(getRecentActivity());
  } else if (action === "getAllLogs") {
    return _jsonResponse(getAllLogs());
  } else if (action === "createSnapshot") {
    return _jsonResponse(createSnapshot());
  }
  
  return _jsonResponse({ error: "Invalid Action" }, 400);
}

function doPost(e) {
  const postData = JSON.parse(e.postData.contents);
  const action = postData.action;
  
  if (action === "addItem") {
    return _jsonResponse(addItem(postData.category, postData.itemData));
  } else if (action === "deductItems") {
    return _jsonResponse(deductItems(postData.faculty, postData.purpose, postData.itemsToDeduct));
  } else if (action === "addFine") {
    return _jsonResponse(addFine(postData.fineData));
  }
  
  return _jsonResponse({ error: "Invalid Action" }, 400);
}

// ---- Helpers ----

function _jsonResponse(data, code = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function _getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  let isNew = false;
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    isNew = true;
  }
  
  // Ensure headers exist even if the sheet was created manually but left empty
  if (isNew || sheet.getLastRow() === 0) {
    if (sheetName === "_Receipts") {
      sheet.appendRow(["Receipt ID", "Time", "Faculty", "Purpose", "Item", "Quantity", "Unit"]);
    } else if (sheetName === "_Fines") {
      sheet.appendRow(["Name", "Category", "Item", "Fine Amount", "Remarks", "Date"]);
    } else if (sheetName === "_Logs") {
      sheet.appendRow(["Time", "Action", "Item", "Quantity", "Details"]);
    }
  }
  return sheet;
}

function _getSheetData(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only headers or empty
  
  const headers = data[0];
  const records = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const record = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = row[j];
    }
    records.push(record);
  }
  return records;
}

function _writeSheetData(sheet, records) {
  if (records.length === 0) return;
  const headers = Object.keys(records[0]);
  const data = [headers];
  
  records.forEach(rec => {
    const row = [];
    headers.forEach(h => {
      row.push(rec[h] !== undefined ? rec[h] : "");
    });
    data.push(row);
  });
  
  sheet.clearContents();
  sheet.getRange(1, 1, data.length, data[0].length).setValues(data);
}

// ---- Core Logic ----

function getCategories() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const categories = [];
  sheets.forEach(s => {
    const name = s.getName();
    if (!name.startsWith("_")) {
      categories.push(name);
    }
  });
  return categories;
}

function getInventory(category) {
  const sheet = _getSheet(category);
  return _getSheetData(sheet);
}

function getAllInventory() {
  const categories = getCategories();
  let allItems = [];
  categories.forEach(cat => {
    const items = getInventory(cat);
    items.forEach(item => item._Category = cat);
    allItems = allItems.concat(items);
  });
  return allItems;
}

function generateId(category, existingItems) {
  let prefix = category.substring(0, 3).toUpperCase();
  if (category === 'Chemicals') prefix = 'CHM';
  else if (category === 'Glassware') prefix = 'GLS';
  else if (category === 'Equipments') prefix = 'EQP';
  
  let maxNum = 0;
  existingItems.forEach(item => {
    if (item.ID && typeof item.ID === 'string' && item.ID.startsWith(prefix)) {
      const numPart = parseInt(item.ID.split('-')[1]);
      if (!isNaN(numPart) && numPart > maxNum) maxNum = numPart;
    }
  });
  return prefix + "-" + String(maxNum + 1).padStart(3, '0');
}

function addItem(category, itemData) {
  const sheet = _getSheet(category);
  const items = _getSheetData(sheet);
  
  const normalizedNewName = itemData.Name.toString().trim().toLowerCase();
  let existingIndex = items.findIndex(i => i.Name && i.Name.toString().trim().toLowerCase() === normalizedNewName);
  
  const now = new Date().toISOString();
  let status = "In Stock";
  const q = parseFloat(itemData.Quantity) || 0;
  const t = parseFloat(itemData.Threshold) || 0;
  
  let actionDetails = "";
  
  if (existingIndex >= 0) {
    items[existingIndex].Quantity = parseFloat(items[existingIndex].Quantity) + q;
    items[existingIndex]["Last Updated"] = now;
    
    const newQ = items[existingIndex].Quantity;
    items[existingIndex].Status = newQ === 0 ? "Out of Stock" : (newQ <= t ? "Low Stock" : "In Stock");
    
    // Add any dynamic properties that might be new
    Object.keys(itemData).forEach(k => {
      if (items[existingIndex][k] === undefined || items[existingIndex][k] === "") {
        items[existingIndex][k] = itemData[k];
      }
    });
    actionDetails = "Stock Added to existing item";
  } else {
    status = q === 0 ? "Out of Stock" : (q <= t ? "Low Stock" : "In Stock");
    const newItem = {
      ID: generateId(category, items),
      Name: itemData.Name.toString().trim(),
      Quantity: q,
      Status: status,
      "Last Updated": now,
    };
    
    Object.keys(itemData).forEach(k => {
      if (newItem[k] === undefined && k !== "Name" && k !== "Quantity") {
        newItem[k] = itemData[k];
      }
    });
    
    items.push(newItem);
    actionDetails = "New Item Created";
  }
  
  // Make sure to preserve existing headers and add new ones
  const headersSet = new Set();
  items.forEach(i => Object.keys(i).forEach(k => headersSet.add(k)));
  const headers = Array.from(headersSet);
  
  const writeData = [headers];
  items.forEach(rec => {
    const row = [];
    headers.forEach(h => row.push(rec[h] !== undefined ? rec[h] : ""));
    writeData.push(row);
  });
  
  sheet.clear();
  sheet.getRange(1, 1, writeData.length, writeData[0].length).setValues(writeData);
  
  // Log the addition
  if (q > 0 || actionDetails === "New Item Created") {
    const logSheet = _getSheet("_Logs");
    logSheet.appendRow([now, "Stock Added", itemData.Name, q, actionDetails]);
  }
  
  return { success: true };
}

function deductItems(faculty, purpose, itemsToDeduct) {
  const now = new Date().toISOString();
  
  // Get unique categories affected
  const catsAffected = new Set();
  itemsToDeduct.forEach(i => catsAffected.add(i.category));
  
  const receiptLogs = [];
  const mainLogs = [];
  
  Array.from(catsAffected).forEach(cat => {
    const sheet = _getSheet(cat);
    const items = _getSheetData(sheet);
    const deductions = itemsToDeduct.filter(i => i.category === cat);
    
    deductions.forEach(deduction => {
      const normalizedName = deduction.Name.toString().trim().toLowerCase();
      let existingIndex = items.findIndex(i => i.Name && i.Name.toString().trim().toLowerCase() === normalizedName);
      
      if (existingIndex >= 0) {
        items[existingIndex].Quantity = parseFloat(items[existingIndex].Quantity) - parseFloat(deduction.Quantity);
        if (items[existingIndex].Quantity < 0) items[existingIndex].Quantity = 0;
        
        const q = items[existingIndex].Quantity;
        const t = parseFloat(items[existingIndex].Threshold) || 0;
        items[existingIndex].Status = q === 0 ? "Out of Stock" : (q <= t ? "Low Stock" : "In Stock");
        items[existingIndex]["Last Updated"] = now;
        
        receiptLogs.push({
          Faculty: faculty,
          Purpose: purpose,
          Item: deduction.Name,
          Quantity: deduction.Quantity,
          Unit: items[existingIndex].Unit || ""
        });
        
        mainLogs.push([now, "Stock Used", deduction.Name, "-" + deduction.Quantity, `Given to ${faculty} for ${purpose}`]);
      }
    });
    
    _writeSheetData(sheet, items);
  });
  
  // Log receipts
  if (receiptLogs.length > 0) {
    const rSheet = _getSheet("_Receipts");
    const rData = _getSheetData(rSheet);
    
    let maxRcp = 0;
    rData.forEach(r => {
      if (r["Receipt ID"] && r["Receipt ID"].toString().startsWith("RCP-")) {
        const numPart = parseInt(r["Receipt ID"].split('-')[1]);
        if (!isNaN(numPart) && numPart > maxRcp) maxRcp = numPart;
      }
    });
    const receiptId = "RCP-" + String(maxRcp + 1).padStart(3, '0');
    
    receiptLogs.forEach(log => {
      rSheet.appendRow([receiptId, now, log.Faculty, log.Purpose, log.Item, log.Quantity, log.Unit]);
    });
    
    // Also append to universal logs
    const logSheet = _getSheet("_Logs");
    mainLogs.forEach(row => logSheet.appendRow(row));
  }
  
  return { success: true };
}

function addFine(fineData) {
  const sheet = _getSheet("_Fines");
  const now = new Date().toISOString();
  sheet.appendRow([
    fineData.Name || "",
    fineData.Category || "",
    fineData.Item || "",
    fineData["Fine Amount"] || 0,
    fineData.Remarks || "",
    now
  ]);
  
  const logSheet = _getSheet("_Logs");
  logSheet.appendRow([now, "Fine Added", fineData.Item, fineData["Fine Amount"], `Fined ${fineData.Name} - ${fineData.Remarks}`]);
  
  return { success: true };
}

function getAllLogs() {
  const rSheet = _getSheet("_Receipts");
  const rData = _getSheetData(rSheet);
  
  const fSheet = _getSheet("_Fines");
  const fData = _getSheetData(fSheet);
  
  const lSheet = _getSheet("_Logs");
  const lData = _getSheetData(lSheet);
  
  const activities = [];
  
  // Add universal logs
  lData.forEach(l => {
    activities.push({
      time: l.Time,
      type: l.Action,
      item: l.Item,
      quantity: l.Quantity,
      details: l.Details
    });
  });
  
  // Fallback for older data if Logs sheet was just created
  if (lData.length === 0) {
    rData.forEach(r => {
      activities.push({
        time: r.Time,
        type: 'Stock Used',
        item: r.Item,
        quantity: "-" + r.Quantity,
        details: `Given to ${r.Faculty} for ${r.Purpose} (Receipt: ${r["Receipt ID"]})`
      });
    });
    
    fData.forEach(f => {
      activities.push({
        time: f.Date,
        type: 'Fine Added',
        item: f.Item,
        quantity: f["Fine Amount"],
        details: `Fined ${f.Name} - ${f.Remarks}`
      });
    });
  }
  
  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  return activities;
}

function getRecentActivity() {
  const logs = getAllLogs();
  // Return recent 10, formatted for dashboard
  return logs.slice(0, 10).map(l => ({
    type: l.type === "Stock Used" ? "deduction" : l.type === "Fine Added" ? "fine" : "addition",
    message: `${l.type}: ${l.quantity} ${l.item}`,
    time: l.time
  }));
}

function createSnapshot() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = ss.getName() + "_Backup_" + new Date().toISOString().replace(/:/g, "-");
  
  // Create a copy of the active spreadsheet
  const file = DriveApp.getFileById(ss.getId());
  file.makeCopy(name);
  
  const logSheet = _getSheet("_Logs");
  logSheet.appendRow([new Date().toISOString(), "Snapshot Created", "All", "-", "System Backup"]);
  
  return { success: true };
}
