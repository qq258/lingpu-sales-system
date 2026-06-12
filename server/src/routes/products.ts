import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware, optionalAuth } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/brands', async (req: Request, res: Response) => {
  try {
    const brands = await prisma.pdt_brand.findMany({
      orderBy: { id: 'asc' },
      include: {
        models: { select: { id: true, name: true }, orderBy: { id: 'asc' } },
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
    const { brand_id } = req.query;
    const where: any = {};
    if (brand_id) where.brand_id = parseInt(brand_id as string);
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
    const { brand_id, name, launch_year, os_type, network_type, screen_size, cpu, battery, description } = req.body;
    if (!brand_id || !name) {
      const r: ApiResponse = { code: 400, message: '品牌ID和型号名称不能为空' };
      return res.status(400).json(r);
    }
    const model = await prisma.pdt_model.create({
      data: { brand_id, name, launch_year, os_type, network_type, screen_size, cpu, battery, description },
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
    const { brand_id, name, launch_year, os_type, network_type, screen_size, cpu, battery, description, status } = req.body;
    const model = await prisma.pdt_model.update({
      where: { id },
      data: { brand_id, name, launch_year, os_type, network_type, screen_size, cpu, battery, description, status },
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
    const skuCount = await prisma.pdt_sku.count({ where: { model_id: id } });
    if (skuCount > 0) {
      const r: ApiResponse = { code: 400, message: '该型号下存在SKU，无法删除' };
      return res.status(400).json(r);
    }
    await prisma.pdt_model.delete({ where: { id } });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/skus', async (req: Request, res: Response) => {
  try {
    const { model_id, keyword } = req.query;
    const where: any = {};
    if (model_id) where.model_id = parseInt(model_id as string);
    if (keyword) {
      where.OR = [
        { sku_code: { contains: keyword as string } },
        { manufacturer_barcode: { contains: keyword as string } },
        { color: { contains: keyword as string } },
      ];
    }
    const skus = await prisma.pdt_sku.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        model: { include: { brand: { select: { id: true, name: true } } } },
        barcodes: true,
        images: { orderBy: { sort: 'asc' } },
      },
    });
    const r: ApiResponse = { code: 200, message: 'success', data: skus };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/skus/scan', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.query;
    if (!barcode) {
      const r: ApiResponse = { code: 400, message: '条码不能为空' };
      return res.status(400).json(r);
    }

    let sku = await prisma.pdt_sku.findFirst({
      where: { manufacturer_barcode: barcode as string },
      include: { model: { include: { brand: { select: { id: true, name: true } } } }, images: { orderBy: { sort: 'asc' } } },
    });

    if (!sku) {
      const barcodeRecord = await prisma.pdt_sku_barcode.findUnique({
        where: { barcode: barcode as string },
        include: { sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } }, images: { orderBy: { sort: 'asc' } } } } },
      });
      if (barcodeRecord) {
        sku = barcodeRecord.sku;
      }
    }

    if (!sku) {
      const r: ApiResponse = { code: 404, message: '未找到该条码对应的商品' };
      return res.status(404).json(r);
    }

    const r: ApiResponse = { code: 200, message: 'success', data: sku };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/scan-brand-model', async (req: Request, res: Response) => {
  try {
    const { barcode } = req.query;
    if (!barcode) {
      const r: ApiResponse = { code: 400, message: '条码不能为空' };
      return res.status(400).json(r);
    }

    let sku = await prisma.pdt_sku.findFirst({
      where: { manufacturer_barcode: barcode as string },
      include: { model: { include: { brand: { select: { id: true, name: true } } } } },
    });

    if (!sku) {
      const barcodeRecord = await prisma.pdt_sku_barcode.findUnique({
        where: { barcode: barcode as string },
        include: { sku: { include: { model: { include: { brand: { select: { id: true, name: true } } } } } } },
      });
      if (barcodeRecord) {
        sku = barcodeRecord.sku;
      }
    }

    if (!sku) {
      const r: ApiResponse = { code: 404, message: '未找到该条码对应的商品' };
      return res.status(404).json(r);
    }

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: {
        brandId: sku.model.brand.id,
        brandName: sku.model.brand.name,
        modelId: sku.model.id,
        modelName: sku.model.name,
        skuCode: sku.sku_code,
        color: sku.color,
        ram: sku.ram,
        rom: sku.rom,
        salePrice: sku.sale_price,
        costPrice: sku.cost_price,
      },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/skus/search', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      const r: ApiResponse = { code: 400, message: '关键词不能为空' };
      return res.status(400).json(r);
    }
    const rawSkus = await prisma.pdt_sku.findMany({
      where: {
        OR: [
          { sku_code: { contains: keyword as string } },
          { manufacturer_barcode: { contains: keyword as string } },
          { color: { contains: keyword as string } },
          { model: { name: { contains: keyword as string } } },
        ],
      },
      take: 20,
      orderBy: { id: 'asc' },
      include: {
        model: { include: { brand: { select: { id: true, name: true } } } },
        barcodes: true,
        images: { orderBy: { sort: 'asc' }, take: 1 },
      },
    });
    const skus = rawSkus.map((s) => ({
      id: s.id,
      modelId: s.model_id,
      skuCode: s.sku_code,
      barcode: s.manufacturer_barcode || '',
      brandName: s.model?.brand?.name || '',
      modelName: s.model?.name || '',
      color: s.color || '',
      ram: s.ram || '',
      rom: s.rom || '',
      storage: [s.ram, s.rom].filter(Boolean).join('/') || '',
      salePrice: s.sale_price || 0,
      costPrice: s.cost_price || 0,
      stock: 0,
      imagePath: s.image_path || '',
    }));
    const r: ApiResponse = { code: 200, message: 'success', data: skus };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/skus/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sku = await prisma.pdt_sku.findUnique({
      where: { id },
      include: {
        model: { include: { brand: { select: { id: true, name: true } } } },
        barcodes: true,
        images: { orderBy: { sort: 'asc' } },
      },
    });
    if (!sku) {
      const r: ApiResponse = { code: 404, message: 'SKU不存在' };
      return res.status(404).json(r);
    }
    const r: ApiResponse = { code: 200, message: 'success', data: sku };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/skus', async (req: Request, res: Response) => {
  try {
    const { model_id, sku_code, manufacturer_barcode, color, ram, rom, sale_price, cost_price } = req.body;
    if (!model_id || !sku_code || sale_price === undefined) {
      const r: ApiResponse = { code: 400, message: '型号ID、SKU编码和售价不能为空' };
      return res.status(400).json(r);
    }
    const sku = await prisma.pdt_sku.create({
      data: { model_id, sku_code, manufacturer_barcode, color, ram, rom, sale_price, cost_price },
    });
    const r: ApiResponse = { code: 200, message: '创建成功', data: sku };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/skus/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { model_id, sku_code, manufacturer_barcode, color, ram, rom, sale_price, cost_price, status } = req.body;
    const sku = await prisma.pdt_sku.update({
      where: { id },
      data: { model_id, sku_code, manufacturer_barcode, color, ram, rom, sale_price, cost_price, status },
    });
    const r: ApiResponse = { code: 200, message: '更新成功', data: sku };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/skus/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.pdt_sku.delete({ where: { id } });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/skus/:id/images', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sku = await prisma.pdt_sku.findUnique({ where: { id } });
    if (!sku) {
      const r: ApiResponse = { code: 404, message: 'SKU不存在' };
      return res.status(404).json(r);
    }
    const { image_path, sort } = req.body;
    if (!image_path) {
      const r: ApiResponse = { code: 400, message: '图片路径不能为空' };
      return res.status(400).json(r);
    }
    const image = await prisma.pdt_sku_image.create({
      data: { sku_id: id, image_path, sort: sort || 0 },
    });
    const r: ApiResponse = { code: 200, message: '添加成功', data: image };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;
