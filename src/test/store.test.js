import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import useAppStore from '../store/useAppStore'

// Mock google.script.run (GAS environment)
const mockRunGAS = vi.fn()

// Patch runGAS trong store
beforeEach(() => {
  // Reset store về trạng thái ban đầu
  useAppStore.setState({
    projects: [],
    tasks: {},
    members: {},
    syncStatus: 'idle',
    lastSynced: null,
    currentUser: { email: 'minhnhatnhc@gmail.com', displayName: 'Minh Nhat' },
  })
  mockRunGAS.mockReset()
  // Gắn mock vào store
  useAppStore.setState({ runGAS: mockRunGAS })
})

// ─── reloadTasks ─────────────────────────────────────────────────────────────

describe('reloadTasks', () => {
  it('cập nhật tasks khi fetch trả về data', async () => {
    const tasks = [{ id: 't1', project_id: 'p1', title: 'Task 1', status: 'todo' }]
    mockRunGAS.mockResolvedValue(tasks)

    await act(async () => {
      await useAppStore.getState().reloadTasks('p1')
    })

    expect(useAppStore.getState().tasks['p1']).toEqual(tasks)
  })

  it('KHÔNG xoá tasks hiện có khi fetch trả về rỗng', async () => {
    // Đặt sẵn tasks trong state
    const existing = [{ id: 't1', project_id: 'p1', title: 'Task 1', status: 'todo' }]
    useAppStore.setState({ tasks: { p1: existing } })

    // GAS trả về mảng rỗng (lỗi backend)
    mockRunGAS.mockResolvedValue([])

    await act(async () => {
      await useAppStore.getState().reloadTasks('p1')
    })

    // Tasks phải vẫn còn
    expect(useAppStore.getState().tasks['p1']).toEqual(existing)
  })

  it('cập nhật thành rỗng nếu project ban đầu cũng không có task', async () => {
    useAppStore.setState({ tasks: { p1: [] } })
    mockRunGAS.mockResolvedValue([])

    await act(async () => {
      await useAppStore.getState().reloadTasks('p1')
    })

    expect(useAppStore.getState().tasks['p1']).toEqual([])
  })

  it('không làm gì khi fetch thất bại (giữ nguyên state)', async () => {
    const existing = [{ id: 't1', project_id: 'p1', title: 'Task 1' }]
    useAppStore.setState({ tasks: { p1: existing } })
    mockRunGAS.mockRejectedValue(new Error('Access denied'))

    await act(async () => {
      await useAppStore.getState().reloadTasks('p1')
    })

    expect(useAppStore.getState().tasks['p1']).toEqual(existing)
  })

  it('không ảnh hưởng đến tasks của project khác', async () => {
    const p2tasks = [{ id: 't2', project_id: 'p2', title: 'Task 2' }]
    useAppStore.setState({ tasks: { p1: [], p2: p2tasks } })
    mockRunGAS.mockResolvedValue([{ id: 't1', project_id: 'p1', title: 'Task 1' }])

    await act(async () => {
      await useAppStore.getState().reloadTasks('p1')
    })

    expect(useAppStore.getState().tasks['p2']).toEqual(p2tasks)
  })
})

// ─── triggerSync ─────────────────────────────────────────────────────────────

describe('triggerSync', () => {
  it('gọi syncNow và chuyển status thành idle khi thành công', async () => {
    mockRunGAS.mockResolvedValue({ lastSynced: new Date().toISOString() })

    await act(async () => {
      await useAppStore.getState().triggerSync()
    })

    expect(mockRunGAS).toHaveBeenCalledWith('syncNow', {})
    expect(useAppStore.getState().syncStatus).toBe('idle')
  })

  it('KHÔNG thay đổi tasks sau sync', async () => {
    const existing = [{ id: 't1', project_id: 'p1', title: 'Task 1' }]
    useAppStore.setState({ tasks: { p1: existing } })
    mockRunGAS.mockResolvedValue({ lastSynced: new Date().toISOString() })

    await act(async () => {
      await useAppStore.getState().triggerSync()
    })

    // Tasks phải nguyên vẹn sau sync
    expect(useAppStore.getState().tasks['p1']).toEqual(existing)
    // runGAS chỉ được gọi 1 lần (syncNow), không có getTasks
    expect(mockRunGAS).toHaveBeenCalledTimes(1)
  })

  it('chuyển status thành error khi sync thất bại', async () => {
    mockRunGAS.mockRejectedValue(new Error('Network error'))

    await act(async () => {
      try { await useAppStore.getState().triggerSync() } catch {}
    })

    expect(useAppStore.getState().syncStatus).toBe('error')
  })

  it('không thay đổi tasks khi sync thất bại', async () => {
    const existing = [{ id: 't1', project_id: 'p1', title: 'Task 1' }]
    useAppStore.setState({ tasks: { p1: existing } })
    mockRunGAS.mockRejectedValue(new Error('Sync failed'))

    await act(async () => {
      try { await useAppStore.getState().triggerSync() } catch {}
    })

    expect(useAppStore.getState().tasks['p1']).toEqual(existing)
  })
})

// ─── createTask ──────────────────────────────────────────────────────────────

describe('createTask', () => {
  it('thêm task vào state sau khi GAS tạo thành công', async () => {
    const newTask = { id: 't1', project_id: 'p1', title: 'Task mới', status: 'todo' }
    mockRunGAS.mockResolvedValue(newTask)
    useAppStore.setState({ tasks: { p1: [] } })

    await act(async () => {
      await useAppStore.getState().createTask({ project_id: 'p1', title: 'Task mới' })
    })

    expect(useAppStore.getState().tasks['p1']).toContainEqual(newTask)
  })

  it('không thay đổi state nếu GAS trả về lỗi', async () => {
    mockRunGAS.mockRejectedValue(new Error('Sheet error'))
    useAppStore.setState({ tasks: { p1: [] } })

    await act(async () => {
      try { await useAppStore.getState().createTask({ project_id: 'p1', title: 'Task' }) } catch {}
    })

    expect(useAppStore.getState().tasks['p1']).toEqual([])
  })
})

// ─── updateTask ──────────────────────────────────────────────────────────────

describe('updateTask', () => {
  it('cập nhật task trong state', async () => {
    const existing = { id: 't1', project_id: 'p1', title: 'Task cũ', status: 'todo' }
    useAppStore.setState({ tasks: { p1: [existing] } })
    const updated = { ...existing, status: 'done' }
    mockRunGAS.mockResolvedValue(updated)

    await act(async () => {
      await useAppStore.getState().updateTask('t1', { status: 'done' })
    })

    expect(useAppStore.getState().tasks['p1'][0].status).toBe('done')
  })

  it('cập nhật đúng task, không ảnh hưởng task khác', async () => {
    const t1 = { id: 't1', project_id: 'p1', title: 'Task 1', status: 'todo' }
    const t2 = { id: 't2', project_id: 'p1', title: 'Task 2', status: 'todo' }
    useAppStore.setState({ tasks: { p1: [t1, t2] } })
    mockRunGAS.mockResolvedValue({ ...t1, status: 'done' })

    await act(async () => {
      await useAppStore.getState().updateTask('t1', { status: 'done' })
    })

    const tasks = useAppStore.getState().tasks['p1']
    expect(tasks.find(t => t.id === 't1').status).toBe('done')
    expect(tasks.find(t => t.id === 't2').status).toBe('todo')
  })
})
