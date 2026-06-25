import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, employeeApi, payrollApi } from '../services/api'
import { Users, FileSpreadsheet, Clock, CalendarX, Plus, Eye, X, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/Modal'

interface Payroll {
  id: number
  periodo: string
  estado: string
  total_bruto: number
  total_neto: number
  total_isss: number
  total_afp: number
  total_isr: number
}

interface Stats {
  active_employees: number
  total_employees: number
  inactive_employees: number
  total_payrolls: number
  payrolls_this_year: number
  pending_work_logs: number
  pending_absences: number
  latest_payrolls: Payroll[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const mesActual = meses[new Date().getMonth()]
const anioActual = new Date().getFullYear()

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showGenerate, setShowGenerate] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7))
  const [employees, setEmployees] = useState<any[]>([])
  const [vacacionesIds, setVacacionesIds] = useState<number[]>([])
  const navigate = useNavigate()

  const loadStats = () => {
    dashboardApi.stats().then(res => setStats(res.data))
  }

  useEffect(() => {
    setLoading(true)
    dashboardApi.stats().then(res => setStats(res.data)).finally(() => setLoading(false))
  }, [])

  const openGenerate = async () => {
    const res = await employeeApi.getAll()
    setEmployees(res.data.filter((e: any) => e.estado === 'activo'))
    const eligibleIds = res.data
      .filter((e: any) => {
        const p = e.fecha_ingreso.split('-')
        const mes = parseInt(periodo.split('-')[1])
        return parseInt(p[1]) === mes && parseInt(p[0]) < parseInt(periodo.split('-')[0])
      })
      .map((e: any) => e.id)
    setVacacionesIds(eligibleIds)
    setShowGenerate(true)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      await payrollApi.generate({ periodo, vacaciones_ids: vacacionesIds })
      toast.success('Planilla generada correctamente')
      setShowGenerate(false)
      loadStats()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al generar planilla')
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  const cards = [
    {
      label: 'Empleados Activos',
      value: stats?.active_employees ?? 0,
      sub: `${stats?.total_employees ?? 0} registrados`,
      icon: Users,
      gradient: 'from-blue-600 to-blue-400',
      bg: 'bg-blue-50',
    },
    {
      label: 'Planillas del Año',
      value: stats?.payrolls_this_year ?? 0,
      sub: `${stats?.total_payrolls ?? 0} totales generadas`,
      icon: FileSpreadsheet,
      gradient: 'from-secondary to-green-400',
      bg: 'bg-green-50',
    },
    {
      label: 'Horas Pendientes',
      value: stats?.pending_work_logs ?? 0,
      sub: 'registros por aprobar',
      icon: Clock,
      gradient: 'from-amber-500 to-yellow-400',
      bg: 'bg-amber-50',
    },
    {
      label: 'Ausencias Pendientes',
      value: stats?.pending_absences ?? 0,
      sub: 'registros por aprobar',
      icon: CalendarX,
      gradient: 'from-rose-500 to-pink-400',
      bg: 'bg-rose-50',
    },
  ]

  const quickActions = [
    { label: 'Registrar Horas', icon: Clock, color: 'bg-secondary', onClick: () => navigate('/work-logs', { state: { openCreate: true } }) },
    { label: 'Nueva Ausencia', icon: CalendarX, color: 'bg-blue-500', onClick: () => navigate('/absences', { state: { openCreate: true } }) },
    { label: 'Generar Planilla', icon: Plus, color: 'bg-primary', onClick: openGenerate },
    { label: 'Ver Planillas', icon: Eye, color: 'bg-purple-500', onClick: () => navigate('/payrolls') },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary">Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">{mesActual} {anioActual}</p>
        </div>
        <button onClick={openGenerate}
          className="flex items-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg hover:bg-accent hover:shadow-lg transition-all duration-200 shadow-md">
          <Plus size={20} /> Generar Planilla
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((card, i) => {
          const Icon = card.icon
          return (
            <div key={i}
              className="bg-white rounded-xl shadow-lg p-5 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{card.label}</p>
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
              </div>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1.5">{card.sub}</p>
            </div>
          )
        })}
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action, i) => {
            const Icon = action.icon
            return (
              <button key={i} onClick={action.onClick}
                className={`flex items-center justify-between p-4 rounded-xl text-white shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 ${action.color}`}>
                <div className="flex items-center gap-3">
                  <Icon size={22} />
                  <span className="text-sm font-medium">{action.label}</span>
                </div>
                <ChevronRight size={18} className="opacity-60" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-primary">Últimas Planillas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Período</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Estado</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Total Bruto</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400 uppercase tracking-wider">ISSS</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400 uppercase tracking-wider">AFP</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400 uppercase tracking-wider">ISR</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Total Neto</th>
              </tr>
            </thead>
            <tbody>
              {stats?.latest_payrolls?.map(p => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-primary/5 hover:shadow-sm transition-all duration-200">
                  <td className="p-4 font-bold text-primary">{p.periodo}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      p.estado === 'Cerrada'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="p-4 text-right">{formatCurrency(p.total_bruto)}</td>
                  <td className="p-4 text-right text-red-500">{formatCurrency(p.total_isss)}</td>
                  <td className="p-4 text-right text-orange-500">{formatCurrency(p.total_afp)}</td>
                  <td className="p-4 text-right text-red-500">{formatCurrency(p.total_isr)}</td>
                  <td className="p-4 text-right font-bold text-secondary">{formatCurrency(p.total_neto)}</td>
                </tr>
              ))}
              {(!stats?.latest_payrolls || stats.latest_payrolls.length === 0) && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No hay planillas generadas. Usa "Generar Planilla" para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showGenerate} onClose={() => setShowGenerate(false)}>
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">Generar Planilla</h3>
            <button onClick={() => setShowGenerate(false)} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <input type="month" value={periodo} onChange={e => {
                setPeriodo(e.target.value)
                const mes = parseInt(e.target.value.split('-')[1])
                const anio = parseInt(e.target.value.split('-')[0])
                const ids = employees.filter((emp: any) => {
                  const p = emp.fecha_ingreso.split('-')
                  return parseInt(p[1]) === mes && parseInt(p[0]) < anio
                }).map((emp: any) => emp.id)
                setVacacionesIds(ids)
              }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none hover:border-primary/30 transition-all duration-200" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vacaciones ({vacacionesIds.length} empleados cumplen años)
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 border border-gray-200 rounded-lg p-2">
                {employees.map((emp: any) => {
                  const p = emp.fecha_ingreso.split('-')
                  const mes = parseInt(periodo.split('-')[1])
                  const anio = parseInt(periodo.split('-')[0])
                  const esElegible = parseInt(p[1]) === mes && parseInt(p[0]) < anio
                  return (
                    <label key={emp.id} className={`flex items-center gap-2 p-1.5 rounded ${esElegible ? 'cursor-pointer hover:bg-gray-50' : 'opacity-50'}`}>
                      <input
                        type="checkbox"
                        checked={vacacionesIds.includes(emp.id)}
                        onChange={() => {
                          setVacacionesIds(prev =>
                            prev.includes(emp.id)
                              ? prev.filter(id => id !== emp.id)
                              : [...prev, emp.id]
                          )
                        }}
                        disabled={!esElegible}
                        className="rounded border-gray-300 text-secondary focus:ring-secondary"
                      />
                      <span className="text-sm">{emp.nombres} {emp.apellidos}</span>
                      {esElegible && <span className="text-xs text-secondary ml-auto">Elegible</span>}
                    </label>
                  )
                })}
              </div>
            </div>
            <button onClick={handleGenerate} disabled={generating}
              className="w-full bg-secondary text-white py-2.5 rounded-lg hover:bg-accent hover:shadow-lg transition-all duration-200 font-medium shadow-md disabled:opacity-50">
              {generating ? 'Generando...' : 'Generar Planilla'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
