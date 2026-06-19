import { useState, useEffect, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { employeeApi, workLogApi, absenceApi } from '../services/api'
import { Plus, X, Search, CheckCircle, Trash2, Pencil, ExternalLink, Upload, Download, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import ConfirmModal from '../components/ConfirmModal'
import Modal from '../components/Modal'

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

const today = new Date().toISOString().slice(0, 7)

export default function WorkLogs() {
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filterPeriodo, setFilterPeriodo] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [approveAllLoading, setApproveAllLoading] = useState(false)
  const [discardAllLoading, setDiscardAllLoading] = useState(false)
  const [confirmBulk, setConfirmBulk] = useState(false)
  const prevNocturna = useRef<number>(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.openCreate) {
      openCreate()
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const { register, handleSubmit, reset, setValue, control } = useForm<any>({
    defaultValues: { hora_normal_diurna: 0, hora_normal_nocturna: 0, extra_diurna: 0, extra_nocturna: 0 }
  })
  const selectedEmployeeId = useWatch<any>({ control, name: 'employee_id' })
  const periodoValue = useWatch<any>({ control, name: 'periodo' })
  const nocturnaValue = useWatch<any>({ control, name: 'hora_normal_nocturna' })

  useEffect(() => {
    if (selectedEmployeeId && periodoValue && !editingId) {
      absenceApi.getAll({ employee_id: Number(selectedEmployeeId), periodo: periodoValue, estado: 'Aprobada' })
        .then(res => {
          const days = res.data.reduce((sum: number, a: any) => sum + (a.dias?.length || 0), 0)
          const suggested = Math.max(0, 240 - days * 8)
          setValue('hora_normal_diurna', suggested)
          prevNocturna.current = 0
        })
        .catch(() => {})
    }
  }, [selectedEmployeeId, periodoValue, editingId, setValue])

  useEffect(() => {
    const current = Number(nocturnaValue) || 0
    const prev = prevNocturna.current
    if (current !== prev) {
      const diurna = Number(document.querySelector<HTMLInputElement>('input[name="hora_normal_diurna"]')?.value) || 0
      const nuevo = Math.max(0, Math.min(240, diurna - (current - prev)))
      setValue('hora_normal_diurna', nuevo)
      prevNocturna.current = current
    }
  }, [nocturnaValue, setValue])

  const getParams = () => ({
    search: search || undefined,
    periodo: filterPeriodo || undefined,
  })

  const loadWorkLogs = () => {
    workLogApi.getAll(getParams()).then(res => setWorkLogs(res.data))
  }

  useEffect(() => {
    Promise.all([
      employeeApi.getAll(),
      workLogApi.getAll(getParams()),
    ]).then(([emp, logs]) => {
      setEmployees(emp.data)
      setWorkLogs(logs.data)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => { const t = setTimeout(loadWorkLogs, 300); return () => clearTimeout(t) }, [search, filterPeriodo])

  const openCreate = () => {
    setEditingId(null)
    reset({
      employee_id: '',
      periodo: today,
      hora_normal_diurna: 0,
      hora_normal_nocturna: 0,
      extra_diurna: 0,
      extra_nocturna: 0,
    })
    prevNocturna.current = 0
    setShowModal(true)
  }

  const openEdit = async (id: number) => {
    try {
      const res = await workLogApi.getById(id)
      const w = res.data
      setEditingId(id)
      reset({
        employee_id: w.employee_id,
        periodo: w.periodo,
        hora_normal_diurna: w.hora_normal_diurna,
        hora_normal_nocturna: w.hora_normal_nocturna,
        extra_diurna: w.extra_diurna,
        extra_nocturna: w.extra_nocturna,
      })
      prevNocturna.current = Number(w.hora_normal_nocturna) || 0
      setShowModal(true)
    } catch {
      toast.error('Error al cargar registro de horas')
    }
  }

  const onSubmit = async (data: any) => {
    try {
      if (editingId) {
        await workLogApi.update(editingId, data)
        toast.success('Horas actualizadas correctamente')
      } else {
        await workLogApi.create(data)
        toast.success('Horas registradas correctamente')
      }
      reset()
      setShowModal(false)
      setEditingId(null)
      loadWorkLogs()
    } catch (err: any) {
      const msg = err.response?.data?.error ||
        err.response?.data?.message ||
        err.response?.data?.errors?.employee_id?.[0] ||
        'Error al guardar horas'
      toast.error(msg)
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
    try {
      await workLogApi.delete(id)
      toast.success('Registro descartado')
      loadWorkLogs()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al descartar')
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleBulkCreate = async () => {
    setConfirmBulk(false)
    const p = filterPeriodo || today
    setBulkLoading(true)
    try {
      const res = await workLogApi.bulkCreate(p)
      toast.success(`${res.data.total_created} registros creados${res.data.total_skipped ? `, ${res.data.total_skipped} saltados` : ''}`)
      loadWorkLogs()
    } catch {
      toast.error('Error al crear registros masivos')
    } finally {
      setBulkLoading(false)
    }
  }

  const handleApproveAll = async () => {
    setApproveAllLoading(true)
    try {
      const res = await workLogApi.approveAll(filterPeriodo || undefined)
      toast.success(`${res.data.aprobados} registros aprobados`)
      loadWorkLogs()
    } catch {
      toast.error('Error al aprobar')
    } finally {
      setApproveAllLoading(false)
    }
  }

  const handleDiscardAll = async () => {
    setDiscardAllLoading(true)
    try {
      const res = await workLogApi.discardAll(filterPeriodo || undefined)
      toast.success(`${res.data.descartados} registros descartados`)
      loadWorkLogs()
    } catch {
      toast.error('Error al descartar')
    } finally {
      setDiscardAllLoading(false)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const res = await workLogApi.downloadTemplate()
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'plantilla_horas.csv'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Error al descargar plantilla')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await workLogApi.import(file)
      const msg = `${res.data.created} registros importados`
      const errs = res.data.errors || []
      toast.success(errs.length ? msg + `. ${errs.length} errores` : msg)
      if (errs.length) {
        errs.slice(0, 5).forEach((err: string) => toast.error(err, { duration: 5000 }))
      }
      loadWorkLogs()
    } catch (err: any) {
      const serverMsg = err.response?.data?.error || err.response?.data?.message || ''
      toast.error(serverMsg || 'Error al importar archivo')
    }
    e.target.value = ''
  }

  const totalHoras = (w: WorkLog) =>
    Number(w.hora_normal_diurna) + Number(w.hora_normal_nocturna) +
    Number(w.extra_diurna) + Number(w.extra_nocturna)

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
        <h2 className="text-2xl font-bold text-primary">Horas Laboradas</h2>
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
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setConfirmBulk(true)} disabled={bulkLoading}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/80 transition-all duration-200 shadow-md disabled:opacity-50">
          <Users size={18} /> {bulkLoading ? 'Creando...' : 'Aplicar a Todos'}
        </button>
        <button onClick={handleApproveAll} disabled={approveAllLoading}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-accent transition-all duration-200 shadow-md disabled:opacity-50">
          <CheckCircle size={18} /> {approveAllLoading ? 'Aprobando...' : 'Aprobar Todas'}
        </button>
        <button onClick={handleDiscardAll} disabled={discardAllLoading}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-200 shadow-md disabled:opacity-50">
          <Trash2 size={18} /> {discardAllLoading ? 'Descartando...' : 'Descartar Todas'}
        </button>
        <button onClick={handleDownloadTemplate}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-md">
          <Download size={18} /> Plantilla CSV
        </button>
        <label className="flex items-center gap-2 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition-all duration-200 shadow-md cursor-pointer">
          <Upload size={18} /> Importar archivo
          <input type="file" accept=".csv,.txt,.xlsx,.xls" onChange={handleImport} className="hidden" />
        </label>
        <button onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-secondary text-white px-5 py-2 rounded-lg hover:bg-accent transition-all duration-200 shadow-md">
          <Plus size={20} /> Registrar Horas
        </button>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingId(null) }}>
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">
              {editingId ? 'Editar Horas Laboradas' : 'Registrar Horas Laboradas'}
            </h3>
            <button onClick={() => { setShowModal(false); setEditingId(null) }} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
              <input type="month" {...register('periodo', { required: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Normal Diurna</label>
                <input type="number" step="0.5" min="0" {...register('hora_normal_diurna', { min: 0 })}
                  onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('El valor no puede ser negativo')}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora Normal Nocturna</label>
                <input type="number" step="0.5" min="0" {...register('hora_normal_nocturna', { min: 0 })}
                  onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('El valor no puede ser negativo')}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra Diurna</label>
                <input type="number" step="0.5" min="0" {...register('extra_diurna', { min: 0 })}
                  onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('El valor no puede ser negativo')}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Extra Nocturna</label>
                <input type="number" step="0.5" min="0" {...register('extra_nocturna', { min: 0 })}
                  onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('El valor no puede ser negativo')}
                  onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <div className="font-medium mb-1">Recordatorio</div>
              <div className="flex items-center justify-between">
                <span>No olvide registrar las ausencias del período en el módulo correspondiente.</span>
                <button type="button" onClick={() => navigate('/absences')}
                  className="flex items-center gap-1 text-primary hover:text-primary/70 font-medium ml-2 whitespace-nowrap">
                  <ExternalLink size={14} /> Ausencias
                </button>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit"
                className="flex-1 bg-secondary text-white py-2.5 rounded-lg hover:bg-accent transition-all duration-200 font-medium shadow-md">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" onClick={() => { setShowModal(false); setEditingId(null) }}
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
                <tr key={w.id} className="border-t border-gray-50 hover:bg-primary/5 hover:shadow-sm transition-all duration-200">
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
                    <div className="flex items-center justify-center gap-1">
                      {w.estado === 'Borrador' && (
                        <>
                          <button onClick={() => openEdit(w.id)}
                            className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors" title="Editar">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => handleApprove(w.id)}
                            className="flex items-center gap-1 text-secondary hover:bg-secondary/5 px-3 py-1.5 rounded-lg transition-all duration-200">
                            <CheckCircle size={16} /> Aprobar
                          </button>
                          <button onClick={() => setConfirmDelete(w.id)}
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

      {confirmDelete !== null && (
        <ConfirmModal
          message="¿Descartar este registro de horas?"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmLabel="Sí, descartar"
        />
      )}

      {confirmBulk && (
        <ConfirmModal
          message={`¿Crear registros de horas para todos los empleados activos en ${filterPeriodo || today}?`}
          onConfirm={handleBulkCreate}
          onCancel={() => setConfirmBulk(false)}
          confirmLabel="Sí, aplicar a todos"
        />
      )}
    </div>
  )
}
