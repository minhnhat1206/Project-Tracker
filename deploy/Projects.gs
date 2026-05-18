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

  // Add owner to Members sheet
  appendRow('Members', {
    id: generateId(),
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
  return rows.filter(p => {
    if (p.owner_email === email) return true
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

  const memberId = generateId()
  const member = {
    id: memberId,
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
  const currentMembers = project.member_emails ? project.member_emails.split(',').map(e => e.trim()) : []
  const updated = currentMembers.filter(m => m !== email)
  const rowIndex = findRowById('Projects', projectId)
  updateRow('Projects', rowIndex, { member_emails: updated.join(',') })
}

function getMembers(projectId) {
  const project = getProjectById(projectId)
  const memberEmails = project.member_emails ? project.member_emails.split(',').map(e => e.trim()).filter(Boolean) : []
  const allMembers = getSheetData('Members')
  // Return matched members; fall back to email-only objects if not in Members sheet
  return memberEmails.map(email => {
    const found = allMembers.find(m => m.email === email)
    return found || { id: email, email, display_name: email.split('@')[0], role: email === project.owner_email ? 'owner' : 'member', joined_at: '' }
  })
}
