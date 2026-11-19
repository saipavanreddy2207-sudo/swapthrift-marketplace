import api, { TOKEN_KEY } from './api'

export function storeToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export const authService = {
  me: () => api.get('/auth/me'),
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),

  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', email ? { email } : {}),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),

  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),

  // Backend uses PATCH /auth/me with firstName, lastName, phone, city, postalCode, bio.
  updateProfile: (data) => api.patch('/auth/me', data),

  changeEmail: (newEmail, password) =>
    api.post('/auth/change-email', { newEmail, password }),

  uploadAvatar: (file) => {
    const data = new FormData()
    data.append('avatar', file)
    return api.post('/auth/avatar', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  deleteAccount: () => api.delete('/auth/me'),
}

export default authService
