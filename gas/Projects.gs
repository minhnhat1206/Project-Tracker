// Projects.gs — CRUD cho Projects và Members

function createProject(data) {
  const currentEmail = getCurrentUser().email
  const id = generateId()
  const now = formatTimestamp(new Date())

  const project = {
    id,
    name: data.name || '',
    description: data.description || '',
    status: 'active',
    owner_email: currentEmail,
    member_emails: currentEmail,
    created_at: now,
  }

  appendRow('Projects', project)

  // Add owner to Members sheet (with project_id for proper scoping)
  appendRow('Members', {
    id: generateId(),
    project_id: id,
    email: currentEmail,
    display_name: data.display_name || currentEmail.split('@')[0],
    role: 'owner',
    joined_at: now,
  })

  return project
}

function getProjects(userEmail) {
  const email = userEmail || getCurrentUser().email
  const rows = getSheetData('Projects')
  const allMembers = getSheetData('Members')

  // Collect project IDs where this user has a Members row (authoritative when project_id is set)
  const memberProjectIds = new Set()
  allMembers.forEach(m => {
    if (String(m.email) === email && m.project_id) {
      memberProjectIds.add(String(m.project_id))
    }
  })

  return rows.filter(p => {
    if (p.owner_email === email) return true
    if (memberProjectIds.has(String(p.id))) return true
    // Fallback: check member_emails directly (for rows not yet migrated)
    const members = p.member_emails ? p.member_emails.split(',').map(e => e.trim()) : []
    return members.includes(email)
  })
}

function getProjectById(id) {
  const rows = getSheetData('Projects')
  const project = rows.find(r => r.id === id)
  if (!project) throw new Error('Project not found')
  return project
}

function updateProject(id, data) {
  requireOwner(id)
  const rowIndex = findRowById('Projects', id)
  if (rowIndex === -1) throw new Error('Project not found')
  const allowed = { name: data.name, description: data.description }
  Object.keys(allowed).forEach(k => { if (allowed[k] === undefined) delete allowed[k] })
  updateRow('Projects', rowIndex, allowed)
  return getProjectById(id)
}

function archiveProject(id) {
  requireOwner(id)
  const rowIndex = findRowById('Projects', id)
  if (rowIndex === -1) throw new Error('Project not found')
  updateRow('Projects', rowIndex, { status: 'archived' })
}

function addMember(projectId, email) {
  requireOwner(projectId)
  if (!email || !email.includes('@')) throw new Error('Invalid email')

  const project = getProjectById(projectId)
  const currentMembers = project.member_emails ? project.member_emails.split(',').map(e => e.trim()) : []
  if (currentMembers.includes(email)) throw new Error('Member already exists')

  currentMembers.push(email)
  const rowIndex = findRowById('Projects', projectId)
  updateRow('Projects', rowIndex, { member_emails: currentMembers.join(',') })

  // Reuse existing Members row if it exists (avoid duplicates on re-add)
  const allMembers = getSheetData('Members')
  const existing = allMembers.find(m => m.project_id === projectId && m.email === email)
  if (existing) return existing

  const member = {
    id: generateId(),
    project_id: projectId,
    email,
    display_name: email.split('@')[0],
    role: 'member',
    joined_at: formatTimestamp(new Date()),
  }
  appendRow('Members', member)
  return member
}

function removeMember(projectId, email) {
  requireOwner(projectId)
  const project = getProjectById(projectId)
  if (email === project.owner_email) throw new Error('Cannot remove project owner')

  const currentMembers = project.member_emails ? project.member_emails.split(',').map(e => e.trim()) : []
  const updated = currentMembers.filter(m => m !== email)
  const rowIndex = findRowById('Projects', projectId)
  updateRow('Projects', rowIndex, { member_emails: updated.join(',') })

  // Delete the member's row from Members sheet (search bottom-up to avoid index shift)
  const sheet = getSheet('Members')
  const data = sheet.getDataRange().getValues()
  const headers = data[0]
  const projectIdCol = headers.indexOf('project_id')
  const emailCol = headers.indexOf('email')
  if (projectIdCol !== -1 && emailCol !== -1) {
    for (let i = data.length - 1; i >= 1; i--) {
      if (String(data[i][projectIdCol]) === String(projectId) && String(data[i][emailCol]) === String(email)) {
        sheet.deleteRow(i + 1)
        break
      }
    }
  }

  return { member_emails: updated.join(',') }
}

function getMembers(projectId) {
  requireMember(projectId)
  const allMembers = getSheetData('Members')

  // Primary: filter by project_id (new schema)
  const byProject = allMembers.filter(m => String(m.project_id) === String(projectId))
  if (byProject.length > 0) return byProject

  // Fallback for legacy rows that don't have project_id set
  const project = getProjectById(projectId)
  const memberEmails = project.member_emails ? project.member_emails.split(',').map(e => e.trim()) : []
  return allMembers.filter(m => memberEmails.includes(m.email))
}
