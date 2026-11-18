import { BadRequestException, Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/provider-categories.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { UpdateSocialLinksDto } from './dto/update-social-links.dto.js';
import { UpdateHomepageStatsDto } from './dto/update-homepage-stats.dto.js';
import { SiteSettingsService } from './site-settings.service.js';

@ApiTags('Site settings')
@Controller()
export class SiteSettingsController {
  constructor(private readonly settings: SiteSettingsService) {}

  @Get('site-settings/social-links')
  @ApiOperation({ summary: 'Read the configured social links displayed on the site' })
  getSocialLinks() { return this.settings.getSocialLinks(); }

  @Get('admin/site-settings/social-links')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'superadmin') @ApiBearerAuth()
  @ApiOperation({ summary: 'Read editable social links for administrators' })
  getAdminSocialLinks() { return this.settings.getSocialLinks(); }

  @Put('admin/site-settings/social-links')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'superadmin') @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Facebook, WhatsApp, Twitter, and Instagram links' })
  updateSocialLinks(@Body() dto: UpdateSocialLinksDto, @CurrentUser() admin: AuthenticatedUser) {
    if (new Set(dto.links.map((link) => link.platform)).size !== 3) {
      throw new BadRequestException('Provide exactly one setting for Facebook, X/Twitter, and WhatsApp.');
    }
    return this.settings.updateSocialLinks(dto.links, admin.id);
  }

  @Get('site-settings/homepage-stats')
  @ApiOperation({ summary: 'Get the four editable homepage statistics' })
  getHomepageStats() { return this.settings.getHomepageStats(); }

  @Get('admin/site-settings/homepage-stats')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'superadmin') @ApiBearerAuth()
  @ApiOperation({ summary: 'Read homepage statistics for editing' })
  getAdminHomepageStats() { return this.settings.getHomepageStats(); }

  @Put('admin/site-settings/homepage-stats')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'superadmin') @ApiBearerAuth()
  @ApiOperation({ summary: 'Update wording, figures, and units for four homepage statistics' })
  updateHomepageStats(@Body() dto: UpdateHomepageStatsDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.settings.updateHomepageStats(dto.stats, admin.id);
  }
}
