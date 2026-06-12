import request from './request'

export interface BrandData {
  id?: number
  name: string
  description?: string
  models?: Array<{ id: number; name: string }>
  _count?: { models: number }
}

export interface ModelData {
  id?: number
  brandId: number
  brandName?: string
  name: string
  color?: string
  ram?: string
  rom?: string
  osType?: string
  launchYear?: number
  networkType?: string
  screenSize?: string
  cpu?: string
  battery?: string
  description?: string
}

export interface SkuData {
  id?: number
  brandId: number
  brandName?: string
  modelId: number
  modelName?: string
  color?: string
  storage?: string
  price: number
  costPrice?: number
  barcode?: string
  stock?: number
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
    ram: item.ram,
    rom: item.rom,
    osType: item.os_type,
    launchYear: item.launch_year,
    networkType: item.network_type,
    screenSize: item.screen_size,
    cpu: item.cpu,
    battery: item.battery,
    description: item.description,
  }))
}

export async function createModel(data: ModelData): Promise<ModelData> {
  const res: any = await request.post('/products/models', {
    brand_id: data.brandId,
    name: data.name,
    color: data.color,
    ram: data.ram,
    rom: data.rom,
    os_type: data.osType,
    launch_year: data.launchYear,
    network_type: data.networkType,
    screen_size: data.screenSize,
    cpu: data.cpu,
    battery: data.battery,
    description: data.description,
  })
  return res.data
}

export async function updateModel(id: number, data: ModelData): Promise<ModelData> {
  const res: any = await request.put(`/products/models/${id}`, {
    brand_id: data.brandId,
    name: data.name,
    color: data.color,
    ram: data.ram,
    rom: data.rom,
    os_type: data.osType,
    launch_year: data.launchYear,
    network_type: data.networkType,
    screen_size: data.screenSize,
    cpu: data.cpu,
    battery: data.battery,
    description: data.description,
  })
  return res.data
}

export async function deleteModel(id: number): Promise<void> {
  await request.delete(`/products/models/${id}`)
}

export async function getSkus(params?: {
  brandId?: number
  modelId?: number
  keyword?: string
  page?: number
  pageSize?: number
}): Promise<{ list: SkuData[]; total: number }> {
  const apiParams: any = {}
  if (params?.brandId) apiParams.brand_id = params.brandId
  if (params?.modelId) apiParams.model_id = params.modelId
  if (params?.keyword) apiParams.keyword = params.keyword
  if (params?.page) apiParams.page = params.page
  if (params?.pageSize) apiParams.pageSize = params.pageSize
  const res: any = await request.get('/products/skus', { params: apiParams })
  return res.data
}

export async function createSku(data: SkuData): Promise<SkuData> {
  const res: any = await request.post('/products/skus', data)
  return res.data
}

export async function updateSku(id: number, data: SkuData): Promise<SkuData> {
  const res: any = await request.put(`/products/skus/${id}`, data)
  return res.data
}

export async function deleteSku(id: number): Promise<void> {
  await request.delete(`/products/skus/${id}`)
}

export async function scanSku(barcode: string): Promise<SkuData> {
  const res: any = await request.get('/products/skus/scan', { params: { barcode } })
  return res.data
}

export async function searchSkus(keyword: string): Promise<SkuData[]> {
  const res: any = await request.get('/products/skus/search', { params: { keyword } })
  return res.data || []
}

export interface ScanBrandModelResult {
  brandId: number
  brandName: string
  modelId: number
  modelName: string
  skuCode?: string
  color?: string
  ram?: string
  rom?: string
  salePrice?: number
  costPrice?: number
}

export async function scanBrandModel(barcode: string): Promise<ScanBrandModelResult> {
  const res: any = await request.get('/products/scan-brand-model', { params: { barcode } })
  return res.data
}
