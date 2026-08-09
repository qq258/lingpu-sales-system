import request from './request'
import * as XLSX from 'xlsx'

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
  memory?: string
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

export async function updateBrand(id: number, name: string, description?: string) {
  const res: any = await request.put(`/products/brands/${id}`, { name, description })
  return res.data
}

export async function deleteBrand(id: number) {
  const res: any = await request.delete(`/products/brands/${id}`)
  return res.data
}

export async function updateModel(id: number, brandId: number, name: string, data?: {
  color?: string
  memory?: string
  sale_price?: number
  cost_price?: number
  is_subsidy?: boolean
  description?: string
}) {
  const res: any = await request.put(`/products/models/${id}`, {
    brand_id: brandId,
    name,
    ...data,
  })
  return res.data
}

export async function deleteModel(id: number) {
  const res: any = await request.delete(`/products/models/${id}`)
  return res.data
}

// 带鉴权头下载文件（导出）
export function downloadWithAuth(url: string, filename?: string): void {
  const token = localStorage.getItem('portal_token')
  fetch(`/api/v1${url}`, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => {
      if (!res.ok) throw new Error('下载失败')
      return res.blob()
    })
    .then((blob) => {
      const dlUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = dlUrl
      a.download = filename || 'export.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(dlUrl)
    })
    .catch(() => {})
}

export function exportBrands() {
  downloadWithAuth('/products/brands/export', `brands_${dateStr()}.xlsx`)
}

export function exportModels() {
  downloadWithAuth('/products/models/export', `models_${dateStr()}.xlsx`)
}

// 批量导入品牌与型号（xlsx，服务端解析）
export async function importBrandModels(file: File, conflictMode: 'skip' | 'overwrite' = 'skip') {
  const formData = new FormData()
  formData.append('file', file)
  const res: any = await request.post(`/products/import?conflictMode=${conflictMode}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data || { success: 0, skipped: 0, overwritten: 0, errors: [] }
}

// 下载品牌型号导入模板（列头与服务端导入解析一致）
export function downloadBrandModelTemplate(): void {
  const headers = ['品牌名', '型号名', '颜色', '内存', '是否国补', '描述']
  const example = ['Apple', 'iPhone 15 Pro Max', '深黑色', '8GB/256GB', '是', '旗舰机型']
  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  ws['!cols'] = headers.map((h) => ({ wch: h === '品牌名' || h === '型号名' || h === '描述' ? 22 : 14 }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '品牌与型号模板')
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '品牌与型号导入模板.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function dateStr(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}
