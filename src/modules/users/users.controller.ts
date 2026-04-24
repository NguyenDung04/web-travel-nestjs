/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { AdminRoleGuard } from 'src/common/guards/admin-role.guard';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('active')
  async findAll(@Query() pagination: PaginationDto) {
    return await this.usersService.findAll(pagination);
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    return await this.usersService.findAllDeleted(pagination);
  }

  @Get('active/:id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.findOne(id);
    return { message: 'Chi tiết user', data };
  }

  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const data = await this.usersService.findOneDeleted(id);
    return { message: 'Chi tiết user đã xóa mềm', data };
  }

  @HttpPost()
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.createUser(dto);
    return { message: 'Tạo user thành công', data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    const data = await this.usersService.updateUser(id, dto);
    return { message: 'Cập nhật user thành công', data };
  }

  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.softDelete(id);
  }

  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    return await this.usersService.softDeleteMany(ids);
  }

  @HttpPost('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.restore(id);
  }

  @HttpPost('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    return await this.usersService.restoreMany(ids);
  }

  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    return await this.usersService.permanentDelete(id);
  }
}
