export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  STORE_ADMIN = 'store_admin',
  OPERATOR = 'operator',
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: string;
  storeId: number | null;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const JWT_SECRET = process.env.JWT_SECRET || 'phone-sales-jwt-secret-key-2024';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const PORT = parseInt(process.env.PORT || '3000', 10);
export const UPLOAD_DIR = process.env.UPLOAD_DIR || '../uploads';
export const DATABASE_URL = process.env.DATABASE_URL || 'file:../data/database.sqlite';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
