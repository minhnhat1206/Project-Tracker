import { create } from 'zustand'
import { KNOWN_USERS } from '../config/users'

function loadSavedUser() {
  try {
    const s = localStorage.getItem('pm_user') || sessionStorage.getItem('pm_user')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

const useAppStore = create((set, get) => ({
  currentUser: loadSavedUser(),
  projects: [],
  tasks: {},
  members: {},
  syncStatus: 'idle',
  lastSynced: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  login: (email, remember) => {
    const known = KNOWN_USERS.find(u => u.email === email)
    const user = { email, name: known?.name || email.split('@')[0], displayName: known?.name || email.split('@')[0], role: known?.role || 'member' }
    if (remember) {
      localStorage.setItem('pm_user', JSON.stringify(user))
      sessionStorage.removeItem('pm_user')
    } else {
      sessionStorage.setItem('pm_user', JSON.stringify(user))
      localStorage.removeItem('pm_user')
    }
    // Clear stale data from previous user's session
    set({ currentUser: user, projects: [], tasks: {}, members: {} })
  },

  logout: () => {
    localStorage.removeItem('pm_user')
    sessionStorage.removeItem('pm_user')
    set({ currentUser: null })
  },

  loadProjects: async () => {
    try {
      const { runGAS } = get()
      const userEmail = get().currentUser?.email
      const projects = await runGAS('getProjects', { userEmail })
      set({ projects })
      return projects
    } catch (err) {
      console.error('loadProjects error:', err)
    }
  },

  loadTasks: async (projectId, filters = {}) => {
    try {
      const { runGAS } = get()
      const tasks = await runGAS('getTasks', { projectId, filters })
      set(state => ({ tasks: { ...state.tasks, [projectId]: tasks } }))
      return tasks
    } catch (err) {
      console.error('loadTasks error:', err)
    }
  },

  loadMembers: async (projectId) => {
    try {
      const { runGAS } = get()
      const members = await runGAS('getMembers', { projectId })
      set(state => ({ members: { ...state.members, [projectId]: members } }))
      return members
    } catch (err) {
      console.error('loadMembers error:', err)
    }
  },

  createProject: async (data) => {
    const { runGAS } = get()
    const project = await runGAS('createProject', data)
    set(state => ({ projects: [...state.projects, project] }))
    return project
  },

  updateProject: async (id, data) => {
    const { runGAS } = get()
    const updated = await runGAS('updateProject', { id, ...data })
    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updated } : p)
    }))
    return updated
  },

  archiveProject: async (id) => {
    const { runGAS } = get()
    await runGAS('archiveProject', { id })
    set(state => ({
      projects: state.projects.map(p => p.id === id ? { ...p, status: 'archived' } : p)
    }))
  },

  createTask: async (data) => {
    const { runGAS } = get()
    const projectId = data.project_id
    const tempId = 'temp_' + Date.now()
    const tempTask = {
      ...data,
      id: tempId,
      tags: data.tags || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    set(state => ({
      tasks: { ...state.tasks, [projectId]: [...(state.tasks[projectId] || []), tempTask] }
    }))
    try {
      const task = await runGAS('createTask', data)
      set(state => ({
        tasks: { ...state.tasks, [projectId]: state.tasks[projectId].map(t => t.id === tempId ? task : t) }
      }))
      return task
    } catch (err) {
      set(state => ({
        tasks: { ...state.tasks, [projectId]: state.tasks[projectId].filter(t => t.id !== tempId) }
      }))
      throw err
    }
  },

  updateTask: async (id, data) => {
    const { runGAS } = get()

    // Optimistic update — đổi state ngay lập tức
    let original = null
    set(state => {
      const newTasks = { ...state.tasks }
      for (const pid in newTasks) {
        const found = newTasks[pid].find(t => t.id === id)
        if (found && !original) original = found
        newTasks[pid] = newTasks[pid].map(t => t.id === id ? { ...t, ...data } : t)
      }
      return { tasks: newTasks }
    })

    try {
      const updated = await runGAS('updateTask', { id, ...data })
      set(state => {
        const newTasks = { ...state.tasks }
        for (const pid in newTasks) {
          newTasks[pid] = newTasks[pid].map(t => t.id === id ? { ...t, ...updated } : t)
        }
        return { tasks: newTasks }
      })
      return updated
    } catch (err) {
      // Revert về trạng thái cũ nếu GAS thất bại
      if (original) {
        set(state => {
          const newTasks = { ...state.tasks }
          for (const pid in newTasks) {
            newTasks[pid] = newTasks[pid].map(t => t.id === id ? original : t)
          }
          return { tasks: newTasks }
        })
      }
      throw err
    }
  },

  deleteTask: async (id, projectId) => {
    const { runGAS } = get()
    await runGAS('deleteTask', { id })
    set(state => ({
      tasks: {
        ...state.tasks,
        [projectId]: (state.tasks[projectId] || []).filter(t => t.id !== id)
      }
    }))
  },

  triggerSync: async () => {
    set({ syncStatus: 'syncing' })
    try {
      const { runGAS } = get()
      await runGAS('syncNow', {})
      set({ syncStatus: 'idle', lastSynced: new Date() })
    } catch (err) {
      set({ syncStatus: 'error' })
      throw err
    }
  },

  reloadTasks: async (projectId) => {
    const { runGAS, tasks: currentTasks } = get()
    try {
      const fetched = await runGAS('getTasks', { projectId, filters: {} })
      // Chỉ cập nhật nếu fetch trả về data hợp lệ
      if (fetched.length > 0 || (currentTasks[projectId] || []).length === 0) {
        set(state => ({ tasks: { ...state.tasks, [projectId]: fetched } }))
      }
      return fetched
    } catch (err) {
      console.error('reloadTasks error:', err)
    }
  },

  addMember: async (projectId, email) => {
    const { runGAS } = get()
    const tempMember = { email, display_name: email.split('@')[0] }
    const original = get().members[projectId] || []
    // Optimistic add
    set(state => ({
      members: {
        ...state.members,
        [projectId]: [...(state.members[projectId] || []), tempMember],
      },
      projects: state.projects.map(p => {
        if (p.id !== projectId) return p
        const existing = p.member_emails ? p.member_emails.split(',').map(e => e.trim()).filter(Boolean) : []
        if (!existing.includes(email)) existing.push(email)
        return { ...p, member_emails: existing.join(',') }
      }),
    }))
    try {
      const member = await runGAS('addMember', { projectId, email })
      // Replace temp entry with real data from GAS
      set(state => ({
        members: {
          ...state.members,
          [projectId]: state.members[projectId].map(m => m.email === email ? member : m),
        },
      }))
      return member
    } catch (err) {
      // Rollback
      set(state => ({
        members: { ...state.members, [projectId]: original },
        projects: state.projects.map(p => {
          if (p.id !== projectId) return p
          const existing = p.member_emails ? p.member_emails.split(',').map(e => e.trim()).filter(Boolean) : []
          return { ...p, member_emails: existing.filter(e => e !== email).join(',') }
        }),
      }))
      throw err
    }
  },

  removeMember: async (projectId, email) => {
    const { runGAS } = get()
    const original = get().members[projectId] || []
    const currentUserEmail = get().currentUser?.email
    set(state => ({
      members: { ...state.members, [projectId]: original.filter(m => m.email !== email) }
    }))
    try {
      const result = await runGAS('removeMember', { projectId, email })
      const resultEmails = result.member_emails
        ? result.member_emails.split(',').map(e => e.trim()).filter(Boolean)
        : []
      set(state => ({
        // Sync members list from authoritative GAS result
        members: {
          ...state.members,
          [projectId]: (state.members[projectId] || []).filter(m => resultEmails.includes(m.email)),
        },
        // If current user removed themselves, drop the project from their list
        projects: state.projects
          .filter(p => !(p.id === projectId && email === currentUserEmail))
          .map(p => p.id === projectId ? { ...p, member_emails: result.member_emails } : p),
      }))
    } catch (err) {
      set(state => ({ members: { ...state.members, [projectId]: original } }))
      throw err
    }
  },

  // Internal GAS runner
  runGAS: (action, payload) => {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.script) {
        // Production: served by GAS
        google.script.run
          .withSuccessHandler((result) => {
            if (result.success) resolve(result.data)
            else reject(new Error(result.error))
          })
          .withFailureHandler(reject)
          .process(action, payload)
      } else {
        // Dev: gọi GAS qua HTTP
        const gasUrl = import.meta.env.VITE_GAS_URL
        if (!gasUrl) {
          reject(new Error('VITE_GAS_URL chưa được cấu hình trong .env.development'))
          return
        }
        fetch(gasUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
          body: JSON.stringify({ action, payload }),
          redirect: 'follow',
        })
          .then(r => r.json())
          .then(result => {
            if (result.success) resolve(result.data)
            else reject(new Error(result.error))
          })
          .catch(reject)
      }
    })
  },
}))

export default useAppStore
