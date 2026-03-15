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

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
