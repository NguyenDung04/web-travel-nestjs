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
import { CreateHotelRoomImageDto } from './dto/create-hotel-room-image.dto';
import { UpdateHotelRoomImageDto } from './dto/update-hotel-room-image.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { HotelRoomImagesService } from './hotel_room_images.service';

@UseInterceptors(ResponseInterceptor)
@Controller('hotel-room-images')
export class HotelRoomImagesController {
  constructor(
    private readonly hotelRoomImagesService: HotelRoomImagesService,
  ) {}

  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.hotelRoomImagesService.findAllActive(pagination);
    return ApiResponse.success(
      'Lấy danh sách hình ảnh hoạt động thành công',
      result.data,
      result.meta,
    );
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.hotelRoomImagesService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Lấy danh sách hình ảnh đã xóa mềm',
      result.data,
      result.meta,
    );
  }

  @Get('active/:id')
  async findOneActive(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelRoomImagesService.findOneActive(id);
    return ApiResponse.success(`Chi tiết hình ảnh id=${id}`, result.data);
  }

  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelRoomImagesService.findOneDeleted(id);
    return ApiResponse.success(
      `Chi tiết hình ảnh đã xóa mềm id=${id}`,
      result.data,
    );
  }

  @Post()
  async create(@Body() dto: CreateHotelRoomImageDto) {
    const result = await this.hotelRoomImagesService.create(dto);
    return ApiResponse.created('Tạo hình ảnh thành công', result.data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateHotelRoomImageDto,
  ) {
    const result = await this.hotelRoomImagesService.update(id, dto);
    return ApiResponse.success(
      `Cập nhật hình ảnh id=${id} thành công`,
      result.data,
    );
  }

  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelRoomImagesService.softDelete(id);
    return ApiResponse.success(`Đã xóa mềm hình ảnh id=${id}`, result);
  }

  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    const result = await this.hotelRoomImagesService.softDeleteMany(ids);
    return ApiResponse.success(`Đã xóa mềm ${ids.length} hình ảnh`, result);
  }

  @Post('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelRoomImagesService.restore(id);
    return ApiResponse.success(`Đã khôi phục hình ảnh id=${id}`, result);
  }

  @Post('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    const result = await this.hotelRoomImagesService.restoreMany(ids);
    return ApiResponse.success(`Đã khôi phục ${ids.length} hình ảnh`, result);
  }

  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.hotelRoomImagesService.permanentDelete(id);
    return ApiResponse.success(`Đã xóa vĩnh viễn hình ảnh id=${id}`, result);
  }
}
