import "reflect-metadata";
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from './common/utils/logger';
import config from './config/config';
import apiRoutes from '@routes/api';
import errorHandler from '@middlewares/error-handler';
import helmet from "helmet";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  return res.json({ message: 'It works!' });
});

app.use('/api', apiRoutes);

// Global middleware
app.use(errorHandler)

// Start the server
server.listen(config.app.nodePort, () => {
  logger.info(`Server running on port ${config.app.nodePort}`);
});

