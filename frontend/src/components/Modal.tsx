import { useState, useEffect, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  borderColor?: string
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
}

type Phase = 'closed' | 'open' | 'closing'

export default function Modal({ open, onClose, children, maxWidth = 'lg', borderColor = 'border-secondary' }: Props) {
  const [phase, setPhase] = useState<Phase>('closed')

  useEffect(() => {
    if (open) {
      setPhase('open')
    } else if (phase !== 'closed') {
      setPhase('closing')
      const t = setTimeout(() => setPhase(prev => prev === 'closing' ? 'closed' : prev), 200)
      return () => clearTimeout(t)
    }
  }, [open])

  if (phase === 'closed') return null

  const overlayAnim = phase === 'closing' ? 'modal-overlay-out' : 'modal-overlay-in'
  const contentAnim = phase === 'closing' ? 'modal-content-out' : 'modal-content-in'

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        style={{ animation: `${overlayAnim} 200ms ease-out forwards` }}
        onClick={onClose}
      />
      <div className="relative flex items-center justify-center min-h-screen p-4">
        <div
          className={`w-full ${widths[maxWidth]} mx-auto`}
          style={{ animation: `${contentAnim} 200ms ease-out forwards` }}
        >
          <div className={`bg-white rounded-xl shadow-2xl border-t-4 ${borderColor} overflow-hidden`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
