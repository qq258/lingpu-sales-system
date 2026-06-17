import request from './request'

export interface TableInfo {
  key: string
  label: string
  count: number
}

export async function getTables(): Promise<TableInfo[]> {
  const res: any = await request.get('/tools/tables')
  return res.data || []
}

export function downloadBackup(): void {
  const token = localStorage.getItem('token')
  const url = `/api/v1/tools/backup/download`
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      a.download = `backup_${dateStr}.sqlite`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(() => {})
}

export function exportTable(tableKey: string, filename?: string): void {
  const token = localStorage.getItem('token')
  const url = `/api/v1/tools/export/${tableKey}`
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => res.blob())
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `${tableKey}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(() => {})
}

export async function importTable(tableKey: string, file: File): Promise<{ success: number; errors: string[] }> {
  const formData = new FormData()
  formData.append('file', file)
  const res: any = await request.post(`/tools/import/${tableKey}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data || { success: 0, errors: [] }
}

// 模块快捷导出 - 通过后端 API 直接触发下载（带筛选参数）
export function exportWithQuery(url: string, params: Record<string, any> = {}): void {
  const token = localStorage.getItem('token')
  const queryStr = Object.entries(params)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
  const fullUrl = `/api/v1${url}${queryStr ? '?' + queryStr : ''}`
  fetch(fullUrl, { headers: { Authorization: `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error('导出失败')
      return res.blob()
    })
    .then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'export.xlsx'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch(() => {})
}
