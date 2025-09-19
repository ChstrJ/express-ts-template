import dotenv from 'dotenv';

dotenv.config();

export const dbConfig = {
  pg: {
    PORT: process.env.PG_PORT,
    DATABASE: process.env.PG_DATABASE,
    USERNAME: process.env.PG_USERNAME,
    INTERNAL_DB_URL: process.env.PG_INTERNAL_DB_URL,
    EXTERNAL_DB_URL: process.env.PG_EXTERNAL_DB_URL
  },
  mysql: {
    HOST: process.env.MYSQL_HOST,
    PORT: parseInt(process.env.MYSQL_PORT || '3306'),
    USER: process.env.MYSQL_USERNAME,
    PASSWORD: process.env.MYSQL_PASSWORD,
    NAME: process.env.MYSQL_DATABASE
  },
  mongodb: {}
};
