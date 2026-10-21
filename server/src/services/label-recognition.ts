import type { Buffer } from 'buffer';

export interface LabelFields {
  brand: string | null;
  productName: string | null;
  modelCode: string | null;
  memory: string | null;
  color: string | null;
  imei1: string | null;
  imei2: string | null;
  sn: string | null;
}

const PROMPT = `你是手机包装盒标签识别器。仅根据图片上实际可见的内容提取以下字段，并且只返回一个 JSON 对象：
{"brand":null,"productName":null,"modelCode":null,"memory":null,"color":null,"imei1":null,"imei2":null,"sn":null}
字段含义：brand=手机品牌（不要误将芯片品牌当作手机品牌）；productName=销售型号/商品名，例如 Find X10；modelCode=工厂型号编码，如 PMW110；memory=RAM+ROM规格，尽量保留完整，例如 16GB+512GB；color=商品颜色；imei1/imei2=标为 IMEI、IMEI1、IMEI2 的十五位数字；sn=设备序列号/SN。
不同品牌字段布局不同，必须根据字段标签、空间邻近关系判断对应关系。不要把 EAN 商品码、物料码、CMIT ID 或条码旁其他数字当作 IMEI。保持所有设备码字符和顺序精确。若缺失/模糊/不确定，请返回 null，禁止猜测、推断或补齐号码。不要输出说明、Markdown 或额外字段。`;

const asText = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim().slice(0, 160) : null;

export function validateImei(value: string | null): boolean {
  if (!value || !/^\d{15}$/.test(value)) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = Number(value[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function normalizeMemory(value: string | null | undefined): string {
  if (!value) return '';
  const pieces = [...value.toUpperCase().matchAll(/(\d+(?:\.\d+)?)\s*(TB|GB|T|G)?/g)];
  return pieces.map((p) => {
    const unit = p[2] === 'TB' || p[2] === 'T' ? 'TB' : 'GB';
    return p[1] + unit;
  }).join('+');
}

export function normalizeName(value: string | null | undefined): string {
  return (value || '').toLowerCase().normalize('NFKC').replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
}

export async function recognizeLabelImage(buffer: Buffer, mime: string): Promise<LabelFields> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('后端未配置 DEEPSEEK_API_KEY');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_VISION_MODEL || 'deepseek-flash',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: '你只输出合法 JSON，不解释，不生成不存在的数据。' },
          {
            role: 'user',
            content: [
              { type: 'text', text: PROMPT },
              { type: 'image_url', image_url: { url: `data:${mime};base64,${buffer.toString('base64')}`, detail: 'original' } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      // 不记录请求体、图片、设备码或 Key。
      throw new Error(`识别服务不可用（HTTP ${response.status}）`);
    }
    const data: any = await response.json();
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== 'string') throw new Error('识别服务未返回文本结果');
    const parsed = JSON.parse(raw.replace(/^\s*```(?:json)?/i, '').replace(/```\s*$/, '').trim());
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('识别结果格式不正确');
    }

    const imei1 = asText(parsed.imei1)?.replace(/[\s-]/g, '') || null;
    const imei2 = asText(parsed.imei2)?.replace(/[\s-]/g, '') || null;
    return {
      brand: asText(parsed.brand),
      productName: asText(parsed.productName),
      modelCode: asText(parsed.modelCode),
      memory: asText(parsed.memory),
      color: asText(parsed.color),
      imei1,
      imei2,
      sn: asText(parsed.sn),
    };
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error('识别超时，请重新拍摄或稍后重试');
    if (error instanceof SyntaxError) throw new Error('识别响应不是有效 JSON，请重新识别');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
