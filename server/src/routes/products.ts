import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import * as XLSX from 'xlsx';

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

export default router;
