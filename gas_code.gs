
/**
 * EduPresensi - Backend Google Apps Script (Versi 34.0 - Fix Student PDF Report)
 */

const SS = SpreadsheetApp.getActiveSpreadsheet();
const ROOT_FOLDER_ID = 'PASTE_ID_FOLDER_DRIVE_ANDA_DISINI'; 

function safeRow(rowArray) {
  return rowArray.map(cell => {
    if (typeof cell === 'string' && cell.length > 49000) {
      return cell.substring(0, 48000) + "...[TRUNCATED]";
    }
    return cell;
  });
}

function getSafeRootFolder() {
  if (!ROOT_FOLDER_ID || ROOT_FOLDER_ID === 'PASTE_ID_FOLDER_DRIVE_ANDA_DISINI' || ROOT_FOLDER_ID.trim() === "") {
    return DriveApp.getRootFolder();
  }
  try {
    return DriveApp.getFolderById(ROOT_FOLDER_ID);
  } catch (e) {
    return DriveApp.getRootFolder();
  }
}

function getParam(e, name) {
  if (!e || !e.parameter) return "";
  if (e.parameter[name]) return e.parameter[name];
  if (e.parameters && e.parameters[name] && e.parameters[name].length > 0) return e.parameters[name][0];
  return "";
}

function createResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const action = getParam(e, "action").toString().trim().toLowerCase();
  const userId = getParam(e, "userId");
  const email = getParam(e, "email");
  const password = getParam(e, "password");
  const fileId = getParam(e, "fileId");
  
  try {
    switch (action) {
      case 'login': return createResponse(loginUser(email, password));
      case 'getattendance': return createResponse(getDataByUserId("Attendance", userId));
      case 'getleaves': return createResponse(getEnrichedRequests("Leaves", userId));
      case 'getcorrections': return createResponse(getEnrichedRequests("Corrections", userId));
      case 'getannouncements': return createResponse(getAllData("Announcements"));
      case 'getallusers': return createResponse(getAllData("Users"));
      case 'getschedules': return createResponse(getAllData("Schedules"));
      case 'getsettings': return createResponse(getSettings());
      case 'getfilebase64': return createResponse(getFileData(fileId));
      case 'generatepdf': return createResponse(generateAttendancePDF(userId));
      case 'generateadminreport':
        return createResponse(generateAdminReportPDF({
          startDate: getParam(e, "startDate"),
          endDate: getParam(e, "endDate"),
          userId: getParam(e, "filterUserId"),
          name: getParam(e, "filterName"),
          status: getParam(e, "filterStatus")
        }));
      case 'generateadminexcel':
        return createResponse(generateAdminReportExcel({
          startDate: getParam(e, "startDate"),
          endDate: getParam(e, "endDate"),
          userId: getParam(e, "filterUserId"),
          name: getParam(e, "filterName"),
          status: getParam(e, "filterStatus")
        }));
      default: return createResponse({ error: "Invalid action: " + action });
    }
  } catch (err) { 
    return createResponse({ error: "System Error: " + err.toString() }); 
  }
}

function doPost(e) {
  const action = getParam(e, "action").toString().trim().toLowerCase();
  let postData;
  try { postData = JSON.parse(e.postData.contents); } catch(err) { return createResponse({ error: "Invalid JSON" }); }

  try {
    switch (action) {
      case 'register': return createResponse(registerUser(postData));
      case 'bulkregister': return createResponse(bulkRegisterUsers(postData));
      case 'bulkschedules': return createResponse(bulkImportSchedules(postData));
      case 'updateschedule': return createResponse(updateSchedule(postData));
      case 'deleteschedule': return createResponse(deleteSchedule(postData.id));
      case 'submitattendance': return createResponse(saveAttendance(postData));
      case 'updateattendance': return createResponse(updateAttendance(postData));
      case 'submitleave': return createResponse(saveToSheet("Leaves", postData));
      case 'submitcorrection': return createResponse(saveToSheet("Corrections", postData));
      case 'updaterequeststatus': return createResponse(updateRequestStatus(postData));
      case 'addannouncement': return createResponse(addAnnouncement(postData));
      case 'updatesettings': return createResponse(updateSettings(postData));
      case 'changepassword': return createResponse(changePassword(postData));
      default: return createResponse({ error: "Invalid POST action" });
    }
  } catch (err) { return createResponse({ error: "POST Error: " + err.toString() }); }
}

function getAllData(name) {
  const sheet = SS.getSheetByName(name);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => h.toString().toLowerCase().replace(/\s+/g, ""));
  return data.slice(1).map(row => {
    let o = {};
    headers.forEach((h, idx) => o[h] = row[idx]);
    return o;
  });
}

function getEnrichedRequests(name, userId) {
  const requests = getAllData(name);
  const users = getAllData("Users");
  const userMap = {};
  users.forEach(u => {
    if (u.id) userMap[u.id.toString()] = { username: u.username, name: u.name, department: u.department };
  });

  const filtered = userId ? requests.filter(r => r.userid && r.userid.toString() === userId.toString()) : requests;

  return filtered.map(r => {
    const uInfo = userMap[r.userid ? r.userid.toString() : ""];
    return {
      ...r,
      username: uInfo ? uInfo.username : (r.username || "-"),
      name: uInfo ? uInfo.name : (r.name || r.username || "User"),
      department: uInfo ? uInfo.department : "-"
    };
  });
}

function getDataByUserId(name, userId) {
  const all = getAllData(name);
  if (!userId) return all;
  return all.filter(item => item.userid && item.userid.toString() === userId.toString());
}

function loginUser(email, password) {
  const data = getAllData("Users");
  const user = data.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { error: "User tidak ditemukan" };
  if (user.password.toString() !== password.toString()) return { error: "Password salah" };
  return user;
}

function saveToUserDrive(data, userName, userId, category, fileName) {
  if (!data) return "";
  const strData = data.toString();
  if (strData.startsWith("http")) return strData;
  if (!strData.includes("base64,")) return strData.substring(0, 48000);

  try {
    const rootFolder = getSafeRootFolder();
    const folderName = userName + " (" + userId + ")";
    const uFolders = rootFolder.getFoldersByName(folderName);
    const userFolder = uFolders.hasNext() ? uFolders.next() : rootFolder.createFolder(folderName);
    const cFolders = userFolder.getFoldersByName(category);
    const catFolder = cFolders.hasNext() ? cFolders.next() : userFolder.createFolder(category);
    const parts = strData.split(",");
    const decoded = Utilities.base64Decode(parts[1]);
    const blob = Utilities.newBlob(decoded, parts[0].split(":")[1].split(";")[0], fileName);
    const file = catFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return "https://drive.google.com/thumbnail?id=" + file.getId() + "&sz=w1000";
  } catch (e) {
    return "ERR_DRIVE_SAVE_FAILED"; 
  }
}

function registerUser(user) {
  const sheet = SS.getSheetByName("Users");
  const id = user.id || "U-" + Math.floor(Math.random() * 1000000); 
  const subjectsStr = Array.isArray(user.subjects) ? user.subjects.join(", ") : (user.subjects || "");
  // Columns: ID, Email, Name, Role, Dept, Password, (Reserved/Empty), Username, WhatsApp, Subjects
  sheet.appendRow(safeRow([id, user.email, user.name, "employee", user.department, "123456", "", user.username, user.whatsapp, subjectsStr]));
  return { id, ...user, role: "employee" };
}

function bulkRegisterUsers(students) {
  const sheet = SS.getSheetByName("Users");
  students.forEach(s => {
    const subjectsStr = Array.isArray(s.subjects) ? s.subjects.join(", ") : (s.subjects || "");
    sheet.appendRow(safeRow([s.id, s.email, s.name, s.role || "employee", s.department, s.password || "123456", "", s.username, s.whatsapp, subjectsStr]));
  });
  return { success: true };
}

function bulkImportSchedules(schedules) {
  const sheet = SS.getSheetByName("Schedules");
  schedules.forEach(s => {
    sheet.appendRow(safeRow(["SCH-" + Utilities.getUuid().substring(0, 8), s.level, s.className, s.subject, s.day, s.timeStart, s.timeEnd, s.teacher || "-"]));
  });
  return { success: true };
}

function saveAttendance(record) {
  const sheet = SS.getSheetByName("Attendance");
  const id = "ATT-" + Utilities.getUuid().substring(0, 8);
  const dateStr = record.date || Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy");
  // Columns: ID, UserID, Date, In, Out, LatIn, LngIn, LatOut, LngOut, Status, (Reserved/Empty SelfieIn), (Reserved/Empty SelfieOut), WiFi, UserName
  sheet.appendRow(safeRow([id, record.userId, dateStr, record.clockIn, "", record.latIn, record.lngIn, "", "", record.status, "", "", record.wifiVerified, record.userName]));
  return { id };
}

function updateAttendance(u) {
  const sheet = SS.getSheetByName("Attendance");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === u.id.toString()) {
      sheet.getRange(i + 1, 5).setValue(u.clockOut);
      sheet.getRange(i + 1, 8).setValue(u.latOut);
      sheet.getRange(i + 1, 9).setValue(u.lngOut);
      // Row 12 is SelfieOut, set to empty
      sheet.getRange(i + 1, 12).setValue("");
      return { success: true };
    }
  }
  return { success: false };
}

function saveToSheet(name, data) {
  const sheet = SS.getSheetByName(name);
  const id = "REQ-" + Utilities.getUuid().substring(0, 8);
  if (name === "Leaves") {
    sheet.appendRow(safeRow([id, data.userId, data.userName || "Siswa", data.type, data.startDate, data.endDate, data.reason, "pending"]));
  } else if (name === "Corrections") {
    sheet.appendRow(safeRow([id, data.userId, data.date, data.requestedTime, data.reason, "pending"]));
  }
  return { id, status: "pending" };
}

function updateSettings(settings) {
  const sheet = SS.getSheetByName("Settings");
  for (let key in settings) {
    let val = settings[key];
    if (key === "logo_left" || key === "logo_right") {
      if (val && val.toString().includes("base64,")) {
        val = saveToUserDrive(val, "Settings", "Branding", "Assets", key + ".jpg");
      }
    }
    const data = sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) { 
        sheet.getRange(i+1, 2).setValue(val); 
        found = true; 
        break; 
      }
    }
    if (!found) sheet.appendRow(safeRow([key, val]));
  }
  return { success: true };
}

function getSettings() {
  const sheet = SS.getSheetByName("Settings");
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  let set = {};
  for (let i = 1; i < data.length; i++) if (data[i][0]) set[data[i][0]] = data[i][1];
  return set;
}

function getDriveBase64(url) {
  if (!url || !url.includes("id=")) return "";
  try {
    const id = url.split("id=")[1].split("&")[0];
    const file = DriveApp.getFileById(id);
    const blob = file.getBlob();
    return "data:" + blob.getContentType() + ";base64," + Utilities.base64Encode(blob.getBytes());
  } catch (e) {
    return "";
  }
}

/**
 * Generate PDF Laporan untuk Siswa (Halaman Riwayat Presensi)
 */
function generateAttendancePDF(userId) {
  const s = getSettings();
  const attendance = getDataByUserId("Attendance", userId);
  const users = getAllData("Users");
  const user = users.find(u => u.id.toString() === userId.toString());
  
  const logoLeftBase64 = getDriveBase64(s.logo_left);
  const logoRightBase64 = getDriveBase64(s.logo_right);

  const html = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 10px; font-size: 11px; }
          .kop-container { width: 100%; display: table; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
          .kop-logo { display: table-cell; vertical-align: middle; width: 80px; text-align: center; }
          .kop-logo img { max-width: 70px; max-height: 70px; }
          .kop-text { display: table-cell; vertical-align: middle; text-align: center; }
          .kop h4 { margin: 0; text-transform: uppercase; font-size: 14px; }
          .kop h2 { margin: 5px 0; text-transform: uppercase; font-size: 18px; color: #1e3a8a; }
          .kop p { margin: 2px 0; font-size: 10px; }
          .user-info { margin-bottom: 20px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; }
          th { background: #f2f2f2; font-weight: bold; }
          .signature { margin-top: 40px; width: 100%; }
          .signature td { border: none; text-align: center; width: 50%; }
        </style>
      </head>
      <body>
        <div class="kop-container">
          <div class="kop-logo">${logoLeftBase64 ? `<img src="${logoLeftBase64}">` : ''}</div>
          <div class="kop-text">
            <h4>${s.dept_name || "DINAS PENDIDIKAN"}</h4>
            <h2>${s.school_name || "NAMA SEKOLAH"}</h2>
            <p>${s.school_address || "Alamat Belum Diatur"}</p>
          </div>
          <div class="kop-logo">${logoRightBase64 ? `<img src="${logoRightBase64}">` : ''}</div>
        </div>
        <h3 style="text-align:center; text-decoration: underline;">LAPORAN KEHADIRAN SISWA</h3>
        <div class="user-info">
          <p>NAMA : ${user ? user.name : "-"}</p>
          <p>NISN : ${userId}</p>
          <p>KELAS : ${user ? user.department : "-"}</p>
        </div>
        <table>
          <thead><tr><th>NO</th><th>TANGGAL</th><th>JAM MASUK</th><th>JAM PULANG</th><th>STATUS</th></tr></thead>
          <tbody>${attendance.map((r, i) => `<tr><td>${i+1}</td><td>${r.date}</td><td>${r.clockin}</td><td>${r.clockout || '--'}</td><td style="text-transform:uppercase;">${r.status}</td></tr>`).join('')}</tbody>
        </table>
        <div class="signature">
          <table style="border:none; width:100%;">
            <tr>
              <td><p>Mengetahui,</p><p>Kepala Sekolah</p><br><br><br><p><b><u>${s.principal_name || "..................."}</u></b></p><p>NIP. ${s.principal_nip || "-"}</p></td>
              <td><p>${s.city_location || "Ditetapkan"}, ${Utilities.formatDate(new Date(), "GMT+7", "dd MMMM yyyy")}</p><p>Orang Tua / Wali Siswa</p><br><br><br><p><b><u>( ............................ )</u></b></p></td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
  const blob = Utilities.newBlob(html, 'text/html', 'Laporan_Siswa.html').getAs('application/pdf');
  return { base64: Utilities.base64Encode(blob.getBytes()), fileName: "Laporan_Presensi_" + userId + ".pdf" };
}

function generateAdminReportPDF(f) {
  const s = getSettings();
  const data = filterAttendanceData(f);
  const logoLeftBase64 = getDriveBase64(s.logo_left);
  const logoRightBase64 = getDriveBase64(s.logo_right);

  const html = `
    <html>
      <head>
        <style>
          body { font-family: sans-serif; padding: 10px; font-size: 11px; }
          .kop-container { width: 100%; display: table; border-bottom: 3px double #000; padding-bottom: 10px; margin-bottom: 20px; }
          .kop-logo { display: table-cell; vertical-align: middle; width: 80px; text-align: center; }
          .kop-logo img { max-width: 70px; max-height: 70px; }
          .kop-text { display: table-cell; vertical-align: middle; text-align: center; }
          .kop h4 { margin: 0; text-transform: uppercase; font-size: 14px; }
          .kop h2 { margin: 5px 0; text-transform: uppercase; font-size: 18px; color: #1e3a8a; }
          .kop p { margin: 2px 0; font-size: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 6px; text-align: center; }
          th { background: #f2f2f2; font-weight: bold; }
          .signature { margin-top: 40px; width: 100%; }
          .signature td { border: none; text-align: center; width: 50%; }
        </style>
      </head>
      <body>
        <div class="kop-container">
          <div class="kop-logo">${logoLeftBase64 ? `<img src="${logoLeftBase64}">` : ''}</div>
          <div class="kop-text">
            <h4>${s.dept_name || "DINAS PENDIDIKAN"}</h4>
            <h2>${s.school_name || "NAMA SEKOLAH"}</h2>
            <p>${s.school_address || "Alamat Belum Diatur"}</p>
          </div>
          <div class="kop-logo">${logoRightBase64 ? `<img src="${logoRightBase64}">` : ''}</div>
        </div>
        <h3 style="text-align:center; text-decoration: underline;">LAPORAN REKAPITULASI KEHADIRAN</h3>
        <p>Periode: ${f.startDate || "-"} s/d ${f.endDate || "-"}</p>
        <table>
          <thead><tr><th>NO</th><th>NISN</th><th>NAMA SISWA</th><th>TANGGAL</th><th>JAM</th><th>STATUS</th></tr></thead>
          <tbody>${data.map((r, i) => `<tr><td>${i+1}</td><td>${r.userid}</td><td style="text-align:left;">${r.username}</td><td>${r.date}</td><td>${r.clockin}</td><td style="text-transform:uppercase;">${r.status}</td></tr>`).join('')}</tbody>
        </table>
        <div class="signature">
          <table style="border:none; width:100%;">
            <tr>
              <td><p>Mengetahui,</p><p>Kepala Sekolah</p><br><br><br><p><b><u>${s.principal_name || "..................."}</u></b></p><p>NIP. ${s.principal_nip || "-"}</p></td>
              <td><p>${s.city_location || "Ditetapkan"}, ${Utilities.formatDate(new Date(), "GMT+7", "dd MMMM yyyy")}</p><p>Guru Mata Pelajaran</p><br><br><br><p><b><u>${s.teacher_name || "..................."}</u></b></p><p>NIP. ${s.teacher_nip || "-"}</p></td>
            </tr>
          </table>
        </div>
      </body>
    </html>
  `;
  const blob = Utilities.newBlob(html, 'text/html', 'Laporan.html').getAs('application/pdf');
  return { base64: Utilities.base64Encode(blob.getBytes()), fileName: "Rekap_Presensi.pdf" };
}

function generateAdminReportExcel(f) {
  const s = getSettings();
  const data = filterAttendanceData(f);
  const tempSS = SpreadsheetApp.create("TempExport_" + Utilities.getUuid());
  const sheet = tempSS.getSheets()[0];
  
  sheet.getRange("A1:F1").merge().setValue(s.dept_name || "DINAS PENDIDIKAN").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("A2:F2").merge().setValue(s.school_name || "NAMA SEKOLAH").setHorizontalAlignment("center").setFontSize(14).setFontWeight("bold");
  sheet.getRange("A3:F3").merge().setValue(s.school_address || "").setHorizontalAlignment("center").setFontSize(9);
  sheet.getRange("A4:F4").merge().setBackground("#000000");
  sheet.getRange("A6:F6").merge().setValue("LAPORAN REKAPITULASI KEHADIRAN").setHorizontalAlignment("center").setFontWeight("bold");
  sheet.getRange("A7:F7").merge().setValue("Periode: " + (f.startDate || "-") + " s/d " + (f.endDate || "-")).setHorizontalAlignment("center");
  
  const tableHead = ["NO", "NISN", "NAMA SISWA", "TANGGAL", "JAM", "STATUS"];
  sheet.getRange(9, 1, 1, 6).setValues([tableHead]).setBackground("#f2f2f2").setFontWeight("bold").setBorder(true, true, true, true, true, true);
  
  const rows = data.map((r, i) => [i+1, r.userid, r.username, r.date, r.clockin, r.status.toUpperCase()]);
  if (rows.length > 0) sheet.getRange(10, 1, rows.length, 6).setValues(rows).setBorder(true, true, true, true, true, true);
  
  const startSignRow = 10 + rows.length + 2;
  sheet.getRange(startSignRow, 1).setValue("Mengetahui,");
  sheet.getRange(startSignRow, 5).setValue((s.city_location || "Ditetapkan") + ", " + Utilities.formatDate(new Date(), "GMT+7", "dd MMMM yyyy"));
  sheet.getRange(startSignRow + 1, 1).setValue("Kepala Sekolah");
  sheet.getRange(startSignRow + 1, 5).setValue("Guru Mata Pelajaran");
  sheet.getRange(startSignRow + 5, 1).setValue(s.principal_name || "...................");
  sheet.getRange(startSignRow + 5, 5).setValue(s.teacher_name || "...................");
  sheet.getRange(startSignRow + 6, 1).setValue("NIP. " + (s.principal_nip || "-"));
  sheet.getRange(startSignRow + 6, 5).setValue("NIP. " + (s.teacher_nip || "-"));

  SpreadsheetApp.flush();
  const url = "https://docs.google.com/spreadsheets/d/" + tempSS.getId() + "/export?format=xlsx";
  const options = { headers: { Authorization: "Bearer " + ScriptApp.getOAuthToken() } };
  const res = UrlFetchApp.fetch(url, options);
  DriveApp.getFileById(tempSS.getId()).setTrashed(true);
  return { base64: Utilities.base64Encode(res.getBlob().getBytes()), fileName: "Rekap_Presensi.xlsx" };
}

function filterAttendanceData(f) {
  const attendance = getAllData("Attendance");
  const users = getAllData("Users");
  const userMap = {};
  users.forEach(u => { if (u.id) userMap[u.id.toString()] = u.name; });
  
  return attendance.filter(rec => {
    if (!rec.username && rec.userid) rec.username = userMap[rec.userid.toString()] || "ID: " + rec.userid;
    let match = true;
    if (f.userId && !rec.userid.toString().includes(f.userId)) match = false;
    if (f.name && !rec.username.toLowerCase().includes(f.name.toLowerCase())) match = false;
    if (f.status && rec.status.toLowerCase() !== f.status.toLowerCase()) match = false;
    if (f.startDate || f.endDate) {
      const parts = rec.date.split('/');
      const recDate = new Date(parts[2], parts[1] - 1, parts[0]);
      if (f.startDate && recDate < new Date(f.startDate)) match = false;
      if (f.endDate && recDate > new Date(f.endDate)) match = false;
    }
    return match;
  });
}

function getFileData(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    return { base64: Utilities.base64Encode(file.getBlob().getBytes()), mimeType: file.getBlob().getContentType() };
  } catch (e) { return { error: e.toString() }; }
}

function changePassword(d) {
  const sheet = SS.getSheetByName("Users");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0].toString() === d.userId.toString()) {
      if (values[i][5].toString() !== d.current.toString()) return { error: "Password lama salah." };
      sheet.getRange(i+1, 6).setValue(d.newPass); return { success: true };
    }
  }
  return { error: "User tidak ditemukan." };
}

function updateSchedule(u) {
  const sheet = SS.getSheetByName("Schedules");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === u.id.toString()) {
      sheet.getRange(i+1, 2, 1, 7).setValues([[u.level, u.className, u.subject, u.day, u.timeStart, u.timeEnd, u.teacher || "-"]]);
      return { success: true };
    }
  }
  return { success: false };
}

function deleteSchedule(id) {
  const sheet = SS.getSheetByName("Schedules");
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === id.toString()) { sheet.deleteRow(i + 1); return { success: true }; }
  }
  return { success: false };
}

function updateRequestStatus(u) {
  const name = u.type === 'leave' ? 'Leaves' : 'Corrections';
  const sheet = SS.getSheetByName(name);
  const data = sheet.getDataRange().getValues();
  const col = name === 'Leaves' ? 8 : 6;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === u.id.toString()) { sheet.getRange(i + 1, col).setValue(u.status); return { success: true }; }
  }
  return { success: false };
}

function addAnnouncement(ann) {
  const sheet = SS.getSheetByName("Announcements");
  sheet.appendRow(safeRow([Utilities.getUuid().substring(0, 8), ann.title, ann.content, Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm"), ann.author || "Admin"]));
  return { success: true };
}
