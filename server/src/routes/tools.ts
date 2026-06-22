import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';
import * as XLSX from 'xlsx';
import multer from 'multer';

const router = Router();
router.use(authMiddleware);

const upload = multer({ dest: path.resolve(__dirname, '../../uploads/temp/') });

// 表名映射
const TABLE_MAP: Record<string, { label: string; model: string }> = {
  suppliers: { label: '供应商', model: 'pch_supplier' },
  inventory: { label: '库存', model: 'wh_inventory' },
  sales: { label: '销售记录', model: 'sale_order' },
  brands: { label: '品牌', model: 'pdt_brand' },
  models: { label: '型号', model: 'pdt_model' },
  purchase_entries: { label: '入库记录', model: 'pch_purchase_entry' },
  inventory_logs: { label: '库存流水', model: 'wh_inventory_log' },
};

// 获取所有可操作的表列表
router.get('/tables', async (_req: Request, res: Response) => {
  try {
    const result: Array<{ key: string; label: string; count: number }> = [];
    for (const [key, info] of Object.entries(TABLE_MAP)) {
      try {
        const count = await (prisma as any)[info.model].count();
        result.push({ key, label: info.label, count });
      } catch {
        result.push({ key, label: info.label, count: 0 });
      }
    }
    const r: ApiResponse = { code: 200, message: 'success', data: result };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 下载整库备份
router.get('/backup/download', async (_req: Request, res: Response) => {
  try {
    const dbPath = path.resolve(__dirname, '../../data/database.sqlite');
    if (!fs.existsSync(dbPath)) {
      const r: ApiResponse = { code: 404, message: '数据库文件不存在' };
      return res.status(404).json(r);
    }
    const stat = fs.statSync(dbPath);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename=backup_${dateStr}.sqlite`);
    res.setHeader('Content-Length', stat.size);
    const stream = fs.createReadStream(dbPath);
    stream.pipe(res);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 按表导出 Excel
router.get('/export/:table', async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    if (!TABLE_MAP[table]) {
      const r: ApiResponse = { code: 400, message: `不支持的表: ${table}` };
      return res.status(400).json(r);
    }

    let data: any[] = [];
    const model = (prisma as any)[TABLE_MAP[table].model];

    switch (table) {
      case 'suppliers': {
        data = await model.findMany({
          select: { id: true, name: true, contact_person: true, phone: true, address: true, remark: true, status: true, created_at: true },
          orderBy: { id: 'desc' },
        });
        data = data.map((r: any) => ({
          '编号': r.id,
          '供应商名称': r.name,
          '联系人': r.contact_person || '',
          '联系电话': r.phone || '',
          '地址': r.address || '',
          '备注': r.remark || '',
          '状态': r.status === 1 ? '启用' : '禁用',
          '创建时间': formatDate(r.created_at),
        }));
        break;
      }
      case 'inventory': {
        const invData = await prisma.wh_inventory_imei.findMany({
          orderBy: { id: 'desc' },
          include: {
            model: { include: { brand: { select: { name: true } } } },
            store: { select: { name: true } },
          },
        });
        data = invData.map((r: any) => ({
          '品牌型号': `${r.model?.brand?.name || ''} ${r.model?.name || ''}`,
          'IMEI1': r.imei,
          'IMEI2': r.imei2 || '',
          'S/N码': r.sn_code || '',
          '是否售出': r.status !== 'in_stock' ? '是' : '否',
          '售出时间': r.status !== 'in_stock' && r.sold_at ? formatDate(r.sold_at) : '',
          '所在门店': r.store?.name || '',
          '状态': r.status === 'in_stock' ? '在库' : '已售',
          '创建时间': formatDate(r.created_at),
        }));
        break;
      }
      case 'sales': {
        const saleData = await model.findMany({
          include: { store: { select: { name: true } }, operator: { select: { real_name: true } } },
          orderBy: { id: 'desc' },
        });
        data = saleData.map((r: any) => ({
          '单号': r.order_no,
          '门店': r.store?.name || '',
          '商品': r.model_name || '',
          '数量': r.quantity,
          '单价': r.unit_price || 0,
          '应收': r.total_amount || 0,
          '实收': r.actual_amount || 0,
          '客户': r.customer_name || '',
          '收银员': r.operator?.real_name || '',
          '时间': formatDate(r.created_at),
          '备注': r.remark || '',
        }));
        break;
      }
      case 'brands': {
        const brandData = await model.findMany({
          include: { _count: { select: { models: true } } },
          orderBy: { id: 'asc' },
        });
        data = brandData.map((r: any) => ({
          '编号': r.id,
          '品牌名称': r.name,
          '描述': r.description || '',
          '型号数量': r._count?.models || 0,
          '状态': r.status === 1 ? '启用' : '禁用',
          '创建时间': formatDate(r.created_at),
        }));
        break;
      }
      case 'models': {
        const modelData = await model.findMany({
          include: { brand: { select: { name: true } } },
          orderBy: { id: 'asc' },
        });
        data = modelData.map((r: any) => ({
          '编号': r.id,
          '品牌': r.brand?.name || '',
          '型号名称': r.name,
          '颜色': r.color || '',
          '内存': r.memory || '',
          '售价': r.sale_price || 0,
          '成本价': r.cost_price || 0,
          '状态': r.status === 1 ? '启用' : '禁用',
        }));
        break;
      }
      case 'purchase_entries': {
        const entryData = await model.findMany({
          include: { store: { select: { name: true } }, supplier: { select: { name: true } }, operator: { select: { real_name: true } }, _count: { select: { items: true } } },
          orderBy: { id: 'desc' },
        });
        data = entryData.map((r: any) => ({
          '入库单号': r.entry_no || r.id,
          '门店': r.store?.name || '',
          '供应商': r.supplier?.name || '',
          '数量': r._count?.items || 0,
          '总金额': r.total_amount || 0,
          '状态': r.status === 'completed' ? '已完成' : '待确认',
          '操作人': r.operator?.real_name || '',
          '备注': r.remark || '',
          '创建时间': formatDate(r.created_at),
        }));
        break;
      }
      case 'inventory_logs': {
        const logData = await model.findMany({
          include: { model: { select: { name: true } }, store: { select: { name: true } } },
          orderBy: { id: 'desc' },
          take: 5000,
        });
        data = logData.map((r: any) => ({
          '编号': r.id,
          '门店': r.store?.name || '',
          '型号': r.model?.name || '',
          '变动类型': changeTypeLabel(r.change_type),
          '变动前数量': r.qty_before,
          '变动数量': r.qty_change,
          '变动后数量': r.qty_after,
          '备注': r.remark || '',
          '时间': formatDate(r.created_at),
        }));
        break;
      }
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // 列宽自适应
    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length * 2, 10),
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, TABLE_MAP[table].label);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `${TABLE_MAP[table].label}_${dateStr}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(buffer);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// 导入 Excel 到指定表
router.post('/import/:table', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { table } = req.params;
    if (!TABLE_MAP[table]) {
      const r: ApiResponse = { code: 400, message: `不支持的表: ${table}` };
      return res.status(400).json(r);
    }

    const file = req.file;
    if (!file) {
      const r: ApiResponse = { code: 400, message: '请上传 Excel 文件' };
      return res.status(400).json(r);
    }

    const wb = XLSX.readFile(file.path);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(ws);

    if (rows.length === 0) {
      const r: ApiResponse = { code: 400, message: 'Excel 文件为空' };
      return res.status(400).json(r);
    }

    // 删除临时文件
    fs.unlink(file.path, () => {});

    let success = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;
      try {
        switch (table) {
          case 'suppliers': {
            const name = row['供应商名称'] || row['name'];
            if (!name) { errors.push(`第${rowNum}行: 供应商名称不能为空`); continue; }
            await prisma.pch_supplier.create({
              data: {
                name,
                contact_person: row['联系人'] || row['contact_person'] || '',
                phone: row['联系电话'] || row['phone'] || '',
                address: row['地址'] || row['address'] || '',
                remark: row['备注'] || row['remark'] || '',
              },
            });
            success++;
            break;
          }
          case 'brands': {
            const name = row['品牌名称'] || row['name'];
            if (!name) { errors.push(`第${rowNum}行: 品牌名称不能为空`); continue; }
            const existing = await prisma.pdt_brand.findUnique({ where: { name } });
            if (existing) { errors.push(`第${rowNum}行: 品牌「${name}」已存在`); continue; }
            await prisma.pdt_brand.create({ data: { name, description: row['描述'] || row['description'] || '' } });
            success++;
            break;
          }
          default:
            errors.push(`第${rowNum}行: 表 ${table} 暂不支持导入`);
        }
      } catch (err: any) {
        errors.push(`第${rowNum}行: ${err.message}`);
      }
    }

    const r: ApiResponse = {
      code: 200,
      message: `导入完成: 成功 ${success} 条, 失败 ${errors.length} 条`,
      data: { success, errors },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

function formatDate(d: any): string {
  if (!d) return '';
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const mins = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}`;
}

function changeTypeLabel(type: string): string {
  const map: Record<string, string> = {
    purchase_in: '采购入库',
    sale_out: '销售出库',
    transfer_out: '调货出库',
    transfer_in: '调货入库',
    check_adjust: '盘点调整',
    initial: '期初录入',
  };
  return map[type] || type;
}

export default router;
