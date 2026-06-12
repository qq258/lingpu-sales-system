import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiResponse } from '../types';
import { authMiddleware } from '../middleware/auth';

const router = Router();

const uploadDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 jpg/jpeg/png/gif/webp 格式图片'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(authMiddleware);

router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      const r: ApiResponse = { code: 400, message: '请选择文件' };
      return res.status(400).json(r);
    }

    const imagePath = `/uploads/${req.file.filename}`;
    const r: ApiResponse = { code: 200, message: '上传成功', data: { image_path: imagePath, filename: req.file.filename } };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '上传失败' };
    return res.status(500).json(r);
  }
});

router.post('/upload/multi', upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      const r: ApiResponse = { code: 400, message: '请选择文件' };
      return res.status(400).json(r);
    }

    const results = files.map((f) => ({
      image_path: `/uploads/${f.filename}`,
      filename: f.filename,
    }));

    const r: ApiResponse = { code: 200, message: '上传成功', data: results };
    return res.json(r);
  } catch (err: any) {
    const r: ApiResponse = { code: 500, message: err.message || '上传失败' };
    return res.status(500).json(r);
  }
});

export default router;
