import request from './request'

export async function getBrands() {
  const res: any = await request.get('/products/brands')
  return res.data || []
}

export async function getModels(brandId?: number, keyword?: string) {
  const params: any = {}
  if (brandId) params.brand_id = brandId
  if (keyword) params.keyword = keyword
  const res: any = await request.get('/products/models', { params })
  return res.data || []
}

export async function createBrand(name: string, description?: string) {
  const res: any = await request.post('/products/brands', { name, description })
  return res.data
}

export async function createModel(brandId: number, name: string, data?: {
  color?: string
  ram?: string
  rom?: string
  sale_price?: number
  cost_price?: number
}) {
  const res: any = await request.post('/products/models', {
    brand_id: brandId,
    name,
    ...data,
  })
  return res.data
}
