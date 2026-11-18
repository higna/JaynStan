import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from 'pg';
import { dirname, join } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly pool: Pool;

  constructor(config: ConfigService) {
    this.pool = new Pool({ connectionString: config.get<string>('DATABASE_URL') });
  }

  async onModuleInit(): Promise<void> {
    await this.runMigrations();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  query<Row extends QueryResultRow = QueryResultRow>(sql: string, values?: unknown[]): Promise<QueryResult<Row>> {
    return this.pool.query<Row>(sql, values);
  }

  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async runMigrations(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version varchar(200) PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const migrationDir = join(dirname(fileURLToPath(import.meta.url)), 'migrations');
    const files = (await readdir(migrationDir)).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files) {
      const applied = await this.pool.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
      if (applied.rowCount) continue;

      const sql = await readFile(join(migrationDir, file), 'utf8');
      await this.transaction(async (client) => {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
      });
      this.logger.log(`Applied database migration ${file}`);
    }
  }
}
