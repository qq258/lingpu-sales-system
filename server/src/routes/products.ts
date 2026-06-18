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
          select: { id: true, name: true, color: true, ram: true, rom: true, sale_price: true, cost_price: true },
          orderBy: { id: 'asc' },
        },
        _count: { select: { models: true } },
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
    const where: any = {};
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
    const { brand_id, name, color, ram, rom, sale_price, cost_price, manufacturer_barcode, image_path, launch_year, os_type, network_type, screen_size, cpu, battery, description } = req.body;
    if (!brand_id || !name) {
      const r: ApiResponse = { code: 400, message: '品牌ID和型号名称不能为空' };
      return res.status(400).json(r);
    }
    const model = await prisma.pdt_model.create({
      data: { brand_id, name, color, ram, rom, sale_price: sale_price ?? 0, cost_price, manufacturer_barcode, image_path, launch_year, os_type, network_type, screen_size, cpu, battery, description },
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
    const { brand_id, name, color, ram, rom, sale_price, cost_price, manufacturer_barcode, launch_year, os_type, network_type, screen_size, cpu, battery, description, status } = req.body;
    const model = await prisma.pdt_model.update({
      where: { id },
      data: { brand_id, name, color, ram, rom, sale_price, cost_price, manufacturer_barcode, launch_year, os_type, network_type, screen_size, cpu, battery, description, status },
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
    await prisma.pdt_model.delete({ where: { id } });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 扫码查询型号（通过条码）
router.get('/scan-barcode', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.query;
    if (!barcode) {
      const r: ApiResponse = { code: 400, message: '条码不能为空' };
      return res.status(400).json(r);
    }

    const model = await prisma.pdt_model.findFirst({
      where: { manufacturer_barcode: barcode as string },
      include: { brand: { select: { id: true, name: true } } },
    });

    if (!model) {
      const r: ApiResponse = { code: 404, message: '未找到该条码对应的商品' };
      return res.status(404).json(r);
    }

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: {
        id: model.id,
        brandId: model.brand.id,
        brandName: model.brand.name,
        modelId: model.id,
        modelName: model.name,
        color: model.color,
        ram: model.ram,
        rom: model.rom,
        salePrice: model.sale_price,
        costPrice: model.cost_price,
        barcode: model.manufacturer_barcode,
        imagePath: model.image_path,
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
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
        OR: [
          { manufacturer_barcode: { contains: keyword as string } },
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
      ram: m.ram || '',
      rom: m.rom || '',
      storage: [m.ram, m.rom].filter(Boolean).join('/') || '',
      salePrice: m.sale_price || 0,
      costPrice: m.cost_price || 0,
      barcode: m.manufacturer_barcode || '',
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
      'RAM': r.ram || '',
      'ROM': r.rom || '',
      '售价': r.sale_price || 0,
      '成本价': r.cost_price || 0,
      '条码': r.manufacturer_barcode || '',
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
      '操作系统': 'osType', '系统': 'osType', 'osType': 'osType',
      '屏幕尺寸': 'screenSize', '屏幕': 'screenSize', 'screenSize': 'screenSize',
      '处理器': 'cpu', 'cpu': 'cpu',
      '运行内存': 'ram', '内存': 'ram', 'ram': 'ram',
      '存储容量': 'rom', '存储': 'rom', 'rom': 'rom',
      '电池容量': 'battery', '电池': 'battery', 'battery': 'battery',
      '网络制式': 'networkType', '网络': 'networkType', 'networkType': 'networkType',
      '上市年份': 'launchYear', '年份': 'launchYear', 'launchYear': 'launchYear',
      '条码': 'barcode', '出厂条码': 'barcode', 'barcode': 'barcode',
      '描述': 'description', 'description': 'description',
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
          ram: data.ram || null,
          rom: data.rom || null,
          sale_price: 0,
          cost_price: null,
          manufacturer_barcode: data.barcode || null,
          os_type: data.osType || null,
          launch_year: data.launchYear ? Number(data.launchYear) : null,
          network_type: data.networkType || null,
          screen_size: data.screenSize || null,
          cpu: data.cpu || null,
          battery: data.battery || null,
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
