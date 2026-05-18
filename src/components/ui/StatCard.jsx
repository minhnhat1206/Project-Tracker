import React, { useEffect, useState } from 'react'
import GlassCard from './GlassCard'

function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (target === 0) { setCount(0); return }
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [target])
  return count
}

export default function StatCard({ icon: Icon, label, value, unit = '', color = 'var(--accent-blue)', suffix = '' }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0
  const animated = useCountUp(numericValue)
  const display = typeof value === 'number' ? animated : value

  return (
    <GlassCard style={{ padding: 20, minHeight: 120 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}1e`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {Icon && <Icon size={20} color={color} strokeWidth={2} />}
        </div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text-primary)', lineHeight: 1 }}>
        {display}{suffix}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
    </GlassCard>
  )
}
