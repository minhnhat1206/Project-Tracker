import React from 'react'

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'todo', label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
]

const selectStyle = {
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(60,60,67,0.12)',
  borderRadius: 8,
  padding: '6px 12px',
  fontSize: 13,
  color: 'var(--text-primary)',
  cursor: 'pointer',
  outline: 'none',
  fontFamily: 'inherit',
}

export default function FilterBar({ filters, onChange, members = [] }) {
  const update = (key, val) => onChange({ ...filters, [key]: val })

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <select style={selectStyle} value={filters.status || ''} onChange={e => update('status', e.target.value || null)}>
        {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {members.length > 0 && (
        <select style={selectStyle} value={filters.assignee_email || ''} onChange={e => update('assignee_email', e.target.value || null)}>
          <option value="">All Members</option>
          {members.map(m => (
            <option key={m.email} value={m.email}>{m.display_name || m.email}</option>
          ))}
        </select>
      )}

      <input
        style={{ ...selectStyle, width: 140 }}
        type="date"
        placeholder="From date"
        value={filters.deadline_from || ''}
        onChange={e => update('deadline_from', e.target.value || null)}
      />
      <input
        style={{ ...selectStyle, width: 140 }}
        type="date"
        placeholder="To date"
        value={filters.deadline_to || ''}
        onChange={e => update('deadline_to', e.target.value || null)}
      />

      {(filters.status || filters.assignee_email || filters.deadline_from || filters.deadline_to) && (
        <button
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 12, color: 'var(--accent-blue)', fontWeight: 600,
          }}
          onClick={() => onChange({ status: null, assignee_email: null, deadline_from: null, deadline_to: null })}
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
