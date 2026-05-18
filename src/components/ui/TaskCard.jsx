import React, { useState } from 'react'
import Avatar from './Avatar'
import useAppStore from '../../store/useAppStore'
import { getUserName } from '../../config/users'

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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline + 'T00:00:00')
  const diff = Math.ceil((d - today) / 86400000)
  if (diff < 0) return { color: 'var(--accent-red)', bg: 'rgba(255,59,48,0.1)' }
  if (diff <= 2) return { color: 'var(--accent-orange)', bg: 'rgba(255,149,0,0.1)' }
  return { color: 'var(--text-secondary)', bg: 'rgba(60,60,67,0.06)' }
}

export default function TaskCard({ task, index = 0, onClick }) {
  const { updateTask } = useAppStore()
  const isDone = task.status === 'done'
  const quadrant = getQuadrant(task)
  const accentColor = quadrantColors[quadrant]
  const deadlineStyle = getDeadlineStyle(task.deadline)
  const tags = task.tags ? task.tags.split(',').filter(Boolean) : []
  const [errMsg, setErrMsg] = useState('')

  const handleCheck = async (e) => {
    e.stopPropagation()
    e.preventDefault()
    console.log('[checkbox] clicked, task:', task.id, 'status:', task.status)
    setErrMsg('')
    const newStatus = isDone ? 'todo' : 'done'
    try {
      await updateTask(task.id, { status: newStatus })
      console.log('[checkbox] success →', newStatus)
    } catch (err) {
      const msg = err?.message || String(err)
      console.error('[checkbox] failed:', msg)
      setErrMsg(msg)
      setTimeout(() => setErrMsg(''), 5000)
    }
  }

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        position: 'relative',
        borderLeft: `4px solid ${accentColor}`,
        borderRadius: 16,
        marginBottom: 8,
        transition: 'box-shadow 150ms ease-out, transform 150ms ease-out',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = ''
        e.currentTarget.style.boxShadow = ''
      }}
    >
      {/* Checkbox — plain button, không liên quan Framer Motion */}
      <button
        type="button"
        onClick={handleCheck}
        style={{
          flexShrink: 0,
          width: 48, height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{
          width: 20, height: 20, borderRadius: 6,
          border: `2px solid ${isDone ? accentColor : 'var(--border-separator)'}`,
          background: isDone ? accentColor : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 200ms',
        }}>
          {isDone && (
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </button>

      {/* Content */}
      <div
        onClick={onClick}
        style={{ flex: 1, minWidth: 0, padding: '14px 12px 14px 0', cursor: 'pointer' }}
      >
        <div style={{
          fontSize: 15, fontWeight: 500,
          color: isDone ? 'var(--text-tertiary)' : 'var(--text-primary)',
          textDecoration: isDone ? 'line-through' : 'none',
          opacity: isDone ? 0.5 : 1,
          transition: 'all 200ms',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.title}
        </div>
        {errMsg && (
          <div style={{ fontSize: 11, color: 'var(--accent-red)', marginTop: 3 }}>
            ⚠ {errMsg}
          </div>
        )}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
            {tags.slice(0, 3).map(tag => (
              <span key={tag} style={{
                fontSize: 11, padding: '1px 6px', borderRadius: 4,
                background: 'rgba(0,122,255,0.08)', color: 'var(--accent-blue)', fontWeight: 500,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Right */}
      <div
        onClick={onClick}
        style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, padding: '14px 16px 14px 0', cursor: 'pointer' }}
      >
        {task.deadline && deadlineStyle && (
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
            background: deadlineStyle.bg, color: deadlineStyle.color,
          }}>
            {task.deadline}
          </span>
        )}
        {task.assignee_email && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>
            {getUserName(task.assignee_email)}
          </span>
        )}
        <Avatar email={task.assignee_email} size={28} />
      </div>
    </div>
  )
}
