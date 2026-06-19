import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import { testConnection } from './database/connection';
import { setupAssociations } from './models';
import routes from './routes';
import { errorHandler } from './middleware/validation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 19482;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('combined'));

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: '跨境临床样本出入境流转管理系统 API 服务运行正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

app.use('/api', routes);

app.use(errorHandler);

app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在',
  });
});

const startServer = async () => {
  try {
    await testConnection();
    setupAssociations();

    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗`);
      console.log(`║ 🚀 跨境临床样本出入境流转管理系统                         ║`);
      console.log(`║ 后端服务启动成功                                            ║`);
      console.log(`║ 服务地址: http://localhost:${PORT}                        ║`);
      console.log(`║ 健康检查: http://localhost:${PORT}/health                  ║`);
      console.log(`║ API 前缀: http://localhost:${PORT}/api                ║`);
      console.log(`╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

export default app;
