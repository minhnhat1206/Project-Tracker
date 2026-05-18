// Sync.gs — Đồng bộ 2 chiều với Google Calendar và Google Tasks

// ─── CALENDAR ────────────────────────────────────────────────────────────────

function pushTaskToCalendar(task) {
  if (!task.deadline) return

  let projectName = ''
  try {
    const project = getProjectById(task.project_id)
    projectName = project.name
  } catch (e) {}

  const description = `Project: ${projectName}\nAssignee: ${task.assignee_email}\n\n${task.description || ''}`

  let eventId = task.calendar_event_id

  try {
    if (!eventId) {
      const event = Calendar.Events.insert({
        summary: task.title,
        description,
        start: { date: task.deadline },
        end: { date: task.deadline },
      }, 'primary')
      eventId = event.id
      const rowIndex = findRowById('Tasks', task.id)
      if (rowIndex !== -1) updateRow('Tasks', rowIndex, { calendar_event_id: eventId })
      logSync('push', 'calendar', task.id, 'success', 'Created event ' + eventId)
    } else {
      Calendar.Events.update({
        summary: task.title,
        description,
        start: { date: task.deadline },
        end: { date: task.deadline },
      }, 'primary', eventId)
      logSync('push', 'calendar', task.id, 'success', 'Updated event ' + eventId)
    }
  } catch (e) {
    logSync('push', 'calendar', task.id, 'error', e.message)
    throw e
  }
}

function pullFromCalendar() {
  const props = PropertiesService.getScriptProperties()
  const lastSyncTime = props.getProperty('lastCalendarSync') || '2020-01-01T00:00:00Z'

  try {
    const response = Calendar.Events.list('primary', {
      updatedMin: lastSyncTime,
      singleEvents: true,
      maxResults: 100,
    })
    const events = response.items || []
    const tasks = getSheetData('Tasks')

    events.forEach(event => {
      const task = tasks.find(t => t.calendar_event_id === event.id)
      if (!task) return
      const rowIndex = findRowById('Tasks', task.id)
      if (rowIndex === -1) return

      if (event.status === 'cancelled') {
        updateRow('Tasks', rowIndex, { status: 'cancelled', updated_at: formatTimestamp(new Date()) })
        logSync('pull', 'calendar', task.id, 'success', 'Set cancelled (event deleted)')
      } else {
        const newDate = event.start && event.start.date
        if (newDate && newDate !== task.deadline) {
          updateRow('Tasks', rowIndex, { deadline: newDate, updated_at: formatTimestamp(new Date()) })
          logSync('pull', 'calendar', task.id, 'success', 'Updated deadline to ' + newDate)
        }
      }
    })
  } catch (e) {
    logSync('pull', 'calendar', '', 'error', e.message)
  }
}

function deleteCalendarEvent(calendarEventId) {
  try {
    Calendar.Events.remove('primary', calendarEventId)
    logSync('push', 'calendar', '', 'success', 'Deleted event ' + calendarEventId)
  } catch (e) {
    logSync('push', 'calendar', '', 'error', e.message)
  }
}

// ─── GOOGLE TASKS ─────────────────────────────────────────────────────────────
// Tất cả tasks gom vào 1 danh sách "Project Tracker", tên task: [ProjectName] Task title

function ensureTasklist() {
  const props = PropertiesService.getScriptProperties()
  const cacheKey = 'tasklist_ProjectTracker'
  const cached = props.getProperty(cacheKey)
  if (cached) return cached

  const listName = 'Project Tracker'
  const existing = Tasks.Tasklists.list().items || []
  let found = existing.find(l => l.title === listName)
  if (!found) {
    found = Tasks.Tasklists.insert({ title: listName })
  }
  props.setProperty(cacheKey, found.id)
  return found.id
}

function pushTaskToGoogleTasks(task) {
  const effectiveEmail = Session.getEffectiveUser().getEmail()
  if (!isSyncUser(effectiveEmail)) return

  try {
    const project = getProjectById(task.project_id)
    const tasklistId = ensureTasklist()
    const taskTitle = '[' + project.name + '] ' + task.title
    const dueDate = task.deadline ? new Date(task.deadline + 'T00:00:00.000Z').toISOString() : undefined
    const taskBody = {
      title: taskTitle,
      notes: task.description || '',
      status: task.status === 'done' ? 'completed' : 'needsAction',
    }
    if (dueDate) taskBody.due = dueDate

    let gtaskId = task.gtask_id
    if (!gtaskId) {
      const created = Tasks.Tasks.insert(taskBody, tasklistId)
      gtaskId = created.id
      const rowIndex = findRowById('Tasks', task.id)
      if (rowIndex !== -1) updateRow('Tasks', rowIndex, { gtask_id: gtaskId })
      logSync('push', 'tasks', task.id, 'success', 'Created gtask ' + gtaskId)
    } else {
      try {
        Tasks.Tasks.patch(taskBody, tasklistId, gtaskId)
        logSync('push', 'tasks', task.id, 'success', 'Updated gtask ' + gtaskId)
      } catch (patchErr) {
        // Task thuộc list cũ hoặc không tồn tại — tạo lại trong list mới
        const rowIndex = findRowById('Tasks', task.id)
        const created = Tasks.Tasks.insert(taskBody, tasklistId)
        if (rowIndex !== -1) updateRow('Tasks', rowIndex, { gtask_id: created.id })
        logSync('push', 'tasks', task.id, 'success', 'Re-created gtask ' + created.id)
      }
    }
  } catch (e) {
    logSync('push', 'tasks', task.id, 'error', e.message)
    throw e
  }
}

function pullFromGoogleTasks() {
  const effectiveEmail = Session.getEffectiveUser().getEmail()
  if (!isSyncUser(effectiveEmail)) return

  const props = PropertiesService.getScriptProperties()
  const lastSyncTime = props.getProperty('lastGTaskSync') || '2020-01-01T00:00:00Z'

  try {
    // Chỉ đọc list "Project Tracker" (không quét tất cả lists nữa)
    const tasklistId = ensureTasklist()
    const sheetTasks = getSheetData('Tasks')

    try {
      const result = Tasks.Tasks.list(tasklistId, {
        updatedMin: lastSyncTime,
        showCompleted: true,
        showHidden: true,
        maxResults: 200,
      })
      const gtasks = result.items || []

      gtasks.forEach(gtask => {
        const sheetTask = sheetTasks.find(t => t.gtask_id === gtask.id)
        if (!sheetTask) return

        const rowIndex = findRowById('Tasks', sheetTask.id)
        if (rowIndex === -1) return

        if (gtask.status === 'completed' && sheetTask.status !== 'done') {
          updateRow('Tasks', rowIndex, { status: 'done', updated_at: formatTimestamp(new Date()) })
          logSync('pull', 'tasks', sheetTask.id, 'success', 'Set done via gtask completion')
        } else if (gtask.status === 'needsAction' && sheetTask.status === 'done') {
          updateRow('Tasks', rowIndex, { status: 'todo', updated_at: formatTimestamp(new Date()) })
          logSync('pull', 'tasks', sheetTask.id, 'success', 'Set todo via gtask uncomplete')
        }
      })
    } catch (e) {
      logSync('pull', 'tasks', '', 'error', 'List read error: ' + e.message)
    }
  } catch (e) {
    logSync('pull', 'tasks', '', 'error', e.message)
  }
}

function deleteGoogleTask(tasklistId, gtaskId) {
  const effectiveEmail = Session.getEffectiveUser().getEmail()
  if (!isSyncUser(effectiveEmail)) return

  try {
    // Luôn xóa trong list "Project Tracker"
    const singleListId = ensureTasklist()
    Tasks.Tasks.remove(singleListId, gtaskId)
    logSync('push', 'tasks', '', 'success', 'Deleted gtask ' + gtaskId)
  } catch (e) {
    logSync('push', 'tasks', '', 'error', e.message)
  }
}

function syncAll() {
  const props = PropertiesService.getScriptProperties()
  const currentEmail = Session.getEffectiveUser().getEmail()

  try {
    pullFromCalendar()
  } catch (e) {
    logSync('pull', 'calendar', '', 'error', e.message)
  }

  try {
    const tasks = getSheetData('Tasks')
    tasks.filter(t => t.deadline && !t.calendar_event_id && t.status !== 'cancelled').forEach(task => {
      try { pushTaskToCalendar(task) } catch (e) {}
    })
  } catch (e) {
    logSync('push', 'calendar', '', 'error', e.message)
  }

  if (isSyncUser(currentEmail)) {
    try { pullFromGoogleTasks() } catch (e) { logSync('pull', 'tasks', '', 'error', e.message) }
    try {
      const tasks = getSheetData('Tasks')
      tasks.filter(t => t.status !== 'cancelled').forEach(task => {
        try { pushTaskToGoogleTasks(task) } catch (e) {}
      })
    } catch (e) {
      logSync('push', 'tasks', '', 'error', e.message)
    }
  }

  const now = formatTimestamp(new Date())
  props.setProperty('lastCalendarSync', now)
  props.setProperty('lastGTaskSync', now)
  props.setProperty('lastSyncTime', now)

  return { lastSynced: now }
}

function setupTriggers() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'syncAll')
    .forEach(t => ScriptApp.deleteTrigger(t))

  ScriptApp.newTrigger('syncAll')
    .timeBased()
    .everyMinutes(30)
    .create()

  return 'Trigger set up: syncAll every 30 minutes'
}
