import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseInterceptors,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@UseInterceptors(ResponseInterceptor)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.categoriesService.findAllActive(pagination);
    return ApiResponse.success(
      'Lấy danh sách danh mục hoạt động thành công',
      result.data,
      result.meta,
    );
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.categoriesService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Lấy danh sách danh mục đã xóa mềm thành công',
      result.data,
      result.meta,
    );
  }

  @Get('active/:id')
  async findOneActive(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoriesService.findOneActive(id);
    return ApiResponse.success(
      `Chi tiết category id=${id} thành công`,
      result.data,
    );
  }

  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoriesService.findOneDeleted(id);
    return ApiResponse.success(
      `Chi tiết category đã xóa mềm id=${id} thành công`,
      result.data,
    );
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto) {
    const result = await this.categoriesService.create(dto);
    return ApiResponse.created('Tạo category thành công', result.data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    const result = await this.categoriesService.update(id, dto);
    return ApiResponse.success(
      `Cập nhật category id=${id} thành công`,
      result.data,
    );
  }

  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoriesService.softDelete(id);
    return ApiResponse.success(
      `Đã xóa mềm category id=${id} thành công`,
      result,
    );
  }

  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    const result = await this.categoriesService.softDeleteMany(ids);
    return ApiResponse.success(`Đã xóa mềm ${ids.length} category`, result);
  }

  @Post('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoriesService.restore(id);
    return ApiResponse.success(
      `Khôi phục category id=${id} thành công`,
      result,
    );
  }

  @Post('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    const result = await this.categoriesService.restoreMany(ids);
    return ApiResponse.success(`Đã khôi phục ${ids.length} category`, result);
  }

  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoriesService.permanentDelete(id);
    return ApiResponse.success(
      `Đã xóa vĩnh viễn category id=${id} thành công`,
      result,
    );
  }
}
