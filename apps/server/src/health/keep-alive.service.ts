import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppService } from '../app.service.js';

const KEEP_ALIVE_KEY = 'health:keep-alive:enabled';
const INTERVAL_MINUTES = 10;
const PING_TIMEOUT_MS = 10_000;

export interface KeepAliveState {
  enabled: boolean;
  intervalMinutes: number;
  lastPingAt: string | null;
  lastPingOk: boolean;
  lastPingError: string | null;
  pingCount: number;
  pingUrl: string;
}

export interface PingResult {
  ok: boolean;
  error: string | null;
  url: string;
  at: string;
}

@Injectable()
export class KeepAliveService implements OnApplicationBootstrap {
  private readonly logger = new Logger(KeepAliveService.name);
  private readonly pingUrl: string;
  private enabled = false;
  private lastPingAt: Date | null = null;
  private lastPingOk = false;
  private lastPingError: string | null = null;
  private pingCount = 0;
  private lastToggleAt = 0;
  private lastManualPingAt = 0;

  constructor(
    private readonly app: AppService,
    private readonly config: ConfigService,
  ) {
    this.pingUrl = this.resolvePingUrl();
  }

  async onApplicationBootstrap(): Promise<void> {
    try {
      this.enabled = (await this.app.getRedisValue(KEEP_ALIVE_KEY)) === '1';
      if (this.enabled) {
        this.logger.log(`Keep-alive enabled (${INTERVAL_MINUTES}-minute interval) -> ${this.pingUrl}`);
      }
    } catch (error) {
      this.enabled = false;
      this.logger.warn(`Could not read keep-alive state from Redis; defaulting to disabled: ${this.errorMessage(error)}`);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES, { name: 'keepAlivePing' })
  async pingSelf(): Promise<void> {
    if (this.enabled) await this.pingNow();
  }

  async pingNow(): Promise<PingResult> {
    this.pingCount += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);

    try {
      const response = await fetch(this.pingUrl, { signal: controller.signal });
      this.lastPingAt = new Date();
      this.lastPingOk = response.ok;
      this.lastPingError = response.ok ? null : `HTTP ${response.status}`;
      if (response.ok) this.logger.log(`Keep-alive ping ${this.pingUrl} -> ${response.status}`);
      else this.logger.warn(`Keep-alive ping ${this.pingUrl} -> ${response.status}`);
    } catch (error) {
      this.lastPingAt = new Date();
      this.lastPingOk = false;
      this.lastPingError = this.errorMessage(error);
      this.logger.warn(`Keep-alive ping failed: ${this.lastPingError}`);
    } finally {
      clearTimeout(timeout);
    }

    return {
      ok: this.lastPingOk,
      error: this.lastPingError,
      url: this.pingUrl,
      at: this.lastPingAt.toISOString(),
    };
  }

  async toggle(): Promise<KeepAliveState> {
    const now = Date.now();
    if (now - this.lastToggleAt < 2000) {
      throw new HttpException('Wait a moment before changing keep-alive again', HttpStatus.TOO_MANY_REQUESTS);
    }

    await this.persist(this.enabled ? '0' : '1');
    this.enabled = !this.enabled;
    this.lastToggleAt = now;
    if (this.enabled) await this.pingNow();
    return this.getState();
  }

  async manualPing(): Promise<PingResult> {
    const now = Date.now();
    if (now - this.lastManualPingAt < 2000) {
      throw new HttpException('Wait a moment before sending another ping', HttpStatus.TOO_MANY_REQUESTS);
    }
    this.lastManualPingAt = now;
    return this.pingNow();
  }

  getState(): KeepAliveState {
    return {
      enabled: this.enabled,
      intervalMinutes: INTERVAL_MINUTES,
      lastPingAt: this.lastPingAt?.toISOString() ?? null,
      lastPingOk: this.lastPingOk,
      lastPingError: this.lastPingError,
      pingCount: this.pingCount,
      pingUrl: this.pingUrl,
    };
  }

  private resolvePingUrl(): string {
    const renderUrl = (this.config.get<string>('RENDER_EXTERNAL_URL') ?? '').replace(/\/$/, '');
    const backendUrl = (this.config.get<string>('BACKEND_URL') ?? '').replace(/\/api(?:\/v\d+)?\/?$/i, '').replace(/\/$/, '');
    const publicUrl = (this.config.get<string>('PUBLIC_URL') ?? '').replace(/\/$/, '');
    const path = this.config.get<string>('KEEP_ALIVE_PING_PATH', '/health/live');
    const base = renderUrl || backendUrl || publicUrl || `http://localhost:${this.config.get<string>('SERVER_PORT', '2500')}`;
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
  }

  private async persist(value: '0' | '1'): Promise<void> {
    try {
      await this.app.setRedisValue(KEEP_ALIVE_KEY, value);
    } catch (error) {
      this.logger.error(`Could not persist keep-alive state: ${this.errorMessage(error)}`);
      throw new ServiceUnavailableException('Keep-alive state could not be saved. Check the Redis connection and try again.');
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
