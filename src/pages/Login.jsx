import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KNOWN_USERS } from '../config/users'
import useAppStore from '../store/useAppStore'
import Avatar from '../components/ui/Avatar'

export default function Login() {
  const { login } = useAppStore()
  const navigate = useNavigate()
  const [remember, setRemember] = useState(true)
  const [selecting, setSelecting] = useState(null)

  const handleSelect = async (user) => {
    setSelecting(user.email)
    login(user.email, remember)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `
        radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,179,237,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 80%, rgba(167,139,250,0.15) 0%, transparent 55%),
        #F2F2F7
      `,
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #007AFF, #5856D6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 32px rgba(0,122,255,0.3)',
          }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="4" width="8" height="8" rx="2" fill="white" fillOpacity="0.9" />
              <rect x="16" y="4" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="4" y="16" width="8" height="8" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="16" y="16" width="8" height="8" rx="2" fill="white" fillOpacity="0.9" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 6 }}>
            Project Tracker
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Chọn tài khoản để tiếp tục</p>
        </div>

        {/* User cards */}
        <div style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          padding: 8,
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.8)',
          marginBottom: 16,
        }}>
          {KNOWN_USERS.map((user, i) => (
            <button
              key={user.email}
              onClick={() => handleSelect(user)}
              disabled={selecting === user.email}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 14,
                border: 'none',
                background: selecting === user.email ? 'rgba(0,122,255,0.08)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 150ms',
                textAlign: 'left',
              }}
              onMouseEnter={e => { if (selecting !== user.email) e.currentTarget.style.background = 'rgba(0,0,0,0.04)' }}
              onMouseLeave={e => { if (selecting !== user.email) e.currentTarget.style.background = 'transparent' }}
            >
              <Avatar email={user.email} size={44} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user.name}
                  {user.role === 'owner' && (
                    <span style={{
                      marginLeft: 8, fontSize: 10, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 6,
                      background: 'rgba(0,122,255,0.1)', color: 'var(--accent-blue)',
                      textTransform: 'uppercase', letterSpacing: '0.5px',
                    }}>Owner</span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{user.email}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3 }}>
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>

        {/* Remember me */}
        <label style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 8px', cursor: 'pointer',
          fontSize: 14, color: 'var(--text-secondary)',
        }}>
          <div
            onClick={() => setRemember(r => !r)}
            style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: `2px solid ${remember ? 'var(--accent-blue)' : 'var(--border-separator)'}`,
              background: remember ? 'var(--accent-blue)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 200ms',
            }}
          >
            {remember && (
              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                <path d="M1 4L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          Ghi nhớ đăng nhập
        </label>
      </div>
    </div>
  )
}
