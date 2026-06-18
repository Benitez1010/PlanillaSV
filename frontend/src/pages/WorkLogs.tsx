import { useState, useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { employeeApi, workLogApi } from '../services/api'
import { Plus, X, Search, CheckCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Employee {
  id: number
  nombres: string
  apellidos: string
  estado?: string
}

interface WorkLog {
  id: number
  employee_id: number
  periodo: string
  hora_normal_diurna: number
  hora_normal_nocturna: number
  extra_diurna: number
  extra_nocturna: number
  estado: string
  fecha_aprobacion: string | null
  employee: Employee
}

export default function WorkLogs() {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const { register, handleSubmit, reset, setValue, control } = useForm<any>({
    defaultValues: { hora_normal_diurna: 0, hora_normal_nocturna: 0, extra_diurna: 0, extra_nocturna: 0 }
  })
  const selectedEmployeeId = useWatch<any>({ control, name: 'employee_id' })
  const nocturnaValue = useWatch<any>({ control, name: 'hora_normal_nocturna' })

  useEffect(() => {
    const hasValue = selectedEmployeeId && selectedEmployeeId !== ''
    if (hasValue) {
      const diurnaValue = Math.max(0, 240 - (nocturnaValue || 0))
      setValue('hora_normal_diurna', diurnaValue)
    } else {
      setValue('hora_normal_diurna', 0)
      setValue('hora_normal_nocturna', 0)
      setValue('extra_diurna', 0)
      setValue('extra_nocturna', 0)
    }
  }, [selectedEmployeeId, nocturnaValue, setValue])

  const loadWorkLogs = () => {
    workLogApi.getAll({ search: search || undefined }).then(res => setWorkLogs(res.data))
  }

  useEffect(() => {
    employeeApi.getAll().then(res => setEmployees(res.data))
    loadWorkLogs()
  }, [])

  useEffect(() => { const t = setTimeout(loadWorkLogs, 300); return () => clearTimeout(t) }, [search])

  const onSubmit = async (data: any) => {
    try {
      await workLogApi.create(data)
      toast.success('Horas registradas correctamente')
      reset()
      setShowModal(false)
      loadWorkLogs()
    } catch {
      toast.error('Error al registrar horas')
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await workLogApi.approve(id)
      toast.success('Horas aprobadas')
      loadWorkLogs()
    } catch {
      toast.error('Error al aprobar horas')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Descartar este registro de horas?')) return
    try {
      await workLogApi.delete(id)
      toast.success('Registro descartado')
      loadWorkLogs()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al descartar')
    }
  }

  const totalHoras = (w: WorkLog) =>
    Number(w.hora_normal_diurna) + Number(w.hora_normal_nocturna) +
    Number(w.extra_diurna) + Number(w.extra_nocturna)

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-primary">Horas Laboradas</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empleado..."
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg hover:bg-accent transition-all duration-200 shadow-md"
          >
            <Plus size={20} /> Registrar Horas
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-primary">Registrar Horas Laboradas</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
                <select {...register('employee_id', { required: true })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="">Seleccionar...</option>
                  {employees.filter(e => e.estado !== 'inactivo').map(e => (
                    <option key={e.id} value={e.id}>{e.nombres} {e.apellidos}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Período (YYYY-MM)</label>
                <input {...register('periodo', { required: true })} placeholder="2026-06"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora Normal Diurna</label>
                  <input type="number" step="0.5" {...register('hora_normal_diurna')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hora Normal Nocturna</label>
                  <input type="number" step="0.5" {...register('hora_normal_nocturna')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extra Diurna</label>
                  <input type="number" step="0.5" {...register('extra_diurna')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Extra Nocturna</label>
                  <input type="number" step="0.5" {...register('extra_nocturna')}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <div className="font-medium mb-1">📌 Recordatorio</div>
                <div>No olvide registrar las ausencias del período en el módulo correspondiente.</div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 bg-secondary text-white py-2.5 rounded-lg hover:bg-accent transition-all duration-200 font-medium shadow-md">
                  Guardar
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Empleado</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Período</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Normal Diurna</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Normal Nocturna</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Extra Diurna</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Extra Nocturna</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Total</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Estado</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Acción</th>
              </tr>
            </thead>
            <tbody>
              {workLogs.map(w => (
                <tr key={w.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-all duration-200">
                  <td className="p-4 font-medium">{w.employee?.nombres} {w.employee?.apellidos}</td>
                  <td className="p-4 text-gray-500">{w.periodo}</td>
                  <td className="p-4 text-right">{w.hora_normal_diurna}</td>
                  <td className="p-4 text-right text-blue-600">{w.hora_normal_nocturna}</td>
                  <td className="p-4 text-right text-yellow-600">{w.extra_diurna}</td>
                  <td className="p-4 text-right text-purple-600">{w.extra_nocturna}</td>
                  <td className="p-4 text-right font-bold text-primary">{totalHoras(w)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      w.estado === 'Aprobado'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {w.estado}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {w.estado === 'Borrador' && (
                        <>
                          <button onClick={() => handleApprove(w.id)}
                            className="flex items-center gap-1 text-secondary hover:bg-secondary/5 px-3 py-1.5 rounded-lg transition-all duration-200">
                            <CheckCircle size={16} /> Aprobar
                          </button>
                          <button onClick={() => handleDelete(w.id)}
                            className="flex items-center gap-1 text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200">
                            <Trash2 size={16} /> Descartar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {workLogs.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-400">
                    No hay registros de horas laboradas
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
