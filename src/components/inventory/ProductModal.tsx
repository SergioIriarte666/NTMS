import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiPatchData, apiPostData } from '@/utils/api'
import type { InventoryProductWithStock } from '@/types/domain'

const schema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
  description: z.string().optional(),
  unit: z.string().optional(),
  min_stock: z.string().optional(),
  is_active: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  editable: boolean
  editingProduct: InventoryProductWithStock | null
  onClose: () => void
  onSaved: () => Promise<void>
}

export function ProductModal({ open, editable, editingProduct, onClose, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', unit: '', min_stock: '', is_active: true },
  })

  useEffect(() => {
    if (!open) return
    if (editingProduct) {
      reset({
        name: editingProduct.name,
        description: editingProduct.description || '',
        unit: editingProduct.unit || '',
        min_stock: editingProduct.min_stock != null ? String(editingProduct.min_stock) : '',
        is_active: editingProduct.is_active,
      })
      return
    }
    reset({ name: '', description: '', unit: '', min_stock: '', is_active: true })
  }, [open, editingProduct, reset])

  return (
    <Modal
      open={open}
      title={editingProduct ? 'Editar producto' : 'Nuevo producto'}
      description={editable ? 'SKU se genera automáticamente.' : 'Tu rol es solo lectura.'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={!editable || isSubmitting}
            onClick={handleSubmit(async values => {
              if (!editable) return
              const payload = {
                name: values.name,
                description: values.description || undefined,
                unit: values.unit || undefined,
                min_stock: values.min_stock != null && values.min_stock.length > 0 ? Number(values.min_stock) : undefined,
                is_active: values.is_active ?? true,
              }
              if (editingProduct) {
                await apiPatchData<InventoryProductWithStock>(`/api/inventory/products/${editingProduct.id}`, payload)
              } else {
                await apiPostData<InventoryProductWithStock>('/api/inventory/products', payload)
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
        {editingProduct && (
          <div className="sm:col-span-2">
            <label className="text-sm font-medium">SKU</label>
            <div className="mt-1">
              <Input disabled value={editingProduct.sku} />
            </div>
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Nombre</label>
          <div className="mt-1">
            <Input disabled={!editable} {...register('name')} error={errors.name?.message} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Descripción</label>
          <div className="mt-1">
            <Input disabled={!editable} {...register('description')} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Unidad</label>
          <div className="mt-1">
            <Input disabled={!editable} {...register('unit')} />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Stock mínimo</label>
          <div className="mt-1">
            <Input type="number" disabled={!editable} {...register('min_stock')} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              disabled={!editable}
              className="h-4 w-4 rounded border border-black/20 bg-white dark:border-white/20 dark:bg-zinc-950"
              {...register('is_active')}
            />
            <span>Producto activo</span>
          </label>
        </div>
      </form>
    </Modal>
  )
}

