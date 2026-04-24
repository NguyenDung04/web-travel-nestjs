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
import { RoomInventoryService } from './room_inventory.service';
import { CreateRoomInventoryDto } from './dto/create-room-inventory.dto';
import { UpdateRoomInventoryDto } from './dto/update-room-inventory.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminRoleGuard } from 'src/common/guards/admin-role.guard';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@UseGuards(JwtAuthGuard, AdminRoleGuard)
@UseInterceptors(ResponseInterceptor)
@Controller('room-inventory')
export class RoomInventoryController {
  constructor(private readonly inventoryService: RoomInventoryService) {}

  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.inventoryService.findAllActive(pagination);
    return ApiResponse.success(
      'Danh sách tồn kho phòng đang hoạt động',
      result.data,
      result.meta,
    );
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.inventoryService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Danh sách tồn kho phòng đã xóa mềm',
      result.data,
      result.meta,
    );
  }

  @Get('active/:room_type_id/:date')
  async findOneActive(
    @Param('room_type_id', ParseIntPipe) room_type_id: number,
    @Param('date') date: string,
  ) {
    const result = await this.inventoryService.findOneActive(
      room_type_id,
      date,
    );
    return ApiResponse.success('Chi tiết tồn kho phòng', result.data);
  }

  @Get('deleted/:room_type_id/:date')
  async findOneDeleted(
    @Param('room_type_id', ParseIntPipe) room_type_id: number,
    @Param('date') date: string,
  ) {
    const result = await this.inventoryService.findOneDeleted(
      room_type_id,
      date,
    );
    return ApiResponse.success('Chi tiết tồn kho đã xóa mềm', result.data);
  }

  @HttpPost()
  async create(@Body() dto: CreateRoomInventoryDto) {
    const result = await this.inventoryService.create(dto);
    return ApiResponse.created('Tạo tồn kho thành công', result.data);
  }

  @Patch(':room_type_id/:date')
  async update(
    @Param('room_type_id', ParseIntPipe) room_type_id: number,
    @Param('date') date: string,
    @Body() dto: UpdateRoomInventoryDto,
  ) {
    const result = await this.inventoryService.update(room_type_id, date, dto);
    return ApiResponse.success('Cập nhật tồn kho thành công', result.data);
  }

  @Delete('soft/:room_type_id/:date')
  async softDelete(
    @Param('room_type_id', ParseIntPipe) room_type_id: number,
    @Param('date') date: string,
  ) {
    const result = await this.inventoryService.softDelete(room_type_id, date);
    return ApiResponse.success('Đã xóa mềm tồn kho phòng', result);
  }

  @Delete('soft/:room_type_id')
  async softDeleteMany(
    @Param('room_type_id', ParseIntPipe) room_type_id: number,
  ) {
    const result = await this.inventoryService.softDeleteMany(room_type_id);
    return ApiResponse.success('Đã xóa mềm nhiều bản ghi tồn kho', result);
  }

  @HttpPost('restore/:room_type_id/:date')
  async restore(
    @Param('room_type_id', ParseIntPipe) room_type_id: number,
    @Param('date') date: string,
  ) {
    const result = await this.inventoryService.restore(room_type_id, date);
    return ApiResponse.success('Khôi phục tồn kho phòng', result);
  }

  @HttpPost('restore/:room_type_id')
  async restoreMany(@Param('room_type_id', ParseIntPipe) room_type_id: number) {
    const result = await this.inventoryService.restoreMany(room_type_id);
    return ApiResponse.success('Khôi phục nhiều bản ghi tồn kho', result);
  }

  @Delete('permanent/:room_type_id/:date')
  async permanentDelete(
    @Param('room_type_id', ParseIntPipe) room_type_id: number,
    @Param('date') date: string,
  ) {
    const result = await this.inventoryService.permanentDelete(
      room_type_id,
      date,
    );
    return ApiResponse.success('Đã xóa vĩnh viễn tồn kho phòng', result);
  }
}
