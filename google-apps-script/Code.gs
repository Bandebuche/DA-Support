/**
 * ==============================================================================
 * DIGITAL AZADI SUPPORT — Central Backend Engine
 * Timezone: Asia/Kolkata (IST)
 * Sheet Tab: Technical_Support_DB
 * ==============================================================================
 * Hybrid Architecture:
 * - Serves Native Apps Script HTML Portals via HtmlService (page=submit|admin|home)
 * - Supports direct google.script.run RPC calls
 * - Serves JSON REST API for external web apps (doGet/doPost with ?action=...)
 * - Strict Concurrency Protection with LockService
 * ==============================================================================
 */

const SHEET_NAME = "Technical_Support_DB";

/**
 * Master Request Router (Serves HTML Templates or JSON REST API)
 */
function doGet(e) {
  // If an external REST client requested JSON (e.g., ?action=getTickets)
  if (e && e.parameter && e.parameter.action) {
    return handleRestApi(e, "GET");
  }

  // Otherwise, serve HTML Portals inside Apps Script
  const page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'home';
  let htmlFile = 'Index';
  let pageTitle = 'Digital Azadi Support — Portal Hub';

  if (page === 'submit') {
    htmlFile = 'Submit';
    pageTitle = 'Digital Azadi Support — Submit Query';
  } else if (page === 'admin') {
    htmlFile = 'Admin';
    pageTitle = 'Digital Azadi Support — SLA Command Dashboard';
  }

  return HtmlService.createTemplateFromFile(htmlFile)
    .evaluate()
    .setTitle(pageTitle)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle POST requests (REST Webhook / JSON payload)
 */
function doPost(e) {
  return handleRestApi(e, "POST");
}

/**
 * REST API Handler for standalone or external clients
 */
function handleRestApi(e, method) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (lockErr) {
    return jsonResponse({ success: false, error: "Server busy, please retry." });
  }

  try {
    var params = {};
    if (e && e.parameter) params = Object.assign({}, e.parameter);
    if (e && e.postData && e.postData.contents) {
      try {
        var jsonBody = JSON.parse(e.postData.contents);
        params = Object.assign(params, jsonBody);
      } catch (jsonErr) {}
    }

    var action = params.action || "getTickets";

    switch (action) {
      case "ping":
        return jsonResponse({
          success: true,
          status: "healthy",
          serverTimeIST: getISTDateTimeString()
        });

      case "getTickets":
      case "getAdminDashboardData":
        var data = getAdminDashboardData();
        return jsonResponse({ success: true, count: data.length, tickets: data });

      case "createTicket":
      case "submitPublicTicket":
        var newTicket = submitPublicTicket({
          name: params.fullName || params.name,
          mobile: params.mobileNumber || params.mobile,
          email: params.emailAddress || params.email,
          category: params.userCategory || params.category,
          membership: params.membershipType || params.membership,
          platform: params.platform,
          query: params.queryDescription || params.query,
          remarks: params.remarks
        });
        return jsonResponse({ success: true, ticket: newTicket });

      case "startSupport":
      case "startSupportSession":
        var startRes = startSupportSession(params.ticketId || params.id);
        return jsonResponse(startRes);

      case "completeSupport":
      case "completeSupportSession":
        var doneRes = completeSupportSession(params.ticketId || params.id, params.remarks);
        return jsonResponse(doneRes);

      case "manualOverride":
      case "manualOverrideSession":
        var overrideRes = manualOverrideSession(params.ticketId || params.id, params);
        return jsonResponse(overrideRes);

      default:
        return jsonResponse({ success: false, error: "Unknown action: " + action });
    }
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Access or initialize the centralized database sheet
 */
function getDbSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      "Ticket ID", "Submission Date", "Submission Time", "Full Name",
      "Mobile Number", "Email Address", "User Category", "Membership Type",
      "Platform", "Query Description", "Current Status", "Support Start Time",
      "Support End Time", "Total Time Taken", "Remarks", "Last Updated"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#0A1128")
      .setFontColor("#FFFFFF")
      .setFontSize(10)
      .setHorizontalAlignment("center");
    sheet.setFrozenRows(1);

    // Format column widths for readability
    sheet.setColumnWidth(1, 140); // Ticket ID
    sheet.setColumnWidth(2, 110); // Submission Date
    sheet.setColumnWidth(3, 100); // Submission Time
    sheet.setColumnWidth(4, 160); // Full Name
    sheet.setColumnWidth(5, 130); // Mobile
    sheet.setColumnWidth(6, 180); // Email
    sheet.setColumnWidth(7, 120); // Category
    sheet.setColumnWidth(8, 120); // Membership
    sheet.setColumnWidth(9, 130); // Platform
    sheet.setColumnWidth(10, 260); // Query
    sheet.setColumnWidth(11, 110); // Status
    sheet.setColumnWidth(12, 120); // Start Time
    sheet.setColumnWidth(13, 120); // End Time
    sheet.setColumnWidth(14, 110); // Total Time
    sheet.setColumnWidth(15, 200); // Remarks
    sheet.setColumnWidth(16, 160); // Last Updated
  }
  return sheet;
}

/**
 * ONE-CLICK GENERATOR: Creates a brand new Google Sheet in Google Drive
 * Run this function in Apps Script to automatically generate and format a new spreadsheet!
 */
function createNewGoogleSpreadsheet() {
  const newSs = SpreadsheetApp.create("Digital Azadi Support — Technical Support DB");
  const sheet = newSs.getActiveSheet();
  sheet.setName(SHEET_NAME);

  const headers = [
    "Ticket ID", "Submission Date", "Submission Time", "Full Name",
    "Mobile Number", "Email Address", "User Category", "Membership Type",
    "Platform", "Query Description", "Current Status", "Support Start Time",
    "Support End Time", "Total Time Taken", "Remarks", "Last Updated"
  ];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight("bold")
    .setBackground("#0A1128")
    .setFontColor("#FFFFFF")
    .setFontSize(10)
    .setHorizontalAlignment("center");
  sheet.setFrozenRows(1);

  // Auto-fit & format columns
  sheet.setColumnWidth(1, 140); // Ticket ID
  sheet.setColumnWidth(2, 110); // Submission Date
  sheet.setColumnWidth(3, 100); // Submission Time
  sheet.setColumnWidth(4, 160); // Full Name
  sheet.setColumnWidth(5, 130); // Mobile Number
  sheet.setColumnWidth(6, 180); // Email Address
  sheet.setColumnWidth(7, 120); // User Category
  sheet.setColumnWidth(8, 120); // Membership Type
  sheet.setColumnWidth(9, 130); // Platform
  sheet.setColumnWidth(10, 260); // Query Description
  sheet.setColumnWidth(11, 110); // Current Status
  sheet.setColumnWidth(12, 120); // Support Start Time
  sheet.setColumnWidth(13, 120); // Support End Time
  sheet.setColumnWidth(14, 110); // Total Time Taken
  sheet.setColumnWidth(15, 200); // Remarks
  sheet.setColumnWidth(16, 160); // Last Updated

  // Set Timezone to Asia/Kolkata
  newSs.setSpreadsheetTimeZone("Asia/Kolkata");

  Logger.log("=================================================");
  Logger.log("🎉 NEW GOOGLE SHEET CREATED SUCCESSFULLY!");
  Logger.log("URL: " + newSs.getUrl());
  Logger.log("ID: " + newSs.getId());
  Logger.log("=================================================");

  return {
    url: newSs.getUrl(),
    id: newSs.getId()
  };
}

/**
 * Helper to get current IST formatted timestamp string
 */
function getISTDateTimeString() {
  return Utilities.formatDate(new Date(), "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss");
}

/**
 * Safe cell value formatter (handles Date objects and raw strings without crashing)
 */
function formatSafeCell(val, dateOnly) {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) {
    return Utilities.formatDate(val, "Asia/Kolkata", dateOnly ? "dd/MM/yyyy" : "HH:mm:ss");
  }
  return String(val).trim();
}

// ==============================================================================
// 1. Fetch All Tickets for the Admin Command Deck
// ==============================================================================
function getAdminDashboardData() {
  const sheet = getDbSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const rows = data.slice(1);
  return rows.map((r, idx) => ({
    rowIndex: idx + 2,
    ticketId: r[0] ? String(r[0]).trim() : ("DA-" + (1000 + idx)),
    subDate: formatSafeCell(r[1], true),
    subTime: formatSafeCell(r[2], false),
    name: r[3] || "",
    mobile: r[4] ? String(r[4]).trim() : "",
    email: r[5] || "",
    category: r[6] || "Student",
    membership: r[7] || "Silver",
    platform: r[8] || "Digital Azadi",
    query: r[9] || "",
    status: r[10] || "In Progress",
    startTime: formatSafeCell(r[11], false),
    endTime: formatSafeCell(r[12], false),
    duration: r[13] ? String(r[13]).trim() : "",
    remarks: r[14] || "",
    lastUpdated: (r[15] instanceof Date) ? Utilities.formatDate(r[15], "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss") : String(r[15] || "")
  })).reverse();
}

// ==============================================================================
// 2. Submit New Ticket from Public Portal
// ==============================================================================
function submitPublicTicket(payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {}

  try {
    const sheet = getDbSheet();
    const now = new Date();
    const subDate = Utilities.formatDate(now, "Asia/Kolkata", "dd/MM/yyyy");
    const subTime = Utilities.formatDate(now, "Asia/Kolkata", "HH:mm:ss");
    
    // Auto-generate unique Ticket ID in format DA-YYYY-XXXX
    const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    let code = "";
    for (let c = 0; c < 4; c++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const ticketId = "DA-" + now.getFullYear() + "-" + code;

    sheet.appendRow([
      ticketId,
      subDate,
      subTime,
      payload.name || payload.fullName || "",
      payload.mobile || payload.mobileNumber || "",
      payload.email || payload.emailAddress || "",
      payload.category || payload.userCategory || "Student",
      payload.membership || payload.membershipType || "Diamond",
      payload.platform || "Chakravyuh",
      payload.query || payload.queryDescription || "",
      "In Progress",
      "", // Start Time
      "", // End Time
      "", // Duration
      payload.remarks || "",
      subDate + " " + subTime
    ]);

    return { 
      success: true, 
      ticketId: ticketId, 
      subDate: subDate, 
      subTime: subTime,
      name: payload.name || payload.fullName,
      mobile: payload.mobile || payload.mobileNumber,
      category: payload.category || payload.userCategory,
      membership: payload.membership || payload.membershipType,
      platform: payload.platform,
      query: payload.query || payload.queryDescription,
      status: "In Progress"
    };
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// 3. Start Support Action (Records Start Time in IST without reload)
// ==============================================================================
function startSupportSession(ticketId) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {}

  try {
    const sheet = getDbSheet();
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    const timeStr = Utilities.formatDate(now, "Asia/Kolkata", "HH:mm:ss");
    const updateStr = Utilities.formatDate(now, "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss");

    const targetId = String(ticketId).trim().toUpperCase();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === targetId) {
        const row = i + 1;
        sheet.getRange(row, 11).setValue("In Progress");
        if (!data[i][11]) {
          sheet.getRange(row, 12).setValue(timeStr);
        }
        sheet.getRange(row, 16).setValue(updateStr);
        return { success: true, ticketId: ticketId, startTime: timeStr };
      }
    }
    return { success: false, message: "Ticket not found: " + ticketId };
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// 4. Mark Done & Calculate Resolution Duration (In-place update: zero duplicates)
// ==============================================================================
function completeSupportSession(ticketId, remarks) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {}

  try {
    const sheet = getDbSheet();
    const data = sheet.getDataRange().getValues();
    const now = new Date();
    const endTimeStr = Utilities.formatDate(now, "Asia/Kolkata", "HH:mm:ss");
    const updateStr = Utilities.formatDate(now, "Asia/Kolkata", "dd/MM/yyyy HH:mm:ss");

    const targetId = String(ticketId).trim().toUpperCase();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === targetId) {
        const row = i + 1;
        
        let startTimeStr = data[i][11];
        if (startTimeStr instanceof Date) {
          startTimeStr = Utilities.formatDate(startTimeStr, "Asia/Kolkata", "HH:mm:ss");
        } else if (!startTimeStr || String(startTimeStr).trim() === "") {
          startTimeStr = endTimeStr;
        } else {
          startTimeStr = String(startTimeStr).trim();
        }

        const duration = computeTimeDifference(startTimeStr, endTimeStr);

        sheet.getRange(row, 11).setValue("Done");
        sheet.getRange(row, 12).setValue(startTimeStr);
        sheet.getRange(row, 13).setValue(endTimeStr);
        sheet.getRange(row, 14).setValue(duration);
        if (remarks) sheet.getRange(row, 15).setValue(remarks);
        sheet.getRange(row, 16).setValue(updateStr);

        return { 
          success: true, 
          ticketId: ticketId,
          duration: duration, 
          startTime: startTimeStr,
          endTime: endTimeStr,
          status: "Done"
        };
      }
    }
    return { success: false, message: "Ticket not found: " + ticketId };
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// 5. Manual Time Override for Offline Support Calls
// ==============================================================================
function manualOverrideSession(ticketId, payload) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
  } catch (e) {}

  try {
    const sheet = getDbSheet();
    const data = sheet.getDataRange().getValues();
    const updateStr = getISTDateTimeString();
    const targetId = String(ticketId).trim().toUpperCase();

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim().toUpperCase() === targetId) {
        const row = i + 1;
        if (payload.status || payload.currentStatus) {
          sheet.getRange(row, 11).setValue(payload.status || payload.currentStatus);
        }
        if (payload.startTime || payload.supportStartTime) {
          sheet.getRange(row, 12).setValue(payload.startTime || payload.supportStartTime);
        }
        if (payload.endTime || payload.supportEndTime) {
          sheet.getRange(row, 13).setValue(payload.endTime || payload.supportEndTime);
        }
        
        // Duration recalculation
        let dur = payload.duration || payload.totalTimeTaken;
        if (!dur && (payload.startTime || payload.supportStartTime) && (payload.endTime || payload.supportEndTime)) {
          dur = computeTimeDifference(payload.startTime || payload.supportStartTime, payload.endTime || payload.supportEndTime);
        }
        if (dur) sheet.getRange(row, 14).setValue(dur);
        if (payload.remarks !== undefined) sheet.getRange(row, 15).setValue(payload.remarks);
        sheet.getRange(row, 16).setValue(updateStr);

        return { success: true, ticketId: ticketId, message: "Manual override saved." };
      }
    }
    return { success: false, message: "Ticket not found: " + ticketId };
  } finally {
    lock.releaseLock();
  }
}

// ==============================================================================
// 6. Bulletproof Duration Difference Calculation (HH:mm)
// ==============================================================================
function computeTimeDifference(startStr, endStr) {
  if (!startStr || !endStr) return "00:00";
  try {
    function toSeconds(str) {
      if (!str) return 0;
      str = String(str).trim();
      
      // 12-hour AM/PM format support
      var ampm = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
      if (ampm) {
        var h = parseInt(ampm[1], 10);
        var m = parseInt(ampm[2], 10);
        var s = ampm[3] ? parseInt(ampm[3], 10) : 0;
        if (ampm[4].toUpperCase() === "PM" && h < 12) h += 12;
        if (ampm[4].toUpperCase() === "AM" && h === 12) h = 0;
        return (h * 3600) + (m * 60) + s;
      }
      
      // 24-hour format
      var parts = str.split(":").map(Number);
      var h2 = parts[0] || 0;
      var m2 = parts[1] || 0;
      var s2 = parts[2] || 0;
      return (h2 * 3600) + (m2 * 60) + s2;
    }

    var sSec = toSeconds(startStr);
    var eSec = toSeconds(endStr);
    var diff = eSec - sSec;
    if (diff < 0) diff += 86400; // Cross-midnight adjustment

    var hrs = Math.floor(diff / 3600).toString().padStart(2, '0');
    var mins = Math.floor((diff % 3600) / 60).toString().padStart(2, '0');
    return hrs + ":" + mins;
  } catch (err) {
    return "00:00";
  }
}
