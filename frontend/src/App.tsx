import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Menu } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import WorkLogs from './pages/WorkLogs'
import Absences from './pages/Absences'
import Payrolls from './pages/Payrolls'
import Login from './pages/Login'
import Sidebar from './components/Sidebar'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center gap-3 p-4 border-b border-gray-100 bg-white sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Menu size={24} className="text-primary" />
          </button>
          <h1 className="text-lg font-bold text-primary">Planillas SV</h1>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/work-logs" element={<WorkLogs />} />
                <Route path="/absences" element={<Absences />} />
                <Route path="/payrolls" element={<Payrolls />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
