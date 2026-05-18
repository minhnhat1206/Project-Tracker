import React from 'react'

const variants = {
  primary: {
    background: 'var(--accent-blue)',
    color: '#fff',
    border: 'none',
  },
  secondary: {
    background: 'rgba(255,255,255,0.72)',
    backdropFilter: 'blur(20px)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-separator)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
  destructive: {
    background: 'rgba(255,59,48,0.1)',
    color: 'var(--accent-red)',
    border: '1px solid rgba(255,59,48,0.2)',
  },
}

export default function Button({ children, variant = 'primary', onClick, disabled, style = {}, type = 'button', size = 'md' }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    fontWeight: 600,
    fontSize: size === 'sm' ? 13 : 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 150ms ease-out',
    padding: size === 'sm' ? '6px 14px' : '10px 20px',
    outline: 'none',
    ...variants[variant],
    ...style,
  }

  return (
    <button
      type={type}
      style={base}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={e => {
        if (!disabled) e.currentTarget.style.filter = variant === 'primary' ? 'brightness(1.1)' : 'brightness(0.97)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.filter = 'none'
      }}
      onMouseDown={e => {
        if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {children}
    </button>
  )
}
