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
  { header: '操作系统', width: 10, example: 'iOS' },
  { header: '屏幕尺寸', width: 12, example: '6.7英寸' },
  { header: '处理器', width: 16, example: 'A17 Pro' },
  { header: '运行内存', width: 10, example: '8GB' },
  { header: '存储容量', width: 10, example: '256GB' },
  { header: '电池容量', width: 12, example: '4422mAh' },
  { header: '网络制式', width: 10, example: '5G' },
  { header: '上市年份', width: 10, example: '2023' },
  { header: '条码', width: 18, example: '6901234567890' },
  { header: '描述', width: 24, example: '旗舰机型' },
]

const COLUMN_FIELD_MAP: Record<string, string> = {
  '品牌名': 'brandName',
  '型号名': 'name',
  '颜色': 'color',
  '操作系统': 'osType',
  '屏幕尺寸': 'screenSize',
  '处理器': 'cpu',
  '运行内存': 'ram',
  '存储容量': 'rom',
  '电池容量': 'battery',
  '网络制式': 'networkType',
  '上市年份': 'launchYear',
  '条码': 'barcode',
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
  osType?: string
  screenSize?: string
  cpu?: string
  ram?: string
  rom?: string
  battery?: string
  networkType?: string
  launchYear?: number
  barcode?: string
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
            if (field === 'launchYear') {
              const num = Number(v)
              if (!isNaN(num)) mapped[field] = num
            } else {
              mapped[field] = String(v).trim()
            }
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
