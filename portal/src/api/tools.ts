import request from './request'

export interface TableInfo {
  key: string
  label: string
  count: number
}

export interface BackupNode {
  name: string
  size: number
  created_at: string
}

export interface ClearBusinessDataResult {
  backup_name: string
  deleted: Record<string, number>
}

// 可操作的数据表列表
export async function getTables(): Promise<TableInfo[]> {
  const res: any = await request.get('/tools/tables')
  return res.data || []
}

// 下载整库备份
export function downloadBackup(): void {
  downloadWithAuth('/tools/backup/download', `backup_${dateStr()}.sqlite`)
}

// 备份节点列表
export async function getBackupNodes(): Promise<BackupNode[]> {
  const res: any = await request.get('/tools/backup')
  return res.data || []
}

// 创建备份节点
export async function createBackup(): Promise<BackupNode> {
  const res: any = await request.post('/tools/backup')
  return res.data
}

// 下载指定备份节点
export function downloadBackupNode(name: string): void {
  downloadWithAuth(`/tools/backup/download/${encodeURIComponent(name)}`, name)
}

// 删除备份节点
export async function deleteBackupNode(name: string) {
  const res: any = await request.delete(`/tools/backup/${encodeURIComponent(name)}`)
  return res.data
}

// 快速还原（从备份节点）
export async function restoreFromNode(name: string) {
  const res: any = await request.post('/tools/restore', { name })
  return res
}

// 快速还原（上传备份文件）
export async function restoreFromFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res: any = await request.post('/tools/restore', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res
}

// 按表导出 Excel
export function exportTable(tableKey: string, filename?: string): void {
  downloadWithAuth(`/tools/export/${tableKey}`, filename || `${tableKey}.xlsx`)
}

// 按表导入 Excel
export async function importTable(tableKey: string, file: File): Promise<{ success: number; errors: string[] }> {
  const formData = new FormData()
  formData.append('file', file)
  const res: any = await request.post(`/tools/import/${tableKey}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data || { success: 0, errors: [] }
}

// 清空业务数据（服务端会先创建整库安全备份）
export async function clearBusinessData(): Promise<ClearBusinessDataResult> {
  const res: any = await request.post('/tools/clear-business-data')
  return res.data
}

// 带鉴权头下载文件
function downloadWithAuth(url: string, filename: string): void {
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
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(dlUrl)
    })
    .catch(() => {})
}

function dateStr(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}
