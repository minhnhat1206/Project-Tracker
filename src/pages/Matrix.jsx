import React, { useEffect, useState, useMemo } from 'react'
import { DndContext, DragOverlay, useDroppable, useDraggable, closestCenter } from '@dnd-kit/core'
import PageWrapper from '../components/layout/PageWrapper'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import useAppStore from '../store/useAppStore'
import { KNOWN_USERS, getUserName } from '../config/users'

const QUADRANTS = [
  { id: 'q1', label: 'Do First', subtitle: 'Urgent & Important', color: 'var(--accent-red)', priority: 'urgent', importance: 'important' },
  { id: 'q2', label: 'Schedule', subtitle: 'Not Urgent & Important', color: 'var(--accent-blue)', priority: 'not_urgent', importance: 'important' },
  { id: 'q3', label: 'Delegate', subtitle: 'Urgent & Not Important', color: 'var(--accent-orange)', priority: 'urgent', importance: 'not_important' },
  { id: 'q4', label: 'Eliminate', subtitle: 'Not Urgent & Not Important', color: '#AEAEB2', priority: 'not_urgent', importance: 'not_important' },
]

function getQuadrantId(task) {
  if (task.priority === 'urgent' && task.importance === 'important') return 'q1'
  if (task.priority === 'not_urgent' && task.importance === 'important') return 'q2'
  if (task.priority === 'urgent' && task.importance === 'not_important') return 'q3'
  return 'q4'
}

function MiniTaskCard({ task, color, projectName, isDragging = false }) {
  return (
    <div style={{
      padding: '10px 12px',
      background: isDragging ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.6)',
      borderRadius: 10,
      borderLeft: `3px solid ${color}`,
      cursor: 'grab',
      opacity: isDragging ? 0.5 : 1,
      transition: 'all 150ms',
      marginBottom: 6,
    }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 5 }}>{task.title}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
          background: 'rgba(60,60,67,0.08)', color: 'var(--text-tertiary)',
          maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {projectName}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {task.deadline && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{task.deadline}</span>
          )}
          <Avatar email={task.assignee_email} size={20} />
        </div>
      </div>
    </div>
  )
}

function DraggableMiniTask({ task, color, projectName }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}>
      <MiniTaskCard task={task} color={color} projectName={projectName} isDragging={isDragging} />
    </div>
  )
}

function AddTaskModal({ open, onClose, quadrant, projects }) {
  const { createTask, currentUser } = useAppStore()
  const [form, setForm] = useState({ title: '', project_id: '', assignee_email: '' })

  useEffect(() => {
    if (open) setForm({ title: '', project_id: projects[0]?.id || '', assignee_email: currentUser?.email || '' })
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.project_id) return
    onClose()
    createTask({
      ...form,
      status: 'todo',
      priority: quadrant.priority,
      importance: quadrant.importance,
      tags: '',
      deadline: '',
      estimated_hours: '',
      description: '',
    }).catch(err => console.error('createTask failed:', err.message))
  }

  const inputStyle = { width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border-separator)', background: 'rgba(255,255,255,0.5)', fontSize: 14, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

  return (
    <Modal open={open} onClose={onClose} title={`New Task — ${quadrant?.label}`} width={440}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Tên task *</label>
          <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Task title" autoFocus required />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Project *</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 5 }}>Assignee</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.assignee_email} onChange={e => setForm(f => ({ ...f, assignee_email: e.target.value }))}>
            <option value="">-- Không chọn --</option>
            {KNOWN_USERS.map(u => <option key={u.email} value={u.email}>{u.name}</option>)}
          </select>
        </div>
        <div style={{ padding: '8px 12px', borderRadius: 8, background: `${quadrant?.color}14`, fontSize: 12, color: quadrant?.color, fontWeight: 600 }}>
          {quadrant?.label}: {quadrant?.subtitle}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={{ padding: '8px 16px', borderRadius: 9, border: '1px solid var(--border-separator)', background: 'none', cursor: 'pointer', fontSize: 14 }}>Huỷ</button>
          <button type="submit" disabled={!form.title.trim() || !form.project_id} style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: 'var(--accent-blue)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: (!form.title.trim() || !form.project_id) ? 0.5 : 1 }}>Tạo Task</button>
        </div>
      </form>
    </Modal>
  )
}

function QuadrantDropZone({ quadrant, tasks, projectMap, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant.id })
  return (
    <div
      ref={setNodeRef}
      className="glass-card"
      style={{
        display: 'flex', flexDirection: 'column',
        outline: isOver ? `2px solid ${quadrant.color}` : '2px solid transparent',
        transition: 'outline 150ms',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid rgba(60,60,67,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: quadrant.color }}>{quadrant.label}</div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{quadrant.subtitle}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: `${quadrant.color}18`, color: quadrant.color }}>
            {tasks.length}
          </span>
          <button
            onClick={onAdd}
            style={{ width: 22, height: 22, borderRadius: 6, border: 'none', background: `${quadrant.color}18`, cursor: 'pointer', color: quadrant.color, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}
            title="Thêm task"
          >+</button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '12px', overflowY: 'auto', maxHeight: 'calc(50vh - 130px)' }}>
        {tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: 12 }}>
            Drop tasks here
          </div>
        ) : (
          tasks.map(task => (
            <DraggableMiniTask
              key={task.id}
              task={task}
              color={quadrant.color}
              projectName={projectMap[task.project_id] || ''}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function Matrix() {
  const { projects, tasks, loadTasks, loadProjects, updateTask, currentUser } = useAppStore()
  const [assigneeFilter, setAssigneeFilter] = useState(currentUser?.email || '')
  const [activeTask, setActiveTask] = useState(null)
  const [addModal, setAddModal] = useState(null) // { quadrant } | null

  useEffect(() => {
    loadProjects().then(projs => {
      if (projs) projs.forEach(p => loadTasks(p.id))
    })
  }, [])

  const projectMap = useMemo(() => {
    const m = {}
    projects.forEach(p => { m[p.id] = p.name })
    return m
  }, [projects])

  const allTasks = useMemo(() => Object.values(tasks).flat(), [tasks])

  const filteredTasks = useMemo(() => {
    if (!assigneeFilter) return allTasks
    return allTasks.filter(t => t.assignee_email === assigneeFilter)
  }, [allTasks, assigneeFilter])

  const matrix = useMemo(() => {
    const result = { q1: [], q2: [], q3: [], q4: [] }
    filteredTasks.filter(t => t.status !== 'done' && t.status !== 'cancelled').forEach(task => {
      result[getQuadrantId(task)].push(task)
    })
    return result
  }, [filteredTasks])

  const handleDragStart = ({ active }) => setActiveTask(active.data.current?.task)

  const handleDragEnd = async ({ active, over }) => {
    setActiveTask(null)
    if (!over) return
    const task = active.data.current?.task
    const targetQ = QUADRANTS.find(q => q.id === over.id)
    if (!task || !targetQ) return
    if (getQuadrantId(task) === targetQ.id) return
    await updateTask(task.id, { priority: targetQ.priority, importance: targetQ.importance })
  }

  const activeQuadrant = activeTask ? QUADRANTS.find(q => q.id === getQuadrantId(activeTask)) : null

  const pillStyle = (active) => ({
    padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: active ? 600 : 400,
    border: active ? '1.5px solid var(--accent-blue)' : '1.5px solid var(--border-separator)',
    background: active ? 'rgba(0,122,255,0.10)' : 'rgba(255,255,255,0.6)',
    color: active ? 'var(--accent-blue)' : 'var(--text-secondary)',
    cursor: 'pointer', transition: 'all 150ms', display: 'flex', alignItems: 'center', gap: 6,
  })

  return (
    <PageWrapper>
      {/* Filter bar */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button style={pillStyle(!assigneeFilter)} onClick={() => setAssigneeFilter('')}>
          Tất cả
        </button>
        {KNOWN_USERS.map(u => (
          <button key={u.email} style={pillStyle(assigneeFilter === u.email)} onClick={() => setAssigneeFilter(u.email)}>
            <Avatar email={u.email} size={18} />
            {u.name}
            {u.email === currentUser?.email && (
              <span style={{ fontSize: 10, opacity: 0.7 }}>(tôi)</span>
            )}
          </button>
        ))}
        <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
          Drag tasks between quadrants to reprioritize
        </span>
      </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
          gap: 16, height: 'calc(100vh - 200px)',
        }}>
          {QUADRANTS.map(q => (
            <QuadrantDropZone key={q.id} quadrant={q} tasks={matrix[q.id]} projectMap={projectMap} onAdd={() => setAddModal({ quadrant: q })} />
          ))}
        </div>
        <DragOverlay>
          {activeTask && activeQuadrant && (
            <MiniTaskCard task={activeTask} color={activeQuadrant.color} projectName={projectMap[activeTask.project_id] || ''} />
          )}
        </DragOverlay>
      </DndContext>

      <AddTaskModal
        open={!!addModal}
        onClose={() => setAddModal(null)}
        quadrant={addModal?.quadrant}
        projects={projects.filter(p => p.status === 'active')}
      />
    </PageWrapper>
  )
}
