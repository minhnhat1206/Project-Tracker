import React from 'react'
import { useLocation } from 'react-router-dom'
import SyncIndicator from '../ui/SyncIndicator'
import Avatar from '../ui/Avatar'
import useAppStore from '../../store/useAppStore'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/matrix': 'Eisenhower Matrix',
  '/calendar': 'Calendar',
  '/settings': 'Settings',
}

export default function TopBar() {
  const location = useLocation()
  const { currentUser } = useAppStore()

  const title = pageTitles[location.pathname] ||
    (location.pathname.startsWith('/projects/') ? 'Project Detail' : 'Project Tracker')

  return (
    <header
      className="glass-topbar"
      style={{
        position: 'fixed',
        top: 0, left: 240, right: 0,
        height: 64,
        zIndex: 90,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 16,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px', flex: 1 }}>
        {title}
      </div>

      <SyncIndicator />

      {currentUser && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar email={currentUser.email} name={currentUser.displayName} size={32} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentUser.displayName || currentUser.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{currentUser.email}</div>
          </div>
        </div>
      )}
    </header>
  )
}
