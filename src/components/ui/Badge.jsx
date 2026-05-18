import React from 'react'

const statusColors = {
  todo: { bg: 'rgba(99,99,102,0.12)', color: '#636366' },
  in_progress: { bg: 'rgba(0,122,255,0.12)', color: '#007AFF' },
  done: { bg: 'rgba(52,199,89,0.12)', color: '#34C759' },
  cancelled: { bg: 'rgba(255,59,48,0.12)', color: '#FF3B30' },
  active: { bg: 'rgba(52,199,89,0.12)', color: '#34C759' },
  archived: { bg: 'rgba(99,99,102,0.12)', color: '#636366' },
  urgent: { bg: 'rgba(255,59,48,0.12)', color: '#FF3B30' },
  not_urgent: { bg: 'rgba(255,149,0,0.12)', color: '#FF9500' },
  important: { bg: 'rgba(88,86,214,0.12)', color: '#5856D6' },
  not_important: { bg: 'rgba(99,99,102,0.12)', color: '#636366' },
  owner: { bg: 'rgba(0,122,255,0.12)', color: '#007AFF' },
  member: { bg: 'rgba(99,99,102,0.12)', color: '#636366' },
}

const statusLabels = {
  todo: 'Todo',
  in_progress: 'In Progress',
  done: 'Done',
  cancelled: 'Cancelled',
  active: 'Active',
  archived: 'Archived',
  urgent: 'Urgent',
  not_urgent: 'Not Urgent',
  important: 'Important',
  not_important: 'Low Priority',
  owner: 'Owner',
  member: 'Member',
}

export default function Badge({ type, label, style = {} }) {
  const colors = statusColors[type] || { bg: 'rgba(99,99,102,0.12)', color: '#636366' }
  const text = label || statusLabels[type] || type

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.3px',
        background: colors.bg,
        color: colors.color,
        ...style,
      }}
    >
      {text}
    </span>
  )
}
