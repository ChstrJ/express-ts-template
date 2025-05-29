import dotenv from 'dotenv';


dotenv.config();

export const db = {
  pg: {
    PORT: process.env.PG_PORT,
    DATABASE: process.env.PG_DATABASE,
    USERNAME: process.env.PG_USERNAME,
    INTERNAL_DB_URL: process.env.PG_INTERNAL_DB_URL,
    EXTERNAL_DB_URL: process.env.PG_EXTERNAL_DB_URL
  },
  mysql: {

  },
  mongodb: {

  }
}
