import React, { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import GlassCard from '../components/ui/GlassCard'
import Modal from '../components/ui/Modal'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import useAppStore from '../store/useAppStore'
import { getUserName } from '../config/users'

const STATUS_CHIP = {
  todo:        { bg: 'rgba(174,174,178,0.18)', color: '#636366',         dot: '#AEAEB2' },
  in_progress: { bg: 'rgba(0,122,255,0.13)',   color: 'var(--accent-blue)', dot: 'var(--accent-blue)' },
  done:        { bg: 'rgba(52,199,89,0.13)',    color: '#34C759',          dot: '#34C759' },
  cancelled:   { bg: 'rgba(60,60,67,0.08)',     color: '#AEAEB2',          dot: '#AEAEB2' },
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarView() {
  const { projects, tasks, loadProjects, loadTasks, currentUser } = useAppStore()
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [onlyMine, setOnlyMine] = useState(false)

  useEffect(() => {
    loadProjects().then(projs => {
      if (projs) projs.forEach(p => loadTasks(p.id))
    })
  }, [])

  const allTasks = useMemo(() => Object.values(tasks).flat(), [tasks])

  const visibleTasks = useMemo(() => {
    const base = allTasks.filter(t => t.deadline)
    if (onlyMine && currentUser) return base.filter(t => t.assignee_email === currentUser.email)
    return base
  }, [allTasks, onlyMine, currentUser])

  const tasksByDate = useMemo(() => {
    const map = {}
    visibleTasks.forEach(task => {
      if (!map[task.deadline]) map[task.deadline] = []
      map[task.deadline].push(task)
    })
    return map
  }, [visibleTasks])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const formatDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const monthGrid = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
    return cells
  }, [viewDate])

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const projectMap = useMemo(() => {
    const m = {}
    projects.forEach(p => { m[p.id] = p })
    return m
  }, [projects])

  // Day detail panel tasks
  const selectedDayTasks = selectedDay ? (tasksByDate[selectedDay] || []) : []

  return (
    <PageWrapper>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-separator)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, minWidth: 180, textAlign: 'center' }}>
            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
          </span>
          <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid var(--border-separator)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => { setViewDate(new Date()); setSelectedDay(null) }} style={{ fontSize: 13, fontWeight: 600, background: 'rgba(0,122,255,0.1)', color: 'var(--accent-blue)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
            Today
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setOnlyMine(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20,
              border: onlyMine ? '1.5px solid var(--accent-blue)' : '1.5px solid var(--border-separator)',
              background: onlyMine ? 'rgba(0,122,255,0.10)' : 'rgba(255,255,255,0.6)',
              color: onlyMine ? 'var(--accent-blue)' : 'var(--text-secondary)',
              cursor: 'pointer', fontSize: 13, fontWeight: onlyMine ? 600 : 400, transition: 'all 150ms',
            }}
          >
            {currentUser && <Avatar email={currentUser.email} size={18} />}
            Của tôi
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedDay ? '1fr 280px' : '1fr', gap: 16 }}>
        {/* Calendar grid */}
        <GlassCard style={{ padding: 16 }}>
          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {DAYS_OF_WEEK.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.6px', textTransform: 'uppercase', padding: '4px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {monthGrid.map((date, i) => {
              if (!date) return <div key={i} />
              const dateStr = formatDate(date)
              const dayTasks = tasksByDate[dateStr] || []
              const isToday = dateStr === formatDate(today)
              const isPast = date < today
              const isSelected = dateStr === selectedDay

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  style={{
                    minHeight: 80, borderRadius: 10, padding: '6px 8px',
                    background: isSelected ? 'rgba(0,122,255,0.10)' : isToday ? 'rgba(0,122,255,0.06)' : 'rgba(60,60,67,0.03)',
                    border: isSelected ? '2px solid var(--accent-blue)' : isToday ? '2px solid rgba(0,122,255,0.35)' : '1px solid transparent',
                    cursor: dayTasks.length > 0 ? 'pointer' : 'default',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={e => { if (dayTasks.length > 0) e.currentTarget.style.background = 'rgba(0,122,255,0.06)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSelected ? 'rgba(0,122,255,0.10)' : isToday ? 'rgba(0,122,255,0.06)' : 'rgba(60,60,67,0.03)' }}
                >
                  <div style={{
                    fontSize: 13, fontWeight: isToday ? 700 : 400,
                    color: isToday ? 'var(--accent-blue)' : isPast ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    marginBottom: 4,
                  }}>
                    {date.getDate()}
                  </div>
                  {dayTasks.slice(0, 3).map(task => {
                    const chip = STATUS_CHIP[task.status] || STATUS_CHIP.todo
                    return (
                      <div
                        key={task.id}
                        onClick={e => { e.stopPropagation(); setSelectedTask(task) }}
                        style={{
                          fontSize: 10, fontWeight: 600, padding: '2px 5px', borderRadius: 4,
                          background: chip.bg, color: chip.color,
                          marginBottom: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 3,
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          opacity: task.status === 'cancelled' ? 0.5 : 1,
                        }}
                        title={task.title}
                      >
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: chip.dot, flexShrink: 0, display: 'inline-block' }} />
                        {task.title}
                      </div>
                    )
                  })}
                  {dayTasks.length > 3 && (
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlassCard>

        {/* Side panel — tasks for selected day */}
        {selectedDay && (
          <GlassCard style={{ padding: 16, alignSelf: 'start' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-primary)' }}>
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {selectedDayTasks.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>Không có task</div>
            ) : (
              selectedDayTasks.map(task => {
                const chip = STATUS_CHIP[task.status] || STATUS_CHIP.todo
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    style={{
                      padding: '10px 12px', borderRadius: 10, marginBottom: 8,
                      background: 'rgba(255,255,255,0.6)', border: `1px solid ${chip.bg}`,
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.9)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.6)'}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 5 }}>{task.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '1px 7px', borderRadius: 4, background: chip.bg, color: chip.color }}>
                        {task.status === 'todo' ? 'Todo' : task.status === 'in_progress' ? 'Đang làm' : task.status === 'done' ? 'Xong' : 'Huỷ'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                        {projectMap[task.project_id]?.name || ''}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </GlassCard>
        )}
      </div>

      {/* Task detail modal */}
      <Modal open={!!selectedTask} onClose={() => setSelectedTask(null)} title="Chi tiết task">
        {selectedTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{selectedTask.title}</div>
            {selectedTask.description && (
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedTask.description}</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Trạng thái</div>
                <Badge type={selectedTask.status} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Deadline</div>
                <div style={{ fontSize: 14 }}>{selectedTask.deadline || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Assignee</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Avatar email={selectedTask.assignee_email} size={20} />
                  <span style={{ fontSize: 13 }}>{getUserName(selectedTask.assignee_email)}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>Project</div>
                <div style={{ fontSize: 14 }}>{projectMap[selectedTask.project_id]?.name || selectedTask.project_id}</div>
              </div>
            </div>
            {selectedTask.tags && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 6 }}>Tags</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {selectedTask.tags.split(',').filter(Boolean).map(t => (
                    <span key={t} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 6, background: 'rgba(0,122,255,0.1)', color: 'var(--accent-blue)', fontWeight: 500 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </PageWrapper>
  )
}
