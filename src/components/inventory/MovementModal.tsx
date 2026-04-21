import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiGetData, apiPostData } from '@/utils/api'
import type { InventoryMovement, InventoryMovementType, InventoryProductWithStock } from '@/types/domain'

const schema = z.object({
  product_id: z.string().min(1, 'Producto es requerido'),
  movement_type: z.enum(['ingreso', 'egreso', 'ajuste']),
  quantity: z.string().min(1, 'Cantidad es requerida'),
  unit_cost: z.string().optional(),
  movement_date: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function movementLabel(t: InventoryMovementType) {
  if (t === 'ingreso') return 'Ingreso'
  if (t === 'egreso') return 'Egreso'
  return 'Ajuste'
}

type Props = {
  open: boolean
  editable: boolean
  products: InventoryProductWithStock[]
  initialProductId: string
  onClose: () => void
  onChanged: () => Promise<void>
}

export function MovementModal({ open, editable, products, initialProductId, onClose, onChanged }: Props) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      product_id: '',
      movement_type: 'ingreso',
      quantity: '',
      unit_cost: '',
      movement_date: '',
      reference: '',
      notes: '',
    },
  })

  const productId = watch('product_id')
  const movementType = watch('movement_type') as InventoryMovementType

  const productName = useMemo(() => {
    const p = products.find(x => x.id === productId)
    return p ? `${p.sku} · ${p.name}` : ''
  }, [products, productId])

  const loadMovements = async (pid: string) => {
    if (!pid) return
    setLoading(true)
    try {
      const data = await apiGetData<InventoryMovement[]>(`/api/inventory/movements?product_id=${pid}`)
      setMovements(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const pid = initialProductId || ''
    reset({
      product_id: pid,
      movement_type: 'ingreso',
      quantity: '',
      unit_cost: '',
      movement_date: '',
      reference: '',
      notes: '',
    })
    void loadMovements(pid)
  }, [open, initialProductId, reset])

  useEffect(() => {
    if (!open) return
    void loadMovements(productId)
  }, [open, productId])

  return (
    <Modal
      open={open}
      title={productName ? `Movimiento · ${productName}` : 'Registrar movimiento'}
      description={editable ? 'Ingreso, egreso o ajuste. El stock se calcula automáticamente.' : 'Tu rol es solo lectura.'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cerrar</Button>
          <Button
            variant="primary"
            disabled={!editable || isSubmitting}
            onClick={handleSubmit(async values => {
              if (!editable) return
              const payload = {
                product_id: values.product_id,
                movement_type: values.movement_type,
                quantity: Number(values.quantity),
                unit_cost: values.unit_cost != null && values.unit_cost.length > 0 ? Number(values.unit_cost) : undefined,
                movement_date: values.movement_date || undefined,
                reference: values.reference || undefined,
                notes: values.notes || undefined,
              }
              await apiPostData<InventoryMovement>('/api/inventory/movements', payload)
              await loadMovements(values.product_id)
              await onChanged()
              reset({
                product_id: values.product_id,
                movement_type: values.movement_type,
                quantity: '',
                unit_cost: '',
                movement_date: values.movement_date,
                reference: '',
                notes: '',
              })
            })}
          >
            Registrar
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Producto</label>
          <div className="mt-1">
            <Select disabled={!editable} {...register('product_id')} error={errors.product_id?.message}>
              <option value="">Selecciona…</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.sku} · {p.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Tipo</label>
          <div className="mt-1">
            <Select disabled={!editable} {...register('movement_type')} error={errors.movement_type?.message}>
              <option value="ingreso">Ingreso</option>
              <option value="egreso">Egreso</option>
              <option value="ajuste">Ajuste</option>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Cantidad</label>
          <div className="mt-1">
            <Input type="number" disabled={!editable} {...register('quantity')} error={errors.quantity?.message} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Costo unitario</label>
          <div className="mt-1">
            <Input type="number" disabled={!editable} {...register('unit_cost')} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Fecha</label>
          <div className="mt-1">
            <Input type="date" disabled={!editable} {...register('movement_date')} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Referencia</label>
          <div className="mt-1">
            <Input disabled={!editable} {...register('reference')} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Notas</label>
          <div className="mt-1">
            <Input disabled={!editable} {...register('notes')} />
          </div>
        </div>
      </form>

      <div className="mt-5">
        <div className="text-sm font-semibold">Últimos movimientos</div>
        <div className="mt-2 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Cantidad</th>
                <th className="px-3 py-2">Ref.</th>
              </tr>
            </thead>
            <tbody>
              {movements.map(m => (
                <tr key={m.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-3 py-2">{m.movement_date}</td>
                  <td className="px-3 py-2">{movementLabel(m.movement_type)}</td>
                  <td className="px-3 py-2">{Number(m.quantity)}</td>
                  <td className="px-3 py-2">{m.reference || '—'}</td>
                </tr>
              ))}
              {!loading && movements.length === 0 && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={4}>
                    Sin movimientos.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={4}>
                    Cargando…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {movementType === 'ajuste' && (
          <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            En ajustes puedes usar cantidad positiva o negativa.
          </div>
        )}
      </div>
    </Modal>
  )
}

