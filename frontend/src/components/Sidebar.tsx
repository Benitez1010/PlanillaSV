import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Users, FileSpreadsheet, LayoutDashboard, Clock, CalendarX, LogOut, X } from 'lucide-react'
import { authApi } from '../services/api'

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employees', label: 'Empleados', icon: Users },
  { path: '/work-logs', label: 'Horas Laboradas', icon: Clock },
  { path: '/absences', label: 'Ausencias', icon: CalendarX },
  { path: '/payrolls', label: 'Planillas', icon: FileSpreadsheet },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {}
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="mb-8 text-center relative">
        <button onClick={onClose} className="md:hidden absolute -left-2 top-0 p-1 text-white/70 hover:text-white">
          <X size={20} />
        </button>
        <div className="bg-white/20 rounded-full p-2 inline-block mx-auto mb-3 shadow-lg shadow-white/10">
          <img src="/logo.png" alt="Logo" className="h-12 w-12 rounded-full object-cover" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Planillas SV</h1>
        <p className="text-sm text-white/60 mt-1">Sistema RRHH</p>
      </div>
      <nav className="space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-white/20 text-white font-medium shadow-lg shadow-white/5 border-l-4 border-secondary'
                  : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1 hover:shadow-lg hover:shadow-white/5'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/15 pt-4 mt-2 space-y-3">
        <p className="text-white/50 text-xs text-center">{user.name || 'Usuario'}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-300 hover:translate-x-1 transition-all duration-200 w-full"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      )}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-primary to-blue-900 text-white p-5 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-primary to-blue-900 text-white p-5 flex-col h-screen sticky top-0 border-r border-white/10 shadow-2xl">
        {sidebarContent}
      </aside>
    </>
  )
}
