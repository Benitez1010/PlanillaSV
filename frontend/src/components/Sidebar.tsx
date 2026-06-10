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
        <h1 className="text-2xl font-bold tracking-tight">Planillas SV</h1>
        <p className="text-sm text-white/60 mt-1">Sistema RRHH</p>
      </div>
      <nav className="space-y-1 flex-1">
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
                  ? 'bg-white/15 text-white font-medium shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-white/10 pt-4 space-y-3">
        <p className="text-white/50 text-xs text-center">{user.name || 'Usuario'}</p>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 w-full"
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      )}
      {/* Mobile sidebar (overlay) */}
      <aside className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white p-4 transform transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
      {/* Desktop sidebar (static) */}
      <aside className="hidden md:flex w-64 bg-primary text-white p-4 flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>
    </>
  )
}
