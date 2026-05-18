import React from 'react'
import { getUserName } from '../../config/users'

function hashColor(str) {
  const colors = [
    '#007AFF', '#5856D6', '#32ADE6', '#34C759',
    '#FF9500', '#FF3B30', '#FF2D55', '#AF52DE',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

export default function Avatar({ email = '', name = '', size = 32 }) {
  const displayName = name || getUserName(email) || email
  const initials = getInitials(displayName)
  const bg = hashColor(email || displayName)

  return (
    <div
      title={displayName}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size * 0.36,
        fontWeight: 700,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials}
    </div>
  )
}
