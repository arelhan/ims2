import axios from 'axios'

function getBaseURL(): string {
  if (typeof window === 'undefined') {
    // Server-side: use env or localhost
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
  }
  // Client-side: always use the same hostname the user is browsing from
  // This works for both localhost and internal IP access
  return `${window.location.protocol}//${window.location.hostname}:4000/api`
}

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
})

// Guard against multiple concurrent 401s all trying to redirect at once
let loggingOut = false

api.interceptors.response.use(
  res => res,
  async err => {
    if (err.response?.status === 401 && typeof window !== 'undefined' && !loggingOut) {
      loggingOut = true
      // The token cookie is httpOnly — JS can't delete it directly.
      // Call logout so the backend clears it, then redirect to login.
      // Without this, the middleware sees the cookie and sends us back to dashboard → loop.
      try {
        await fetch(
          `${window.location.protocol}//${window.location.hostname}:4000/api/auth/logout`,
          { method: 'POST', credentials: 'include' }
        )
      } catch { /* backend unreachable — cookie stays but redirect still needed */ }
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
