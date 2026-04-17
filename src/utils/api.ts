import { useAuthStore } from '@/stores/authStore'

export type ApiErr = { success: false; error: string }
export type ApiOkWithData<T> = { success: true; data: T }

export async function apiRequest<T>(
  path: string,
  init?: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> },
) {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(path, {
    ...init,
    headers,
  })

  const jsonUnknown = (await res.json()) as unknown
  const json = jsonUnknown as { success?: boolean; error?: string }
  if (!res.ok || json.success === false) {
    const message = !res.ok
      ? `HTTP ${res.status}`
      : (json as ApiErr).error
    throw new Error(message)
  }
  return jsonUnknown as T
}

export function apiGetJson<T>(path: string) {
  return apiRequest<T>(path)
}

export async function apiGetData<T>(path: string) {
  const json = await apiRequest<ApiOkWithData<T>>(path)
  return json.data
}

export function apiPostJson<T>(path: string, body: unknown) {
  return apiRequest<T>(path, { method: 'POST', body: JSON.stringify(body) })
}

export async function apiPostData<T>(path: string, body: unknown) {
  const json = await apiRequest<ApiOkWithData<T>>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return json.data
}

export async function apiPatchData<T>(path: string, body: unknown) {
  const json = await apiRequest<ApiOkWithData<T>>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  return json.data
}
