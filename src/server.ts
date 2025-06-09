import "reflect-metadata";
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import logger from './common/utils/logger';
import config from './config/config';
import apiRoutes from '@routes/api';
import errorHandler from '@middlewares/error-handler';
// import { container } from 'tsyringe'; // No longer needed for these registrations
// import { AccountRepository } from '@features/account/account.repository';

// Register AccountRepository before any controllers/services that depend on it are resolved
// container.register(AccountRepository, { useClass: AccountRepository }); // Relying on @singleton and @injectable
// import { AuthService } from '@features/auth/auth.service';

// Register AuthService
// container.register(AuthService, { useClass: AuthService }); // Relying on @singleton and @autoInjectable

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());
app.use(cors());
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

