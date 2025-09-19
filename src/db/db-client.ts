import { Kysely, MysqlDialect } from 'kysely';
import { createPool } from 'mysql2';
import { dbConfig } from '@config/db';
import { DB } from './types';

const dialect = new MysqlDialect({
  pool: createPool({
    database: dbConfig.mysql.NAME,
    host: dbConfig.mysql.HOST,
    user: dbConfig.mysql.USER,
    password: dbConfig.mysql.PASSWORD,
    port: dbConfig.mysql.PORT,
    decimalNumbers: true
  })
});

const db = new Kysely<DB>({
  dialect
});

export default db;
