import { createBrowserRouter, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import LoginPage from '@/features/auth/LoginPage'
import ShiftOpenPage from '@/features/shift/ShiftOpenPage'
import BillingPage from '@/features/billing/BillingPage'
import ShiftClosePage from '@/features/shift/ShiftClosePage'
import ReportsPage from '@/features/reports/ReportsPage'
import TerminalLockScreen from '@/features/auth/TerminalLockScreen'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLocked } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (isLocked) return <TerminalLockScreen />
  return <>{children}</>
}

function RequireShift({ children }: { children: React.ReactNode }) {
  const shiftId = useAuthStore((s) => s.shiftId)
  if (!shiftId) return <Navigate to="/shift/open" replace />
  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth><Navigate to="/billing" replace /></RequireAuth>,
  },
  {
    path: '/shift/open',
    element: <RequireAuth><ShiftOpenPage /></RequireAuth>,
  },
  {
    path: '/billing',
    element: <RequireAuth><RequireShift><BillingPage /></RequireShift></RequireAuth>,
  },
  {
    path: '/shift/close',
    element: <RequireAuth><RequireShift><ShiftClosePage /></RequireShift></RequireAuth>,
  },
  {
    path: '/reports',
    element: <RequireAuth><RequireShift><ReportsPage /></RequireShift></RequireAuth>,
  },
])