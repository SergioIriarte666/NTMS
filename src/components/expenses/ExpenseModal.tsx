import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiPatchData, apiPostData } from '@/utils/api'
import type { ExpenseCategory, ExpensePaymentMethod, ExpenseWithDetails, Provider } from '@/types/domain'

const schema = z.object({
  category_id: z.string().min(1, 'Categoría es requerida'),
  expense_date: z.string().min(1, 'Fecha es requerida'),
  amount: z.string().min(1, 'Monto es requerido'),
  payment_method: z.enum(['efectivo', 'transferencia', 'tarjeta', 'otro']),
  provider_id: z.string().optional(),
  attachment_url: z.string().url('URL inválida').optional().or(z.literal('')),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  editable: boolean
  editing: ExpenseWithDetails | null
  categories: ExpenseCategory[]
  providers: Provider[]
  onClose: () => void
  onSaved: () => Promise<void>
}

export function ExpenseModal({ open, editable, editing, categories, providers, onClose, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category_id: '',
      expense_date: new Date().toISOString().slice(0, 10),
      amount: '',
      payment_method: 'tarjeta',
      provider_id: '',
      attachment_url: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (!open) return
    if (editing) {
      reset({
        category_id: editing.category_id,
        expense_date: editing.expense_date,
        amount: String(editing.amount),
        payment_method: editing.payment_method,
        provider_id: editing.provider_id ?? '',
        attachment_url: editing.attachment_url ?? '',
        notes: editing.notes ?? '',
      })
      return
    }
    reset({
      category_id: categories.find(c => c.is_active)?.id ?? '',
      expense_date: new Date().toISOString().slice(0, 10),
      amount: '',
      payment_method: 'tarjeta',
      provider_id: '',
      attachment_url: '',
      notes: '',
    })
  }, [open, editing, reset, categories])

  return (
    <Modal
      open={open}
      title={editing ? 'Editar gasto' : 'Nuevo gasto'}
      description={editable ? 'Registra gastos con proveedor opcional y adjunto URL.' : 'Tu rol es solo lectura.'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={!editable || isSubmitting}
            onClick={handleSubmit(async values => {
              if (!editable) return
              const payload: {
                category_id: string
                expense_date: string
                amount: number
                payment_method: ExpensePaymentMethod
                provider_id?: string
                attachment_url?: string
                notes?: string
              } = {
                category_id: values.category_id,
                expense_date: values.expense_date,
                amount: Number(values.amount),
                payment_method: values.payment_method,
              }

              if (values.provider_id) payload.provider_id = values.provider_id
              if (values.attachment_url) payload.attachment_url = values.attachment_url
              if (values.notes) payload.notes = values.notes

              if (editing) {
                await apiPatchData<ExpenseWithDetails>(`/api/expenses/${editing.id}`, payload)
              } else {
                await apiPostData<ExpenseWithDetails>('/api/expenses', payload)
              }
              onClose()
              await onSaved()
            })}
          >
            Guardar
          </Button>
        </>
      }
    >
      <form className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Categoría</label>
          <div className="mt-1">
            <Select disabled={!editable} {...register('category_id')} error={errors.category_id?.message}>
              <option value="">Selecciona…</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.is_active ? '' : ' (inactiva)'}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Fecha</label>
          <div className="mt-1">
            <Input type="date" disabled={!editable} {...register('expense_date')} error={errors.expense_date?.message} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Monto</label>
          <div className="mt-1">
            <Input type="number" disabled={!editable} {...register('amount')} error={errors.amount?.message} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Medio</label>
          <div className="mt-1">
            <Select disabled={!editable} {...register('payment_method')} error={errors.payment_method?.message}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </Select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Proveedor (opcional)</label>
          <div className="mt-1">
            <Select disabled={!editable} {...register('provider_id')}>
              <option value="">Sin proveedor</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.razon_social}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Adjunto URL (opcional)</label>
          <div className="mt-1">
            <Input disabled={!editable} {...register('attachment_url')} error={errors.attachment_url?.message} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Notas</label>
          <div className="mt-1">
            <Input disabled={!editable} {...register('notes')} />
          </div>
        </div>
      </form>
    </Modal>
  )
}

