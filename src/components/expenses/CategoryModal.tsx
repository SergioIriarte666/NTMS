import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiPatchData, apiPostData } from '@/utils/api'
import type { ExpenseCategory } from '@/types/domain'

const schema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  is_active: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  editable: boolean
  editing: ExpenseCategory | null
  onClose: () => void
  onSaved: () => Promise<void>
}

export function CategoryModal({ open, editable, editing, onClose, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', is_active: true },
  })

  useEffect(() => {
    if (!open) return
    reset({ name: editing?.name ?? '', is_active: editing?.is_active ?? true })
  }, [open, editing, reset])

  return (
    <Modal
      open={open}
      title={editing ? 'Editar categoría' : 'Nueva categoría'}
      description={editable ? 'Clasifica tus gastos.' : 'Tu rol es solo lectura.'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={!editable || isSubmitting}
            onClick={handleSubmit(async values => {
              if (!editable) return
              const payload = { name: values.name.trim(), is_active: values.is_active ?? true }
              if (editing) {
                await apiPatchData<ExpenseCategory>(`/api/expenses/categories/${editing.id}`, payload)
              } else {
                await apiPostData<ExpenseCategory>('/api/expenses/categories', payload)
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
      <form className="space-y-3">
        <div>
          <label className="text-sm font-medium">Nombre</label>
          <div className="mt-1">
            <Input disabled={!editable} {...register('name')} error={errors.name?.message} />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!editable}
              className="h-4 w-4 rounded border border-black/20 bg-white dark:border-white/20 dark:bg-zinc-950"
              {...register('is_active')}
            />
            <span>Categoría activa</span>
          </label>
        </div>
      </form>
    </Modal>
  )
}

