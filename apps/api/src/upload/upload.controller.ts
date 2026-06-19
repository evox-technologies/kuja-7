import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { createClient } from '@supabase/supabase-js';
import type { Profile } from '@prisma/client';

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: Profile,
  ) {
    if (!file) throw new BadRequestException('No file provided');

    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype))
      throw new BadRequestException('Only JPEG, PNG, and WebP images are allowed');

    if (file.size > 5 * 1024 * 1024)
      throw new BadRequestException('File size must be under 5MB');

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const ext = file.originalname.split('.').pop() ?? 'jpg';
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('profile-images')
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });

    if (error) throw new BadRequestException(`Upload failed: ${error.message}`);

    const { data } = supabase.storage.from('profile-images').getPublicUrl(path);
    return { url: data.publicUrl };
  }
}
