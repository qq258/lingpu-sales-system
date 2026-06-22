import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import * as XLSX from 'xlsx';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();

router.use(authMiddleware);

router.get('/brands', async (req: Request, res: Response) => {
  try {
    const brands = await prisma.pdt_brand.findMany({
      orderBy: { id: 'asc' },
      include: {
        models: {
          select: { id: true, name: true, color: true, memory: true, sale_price: true, cost_price: true },
          where: { status: 1 },
          orderBy: { id: 'asc' },
        },
        _count: { select: { models: { where: { status: 1 } } } },
      },
    });
    const r: ApiResponse = { code: 200, message: 'success', data: brands };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/brands', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      const r: ApiResponse = { code: 400, message: '品牌名称不能为空' };
      return res.status(400).json(r);
    }
    const brand = await prisma.pdt_brand.create({ data: { name, description } });
    const r: ApiResponse = { code: 200, message: '创建成功', data: brand };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/brands/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description, status } = req.body;
    const brand = await prisma.pdt_brand.update({
      where: { id },
      data: { name, description, status },
    });
    const r: ApiResponse = { code: 200, message: '更新成功', data: brand };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/brands/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const modelCount = await prisma.pdt_model.count({ where: { brand_id: id } });
    if (modelCount > 0) {
      const r: ApiResponse = { code: 400, message: '该品牌下存在型号，无法删除' };
      return res.status(400).json(r);
    }
    await prisma.pdt_brand.delete({ where: { id } });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/models', async (req: Request, res: Response) => {
  try {
    const { brand_id, keyword } = req.query;
    const where: any = { status: 1 };
    if (brand_id) where.brand_id = parseInt(brand_id as string);
    if (keyword) {
      where.OR = [
        { name: { contains: keyword as string } },
        { brand: { name: { contains: keyword as string } } },
      ];
    }
    const models = await prisma.pdt_model.findMany({
      where,
      orderBy: { id: 'asc' },
      include: { brand: { select: { id: true, name: true } } },
    });
    const r: ApiResponse = { code: 200, message: 'success', data: models };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/models', async (req: Request, res: Response) => {
  try {
    const { brand_id, name, color, memory, sale_price, cost_price, image_path, is_subsidy, description } = req.body;
    if (!brand_id || !name) {
      const r: ApiResponse = { code: 400, message: '品牌ID和型号名称不能为空' };
      return res.status(400).json(r);
    }
    const model = await prisma.pdt_model.create({
      data: { brand_id, name, color, memory, sale_price: sale_price ?? 0, cost_price, image_path, is_subsidy: is_subsidy ?? false, description },
    });
    const r: ApiResponse = { code: 200, message: '创建成功', data: model };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/models/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { brand_id, name, color, memory, sale_price, cost_price, image_path, is_subsidy, description, status } = req.body;
    const model = await prisma.pdt_model.update({
      where: { id },
      data: { brand_id, name, color, memory, sale_price, cost_price, image_path, is_subsidy, description, status },
    });
    const r: ApiResponse = { code: 200, message: '更新成功', data: model };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/models/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // 软删除：将 status 设为 0，保留数据以维持外键引用完整性
    await prisma.pdt_model.update({ where: { id }, data: { status: 0 } });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 扫码查询型号（已移除条码字段，此接口不再可用）
router.get('/scan-barcode', async (req: Request, res: Response) => {
  const r: ApiResponse = { code: 404, message: '条码查询功能已移除' };
  return res.status(404).json(r);
});

// 搜索型号
router.get('/models/search', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      const r: ApiResponse = { code: 400, message: '关键词不能为空' };
      return res.status(400).json(r);
    }
    const models = await prisma.pdt_model.findMany({
      where: {
        status: 1,
        OR: [
          { name: { contains: keyword as string } },
          { color: { contains: keyword as string } },
        ],
      },
      take: 20,
      orderBy: { id: 'asc' },
      include: { brand: { select: { id: true, name: true } } },
    });
    const result = models.map((m) => ({
      id: m.id,
      brandId: m.brand_id,
      brandName: m.brand?.name || '',
      modelName: m.name,
      color: m.color || '',
      memory: m.memory || '',
      salePrice: m.sale_price || 0,
      costPrice: m.cost_price || 0,
    }));
    const r: ApiResponse = { code: 200, message: 'success', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/models/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const model = await prisma.pdt_model.findUnique({
      where: { id },
      include: { brand: { select: { id: true, name: true } } },
    });
    if (!model) {
      const r: ApiResponse = { code: 404, message: '型号不存在' };
      return res.status(404).json(r);
    }
    const r: ApiResponse = { code: 200, message: 'success', data: model };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导出品牌
router.get('/brands/export', async (req: Request, res: Response) => {
  try {
    const brands = await prisma.pdt_brand.findMany({
      include: { _count: { select: { models: true } } },
      orderBy: { id: 'asc' },
    });
    const data = brands.map((r) => ({
      '编号': r.id,
      '品牌名称': r.name,
      '描述': r.description || '',
      '型号数量': r._count?.models || 0,
      '状态': r.status === 1 ? '启用' : '禁用',
      '创建时间': r.created_at?.toISOString().slice(0, 16).replace('T', ' ') || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '品牌');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=brands_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导出型号
router.get('/models/export', async (req: Request, res: Response) => {
  try {
    const models = await prisma.pdt_model.findMany({
      include: { brand: { select: { name: true } } },
      orderBy: { id: 'asc' },
    });
    const data = models.map((r) => ({
      '编号': r.id,
      '品牌': r.brand?.name || '',
      '型号名称': r.name,
      '颜色': r.color || '',
      '内存': r.memory || '',
      '售价': r.sale_price || 0,
      '成本价': r.cost_price || 0,
      '国补': r.is_subsidy ? '是' : '否',
      '状态': r.status === 1 ? '启用' : '禁用',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '型号');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=models_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 批量导入品牌与型号
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const conflictMode = (req.query.conflictMode as string) === 'overwrite' ? 'overwrite' : 'skip';

    if (!req.file) {
      const r: ApiResponse = { code: 400, message: '请上传 xlsx 文件' };
      return res.status(400).json(r);
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rawRows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const errors: Array<{ row: number; message: string }> = [];
    let success = 0;
    let skipped = 0;
    let overwritten = 0;

    const colMap: Record<string, string> = {
      '品牌名': 'brandName', '品牌': 'brandName', 'brand': 'brandName', 'brandName': 'brandName',
      '型号名': 'name', '型号名称': 'name', '型号': 'name', 'name': 'name',
      '颜色': 'color', 'color': 'color',
      '内存': 'memory', '运行内存': 'memory', '存储容量': 'memory', '存储': 'memory', 'ram': 'memory', 'rom': 'memory',
      '描述': 'description', 'description': 'description',
      '国补': 'subsidy', '是否国补': 'subsidy', 'subsidy': 'subsidy',
    };

    // 按品牌分组
    const brandGroups: Record<string, Array<{ rowIndex: number; data: any }>> = {};
    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      const mapped: any = {};
      for (const k of Object.keys(raw)) {
        const field = colMap[k];
        if (field) mapped[field] = raw[k];
      }
      const brandName = String(mapped.brandName || '').trim();
      const modelName = String(mapped.name || '').trim();
      if (!brandName || !modelName) {
        errors.push({ row: i + 2, message: !brandName ? '品牌名不能为空' : '型号名不能为空' });
        continue;
      }
      const key = brandName.toLowerCase();
      if (!brandGroups[key]) brandGroups[key] = [];
      brandGroups[key].push({ rowIndex: i + 2, data: mapped });
    }

    // 处理每个品牌
    for (const [, group] of Object.entries(brandGroups)) {
      const firstRow = group[0].data;
      const brandName = String(firstRow.brandName).trim();
      const brandDescription = String(firstRow.description || '').trim() || undefined;

      let brand = await prisma.pdt_brand.findFirst({ where: { name: brandName } });
      if (!brand) {
        brand = await prisma.pdt_brand.create({ data: { name: brandName, description: brandDescription } });
      } else if (conflictMode === 'overwrite' && brandDescription) {
        brand = await prisma.pdt_brand.update({ where: { id: brand.id }, data: { description: brandDescription } });
      }

      for (const { rowIndex, data } of group) {
        const modelName = String(data.name).trim();
        const existingModel = await prisma.pdt_model.findFirst({
          where: { brand_id: brand.id, name: modelName },
        });

        const modelData: any = {
          brand_id: brand.id,
          name: modelName,
          color: data.color || null,
          memory: data.memory || null,
          sale_price: 0,
          cost_price: null,
          is_subsidy: data.subsidy === '是' || data.subsidy === 'true' || data.subsidy === true || false,
          description: data.description || null,
        };

        try {
          if (existingModel) {
            if (conflictMode === 'overwrite') {
              await prisma.pdt_model.update({ where: { id: existingModel.id }, data: modelData });
              overwritten++;
            } else {
              skipped++;
            }
          } else {
            await prisma.pdt_model.create({ data: modelData });
            success++;
          }
        } catch (err: any) {
          errors.push({ row: rowIndex, message: err.message || '保存失败' });
        }
      }
    }

    const r: ApiResponse = { code: 200, message: 'success', data: { success, skipped, overwritten, errors } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '导入失败' };
    return res.status(500).json(r);
  }
});

export default router;
