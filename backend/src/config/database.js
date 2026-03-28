const knex = require('knex');
const config = require('../../knexfile')

const environment = process.env.NODE_ENV || 'development';
const dbConfig = config[environment];

// Create Knex instance
const db = knex(dbConfig);

// Test connection (non-blocking)
db.raw('SELECT 1')
  .then(() => {
    console.log('Database connection established successfully');
  })
  .catch((err) => {
    console.warn('Database connection warning:', err.message);
    console.warn('Ensure PostgreSQL is running and credentials in .env are correct');
  });

module.exports = db;