import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FolderOpen, Grid2x2, Calendar, Settings, LogOut } from 'lucide-react'
import Avatar from '../ui/Avatar'
import useAppStore from '../../store/useAppStore'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderOpen },
  { path: '/matrix', label: 'Matrix', icon: Grid2x2 },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAppStore()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className="glass-sidebar"
      style={{
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        width: 240,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '8px 12px 24px', marginBottom: 4 }}>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
          Project Tracker
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>Team workspace</div>
      </div>

      {/* Main nav */}
      <div style={{ marginBottom: 8 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.8px',
          color: 'var(--text-tertiary)', textTransform: 'uppercase',
          padding: '4px 12px 8px',
        }}>
          Navigation
        </div>
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))
          return (
            <NavLink
              key={path}
              to={path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                height: 36,
                padding: '0 12px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                background: isActive ? 'rgba(0,122,255,0.12)' : 'transparent',
                transition: 'all 150ms ease-out',
                marginBottom: 2,
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              {label}
            </NavLink>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Settings */}
      <NavLink
        to="/settings"
        style={{
          display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 12px',
          borderRadius: 10, textDecoration: 'none', fontSize: 14,
          fontWeight: location.pathname === '/settings' ? 600 : 400,
          color: location.pathname === '/settings' ? 'var(--accent-blue)' : 'var(--text-secondary)',
          background: location.pathname === '/settings' ? 'rgba(0,122,255,0.12)' : 'transparent',
          transition: 'all 150ms ease-out',
        }}
      >
        <Settings size={18} />
        Settings
      </NavLink>

      {/* Current user + logout */}
      {currentUser && (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          borderRadius: 12, background: 'rgba(60,60,67,0.05)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Avatar email={currentUser.email} size={32} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser.name || currentUser.displayName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{currentUser.role || 'member'}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Đăng xuất"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-tertiary)', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-red)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </aside>
  )
}
