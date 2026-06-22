import request from './request'

export interface BrandData {
  id?: number
  name: string
  description?: string
  models?: Array<{ id: number; name: string; color?: string; memory?: string; sale_price?: number; cost_price?: number }>
  _count?: { models: number }
}

export interface ModelData {
  id?: number
  brandId: number
  brandName?: string
  name: string
  color?: string
  memory?: string
  salePrice?: number
  costPrice?: number
  isSubsidy?: boolean
  description?: string
}

export async function getBrands(): Promise<BrandData[]> {
  const res: any = await request.get('/products/brands')
  return res.data || []
}

export async function createBrand(data: BrandData): Promise<BrandData> {
  const res: any = await request.post('/products/brands', data)
  return res.data
}

export async function updateBrand(id: number, data: BrandData): Promise<BrandData> {
  const res: any = await request.put(`/products/brands/${id}`, data)
  return res.data
}

export async function deleteBrand(id: number): Promise<void> {
  await request.delete(`/products/brands/${id}`)
}

export async function getModels(brandId?: number): Promise<ModelData[]> {
  const params = brandId ? { brand_id: brandId } : {}
  const res: any = await request.get('/products/models', { params })
  return (res.data || []).map((item: any) => ({
    id: item.id,
    brandId: item.brand_id,
    brandName: item.brand?.name,
    name: item.name,
    color: item.color,
    memory: item.memory,
    salePrice: item.sale_price,
    costPrice: item.cost_price,
    isSubsidy: item.is_subsidy ?? false,
    description: item.description,
  }))
}

export async function createModel(data: ModelData): Promise<ModelData> {
  const res: any = await request.post('/products/models', {
    brand_id: data.brandId,
    name: data.name,
    color: data.color,
    memory: data.memory,
    sale_price: data.salePrice,
    cost_price: data.costPrice,
    is_subsidy: data.isSubsidy ?? false,
    description: data.description,
  })
  return res.data
}

export async function updateModel(id: number, data: ModelData): Promise<ModelData> {
  const res: any = await request.put(`/products/models/${id}`, {
    brand_id: data.brandId,
    name: data.name,
    color: data.color,
    memory: data.memory,
    sale_price: data.salePrice,
    cost_price: data.costPrice,
    is_subsidy: data.isSubsidy ?? false,
    description: data.description,
  })
  return res.data
}

export async function deleteModel(id: number): Promise<void> {
  await request.delete(`/products/models/${id}`)
}

export async function searchModels(keyword: string): Promise<ModelData[]> {
  const res: any = await request.get('/products/models/search', { params: { keyword } })
  return (res.data || []).map((item: any) => ({
    id: item.id,
    brandId: item.brandId,
    brandName: item.brandName,
    name: item.modelName,
    modelName: item.modelName,
    color: item.color,
    memory: item.memory,
    salePrice: item.salePrice,
    costPrice: item.costPrice,
  }))
}

export async function scanBarcode(barcode: string): Promise<ModelData> {
  const res: any = await request.get('/products/scan-barcode', { params: { barcode } })
  return res.data
}

export async function importBrandModels(
  file: File,
  conflictMode: 'skip' | 'overwrite' = 'skip',
): Promise<{
  success: number
  skipped: number
  overwritten: number
  errors: Array<{ row: number; message: string }>
}> {
  const formData = new FormData()
  formData.append('file', file)
  const res: any = await request.post(`/products/import?conflictMode=${conflictMode}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data || { success: 0, skipped: 0, overwritten: 0, errors: [] }
}
