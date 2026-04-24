import { Module } from '@nestjs/common';
import { PostMediaService } from './post_media.service';
import { PostMediaController } from './post_media.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostMedia } from 'src/model/entities/post-media.entity';
import { Media } from 'src/model/entities/media.entity';
import { Post } from 'src/model/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostMedia, Post, Media])],
  controllers: [PostMediaController],
  providers: [PostMediaService],
  exports: [PostMediaService],
})
export class PostMediaModule {}
