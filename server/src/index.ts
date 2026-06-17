import express from 'express';
import cors from 'cors';
import path from 'path';
import { PORT } from './types';
import prisma from './utils/prisma';

import authRoutes from './routes/auth';
import storeRoutes from './routes/stores';
import productRoutes from './routes/products';
import purchaseRoutes from './routes/purchase';
import inventoryRoutes from './routes/inventory';
import transferRoutes from './routes/transfers';
import saleRoutes from './routes/sales';
import statsRoutes from './routes/stats';
import uploadRoutes from './routes/upload';
import toolsRoutes from './routes/tools';

const app = express();

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/stores', storeRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/purchase', purchaseRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/tools', toolsRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ code: 200, message: 'ok', data: { time: new Date().toISOString() } });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  res.status(status).json({
    code: status,
    message: err.message || '服务器内部错误',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  prisma.$connect().then(() => {
    console.log('Database connected');
  }).catch((err) => {
    console.error('Database connection failed:', err);
  });
});

export default app;
