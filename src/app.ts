import 'reflect-metadata';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import authRoutes from './features/auth/auth.route';

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'It works!' });
});

app.use('auth', authRoutes);

// Global error handler (should be after routes)

export default app;
