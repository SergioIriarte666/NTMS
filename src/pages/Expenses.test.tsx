import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Expenses from '@/pages/Expenses'
import { useAuthStore } from '@/stores/authStore'

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/app/gastos']}>
      <Expenses />
    </MemoryRouter>,
  )
}

describe('Expenses', () => {
  beforeEach(() => {
    useAuthStore.setState({ hydrated: true, token: 't', refresh_token: 'r', user: { id: 'u1', email: 'x', full_name: 'Demo', role: 'operaciones', is_active: true } })
    vi.restoreAllMocks()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.startsWith('/api/expenses/categories')) {
          return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.startsWith('/api/providers')) {
          return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        if (url.startsWith('/api/expenses')) {
          return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }
        return new Response(JSON.stringify({ success: true, data: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })
      }),
    )
  })

  it('renderiza el módulo de gastos', async () => {
    renderPage()
    expect(await screen.findByText('Gestión de Gastos')).toBeInTheDocument()
    expect(screen.getByText('Categorías')).toBeInTheDocument()
  })
})

