// Tasks.gs — CRUD cho Tasks, phân loại Eisenhower

function createTask(data) {
  requireMember(data.project_id)
  const currentEmail = getCurrentUser().email
  const now = formatTimestamp(new Date())
  const id = generateId()

  const task = {
    id,
    project_id: data.project_id,
    title: data.title || '',
    description: data.description || '',
    assignee_email: data.assignee_email || currentEmail,
    status: data.status || 'todo',
    priority: data.priority || 'not_urgent',
    importance: data.importance || 'important',
    estimated_hours: data.estimated_hours || '',
    tags: data.tags || '',
    deadline: data.deadline || '',
    calendar_event_id: '',
    gtask_id: '',
    created_at: now,
    updated_at: now,
  }

  appendRow('Tasks', task)

  // Trigger sync
  const effectiveEmail = Session.getEffectiveUser().getEmail()
  if (task.deadline) {
    try { pushTaskToCalendar(task) } catch (e) { logSync('push', 'calendar', id, 'error', e.message) }
  }
  if (isSyncUser(effectiveEmail)) {
    try { pushTaskToGoogleTasks(task) } catch (e) { logSync('push', 'tasks', id, 'error', e.message) }
  }

  return task
}

function getTasks(projectId, filters) {
  requireMember(projectId)
  let rows = getSheetData('Tasks').filter(t => t.project_id === projectId)

  if (filters) {
    if (filters.assignee_email) rows = rows.filter(t => t.assignee_email === filters.assignee_email)
    if (filters.status) rows = rows.filter(t => t.status === filters.status)
    if (filters.tags && filters.tags.length > 0) {
      rows = rows.filter(t => {
        const taskTags = t.tags ? t.tags.split(',') : []
        return filters.tags.some(tag => taskTags.includes(tag))
      })
    }
    if (filters.deadline_from) rows = rows.filter(t => t.deadline >= filters.deadline_from)
    if (filters.deadline_to) rows = rows.filter(t => t.deadline <= filters.deadline_to)
  }

  return rows
}

function getTaskById(id) {
  const rows = getSheetData('Tasks')
  const task = rows.find(t => t.id === id)
  if (!task) throw new Error('Task not found')
  requireMember(task.project_id)
  return task
}

function updateTask(id, data) {
  const task = getTaskById(id)
  requireMember(task.project_id)

  const rowIndex = findRowById('Tasks', id)
  const now = formatTimestamp(new Date())
  const allowed = {
    title: data.title,
    description: data.description,
    assignee_email: data.assignee_email,
    status: data.status,
    priority: data.priority,
    importance: data.importance,
    estimated_hours: data.estimated_hours,
    tags: data.tags,
    deadline: data.deadline,
    updated_at: now,
  }
  Object.keys(allowed).forEach(k => { if (allowed[k] === undefined) delete allowed[k] })
  updateRow('Tasks', rowIndex, allowed)

  const updated = { ...task, ...allowed }
  // Sync xảy ra qua syncAll (Sync Now / auto-trigger), không sync trực tiếp ở đây để tránh chậm
  return updated
}

function deleteTask(id) {
  const task = getTaskById(id)
  requireMember(task.project_id)

  if (task.calendar_event_id) {
    try { deleteCalendarEvent(task.calendar_event_id) } catch (e) { logSync('push', 'calendar', id, 'error', e.message) }
  }

  const effectiveEmail = Session.getEffectiveUser().getEmail()
  if (isSyncUser(effectiveEmail) && task.gtask_id) {
    try {
      const project = getProjectById(task.project_id)
      const tasklistId = ensureTasklist(project.name)
      deleteGoogleTask(tasklistId, task.gtask_id)
    } catch (e) { logSync('push', 'tasks', id, 'error', e.message) }
  }

  const rowIndex = findRowById('Tasks', id)
  deleteRow('Tasks', rowIndex)
}

function bulkUpdateStatus(ids, newStatus) {
  ids.forEach(id => {
    try {
      updateTask(id, { status: newStatus })
    } catch (e) {
      console.error('bulkUpdateStatus error for', id, e.message)
    }
  })
}

function getEisenhowerMatrix(projectId) {
  const tasks = getTasks(projectId, null)
  const active = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled')
  return {
    q1: active.filter(t => t.priority === 'urgent' && t.importance === 'important'),
    q2: active.filter(t => t.priority === 'not_urgent' && t.importance === 'important'),
    q3: active.filter(t => t.priority === 'urgent' && t.importance === 'not_important'),
    q4: active.filter(t => t.priority === 'not_urgent' && t.importance === 'not_important'),
  }
}
