import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Vehicle } from '@/types/domain'

type Props = {
  patente: string
  setPatente: (v: string) => void
  loading: boolean
  results: Vehicle[]
  onSearch: () => Promise<void>
}

export function PlateSearchCard({ patente, setPatente, loading, results, onSearch }: Props) {
  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-base font-semibold">Consulta de patente</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Busca vehículos registrados en Flota.</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-72 max-w-full">
            <Input placeholder="Ej: ABCD12" value={patente} onChange={e => setPatente(e.target.value)} />
          </div>
          <Button variant="primary" disabled={loading} onClick={onSearch}>
            Buscar
          </Button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
            <tr>
              <th className="px-3 py-2">Patente</th>
              <th className="px-3 py-2">Marca / Modelo</th>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Estado</th>
              <th className="px-3 py-2">Activa</th>
            </tr>
          </thead>
          <tbody>
            {results.map(v => (
              <tr key={v.id} className="border-t border-black/10 bg-white dark:border-white/10 dark:bg-zinc-950">
                <td className="px-3 py-2 font-mono text-xs">{v.patente}</td>
                <td className="px-3 py-2">{[v.marca, v.modelo].filter(Boolean).join(' ') || '—'}</td>
                <td className="px-3 py-2">{v.tipo || '—'}</td>
                <td className="px-3 py-2">{v.status}</td>
                <td className="px-3 py-2">{v.is_active ? 'Sí' : 'No'}</td>
              </tr>
            ))}
            {!loading && results.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={5}>
                  Sin resultados.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={5}>
                  Buscando…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

