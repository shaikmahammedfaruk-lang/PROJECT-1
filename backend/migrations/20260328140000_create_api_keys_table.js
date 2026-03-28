/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('api_keys', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('key_name', 100).notNullable();
    table.string('api_key', 255).unique().notNullable();
    table.string('last_used_at', 255);
    table.integer('usage_count').defaultTo(0);
    table.boolean('is_active').defaultTo(true).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('expires_at');

    // Indexes
    table.index('user_id');
    table.index('api_key');
    table.index(['is_active', 'expires_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('api_keys');
};
