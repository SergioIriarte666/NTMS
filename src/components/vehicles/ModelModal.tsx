import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { apiPatchData, apiPostData } from '@/utils/api'
import type { VehicleBrand, VehicleModel } from '@/types/domain'

const schema = z.object({
  brand_id: z.string().min(1, 'Marca es requerida'),
  name: z.string().min(1, 'Nombre es requerido'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  editable: boolean
  brands: VehicleBrand[]
  editing: VehicleModel | null
  defaultBrandId?: string
  onClose: () => void
  onSaved: () => Promise<void>
}

export function ModelModal({
  open,
  editable,
  brands,
  editing,
  defaultBrandId,
  onClose,
  onSaved,
}: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { brand_id: '', name: '' },
  })

  useEffect(() => {
    if (!open) return
    reset({
      brand_id: editing?.brand_id ?? defaultBrandId ?? '',
      name: editing?.name ?? '',
    })
  }, [open, editing, defaultBrandId, reset])

  return (
    <Modal
      open={open}
      title={editing ? 'Editar modelo' : 'Nuevo modelo'}
      description={editable ? 'Asocia modelos a una marca.' : 'Tu rol es solo lectura.'}
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
                brand_id: values.brand_id,
                name: values.name.trim(),
              }
              if (editing) {
                await apiPatchData<VehicleModel>(`/api/vehicles/models/${editing.id}`, payload)
              } else {
                await apiPostData<VehicleModel>('/api/vehicles/models', payload)
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
      <form className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Marca</label>
          <div className="mt-1">
            <Select disabled={!editable} {...register('brand_id')} error={errors.brand_id?.message}>
              <option value="">Selecciona…</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Modelo</label>
          <div className="mt-1">
            <Input disabled={!editable} {...register('name')} error={errors.name?.message} />
          </div>
        </div>
      </form>
    </Modal>
  )
}

