import { useEffect, useMemo, useState } from 'react'
import { apiGetData, apiRequest } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'
import type { Vehicle, VehicleBrand, VehicleModel } from '@/types/domain'
import { BrandModal } from '@/components/vehicles/BrandModal'
import { ModelModal } from '@/components/vehicles/ModelModal'
import { BrandsCard } from '@/components/vehicles/BrandsCard'
import { ModelsCard } from '@/components/vehicles/ModelsCard'
import { PlateSearchCard } from '@/components/vehicles/PlateSearchCard'

function canEdit(role: string | undefined) {
  return role === 'admin' || role === 'operaciones'
}

export default function Vehicles() {
  const role = useAuthStore(s => s.user?.role)
  const editable = canEdit(role)

  const [brands, setBrands] = useState<VehicleBrand[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [loadingModels, setLoadingModels] = useState(true)

  const [brandQuery, setBrandQuery] = useState('')
  const [modelQuery, setModelQuery] = useState('')
  const [brandFilterId, setBrandFilterId] = useState('')

  const [openBrand, setOpenBrand] = useState(false)
  const [editingBrand, setEditingBrand] = useState<VehicleBrand | null>(null)

  const [openModel, setOpenModel] = useState(false)
  const [editingModel, setEditingModel] = useState<VehicleModel | null>(null)

  const [patente, setPatente] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [results, setResults] = useState<Vehicle[]>([])

  const loadBrands = async () => {
    setLoadingBrands(true)
    try {
      const data = await apiGetData<VehicleBrand[]>('/api/vehicles/brands')
      setBrands(data)
    } finally {
      setLoadingBrands(false)
    }
  }

  const loadModels = async (brandId?: string) => {
    setLoadingModels(true)
    try {
      const qs = brandId ? `?brand_id=${encodeURIComponent(brandId)}` : ''
      const data = await apiGetData<VehicleModel[]>(`/api/vehicles/models${qs}`)
      setModels(data)
    } finally {
      setLoadingModels(false)
    }
  }

  useEffect(() => {
    loadBrands()
    loadModels()
  }, [])

  useEffect(() => {
    loadModels(brandFilterId || undefined)
  }, [brandFilterId])

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase()
    if (!q) return brands
    return brands.filter(b => b.name.toLowerCase().includes(q))
  }, [brands, brandQuery])

  const filteredModels = useMemo(() => {
    const q = modelQuery.trim().toLowerCase()
    if (!q) return models
    return models.filter(m => {
      const hay = `${m.name} ${m.brand_name ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [models, modelQuery])

  return (
    <div className="space-y-4">
      <BrandsCard
        brands={filteredBrands}
        loading={loadingBrands}
        query={brandQuery}
        setQuery={setBrandQuery}
        editable={editable}
        onNew={() => {
          setEditingBrand(null)
          setOpenBrand(true)
        }}
        onEdit={b => {
          setEditingBrand(b)
          setOpenBrand(true)
        }}
        onDelete={async b => {
          if (!editable) return
          await apiRequest<{ success: true }>(`/api/vehicles/brands/${b.id}`, { method: 'DELETE' })
          if (brandFilterId === b.id) setBrandFilterId('')
          await loadBrands()
          await loadModels(brandFilterId || undefined)
        }}
      />

      <ModelsCard
        models={filteredModels}
        brands={brands}
        loading={loadingModels}
        query={modelQuery}
        setQuery={setModelQuery}
        brandFilterId={brandFilterId}
        setBrandFilterId={setBrandFilterId}
        editable={editable}
        onNew={() => {
          setEditingModel(null)
          setOpenModel(true)
        }}
        onEdit={m => {
          setEditingModel(m)
          setOpenModel(true)
        }}
        onDelete={async m => {
          if (!editable) return
          await apiRequest<{ success: true }>(`/api/vehicles/models/${m.id}`, { method: 'DELETE' })
          await loadModels(brandFilterId || undefined)
        }}
      />

      <PlateSearchCard
        patente={patente}
        setPatente={setPatente}
        loading={searchLoading}
        results={results}
        onSearch={async () => {
          const term = patente.trim()
          if (!term) return
          setSearchLoading(true)
          try {
            const data = await apiGetData<Vehicle[]>(`/api/vehicles/search?patente=${encodeURIComponent(term)}`)
            setResults(data)
          } finally {
            setSearchLoading(false)
          }
        }}
      />

      <BrandModal
        open={openBrand}
        editable={editable}
        editing={editingBrand}
        onClose={() => setOpenBrand(false)}
        onSaved={async () => {
          await loadBrands()
        }}
      />

      <ModelModal
        open={openModel}
        editable={editable}
        brands={brands}
        editing={editingModel}
        defaultBrandId={brandFilterId || undefined}
        onClose={() => setOpenModel(false)}
        onSaved={async () => {
          await loadModels(brandFilterId || undefined)
        }}
      />
    </div>
  )
}
