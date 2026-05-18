import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Modal({ open, onClose, title, children, width = 560 }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.2)',
              backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1001,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px',
            pointerEvents: 'none',
          }}>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
            style={{
              width: '100%',
              maxWidth: width,
              maxHeight: '90vh',
              overflow: 'auto',
              pointerEvents: 'auto',
            }}
          >
            <div
              className="glass-card"
              style={{ padding: 28, borderRadius: 20 }}
              onClick={e => e.stopPropagation()}
            >
              {title && (
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-0.2px' }}>{title}</h2>
                  <button
                    onClick={onClose}
                    style={{
                      background: 'rgba(60,60,67,0.08)', border: 'none', borderRadius: 8,
                      width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 16, fontWeight: 700,
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
              {children}
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
