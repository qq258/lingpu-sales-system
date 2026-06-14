import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse, UserRole } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

function checkSuperAdmin(req: Request, res: Response): boolean {
  if (req.user!.role !== UserRole.SUPER_ADMIN) {
    const r: ApiResponse = { code: 403, message: '仅超级管理员可管理门店' };
    res.status(403).json(r);
    return false;
  }
  return true;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
    const stores = await prisma.sys_store.findMany({
      where: isSuperAdmin ? undefined : { id: req.user!.storeId ?? undefined },
      orderBy: { id: 'asc' },
    });
    const r: ApiResponse = { code: 200, message: 'success', data: stores };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;

    if (!isSuperAdmin && req.user!.storeId !== id) {
      const r: ApiResponse = { code: 403, message: '无权查看其他门店信息' };
      return res.status(403).json(r);
    }

    const store = await prisma.sys_store.findUnique({ where: { id } });
    if (!store) {
      const r: ApiResponse = { code: 404, message: '门店不存在' };
      return res.status(404).json(r);
    }
    const r: ApiResponse = { code: 200, message: 'success', data: store };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    if (!checkSuperAdmin(req, res)) return;
    const { name, code, address, phone } = req.body;
    if (!name || !code) {
      const r: ApiResponse = { code: 400, message: '门店名称和编码不能为空' };
      return res.status(400).json(r);
    }
    const store = await prisma.sys_store.create({
      data: { name, code, address, phone },
    });
    const r: ApiResponse = { code: 200, message: '创建成功', data: store };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!checkSuperAdmin(req, res)) return;
    const id = parseInt(req.params.id);
    const { name, code, address, phone, status } = req.body;
    const store = await prisma.sys_store.update({
      where: { id },
      data: { name, code, address, phone, status },
    });
    const r: ApiResponse = { code: 200, message: '更新成功', data: store };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!checkSuperAdmin(req, res)) return;
    const id = parseInt(req.params.id);

    const userCount = await prisma.sys_user.count({ where: { store_id: id } });
    if (userCount > 0) {
      const r: ApiResponse = { code: 400, message: '该门店下存在用户，无法删除' };
      return res.status(400).json(r);
    }

    await prisma.sys_store.delete({ where: { id } });
    const r: ApiResponse = { code: 200, message: '删除成功' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;
