import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import { DB } from './types';
import { config } from '@config/index';

const dialect = new MysqlDialect({
  pool: createPool({
    host: config.db.mysql.host,
    port: config.db.mysql.port,
    user: config.db.mysql.user,
    password: config.db.mysql.password,
    database: config.db.mysql.database,
    decimalNumbers: true
  })
});

const db = new Kysely<DB>({
  dialect
});

export default db;
