// Sync.gs — Đồng bộ 2 chiều với Google Tasks

// ─── GOOGLE TASKS (chỉ minhnhatnhc@gmail.com) ─────────────────────────────

function pushTaskToGoogleTasks(task) {
  const effectiveEmail = Session.getEffectiveUser().getEmail()
  if (!isSyncUser(effectiveEmail)) return

  try {
    const project = getProjectById(task.project_id)
    const tasklistId = ensureTasklist(project.name)
    const dueDate = task.deadline ? new Date(task.deadline + 'T00:00:00.000Z').toISOString() : undefined
    const taskBody = {
      title: task.title,
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
      Tasks.Tasks.patch(taskBody, tasklistId, gtaskId)
      logSync('push', 'tasks', task.id, 'success', 'Updated gtask ' + gtaskId)
    }
  } catch (e) {
    logSync('push', 'tasks', task.id, 'error', e.message)
    throw e
  }
}

function pullFromGoogleTasks() {
  const currentEmail = getCurrentUser().email
  if (!isSyncUser(currentEmail)) return

  const props = PropertiesService.getScriptProperties()
  const lastSyncTime = props.getProperty('lastGTaskSync') || '2020-01-01T00:00:00Z'

  try {
    const tasklists = Tasks.Tasklists.list().items || []
    const tasks = getSheetData('Tasks')

    tasklists.forEach(list => {
      try {
        const completedTasks = Tasks.Tasks.list(list.id, {
          updatedMin: lastSyncTime,
          showCompleted: true,
          showHidden: true,
        }).items || []

        completedTasks.filter(t => t.status === 'completed').forEach(gtask => {
          const task = tasks.find(t => t.gtask_id === gtask.id)
          if (!task || task.status === 'done') return
          const rowIndex = findRowById('Tasks', task.id)
          if (rowIndex !== -1) {
            updateRow('Tasks', rowIndex, { status: 'done', updated_at: formatTimestamp(new Date()) })
            logSync('pull', 'tasks', task.id, 'success', 'Set done via gtask completion')
          }
        })
      } catch (e) {
        logSync('pull', 'tasks', '', 'error', 'List ' + list.id + ': ' + e.message)
      }
    })
  } catch (e) {
    logSync('pull', 'tasks', '', 'error', e.message)
  }
}

function ensureTasklist(projectName) {
  const props = PropertiesService.getScriptProperties()
  const cacheKey = 'tasklist_' + projectName
  const cached = props.getProperty(cacheKey)
  if (cached) return cached

  const listName = '[PM] ' + projectName
  const existing = Tasks.Tasklists.list().items || []
  let found = existing.find(l => l.title === listName)

  if (!found) {
    found = Tasks.Tasklists.insert({ title: listName })
  }

  props.setProperty(cacheKey, found.id)
  return found.id
}

function deleteGoogleTask(tasklistId, gtaskId) {
  const currentEmail = getCurrentUser().email
  if (!isSyncUser(currentEmail)) return

  try {
    Tasks.Tasks.remove(tasklistId, gtaskId)
    logSync('push', 'tasks', '', 'success', 'Deleted gtask ' + gtaskId)
  } catch (e) {
    logSync('push', 'tasks', '', 'error', e.message)
  }
}

function syncAll() {
  const props = PropertiesService.getScriptProperties()
  const effectiveEmail = Session.getEffectiveUser().getEmail()

  if (isSyncUser(effectiveEmail)) {
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
