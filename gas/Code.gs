// Code.gs — Entry point, routing, serve web app

function doGet(e) {
  const html = HtmlService.createHtmlOutputFromFile('index')
  html.setTitle('Project Tracker')
  html.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
  html.addMetaTag('viewport', 'width=device-width, initial-scale=1')
  return html
}

function diagnose() {
  const result = {}
  try {
    const props = PropertiesService.getScriptProperties()
    result.spreadsheetId = props.getProperty('SPREADSHEET_ID') || '❌ CHƯA SET'
    result.user = Session.getActiveUser().getEmail() || '❌ KHÔNG LẤY ĐƯỢC EMAIL'

    const ss = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'))
    result.spreadsheetUrl = ss.getUrl()

    const sheets = ['Projects', 'Tasks', 'Members', 'SyncLog']
    result.sheets = {}
    sheets.forEach(name => {
      const sheet = ss.getSheetByName(name)
      if (!sheet) { result.sheets[name] = '❌ KHÔNG TỒN TẠI'; return }
      const rows = sheet.getLastRow() - 1
      result.sheets[name] = rows + ' rows'
    })

    result.syncLog = []
    try {
      const log = ss.getSheetByName('SyncLog')
      if (log && log.getLastRow() > 1) {
        const data = log.getRange(Math.max(2, log.getLastRow() - 4), 1, Math.min(5, log.getLastRow() - 1), 6).getValues()
        result.syncLog = data.map(r => ({ time: r[0], dir: r[1], svc: r[2], status: r[4], msg: r[5] }))
      }
    } catch (e) {}

    result.status = '✅ OK'
  } catch (e) {
    result.status = '❌ LỖI: ' + e.message
  }
  console.log(JSON.stringify(result, null, 2))
  return result
}

function process(action, payload) {
  try {
    let result

    switch (action) {
      case 'getCurrentUser':
        result = getCurrentUser()
        break
      case 'getProjects':
        result = getProjects(payload && payload.userEmail)
        break
      case 'getProjectById':
        result = getProjectById(payload.id)
        break
      case 'createProject':
        result = createProject(payload)
        break
      case 'updateProject':
        result = updateProject(payload.id, payload)
        break
      case 'archiveProject':
        result = archiveProject(payload.id)
        break
      case 'addMember':
        result = addMember(payload.projectId, payload.email)
        break
      case 'removeMember':
        result = removeMember(payload.projectId, payload.email)
        break
      case 'getMembers':
        result = getMembers(payload.projectId)
        break
      case 'getTasks':
        result = getTasks(payload.projectId, payload.filters)
        break
      case 'getTaskById':
        result = getTaskById(payload.id)
        break
      case 'createTask':
        result = createTask(payload)
        break
      case 'updateTask':
        result = updateTask(payload.id, payload)
        break
      case 'deleteTask':
        result = deleteTask(payload.id)
        break
      case 'bulkUpdateStatus':
        result = bulkUpdateStatus(payload.ids, payload.status)
        break
      case 'getEisenhowerMatrix':
        result = getEisenhowerMatrix(payload.projectId)
        break
      case 'syncNow':
        result = syncAll()
        break
      case 'setupTriggers':
        result = setupTriggers()
        break
      case 'diagnose':
        result = diagnose()
        break
      default:
        throw new Error('Unknown action: ' + action)
    }

    return { success: true, data: result }
  } catch (e) {
    console.error('process error:', action, e.message)
    return { success: false, error: e.message }
  }
}
