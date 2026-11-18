import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthenticatedUser } from '../auth/provider-categories.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateFeaturedWorkDto } from './dto/create-featured-work.dto.js';
import { SetFeaturedWorkDto } from './dto/set-featured-work.dto.js';
import { CreateProviderWorkDto } from './dto/create-provider-work.dto.js';
import type { ImageUpload } from '../common/services/cloudinary.service.js';
import { FeaturedWorksService } from './featured-works.service.js';

@ApiTags('Featured works')
@Controller()
export class FeaturedWorksController {
  constructor(private readonly works: FeaturedWorksService) {}

  @Get('featured-works')
  @ApiOperation({ summary: 'List administrator-selected featured work for the homepage' })
  listPublic() { return this.works.listPublic(); }

  @Get('works')
  @ApiOperation({ summary: 'List public portfolio work for the services page' })
  listPortfolio() { return this.works.listPortfolio(); }

  @Get('provider/works')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'List the current provider’s advertised work' })
  listMine(@CurrentUser() user: AuthenticatedUser) { return this.works.listMine(user.id); }

  @Post('provider/works')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['title', 'category', 'description', 'image'], properties: {
    title: { type: 'string' }, category: { type: 'string', enum: ['software-development', 'graphic-design', 'artwork-painting', 'architecture'] },
    description: { type: 'string' }, workUrl: { type: 'string' }, image: { type: 'string', format: 'binary' },
  } } })
  @ApiOperation({ summary: 'Advertise provider work after the application is approved; upload image to Cloudinary' })
  createProviderWork(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProviderWorkDto, @UploadedFile() file?: ImageUpload) {
    if (file && !file.mimetype.startsWith('image/')) throw new BadRequestException('The work image must be an image file.');
    return this.works.createProviderWork(user.id, dto, file, user.role === 'admin' || user.role === 'superadmin');
  }

  @Delete('provider/works/:id')
  @UseGuards(JwtAuthGuard) @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove the current provider’s work' })
  removeMine(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.works.removeMine(user.id, id);
  }

  @Get('admin/featured-works')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'superadmin') @ApiBearerAuth()
  @ApiOperation({ summary: 'List all featured-work candidates for administrators' })
  listAdmin() { return this.works.listAdmin(); }

  @Post('admin/featured-works')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'superadmin') @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a work item that an administrator can feature on the homepage' })
  create(@Body() dto: CreateFeaturedWorkDto, @CurrentUser() admin: AuthenticatedUser) { return this.works.create(dto, admin.id); }

  @Patch('admin/featured-works/:id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'superadmin') @ApiBearerAuth()
  @ApiOperation({ summary: 'Feature or unfeature a work item' })
  setFeatured(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SetFeaturedWorkDto) {
    return this.works.setFeatured(id, dto.isFeatured);
  }

  @Put('admin/featured-works/:id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'superadmin') @ApiBearerAuth()
  @ApiOperation({ summary: 'Edit a portfolio work item' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CreateFeaturedWorkDto) {
    return this.works.update(id, dto);
  }

  @Delete('admin/featured-works/:id')
  @UseGuards(JwtAuthGuard, RolesGuard) @Roles('admin', 'superadmin') @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a featured-work item' })
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.works.remove(id); }
}
