import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { apiRouter } from './routes/index.js';

export function createApp() {
  const app = express();

  const allowedOrigins = env.CLIENT_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isAllowedOrigin = (origin: string | undefined) => {
    if (!origin) return true;
    return allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  };

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`CORS blocked origin: ${origin ?? 'unknown'}`));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api', apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
