import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post as HttpPost,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SlidersService } from './sliders.service';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminRoleGuard } from 'src/common/guards/admin-role.guard';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Controller('sliders')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class SlidersController {
  constructor(private readonly slidersService: SlidersService) {}

  @Get('active')
  async findAll(@Query() pagination: PaginationDto) {
    return await this.slidersService.findAll(pagination);
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    return await this.slidersService.findAllDeleted(pagination);
  }

  @Get('active/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.slidersService.findOne(id);
    return { message: 'Chi tiết slider', data };
  }

  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const data = await this.slidersService.findOneDeleted(id);
    return { message: 'Chi tiết slider đã xóa mềm', data };
  }

  @HttpPost()
  async create(@Body() dto: CreateSliderDto) {
    const data = await this.slidersService.create(dto);
    return { message: 'Tạo slider thành công', data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSliderDto,
  ) {
    const data = await this.slidersService.update(id, dto);
    return { message: 'Cập nhật slider thành công', data };
  }

  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.slidersService.softDelete(id);
  }

  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    return await this.slidersService.softDeleteMany(ids);
  }

  @HttpPost('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.slidersService.restore(id);
  }

  @HttpPost('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    return await this.slidersService.restoreMany(ids);
  }

  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.slidersService.permanentDelete(id);
  }
}
