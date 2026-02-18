import type { Knex } from 'knex';
import dotenv from 'dotenv';
import { config } from '@config/index';

dotenv.config();

const knexConfig: Knex.Config = {
  client: "mysql2",
  connection: {
    host: config.db.mysql.host,
    port: config.db.mysql.port,
    user: config.db.mysql.user,
    password: config.db.mysql.password,
    database: config.db.mysql.database,
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
