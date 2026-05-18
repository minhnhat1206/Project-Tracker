// Utils.gs — Helper functions dùng chung

function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTimestamp(date) {
  const d = date instanceof Date ? date : new Date(date)
  return d.toISOString()
}

function getSpreadsheet() {
  const props = PropertiesService.getScriptProperties()
  const id = props.getProperty('SPREADSHEET_ID')
  if (!id) throw new Error('App chưa được setup. Vui lòng chạy hàm setupApp() trong GAS editor.')
  return SpreadsheetApp.openById(id)
}

function getSheet(sheetName) {
  const ss = getSpreadsheet()
  const sheet = ss.getSheetByName(sheetName)
  if (!sheet) throw new Error(`Sheet "${sheetName}" not found`)
  return sheet
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName)
  const data = sheet.getDataRange().getValues()
  if (data.length < 2) return []
  const headers = data[0]
  return data.slice(1).map(row => {
    const obj = {}
    headers.forEach((header, i) => { obj[header] = row[i] })
    return obj
  })
}

function findRowById(sheetName, id) {
  const sheet = getSheet(sheetName)
  const data = sheet.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) return i + 1 // 1-based row index
  }
  return -1
}

function appendRow(sheetName, obj) {
  const sheet = getSheet(sheetName)
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '')
  sheet.appendRow(row)
}

function updateRow(sheetName, rowIndex, obj) {
  const sheet = getSheet(sheetName)
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  headers.forEach((header, i) => {
    if (obj[header] !== undefined) {
      sheet.getRange(rowIndex, i + 1).setValue(obj[header])
    }
  })
}

function deleteRow(sheetName, rowIndex) {
  const sheet = getSheet(sheetName)
  sheet.deleteRow(rowIndex)
}

function logSync(direction, service, taskId, status, message) {
  try {
    appendRow('SyncLog', {
      timestamp: formatTimestamp(new Date()),
      direction,
      service,
      task_id: taskId,
      status,
      message: message || '',
    })
  } catch (e) {
    console.error('logSync error:', e.message)
  }
}

// ─── SETUP (chạy 1 lần từ GAS editor) ────────────────────────────────────────

function setupApp() {
  const props = PropertiesService.getScriptProperties()

  // Tạo mới hoặc mở spreadsheet đã có
  let ss
  const existingId = props.getProperty('SPREADSHEET_ID')
  if (existingId) {
    try {
      ss = SpreadsheetApp.openById(existingId)
      console.log('Dùng spreadsheet đã có: ' + ss.getUrl())
    } catch (e) {
      ss = SpreadsheetApp.create('Project Tracker Data')
      props.setProperty('SPREADSHEET_ID', ss.getId())
      console.log('Tạo spreadsheet mới: ' + ss.getUrl())
    }
  } else {
    ss = SpreadsheetApp.create('Project Tracker Data')
    props.setProperty('SPREADSHEET_ID', ss.getId())
    console.log('Tạo spreadsheet mới: ' + ss.getUrl())
  }

  // Định nghĩa các sheet và header
  const sheets = {
    Projects: ['id', 'name', 'description', 'status', 'owner_email', 'member_emails', 'created_at'],
    Tasks: ['id', 'project_id', 'title', 'description', 'assignee_email', 'status', 'priority',
            'importance', 'estimated_hours', 'tags', 'deadline', 'calendar_event_id', 'gtask_id',
            'created_at', 'updated_at'],
    Members: ['id', 'email', 'display_name', 'role', 'joined_at'],
    SyncLog: ['timestamp', 'direction', 'service', 'task_id', 'status', 'message'],
  }

  Object.entries(sheets).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name)
    if (!sheet) {
      sheet = ss.insertSheet(name)
      sheet.getRange(1, 1, 1, headers.length).setValues([headers])
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold')
      sheet.setFrozenRows(1)
      console.log('Tạo sheet: ' + name)
    } else {
      console.log('Sheet đã có: ' + name)
    }

    // Thêm dropdown validation cho các cột có giá trị cố định
    if (name === 'Tasks') {
      const statusCol = headers.indexOf('status') + 1
      const priorityCol = headers.indexOf('priority') + 1
      const importanceCol = headers.indexOf('importance') + 1
      if (statusCol > 0) {
        const rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(['todo', 'in_progress', 'done', 'cancelled'], true).build()
        sheet.getRange(2, statusCol, 500, 1).setDataValidation(rule)
      }
      if (priorityCol > 0) {
        const rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(['urgent', 'not_urgent'], true).build()
        sheet.getRange(2, priorityCol, 500, 1).setDataValidation(rule)
      }
      if (importanceCol > 0) {
        const rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(['important', 'not_important'], true).build()
        sheet.getRange(2, importanceCol, 500, 1).setDataValidation(rule)
      }
    }
    if (name === 'Projects') {
      const statusCol = headers.indexOf('status') + 1
      if (statusCol > 0) {
        const rule = SpreadsheetApp.newDataValidation()
          .requireValueInList(['active', 'archived'], true).build()
        sheet.getRange(2, statusCol, 500, 1).setDataValidation(rule)
      }
    }
  })

  // Xoá sheet mặc định "Sheet1" nếu còn
  const defaultSheet = ss.getSheetByName('Sheet1')
  if (defaultSheet && ss.getSheets().length > 1) ss.deleteSheet(defaultSheet)

  console.log('✅ Setup hoàn tất!')
  console.log('📊 Spreadsheet URL: ' + ss.getUrl())
  return ss.getUrl()
}
