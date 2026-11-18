import { BadRequestException, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export type SocialPlatform = 'facebook' | 'whatsapp' | 'twitter';

@Injectable()
export class SiteSettingsService {
  constructor(private readonly database: DatabaseService) {}

  async getSocialLinks() {
    const result = await this.database.query(
      `SELECT platform, url, is_enabled AS enabled FROM social_links ORDER BY
       CASE platform WHEN 'facebook' THEN 1 WHEN 'twitter' THEN 2 ELSE 3 END`,
    );
    return result.rows;
  }

  async updateSocialLinks(links: Array<{ platform: SocialPlatform; url?: string | null; enabled: boolean }>, adminId: string) {
    return this.database.transaction(async (client) => {
      for (const link of links) {
        await client.query(
          `INSERT INTO social_links (platform, url, is_enabled, updated_by, updated_at)
           VALUES ($1, $2, $3, $4, now())
           ON CONFLICT (platform) DO UPDATE SET url = EXCLUDED.url, is_enabled = EXCLUDED.is_enabled,
             updated_by = EXCLUDED.updated_by, updated_at = now()`,
          [link.platform, link.url?.trim() || null, link.enabled && Boolean(link.url?.trim()), adminId],
        );
      }
      const result = await client.query(
        `SELECT platform, url, is_enabled AS enabled FROM social_links ORDER BY
         CASE platform WHEN 'facebook' THEN 1 WHEN 'twitter' THEN 2 ELSE 3 END`,
      );
      return result.rows;
    });
  }

  async getHomepageStats() {
    const result = await this.database.query(
      `SELECT stat_key AS key, label, value, unit FROM homepage_stats ORDER BY sort_order ASC`,
    );
    return result.rows;
  }

  async updateHomepageStats(stats: Array<{ key: string; label: string; value: string; unit: string }>, adminId: string) {
    const allowed = new Set(['clients', 'satisfaction', 'disciplines', 'collective']);
    if (stats.length !== 4 || new Set(stats.map((stat) => stat.key)).size !== 4 || stats.some((stat) => !allowed.has(stat.key))) {
      throw new BadRequestException('Exactly one value is required for each homepage statistic.');
    }
    return this.database.transaction(async (client) => {
      for (const stat of stats) {
        await client.query(
          `UPDATE homepage_stats SET label = $2, value = $3, unit = $4, updated_by = $5, updated_at = now()
           WHERE stat_key = $1`,
          [stat.key, stat.label.trim(), stat.value.trim(), stat.unit.trim(), adminId],
        );
      }
      const result = await client.query('SELECT stat_key AS key, label, value, unit FROM homepage_stats ORDER BY sort_order ASC');
      return result.rows;
    });
  }
}
