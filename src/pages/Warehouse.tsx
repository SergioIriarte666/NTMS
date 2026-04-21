import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiGetData, apiRequest } from '@/utils/api'
import type { InventoryProductWithStock } from '@/types/domain'
import { useAuthStore } from '@/stores/authStore'
import { ProductModal } from '@/components/inventory/ProductModal'
import { MovementModal } from '@/components/inventory/MovementModal'

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'operaciones'
}

export default function Warehouse() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)

  const [products, setProducts] = useState<InventoryProductWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const [openProduct, setOpenProduct] = useState(false)
  const [editingProduct, setEditingProduct] = useState<InventoryProductWithStock | null>(null)

  const [openMove, setOpenMove] = useState(false)
  const [initialMoveProductId, setInitialMoveProductId] = useState('')

  const loadProducts = async () => {
    setLoading(true)
    try {
      const data = await apiGetData<InventoryProductWithStock[]>('/api/inventory/products')
      setProducts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(p => {
      const hay = [p.sku, p.name, p.unit, p.description].filter(Boolean).join(' ').toLowerCase()
      return hay.includes(q)
    })
  }, [products, query])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Bodega</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Productos, movimientos y stock.</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-72 max-w-full">
              <Input placeholder="Buscar por SKU o nombre…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <Button
              variant="primary"
              disabled={!editable}
              onClick={() => {
                setEditingProduct(null)
                setOpenProduct(true)
              }}
            >
              Nuevo producto
            </Button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">SKU</th>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Unidad</th>
                <th className="px-3 py-2">Stock</th>
                <th className="px-3 py-2">Mínimo</th>
                <th className="px-3 py-2">Activo</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr
                  key={p.id}
                  className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                >
                  <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{p.unit || '—'}</td>
                  <td className="px-3 py-2">{Number(p.stock ?? 0)}</td>
                  <td className="px-3 py-2">{p.min_stock != null ? Number(p.min_stock) : '—'}</td>
                  <td className="px-3 py-2">{p.is_active ? 'Sí' : 'No'}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        variant="secondary"
                        disabled={!editable}
                        onClick={() => {
                          if (!editable) return
                          setInitialMoveProductId(p.id)
                          setOpenMove(true)
                        }}
                      >
                        Movimiento
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setEditingProduct(p)
                          setOpenProduct(true)
                        }}
                      >
                        Ver / editar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!editable}
                        onClick={async () => {
                          if (!editable) return
                          await apiRequest<{ success: true }>(`/api/inventory/products/${p.id}`, { method: 'DELETE' })
                          await loadProducts()
                        }}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={7}>
                    Sin productos.
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

      <ProductModal
        open={openProduct}
        editable={editable}
        editingProduct={editingProduct}
        onClose={() => setOpenProduct(false)}
        onSaved={loadProducts}
      />

      <MovementModal
        open={openMove}
        editable={editable}
        products={products}
        initialProductId={initialMoveProductId}
        onClose={() => setOpenMove(false)}
        onChanged={loadProducts}
      />
    </div>
  )
}

