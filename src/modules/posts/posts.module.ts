import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from 'src/model/entities/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/model/entities/category.entity';
import { User } from 'src/model/entities/user.entity';
import { Media } from 'src/model/entities/media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Media, User, Category])],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
