import { useState, useCallback } from 'react'

// Mock data for development (when not in GAS environment)
const mockData = {
  getCurrentUser: () => ({ email: 'minhnhatnhc@gmail.com', displayName: 'Minh Nhat' }),
  getProjects: () => [
    {
      id: 'proj-1',
      name: 'Website Redesign',
      description: 'Thiết kế lại giao diện website công ty',
      status: 'active',
      owner_email: 'minhnhatnhc@gmail.com',
      member_emails: 'minhnhatnhc@gmail.com,member2@gmail.com',
      created_at: '2026-05-01T00:00:00Z',
    },
    {
      id: 'proj-2',
      name: 'Mobile App v2',
      description: 'Phát triển phiên bản 2 của ứng dụng mobile',
      status: 'active',
      owner_email: 'minhnhatnhc@gmail.com',
      member_emails: 'minhnhatnhc@gmail.com',
      created_at: '2026-05-05T00:00:00Z',
    },
  ],
  getTasks: ({ projectId }) => {
    const tasks = [
      {
        id: 'task-1', project_id: 'proj-1', title: 'Thiết kế mockup trang chủ',
        description: 'Tạo mockup chi tiết cho landing page', assignee_email: 'minhnhatnhc@gmail.com',
        status: 'in_progress', priority: 'urgent', importance: 'important',
        estimated_hours: 8, tags: 'design,ui', deadline: '2026-05-20',
        calendar_event_id: '', gtask_id: '', created_at: '2026-05-10T00:00:00Z', updated_at: '2026-05-10T00:00:00Z'
      },
      {
        id: 'task-2', project_id: 'proj-1', title: 'Review code backend',
        description: 'Review và refactor API endpoints', assignee_email: 'minhnhatnhc@gmail.com',
        status: 'todo', priority: 'not_urgent', importance: 'important',
        estimated_hours: 4, tags: 'backend,review', deadline: '2026-05-25',
        calendar_event_id: '', gtask_id: '', created_at: '2026-05-10T00:00:00Z', updated_at: '2026-05-10T00:00:00Z'
      },
      {
        id: 'task-3', project_id: 'proj-1', title: 'Họp với khách hàng',
        description: 'Demo sản phẩm cho khách hàng', assignee_email: 'minhnhatnhc@gmail.com',
        status: 'todo', priority: 'urgent', importance: 'not_important',
        estimated_hours: 2, tags: 'meeting', deadline: '2026-05-16',
        calendar_event_id: '', gtask_id: '', created_at: '2026-05-10T00:00:00Z', updated_at: '2026-05-10T00:00:00Z'
      },
      {
        id: 'task-4', project_id: 'proj-1', title: 'Cập nhật tài liệu',
        description: 'Viết lại README và docs', assignee_email: 'minhnhatnhc@gmail.com',
        status: 'done', priority: 'not_urgent', importance: 'not_important',
        estimated_hours: 3, tags: 'docs', deadline: '2026-05-18',
        calendar_event_id: '', gtask_id: '', created_at: '2026-05-08T00:00:00Z', updated_at: '2026-05-12T00:00:00Z'
      },
      {
        id: 'task-5', project_id: 'proj-2', title: 'Setup CI/CD pipeline',
        description: 'Cấu hình Github Actions', assignee_email: 'minhnhatnhc@gmail.com',
        status: 'todo', priority: 'urgent', importance: 'important',
        estimated_hours: 6, tags: 'devops', deadline: '2026-05-22',
        calendar_event_id: '', gtask_id: '', created_at: '2026-05-10T00:00:00Z', updated_at: '2026-05-10T00:00:00Z'
      },
    ]
    return tasks.filter(t => !projectId || t.project_id === projectId)
  },
  getMembers: ({ projectId }) => [
    { id: 'mem-1', email: 'minhnhatnhc@gmail.com', display_name: 'Minh Nhat', role: 'owner', joined_at: '2026-05-01T00:00:00Z' },
    { id: 'mem-2', email: 'member2@gmail.com', display_name: 'Member 2', role: 'member', joined_at: '2026-05-05T00:00:00Z' },
  ],
  createProject: (data) => ({ ...data, id: 'proj-' + Date.now(), created_at: new Date().toISOString(), status: 'active' }),
  createTask: (data) => ({ ...data, id: 'task-' + Date.now(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  updateTask: (data) => ({ ...data, updated_at: new Date().toISOString() }),
  deleteTask: () => true,
  syncNow: () => ({ lastSynced: new Date().toISOString() }),
  addMember: (data) => ({ id: 'mem-' + Date.now(), ...data, joined_at: new Date().toISOString() }),
  removeMember: () => true,
}

export function useGAS() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const run = useCallback(async (action, payload = {}) => {
    setLoading(true)
    setError(null)

    try {
      if (typeof google !== 'undefined' && google.script) {
        return await new Promise((resolve, reject) => {
          google.script.run
            .withSuccessHandler((result) => {
              if (result.success) resolve(result.data)
              else reject(new Error(result.error))
            })
            .withFailureHandler(reject)
            .process(action, payload)
        })
      } else {
        // Dev mode mock
        await new Promise(r => setTimeout(r, 300))
        const handler = mockData[action]
        if (handler) return handler(payload)
        throw new Error(`Unknown action: ${action}`)
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { run, loading, error }
}
