import React, { useState } from 'react'

export default function TagInput({ value = [], onChange }) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const tag = input.trim().toLowerCase()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
    }
    setInput('')
  }

  const removeTag = (tag) => onChange(value.filter(t => t !== tag))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
      padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-separator)',
      background: 'rgba(255,255,255,0.5)', minHeight: 38,
    }}>
      {value.map(tag => (
        <span key={tag} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 12, padding: '2px 8px', borderRadius: 6,
          background: 'rgba(0,122,255,0.1)', color: 'var(--accent-blue)', fontWeight: 500,
        }}>
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={value.length === 0 ? 'Add tags...' : ''}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          fontSize: 13, color: 'var(--text-primary)', flex: 1, minWidth: 80,
          fontFamily: 'inherit',
        }}
      />
    </div>
  )
}
