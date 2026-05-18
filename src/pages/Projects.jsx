import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Archive } from 'lucide-react'
import { motion } from 'framer-motion'
import PageWrapper from '../components/layout/PageWrapper'
import GlassCard from '../components/ui/GlassCard'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import useAppStore from '../store/useAppStore'

function ProjectCard({ project, tasks = [], index }) {
  const navigate = useNavigate()
  const total = tasks.length
  const done = tasks.filter(t => t.status === 'done').length
  const percent = total > 0 ? Math.round(done / total * 100) : 0
  const memberEmails = project.member_emails ? project.member_emails.split(',').filter(Boolean) : []

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.2 }}
      className="glass-card"
      style={{ padding: 20, cursor: 'pointer', transition: 'all 150ms ease-out' }}
      onClick={() => navigate(`/projects/${project.id}`)}
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{project.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
            {project.description || 'No description'}
          </div>
        </div>
        <Badge type={project.status} />
      </div>

      {/* Members */}
      <div style={{ display: 'flex', alignItems: 'center', gap: -4, marginBottom: 14 }}>
        {memberEmails.slice(0, 4).map((email, i) => (
          <div key={email} style={{ marginLeft: i > 0 ? -8 : 0 }}>
            <Avatar email={email} size={24} />
          </div>
        ))}
        {memberEmails.length > 4 && (
          <div style={{
            marginLeft: -8, width: 24, height: 24, borderRadius: '50%',
            background: 'rgba(60,60,67,0.1)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text-secondary)',
          }}>
            +{memberEmails.length - 4}
          </div>
        )}
        <div style={{ marginLeft: 10, fontSize: 12, color: 'var(--text-secondary)' }}>
          {total} tasks
        </div>
      </div>

      {/* Progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Progress</span>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{percent}%</span>
        </div>
        <div style={{ height: 4, background: 'rgba(60,60,67,0.1)', borderRadius: 2 }}>
          <div style={{
            height: '100%', width: `${percent}%`,
            background: 'var(--accent-blue)', borderRadius: 2,
            transition: 'width 0.8s ease',
          }} />
        </div>
      </div>
    </motion.div>
  )
}

function NewProjectModal({ open, onClose }) {
  const { createProject, currentUser } = useAppStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')
    try {
      await createProject({
        name: name.trim(),
        description: description.trim(),
        owner_email: currentUser?.email,
        member_emails: currentUser?.email || '',
      })
      setName('')
      setDescription('')
      onClose()
    } catch (err) {
      setError('Lỗi: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1px solid var(--border-separator)',
    background: 'rgba(255,255,255,0.5)', fontSize: 15,
    color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit',
  }

  return (
    <Modal open={open} onClose={onClose} title="New Project">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Project Name *</label>
          <input
            style={inputStyle} value={name} onChange={e => setName(e.target.value)}
            placeholder="e.g. Website Redesign" autoFocus required
          />
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="What is this project about?"
          />
        </div>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,59,48,0.1)', color: '#FF3B30', fontSize: 13 }}>
            {error}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onClose} type="button">Cancel</Button>
          <Button variant="primary" type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Creating...' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Projects() {
  const { projects, tasks, loadProjects, loadTasks } = useAppStore()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('active')

  useEffect(() => {
    loadProjects().then(projs => {
      if (projs) projs.forEach(p => loadTasks(p.id))
    })
  }, [])

  const filtered = projects.filter(p => filter === 'all' || p.status === filter)

  return (
    <PageWrapper>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['active', 'archived', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
                background: filter === f ? 'var(--accent-blue)' : 'rgba(255,255,255,0.6)',
                color: filter === f ? '#fff' : 'var(--text-secondary)',
                transition: 'all 150ms',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Project
        </Button>
      </div>

      {filtered.length === 0 ? (
        <GlassCard style={{ padding: 20 }}>
          <EmptyState
            title="No projects yet"
            description="Create your first project to start tracking tasks."
            action="Create Project"
            onAction={() => setShowModal(true)}
            icon="📁"
          />
        </GlassCard>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {filtered.map((project, i) => (
            <ProjectCard key={project.id} project={project} tasks={tasks[project.id] || []} index={i} />
          ))}
        </div>
      )}

      <NewProjectModal open={showModal} onClose={() => setShowModal(false)} />
    </PageWrapper>
  )
}
