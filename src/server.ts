import "reflect-metadata";
import { container } from "tsyringe";
import { AccountRepository } from "@features/account/account.repository";
import { AuthService } from "@features/auth/auth.service";
import { AuthController } from "@features/auth/auth.controller";
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from './common/utils/logger';
import config from './config/config';
import apiRoutes from '@routes/api';
import errorHandler from '@middlewares/error-handler';

container.registerSingleton(AccountRepository);
container.registerSingleton(AuthService);
container.registerSingleton(AuthController);

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'It works!' });
});


app.use('/api', apiRoutes);

// Global middleware
app.use(errorHandler)

// Start the server
server.listen(config.app.nodePort, () => {
  logger.info(`Server running on port ${config.app.nodePort}`);
});

