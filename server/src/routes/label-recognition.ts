import { Router, Request, Response } from 'express';
import multer from 'multer';
import prisma from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import { storeScopeMiddleware } from '../middleware/store-scope';
import { recognizeLabelImage, normalizeMemory, normalizeName, validateImei } from '../services/label-recognition';

const router = Router();
router.use(authMiddleware);
router.use(storeScopeMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持 JPG、PNG、WEBP 图片'));
  },
});

router.post('/recognize', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ code: 400, message: '请上传手机标签图片' });
    const signature = req.file.buffer.subarray(0, 12);
    const jpeg = signature[0] === 0xff && signature[1] === 0xd8 && signature[2] === 0xff;
    const png = signature.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    const webp = signature.subarray(0, 4).toString() === 'RIFF' && signature.subarray(8, 12).toString() === 'WEBP';
    const mime = jpeg ? 'image/jpeg' : png ? 'image/png' : webp ? 'image/webp' : null;
    if (!mime) return res.status(400).json({ code: 400, message: '文件不是有效的 JPG、PNG 或 WEBP 图片' });

    const fields = await recognizeLabelImage(req.file.buffer, mime);
    const warnings: string[] = [];
    if (!fields.imei1 || !validateImei(fields.imei1)) warnings.push('IMEI1 缺失或校验不通过，请人工核对');
    if (fields.imei2 && !validateImei(fields.imei2)) warnings.push('IMEI2 校验不通过，请人工核对');
    if (fields.imei1 && fields.imei1 === fields.imei2) warnings.push('IMEI1 和 IMEI2 相同，请人工核对');
    if (!fields.sn) warnings.push('SN 未识别，可手动补充');

    const candidates = await prisma.pdt_model.findMany({
      where: { status: 1 },
      include: { brand: { select: { name: true } } },
    });
    const name = normalizeName(fields.productName);
    const code = normalizeName(fields.modelCode);
    const brand = normalizeName(fields.brand);
    const memory = normalizeMemory(fields.memory);
    const color = normalizeName(fields.color);

    const matches = candidates.map(m => {
      const mName = normalizeName(m.name);
      const mBrand = normalizeName(m.brand.name);
      const mMemory = normalizeMemory(m.memory);
      const mColor = normalizeName(m.color);
      let score = 0;
      if (brand && brand === mBrand) score += 35;
      else if (brand) score -= 50;
      if (name && (name === mName || mName.includes(name) || name.includes(mName))) score += 35;
      if (code && (code === mName || mName.includes(code))) score += 30;
      if (memory && mMemory && memory === mMemory) score += 20;
      else if (memory && mMemory) score -= 20;
      if (color && mColor && color === mColor) score += 15;
      else if (color && mColor) score -= 15;
      return { id: m.id, brandName: m.brand.name, name: m.name, color: m.color, memory: m.memory, score };
    }).filter(m => m.score >= 35).sort((a,b) => b.score - a.score).slice(0,5);

    let exists = false;
    if (fields.imei1) {
      exists = !!await prisma.wh_inventory_imei.findFirst({ where: { OR: [{ imei: fields.imei1 }, { imei2: fields.imei1 }] }, select: { id: true } });
    }
    if (fields.imei2) {
      exists = exists || !!await prisma.wh_inventory_imei.findFirst({ where: { OR: [{ imei: fields.imei2 }, { imei2: fields.imei2 }] }, select: { id: true } });
    }
    if (exists) warnings.push('设备 IMEI 已存在于系统，不能重复录入');
    if (matches.length !== 1 || matches[0].score < 75) warnings.push('未找到唯一可靠的商品规格，请人工选择');
    return res.json({
      code: 200,
      message: '识别完成，请核对结果后添加到入库清单',
      data: { fields, matches, warnings, duplicate: exists, imei1Valid: validateImei(fields.imei1), imei2Valid: !fields.imei2 || validateImei(fields.imei2) },
    });
  } catch (e: any) {
    const message = typeof e?.message === 'string' ? e.message : '识别失败';
    return res.status(502).json({ code: 502, message });
  }
});

export default router;
