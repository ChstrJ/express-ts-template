import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRoutes from '@routes/api';
import { Server } from 'socket.io';
import http from 'http';
import { join } from 'path';

const app = express();
const server = http.createServer(app);
const io = new Server(server);

io.on('connection', (socket) => {
  console.log('a user connected');
});

app.use(express.json());
app.use(helmet());
app.use(cors());
app.use(cookieParser());

// Routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.use('/api', apiRoutes);

// Global error handler (should be after routes)

export default app;
