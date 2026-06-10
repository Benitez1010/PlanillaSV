import { useEffect, useState } from 'react'
import { dashboardApi } from '../services/api'
import { Users, FileSpreadsheet, TrendingUp } from 'lucide-react'

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
  total_payrolls: number
  latest_payrolls: Payroll[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.stats()
      .then(res => setStats(res.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-primary mb-8">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm font-medium">Empleados Activos</p>
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users size={24} className="text-primary" />
            </div>
          </div>
          <p className="text-4xl font-bold text-primary">{stats?.active_employees}</p>
          <p className="text-sm text-gray-400 mt-2">Total registrados: {stats?.total_employees}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm font-medium">Planillas Generadas</p>
            <div className="p-3 bg-secondary/20 rounded-lg">
              <FileSpreadsheet size={24} className="text-secondary" />
            </div>
          </div>
          <p className="text-4xl font-bold text-secondary">{stats?.total_payrolls}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm font-medium">Última Planilla</p>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp size={24} className="text-blue-500" />
            </div>
          </div>
          <p className="text-4xl font-bold text-blue-600">
            {stats?.latest_payrolls && stats.latest_payrolls.length > 0
              ? formatCurrency(stats.latest_payrolls[0].total_neto)
              : '$0'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            {stats?.latest_payrolls && stats.latest_payrolls.length > 0
              ? stats.latest_payrolls[0].periodo
              : 'Sin planillas'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-primary">Últimas Planillas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Período</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Estado</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Total Bruto</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">ISSS</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">AFP</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">ISR</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Total Neto</th>
              </tr>
            </thead>
            <tbody>
              {stats?.latest_payrolls?.map(p => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-all duration-200">
                  <td className="p-4 font-medium text-primary">{p.periodo}</td>
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
                    No hay planillas generadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
