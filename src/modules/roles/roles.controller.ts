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
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminRoleGuard } from 'src/common/guards/admin-role.guard';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@UseGuards(JwtAuthGuard, AdminRoleGuard)
@UseInterceptors(ResponseInterceptor)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // 1️⃣ Lấy danh sách active
  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.rolesService.findAllActive(pagination);
    return ApiResponse.success(
      'Danh sách vai trò đang hoạt động',
      result.data,
      result.meta,
    );
  }

  // 2️⃣ Lấy danh sách đã xóa mềm
  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.rolesService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Danh sách vai trò đã xóa mềm',
      result.data,
      result.meta,
    );
  }

  // 3️⃣ Chi tiết active
  @Get('active/:id')
  async findOneActive(@Param('id', ParseIntPipe) id: number) {
    const result = await this.rolesService.findOneActive(id);
    return ApiResponse.success('Chi tiết vai trò', result.data);
  }

  // 4️⃣ Chi tiết đã xóa mềm
  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const result = await this.rolesService.findOneDeleted(id);
    return ApiResponse.success('Chi tiết vai trò đã xóa mềm', result.data);
  }

  // 5️⃣ Tạo mới
  @HttpPost()
  async create(@Body() dto: CreateRoleDto) {
    const result = await this.rolesService.create(dto);
    return ApiResponse.created('Tạo vai trò thành công', result.data);
  }

  // 6️⃣ Cập nhật
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    const result = await this.rolesService.update(id, dto);
    return ApiResponse.success('Cập nhật vai trò thành công', result.data);
  }

  // 7️⃣ Xóa mềm
  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.rolesService.softDelete(id);
    return ApiResponse.success('Đã xóa mềm vai trò', result);
  }

  // 8️⃣ Xóa mềm nhiều
  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    const result = await this.rolesService.softDeleteMany(ids);
    return ApiResponse.success('Đã xóa mềm nhiều vai trò', result);
  }

  // 9️⃣ Khôi phục 1
  @HttpPost('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.rolesService.restore(id);
    return ApiResponse.success('Khôi phục vai trò', result);
  }

  // 🔟 Khôi phục nhiều
  @HttpPost('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    const result = await this.rolesService.restoreMany(ids);
    return ApiResponse.success('Khôi phục nhiều vai trò', result);
  }

  // 11️⃣ Xóa vĩnh viễn
  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.rolesService.permanentDelete(id);
    return ApiResponse.success('Đã xóa vĩnh viễn vai trò', result);
  }
}
