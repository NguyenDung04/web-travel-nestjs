import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post as HttpPost,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PostMediaService } from './post_media.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreatePostMediaDto } from './dto/create-post-media.dto';
import { UpdatePostMediaDto } from './dto/update-post-media.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { UseInterceptors } from '@nestjs/common';

@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@Controller('post-media')
export class PostMediaController {
  constructor(private readonly postMediaService: PostMediaService) {}

  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.postMediaService.findAllActive(pagination);
    return ApiResponse.success(
      'Danh sách PostMedia đang hoạt động',
      result.data,
      result.meta,
    );
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.postMediaService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Danh sách PostMedia đã xóa mềm',
      result.data,
      result.meta,
    );
  }

  @Get('active/:postId/:mediaId')
  async findOneActive(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    const result = await this.postMediaService.findOneActive(postId, mediaId);
    return ApiResponse.success('Chi tiết PostMedia', result.data);
  }

  @Get('deleted/:postId/:mediaId')
  async findOneDeleted(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    const result = await this.postMediaService.findOneDeleted(postId, mediaId);
    return ApiResponse.success('Chi tiết PostMedia đã xóa mềm', result.data);
  }

  @HttpPost()
  async create(@Body() dto: CreatePostMediaDto) {
    const result = await this.postMediaService.create(dto);
    return ApiResponse.created('Tạo PostMedia thành công', result.data);
  }

  @Patch(':postId/:mediaId')
  async update(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Body() dto: UpdatePostMediaDto,
  ) {
    const result = await this.postMediaService.update(postId, mediaId, dto);
    return ApiResponse.success('Cập nhật PostMedia thành công', result.data);
  }

  @Delete('soft/:postId/:mediaId')
  async softDelete(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    const result = await this.postMediaService.softDelete(postId, mediaId);
    return ApiResponse.success('Đã xóa mềm PostMedia', result);
  }

  @Delete('soft/:postId')
  async softDeleteMany(@Param('postId', ParseIntPipe) postId: number) {
    const result = await this.postMediaService.softDeleteMany(postId);
    return ApiResponse.success('Đã xóa mềm nhiều PostMedia', result);
  }

  @HttpPost('restore/:postId/:mediaId')
  async restore(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    const result = await this.postMediaService.restore(postId, mediaId);
    return ApiResponse.success('Khôi phục PostMedia', result);
  }

  @HttpPost('restore/:postId')
  async restoreMany(@Param('postId', ParseIntPipe) postId: number) {
    const result = await this.postMediaService.restoreMany(postId);
    return ApiResponse.success('Khôi phục nhiều PostMedia', result);
  }

  @Delete('permanent/:postId/:mediaId')
  async permanentDelete(
    @Param('postId', ParseIntPipe) postId: number,
    @Param('mediaId', ParseIntPipe) mediaId: number,
  ) {
    const result = await this.postMediaService.permanentDelete(postId, mediaId);
    return ApiResponse.success('Đã xóa vĩnh viễn PostMedia', result);
  }
}
