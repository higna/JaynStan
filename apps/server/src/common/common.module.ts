import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service.js';
import { MailService } from './services/mail.service.js';

@Global()
@Module({
  providers: [MailService, CloudinaryService],
  exports: [MailService, CloudinaryService],
})
export class CommonModule {}
