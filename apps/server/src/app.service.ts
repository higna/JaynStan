import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';
import { DatabaseService } from './database/database.service.js';

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppService.name);
  private readonly redis: RedisClientType;

  constructor(private readonly config: ConfigService, private readonly database: DatabaseService) {
    this.redis = createClient({ url: this.config.get<string>('REDIS_URL') });
    this.redis.on('error', (error) => this.logger.error(`Redis connection error: ${error.message}`));
  }

  async onModuleInit() {
    try {
      await this.redis.connect();
    } catch (error) {
      this.logger.warn(`Redis is unavailable: ${error instanceof Error ? error.message : error}`);
    }
  }

  async onModuleDestroy() {
    if (this.redis.isOpen) await this.redis.quit();
  }

  async getDependencyStatus() {
    const dependencies: Record<string, 'connected' | 'unavailable'> = {
      postgres: 'unavailable',
      redis: 'unavailable',
    };

    try {
      await this.database.query('SELECT 1');
      dependencies.postgres = 'connected';
    } catch {}

    try {
      await this.redis.ping();
      dependencies.redis = 'connected';
    } catch {}

    return dependencies;
  }

  async getRedisValue(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async setRedisValue(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) await this.redis.set(key, value, { EX: ttlSeconds });
    else await this.redis.set(key, value);
  }

  async consumeRedisValue(key: string): Promise<string | null> {
    return this.redis.getDel(key);
  }

  getWelcomeHtml(): string {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:2000';
    const environment = this.config.get<string>('NODE_ENV') ?? 'development';

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="JaynStan creative services platform API">
  <title>JaynStan API</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: #11120f; color: #f7f4e9; }
    * { box-sizing: border-box; }
    body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; background: radial-gradient(ellipse at 15% 15%, #454017 0, transparent 48%), #11120f; }
    main { width: min(680px, 100%); padding: clamp(28px, 7vw, 56px); border: 1px solid #ffffff20; border-radius: 24px; background: #171813e8; box-shadow: 0 24px 80px #0008; }
    .eyebrow { color: #e8c547; font-size: .75rem; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; }
    h1 { margin: 14px 0; font-size: clamp(2.4rem, 8vw, 4rem); letter-spacing: -.06em; }
    p { color: #c8c6ba; line-height: 1.7; }
    .meta { display: flex; gap: 28px; margin: 28px 0; }
    .meta span { display: block; color: #99988e; font-size: .75rem; }
    .meta strong { display: block; margin-top: 5px; }
    nav { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
    a { display: inline-block; padding: 12px 16px; border: 1px solid #ffffff2b; border-radius: 10px; color: #f7f4e9; text-decoration: none; }
    a.primary { border-color: #e8c547; background: #e8c547; color: #171813; font-weight: 700; }
  </style>
</head>
<body>
  <main>
    <div class="eyebrow">Backend API · ${environment}</div>
    <h1>JaynStan</h1>
    <p>The creative services platform API. Manage creative profiles, services and portfolio work through the API.</p>
    <div class="meta"><div><span>API base</span><strong>/api</strong></div><div><span>Environment</span><strong>${environment}</strong></div></div>
    <nav><a class="primary" href="/api/docs">API documentation</a><a href="/health">Service health</a><a href="${frontendUrl}" target="_blank" rel="noreferrer">Open client</a></nav>
  </main>
</body>
</html>`;
  }
}
