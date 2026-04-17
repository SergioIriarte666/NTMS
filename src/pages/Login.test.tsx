import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/Login'
import { useAuthStore } from '@/stores/authStore'

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>,
  )
}

describe('Login', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ hydrated: true, token: null, user: null })
    vi.restoreAllMocks()
  })

  it('valida el email', async () => {
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'no-es-email' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Email inválido')).toBeInTheDocument()
  })

  it('guarda sesión cuando el login responde ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            success: true,
            token: 'token-demo',
            user: {
              id: 'u1',
              email: 'demo@gruas.cl',
              full_name: 'Demo',
              role: 'operaciones',
              is_active: true,
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    renderLogin()
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))

    await waitFor(() => {
      expect(useAuthStore.getState().token).toBe('token-demo')
    })
  })
})

