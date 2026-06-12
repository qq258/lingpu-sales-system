import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types';

export function storeScopeMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = req.user;
  if (!user) {
    res.status(401).json({ code: 401, message: '未认证' });
    return;
  }

  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

  if (isSuperAdmin) {
    const queryStoreId = req.query.store_id ? parseInt(req.query.store_id as string, 10) : req.query.storeId ? parseInt(req.query.storeId as string, 10) : undefined;
    const bodyStoreId = req.body?.store_id ? parseInt(req.body.store_id as string, 10) : undefined;
    const effective = queryStoreId || bodyStoreId;
    (req as any).effectiveStoreId = effective || undefined;
  } else {
    (req as any).effectiveStoreId = user.storeId;
  }

  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && req.body.store_id !== undefined) {
    if (!isSuperAdmin) {
      if (req.body.store_id !== user.storeId) {
        res.status(403).json({ code: 403, message: '无权操作其他门店数据' });
        return;
      }
    }
  }

  next();
}
