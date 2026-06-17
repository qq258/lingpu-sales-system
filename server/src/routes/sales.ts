import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import { storeScopeMiddleware } from '../middleware/store-scope';
import { generateOrderNo } from '../utils/order-no';
import * as XLSX from 'xlsx';

const router = Router();

router.use(authMiddleware);
router.use(storeScopeMiddleware);

function getStoreId(req: Request): number | null {
  return (req as any).effectiveStoreId ?? null;
}

router.post('/sales/no-stock', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }

    const { items, actual_amount, customer_name, customer_address, customer_phone, remark } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      const r: ApiResponse = { code: 400, message: '商品列表不能为空' };
      return res.status(400).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
    if (!store) {
      const r: ApiResponse = { code: 404, message: '门店不存在' };
      return res.status(404).json(r);
    }

    const orderNo = await generateOrderNo('SA', store.code);

    const result = await prisma.$transaction(async (tx) => {
      interface ItemInput {
        brand_name: string;
        model_name: string;
        model_id?: number | null;
        color?: string;
        storage?: string;
        imei: string;
        imei2?: string | null;
        sn_code?: string | null;
        unit_price: number;
      }

      const processedItems: Array<{
        modelId: number;
        brandName: string;
        modelName: string;
        color: string;
        storage: string;
        imei: string;
        imei2: string | null;
        sn_code: string | null;
        unitPrice: number;
      }> = [];

      for (const item of items) {
        let modelId = item.model_id;

        if (!modelId) {
          // 查找或创建品牌
          let brand = await tx.pdt_brand.findFirst({
            where: { name: item.brand_name },
          });
          if (!brand) {
            brand = await tx.pdt_brand.create({
              data: { name: item.brand_name },
            });
          }

          // 查找或创建型号
          let model = await tx.pdt_model.findFirst({
            where: { brand_id: brand.id, name: item.model_name },
          });
          if (!model) {
            model = await tx.pdt_model.create({
              data: {
                brand_id: brand.id,
                name: item.model_name,
                color: item.color || '',
                ram: item.storage?.split('/')[0] || '',
                rom: item.storage?.split('/')[1] || '',
                sale_price: item.unit_price,
              },
            });
          }
          modelId = model.id;
        }

        // 创建 IMEI 记录（已售状态）
        await tx.wh_inventory_imei.create({
          data: {
            model_id: modelId,
            store_id: storeId,
            imei: item.imei,
            imei2: item.imei2 || null,
            sn_code: item.sn_code || null,
            status: 'sold',
            sold_at: new Date(),
          },
        });

        // 获取型号完整信息
        const modelRec = await tx.pdt_model.findUnique({
          where: { id: modelId },
          include: { brand: { select: { name: true } } },
        });

        processedItems.push({
          modelId,
          brandName: modelRec?.brand?.name || item.brand_name,
          modelName: modelRec?.name || item.model_name,
          color: modelRec?.color || item.color || '',
          storage: [modelRec?.ram, modelRec?.rom].filter(Boolean).join('/') || item.storage || '',
          imei: item.imei,
          imei2: item.imei2 || null,
          sn_code: item.sn_code || null,
          unitPrice: item.unit_price,
        });
      }

      // 更新 wh_inventory 汇总库存
      const modelGroups: Record<number, number> = {};
      for (const pi of processedItems) {
        modelGroups[pi.modelId] = (modelGroups[pi.modelId] || 0) + 1;
      }

      for (const [modelIdStr, count] of Object.entries(modelGroups)) {
        const modelId = parseInt(modelIdStr);
        const pi = processedItems.find(p => p.modelId === modelId)!;

        let inventory = await tx.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id: modelId, store_id: storeId } },
        });

        const qtyBefore = inventory?.quantity || 0;
        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: { quantity: qtyBefore },
          });
        } else {
          await tx.wh_inventory.create({
            data: {
              model_id: modelId,
              store_id: storeId,
              quantity: 0,
              brand_name: pi.brandName,
              model_name: pi.modelName,
              color: pi.color,
              storage: pi.storage,
              sale_price: pi.unitPrice,
            },
          });
        }

        await tx.wh_inventory_log.create({
          data: {
            model_id: modelId,
            store_id: storeId,
            change_type: 'sale_out',
            qty_before: qtyBefore,
            qty_change: 0,
            qty_after: qtyBefore,
            ref_type: 'sale_order',
            ref_id: 0,
            operator_id: req.user!.userId,
            remark: `无库存销售: ${orderNo}`,
          },
        });
      }

      // 创建销售订单
      const totalAmount = processedItems.reduce((s, i) => s + i.unitPrice, 0);
      const firstItem = processedItems[0];
      const firstModelName = `${firstItem.brandName} ${firstItem.modelName} - ${firstItem.color}/${firstItem.storage}`.trim();

      const saleOrder = await tx.sale_order.create({
        data: {
          order_no: orderNo,
          store_id: storeId,
          model_id: firstItem.modelId,
          model_name: firstModelName,
          quantity: processedItems.length,
          unit_price: firstItem.unitPrice || 0,
          total_amount: totalAmount,
          actual_amount,
          change_amount: Math.max(0, actual_amount - totalAmount),
          customer_name,
          customer_address,
          customer_phone,
          remark,
          operator_id: req.user!.userId,
        },
      });

      // 创建销售订单明细
      for (const pi of processedItems) {
        const modelNameStr = `${pi.brandName} ${pi.modelName} - ${pi.color}/${pi.storage}`.trim();
        await tx.sale_order_item.create({
          data: {
            sale_order_id: saleOrder.id,
            model_id: pi.modelId,
            model_name: modelNameStr,
            imei: pi.imei,
            imei2: pi.imei2,
            sn_code: pi.sn_code,
            quantity: 1,
            unit_price: pi.unitPrice,
            total_price: pi.unitPrice,
          },
        });
      }

      // 更新日志的 ref_id
      await tx.wh_inventory_log.updateMany({
        where: { ref_type: 'sale_order', ref_id: 0 },
        data: { ref_id: saleOrder.id },
      });

      // 更新 sale_order 的 model_name 为完整商品列表
      const fullModelName = processedItems.map(p => `${p.brandName} ${p.modelName} - ${p.color}/${p.storage}`.trim()).join('; ');
      return tx.sale_order.update({
        where: { id: saleOrder.id },
        data: { model_name: fullModelName },
      });
    });

    const r: ApiResponse = { code: 200, message: '开单成功', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '开单失败' };
    return res.status(500).json(r);
  }
});

router.post('/sales', async (req: Request, res: Response) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      const r: ApiResponse = { code: 400, message: '无法确定门店' };
      return res.status(400).json(r);
    }

    const { items, actual_amount, customer_name, customer_address, customer_phone, remark } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      const r: ApiResponse = { code: 400, message: '商品列表不能为空' };
      return res.status(400).json(r);
    }
    if (actual_amount === undefined) {
      const r: ApiResponse = { code: 400, message: '实收金额不能为空' };
      return res.status(400).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
    if (!store) {
      const r: ApiResponse = { code: 404, message: '门店不存在' };
      return res.status(404).json(r);
    }

    const orderNo = await generateOrderNo('SA', store.code);

    const result = await prisma.$transaction(async (tx) => {
      interface ImeiRecord {
        imei: string;
        imei2: string | null;
        sn_code: string | null;
        modelId: number;
        brandName: string;
        modelName: string;
        color: string;
        storage: string;
        unitPrice: number;
      }

      const imeiRecords: ImeiRecord[] = [];
      let totalAmount = 0;

      for (const item of items) {
        const { imei, unit_price, imei2, sn_code } = item;
        if (!imei) {
          throw new Error('IMEI不能为空');
        }

        // IMEI 校验在事务内执行，避免并发重复售卖
        const record = await tx.wh_inventory_imei.findUnique({
          where: { imei },
          include: {
            model: {
              include: { brand: { select: { name: true } } },
            },
          },
        });

        if (!record) {
          throw new Error(`IMEI ${imei} 不存在`);
        }
        if (record.status !== 'in_stock') {
          throw new Error(`IMEI ${imei} 已售出`);
        }
        if (record.store_id !== storeId) {
          throw new Error(`IMEI ${imei} 不属于当前门店`);
        }

        const price = unit_price || record.model?.sale_price || 0;
        totalAmount += price;

        const brandName = record.model?.brand?.name || '';
        const modelName = record.model?.name || '';
        const color = record.model?.color || '';
        const storage = [record.model?.ram, record.model?.rom].filter(Boolean).join('/') || '';

        // 使用用户传入的 imei2/sn_code（如有），否则保留原值
        const finalImei2 = imei2 !== undefined ? imei2 : record.imei2;
        const finalSnCode = sn_code !== undefined ? sn_code : record.sn_code;

        imeiRecords.push({ imei, imei2: finalImei2, sn_code: finalSnCode, modelId: record.model_id, brandName, modelName, color, storage, unitPrice: price });
      }

      const firstItem = imeiRecords[0];
      const firstModelName = `${firstItem.brandName} ${firstItem.modelName} - ${firstItem.color}/${firstItem.storage}`.trim();

      const saleOrder = await tx.sale_order.create({
        data: {
          order_no: orderNo,
          store_id: storeId,
          model_id: firstItem.modelId,
          model_name: firstModelName,
          quantity: imeiRecords.length,
          unit_price: firstItem.unitPrice || 0,
          total_amount: totalAmount,
          actual_amount,
          change_amount: Math.max(0, actual_amount - totalAmount),
          customer_name,
          customer_address,
          customer_phone,
          remark,
          operator_id: req.user!.userId,
        },
      });

      for (const rec of imeiRecords) {
        const modelNameStr = `${rec.brandName} ${rec.modelName} - ${rec.color}/${rec.storage}`.trim();

        await tx.sale_order_item.create({
          data: {
            sale_order_id: saleOrder.id,
            model_id: rec.modelId,
            model_name: modelNameStr,
            imei: rec.imei,
            imei2: rec.imei2,
            sn_code: rec.sn_code,
            quantity: 1,
            unit_price: rec.unitPrice,
            total_price: rec.unitPrice,
          },
        });

        const updateData: any = { status: 'sold', sold_at: new Date() };
        if (rec.imei2) updateData.imei2 = rec.imei2;
        if (rec.sn_code) updateData.sn_code = rec.sn_code;
        await tx.wh_inventory_imei.update({
          where: { imei: rec.imei },
          data: updateData,
        });
      }

      // 按型号分组更新汇总库存
      const modelGroups: Record<number, number> = {};
      for (const rec of imeiRecords) {
        modelGroups[rec.modelId] = (modelGroups[rec.modelId] || 0) + 1;
      }

      for (const [modelIdStr, count] of Object.entries(modelGroups)) {
        const modelId = parseInt(modelIdStr);

        const inventory = await tx.wh_inventory.findUnique({
          where: { model_id_store_id: { model_id: modelId, store_id: storeId } },
        });

        const qtyBefore = inventory?.quantity || 0;
        const qtyAfter = Math.max(0, qtyBefore - count);

        if (inventory) {
          await tx.wh_inventory.update({
            where: { id: inventory.id },
            data: { quantity: qtyAfter },
          });
        }

        const modelRec = imeiRecords.find(r => r.modelId === modelId);
        const modelNameStr2 = modelRec ? `${modelRec.brandName} ${modelRec.modelName}`.trim() : '';

        await tx.wh_inventory_log.create({
          data: {
            model_id: modelId,
            store_id: storeId,
            change_type: 'sale_out',
            qty_before: qtyBefore,
            qty_change: -count,
            qty_after: qtyAfter,
            ref_type: 'sale_order',
            ref_id: saleOrder.id,
            operator_id: req.user!.userId,
            remark: `销售出库: ${orderNo} - ${modelNameStr2}`,
          },
        });
      }

      const updatedOrder = await tx.sale_order.update({
        where: { id: saleOrder.id },
        data: {
          model_name: imeiRecords.map(r => `${r.brandName} ${r.modelName} - ${r.color}/${r.storage}`.trim()).join('; '),
        },
      });

      return updatedOrder;
    });

    const r: ApiResponse = { code: 200, message: '开单成功', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '开单失败' };
    return res.status(500).json(r);
  }
});

router.get('/sales', async (req: Request, res: Response) => {
  try {
    const { page = '1', pageSize = '20', start_date, end_date, keyword } = req.query;
    const storeId = getStoreId(req);

    const where: any = { status: 'active' };
    if (storeId) where.store_id = storeId;
    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date as string);
      if (end_date) where.created_at.lte = new Date(end_date as string + 'T23:59:59.999Z');
    }
    if (keyword) {
      where.OR = [
        { order_no: { contains: keyword as string } },
        { customer_name: { contains: keyword as string } },
        { model_name: { contains: keyword as string } },
        { items: { some: { imei: { contains: keyword as string } } } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const take = parseInt(pageSize as string);

    const [list, total] = await Promise.all([
      prisma.sale_order.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        include: {
          store: { select: { id: true, name: true } },
          model: { select: { id: true, name: true, color: true, ram: true, rom: true, brand: { select: { id: true, name: true } } } },
          operator: { select: { id: true, real_name: true } },
          items: { select: { id: true, imei: true, imei2: true, sn_code: true, model_name: true } },
        },
      }),
      prisma.sale_order.count({ where }),
    ]);

    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: { list, total, page: parseInt(page as string), pageSize: parseInt(pageSize as string) },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/sales/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await prisma.sale_order.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, code: true } },
        model: { include: { brand: { select: { id: true, name: true } } } },
        operator: { select: { id: true, real_name: true } },
        items: true,
      },
    });
    if (!sale) {
      const r: ApiResponse = { code: 404, message: '销售记录不存在' };
      return res.status(404).json(r);
    }
    const r: ApiResponse = { code: 200, message: 'success', data: sale };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/sales/:id/print-data', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await prisma.sale_order.findUnique({
      where: { id },
      include: {
        store: { select: { id: true, name: true, code: true, address: true, phone: true } },
        operator: { select: { id: true, real_name: true } },
        items: true,
      },
    });
    if (!sale) {
      const r: ApiResponse = { code: 404, message: '销售记录不存在' };
      return res.status(404).json(r);
    }

    const printData = {
      order_no: sale.order_no,
      created_at: sale.created_at,
      store: (sale as any).store,
      operator: (sale as any).operator,
      customer_name: sale.customer_name,
      customer_address: sale.customer_address,
      customer_phone: sale.customer_phone,
      total_amount: sale.total_amount,
      actual_amount: sale.actual_amount,
      change_amount: sale.change_amount,
      remark: sale.remark,
      items: ((sale as any).items || []).map((item: any) => ({
        id: item.id,
        model_id: item.model_id,
        model_name: item.model_name,
        imei: item.imei,
        imei2: item.imei2,
        sn_code: item.sn_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      })),
    };

    const r: ApiResponse = { code: 200, message: 'success', data: printData };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/sales/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const sale = await prisma.sale_order.findUnique({ where: { id } });
    if (!sale) {
      const r: ApiResponse = { code: 404, message: '销售记录不存在' };
      return res.status(404).json(r);
    }
    await prisma.sale_order.update({
      where: { id },
      data: { status: 'deleted' },
    });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导出销售记录
router.get('/sales/export', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, storeId } = req.query;
    const where: any = { status: 'active' };
    if (startDate && endDate) {
      where.created_at = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string + 'T23:59:59'),
      };
    }
    if (storeId) where.store_id = parseInt(storeId as string);
    const sales = await prisma.sale_order.findMany({
      where,
      include: { store: { select: { name: true } }, operator: { select: { real_name: true } } },
      orderBy: { id: 'desc' },
    });
    const data = sales.map((r) => ({
      '编号': r.id,
      '单号': r.order_no,
      '门店': r.store?.name || '',
      '商品': r.model_name || '',
      '数量': r.quantity,
      '单价': r.unit_price || 0,
      '应收': r.total_amount || 0,
      '实收': r.actual_amount || 0,
      '找零': r.change_amount || 0,
      '客户': r.customer_name || '',
      '客户电话': r.customer_phone || '',
      '收银员': r.operator?.real_name || '',
      '时间': r.created_at?.toISOString().slice(0, 16).replace('T', ' ') || '',
      '备注': r.remark || '',
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = Object.keys(data[0] || {}).map((k) => ({ wch: Math.max(k.length * 2, 12) }));
    XLSX.utils.book_append_sheet(wb, ws, '销售记录');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=sales_${dateStr}.xlsx`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;
