import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';
import { JWT_SECRET, JWT_EXPIRES_IN, ApiResponse, UserRole } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      const r: ApiResponse = { code: 400, message: '请输入用户名和密码' };
      return res.status(400).json(r);
    }

    const user = await prisma.sys_user.findUnique({ where: { username } });
    if (!user || user.status === 0) {
      const r: ApiResponse = { code: 401, message: '用户名或密码错误' };
      return res.status(401).json(r);
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      const r: ApiResponse = { code: 401, message: '用户名或密码错误' };
      return res.status(401).json(r);
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role, storeId: user.store_id },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any },
    );

    let stores: any[] | undefined;
    if (user.role === UserRole.SUPER_ADMIN) {
      stores = await prisma.sys_store.findMany({
        where: { status: 1 },
        select: { id: true, name: true, code: true },
      });
    }

    const data: any = {
      token,
      userInfo: {
        id: user.id,
        username: user.username,
        realName: user.real_name,
        role: user.role,
        storeId: user.store_id,
      },
    };
    if (stores) {
      data.stores = stores;
    }

    const r: ApiResponse = { code: 200, message: '登录成功', data };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '登录失败' };
    return res.status(500).json(r);
  }
});

router.get('/userinfo', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.sys_user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        username: true,
        real_name: true,
        role: true,
        store_id: true,
        status: true,
        created_at: true,
      },
    });

    if (!user) {
      const r: ApiResponse = { code: 404, message: '用户不存在' };
      return res.status(404).json(r);
    }

    let store = null;
    if (user.store_id) {
      store = await prisma.sys_store.findUnique({
        where: { id: user.store_id },
        select: { id: true, name: true, code: true },
      });
    }

    let stores: any[] | undefined;
    if (user.role === UserRole.SUPER_ADMIN) {
      stores = await prisma.sys_store.findMany({
        where: { status: 1 },
        select: { id: true, name: true, code: true },
      });
    }

    const r: ApiResponse = { code: 200, message: 'success', data: { ...user, store, stores } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.post('/register', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== UserRole.SUPER_ADMIN) {
      const r: ApiResponse = { code: 403, message: '权限不足' };
      return res.status(403).json(r);
    }

    const { username, password, real_name, role, store_id } = req.body;
    if (!username || !password || !real_name) {
      const r: ApiResponse = { code: 400, message: '缺少必填字段' };
      return res.status(400).json(r);
    }

    const exists = await prisma.sys_user.findUnique({ where: { username } });
    if (exists) {
      const r: ApiResponse = { code: 400, message: '用户名已存在' };
      return res.status(400).json(r);
    }

    if (store_id) {
      const store = await prisma.sys_store.findUnique({ where: { id: store_id } });
      if (!store) {
        const r: ApiResponse = { code: 400, message: '门店不存在' };
        return res.status(400).json(r);
      }
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await prisma.sys_user.create({
      data: {
        username,
        password: hashedPassword,
        real_name,
        role: role || UserRole.OPERATOR,
        store_id: store_id || null,
      },
      select: {
        id: true,
        username: true,
        real_name: true,
        role: true,
        store_id: true,
        created_at: true,
      },
    });

    const r: ApiResponse = { code: 200, message: '注册成功', data: user };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

export default router;
