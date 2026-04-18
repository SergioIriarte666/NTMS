import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Clients from '@/pages/Clients'
import Services from '@/pages/Services'
import Fleet from '@/pages/Fleet'
import Drivers from '@/pages/Drivers'
import Billing from '@/pages/Billing'
import Settings from '@/pages/Settings'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<RequireAuth />}>
          <Route path="/app" element={<AppShell />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="clientes" element={<Clients />} />
            <Route path="servicios" element={<Services />} />
            <Route path="flota" element={<Fleet />} />
            <Route path="operadores" element={<Drivers />} />
            <Route path="facturacion" element={<Billing />} />
            <Route path="configuracion" element={<Settings />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </Router>
  )
}
