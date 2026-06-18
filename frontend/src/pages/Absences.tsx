import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { employeeApi, absenceApi } from '../services/api'
import { Plus, X, Search, CheckCircle, Trash2, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import { useLocation } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import Modal from '../components/Modal'

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
  dias: string[]
  estado: string
  employee: Employee
}

const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const isWeekend = (dateStr: string): boolean => {
  const day = parseDate(dateStr).getDay()
  return day === 0 || day === 6
}

const getDayName = (dateStr: string): string => {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  return days[parseDate(dateStr).getDay()]
}

const fmt = (dateStr: string) => {
  if (!dateStr) return ''
  const d = dateStr.split('-')
  return `${d[2]}/${d[1]}`
}

export default function Absences() {
  const [absences, setAbsences] = useState<Absence[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [loading, setLoading] = useState(true)
  const [cantidadDias, setCantidadDias] = useState(1)
  const [dateInputs, setDateInputs] = useState<string[]>([''])
  const [dateErrors, setDateErrors] = useState<Record<number, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const { register, handleSubmit, reset } = useForm()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.openCreate) {
      openCreate()
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const getParams = () => ({
    search: search || undefined,
    periodo: filterPeriodo || undefined,
  })

  const loadAbsences = () => {
    absenceApi.getAll(getParams()).then(res => setAbsences(res.data))
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      employeeApi.getAll(),
      absenceApi.getAll(getParams()),
    ]).then(([emp, abs]) => {
      setEmployees(emp.data)
      setAbsences(abs.data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const t = setTimeout(loadAbsences, 300)
    return () => clearTimeout(t)
  }, [search, filterPeriodo])

  const handleCantidadChange = (val: number) => {
    const n = Math.max(1, Math.min(31, val || 1))
    setCantidadDias(n)
    setDateInputs(prev => {
      const next = [...prev]
      while (next.length < n) next.push('')
      return next.slice(0, n)
    })
    setDateErrors({})
  }

  const handleDateInput = (idx: number, value: string) => {
    const updated = [...dateInputs]
    updated[idx] = value
    setDateInputs(updated)
    if (value && isWeekend(value)) {
      setDateErrors(prev => ({ ...prev, [idx]: `No se pueden seleccionar ${getDayName(value)}s` }))
    } else {
      setDateErrors(prev => {
        const next = { ...prev }
        delete next[idx]
        return next
      })
    }
  }

  const openCreate = () => {
    setEditingId(null)
    reset({ employee_id: '', tipo: '' })
    setDateInputs([''])
    setCantidadDias(1)
    setDateErrors({})
    setShowModal(true)
  }

  const openEdit = async (id: number) => {
    try {
      const res = await absenceApi.getById(id)
      const a = res.data
      setEditingId(id)
      const dias = a.dias?.length > 0 ? a.dias : [a.fecha_inicio]
      setDateInputs(dias)
      setCantidadDias(dias.length)
      setDateErrors({})
      reset({
        employee_id: a.employee_id,
        tipo: a.tipo,
      })
      setShowModal(true)
    } catch {
      toast.error('Error al cargar ausencia')
    }
  }

  const onFormSubmit = async (data: any) => {
    if (Object.keys(dateErrors).length > 0) {
      toast.error('Corrige las fechas con errores antes de guardar')
      return
    }
    const dias = dateInputs.filter(d => d)
    if (dias.length === 0) {
      toast.error('Agrega al menos una fecha')
      return
    }

    try {
      if (editingId) {
        await absenceApi.update(editingId, { ...data, dias })
        toast.success('Ausencia actualizada correctamente')
      } else {
        const res = await absenceApi.create({ ...data, dias })
        if (res.data.warning) {
          toast(res.data.warning, { icon: '⚠️', duration: 5000 })
        }
        toast.success('Ausencia registrada correctamente')
      }
      reset()
      setShowModal(false)
      setEditingId(null)
      setDateInputs([''])
      setCantidadDias(1)
      setDateErrors({})
      loadAbsences()
    } catch (err: any) {
      const msg = err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data?.errors?.dias?.[0] ||
        'Error al guardar ausencia'
      toast.error(msg)
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
    try {
      await absenceApi.delete(id)
      toast.success('Ausencia descartada')
      loadAbsences()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al descartar')
    } finally {
      setConfirmDelete(null)
    }
  }

  const totalDias = (a: Absence) => {
    if (a.dias && a.dias.length > 0) {
      return a.dias.filter(d => {
        const day = parseDate(d).getDay()
        return day >= 1 && day <= 5
      }).length
    }
    const inicio = parseDate(a.fecha_inicio)
    const fin = parseDate(a.fecha_fin)
    let count = 0
    const current = new Date(inicio)
    while (current <= fin) {
      const day = current.getDay()
      if (day >= 1 && day <= 5) count++
      current.setDate(current.getDate() + 1)
    }
    return count
  }

  const tipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      'Injustificada': 'bg-red-100 text-red-700',
      'Permiso sin goce de sueldo': 'bg-yellow-100 text-yellow-700',
      'Incapacidad ISSS': 'bg-blue-100 text-blue-700',
    }
    return colors[tipo] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h2 className="text-2xl font-bold text-primary">Ausencias</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input type="month" value={filterPeriodo} onChange={e => setFilterPeriodo(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
          <div className="relative flex-1 sm:flex-none">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar empleado..."
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg w-full sm:w-64 hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
            />
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-secondary text-white px-5 py-2.5 rounded-lg hover:bg-accent transition-all duration-200 shadow-md"
          >
            <Plus size={20} /> Nueva Ausencia
          </button>
        </div>
      </div>

      <Modal open={showModal} onClose={() => {
        setShowModal(false)
        setEditingId(null)
        setDateErrors({})
        setDateInputs([''])
        setCantidadDias(1)
      }}>
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">
              {editingId ? 'Editar Ausencia' : 'Registrar Ausencia'}
            </h3>
            <button onClick={() => {
              setShowModal(false)
              setEditingId(null)
              setDateErrors({})
              setDateInputs([''])
              setCantidadDias(1)
            }} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empleado</label>
              <select {...register('employee_id', { required: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200">
                <option value="">Seleccionar...</option>
                {employees.filter(e => e.estado !== 'inactivo').map(e => (
                  <option key={e.id} value={e.id}>{e.nombres} {e.apellidos}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ausencia</label>
              <select {...register('tipo', { required: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200">
                <option value="">Seleccionar...</option>
                <option value="Injustificada">Injustificada</option>
                <option value="Permiso sin goce de sueldo">Permiso sin goce de sueldo</option>
                <option value="Incapacidad ISSS">Incapacidad ISSS</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ¿Cuántos días se ausentó?
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={cantidadDias}
                onChange={e => handleCantidadChange(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Selecciona las fechas
              </label>
              {dateInputs.map((val, idx) => (
                <div key={idx}>
                  <input
                    type="date"
                    value={val}
                    onChange={e => handleDateInput(idx, e.target.value)}
                    className={`w-full px-3 py-2 border ${dateErrors[idx] ? 'border-red-500' : 'border-gray-200'} rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200`}
                  />
                  {dateErrors[idx] && (
                    <p className="text-red-500 text-xs mt-1">{dateErrors[idx]}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit"
                className="flex-1 bg-secondary text-white py-2.5 rounded-lg hover:bg-accent transition-all duration-200 font-medium shadow-md">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" onClick={() => {
                setShowModal(false)
                setEditingId(null)
                setDateErrors({})
                setDateInputs([''])
                setCantidadDias(1)
              }}
                className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4 text-sm font-medium text-gray-500">Empleado</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Tipo</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Fechas</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Días</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Estado</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Acción</th>
              </tr>
            </thead>
            <tbody>
              {absences.map(a => {
                const dates = a.dias?.length > 0 ? a.dias : [a.fecha_inicio, a.fecha_fin]
                return (
                  <tr key={a.id} className="border-t border-gray-50 hover:bg-primary/5 hover:shadow-sm transition-all duration-200">
                    <td className="p-4 font-medium">{a.employee?.nombres} {a.employee?.apellidos}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tipoBadge(a.tipo)}`}>
                        {a.tipo}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 max-w-[200px] truncate" title={dates.join(', ')}>
                      {dates.map(d => fmt(d)).join(', ')}
                    </td>
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
                      <div className="flex items-center justify-center gap-1">
                        {a.estado === 'Borrador' && (
                          <>
                            <button onClick={() => openEdit(a.id)}
                              className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Editar">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleApprove(a.id)}
                              className="flex items-center gap-1 text-secondary hover:bg-secondary/5 px-3 py-1.5 rounded-lg transition-all duration-200">
                              <CheckCircle size={16} /> Aprobar
                            </button>
                            <button onClick={() => setConfirmDelete(a.id)}
                              className="flex items-center gap-1 text-red-400 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all duration-200">
                              <Trash2 size={16} /> Descartar
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {absences.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No hay registros de ausencias
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete !== null && (
        <ConfirmModal
          message="¿Descartar esta ausencia?"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmLabel="Sí, descartar"
        />
      )}
    </div>
  )
}
