import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('account', (table) => {
        table.uuid('account_id').primary();
        table.string('account_name').notNullable();
        table.string('account_email').notNullable().unique();
        table.string('account_password').notNullable();
        table.string('account_role').notNullable();
        table.string('account_status').notNullable();
        table.integer('created_at').nullable();
        table.integer('updated_at').nullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('account');
}