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
  UseInterceptors,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.postsService.findAllActive(pagination);
    return ApiResponse.success(
      'Danh sách bài viết đang hoạt động',
      result.data,
      result.meta,
    );
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.postsService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Danh sách bài viết đã xóa mềm',
      result.data,
      result.meta,
    );
  }

  @Get('active/:id')
  async findOneActive(@Param('id', ParseIntPipe) id: number) {
    const result = await this.postsService.findOneActive(id);
    return ApiResponse.success('Chi tiết bài viết', result.data);
  }

  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const result = await this.postsService.findOneDeleted(id);
    return ApiResponse.success('Chi tiết bài viết đã xóa mềm', result.data);
  }

  @HttpPost()
  async create(@Body() dto: CreatePostDto) {
    const result = await this.postsService.create(dto);
    return ApiResponse.created('Tạo bài viết thành công', result.data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
  ) {
    const result = await this.postsService.update(id, dto);
    return ApiResponse.success('Cập nhật bài viết thành công', result.data);
  }

  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.postsService.softDelete(id);
    return ApiResponse.success('Đã xóa mềm bài viết', result);
  }

  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    const result = await this.postsService.softDeleteMany(ids);
    return ApiResponse.success('Đã xóa mềm nhiều bài viết', result);
  }

  @HttpPost('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.postsService.restore(id);
    return ApiResponse.success('Khôi phục bài viết', result);
  }

  @HttpPost('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    const result = await this.postsService.restoreMany(ids);
    return ApiResponse.success('Khôi phục nhiều bài viết', result);
  }

  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.postsService.permanentDelete(id);
    return ApiResponse.success('Đã xóa vĩnh viễn bài viết', result);
  }
}
