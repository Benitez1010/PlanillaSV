import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { employeeApi } from '../services/api'
import { Pencil, Trash2, Plus, X, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import ConfirmModal from '../components/ConfirmModal'
import Modal from '../components/Modal'

interface Employee {
  id?: number
  nombres: string
  apellidos: string
  salario_nominal: number
  fecha_ingreso: string
  estado: string
  aplicar_vacaciones?: boolean
  ultimas_vacaciones?: string | null
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return dateStr.split('T')[0]
}

const today = new Date().toISOString().split('T')[0]

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [loading, setLoading] = useState(true)
  const [backendErrors, setBackendErrors] = useState<Record<string, string[]>>({})
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Employee>()

  const loadEmployees = () => {
    employeeApi.getAll({
      search: search || undefined,
      estado: filtroEstado || undefined,
    }).then(res => setEmployees(res.data))
  }

  useEffect(() => { loadEmployees(); setLoading(false) }, [])

  useEffect(() => { const t = setTimeout(loadEmployees, 300); return () => clearTimeout(t) }, [search, filtroEstado])

  const onSubmit = async (data: Employee) => {
    setBackendErrors({})
    try {
      if (editingId) {
        await employeeApi.update(editingId, data)
        toast.success('Empleado actualizado correctamente')
      } else {
        await employeeApi.create(data)
        toast.success('Empleado creado correctamente')
      }
      reset()
      setShowModal(false)
      setEditingId(null)
      loadEmployees()
    } catch (err: any) {
      const errors = err.response?.data?.errors
      if (errors) {
        setBackendErrors(errors)
      } else {
        toast.error(err.response?.data?.error || 'Error al guardar empleado')
      }
    }
  }

  const handleEdit = async (id: number) => {
    setBackendErrors({})
    try {
      const res = await employeeApi.getById(id)
      const emp = res.data
      reset({
        nombres: emp.nombres,
        apellidos: emp.apellidos,
        salario_nominal: emp.salario_nominal,
        fecha_ingreso: formatDate(emp.fecha_ingreso),
        estado: emp.estado,
      })
      setEditingId(id)
      setShowModal(true)
    } catch {
      toast.error('Error al cargar empleado')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await employeeApi.delete(id)
      toast.success('Empleado eliminado')
      loadEmployees()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar empleado')
    } finally {
      setConfirmDelete(null)
    }
  }

  const openCreate = () => {
    setBackendErrors({})
    reset({ nombres: '', apellidos: '', salario_nominal: 0, fecha_ingreso: '', estado: 'activo' })
    setEditingId(null)
    setShowModal(true)
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
        <h2 className="text-2xl font-bold text-primary">Empleados</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200 text-sm"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
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
            <Plus size={20} /> Nuevo
          </button>
        </div>
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditingId(null); setBackendErrors({}) }}>
        <div className="p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary">
              {editingId ? 'Editar Empleado' : 'Nuevo Empleado'}
            </h3>
            <button onClick={() => { setShowModal(false); setEditingId(null); setBackendErrors({}) }} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
                <input {...register('nombres', { required: true })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
                {errors.nombres && <span className="text-red-500 text-xs">Requerido</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
                <input {...register('apellidos', { required: true })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
                {errors.apellidos && <span className="text-red-500 text-xs">Requerido</span>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salario Nominal ($)</label>
              <input type="number" step="0.01" {...register('salario_nominal', { required: true, min: 0 })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
              {backendErrors.salario_nominal && (
                <span className="text-red-500 text-xs block mt-1">{backendErrors.salario_nominal[0]}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Ingreso</label>
              <input type="date" max={today} {...register('fecha_ingreso', { required: true })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200" />
              {backendErrors.fecha_ingreso && (
                <span className="text-red-500 text-xs block mt-1">{backendErrors.fecha_ingreso[0]}</span>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select {...register('estado')}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg hover:border-primary/30 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all duration-200">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit"
                className="flex-1 bg-secondary text-white py-2.5 rounded-lg hover:bg-accent transition-all duration-200 font-medium shadow-md">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setBackendErrors({}) }}
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
                <th className="text-left p-4 text-sm font-medium text-gray-500">Nombre</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Apellidos</th>
                <th className="text-right p-4 text-sm font-medium text-gray-500">Salario</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Ingreso</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Estado</th>
                <th className="text-center p-4 text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} className="border-t border-gray-50 hover:bg-primary/5 hover:shadow-sm transition-all duration-200">
                  <td className="p-4 font-medium">{e.nombres}</td>
                  <td className="p-4 text-gray-600">{e.apellidos}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(e.salario_nominal)}</td>
                  <td className="p-4 text-gray-500">{formatDate(e.fecha_ingreso)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      e.estado === 'activo'
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {e.estado}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button onClick={() => handleEdit(e.id!)}
                      className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => setConfirmDelete(e.id!)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors ml-1">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    No hay empleados registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirmDelete !== null && (
        <ConfirmModal
          message="¿Eliminar empleado? Esta acción no se puede deshacer."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          confirmLabel="Sí, eliminar"
        />
      )}
    </div>
  )
}
