import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { apiGetData, apiPostData } from '@/utils/api'
import type { Client, Invoice, Payment, Service } from '@/types/domain'
import { useAuthStore } from '@/stores/authStore'

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'facturacion'
}

function invoiceBadge(status: Invoice['status']) {
  if (status === 'pagada') return <Badge variant="success">Pagada</Badge>
  if (status === 'emitida') return <Badge>Emitida</Badge>
  if (status === 'vencida') return <Badge variant="warning">Vencida</Badge>
  if (status === 'anulada') return <Badge variant="danger">Anulada</Badge>
  return <Badge>Borrador</Badge>
}

const invoiceSchema = z.object({
  service_id: z.string().min(1, 'Servicio requerido'),
  invoice_number: z.string().optional(),
  due_date: z.string().optional(),
})

type InvoiceForm = z.infer<typeof invoiceSchema>

const paymentSchema = z.object({
  invoice_id: z.string().min(1, 'Factura requerida'),
  paid_date: z.string().min(10, 'Fecha requerida'),
  method: z.string().optional(),
  amount: z.string().min(1, 'Monto requerido'),
  reference: z.string().optional(),
})

type PaymentForm = z.infer<typeof paymentSchema>

export default function Billing() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)
  const [tab, setTab] = useState<'unbilled' | 'invoices' | 'payments'>('unbilled')

  const [clients, setClients] = useState<Client[]>([])
  const [unbilled, setUnbilled] = useState<Service[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const [openInvoice, setOpenInvoice] = useState(false)
  const [openPayment, setOpenPayment] = useState(false)

  const {
    register: registerInvoice,
    handleSubmit: handleInvoiceSubmit,
    reset: resetInvoice,
    formState: { errors: invoiceErrors, isSubmitting: isInvoiceSubmitting },
  } = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { service_id: '', invoice_number: '', due_date: '' },
  })

  const {
    register: registerPayment,
    handleSubmit: handlePaymentSubmit,
    reset: resetPayment,
    formState: { errors: paymentErrors, isSubmitting: isPaymentSubmitting },
  } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      invoice_id: '',
      paid_date: new Date().toISOString().slice(0, 10),
      method: 'Transferencia',
      amount: '',
      reference: '',
    },
  })

  const load = async () => {
    setLoading(true)
    try {
      const [c, u, i, p] = await Promise.all([
        apiGetData<Client[]>('/api/clients'),
        apiGetData<Service[]>('/api/services/unbilled/completed'),
        apiGetData<Invoice[]>('/api/invoices'),
        apiGetData<Payment[]>('/api/payments'),
      ])
      setClients(c)
      setUnbilled(u)
      setInvoices(i)
      setPayments(p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients])
  const invoiceMap = useMemo(() => new Map(invoices.map(i => [i.id, i])), [invoices])
  const unbilledById = useMemo(() => new Map(unbilled.map(s => [s.id, s])), [unbilled])

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-base font-semibold">Facturación</div>
            <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Emisión de facturas y registro de pagos.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant={tab === 'unbilled' ? 'primary' : 'secondary'} onClick={() => setTab('unbilled')}>
              Por facturar
            </Button>
            <Button variant={tab === 'invoices' ? 'primary' : 'secondary'} onClick={() => setTab('invoices')}>
              Facturas
            </Button>
            <Button variant={tab === 'payments' ? 'primary' : 'secondary'} onClick={() => setTab('payments')}>
              Pagos
            </Button>
            {tab === 'unbilled' && (
              <Button
                variant="primary"
                disabled={!editable || unbilled.length === 0}
                onClick={() => {
                  resetInvoice({
                    service_id: unbilled[0]?.id ?? '',
                    invoice_number: '',
                    due_date: '',
                  })
                  setOpenInvoice(true)
                }}
              >
                Generar factura
              </Button>
            )}
            {tab === 'payments' && (
              <Button
                variant="primary"
                disabled={!editable || invoices.length === 0}
                onClick={() => {
                  resetPayment({
                    invoice_id: invoices[0]?.id ?? '',
                    paid_date: new Date().toISOString().slice(0, 10),
                    method: 'Transferencia',
                    amount: '',
                    reference: '',
                  })
                  setOpenPayment(true)
                }}
              >
                Registrar pago
              </Button>
            )}
          </div>
        </div>

        {tab === 'unbilled' && (
          <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Servicio</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {unbilled.map(s => (
                  <tr
                    key={s.id}
                    className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                  >
                    <td className="px-3 py-2 font-medium">{s.service_type || 'Servicio'}</td>
                    <td className="px-3 py-2">{clientMap.get(s.client_id)?.razon_social ?? '—'}</td>
                    <td className="px-3 py-2">{s.service_date}</td>
                    <td className="px-3 py-2 text-right">
                      {s.agreed_amount ? `$${s.agreed_amount.toLocaleString('es-CL')}` : '—'}
                    </td>
                  </tr>
                ))}
                {!loading && unbilled.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={4}>
                      No hay servicios completados pendientes de facturar.
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
        )}

        {tab === 'invoices' && (
          <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Nº</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Emisión</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(i => (
                  <tr
                    key={i.id}
                    className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                  >
                    <td className="px-3 py-2 font-medium">{i.invoice_number || '—'}</td>
                    <td className="px-3 py-2">{clientMap.get(i.client_id)?.razon_social ?? '—'}</td>
                    <td className="px-3 py-2">{i.issue_date}</td>
                    <td className="px-3 py-2">{invoiceBadge(i.status)}</td>
                    <td className="px-3 py-2 text-right">${i.total.toLocaleString('es-CL')}</td>
                  </tr>
                ))}
                {!loading && invoices.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={5}>
                      Sin facturas.
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={5}>
                      Cargando…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payments' && (
          <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-black/5 text-left text-xs text-zinc-600 dark:bg-white/5 dark:text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Factura</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Método</th>
                  <th className="px-3 py-2 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr
                    key={p.id}
                    className="border-t border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-zinc-950 dark:hover:bg-white/5"
                  >
                    <td className="px-3 py-2 font-medium">{invoiceMap.get(p.invoice_id)?.invoice_number || '—'}</td>
                    <td className="px-3 py-2">{p.paid_date}</td>
                    <td className="px-3 py-2">{p.method || '—'}</td>
                    <td className="px-3 py-2 text-right">${p.amount.toLocaleString('es-CL')}</td>
                  </tr>
                ))}
                {!loading && payments.length === 0 && (
                  <tr>
                    <td className="px-3 py-6 text-center text-sm text-zinc-600 dark:text-zinc-400" colSpan={4}>
                      Sin pagos.
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
        )}
      </Card>

      <Modal
        open={openInvoice}
        title="Generar factura"
        description={editable ? 'Crea una factura desde un servicio completado.' : 'Tu rol es solo lectura.'}
        onClose={() => setOpenInvoice(false)}
        footer={
          <>
            <Button onClick={() => setOpenInvoice(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!editable || isInvoiceSubmitting}
              onClick={handleInvoiceSubmit(async values => {
                if (!editable) return
                const service = unbilledById.get(values.service_id)
                if (!service) return
                await apiPostData<Invoice>('/api/invoices', {
                  client_id: service.client_id,
                  service_id: service.id,
                  invoice_number: values.invoice_number || undefined,
                  due_date: values.due_date || undefined,
                  status: 'emitida',
                })
                setOpenInvoice(false)
                await load()
              })}
            >
              Crear
            </Button>
          </>
        }
      >
        <form className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Servicio</label>
            <div className="mt-1">
              <Select disabled={!editable} {...registerInvoice('service_id')} error={invoiceErrors.service_id?.message}>
                <option value="">Selecciona…</option>
                {unbilled.map(s => (
                  <option key={s.id} value={s.id}>
                    {clientMap.get(s.client_id)?.razon_social ?? 'Cliente'} · {s.service_date} · ${
                      s.agreed_amount?.toLocaleString('es-CL') ?? '0'
                    }
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Nº factura</label>
              <div className="mt-1">
                <Input disabled={!editable} {...registerInvoice('invoice_number')} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Vencimiento</label>
              <div className="mt-1">
                <Input type="date" disabled={!editable} {...registerInvoice('due_date')} />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      <Modal
        open={openPayment}
        title="Registrar pago"
        description={editable ? 'Registra un pago y actualiza el estado de la factura.' : 'Tu rol es solo lectura.'}
        onClose={() => setOpenPayment(false)}
        footer={
          <>
            <Button onClick={() => setOpenPayment(false)}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!editable || isPaymentSubmitting}
              onClick={handlePaymentSubmit(async values => {
                if (!editable) return
                await apiPostData<Payment>('/api/payments', {
                  invoice_id: values.invoice_id,
                  paid_date: values.paid_date,
                  method: values.method || undefined,
                  amount: Number(values.amount),
                  reference: values.reference || undefined,
                })
                setOpenPayment(false)
                await load()
              })}
            >
              Registrar
            </Button>
          </>
        }
      >
        <form className="grid gap-4">
          <div>
            <label className="text-sm font-medium">Factura</label>
            <div className="mt-1">
              <Select disabled={!editable} {...registerPayment('invoice_id')} error={paymentErrors.invoice_id?.message}>
                <option value="">Selecciona…</option>
                {invoices.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.invoice_number || '—'} · {clientMap.get(i.client_id)?.razon_social ?? 'Cliente'} · ${
                      i.total.toLocaleString('es-CL')
                    }
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Fecha</label>
              <div className="mt-1">
                <Input type="date" disabled={!editable} {...registerPayment('paid_date')} error={paymentErrors.paid_date?.message} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Método</label>
              <div className="mt-1">
                <Input disabled={!editable} {...registerPayment('method')} />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Monto</label>
              <div className="mt-1">
                <Input disabled={!editable} {...registerPayment('amount')} error={paymentErrors.amount?.message} placeholder="Ej: 107100" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Referencia</label>
              <div className="mt-1">
                <Input disabled={!editable} {...registerPayment('reference')} />
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}

