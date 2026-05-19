import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, useDroppable, useDraggable, rectIntersection, useSensor, useSensors, PointerSensor } from '@dnd-kit/core'
import { Plus, RefreshCw, ChevronLeft, LayoutList, LayoutGrid, BarChart2, UserPlus, X } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import GlassCard from '../components/ui/GlassCard'
import TaskCard from '../components/ui/TaskCard'
import FilterBar from '../components/ui/FilterBar'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import TagInput from '../components/ui/TagInput'
import EmptyState from '../components/ui/EmptyState'
import DonutChart from '../components/charts/DonutChart'
import ProgressRing from '../components/charts/ProgressRing'
import useAppStore from '../store/useAppStore'
import { KNOWN_USERS, getUserName } from '../config/users'

// ─── Kanban helpers ────────────────────────────────────────────────────────────

const quadrantColors = {
  q1: 'var(--accent-red)',
  q2: 'var(--accent-blue)',
  q3: 'var(--accent-orange)',
  q4: '#AEAEB2',
}

function getQuadrant(task) {
  if (task.priority === 'urgent' && task.importance === 'important') return 'q1'
  if (task.priority === 'not_urgent' && task.importance === 'important') return 'q2'
  if (task.priority === 'urgent' && task.importance === 'not_important') return 'q3'
  return 'q4'
}

function getDeadlineStyle(deadline) {
  if (!deadline) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(deadline + 'T00:00:00')
  const diff = Math.ceil((d - today) / 86400000)
  if (diff < 0) return { color: 'var(--accent-red)', bg: 'rgba(255,59,48,0.1)' }
  if (diff <= 2) return { color: 'var(--accent-orange)', bg: 'rgba(255,149,0,0.1)' }
  return { color: 'var(--text-secondary)', bg: 'rgba(60,60,67,0.06)' }
}

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'Todo', color: '#AEAEB2', bg: 'rgba(174,174,178,0.07)' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--accent-blue)', bg: 'rgba(0,122,255,0.06)' },
  { id: 'done', label: 'Done', color: '#34C759', bg: 'rgba(52,199,89,0.06)' },
]

function KanbanCard({ task, onClick }) {
  const { updateTask } = useAppStore()
  const isDone = task.status === 'done'
  const accentColor = quadrantColors[getQuadrant(task)]
  const deadlineStyle = getDeadlineStyle(task.deadline)
  const tags = task.tags ? task.tags.split(',').filter(Boolean) : []

  const handleCheck = async (e) => {
    e.stopPropagation()
    try { await updateTask(task.id, { status: isDone ? 'todo' : 'done' }) }
    catch (err) { console.error('[kanban check]', err.message) }
  }

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.62)', backdropFilter: 'blur(12px)',
        borderRadius: 12, padding: '12px 14px', marginBottom: 8, cursor: 'pointer',
        borderLeft: `3px solid ${accentColor}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'transform 150ms, box-shadow 150ms',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <button type="button" onClick={handleCheck} style={{
          flexShrink: 0, marginTop: 2, width: 16, height: 16, borderRadius: 4,
          border: `2px solid ${isDone ? accentColor : 'var(--border-separator)'}`,
          background: isDone ? accentColor : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
        }}>
          {isDone && <svg width="8" height="7" viewBox="0 0 8 7" fill="none"><path d="M1 3.5L3 6L7.5 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 500, lineHeight: 1.4, wordBreak: 'break-word',
            color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
            textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.5 : 1,
          }}>{task.title}</div>
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
              {tags.slice(0, 2).map(tag => (
                <span key={tag} style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, background: 'rgba(0,122,255,0.08)', color: 'var(--accent-blue)', fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            {task.deadline && deadlineStyle
              ? <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 5, background: deadlineStyle.bg, color: deadlineStyle.color }}>{task.deadline}</span>
              : <span />}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{getUserName(task.assignee_email)}</span>
              <Avatar email={task.assignee_email} size={22} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DraggableKanbanCard({ task, onEdit }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id, data: { task } })
  return (
    <div
      ref={setNodeRef} {...listeners} {...attributes}
      onClick={() => { if (!isDragging) onEdit(task) }}
      style={{ opacity: isDragging ? 0.35 : 1, touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <KanbanCard task={task} />
    </div>
  )
}

function KanbanColumn({ column, tasks, onEdit, onAdd }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? column.bgOver || column.bg : column.bg,
        borderRadius: 16, padding: '14px 12px', minHeight: 320,
        display: 'flex', flexDirection: 'column',
        border: isOver ? `2px solid ${column.color}` : '1px solid rgba(60,60,67,0.07)',
        transition: 'border 120ms',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: column.color, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{column.label}</span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 10, background: 'rgba(60,60,67,0.1)', color: 'var(--text-secondary)' }}>{tasks.length}</span>
        </div>
        <button onClick={onAdd} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'rgba(60,60,67,0.08)', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
      </div>
      <div style={{ flex: 1 }}>
        {tasks.map(task => <DraggableKanbanCard key={task.id} task={task} onEdit={onEdit} />)}
        {tasks.length === 0 && <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>No tasks</div>}
      </div>
    </div>
  )
}

function KanbanBoard({ tasks, onEdit, onAdd }) {
  const { updateTask } = useAppStore()
  const [activeTask, setActiveTask] = useState(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const colTasks = (colId) => tasks.filter(t => t.status === colId)

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null)
    if (!over) return
    const task = active.data.current?.task
    if (!task || task.status === over.id) return
    updateTask(task.id, { status: over.id }).catch(err => console.error('[kanban dnd]', err.message))
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={({ active }) => setActiveTask(active.data.current?.task)}
      onDragEnd={handleDragEnd}
      collisionDetection={rectIntersection}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {KANBAN_COLUMNS.map(col => (
          <KanbanColumn key={col.id} column={col} tasks={colTasks(col.id)} onEdit={onEdit} onAdd={() => onAdd(col.id)} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTask && <KanbanCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  )
}

// ─── Reports ──────────────────────────────────────────────────────────────────

function ProjectReports({ tasks }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const next7 = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d }, [today])

  const byStatus = useMemo(() => ({
    todo: tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length,
  }), [tasks])

  const total = tasks.length
  const donePercent = total > 0 ? Math.round(byStatus.done / total * 100) : 0
  const totalHours = tasks.reduce((s, t) => s + (parseFloat(t.estimated_hours) || 0), 0)

  const overdue = useMemo(() => tasks.filter(t =>
    t.deadline && t.status !== 'done' && t.status !== 'cancelled' &&
    new Date(t.deadline + 'T00:00:00') < today
  ), [tasks, today])

  const upcoming = useMemo(() => tasks.filter(t =>
    t.deadline && t.status !== 'done' && t.status !== 'cancelled' &&
    new Date(t.deadline + 'T00:00:00') >= today &&
    new Date(t.deadline + 'T00:00:00') <= next7
  ).sort((a, b) => a.deadline.localeCompare(b.deadline)), [tasks, today, next7])

  const memberStats = useMemo(() => KNOWN_USERS.map(user => {
    const mt = tasks.filter(t => t.assignee_email === user.email)
    return {
      ...user,
      total: mt.length,
      done: mt.filter(t => t.status === 'done').length,
      in_progress: mt.filter(t => t.status === 'in_progress').length,
      overdue: mt.filter(t => t.deadline && t.status !== 'done' && t.status !== 'cancelled' && new Date(t.deadline + 'T00:00:00') < today).length,
    }
  }).filter(m => m.total > 0), [tasks, today])

  const donutData = [
    { name: 'Todo', value: byStatus.todo },
    { name: 'In Progress', value: byStatus.in_progress },
    { name: 'Done', value: byStatus.done },
  ].filter(d => d.value > 0)

  const statItems = [
    { label: 'Tổng', value: total, color: 'var(--accent-blue)' },
    { label: 'Todo', value: byStatus.todo, color: '#AEAEB2' },
    { label: 'Đang làm', value: byStatus.in_progress, color: 'var(--accent-blue)' },
    { label: 'Hoàn thành', value: byStatus.done, color: '#34C759' },
    { label: 'Quá hạn', value: overdue.length, color: 'var(--accent-red)' },
    { label: 'Giờ dự kiến', value: totalHours, color: 'var(--accent-orange)' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
        {statItems.map(s => (
          <GlassCard key={s.label} style={{ padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Progress + Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <GlassCard style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Tiến độ hoàn thành</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ProgressRing percent={donePercent} size={88} strokeWidth={7} color="#34C759" />
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#34C759', lineHeight: 1 }}>{donePercent}%</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{byStatus.done}/{total} tasks hoàn thành</div>
              <div style={{ marginTop: 14, width: 180 }}>
                {[
                  { label: 'Todo', w: total > 0 ? byStatus.todo / total * 100 : 0, c: '#AEAEB2' },
                  { label: 'In Progress', w: total > 0 ? byStatus.in_progress / total * 100 : 0, c: 'var(--accent-blue)' },
                  { label: 'Done', w: total > 0 ? byStatus.done / total * 100 : 0, c: '#34C759' },
                ].map(bar => (
                  <div key={bar.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: bar.c, flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 5, background: 'rgba(60,60,67,0.1)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${bar.w}%`, background: bar.c, borderRadius: 3, transition: 'width 0.8s' }} />
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 28 }}>{Math.round(bar.w)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
        <GlassCard style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Phân bổ task</div>
          {donutData.length > 0
            ? <DonutChart data={donutData} height={160} />
            : <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Chưa có task</div>
          }
        </GlassCard>
      </div>

      {/* By Member */}
      {memberStats.length > 0 && (
        <GlassCard style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Khối lượng theo thành viên</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Thành viên', 'Tổng', 'Hoàn thành', 'Đang làm', 'Quá hạn'].map(h => (
                  <th key={h} style={{ textAlign: h === 'Thành viên' ? 'left' : 'center', padding: '6px 12px', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid rgba(60,60,67,0.08)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberStats.map(m => (
                <tr key={m.email} style={{ borderBottom: '1px solid rgba(60,60,67,0.05)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar email={m.email} size={30} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', padding: '10px 12px', fontSize: 15, fontWeight: 600 }}>{m.total}</td>
                  <td style={{ textAlign: 'center', padding: '10px 12px', fontSize: 14, color: '#34C759', fontWeight: 600 }}>{m.done}</td>
                  <td style={{ textAlign: 'center', padding: '10px 12px', fontSize: 14, color: 'var(--accent-blue)', fontWeight: 600 }}>{m.in_progress}</td>
                  <td style={{ textAlign: 'center', padding: '10px 12px', fontSize: 14, color: m.overdue > 0 ? 'var(--accent-red)' : 'var(--text-secondary)', fontWeight: m.overdue > 0 ? 700 : 400 }}>
                    {m.overdue > 0 ? `⚠ ${m.overdue}` : m.overdue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      )}

      {/* Upcoming + Overdue */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <GlassCard style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            Deadline sắp tới (7 ngày)
            {upcoming.length > 0 && <span style={{ fontSize: 12, color: 'var(--accent-orange)', fontWeight: 700, background: 'rgba(255,149,0,0.1)', padding: '1px 8px', borderRadius: 10 }}>{upcoming.length}</span>}
          </div>
          {upcoming.length === 0
            ? <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Không có deadline sắp tới</div>
            : upcoming.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(60,60,67,0.06)' }}>
                <Avatar email={t.assignee_email} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{getUserName(t.assignee_email)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-orange)', background: 'rgba(255,149,0,0.1)', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{t.deadline}</span>
              </div>
            ))
          }
        </GlassCard>
        <GlassCard style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            Quá hạn
            {overdue.length > 0 && <span style={{ fontSize: 12, color: 'var(--accent-red)', fontWeight: 700, background: 'rgba(255,59,48,0.1)', padding: '1px 8px', borderRadius: 10 }}>{overdue.length}</span>}
          </div>
          {overdue.length === 0
            ? <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>Không có task quá hạn</div>
            : overdue.slice(0, 8).map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(60,60,67,0.06)' }}>
                <Avatar email={t.assignee_email} size={26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{getUserName(t.assignee_email)}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-red)', background: 'rgba(255,59,48,0.1)', padding: '2px 7px', borderRadius: 5, flexShrink: 0 }}>{t.deadline}</span>
              </div>
            ))
          }
        </GlassCard>
      </div>
    </div>
  )
}

// ─── Task Modal ────────────────────────────────────────────────────────────────

function TaskModal({ open, onClose, projectId, task = null, defaultStatus = 'todo' }) {
  const { createTask, updateTask, currentUser, members } = useAppStore()
  const projectMembers = members[projectId] || []
  const assigneeOptions = projectMembers.length > 0
    ? projectMembers.map(m => ({ email: m.email, name: getUserName(m.email) || m.display_name }))
    : KNOWN_USERS.map(u => ({ email: u.email, name: u.name }))
  const [form, setForm] = useState({
    title: '', description: '', assignee_email: currentUser?.email || '',
    status: defaultStatus, priority: 'not_urgent', importance: 'important',
    estimated_hours: '', tags: [], deadline: '',
  })

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '', description: task.description || '',
        assignee_email: task.assignee_email || '',
        status: task.status || 'todo', priority: task.priority || 'not_urgent',
        importance: task.importance || 'important', estimated_hours: task.estimated_hours || '',
        tags: task.tags ? task.tags.split(',').filter(Boolean) : [], deadline: task.deadline || '',
      })
    } else {
      setForm({ title: '', description: '', assignee_email: currentUser?.email || '', status: defaultStatus, priority: 'not_urgent', importance: 'important', estimated_hours: '', tags: [], deadline: '' })
    }
  }, [task, open, defaultStatus])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const data = { ...form, tags: form.tags.join(','), project_id: projectId }
    onClose()
    if (task) {
      updateTask(task.id, data).catch(err => console.error('updateTask failed:', err.message))
    } else {
      createTask(data).catch(err => console.error('createTask failed:', err.message))
    }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-separator)', background: 'rgba(255,255,255,0.5)', fontSize: 15, color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit' }
  const selectStyle = { ...inputStyle, cursor: 'pointer' }
  const labelStyle = { fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }

  return (
    <Modal open={open} onClose={onClose} title={task ? 'Edit Task' : 'New Task'} width={600}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" autoFocus required />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details..." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={selectStyle} value={form.status} onChange={e => set('status', e.target.value)}>
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Deadline</label>
            <input type="date" style={inputStyle} value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Priority</label>
            <select style={selectStyle} value={form.priority} onChange={e => set('priority', e.target.value)}>
              <option value="urgent">Urgent</option>
              <option value="not_urgent">Not Urgent</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Importance</label>
            <select style={selectStyle} value={form.importance} onChange={e => set('importance', e.target.value)}>
              <option value="important">Important</option>
              <option value="not_important">Not Important</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Assignee</label>
            <select style={selectStyle} value={form.assignee_email} onChange={e => set('assignee_email', e.target.value)}>
              <option value="">-- Chọn thành viên --</option>
              {assigneeOptions.map(u => (
                <option key={u.email} value={u.email}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Estimated Hours</label>
            <input type="number" style={inputStyle} value={form.estimated_hours} onChange={e => set('estimated_hours', e.target.value)} min="0" step="0.5" placeholder="0" />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Tags</label>
          <TagInput value={form.tags} onChange={tags => set('tags', tags)} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" disabled={!form.title.trim()}>
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── ProjectDetail ─────────────────────────────────────────────────────────────

const TABS = ['all', 'todo', 'in_progress', 'done', 'cancelled']

const TAB_LABEL = { all: 'All', todo: 'Todo', in_progress: 'In Progress', done: 'Done', cancelled: 'Cancelled' }

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, tasks, loadTasks, loadMembers, triggerSync, reloadTasks, members, addMember, removeMember, currentUser } = useAppStore()
  const [filters, setFilters] = useState({ status: null, assignee_email: null, deadline_from: null, deadline_to: null })
  const [tab, setTab] = useState('all')
  const [view, setView] = useState('kanban')
  const [page, setPage] = useState('tasks')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [defaultStatus, setDefaultStatus] = useState('todo')
  const [syncing, setSyncing] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberError, setMemberError] = useState('')

  const project = projects.find(p => p.id === id)
  const projectTasks = tasks[id] || []

  useEffect(() => {
    loadTasks(id)
    loadMembers(id)
  }, [id])

  const filteredTasks = useMemo(() => {
    let result = tab === 'all'
      ? projectTasks.filter(t => t.status !== 'cancelled')
      : projectTasks.filter(t => t.status === tab)
    if (filters.assignee_email) result = result.filter(t => t.assignee_email === filters.assignee_email)
    if (filters.deadline_from) result = result.filter(t => t.deadline >= filters.deadline_from)
    if (filters.deadline_to) result = result.filter(t => t.deadline <= filters.deadline_to)
    return result
  }, [projectTasks, tab, filters])

  const kanbanTasks = useMemo(() => {
    let result = projectTasks.filter(t => t.status !== 'cancelled')
    if (filters.assignee_email) result = result.filter(t => t.assignee_email === filters.assignee_email)
    if (filters.deadline_from) result = result.filter(t => t.deadline >= filters.deadline_from)
    if (filters.deadline_to) result = result.filter(t => t.deadline <= filters.deadline_to)
    return result
  }, [projectTasks, filters])

  const handleSync = async () => {
    setSyncing(true)
    try { await triggerSync(); await reloadTasks(id) }
    finally { setSyncing(false) }
  }

  const openAddTask = (status = 'todo') => { setDefaultStatus(status); setEditingTask(null); setShowTaskModal(true) }
  const openEditTask = (task) => { setEditingTask(task); setShowTaskModal(true) }

  if (!project) {
    return (
      <PageWrapper>
        <GlassCard style={{ padding: 40 }}>
          <EmptyState title="Project not found" description="This project may have been deleted." />
        </GlassCard>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <button onClick={() => navigate('/projects')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-blue)', fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, padding: 0, marginBottom: 12 }}>
          <ChevronLeft size={16} /> Projects
        </button>
        <GlassCard style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.4px' }}>{project.name}</h1>
                <Badge type={project.status} />
              </div>
              {project.description && <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>{project.description}</div>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {(members[id] || []).map(m => {
                  const isOwner = m.email === project.owner_email
                  const canRemove = project.owner_email === currentUser?.email && !isOwner
                  return (
                    <div key={m.email} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(60,60,67,0.06)', borderRadius: 20, padding: '3px 8px 3px 4px' }}>
                      <Avatar email={m.email} size={22} />
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{getUserName(m.email) || m.display_name}</span>
                      {isOwner && (
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 5, background: 'rgba(0,122,255,0.1)', color: 'var(--accent-blue)', marginLeft: 1 }}>Owner</span>
                      )}
                      {canRemove && (
                        <button
                          onClick={async () => {
                            setMemberError('')
                            try { await removeMember(id, m.email) }
                            catch (err) { setMemberError('Không thể xóa member: ' + err.message) }
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}
                          title="Xóa khỏi project"
                        ><X size={12} /></button>
                      )}
                    </div>
                  )
                })}
                {memberError && (
                  <span style={{ fontSize: 12, color: 'var(--accent-red)', padding: '3px 8px', borderRadius: 20, background: 'rgba(255,59,48,0.08)' }}>{memberError}</span>
                )}
                {project.owner_email === currentUser?.email && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowAddMember(v => !v)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, border: '1.5px dashed var(--border-separator)', background: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-secondary)' }}
                    ><UserPlus size={13} /> Thêm</button>
                    {showAddMember && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 20, background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(20px)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: 8, minWidth: 160 }}>
                        {KNOWN_USERS.filter(u => !(members[id] || []).find(m => m.email === u.email)).map(u => (
                          <button key={u.email} onClick={() => { addMember(id, u.email); setShowAddMember(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', fontSize: 13 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,122,255,0.07)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Avatar email={u.email} size={22} />{u.name}
                          </button>
                        ))}
                        {KNOWN_USERS.filter(u => !(members[id] || []).find(m => m.email === u.email)).length === 0 && (
                          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', padding: '8px 10px' }}>Đã thêm tất cả</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={handleSync} disabled={syncing} size="sm">
                <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </Button>
              <Button onClick={() => openAddTask('todo')} size="sm">
                <Plus size={14} /> Add Task
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Page mode tabs: Tasks / Reports */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { id: 'tasks', label: 'Tasks', icon: LayoutGrid },
          { id: 'reports', label: 'Báo cáo', icon: BarChart2 },
        ].map(({ id: pid, label, icon: Icon }) => (
          <button key={pid} onClick={() => setPage(pid)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 500,
            background: page === pid ? 'var(--accent-blue)' : 'rgba(255,255,255,0.7)',
            color: page === pid ? '#fff' : 'var(--text-secondary)',
            boxShadow: page === pid ? '0 4px 16px rgba(0,122,255,0.25)' : 'none',
            backdropFilter: 'blur(12px)',
            transition: 'all 150ms',
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {page === 'reports' ? (
        <ProjectReports tasks={projectTasks} />
      ) : (
        <>
          {/* Toolbar */}
          <GlassCard style={{ padding: '14px 20px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* View toggle */}
                <div style={{ display: 'flex', gap: 2, padding: 2, background: 'rgba(60,60,67,0.07)', borderRadius: 8 }}>
                  {[
                    { id: 'list', icon: LayoutList, label: 'List' },
                    { id: 'kanban', icon: LayoutGrid, label: 'Kanban' },
                  ].map(v => (
                    <button key={v.id} onClick={() => setView(v.id)} style={{
                      padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 500,
                      background: view === v.id ? '#fff' : 'transparent',
                      color: view === v.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                      boxShadow: view === v.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                      transition: 'all 150ms',
                    }}>
                      <v.icon size={14} /> {v.label}
                    </button>
                  ))}
                </div>

                {/* Tabs (list view only) */}
                {view === 'list' && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {TABS.map(t => {
                      const count = t === 'all'
                        ? projectTasks.filter(x => x.status !== 'cancelled').length
                        : projectTasks.filter(x => x.status === t).length
                      const isCancelledTab = t === 'cancelled'
                      return (
                        <button key={t} onClick={() => setTab(t)} style={{
                          padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          fontSize: 13, fontWeight: 500,
                          background: tab === t
                            ? (isCancelledTab ? 'var(--accent-red)' : 'var(--accent-blue)')
                            : 'rgba(60,60,67,0.06)',
                          color: tab === t ? '#fff' : (isCancelledTab ? 'var(--accent-red)' : 'var(--text-secondary)'),
                          transition: 'all 150ms',
                        }}>
                          {TAB_LABEL[t]}
                          {' '}<span style={{ opacity: 0.7 }}>({count})</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <FilterBar filters={filters} onChange={setFilters} members={KNOWN_USERS.map(u => ({ email: u.email, display_name: u.name }))} />
            </div>
          </GlassCard>

          {/* Content */}
          {view === 'kanban' ? (
            <KanbanBoard tasks={kanbanTasks} onEdit={openEditTask} onAdd={openAddTask} />
          ) : (
            filteredTasks.length === 0 ? (
              <GlassCard style={{ padding: 20 }}>
                <EmptyState title="No tasks found" description="Add a task or adjust your filters." action="Add Task" onAction={() => openAddTask()} icon="📋" />
              </GlassCard>
            ) : (
              <div>{filteredTasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} onClick={() => openEditTask(task)} />)}</div>
            )
          )}
        </>
      )}

      <TaskModal
        open={showTaskModal}
        onClose={() => { setShowTaskModal(false); setEditingTask(null) }}
        projectId={id}
        task={editingTask}
        defaultStatus={defaultStatus}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageWrapper>
  )
}
