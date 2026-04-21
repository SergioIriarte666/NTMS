import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { apiPatchData, apiPostData } from '@/utils/api'
import type { VehicleBrand } from '@/types/domain'

const schema = z.object({
  name: z.string().min(1, 'Nombre es requerido'),
})

type FormValues = z.infer<typeof schema>

type Props = {
  open: boolean
  editable: boolean
  editing: VehicleBrand | null
  onClose: () => void
  onSaved: () => Promise<void>
}

export function BrandModal({ open, editable, editing, onClose, onSaved }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  useEffect(() => {
    if (!open) return
    reset({ name: editing?.name ?? '' })
  }, [open, editing, reset])

  return (
    <Modal
      open={open}
      title={editing ? 'Editar marca' : 'Nueva marca'}
      description={editable ? 'Define marcas para tus vehículos.' : 'Tu rol es solo lectura.'}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            disabled={!editable || isSubmitting}
            onClick={handleSubmit(async values => {
              if (!editable) return
              const payload = { name: values.name.trim() }
              if (editing) {
                await apiPatchData<VehicleBrand>(`/api/vehicles/brands/${editing.id}`, payload)
              } else {
                await apiPostData<VehicleBrand>('/api/vehicles/brands', payload)
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
      </form>
    </Modal>
  )
}

