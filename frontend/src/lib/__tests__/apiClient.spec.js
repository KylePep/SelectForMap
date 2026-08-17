import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import {
  apiClient,
  attachAuthInterceptor,
  attachUnauthorizedInterceptor,
  apiErrorMessage,
} from '../apiClient'

const originalAdapter = apiClient.defaults.adapter

/**
 * Stubs the transport so every request produces the given status/body. A custom
 * adapter is responsible for settling the promise itself, so non-2xx statuses are
 * thrown as an AxiosError exactly like the real HTTP adapter does.
 */
function respondWith(status, data = {}) {
  apiClient.defaults.adapter = async (config) => {
    const response = { data, status, statusText: String(status), headers: {}, config }
    if (status >= 200 && status < 300) return response
    throw new axios.AxiosError(
      `Request failed with status code ${status}`,
      axios.AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response,
    )
  }
}

describe('apiClient interceptors', () => {
  beforeEach(() => {
    apiClient.interceptors.request.clear()
    apiClient.interceptors.response.clear()
  })

  afterEach(() => {
    apiClient.interceptors.request.clear()
    apiClient.interceptors.response.clear()
    apiClient.defaults.adapter = originalAdapter
  })

  it('attaches the bearer token to outgoing requests', async () => {
    respondWith(200)
    attachAuthInterceptor(() => 'token-123')

    const response = await apiClient.get('/quests')

    expect(response.config.headers.Authorization).toBe('Bearer token-123')
  })

  it('calls the unauthorized handler on a 401 and still rejects the error', async () => {
    respondWith(401, { message: 'Unauthenticated.' })
    const onUnauthorized = vi.fn()
    attachUnauthorizedInterceptor(onUnauthorized)

    await expect(apiClient.get('/quests')).rejects.toMatchObject({ response: { status: 401 } })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('does not call the unauthorized handler for other error statuses', async () => {
    respondWith(422, { message: 'The given data was invalid.' })
    const onUnauthorized = vi.fn()
    attachUnauthorizedInterceptor(onUnauthorized)

    await expect(apiClient.post('/quests', {})).rejects.toBeTruthy()
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('leaves successful responses untouched', async () => {
    respondWith(200, [{ id: 1 }])
    const onUnauthorized = vi.fn()
    attachUnauthorizedInterceptor(onUnauthorized)

    const response = await apiClient.get('/quests')

    expect(response.data).toEqual([{ id: 1 }])
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})

describe('apiErrorMessage', () => {
  it('prefers the first field-level validation error', () => {
    const error = { response: { status: 422, data: { errors: { title: ['The title is required.'] } } } }

    expect(apiErrorMessage(error)).toBe('The title is required.')
  })

  it('falls back to the response message', () => {
    const error = { response: { status: 500, data: { message: 'Server error.' } } }

    expect(apiErrorMessage(error)).toBe('Server error.')
  })

  it('reports an expired session for a bare 401', () => {
    expect(apiErrorMessage({ response: { status: 401, data: {} } })).toBe(
      'Session expired, please log in again.',
    )
  })

  it('reports a connection problem when there is no response at all', () => {
    expect(apiErrorMessage(new Error('Network Error'))).toContain('Could not reach the server')
  })

  it('uses the caller supplied fallback otherwise', () => {
    const error = { response: { status: 500, data: {} } }

    expect(apiErrorMessage(error, 'Could not save that quest.')).toBe('Could not save that quest.')
  })
})
