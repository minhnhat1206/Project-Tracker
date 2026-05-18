import React, { useEffect, useState } from 'react'
import { RefreshCw, UserPlus, Trash2, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import GlassCard from '../components/ui/GlassCard'
import Button from '../components/ui/Button'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import useAppStore from '../store/useAppStore'

const SYNC_USER = 'minhnhatnhc@gmail.com'

function Section({ title, children }) {
  return (
    <GlassCard style={{ padding: 24, marginBottom: 20 }}>
      <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, letterSpacing: '-0.2px' }}>{title}</div>
      {children}
    </GlassCard>
  )
}

export default function Settings() {
  const { projects, members, currentUser, loadProjects, loadMembers, addMember, removeMember, triggerSync, lastSynced, syncStatus } = useAppStore()
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState(null)
  const [autoSync, setAutoSync] = useState(true)

  useEffect(() => {
    loadProjects().then(projs => {
      if (projs?.length > 0) setSelectedProjectId(projs[0].id)
    })
  }, [])

  useEffect(() => {
    if (selectedProjectId) loadMembers(selectedProjectId)
  }, [selectedProjectId])

  const projectMembers = members[selectedProjectId] || []
  const currentProject = projects.find(p => p.id === selectedProjectId)
  const isOwner = currentProject?.owner_email === currentUser?.email

  const handleSync = async () => {
    setSyncing(true)
    try { await triggerSync() } finally { setSyncing(false) }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newEmail.trim() || !selectedProjectId) return
    setAddLoading(true)
    try {
      await addMember(selectedProjectId, newEmail.trim())
      setNewEmail('')
    } catch (err) {
      alert('Failed to add member: ' + err.message)
    } finally {
      setAddLoading(false)
    }
  }

  const handleRemoveMember = async (email) => {
    try {
      await removeMember(selectedProjectId, email)
      setRemoveConfirm(null)
    } catch (err) {
      alert('Failed to remove member: ' + err.message)
    }
  }

  const formatDate = (d) => {
    if (!d) return 'Never'
    return new Date(d).toLocaleString()
  }

  const inputStyle = {
    flex: 1, padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border-separator)',
    background: 'rgba(255,255,255,0.5)', fontSize: 15,
    color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
  }

  return (
    <PageWrapper>
      {/* Sync Configuration */}
      <Section title="Sync Configuration">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Last synced</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{formatDate(lastSynced)}</div>
          </div>
          <Button onClick={handleSync} disabled={syncing} variant="secondary">
            <RefreshCw size={14} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 0', borderTop: '1px solid var(--border-separator)',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Auto sync every 30 min</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Automatically sync with Google Calendar</div>
          </div>
          <button
            onClick={() => setAutoSync(v => !v)}
            style={{
              width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: autoSync ? 'var(--accent-blue)' : 'rgba(60,60,67,0.2)',
              position: 'relative', transition: 'background 200ms',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', background: '#fff',
              position: 'absolute', top: 3,
              left: autoSync ? 21 : 3,
              transition: 'left 200ms',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>

        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: 'rgba(88,86,214,0.08)', border: '1px solid rgba(88,86,214,0.2)',
          display: 'flex', gap: 8, alignItems: 'flex-start',
        }}>
          <Info size={16} color="var(--accent-indigo)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: 'var(--accent-indigo)', lineHeight: 1.5 }}>
            Google Tasks sync chỉ áp dụng cho tài khoản <strong>{SYNC_USER}</strong>. Calendar sync áp dụng cho tất cả members.
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </Section>

      {/* Members */}
      <Section title="Members">
        {/* Project selector */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Project</label>
          <select
            value={selectedProjectId}
            onChange={e => setSelectedProjectId(e.target.value)}
            style={{
              padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border-separator)',
              background: 'rgba(255,255,255,0.5)', fontSize: 14, color: 'var(--text-primary)',
              outline: 'none', cursor: 'pointer', fontFamily: 'inherit', minWidth: 220,
            }}
          >
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Member list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {projectMembers.map(member => (
            <div key={member.email} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 12,
              background: 'rgba(60,60,67,0.04)', border: '1px solid var(--border-separator)',
            }}>
              <Avatar email={member.email} name={member.display_name} size={36} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{member.display_name || member.email.split('@')[0]}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{member.email}</div>
              </div>
              <Badge type={member.role} />
              {isOwner && member.role !== 'owner' && (
                <Button
                  variant="destructive" size="sm"
                  onClick={() => setRemoveConfirm(member.email)}
                >
                  <Trash2 size={13} />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Add member form */}
        {isOwner && (
          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: 8 }}>
            <input
              style={inputStyle}
              type="email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              placeholder="Add member by email..."
            />
            <Button type="submit" disabled={addLoading || !newEmail.trim()}>
              <UserPlus size={15} />
              {addLoading ? 'Adding...' : 'Add'}
            </Button>
          </form>
        )}
      </Section>

      {/* Account */}
      <Section title="Account">
        {currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Avatar email={currentUser.email} name={currentUser.displayName} size={48} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{currentUser.displayName || currentUser.email?.split('@')[0]}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{currentUser.email}</div>
              {currentUser.email === SYNC_USER && (
                <Badge type="owner" label="Sync User" style={{ marginTop: 4 }} />
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Remove confirm modal */}
      <Modal open={!!removeConfirm} onClose={() => setRemoveConfirm(null)} title="Remove Member">
        <div style={{ marginBottom: 20, fontSize: 15 }}>
          Remove <strong>{removeConfirm}</strong> from this project?
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setRemoveConfirm(null)}>Cancel</Button>
          <Button variant="destructive" onClick={() => handleRemoveMember(removeConfirm)}>Remove</Button>
        </div>
      </Modal>
    </PageWrapper>
  )
}
