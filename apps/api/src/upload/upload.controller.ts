import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { createClient } from '@supabase/supabase-js';
import type { Profile } from '@prisma/client';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: Profile,
  ) {
    if (!file) {
      this.logger.warn(`uploadImage – no file provided: userId=${user.id}`);
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      this.logger.warn(
        `uploadImage – rejected mimetype "${file.mimetype}": userId=${user.id}`,
      );
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');
    }

    if (file.size > MAX_SIZE_BYTES) {
      this.logger.warn(
        `uploadImage – file too large (${file.size} bytes): userId=${user.id}`,
      );
      throw new BadRequestException('File size must be under 5 MB');
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      this.logger.error(
        'uploadImage – SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured',
      );
      throw new InternalServerErrorException('Storage service is not configured');
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    this.logger.log(
      `uploadImage – uploading to path="${path}" size=${file.size} type=${file.mimetype} userId=${user.id}`,
    );

    const { error } = await supabase.storage
      .from('profile-images')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) {
      this.logger.error(
        `uploadImage – Supabase upload failed for path="${path}" userId=${user.id}: ${error.message}`,
      );
      throw new InternalServerErrorException('Image upload failed. Please try again.');
    }

    const { data } = supabase.storage.from('profile-images').getPublicUrl(path);

    this.logger.log(
      `uploadImage – upload successful: path="${path}" url=${data.publicUrl} userId=${user.id}`,
    );

    return { url: data.publicUrl };
  }
}
