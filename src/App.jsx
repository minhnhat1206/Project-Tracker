import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Matrix from './pages/Matrix'
import CalendarView from './pages/CalendarView'
import Settings from './pages/Settings'
import Login from './pages/Login'
import useAppStore from './store/useAppStore'

function ProtectedLayout() {
  const location = useLocation()
  const { currentUser, loadProjects } = useAppStore()

  useEffect(() => {
    if (currentUser) loadProjects()
  }, [currentUser?.email])

  if (!currentUser) return <Navigate to="/login" replace />

  return (
    <div style={{
      background: `
        radial-gradient(ellipse 80% 60% at 20% 10%, rgba(99,179,237,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 80% 80%, rgba(167,139,250,0.15) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 60% 30%, rgba(52,199,89,0.08) 0%, transparent 50%),
        #F2F2F7
      `,
      minHeight: '100vh',
      display: 'flex',
    }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginLeft: 240, minHeight: '100vh' }}>
        <TopBar />
        <main style={{ flex: 1, padding: '24px', marginTop: 64 }}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/matrix" element={<Matrix />} />
              <Route path="/calendar" element={<CalendarView />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  )
}
