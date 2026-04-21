import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiGetData, apiRequest } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'
import type { ExpenseCategory, ExpensePaymentMethod, ExpenseWithDetails, Provider } from '@/types/domain'
import { CategoryModal } from '@/components/expenses/CategoryModal'
import { ExpenseModal } from '@/components/expenses/ExpenseModal'

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'operaciones'
}

function methodLabel(m: ExpensePaymentMethod) {
  if (m === 'efectivo') return 'Efectivo'
  if (m === 'transferencia') return 'Transferencia'
  if (m === 'tarjeta') return 'Tarjeta'
  return 'Otro'
}

export default function Expenses() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)

  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [expenses, setExpenses] = useState<ExpenseWithDetails[]>([])

  const [loading, setLoading] = useState(true)

  const [categoryQuery, setCategoryQuery] = useState('')

  const [filterStart, setFilterStart] = useState('')
  const [filterEnd, setFilterEnd] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [filterProviderId, setFilterProviderId] = useState('')
  const [filterMethod, setFilterMethod] = useState<ExpensePaymentMethod | ''>('')

  const [openCategory, setOpenCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)

  const [openExpense, setOpenExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseWithDetails | null>(null)

  const loadCategories = useCallback(async () => {
    const data = await apiGetData<ExpenseCategory[]>('/api/expenses/categories')
    setCategories(data)
  }, [])

  const loadProviders = useCallback(async () => {
    const data = await apiGetData<Provider[]>('/api/providers')
    setProviders(data)
  }, [])

  const loadExpenses = useCallback(async () => {
    const qs = new URLSearchParams()
    if (filterStart) qs.set('start_date', filterStart)
    if (filterEnd) qs.set('end_date', filterEnd)
    if (filterCategoryId) qs.set('category_id', filterCategoryId)
    if (filterProviderId) qs.set('provider_id', filterProviderId)
    if (filterMethod) qs.set('payment_method', filterMethod)
    const suffix = qs.toString().length > 0 ? `?${qs.toString()}` : ''
    const data = await apiGetData<ExpenseWithDetails[]>(`/api/expenses${suffix}`)
    setExpenses(data)
  }, [filterStart, filterEnd, filterCategoryId, filterProviderId, filterMethod])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadCategories(), loadProviders(), loadExpenses()])
    } finally {
      setLoading(false)
    }
  }, [loadCategories, loadProviders, loadExpenses])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  useEffect(() => {
    void loadExpenses()
  }, [loadExpenses])

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase()
    if (!q) return categories
    return categories.filter(c => c.name.toLowerCase().includes(q))
  }, [categories, categoryQuery])

  const totals = useMemo(() => {
    const total = expenses.reduce((acc, e) => acc + Number(e.amount ?? 0), 0)
    return { total }
  }, [expenses])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Gestión de Gastos</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Categorías, gastos y filtros por período.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-40 max-w-full">
              <Input type="date" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
            </div>
            <div className="w-40 max-w-full">
              <Input type="date" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
            </div>
            <div className="w-56 max-w-full">
              <Select value={filterCategoryId} onChange={e => setFilterCategoryId(e.target.value)}>
                <option value="">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-56 max-w-full">
              <Select value={filterProviderId} onChange={e => setFilterProviderId(e.target.value)}>
                <option value="">Todos los proveedores</option>
                {providers.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.razon_social}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-48 max-w-full">
              <Select value={filterMethod} onChange={e => setFilterMethod(e.target.value as ExpensePaymentMethod | '')}>
                <option value="">Todos los medios</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="otro">Otro</option>
              </Select>
            </div>
            <Button
              variant="primary"
              disabled={!editable}
              onClick={() => {
                setEditingExpense(null)
                setOpenExpense(true)
              }}
            >
              Nuevo gasto
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Total período</div>
            <div className="mt-1 text-lg font-semibold">${Math.round(totals.total).toLocaleString('es-CL')}</div>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Registros</div>
            <div className="mt-1 text-lg font-semibold">{expenses.length}</div>
          </div>
          <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-950">
            <div className="text-xs text-zinc-600 dark:text-zinc-400">Filtro</div>
            <div className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
              {filterStart || filterEnd ? `${filterStart || '…'} → ${filterEnd || '…'}` : 'Sin período'}
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Categoría</th>
                <th className="px-3 py-2">Proveedor</th>
                <th className="px-3 py-2">Medio</th>
                <th className="px-3 py-2">Monto</th>
                <th className="px-3 py-2">Adjunto</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(e => (
                <tr
                  key={e.id}
                  className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                >
                  <td className="px-3 py-2">{e.expense_date}</td>
                  <td className="px-3 py-2">{e.category?.name ?? '—'}</td>
                  <td className="px-3 py-2">{e.provider?.razon_social ?? '—'}</td>
                  <td className="px-3 py-2">{methodLabel(e.payment_method)}</td>
                  <td className="px-3 py-2 font-medium">${Math.round(Number(e.amount)).toLocaleString('es-CL')}</td>
                  <td className="px-3 py-2">
                    {e.attachment_url ? (
                      <a
                        className="text-blue-600 hover:underline dark:text-blue-400"
                        href={e.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Abrir
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingExpense(e)
                          setOpenExpense(true)
                        }}
                      >
                        Ver / editar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!editable}
                        onClick={async () => {
                          if (!editable) return
                          await apiRequest<{ success: true }>(`/api/expenses/${e.id}`, { method: 'DELETE' })
                          await loadExpenses()
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && expenses.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={7}>
                    Sin gastos.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={7}>
                    Cargando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Categorías</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Administra categorías de gasto.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-72 max-w-full">
              <Input placeholder="Buscar categoría…" value={categoryQuery} onChange={e => setCategoryQuery(e.target.value)} />
            </div>
            <Button
              variant="primary"
              disabled={!editable}
              onClick={() => {
                setEditingCategory(null)
                setOpenCategory(true)
              }}
            >
              Nueva categoría
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Activa</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(c => (
                <tr
                  key={c.id}
                  className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                >
                  <td className="px-3 py-2 font-medium">{c.name}</td>
                  <td className="px-3 py-2">{c.is_active ? 'Sí' : 'No'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingCategory(c)
                          setOpenCategory(true)
                        }}
                      >
                        Ver / editar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!editable}
                        onClick={async () => {
                          if (!editable) return
                          await apiRequest<{ success: true }>(`/api/expenses/categories/${c.id}`, { method: 'DELETE' })
                          if (filterCategoryId === c.id) setFilterCategoryId('')
                          await loadCategories()
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredCategories.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={3}>
                    Sin categorías.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CategoryModal
        open={openCategory}
        editable={editable}
        editing={editingCategory}
        onClose={() => setOpenCategory(false)}
        onSaved={async () => {
          await loadCategories()
        }}
      />

      <ExpenseModal
        open={openExpense}
        editable={editable}
        editing={editingExpense}
        categories={categories}
        providers={providers}
        onClose={() => setOpenExpense(false)}
        onSaved={async () => {
          await loadExpenses()
          await loadCategories()
        }}
      />
    </div>
  )
}
