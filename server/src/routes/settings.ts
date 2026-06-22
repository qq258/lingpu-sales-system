import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/settings/:key — 公开接口，无需登录（小票打印时调用）
router.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const setting = await prisma.sys_setting.findUnique({ where: { key } });
    const r: ApiResponse = {
      code: 200,
      message: 'success',
      data: setting ? { key: setting.key, value: setting.value } : { key, value: '' },
    };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

// PUT /api/settings/:key — 需登录
router.put('/:key', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    if (value === undefined) {
      const r: ApiResponse = { code: 400, message: 'value 不能为空' };
      return res.status(400).json(r);
    }

    const setting = await prisma.sys_setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    const r: ApiResponse = { code: 200, message: '保存成功', data: { key: setting.key, value: setting.value } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;
