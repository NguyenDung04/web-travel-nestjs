import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from 'src/model/entities/media.entity';
import { User } from 'src/model/entities/user.entity';
import { Post } from 'src/model/entities/post.entity';
import { Slider } from 'src/model/entities/slider.entity';
import { MulterModule } from '@nestjs/platform-express';
import { imageMulterOptions } from 'src/config/upload.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Media, User, Post, Slider]),
    MulterModule.register(imageMulterOptions),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
