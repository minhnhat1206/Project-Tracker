// Auth.gs — Authorization checks

const SYNC_USER_EMAIL = 'minhnhatnhc@gmail.com'

function getCurrentUser() {
  let email = Session.getActiveUser().getEmail()
  if (!email) email = Session.getEffectiveUser().getEmail()
  return { email, displayName: email ? email.split('@')[0] : 'User' }
}

function isProjectMember(projectId, email) {
  const rows = getSheetData('Projects')
  const project = rows.find(r => r.id === projectId)
  if (!project) return false
  const members = project.member_emails ? project.member_emails.split(',').map(e => e.trim()) : []
  return members.includes(email) || project.owner_email === email
}

function isProjectOwner(projectId, email) {
  const rows = getSheetData('Projects')
  const project = rows.find(r => r.id === projectId)
  return project && project.owner_email === email
}

function requireMember(projectId) {
  const email = getCurrentUser().email
  if (!isProjectMember(projectId, email)) {
    throw new Error('Access denied: not a project member')
  }
}

function requireOwner(projectId) {
  const email = getCurrentUser().email
  if (!isProjectOwner(projectId, email)) {
    throw new Error('Access denied: not project owner')
  }
}

function isSyncUser(email) {
  return email === SYNC_USER_EMAIL
}
