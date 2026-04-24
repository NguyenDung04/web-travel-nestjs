import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminRoleGuard } from 'src/common/guards/admin-role.guard';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    return await this.settingsService.findAllActive(pagination);
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    return await this.settingsService.findAllDeleted(pagination);
  }

  @Get('active/:key')
  async findOneActive(@Param('key') key: string) {
    const data = await this.settingsService.findOneActive(key);
    return { message: 'Chi tiết setting', data };
  }

  @Get('deleted/:key')
  async findOneDeleted(@Param('key') key: string) {
    const data = await this.settingsService.findOneDeleted(key);
    return { message: 'Chi tiết setting đã xóa mềm', data };
  }

  @HttpPost()
  async create(@Body() dto: CreateSettingDto) {
    const data = await this.settingsService.create(dto);
    return { message: 'Tạo setting thành công', data };
  }

  @Patch(':key')
  async update(@Param('key') key: string, @Body() dto: UpdateSettingDto) {
    const data = await this.settingsService.update(key, dto);
    return { message: 'Cập nhật setting thành công', data };
  }

  @Delete('soft/:key')
  async softDelete(@Param('key') key: string) {
    return await this.settingsService.softDelete(key);
  }

  @Delete('soft')
  async softDeleteMany(@Body('keys') keys: string[]) {
    return await this.settingsService.softDeleteMany(keys);
  }

  @HttpPost('restore/:key')
  async restore(@Param('key') key: string) {
    return await this.settingsService.restore(key);
  }

  @HttpPost('restore')
  async restoreMany(@Body('keys') keys: string[]) {
    return await this.settingsService.restoreMany(keys);
  }

  @Delete('permanent/:key')
  async permanentDelete(@Param('key') key: string) {
    return await this.settingsService.permanentDelete(key);
  }
}
