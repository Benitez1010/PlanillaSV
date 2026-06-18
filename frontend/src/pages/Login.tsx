import { useState } from 'react'
import { authApi } from '../services/api'
import { Building2, Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('admin@planillas.com')
  const [password, setPassword] = useState('admin123')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      window.location.href = '/'
    } catch (err: any) {
      toast.error(err.response?.data?.errors?.email?.[0] || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-blue-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] bg-[url('/logo2.png')] bg-repeat bg-[length:96px]" />

      <div className="absolute top-20 left-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-4xl bg-white/10 backdrop-blur-sm rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-5/12 bg-gradient-to-br from-primary to-blue-900 p-10 flex flex-col items-center justify-center text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('/logo2.png')] bg-repeat bg-[length:80px]" />
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary/10 rounded-full blur-2xl" />

            <div className="relative flex flex-col items-center text-center">
              <img src="/logo.png" alt="Logo" className="w-28 h-28 rounded-2xl shadow-lg ring-2 ring-white/20 mb-5 object-cover" />
              <h1 className="text-3xl font-bold">Planillas SV</h1>
              <div className="h-1 w-16 bg-secondary mt-4 rounded-full" />
              <p className="text-white/70 mt-4 text-sm leading-relaxed max-w-xs">
                Sistema integral de gestión de Recursos Humanos y planillas para El Salvador
              </p>
              <div className="mt-8 space-y-3 text-sm text-white/60 text-left w-full max-w-[200px]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-secondary" />
                  </div>
                  <span>Control de empleados</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center shrink-0">
                    <Lock size={16} className="text-secondary" />
                  </div>
                  <span>Cálculo de planillas ISSS/AFP/ISR</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:w-7/12 p-10 flex items-center">
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Bienvenido</h2>
                <p className="text-white/50 mt-1">Ingrese sus credenciales para continuar</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Correo Electrónico</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none hover:bg-white/15 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none hover:bg-white/15 transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-secondary text-white py-3 rounded-xl hover:bg-accent hover:shadow-lg hover:shadow-secondary/25 transition-all duration-200 font-semibold shadow-md disabled:opacity-50"
                >
                  {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
