import Modal from './Modal'

interface Props {
  message: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  confirmLabel?: string
}

export default function ConfirmModal({ message, onConfirm, onCancel, loading, confirmLabel }: Props) {
  return (
    <Modal open={true} onClose={onCancel} maxWidth="sm" borderColor="border-red-500">
      <div className="p-6">
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 bg-red-500 text-white py-2.5 rounded-lg hover:bg-red-600 hover:shadow-lg disabled:opacity-50 transition-all duration-200 font-medium"
          >
            {loading ? 'Procesando...' : confirmLabel || 'Sí, confirmar'}
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  )
}
