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
import { HotelsService } from './hotels.service';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@UseInterceptors(ResponseInterceptor)
@Controller('hotels')
export class HotelsController {
  constructor(private readonly hotelsService: HotelsService) {}

  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.hotelsService.findAllActive(pagination);
    return ApiResponse.success(
      'Lấy danh sách khách sạn hoạt động',
      result.data,
      result.meta,
    );
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.hotelsService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Lấy danh sách khách sạn đã xóa mềm',
      result.data,
      result.meta,
    );
  }

  @Get('active/:id')
  async findOneActive(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelsService.findOneActive(id);
    return ApiResponse.success(`Chi tiết khách sạn id=${id}`, result.data);
  }

  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelsService.findOneDeleted(id);
    return ApiResponse.success(
      `Chi tiết khách sạn đã xóa mềm id=${id}`,
      result.data,
    );
  }

  @Post()
  async create(@Body() dto: CreateHotelDto) {
    const result = await this.hotelsService.create(dto);
    return ApiResponse.created('Tạo khách sạn thành công', result.data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHotelDto,
  ) {
    const result = await this.hotelsService.update(id, dto);
    return ApiResponse.success(`Cập nhật khách sạn id=${id}`, result.data);
  }

  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelsService.softDelete(id);
    return ApiResponse.success(`Đã xóa mềm khách sạn id=${id}`, result);
  }

  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    const result = await this.hotelsService.softDeleteMany(ids);
    return ApiResponse.success(`Đã xóa mềm ${ids.length} khách sạn`, result);
  }

  @Post('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelsService.restore(id);
    return ApiResponse.success(`Khôi phục khách sạn id=${id}`, result);
  }

  @Post('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    const result = await this.hotelsService.restoreMany(ids);
    return ApiResponse.success(`Đã khôi phục ${ids.length} khách sạn`, result);
  }

  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelsService.permanentDelete(id);
    return ApiResponse.success(`Đã xóa vĩnh viễn khách sạn id=${id}`, result);
  }

  @Get(':id/rooms')
  async getRoomsByHotel(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelsService.getRoomsByHotel(id);
    return ApiResponse.success(
      `Danh sách loại phòng của khách sạn id=${id}`,
      result.data,
    );
  }
}
