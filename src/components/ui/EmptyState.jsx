import React from 'react'
import Button from './Button'

export default function EmptyState({ title, description, action, onAction, icon }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 20px', textAlign: 'center', gap: 12,
    }}>
      {icon && (
        <div style={{ fontSize: 48, marginBottom: 8, opacity: 0.4 }}>{icon}</div>
      )}
      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</div>
      {description && (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 320 }}>{description}</div>
      )}
      {action && onAction && (
        <Button onClick={onAction} style={{ marginTop: 8 }}>{action}</Button>
      )}
    </div>
  )
}
