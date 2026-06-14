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

router.get('/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const where: any = {};
    const currentRole = req.user!.role;

    // 权限可见性规则：
    // - 操作员只能看操作员
    // - 门店管理员能看操作员和门店管理员（看不到超管）
    // - 超级管理员能看所有
    if (currentRole === UserRole.OPERATOR) {
      where.role = UserRole.OPERATOR;
      where.store_id = req.user!.storeId;
    } else if (currentRole === UserRole.STORE_ADMIN) {
      where.role = { in: [UserRole.OPERATOR, UserRole.STORE_ADMIN] };
      where.store_id = req.user!.storeId;
    }

    const users = await prisma.sys_user.findMany({
      where,
      select: {
        id: true,
        username: true,
        real_name: true,
        role: true,
        store_id: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // 获取所有门店映射
    const storeIds = [...new Set(users.map(u => u.store_id).filter(Boolean))] as number[];
    const stores = storeIds.length > 0
      ? await prisma.sys_store.findMany({
          where: { id: { in: storeIds } },
          select: { id: true, name: true },
        })
      : [];
    const storeMap = new Map(stores.map(s => [s.id, s.name]));

    const list = users.map(u => ({
      id: u.id,
      username: u.username,
      realName: u.real_name,
      role: u.role,
      storeId: u.store_id,
      storeName: storeMap.get(u.store_id!) || null,
      status: u.status,
      createdAt: u.created_at,
    }));

    const r: ApiResponse = { code: 200, message: 'success', data: { list } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== UserRole.SUPER_ADMIN) {
      const r: ApiResponse = { code: 403, message: '权限不足' };
      return res.status(403).json(r);
    }

    const { id } = req.params;
    const { username, realName, role, storeId } = req.body;

    const user = await prisma.sys_user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      const r: ApiResponse = { code: 404, message: '用户不存在' };
      return res.status(404).json(r);
    }

    if (username && username !== user.username) {
      const exists = await prisma.sys_user.findUnique({ where: { username } });
      if (exists) {
        const r: ApiResponse = { code: 400, message: '用户名已存在' };
        return res.status(400).json(r);
      }
    }

    if (storeId) {
      const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
      if (!store) {
        const r: ApiResponse = { code: 400, message: '门店不存在' };
        return res.status(400).json(r);
      }
    }

    const updated = await prisma.sys_user.update({
      where: { id: Number(id) },
      data: {
        ...(username && { username }),
        ...(realName && { real_name: realName }),
        ...(role && { role }),
        store_id: storeId === undefined ? user.store_id : storeId,
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

    const r: ApiResponse = { code: 200, message: '更新成功', data: updated };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.put('/users/:id/reset-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== UserRole.SUPER_ADMIN) {
      const r: ApiResponse = { code: 403, message: '权限不足' };
      return res.status(403).json(r);
    }

    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      const r: ApiResponse = { code: 400, message: '密码至少6位' };
      return res.status(400).json(r);
    }

    const user = await prisma.sys_user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      const r: ApiResponse = { code: 404, message: '用户不存在' };
      return res.status(404).json(r);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await prisma.sys_user.update({
      where: { id: Number(id) },
      data: { password: hashedPassword },
    });

    const r: ApiResponse = { code: 200, message: '密码已重置' };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message };
    return res.status(500).json(r);
  }
});

router.delete('/users/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    if (req.user!.role !== UserRole.SUPER_ADMIN) {
      const r: ApiResponse = { code: 403, message: '权限不足' };
      return res.status(403).json(r);
    }

    const { id } = req.params;

    const user = await prisma.sys_user.findUnique({ where: { id: Number(id) } });
    if (!user) {
      const r: ApiResponse = { code: 404, message: '用户不存在' };
      return res.status(404).json(r);
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      const r: ApiResponse = { code: 400, message: '不能删除超级管理员' };
      return res.status(400).json(r);
    }

    if (user.id === req.user!.userId) {
      const r: ApiResponse = { code: 400, message: '不能删除自己' };
      return res.status(400).json(r);
    }

    await prisma.sys_user.delete({ where: { id: Number(id) } });

    const r: ApiResponse = { code: 200, message: '删除成功' };
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

    const { username, password, realName, role, storeId } = req.body;
    if (!username || !password || !realName) {
      const r: ApiResponse = { code: 400, message: '缺少必填字段' };
      return res.status(400).json(r);
    }

    const exists = await prisma.sys_user.findUnique({ where: { username } });
    if (exists) {
      const r: ApiResponse = { code: 400, message: '用户名已存在' };
      return res.status(400).json(r);
    }

    if (storeId) {
      const store = await prisma.sys_store.findUnique({ where: { id: storeId } });
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
        real_name: realName,
        role: role || UserRole.OPERATOR,
        store_id: storeId || null,
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
