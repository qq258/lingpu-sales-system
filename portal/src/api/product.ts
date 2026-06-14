import request from './request'

export async function getBrands() {
  const res: any = await request.get('/products/brands')
  return res.data || []
}

export async function getModels(brandId?: number) {
  const params = brandId ? { brand_id: brandId } : {}
  const res: any = await request.get('/products/models', { params })
  return res.data || []
}
