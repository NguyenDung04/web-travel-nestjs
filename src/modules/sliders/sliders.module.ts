import { Module } from '@nestjs/common';
import { SlidersService } from './sliders.service';
import { SlidersController } from './sliders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Slider } from 'src/model/entities/slider.entity';
import { Media } from 'src/model/entities/media.entity';
import { Post } from 'src/model/entities/post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Slider, Media, Post])],
  controllers: [SlidersController],
  providers: [SlidersService],
  exports: [SlidersService],
})
export class SlidersModule {}
