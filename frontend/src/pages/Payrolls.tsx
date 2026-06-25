import { useState, useEffect } from 'react'
import { payrollApi, employeeApi } from '../services/api'
import { FileSpreadsheet, Eye, Calculator, X, ChevronDown, RefreshCw, Trash2, Lock, Search, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'
import Modal from '../components/Modal'

interface PayrollDetail {
  id: number
  employee_id: number
  salario_base: number
  isss: number
  afp: number
  isr: number
  renta_gravable: number
  total_descuentos: number
  isss_patronal: number
  afp_patronal: number
  neto: number
  bono_quincena25: number
  aguinaldo: number
  dias_vacaciones: number
  prima_vacacional: number
  pago_vacaciones: number
  bono_total: number
  horas_normales_diurnas: number
  horas_normales_nocturnas: number
  horas_extra_diurnas: number
  horas_extra_nocturnas: number
  pago_horas_normales: number
  pago_horas_extras: number
  pago_horas_extras_diurnas: number
  pago_horas_extras_nocturnas: number
  employee: {
    id: number
    nombres: string
    apellidos: string
    salario_nominal: number
  }
}

interface Payroll {
  id: number
  periodo: string
  estado: string
  fecha_generacion: string
  total_bruto: number
  total_isss: number
  total_afp: number
  total_isr: number
  total_descuentos: number
  total_neto: number
  details: PayrollDetail[]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export default function Payrolls() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [selected, setSelected] = useState<Payroll | null>(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7))
  const [generating, setGenerating] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ type: string; id?: number } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [employees, setEmployees] = useState<any[]>([])
  const [vacacionesIds, setVacacionesIds] = useState<number[]>([])
  const [pagarAguinaldo, setPagarAguinaldo] = useState(false)
  const [pagarQuincena25, setPagarQuincena25] = useState(false)

  const loadPayrolls = () => {
    payrollApi.getAll({ search: search || undefined }).then(res => setPayrolls(res.data))
  }

  useEffect(() => { loadPayrolls() }, [])
  useEffect(() => { const t = setTimeout(loadPayrolls, 300); return () => clearTimeout(t) }, [search])

  const openGenerate = async () => {
    const res = await employeeApi.getAll()
    setEmployees(res.data.filter((e: any) => e.estado === 'activo'))
    const eligibleIds = res.data
      .filter((e: any) => {
        const partes = e.fecha_ingreso.split('-')
        const mesIngreso = parseInt(partes[1])
        const anioIngreso = parseInt(partes[0])
        const mes = parseInt(periodo.split('-')[1])
        return mesIngreso === mes && anioIngreso < parseInt(periodo.split('-')[0])
      })
      .map((e: any) => e.id)
    setVacacionesIds(eligibleIds)
    const mes = parseInt(periodo.split('-')[1])
    setPagarAguinaldo(mes >= 10 && mes <= 12)
    setPagarQuincena25(mes === 1)
    setShowGenerate(true)
  }

  const handleGenerate = async () => {
    setGenerating(true)
    try {
      const res = await payrollApi.generate({
        periodo,
        vacaciones_ids: vacacionesIds,
        pagar_aguinaldo: pagarAguinaldo,
        pagar_quincena25: pagarQuincena25,
      })
      setPayrolls(prev => [res.data, ...prev])
      setSelected(res.data)
      setShowGenerate(false)
      toast.success('Planilla generada correctamente')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al generar planilla')
    } finally {
      setGenerating(false)
    }
  }

  const handleClose = async (id: number) => {
    setActionLoading(true)
    try {
      await payrollApi.close(id)
      toast.success('Planilla cerrada')
      setConfirmAction(null)
      if (selected?.id === id) {
        const res = await payrollApi.getById(id)
        setSelected(res.data)
      }
      loadPayrolls()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDiscard = async (id: number) => {
    setActionLoading(true)
    try {
      await payrollApi.discard(id)
      toast.success('Planilla descartada')
      setConfirmAction(null)
      setSelected(null)
      loadPayrolls()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRefresh = async (id: number) => {
    setActionLoading(true)
    try {
      const res = await payrollApi.refresh(id, {
        vacaciones_ids: vacacionesIds,
        pagar_aguinaldo: pagarAguinaldo,
        pagar_quincena25: pagarQuincena25,
      })
      setSelected(res.data)
      toast.success('Planilla recalculada')
      setConfirmAction(null)
      loadPayrolls()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error')
    } finally {
      setActionLoading(false)
    }
  }

  const downloadReceipt = async (employeeId: number) => {
    try {
      const res = await payrollApi.receipt(selected!.id, employeeId)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `boleta_${employeeId}_${selected!.periodo}.pdf`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al generar boleta')
    }
  }

  const toggleVacacion = (empId: number) => {
    setVacacionesIds(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-primary">
          {selected ? `Planilla ${selected.periodo}` : 'Planillas'}
        </h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {!selected && (
            <>
              <div className="relative flex-1 sm:flex-none">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar período..."
                  className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full sm:w-48 hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
                />
              </div>
              <button
                onClick={openGenerate}
                className="flex items-center justify-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg hover:bg-accent transition-all duration-200 shadow-md"
              >
                <Calculator size={20} /> Generar
              </button>
            </>
          )}
        </div>
      </div>

      {confirmAction && (
        <ConfirmModal
          message={
            confirmAction.type === 'close'
              ? '¿Estás seguro de cerrar esta planilla? No podrá ser modificada después.'
              : confirmAction.type === 'discard'
                ? '¿Descartar planilla? Esta acción no se puede deshacer.'
                : '¿Recalcular esta planilla? Se eliminarán los detalles actuales.'
          }
          onConfirm={() => {
            if (confirmAction.type === 'close') handleClose(confirmAction.id!)
            else if (confirmAction.type === 'discard') handleDiscard(confirmAction.id!)
            else if (confirmAction.type === 'refresh') handleRefresh(confirmAction.id!)
          }}
          onCancel={() => setConfirmAction(null)}
          loading={actionLoading}
        />
      )}

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Período (YYYY-MM)</label>
              <input type="month" value={periodo} onChange={e => {
                setPeriodo(e.target.value)
                const mes = parseInt(e.target.value.split('-')[1])
                const anio = parseInt(e.target.value.split('-')[0])
                const ids = employees.filter((emp: any) => {
                  const p = emp.fecha_ingreso.split('-')
                  return parseInt(p[1]) === mes && parseInt(p[0]) < anio
                }).map((e: any) => e.id)
                setVacacionesIds(ids)
              }}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
            </div>

            {employees.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vacaciones por Aniversario</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-100 rounded-lg p-3">
                  {(() => {
                    const mes = parseInt(periodo.split('-')[1])
                    const anio = parseInt(periodo.split('-')[0])
                    const elegibles = employees.filter((emp: any) => {
                      const p = emp.fecha_ingreso.split('-')
                      return parseInt(p[1]) === mes && parseInt(p[0]) < anio
                    })
                    return elegibles.length > 0 ? elegibles.map((emp: any) => (
                      <label key={emp.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={vacacionesIds.includes(emp.id)}
                          onChange={() => toggleVacacion(emp.id)}
                          className="rounded text-secondary focus:ring-secondary"
                        />
                        <span className="text-sm">{emp.nombres} {emp.apellidos}</span>
                      </label>
                    )) : <p className="text-xs text-gray-400">Ningún empleado cumple años este mes</p>
                  })()}
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-2">
              {(() => {
                const mes = parseInt(periodo.split('-')[1])
                return (
                  <>
                    {mes === 1 && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pagarQuincena25}
                          onChange={e => setPagarQuincena25(e.target.checked)}
                          className="rounded text-secondary focus:ring-secondary"
                        />
                        <span className="text-sm">Pagar Bonificación Quincena25</span>
                      </label>
                    )}
                    {mes >= 10 && mes <= 12 && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pagarAguinaldo}
                          onChange={e => setPagarAguinaldo(e.target.checked)}
                          className="rounded text-secondary focus:ring-secondary"
                        />
                        <span className="text-sm">Pagar Aguinaldo</span>
                      </label>
                    )}
                  </>
                )
              })()}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleGenerate} disabled={generating}
                className="flex-1 bg-secondary text-white py-2.5 rounded-lg hover:bg-accent disabled:opacity-50 transition-all duration-200 font-medium shadow-md">
                {generating ? 'Generando...' : 'Generar'}
              </button>
              <button onClick={() => setShowGenerate(false)}
                className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {selected ? (
        <div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-xl font-bold text-primary">Planilla {selected.periodo}</h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  selected.estado === 'Cerrada'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {selected.estado}
                </span>
              </div>
              <p className="text-sm text-gray-400 mt-1">
                {new Date(selected.fecha_generacion).toLocaleDateString()}
                {selected.estado === 'Borrador' && ' · Los cambios están en borrador'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selected.estado === 'Borrador' && (
                <>
                  <button
                    onClick={() => setConfirmAction({ type: 'refresh', id: selected.id })}
                    className="flex items-center gap-2 text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/5 transition-all duration-200">
                    <RefreshCw size={18} /> Refrescar
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'close', id: selected.id })}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-200">
                    <Lock size={18} /> Cerrar
                  </button>
                  <button
                    onClick={() => setConfirmAction({ type: 'discard', id: selected.id })}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200">
                    <Trash2 size={18} /> Descartar
                  </button>
                </>
              )}
              <button onClick={() => { setSelected(null); loadPayrolls() }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                <ChevronDown size={18} /> Volver
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs text-gray-500 mb-1">Total Bruto</p>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(selected.total_bruto)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-xs text-gray-500 mb-1">ISSS</p>
              <p className="text-xl font-bold text-red-500">{formatCurrency(selected.total_isss)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <p className="text-xs text-gray-500 mb-1">AFP</p>
              <p className="text-xl font-bold text-orange-500">{formatCurrency(selected.total_afp)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
              <p className="text-xs text-gray-500 mb-1">ISR</p>
              <p className="text-xl font-bold text-purple-500">{formatCurrency(selected.total_isr)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs text-gray-500 mb-1">Total Neto</p>
              <p className="text-xl font-bold text-secondary">{formatCurrency(selected.total_neto)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left p-3 font-medium text-gray-500">Empleado</th>
                    <th className="text-right p-3 font-medium text-gray-500">Base</th>
                    <th className="text-right p-3 font-medium text-gray-500">Bono25</th>
                    <th className="text-right p-3 font-medium text-gray-500">Aguinaldo</th>
                    <th className="text-right p-3 font-medium text-gray-500">Vacaciones</th>
                    <th className="text-right p-3 font-medium text-gray-500">Horas Nocturnas</th>
                    <th className="text-right p-3 font-medium text-gray-500">H.E. Diurnas</th>
                    <th className="text-right p-3 font-medium text-gray-500">H.E. Nocturnas</th>
                    <th className="text-right p-3 font-medium text-gray-500">H.E. Netas</th>
                    <th className="text-right p-3 font-medium text-gray-500">ISSS</th>
                    <th className="text-right p-3 font-medium text-gray-500">AFP</th>
                    <th className="text-right p-3 font-medium text-gray-500">ISR</th>
                    <th className="text-right p-3 font-medium text-gray-500">Desc.</th>
                    <th className="text-right p-3 font-medium text-gray-500">ISSS Pat.</th>
                    <th className="text-right p-3 font-medium text-gray-500">AFP Pat.</th>
                    <th className="text-right p-3 font-medium text-gray-500 font-bold">Neto</th>
                    <th className="text-center p-3 font-medium text-gray-500">Boleta</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.details?.map(d => (
                    <tr key={d.id} className="border-t border-gray-50 hover:bg-primary/5 hover:shadow-sm transition-all duration-200">
                      <td className="p-3 font-medium">{d.employee?.nombres} {d.employee?.apellidos}</td>
                      <td className="p-3 text-right">{formatCurrency(d.salario_base)}</td>
                      <td className="p-3 text-right text-emerald-600">{d.bono_quincena25 > 0 ? formatCurrency(d.bono_quincena25) : '—'}</td>
                      <td className="p-3 text-right text-blue-600">{d.aguinaldo > 0 ? formatCurrency(d.aguinaldo) : '—'}</td>
                      <td className="p-3 text-right text-purple-600">{d.pago_vacaciones > 0 ? formatCurrency(d.pago_vacaciones) : '—'}</td>
                      <td className="p-3 text-right text-gray-500">{d.pago_horas_normales > 0 ? formatCurrency(d.pago_horas_normales) : '—'}</td>
                      <td className="p-3 text-right text-amber-500">{d.pago_horas_extras_diurnas > 0 ? formatCurrency(d.pago_horas_extras_diurnas) : '—'}</td>
                      <td className="p-3 text-right text-amber-700">{d.pago_horas_extras_nocturnas > 0 ? formatCurrency(d.pago_horas_extras_nocturnas) : '—'}</td>
                      <td className="p-3 text-right text-yellow-600">{d.pago_horas_extras > 0 ? formatCurrency(d.pago_horas_extras) : '—'}</td>
                      <td className="p-3 text-right text-red-500">{formatCurrency(d.isss)}</td>
                      <td className="p-3 text-right text-orange-500">{formatCurrency(d.afp)}</td>
                      <td className="p-3 text-right text-purple-500">{formatCurrency(d.isr)}</td>
                      <td className="p-3 text-right text-red-400">{formatCurrency(d.total_descuentos)}</td>
                      <td className="p-3 text-right text-pink-500">{formatCurrency(d.isss_patronal)}</td>
                      <td className="p-3 text-right text-pink-700">{formatCurrency(d.afp_patronal)}</td>
                      <td className="p-3 text-right font-bold text-secondary">{formatCurrency(d.neto)}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => downloadReceipt(d.employee_id)}
                          className="p-1.5 text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Imprimir Boleta">
                          <Printer size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr className="border-t-2 border-gray-200">
                    <td className="p-3 text-primary">TOTALES</td>
                    <td className="p-3 text-right">{formatCurrency(selected.total_bruto)}</td>
                    <td className="p-3 text-right"></td>
                    <td className="p-3 text-right"></td>
                    <td className="p-3 text-right"></td>
                    <td className="p-3 text-right text-gray-500">{formatCurrency(selected.details.reduce((s, d) => s + d.pago_horas_normales, 0))}</td>
                    <td className="p-3 text-right text-amber-500">{formatCurrency(selected.details.reduce((s, d) => s + d.pago_horas_extras_diurnas, 0))}</td>
                    <td className="p-3 text-right text-amber-700">{formatCurrency(selected.details.reduce((s, d) => s + d.pago_horas_extras_nocturnas, 0))}</td>
                    <td className="p-3 text-right text-yellow-600">{formatCurrency(selected.details.reduce((s, d) => s + d.pago_horas_extras, 0))}</td>
                    <td className="p-3 text-right text-red-500">{formatCurrency(selected.total_isss)}</td>
                    <td className="p-3 text-right text-orange-500">{formatCurrency(selected.total_afp)}</td>
                    <td className="p-3 text-right text-purple-500">{formatCurrency(selected.total_isr)}</td>
                    <td className="p-3 text-right text-red-400">{formatCurrency(selected.total_descuentos)}</td>
                    <td className="p-3 text-right text-pink-500">{formatCurrency(selected.details.reduce((s, d) => s + d.isss_patronal, 0))}</td>
                    <td className="p-3 text-right text-pink-700">{formatCurrency(selected.details.reduce((s, d) => s + d.afp_patronal, 0))}</td>
                    <td className="p-3 text-right text-secondary">{formatCurrency(selected.total_neto)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {payrolls.map(p => (
            <div key={p.id}
              className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 flex justify-between items-center hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/5 rounded-lg">
                  <FileSpreadsheet size={28} className="text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-primary text-lg">Planilla {p.periodo}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      p.estado === 'Cerrada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {p.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {p.details?.length || 0} empleados · Bruto: {formatCurrency(p.total_bruto)} · Neto: {formatCurrency(p.total_neto)}
                  </p>
                </div>
              </div>
              <button onClick={async () => {
                const res = await payrollApi.getById(p.id)
                setSelected(res.data)
              }}
                className="flex items-center gap-2 text-primary hover:bg-primary/5 px-4 py-2 rounded-lg transition-colors">
                <Eye size={18} /> Ver Detalle
              </button>
            </div>
          ))}
          {payrolls.length === 0 && (
            <div className="text-center py-16">
              <FileSpreadsheet size={64} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 text-lg">No hay planillas generadas</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
