import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { employeeApi, absenceApi } from '../services/api'
import { Plus, X, Search, CheckCircle, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Employee {
  id: number
  nombres: string
  apellidos: string
  estado?: string
}

interface Absence {
  id: number
  employee_id: number
  tipo: string
  fecha_inicio: string
  fecha_fin: string
  estado: string
  employee: Employee
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

export default function Absences() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')
  const { register, handleSubmit, reset } = useForm()

  const loadAbsences = () => {
    absenceApi.getAll({ search: search || undefined }).then(res => setAbsences(res.data))
  }

  useEffect(() => {
    employeeApi.getAll().then(res => setEmployees(res.data))
    loadAbsences()
  }, [])

  useEffect(() => { const t = setTimeout(loadAbsences, 300); return () => clearTimeout(t) }, [search])

  const onSubmit = async (data: any) => {
    try {
      await absenceApi.create(data)
      toast.success('Ausencia registrada correctamente')
      reset()
      setShowModal(false)
      loadAbsences()
    } catch {
      toast.error('Error al registrar ausencia')
    }
  }

  const handleApprove = async (id: number) => {
    try {
      await absenceApi.approve(id)
      toast.success('Ausencia aprobada')
      loadAbsences()
    } catch {
      toast.error('Error al aprobar ausencia')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Descartar esta ausencia?')) return
    try {
      await absenceApi.delete(id)
      toast.success('Ausencia descartada')
      loadAbsences()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al descartar')
    }
  }

  const totalDias = (a: Absence) => {
    const inicio = new Date(a.fecha_inicio)
    const fin = new Date(a.fecha_fin)
    return Math.floor((fin.getTime() - inicio.getTime()) / 86400000) + 1
  }

  const tipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      'Injustificada': 'bg-red-100 text-red-700',
      'Permiso sin goce de sueldo': 'bg-yellow-100 text-yellow-700',
      'Incapacidad ISSS': 'bg-blue-100 text-blue-700',
    }
    return colors[tipo] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-primary">Ausencias</h2>
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
            <Plus size={20} /> Nueva Ausencia
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-primary">Registrar Ausencia</h3>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ausencia</label>
                <select {...register('tipo', { required: true })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none">
                  <option value="">Seleccionar...</option>
                  <option value="Injustificada">Injustificada</option>
                  <option value="Permiso sin goce de sueldo">Permiso sin goce de sueldo</option>
                  <option value="Incapacidad ISSS">Incapacidad ISSS</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
                  <input type="date" {...register('fecha_inicio', { required: true })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
                  <input type="date" {...register('fecha_fin', { required: true })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                </div>
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
                <th className="text-left p-4 text-sm font-medium text-gray-500">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Desde</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Hasta</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Días</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Estado</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Acción</th>
              </tr>
            </thead>
            <tbody>
              {absences.map(a => (
                <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-all duration-200">
                  <td className="p-4 font-medium">{a.employee?.nombres} {a.employee?.apellidos}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tipoBadge(a.tipo)}`}>
                      {a.tipo}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(a.fecha_inicio)}</td>
                  <td className="p-4 text-gray-500">{formatDate(a.fecha_fin)}</td>
                  <td className="p-4 text-center font-bold text-primary">{totalDias(a)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      a.estado === 'Aprobada'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {a.estado}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {a.estado === 'Borrador' && (
                        <>
                          <button onClick={() => handleApprove(a.id)}
                            className="flex items-center gap-1 text-secondary hover:bg-secondary/5 px-3 py-1.5 rounded-lg transition-all duration-200">
                            <CheckCircle size={16} /> Aprobar
                          </button>
                          <button onClick={() => handleDelete(a.id)}
                            className="flex items-center gap-1 text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200">
                            <Trash2 size={16} /> Descartar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {absences.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    No hay registros de ausencias
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
