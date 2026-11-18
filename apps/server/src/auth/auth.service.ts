import {
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { DatabaseService } from '../database/database.service.js';
import { AppService } from '../app.service.js';
import { CloudinaryService } from '../common/services/cloudinary.service.js';
import { MailService } from '../common/services/mail.service.js';
import type { AuthenticatedUser, ProviderCategory, UserRole } from './provider-categories.js';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string | null;
  google_subject: string | null;
  profile_image_url: string | null;
  phone: string | null;
  role: UserRole;
  email_verified: boolean;
}

interface GoogleProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
}

type AuthResponse = { accessToken: string; tokenType: 'Bearer'; user: AuthenticatedUser };

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly database: DatabaseService,
    private readonly app: AppService,
    private readonly cloudinary: CloudinaryService,
    private readonly mail: MailService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedSuperadmin();
  }

  async login(emailInput: string, password: string): Promise<AuthResponse> {
    const result = await this.database.query<UserRow>(
      `SELECT id, full_name, email, password_hash, google_subject, profile_image_url, phone, role, email_verified
       FROM users WHERE lower(email) = lower($1)`,
      [emailInput.trim()],
    );
    const user = result.rows[0];
    if (!user?.password_hash || !(await compare(password, user.password_hash))) {
      throw new UnauthorizedException('Email or password is incorrect.');
    }
    if (!user.email_verified) throw new ForbiddenException('Please verify your email before signing in. You can request a new verification email.');
    return this.issueTokens(user);
  }

  async createManagedAccount(input: { fullName: string; email: string; role?: 'user' | 'admin' }, creator: AuthenticatedUser) {
    const role = input.role ?? 'user';
    if (role === 'admin' && creator.role !== 'superadmin') {
      throw new ForbiddenException('Only a superadmin can grant administrator access.');
    }
    const email = input.email.trim().toLowerCase();
    const id = randomUUID();
    const unusablePasswordHash = await hash(randomBytes(48).toString('hex'), 12);
    let created: UserRow;
    try {
      const result = await this.database.query<UserRow>(
        `INSERT INTO users (id, full_name, email, password_hash, role, email_verified)
         VALUES ($1, $2, $3, $4, $5, false)
         RETURNING id, full_name, email, password_hash, google_subject, profile_image_url, phone, role, email_verified`,
        [id, input.fullName.trim(), email, unusablePasswordHash, role],
      );
      created = result.rows[0];
    } catch (error) {
      if (this.isUniqueViolation(error)) throw new ConflictException('An account with this email already exists.');
      throw error;
    }
    try {
      await this.sendActionLink(created, 'invite');
    } catch (error) {
      await this.database.query('DELETE FROM users WHERE id = $1', [created.id]);
      throw error;
    }
    return { id: created.id, fullName: created.full_name, email: created.email, role: created.role, message: 'Account created. A secure password setup link has been sent.' };
  }

  async listUsers(searchInput = '') {
    const search = searchInput.trim().slice(0, 120);
    const result = await this.database.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.email_verified, u.profile_image_url,
              u.created_at, a.status AS provider_status
       FROM users u LEFT JOIN LATERAL (
         SELECT status FROM provider_applications WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1
       ) a ON true
       WHERE ($1 = '' OR u.full_name ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%')
       ORDER BY u.created_at DESC LIMIT 300`, [search],
    );
    return result.rows;
  }

  async updateUserRole(userId: string, role: UserRole, actor: AuthenticatedUser) {
    if (userId === actor.id) throw new ForbiddenException('You cannot change your own account role.');
    if (role !== 'user' && actor.role !== 'superadmin') {
      throw new ForbiddenException('Only a superadmin can grant administrator access.');
    }
    const target = await this.database.query<{ role: UserRole }>('SELECT role FROM users WHERE id = $1', [userId]);
    if (!target.rowCount) throw new NotFoundException('User account not found.');
    if (target.rows[0].role === 'superadmin' && actor.role !== 'superadmin') {
      throw new ForbiddenException('Only a superadmin can change a superadmin account.');
    }
    const result = await this.database.query(
      `UPDATE users SET role = $2, updated_at = now() WHERE id = $1
       RETURNING id, full_name, email, role, updated_at`, [userId, role],
    );
    return result.rows[0];
  }

  async deleteManagedAccount(userId: string, actor: AuthenticatedUser) {
    if (userId === actor.id) throw new ForbiddenException('You cannot delete your own account.');

    return this.database.transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(20261118)');
      const target = await client.query<{ role: UserRole }>(
        'SELECT role FROM users WHERE id = $1 FOR UPDATE', [userId],
      );
      if (!target.rowCount) throw new NotFoundException('User account not found.');
      if (target.rows[0].role === 'superadmin') {
        const count = await client.query<{ count: string }>("SELECT count(*)::text AS count FROM users WHERE role = 'superadmin'");
        if (Number(count.rows[0].count) <= 1) {
          throw new ForbiddenException('The last superadmin account cannot be deleted.');
        }
      }
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      return { deleted: true, id: userId };
    });
  }

  async getProfile(userId: string) {
    const result = await this.database.query(
      `SELECT id, full_name, email, profile_image_url, phone, role, email_verified, (password_hash IS NOT NULL) AS has_password
       FROM users WHERE id = $1`, [userId],
    );
    const profile = result.rows[0];
    if (!profile) throw new NotFoundException('Account not found.');
    const disciplineResult = await this.database.query<{ discipline: ProviderCategory }>(
      'SELECT discipline FROM user_disciplines WHERE user_id = $1 ORDER BY discipline', [userId],
    );
    return {
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      profileImageUrl: profile.profile_image_url,
      phone: profile.phone,
      role: profile.role,
      emailVerified: profile.email_verified,
      hasPassword: profile.has_password,
      disciplines: disciplineResult.rows.map((row) => row.discipline),
    };
  }

  async updateProfile(userId: string, input: { fullName: string; disciplines: ProviderCategory[]; currentPassword?: string; newPassword?: string }) {
    let passwordHash: string | undefined;
    if (input.newPassword) {
      if (!input.currentPassword) throw new BadRequestException('Enter your current password to change it.');
      const current = await this.database.query<{ password_hash: string | null }>(
        'SELECT password_hash FROM users WHERE id = $1', [userId],
      );
      if (!current.rowCount) throw new NotFoundException('Account not found.');
      if (!current.rows[0].password_hash || !(await compare(input.currentPassword, current.rows[0].password_hash))) {
        throw new UnauthorizedException('Your current password is incorrect.');
      }
      passwordHash = await hash(input.newPassword, 12);
    }

    await this.database.transaction(async (client) => {
      await client.query(
        `UPDATE users SET full_name = $2, password_hash = COALESCE($3, password_hash), updated_at = now()
         WHERE id = $1`, [userId, input.fullName.trim(), passwordHash ?? null],
      );
      await client.query('DELETE FROM user_disciplines WHERE user_id = $1', [userId]);
      for (const discipline of input.disciplines) {
        await client.query('INSERT INTO user_disciplines (user_id, discipline) VALUES ($1, $2)', [userId, discipline]);
      }
    });
    return this.getProfile(userId);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const userId = await this.consumeActionToken('verify', token);
    const result = await this.database.query('UPDATE users SET email_verified = true, updated_at = now() WHERE id = $1 RETURNING id', [userId]);
    if (!result.rowCount) throw new UnauthorizedException('Verification link is invalid or expired.');
    return { message: 'Email verified. You can now sign in.' };
  }

  async resendVerification(emailInput: string): Promise<{ message: string }> {
    const email = emailInput.trim().toLowerCase();
    const result = await this.database.query<UserRow>(
      `SELECT id, full_name, email, password_hash, google_subject, profile_image_url, phone, role, email_verified FROM users WHERE lower(email) = $1`, [email],
    );
    // Keep this response identical for known and unknown addresses.
    if (result.rows[0] && !result.rows[0].email_verified) await this.sendActionLink(result.rows[0], 'verify');
    return { message: 'If the account needs verification, a new link has been sent.' };
  }

  async requestPasswordReset(emailInput: string): Promise<{ message: string }> {
    const result = await this.database.query<UserRow>(
      `SELECT id, full_name, email, password_hash, google_subject, profile_image_url, phone, role, email_verified FROM users WHERE lower(email) = $1`,
      [emailInput.trim().toLowerCase()],
    );
    // Do not reveal whether an account exists.
    if (result.rows[0]?.password_hash) await this.sendActionLink(result.rows[0], 'reset');
    return { message: 'If an account exists for that email, a password reset link has been sent.' };
  }

  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    const userId = await this.consumeActionToken('reset', token);
    const passwordHash = await hash(password, 12);
    const result = await this.database.query('UPDATE users SET password_hash = $2, email_verified = true, updated_at = now() WHERE id = $1 RETURNING id', [userId, passwordHash]);
    if (!result.rowCount) throw new UnauthorizedException('Reset link is invalid or expired.');
    return { message: 'Password updated. You can now sign in.' };
  }

  private async sendActionLink(user: UserRow, action: 'verify' | 'reset' | 'invite'): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashActionToken(token);
    const tokenAction = action === 'invite' ? 'reset' : action;
    try {
      await this.app.setRedisValue(`auth:${tokenAction}:${tokenHash}`, user.id, 60 * 60);
    } catch {
      throw new ServiceUnavailableException('Email actions are temporarily unavailable. Please try again.');
    }
    const configuredFrontendUrl = this.config.get<string>('PUBLIC_URL') || this.config.get<string>('FRONTEND_URL');
    const frontendUrl = configuredFrontendUrl?.replace(/\/$/, '')
      || (this.config.get<string>('NODE_ENV') === 'production' ? '' : 'http://localhost:2000');
    if (!frontendUrl) {
      throw new ServiceUnavailableException('Email links are not configured. Set PUBLIC_URL or FRONTEND_URL to the deployed client URL.');
    }
    const link = `${frontendUrl}/${action === 'verify' ? 'verify-email' : 'reset-password'}?token=${encodeURIComponent(token)}`;
    const isVerify = action === 'verify';
    const isInvite = action === 'invite';
    const title = isVerify ? 'Confirm your email address' : isInvite ? 'Your JaynStan account is ready' : 'Reset your password';
    const actionLabel = isVerify ? 'Verify email' : isInvite ? 'Set up your account' : 'Choose a new password';
    const description = isVerify ? 'Confirm your email to finish setting up your JaynStan account.' : isInvite ? 'A JaynStan account has been created for you. Set a password to activate it and sign in.' : 'We received a request to change your JaynStan password.';
    const sent = await this.mail.sendBrandedEmail({
      to: user.email,
      subject: isVerify ? 'Verify your JaynStan email' : isInvite ? 'Your JaynStan account is ready' : 'Reset your JaynStan password',
      preheader: isVerify ? 'One quick step to verify your email.' : isInvite ? 'Set a password to access your JaynStan account.' : 'Use this secure link to choose a new password.',
      eyebrow: isVerify ? 'Email verification' : isInvite ? 'Team invitation' : 'Password reset',
      title,
      bodyHtml: `<p>Hello ${this.escapeHtml(user.full_name)},</p><p>${description}</p>`,
      bodyText: `Hello ${user.full_name},\n\n${description}`,
      action: { label: actionLabel, url: link },
      note: 'This secure link expires in one hour. If you did not expect this email, contact the JaynStan team.',
    });
    if (!sent) throw new ServiceUnavailableException('We could not send the email. Please try again later.');
  }

  private async consumeActionToken(action: 'verify' | 'reset', token: string): Promise<string> {
    if (!/^[a-f0-9]{64}$/i.test(token)) throw new UnauthorizedException('Link is invalid or expired.');
    let userId: string | null;
    try { userId = await this.app.consumeRedisValue(`auth:${action}:${this.hashActionToken(token)}`); }
    catch { throw new ServiceUnavailableException('Email actions are temporarily unavailable. Please try again.'); }
    if (!userId) throw new UnauthorizedException('Link is invalid or expired.');
    return userId;
  }

  private hashActionToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
  }

  async authenticateAccessToken(token: string): Promise<AuthenticatedUser> {
    let payload: { sub?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub?: string }>(token);
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired.');
    }
    if (!payload.sub) throw new UnauthorizedException('Access token is invalid.');
    const result = await this.database.query<UserRow>(
      `SELECT id, full_name, email, password_hash, google_subject, profile_image_url, phone, role, email_verified
       FROM users WHERE id = $1`,
      [payload.sub],
    );
    if (!result.rows[0]) throw new UnauthorizedException('Account is no longer available.');
    return this.toPublicUser(result.rows[0]);
  }

  async getMe(userId: string): Promise<AuthenticatedUser> {
    const result = await this.database.query<UserRow>(
      `SELECT id, full_name, email, password_hash, google_subject, profile_image_url, phone, role, email_verified
       FROM users WHERE id = $1`,
      [userId],
    );
    if (!result.rows[0]) throw new NotFoundException('Account not found.');
    return this.toPublicUser(result.rows[0]);
  }

  createGoogleState(): string {
    return randomBytes(32).toString('hex');
  }

  getGoogleAuthorizationUrl(state: string): string {
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) throw new ServiceUnavailableException('Google sign-in is not configured.');
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: this.googleCallbackUrl(),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async finishGoogleSignIn(code: string, state: string, cookieState: string): Promise<string> {
    if (!state || !cookieState || !this.safeEqual(state, cookieState)) {
      throw new ForbiddenException('Google sign-in state check failed. Please try again.');
    }
    const clientId = this.config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.config.get<string>('GOOGLE_CLIENT_SECRET');
    if (!clientId || !clientSecret) throw new ServiceUnavailableException('Google sign-in is not configured.');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: this.googleCallbackUrl(),
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!tokenResponse.ok) throw new UnauthorizedException('Google could not complete sign-in.');
    const tokenData = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenData.access_token) throw new UnauthorizedException('Google did not return an access token.');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { authorization: `Bearer ${tokenData.access_token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!profileResponse.ok) throw new UnauthorizedException('Could not read the Google account profile.');
    const profile = (await profileResponse.json()) as GoogleProfile;
    if (!profile.sub || !profile.email || !profile.email_verified) {
      throw new UnauthorizedException('Google sign-in requires a verified email address.');
    }

    const user = await this.findOrCreateGoogleUser(profile);
    const exchangeCode = randomBytes(32).toString('hex');
    try {
      await this.app.setRedisValue(`auth:google-exchange:${exchangeCode}`, user.id, 90);
    } catch {
      throw new ServiceUnavailableException('Sign-in is temporarily unavailable. Please try again.');
    }
    return exchangeCode;
  }

  async exchangeGoogleCode(code: string): Promise<AuthResponse> {
    let userId: string | null;
    try {
      userId = await this.app.consumeRedisValue(`auth:google-exchange:${code}`);
    } catch {
      throw new ServiceUnavailableException('Sign-in is temporarily unavailable. Please try again.');
    }
    if (!userId) throw new UnauthorizedException('Google sign-in code is invalid or expired.');
    const result = await this.database.query<UserRow>(
      `SELECT id, full_name, email, password_hash, google_subject, profile_image_url, phone, role, email_verified
       FROM users WHERE id = $1`,
      [userId],
    );
    if (!result.rows[0]) throw new UnauthorizedException('Account is no longer available.');
    return this.issueTokens(result.rows[0]);
  }

  async createProviderApplication(userId: string, input: { fullName: string; phone: string; category: ProviderCategory }) {
    const id = randomUUID();
    try {
      const result = await this.database.query(
        `INSERT INTO provider_applications (id, user_id, full_name, phone, category)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, user_id, full_name, phone, category, status, review_note, reviewed_by, reviewed_at, created_at`,
        [id, userId, input.fullName.trim(), input.phone.trim(), input.category],
      );
      return result.rows[0];
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('You already have a provider application awaiting review.');
      }
      throw error;
    }
  }

  async getMyProviderApplication(userId: string) {
    const result = await this.database.query(
      `SELECT id, full_name, phone, category, status, review_note, reviewed_at, created_at
       FROM provider_applications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async listProviderApplications(status?: 'pending' | 'approved' | 'rejected') {
    const result = await this.database.query(
      `SELECT a.id, a.user_id, a.full_name, u.email, a.phone, a.category, a.status,
              a.review_note, a.reviewed_by, a.reviewed_at, a.created_at
       FROM provider_applications a JOIN users u ON u.id = a.user_id
       ${status ? 'WHERE a.status = $1' : ''}
       ORDER BY a.created_at ASC`,
      status ? [status] : [],
    );
    return result.rows;
  }

  async reviewProviderApplication(
    applicationId: string,
    reviewerId: string,
    decision: 'approved' | 'rejected',
    reviewNote?: string,
  ) {
    return this.database.transaction(async (client) => {
      const current = await client.query('SELECT status FROM provider_applications WHERE id = $1 FOR UPDATE', [applicationId]);
      if (!current.rowCount) throw new NotFoundException('Provider application not found.');
      if (current.rows[0].status !== 'pending') throw new ConflictException('This application has already been reviewed.');
      const result = await client.query(
        `UPDATE provider_applications
         SET status = $2, review_note = $3, reviewed_by = $4, reviewed_at = now(), updated_at = now()
         WHERE id = $1
         RETURNING id, user_id, full_name, phone, category, status, review_note, reviewed_by, reviewed_at, created_at`,
        [applicationId, decision, reviewNote?.trim() || null, reviewerId],
      );
      if (decision === 'approved') {
        await client.query(
          `UPDATE users SET full_name = $2, phone = $3, updated_at = now()
           WHERE id = $1`,
          [result.rows[0].user_id, result.rows[0].full_name, result.rows[0].phone],
        );
      }
      return result.rows[0];
    });
  }

  async revokeProviderApplication(applicationId: string, reviewerId: string, reviewNote?: string) {
    const result = await this.database.query(
      `UPDATE provider_applications SET status = 'rejected', review_note = $2, reviewed_by = $3,
       reviewed_at = now(), updated_at = now() WHERE id = $1 AND status = 'approved'
       RETURNING id, user_id, full_name, phone, category, status, review_note, reviewed_by, reviewed_at, created_at`,
      [applicationId, reviewNote?.trim() || 'Provider access was revoked by an administrator.', reviewerId],
    );
    if (!result.rowCount) throw new NotFoundException('Approved provider application not found.');
    return result.rows[0];
  }

  private async findOrCreateGoogleUser(profile: GoogleProfile): Promise<UserRow> {
    const email = profile.email.trim().toLowerCase();
    const existing = await this.database.query<UserRow>(
      `SELECT id, full_name, email, password_hash, google_subject, profile_image_url, phone, role, email_verified
       FROM users WHERE google_subject = $1 OR lower(email) = $2 LIMIT 1`,
      [profile.sub, email],
    );
    if (existing.rows[0]) {
      const user = existing.rows[0];
      if (user.google_subject && user.google_subject !== profile.sub) {
        throw new ConflictException('This email is already linked to a different Google account.');
      }
      const avatar = user.profile_image_url ?? (await this.storeGoogleProfileImage(profile.picture));
      const updated = await this.database.query<UserRow>(
        `UPDATE users SET google_subject = $2, email_verified = true,
           profile_image_url = COALESCE(profile_image_url, $3), updated_at = now()
         WHERE id = $1
         RETURNING id, full_name, email, password_hash, google_subject, profile_image_url, phone, role, email_verified`,
        [user.id, profile.sub, avatar],
      );
      return updated.rows[0];
    }

    throw new ForbiddenException('This Google account has not been invited to JaynStan. Contact an administrator for access.');
  }

  private async storeGoogleProfileImage(picture?: string): Promise<string | null> {
    if (!picture) return null;
    try {
      const url = new URL(picture);
      if (url.protocol !== 'https:' || !(url.hostname === 'googleusercontent.com' || url.hostname.endsWith('.googleusercontent.com'))) {
        return null;
      }
      const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(10000) });
      const contentType = response.headers.get('content-type')?.split(';')[0] ?? '';
      const declaredLength = Number(response.headers.get('content-length') ?? 0);
      if (!response.ok || !contentType.startsWith('image/') || declaredLength > 5 * 1024 * 1024) return null;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.byteLength > 5 * 1024 * 1024) return null;
      return await this.cloudinary.uploadProfileImage({ buffer, mimetype: contentType, originalname: 'google-profile' });
    } catch (error) {
      this.logger.warn(`Could not import Google profile image: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }

  private async issueTokens(row: UserRow): Promise<AuthResponse> {
    const user = this.toPublicUser(row);
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, tokenType: 'Bearer', user };
  }

  private toPublicUser(row: UserRow): AuthenticatedUser {
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      profileImageUrl: row.profile_image_url,
      phone: row.phone,
      role: row.role,
      emailVerified: row.email_verified,
    };
  }

  private googleCallbackUrl(): string {
    const baseUrl = this.config.get<string>('RENDER_EXTERNAL_URL')
      || this.config.get<string>('BACKEND_URL')
      || `http://localhost:${this.config.get<string>('PORT') || this.config.get<string>('SERVER_PORT', '2500')}`;
    return this.config.get<string>('GOOGLE_CALLBACK_URL') || `${baseUrl.replace(/\/$/, '')}/api/auth/google/callback`;
  }

  private async seedSuperadmin(): Promise<void> {
    const email = this.config.get<string>('SUPERADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('SUPERADMIN_PASSWORD');
    const fullName = this.config.get<string>('SUPERADMIN_NAME', 'Super Admin');
    if (!email || !password || password === 'change-this-before-use') {
      this.logger.warn('Superadmin seed skipped; set SUPERADMIN_EMAIL and a non-placeholder SUPERADMIN_PASSWORD in the root .env.');
      return;
    }
    const passwordHash = await hash(password, 12);
    await this.database.query(
      `INSERT INTO users (id, full_name, email, password_hash, role, email_verified)
       VALUES ($1, $2, $3, $4, 'superadmin', true)
       ON CONFLICT (lower(email)) DO UPDATE SET role = 'superadmin', updated_at = now()`,
      [randomUUID(), fullName, email, passwordHash],
    );
    this.logger.log('Configured superadmin account is ready.');
  }

  private safeEqual(left: string, right: string): boolean {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private isUniqueViolation(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
