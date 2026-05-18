import React from 'react'
import { useSync } from '../../hooks/useSync'

function formatRelativeTime(date) {
  if (!date) return 'Never synced'
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  return `${Math.floor(diff / 3600)}h ago`
}

export default function SyncIndicator() {
  const { status, lastSynced, errorMsg, triggerSync } = useSync()

  if (status === 'syncing') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          border: '2px solid var(--accent-blue)',
          borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        Syncing...
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-red)' }} />
        <span style={{ color: 'var(--accent-red)' }}>Sync failed</span>
        <button
          onClick={triggerSync}
          style={{
            fontSize: 12, color: 'var(--accent-blue)', background: 'none', border: 'none',
            cursor: 'pointer', fontWeight: 600, textDecoration: 'underline',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)' }} />
      Synced {formatRelativeTime(lastSynced)}
    </div>
  )
}
