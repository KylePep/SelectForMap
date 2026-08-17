import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

export function attachAuthInterceptor(getToken) {
  apiClient.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })
}

/**
 * Handles an expired/revoked Sanctum token: any 401 from the API means the stored
 * token is no longer usable, so the caller is given a chance to clear the local
 * session and send the user back to the login screen. The error is still rejected
 * so individual callers can show their own messaging.
 */
export function attachUnauthorizedInterceptor(onUnauthorized) {
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        onUnauthorized(error)
      }
      return Promise.reject(error)
    },
  )
}

/** Best-effort human-readable message for an axios error, for inline banners. */
export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data
  if (data?.errors) {
    const first = Object.values(data.errors)[0]
    if (Array.isArray(first) && first.length) return first[0]
  }
  if (data?.message) return data.message
  if (error?.response?.status === 401) return 'Session expired, please log in again.'
  if (!error?.response) return 'Could not reach the server. Check your connection and try again.'
  return fallback
}
