import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import './scheduler.ts';
import compression from 'compression';
import logger from './common/utils/logger';
import config from './config/config';
import apiRoutes from '@routes/api';
import errorHandler from '@middlewares/error-handler';
import helmet from 'helmet';
import { NotFoundException } from '@utils/errors';
import dotenv from 'dotenv';
import { initSentry } from '@lib/sentry';
import { limiter } from '@middlewares/rate-limiter';
import { maintenance } from '@middlewares/maintenance';

dotenv.config();

const app = express();
const server = http.createServer(app);

initSentry();

// Middleware
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({ origin: config.app.appUrls, credentials: true }));
app.use(helmet());
app.use(cookieParser());
app.use(compression());
app.use(maintenance);

app.get('/', (req, res) => {
  res.json({ message: 'It works!' });
});

app.use('/api/v1', apiRoutes);

app.use(() => {
  throw new NotFoundException('Route not found.');
});

// Global middleware
app.use(errorHandler);

// Start the server
server
  .listen(config.app.nodePort, () => {
    logger.info(`Server running on port ${config.app.nodePort}`);
  })
  .on('error', (error) => {
    logger.error(`Error starting server: ${error.message}`);
  });
