import { BadRequestException, ForbiddenException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import type { ProviderCategory } from '../auth/provider-categories.js';
import { CloudinaryService, type ImageUpload } from '../common/services/cloudinary.service.js';

type WorkInput = {
  title: string;
  category: ProviderCategory;
  description: string;
  imageUrl?: string;
  workUrl?: string;
  contentType?: 'project' | 'website' | 'pdf' | 'video' | 'writing' | 'event' | 'class';
  body?: string;
  offer?: string;
  startsAt?: string;
  endsAt?: string;
};

@Injectable()
export class FeaturedWorksService {
  constructor(private readonly database: DatabaseService, private readonly cloudinary: CloudinaryService) {}

  async listPublic() {
    const result = await this.database.query(
      `SELECT id, title, category, description, image_url AS "imageUrl", work_url AS "workUrl",
              content_type AS "contentType", content_body AS body, offer, starts_at AS "startsAt", ends_at AS "endsAt"
       FROM featured_works WHERE is_featured = true ORDER BY updated_at DESC LIMIT 6`,
    );
    return result.rows;
  }

  async listPortfolio() {
    const result = await this.database.query(
      `SELECT id, title, category, description, image_url AS "imageUrl", work_url AS "workUrl",
              content_type AS "contentType", content_body AS body, offer, starts_at AS "startsAt", ends_at AS "endsAt"
       FROM featured_works ORDER BY created_at DESC`,
    );
    return result.rows;
  }

  async listAdmin() {
    const result = await this.database.query(
      `SELECT id, title, category, description, image_url AS "imageUrl", work_url AS "workUrl",
              content_type AS "contentType", content_body AS body, offer, starts_at AS "startsAt", ends_at AS "endsAt",
              is_featured AS "isFeatured", created_at AS "createdAt"
       FROM featured_works ORDER BY is_featured DESC, created_at DESC`,
    );
    return result.rows;
  }

  async listMine(userId: string) {
    const result = await this.database.query(
      `SELECT id, title, category, description, image_url AS "imageUrl", work_url AS "workUrl",
              content_type AS "contentType", content_body AS body, offer, starts_at AS "startsAt", ends_at AS "endsAt",
              is_featured AS "isFeatured", created_at AS "createdAt"
       FROM featured_works WHERE created_by = $1 ORDER BY created_at DESC`, [userId],
    );
    return result.rows;
  }

  async createProviderWork(userId: string, input: WorkInput, file?: ImageUpload, isAdmin = false) {
    this.validateContent(input);
    if (!file) throw new BadRequestException('Choose an image for your work.');
    const approval = isAdmin ? null : await this.database.query(
      `SELECT 1 FROM provider_applications WHERE user_id = $1 AND status = 'approved' LIMIT 1`, [userId],
    );
    if (!isAdmin && !approval?.rowCount) throw new ForbiddenException('Your provider application must be approved before you can advertise work.');
    let imageUrl: string;
    try { imageUrl = await this.cloudinary.uploadImage(file, 'portfolio'); }
    catch { throw new ServiceUnavailableException('Image upload is unavailable. Please check Cloudinary configuration and try again.'); }
    return this.insertWork(input, imageUrl, userId);
  }

  async removeMine(userId: string, id: string) {
    const result = await this.database.query('DELETE FROM featured_works WHERE id = $1 AND created_by = $2 RETURNING id', [id, userId]);
    if (!result.rowCount) throw new NotFoundException('Your work item was not found.');
    return { deleted: true };
  }

  async create(input: WorkInput & { imageUrl: string }, adminId: string) {
    this.validateContent(input);
    return this.insertWork(input, input.imageUrl, adminId);
  }

  private async insertWork(input: WorkInput, imageUrl: string, creatorId: string) {
    const result = await this.database.query(
      `INSERT INTO featured_works (id, title, category, description, image_url, work_url, content_type, content_body, offer, starts_at, ends_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, title, category, description, image_url AS "imageUrl", work_url AS "workUrl", content_type AS "contentType",
         content_body AS body, offer, starts_at AS "startsAt", ends_at AS "endsAt", is_featured AS "isFeatured"`,
      [randomUUID(), input.title.trim(), input.category, input.description.trim(), imageUrl.trim(), input.workUrl?.trim() || null,
        input.contentType ?? 'project', input.body?.trim() || null, input.offer?.trim() || null, input.startsAt || null, input.endsAt || null, creatorId],
    );
    return result.rows[0];
  }

  async setFeatured(id: string, isFeatured: boolean) {
    return this.database.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(2500, 6565)');
      const current = await client.query('SELECT is_featured FROM featured_works WHERE id = $1 FOR UPDATE', [id]);
      if (!current.rowCount) throw new NotFoundException('Featured work item not found.');
      if (isFeatured && !current.rows[0].is_featured) {
        const count = await client.query('SELECT count(*)::int AS count FROM featured_works WHERE is_featured = true');
        if (count.rows[0].count >= 6) throw new BadRequestException('The homepage can show up to six featured works.');
      }
      const result = await client.query(
        `UPDATE featured_works SET is_featured = $2, updated_at = now() WHERE id = $1
         RETURNING id, title, category, is_featured AS "isFeatured"`, [id, isFeatured],
      );
      return result.rows[0];
    });
  }

  async update(id: string, input: WorkInput & { imageUrl: string }) {
    this.validateContent(input);
    const result = await this.database.query(
      `UPDATE featured_works SET title = $2, category = $3, description = $4, image_url = $5,
         work_url = $6, content_type = $7, content_body = $8, offer = $9, starts_at = $10, ends_at = $11, updated_at = now() WHERE id = $1
       RETURNING id, title, category, description, image_url AS "imageUrl", work_url AS "workUrl", content_type AS "contentType",
         content_body AS body, offer, starts_at AS "startsAt", ends_at AS "endsAt", is_featured AS "isFeatured"`,
      [id, input.title.trim(), input.category, input.description.trim(), input.imageUrl.trim(), input.workUrl?.trim() || null,
        input.contentType ?? 'project', input.body?.trim() || null, input.offer?.trim() || null, input.startsAt || null, input.endsAt || null],
    );
    if (!result.rowCount) throw new NotFoundException('Work item not found.');
    return result.rows[0];
  }

  async remove(id: string) {
    const result = await this.database.query('DELETE FROM featured_works WHERE id = $1 RETURNING id', [id]);
    if (!result.rowCount) throw new NotFoundException('Featured work item not found.');
    return { deleted: true };
  }

  private validateContent(input: WorkInput) {
    const kind = input.contentType ?? 'project';
    const url = input.workUrl?.trim();
    if (['website', 'pdf', 'video'].includes(kind) && !url) throw new BadRequestException('This content type requires a destination link.');
    if (kind === 'pdf' && url) {
      const hostname = new URL(url).hostname.toLowerCase();
      if (!(hostname === 'drive.google.com' || hostname === 'docs.google.com')) {
        throw new BadRequestException('PDF work must use a Google Drive or Google Docs viewer URL.');
      }
    }
    if (kind === 'video' && url) {
      const hostname = new URL(url).hostname.toLowerCase();
      if (!(hostname === 'youtu.be' || hostname === 'youtube.com' || hostname.endsWith('.youtube.com'))) {
        throw new BadRequestException('Video work must use a YouTube link.');
      }
    }
    if (kind === 'writing' && !input.body?.trim()) throw new BadRequestException('Writing content requires a body.');
  }
}
