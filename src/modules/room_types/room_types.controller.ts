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
import { RoomTypesService } from './room_types.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminRoleGuard } from 'src/common/guards/admin-role.guard';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@UseGuards(JwtAuthGuard, AdminRoleGuard)
@UseInterceptors(ResponseInterceptor)
@Controller('room-types')
export class RoomTypesController {
  constructor(private readonly roomTypesService: RoomTypesService) {}

  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.roomTypesService.findAllActive(pagination);
    return ApiResponse.success(
      'Danh sách loại phòng đang hoạt động',
      result.data,
      result.meta,
    );
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.roomTypesService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Danh sách loại phòng đã xóa mềm',
      result.data,
      result.meta,
    );
  }

  @Get('active/:id')
  async findOneActive(@Param('id', ParseIntPipe) id: number) {
    const result = await this.roomTypesService.findOneActive(id);
    return ApiResponse.success('Chi tiết loại phòng', result.data);
  }

  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const result = await this.roomTypesService.findOneDeleted(id);
    return ApiResponse.success('Chi tiết loại phòng đã xóa mềm', result.data);
  }

  @HttpPost()
  async create(@Body() dto: CreateRoomTypeDto) {
    const result = await this.roomTypesService.create(dto);
    return ApiResponse.created('Tạo loại phòng thành công', result.data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoomTypeDto,
  ) {
    const result = await this.roomTypesService.update(id, dto);
    return ApiResponse.success('Cập nhật loại phòng thành công', result.data);
  }

  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.roomTypesService.softDelete(id);
    return ApiResponse.success('Đã xóa mềm loại phòng', result);
  }

  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    const result = await this.roomTypesService.softDeleteMany(ids);
    return ApiResponse.success('Đã xóa mềm nhiều loại phòng', result);
  }

  @HttpPost('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.roomTypesService.restore(id);
    return ApiResponse.success('Khôi phục loại phòng', result);
  }

  @HttpPost('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    const result = await this.roomTypesService.restoreMany(ids);
    return ApiResponse.success('Khôi phục nhiều loại phòng', result);
  }

  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.roomTypesService.permanentDelete(id);
    return ApiResponse.success('Đã xóa vĩnh viễn loại phòng', result);
  }
}
