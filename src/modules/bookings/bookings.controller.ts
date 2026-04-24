import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@UseInterceptors(ResponseInterceptor)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // 1️⃣ Lấy tất cả (trừ xóa mềm)
  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.bookingsService.findAllActive(pagination);
    return ApiResponse.success(
      'Lấy danh sách booking đang hoạt động thành công',
      result.data,
      result.meta,
    );
  }

  // 2️⃣ Lấy tất cả (chỉ có xóa mềm)
  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.bookingsService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Lấy danh sách booking đã bị xóa mềm thành công',
      result.data,
      result.meta,
    );
  }

  // 3️⃣ Lấy chi tiết (trừ xóa mềm)
  @Get('active/:id')
  async findOneActive(@Param('id', ParseIntPipe) id: number) {
    const result = await this.bookingsService.findOneActive(id);
    return ApiResponse.success(
      `Lấy chi tiết booking id=${id} thành công`,
      result.data,
    );
  }

  // 4️⃣ Lấy chi tiết (chỉ có xóa mềm)
  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const result = await this.bookingsService.findOneDeleted(id);
    return ApiResponse.success(
      `Lấy chi tiết booking đã xóa mềm id=${id} thành công`,
      result.data,
    );
  }

  // 5️⃣ Thêm mới
  @Post()
  async create(@Body() dto: CreateBookingDto) {
    const result = await this.bookingsService.create(dto);
    return ApiResponse.created('Tạo booking thành công', result.data);
  }

  // 6️⃣ Cập nhật
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingDto,
  ) {
    const result = await this.bookingsService.update(id, dto);
    return ApiResponse.success(
      `Cập nhật booking id=${id} thành công`,
      result.data,
    );
  }

  // 7️⃣ Xóa mềm 1
  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.bookingsService.softDelete(id);
    return ApiResponse.success(
      `Đã xóa mềm booking id=${id} thành công`,
      result,
    );
  }

  // 8️⃣ Xóa mềm nhiều
  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    const result = await this.bookingsService.softDeleteMany(ids);
    return ApiResponse.success(
      `Đã xóa mềm ${ids.length} booking thành công`,
      result,
    );
  }

  // 9️⃣ Khôi phục 1
  @Post('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.bookingsService.restore(id);
    return ApiResponse.success(
      `Đã khôi phục booking id=${id} thành công`,
      result,
    );
  }

  // 🔟 Khôi phục nhiều
  @Post('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    const result = await this.bookingsService.restoreMany(ids);
    return ApiResponse.success(
      `Đã khôi phục ${ids.length} booking thành công`,
      result,
    );
  }

  // 11️⃣ Xóa vĩnh viễn (admin)
  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.bookingsService.permanentDelete(id);
    return ApiResponse.success(
      `Đã xóa vĩnh viễn booking id=${id} thành công`,
      result,
    );
  }
}
