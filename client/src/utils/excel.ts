import * as XLSX from 'xlsx'

export interface ImportTemplateColumn {
  header: string
  width?: number
  example?: string
}

export const BRAND_MODEL_TEMPLATE_COLUMNS: ImportTemplateColumn[] = [
  { header: '品牌名', width: 16, example: 'Apple' },
  { header: '型号名', width: 22, example: 'iPhone 15 Pro Max' },
  { header: '颜色', width: 12, example: '深黑色' },
  { header: '内存', width: 16, example: '8GB/256GB' },
  { header: '是否国补', width: 12, example: '是' },
  { header: '描述', width: 24, example: '旗舰机型' },
]

const COLUMN_FIELD_MAP: Record<string, string> = {
  '品牌名': 'brandName',
  '型号名': 'name',
  '颜色': 'color',
  '内存': 'memory',
  '运行内存': 'memory',
  '存储容量': 'memory',
  '是否国补': 'subsidy',
  '国补': 'subsidy',
  '描述': 'description',
}

export function downloadBrandModelTemplate(): void {
  const headers = BRAND_MODEL_TEMPLATE_COLUMNS.map(c => c.header)
  const exampleRow = BRAND_MODEL_TEMPLATE_COLUMNS.map(c => c.example || '')
  const ws = XLSX.utils.aoa_to_sheet([headers, exampleRow])
  ws['!cols'] = BRAND_MODEL_TEMPLATE_COLUMNS.map(c => ({ wch: c.width || 12 }))

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

export interface ParsedRow {
  brandName: string
  name: string
  color?: string
  memory?: string
  subsidy?: string
  description?: string
  _rowIndex: number
}

export function parseBrandModelFile(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' })
        const rows: ParsedRow[] = json.map((row, idx) => {
          const mapped: any = { _rowIndex: idx + 2 }
          for (const [zh, field] of Object.entries(COLUMN_FIELD_MAP)) {
            const v = row[zh]
            if (v === undefined || v === null || v === '') continue
            mapped[field] = String(v).trim()
          }
          return mapped as ParsedRow
        })
        resolve(rows)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

export function downloadErrorCsv(errors: Array<{ row: number; message: string }>, filename = '导入失败明细.csv'): void {
  const headers = ['行号', '错误信息']
  const rows = errors.map(e => [String(e.row), e.message])
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
  ws['!cols'] = [{ wch: 8 }, { wch: 50 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '失败明细')
  const csv = XLSX.utils.sheet_to_csv(ws)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
