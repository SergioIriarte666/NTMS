import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import type { VehicleBrand, VehicleModel } from '@/types/domain'

type Props = {
  models: VehicleModel[]
  brands: VehicleBrand[]
  loading: boolean
  query: string
  setQuery: (v: string) => void
  brandFilterId: string
  setBrandFilterId: (v: string) => void
  editable: boolean
  onNew: () => void
  onEdit: (m: VehicleModel) => void
  onDelete: (m: VehicleModel) => Promise<void>
}

export function ModelsCard({
  models,
  brands,
  loading,
  query,
  setQuery,
  brandFilterId,
  setBrandFilterId,
  editable,
  onNew,
  onEdit,
  onDelete,
}: Props) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold">Modelos</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Catálogo de modelos por marca.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-60 max-w-full">
            <Select value={brandFilterId} onChange={e => setBrandFilterId(e.target.value)}>
              <option value="">Todas las marcas</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-72 max-w-full">
            <Input placeholder="Buscar modelo…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <Button variant="primary" disabled={!editable} onClick={onNew}>
            Nuevo modelo
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2">Modelo</th>
              <th className="px-3 py-2">Marca</th>
              <th className="px-3 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {models.map(m => (
              <tr
                key={m.id}
                className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
              >
                <td className="px-3 py-2 font-medium">{m.name}</td>
                <td className="px-3 py-2">{m.brand_name ?? '—'}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Button variant="ghost" onClick={() => onEdit(m)}>
                      Ver / editar
                    </Button>
                    <Button variant="ghost" disabled={!editable} onClick={() => onDelete(m)}>
                      Eliminar
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && models.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={3}>
                  Sin modelos.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={3}>
                  Cargando…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

