import React, { useEffect, useMemo } from 'react'
import { CheckSquare, TrendingUp, AlertCircle, Clock } from 'lucide-react'
import PageWrapper from '../components/layout/PageWrapper'
import StatCard from '../components/ui/StatCard'
import GlassCard from '../components/ui/GlassCard'
import Avatar from '../components/ui/Avatar'
import DonutChart from '../components/charts/DonutChart'
import ProgressRing from '../components/charts/ProgressRing'
import EmptyState from '../components/ui/EmptyState'
import useAppStore from '../store/useAppStore'

const STATUS_COLORS = {
  todo: '#AEAEB2',
  in_progress: 'var(--accent-blue)',
}

function MyTaskRow({ task, projectName }) {
  const { updateTask } = useAppStore()
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const isOverdue = task.deadline && new Date(task.deadline + 'T00:00:00') < today
  const isDueToday = task.deadline && new Date(task.deadline + 'T00:00:00').getTime() === today.getTime()
  const isInProgress = task.status === 'in_progress'

  const handleCheck = () => {
    updateTask(task.id, { status: 'done' }).catch(err => console.error('updateTask failed:', err.message))
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 0',
      borderBottom: '1px solid rgba(60,60,67,0.07)',
    }}>
      {/* Checkbox */}
      <button
        type="button"
        onClick={handleCheck}
        style={{
          flexShrink: 0, width: 20, height: 20, borderRadius: 6,
          border: `2px solid ${isInProgress ? 'var(--accent-blue)' : 'var(--border-separator)'}`,
          background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, transition: 'all 150ms',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-blue)'; e.currentTarget.style.background = 'rgba(0,122,255,0.08)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = isInProgress ? 'var(--accent-blue)' : 'var(--border-separator)'; e.currentTarget.style.background = 'transparent' }}
        title="Đánh dấu hoàn thành"
      />

      {/* Status dot */}
      <div style={{
        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
        background: isOverdue ? 'var(--accent-red)' : isDueToday ? 'var(--accent-orange)' : STATUS_COLORS[task.status] || '#AEAEB2',
      }} />

      {/* Title + project */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 14, fontWeight: 500,
          color: isOverdue ? 'var(--accent-red)' : 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.title}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>{projectName}</div>
      </div>

      {/* Status badge */}
      {isInProgress && (
        <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,122,255,0.10)', color: 'var(--accent-blue)', flexShrink: 0 }}>
          Đang làm
        </span>
      )}

      {/* Deadline */}
      {task.deadline && (
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6, flexShrink: 0,
          background: isOverdue ? 'rgba(255,59,48,0.1)' : isDueToday ? 'rgba(255,149,0,0.1)' : 'rgba(60,60,67,0.07)',
          color: isOverdue ? 'var(--accent-red)' : isDueToday ? 'var(--accent-orange)' : 'var(--text-secondary)',
        }}>
          {isOverdue ? 'Quá hạn' : isDueToday ? 'Hôm nay' : task.deadline}
        </span>
      )}
    </div>
  )
}

export default function Dashboard() {
  const { projects, tasks, currentUser, loadProjects, loadTasks } = useAppStore()

  useEffect(() => {
    loadProjects().then(projs => {
      if (projs) projs.forEach(p => loadTasks(p.id))
    })
  }, [])

  const allTasks = useMemo(() => Object.values(tasks).flat(), [tasks])

  const projectMap = useMemo(() => {
    const m = {}
    projects.forEach(p => { m[p.id] = p.name })
    return m
  }, [projects])

  const stats = useMemo(() => {
    const total = allTasks.length
    const done = allTasks.filter(t => t.status === 'done').length
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const overdue = allTasks.filter(t => t.deadline && t.status !== 'done' && new Date(t.deadline + 'T00:00:00') < today).length
    const hours = allTasks.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0)
    const donePercent = total > 0 ? Math.round(done / total * 100) : 0
    return { total, donePercent, overdue, hours }
  }, [allTasks])

  const myTasks = useMemo(() => {
    if (!currentUser) return []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    return allTasks
      .filter(t =>
        t.assignee_email === currentUser.email &&
        (t.status === 'todo' || t.status === 'in_progress') &&
        (t.status === 'in_progress' || (t.deadline && new Date(t.deadline + 'T00:00:00') < tomorrow))
      )
      .sort((a, b) => {
        const aOver = a.deadline && new Date(a.deadline + 'T00:00:00') < today
        const bOver = b.deadline && new Date(b.deadline + 'T00:00:00') < today
        if (aOver && !bOver) return -1
        if (!aOver && bOver) return 1
        if (!a.deadline) return 1
        if (!b.deadline) return -1
        return new Date(a.deadline) - new Date(b.deadline)
      })
  }, [allTasks, currentUser])

  const overdueCount = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return myTasks.filter(t => t.deadline && new Date(t.deadline + 'T00:00:00') < today).length
  }, [myTasks])

  const inProgressCount = myTasks.filter(t => t.status === 'in_progress').length

  const donutData = useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0, cancelled: 0 }
    allTasks.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++ })
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }))
  }, [allTasks])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return 'Chào buổi sáng'
    if (h < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }, [])

  return (
    <PageWrapper>
      {/* ── My Tasks hero ── */}
      <div style={{
        borderRadius: 20,
        background: 'rgba(255,255,255,0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,122,255,0.15)',
        boxShadow: '0 4px 32px rgba(0,122,255,0.08)',
        marginBottom: 20,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(0,122,255,0.10) 0%, rgba(88,86,214,0.07) 100%)',
          borderBottom: '1px solid rgba(0,122,255,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar email={currentUser?.email} size={44} />
            <div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{greeting},</div>
              <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>
                {currentUser?.name || 'bạn'} 👋
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.6)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-blue)' }}>{myTasks.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Task hôm nay</div>
            </div>
            {inProgressCount > 0 && (
              <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: 'rgba(0,122,255,0.08)' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-blue)' }}>{inProgressCount}</div>
                <div style={{ fontSize: 11, color: 'var(--accent-blue)' }}>Đang làm</div>
              </div>
            )}
            {overdueCount > 0 && (
              <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 12, background: 'rgba(255,59,48,0.08)' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-red)' }}>{overdueCount}</div>
                <div style={{ fontSize: 11, color: 'var(--accent-red)' }}>Quá hạn</div>
              </div>
            )}
          </div>
        </div>

        {/* Task list */}
        <div style={{ padding: '4px 24px 8px' }}>
          {myTasks.length === 0 ? (
            <EmptyState title="Không có task nào hôm nay" description="Không có task nào đến hạn hôm nay hoặc đang thực hiện." icon="✅" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: myTasks.length > 5 ? '1fr 1fr' : '1fr', gap: '0 32px' }}>
              {myTasks.map(task => (
                <MyTaskRow key={task.id} task={task} projectName={projectMap[task.project_id] || ''} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <StatCard icon={CheckSquare} label="Total Tasks" value={stats.total} color="var(--accent-blue)" />
        <StatCard icon={TrendingUp} label="Done %" value={stats.donePercent} suffix="%" color="var(--accent-green)" />
        <StatCard icon={AlertCircle} label="Overdue" value={stats.overdue} color="var(--accent-red)" />
        <StatCard icon={Clock} label="Hours Logged" value={stats.hours} color="var(--accent-orange)" />
      </div>

      {/* ── Charts + Project Progress ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <GlassCard style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Phân bổ task</div>
          {donutData.length > 0
            ? <DonutChart data={donutData} height={180} />
            : <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>Chưa có task</div>
          }
        </GlassCard>

        <GlassCard style={{ padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Project Progress</div>
          {projects.filter(p => p.status === 'active').length === 0 ? (
            <EmptyState title="Chưa có project" description="" icon="📁" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {projects.filter(p => p.status === 'active').map(project => {
                const pt = tasks[project.id] || []
                const total = pt.length
                const done = pt.filter(t => t.status === 'done').length
                const percent = total > 0 ? Math.round(done / total * 100) : 0
                return (
                  <div key={project.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <ProgressRing percent={percent} size={44} strokeWidth={4} color="var(--accent-blue)" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{project.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{done}/{total} tasks</div>
                      <div style={{ height: 4, background: 'rgba(60,60,67,0.1)', borderRadius: 2, marginTop: 5 }}>
                        <div style={{ height: '100%', width: `${percent}%`, background: 'var(--accent-blue)', borderRadius: 2, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-blue)', minWidth: 40, textAlign: 'right' }}>{percent}%</div>
                  </div>
                )
              })}
            </div>
          )}
        </GlassCard>
      </div>
    </PageWrapper>
  )
}
