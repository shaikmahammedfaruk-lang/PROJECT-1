require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'faruk123',
      database: process.env.DB_NAME || 'easy_world_db',
    },
    pool: { min: 0, max: 10 },
    migrations: {
      directory: './migrations',
    },
  },
};