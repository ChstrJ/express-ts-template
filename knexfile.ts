import type { Knex } from 'knex';
import dotenv from 'dotenv';

dotenv.config();

const knexConfig: Knex.Config = {
  client: "mysql2",
  connection: {
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE,
  },
  migrations: {
    directory: "./src/database/migrations",
    extension: "ts",
  },
  seeds: {
    directory: './src/database/seeds',
    extension: 'ts',
  },
};

export default knexConfig;
