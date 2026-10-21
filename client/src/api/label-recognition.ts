import request from './request'

export interface LabelRecognitionResult {
  fields: {
    brand: string | null
    productName: string | null
    modelCode: string | null
    memory: string | null
    color: string | null
    imei1: string | null
    imei2: string | null
    sn: string | null
  }
  matches: Array<{ id: number; brandName: string; name: string; color: string | null; memory: string | null; score: number }>
  warnings: string[]
  duplicate: boolean
  imei1Valid: boolean
  imei2Valid: boolean
}

export async function recognizePhoneLabel(file: File): Promise<LabelRecognitionResult> {
  const body = new FormData()
  body.append('file', file)
  // Vision requests can take longer than normal API calls.
  const response: any = await request.post('/label-recognition/recognize', body, { timeout: 65000 })
  return response.data
}
