import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { DashboardShell } from './components/dashboard/DashboardShell'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Room } from './pages/Room'
import { DashboardHome } from './pages/Dashboard'
import { History } from './pages/History'
import { MeetingDetail } from './pages/MeetingDetail'
import { Settings } from './pages/Settings'

function AnimatedRoutes() {
  const location = useLocation()
  const isApp =
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/history') ||
    location.pathname.startsWith('/settings')

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isApp ? 'app' : location.pathname}
        initial={{ opacity: 0, y: isApp ? 0 : 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: isApp ? 0 : -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="min-h-dvh"
      >
        <Routes location={location}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Home />} />
          <Route
            path="/room/:roomId"
            element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <DashboardShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:roomId" element={<MeetingDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}
