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
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@UseInterceptors(ResponseInterceptor)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.customersService.findAllActive(pagination);
    return ApiResponse.success(
      'Lấy danh sách khách hàng hoạt động thành công',
      result.data,
      result.meta,
    );
  }

  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.customersService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Lấy danh sách khách hàng đã xóa mềm',
      result.data,
      result.meta,
    );
  }

  @Get('active/:id')
  async findOneActive(@Param('id', ParseIntPipe) id: number) {
    const result = await this.customersService.findOneActive(id);
    return ApiResponse.success(
      `Chi tiết khách hàng id=${id} thành công`,
      result.data,
    );
  }

  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const result = await this.customersService.findOneDeleted(id);
    return ApiResponse.success(
      `Chi tiết khách hàng đã xóa mềm id=${id} thành công`,
      result.data,
    );
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    const result = await this.customersService.create(dto);
    return ApiResponse.created('Tạo khách hàng thành công', result.data);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCustomerDto,
  ) {
    const result = await this.customersService.update(id, dto);
    return ApiResponse.success(
      `Cập nhật khách hàng id=${id} thành công`,
      result.data,
    );
  }

  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.customersService.softDelete(id);
    return ApiResponse.success(`Đã xóa mềm khách hàng id=${id}`, result);
  }

  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    const result = await this.customersService.softDeleteMany(ids);
    return ApiResponse.success(`Đã xóa mềm ${ids.length} khách hàng`, result);
  }

  @Post('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.customersService.restore(id);
    return ApiResponse.success(`Đã khôi phục khách hàng id=${id}`, result);
  }

  @Post('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    const result = await this.customersService.restoreMany(ids);
    return ApiResponse.success(`Đã khôi phục ${ids.length} khách hàng`, result);
  }

  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.customersService.permanentDelete(id);
    return ApiResponse.success(`Đã xóa vĩnh viễn khách hàng id=${id}`, result);
  }
}
