import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import logger from './common/utils/logger';
import config from './config/config';
import apiRoutes from '@routes/api';
import errorHandler from '@middlewares/error-handler';
import helmet from 'helmet';
import { NotFoundException } from '@utils/errors';
import dotenv from 'dotenv';
import { limiter } from '@middlewares/rate-limiter';
import { maintenance } from '@middlewares/maintenance';

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
  throw new NotFoundException('Route not found.');
});

app.use(errorHandler);

// Start the server
server
  .listen(config.app.nodePort, () => {
    logger.info(`Server running on port ${config.app.nodePort}`);
  })
  .on('error', (error) => {
    logger.error(`Error starting server: ${error.message}`);
  });
