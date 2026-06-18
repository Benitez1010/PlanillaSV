import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/login', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
}

export const employeeApi = {
  getAll: (params?: { search?: string; estado?: string }) =>
    api.get('/employees', { params }),
  getById: (id: number) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: number, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
  eligibleForVacation: (id: number) => api.get(`/employees/${id}/eligible-vacation`),
}

export const workLogApi = {
  getAll: (params?: { employee_id?: number; estado?: string; search?: string; periodo?: string }) =>
    api.get('/work-logs', { params }),
  getById: (id: number) => api.get(`/work-logs/${id}`),
  create: (data: any) => api.post('/work-logs', data),
  update: (id: number, data: any) => api.put(`/work-logs/${id}`, data),
  approve: (id: number) => api.patch(`/work-logs/${id}/approve`),
  delete: (id: number) => api.delete(`/work-logs/${id}`),
}

export const absenceApi = {
  getAll: (params?: { search?: string; tipo?: string; estado?: string; periodo?: string }) =>
    api.get('/absences', { params }),
  getById: (id: number) => api.get(`/absences/${id}`),
  create: (data: any) => api.post('/absences', data),
  update: (id: number, data: any) => api.put(`/absences/${id}`, data),
  approve: (id: number) => api.patch(`/absences/${id}/approve`),
  delete: (id: number) => api.delete(`/absences/${id}`),
}

export const payrollApi = {
  getAll: (params?: { estado?: string; search?: string }) =>
    api.get('/payrolls', { params }),
  getById: (id: number) => api.get(`/payrolls/${id}`),
  generate: (data: { periodo: string; vacaciones_ids?: number[] }) =>
    api.post('/payrolls/generate', data),
  close: (id: number) => api.patch(`/payrolls/${id}/close`),
  discard: (id: number) => api.delete(`/payrolls/${id}/discard`),
  refresh: (id: number, data?: { vacaciones_ids?: number[] }) =>
    api.post(`/payrolls/${id}/refresh`, data || {}),
  receipt: (payrollId: number, employeeId: number) =>
    api.get(`/payrolls/${payrollId}/receipt/${employeeId}`, { responseType: 'blob' }),
}

export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
}

export default api
