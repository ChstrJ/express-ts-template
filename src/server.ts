import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import logger from './common/utils/logger';
import apiRoutes from '@routes/api';
import globalErrorHandler from '@middlewares/error-handler';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { limiter } from '@middlewares/rate-limiter';
import { maintenance } from '@middlewares/maintenance';
import { config } from './config';
import { NotFoundError } from '@utils/errors';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Global middleware
app.use(limiter);
app.use(express.json());
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
  throw new NotFoundError('Route not found.');
});

app.use(globalErrorHandler);

// Start the server
server
  .listen(config.app.port, () => {
    logger.info(`Server running on port ${config.app.port}`);
  })
  .on('error', (error) => {
    logger.error(`Error starting server: ${error.message}`);
  });
