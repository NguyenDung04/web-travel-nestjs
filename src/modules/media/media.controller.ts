import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { ApiResponse } from 'src/common/helpers/api-response';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  // 1️⃣ Lấy tất cả (active)
  @Get('active')
  async findAllActive(@Query() pagination: PaginationDto) {
    const result = await this.mediaService.findAllActive(pagination);
    return ApiResponse.success(
      'Lấy danh sách media đang hoạt động',
      result.data,
      result.meta,
    );
  }

  // 2️⃣ Lấy tất cả (đã xóa mềm)
  @Get('deleted')
  async findAllDeleted(@Query() pagination: PaginationDto) {
    const result = await this.mediaService.findAllDeleted(pagination);
    return ApiResponse.success(
      'Danh sách media đã xóa mềm',
      result.data,
      result.meta,
    );
  }

  // 3️⃣ Chi tiết (active)
  @Get('active/:id')
  async findOneActive(@Param('id', ParseIntPipe) id: number) {
    const result = await this.mediaService.findOneActive(id);
    return ApiResponse.success(`Chi tiết media id=${id}`, result.data);
  }

  // 4️⃣ Chi tiết (đã xóa mềm)
  @Get('deleted/:id')
  async findOneDeleted(@Param('id', ParseIntPipe) id: number) {
    const result = await this.mediaService.findOneDeleted(id);
    return ApiResponse.success(
      `Chi tiết media đã xóa mềm id=${id}`,
      result.data,
    );
  }

  // 5️⃣ Tạo mới
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() dto: CreateMediaDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    const actorId = req?.user?.id;
    const result = await this.mediaService.create(dto, file, actorId);
    return ApiResponse.created('Tạo media thành công', result.data);
  }

  // 6️⃣ Cập nhật
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMediaDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const result = await this.mediaService.update(id, dto, file);
    return ApiResponse.success(`Cập nhật media id=${id}`, result.data);
  }

  // 7️⃣ Xóa mềm 1
  @Delete('soft/:id')
  async softDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.mediaService.softDelete(id);
    return ApiResponse.success(`Đã xóa mềm media id=${id}`, result);
  }

  // 8️⃣ Xóa mềm nhiều
  @Delete('soft')
  async softDeleteMany(@Body('ids') ids: number[]) {
    const result = await this.mediaService.softDeleteMany(ids);
    return ApiResponse.success(`Đã xóa mềm ${ids.length} media`, result);
  }

  // 9️⃣ Khôi phục 1
  @Post('restore/:id')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const result = await this.mediaService.restore(id);
    return ApiResponse.success(`Khôi phục media id=${id}`, result);
  }

  // 🔟 Khôi phục nhiều
  @Post('restore')
  async restoreMany(@Body('ids') ids: number[]) {
    const result = await this.mediaService.restoreMany(ids);
    return ApiResponse.success(`Đã khôi phục ${ids.length} media`, result);
  }

  // 11️⃣ Xóa vĩnh viễn
  @Delete('permanent/:id')
  async permanentDelete(@Param('id', ParseIntPipe) id: number) {
    const result = await this.mediaService.permanentDelete(id);
    return ApiResponse.success(`Đã xóa vĩnh viễn media id=${id}`, result);
  }
}
