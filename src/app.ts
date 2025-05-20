import 'reflect-metadata';
import express, { NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';

const app = express();

app.use(express.json());
app.use(helmet());
app.use(cors());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'It works!' });
});

// Global error handler (should be after routes)

export default app;
