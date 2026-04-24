import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { HotelRoomImage } from 'src/model/entities/hotel-room-image.entity';
import { CreateHotelRoomImageDto } from './dto/create-hotel-room-image.dto';
import { UpdateHotelRoomImageDto } from './dto/update-hotel-room-image.dto';
import { Hotel } from 'src/model/entities/hotel.entity';
import { RoomType } from 'src/model/entities/room-type.entity';
import { Media } from 'src/model/entities/media.entity';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class HotelRoomImagesService {
  private readonly logger = new Logger(HotelRoomImagesService.name);

  constructor(
    @InjectRepository(HotelRoomImage)
    private readonly hotelRoomImageRepo: Repository<HotelRoomImage>,
  ) {}

  /** 🧩 Validate liên kết */
  private async validateRelations(
    dto: CreateHotelRoomImageDto | UpdateHotelRoomImageDto,
  ) {
    const manager = this.hotelRoomImageRepo.manager;

    const media = dto.media_id
      ? await manager.findOne(Media, { where: { id: dto.media_id } })
      : undefined;
    if (dto.media_id && !media)
      throw new BadRequestException(`Media id=${dto.media_id} không tồn tại`);

    const hotel = dto.hotel_id
      ? await manager.findOne(Hotel, { where: { id: dto.hotel_id } })
      : undefined;
    if (dto.hotel_id && !hotel)
      throw new BadRequestException(`Hotel id=${dto.hotel_id} không tồn tại`);

    const roomType = dto.room_type_id
      ? await manager.findOne(RoomType, { where: { id: dto.room_type_id } })
      : undefined;
    if (dto.room_type_id && !roomType)
      throw new BadRequestException(
        `RoomType id=${dto.room_type_id} không tồn tại`,
      );

    return { media, hotel, roomType };
  }

  /** 1️⃣ Lấy tất cả (active) */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.hotelRoomImageRepo.findAndCount({
        where: { deletedAt: IsNull() },
        relations: ['hotel', 'roomType', 'media'],
        order: { sortOrder: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        message: 'Danh sách hình ảnh hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách hình ảnh',
      );
    }
  }

  /** 2️⃣ Lấy tất cả (deleted) */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.hotelRoomImageRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        relations: ['hotel', 'roomType', 'media'],
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        message: 'Danh sách hình ảnh đã xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách đã xóa mềm',
      );
    }
  }

  /** 3️⃣ Chi tiết (active) */
  async findOneActive(id: number) {
    try {
      const image = await this.hotelRoomImageRepo.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['hotel', 'roomType', 'media'],
      });
      if (!image)
        throw new NotFoundException(
          `Ảnh id=${id} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết hình ảnh', data: image };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy hình ảnh id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể lấy chi tiết hình ảnh');
    }
  }

  /** 4️⃣ Chi tiết (deleted) */
  async findOneDeleted(id: number) {
    try {
      const image = await this.hotelRoomImageRepo.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
        relations: ['hotel', 'roomType', 'media'],
      });
      if (!image)
        throw new NotFoundException(
          `Ảnh id=${id} chưa bị xóa hoặc không tồn tại`,
        );
      return { message: 'Chi tiết hình ảnh đã xóa mềm', data: image };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy deleted id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết hình ảnh đã xóa',
      );
    }
  }

  /** 5️⃣ Tạo mới */
  async create(dto: CreateHotelRoomImageDto) {
    try {
      const { media, hotel, roomType } = await this.validateRelations(dto);

      const newImage = this.hotelRoomImageRepo.create({
        media: media ?? undefined,
        hotel: hotel ?? undefined,
        roomType: roomType ?? undefined,
        isCover: dto.is_cover,
        caption: dto.caption,
        sortOrder: dto.sort_order,
      } as Partial<HotelRoomImage>);

      const saved = await this.hotelRoomImageRepo.save(newImage);
      return { message: 'Tạo hình ảnh thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo hình ảnh: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Không thể tạo hình ảnh');
    }
  }

  /** 6️⃣ Cập nhật */
  async update(id: number, dto: UpdateHotelRoomImageDto) {
    try {
      const image = await this.hotelRoomImageRepo.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['hotel', 'roomType', 'media'],
      });
      if (!image)
        throw new NotFoundException(
          `Ảnh id=${id} không tồn tại hoặc đã bị xóa`,
        );

      const { media, hotel, roomType } = await this.validateRelations(dto);
      Object.assign(image, {
        media: media ?? image.media,
        hotel: hotel ?? image.hotel,
        roomType: roomType ?? image.roomType,
        isCover: dto.is_cover ?? image.isCover,
        caption: dto.caption ?? image.caption,
        sortOrder: dto.sort_order ?? image.sortOrder,
      });

      const updated = await this.hotelRoomImageRepo.save(image);
      return { message: 'Cập nhật hình ảnh thành công', data: updated };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật id=${id}: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Không thể cập nhật hình ảnh');
    }
  }

  /** 7️⃣ Xóa mềm */
  async softDelete(id: number) {
    try {
      const result = await this.hotelRoomImageRepo.softDelete(id);
      if (result.affected === 0)
        throw new NotFoundException(`Ảnh id=${id} không tồn tại`);
      return { message: `Đã xóa mềm hình ảnh id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể xóa mềm hình ảnh');
    }
  }

  /** 8️⃣ Xóa mềm nhiều */
  async softDeleteMany(ids: number[]) {
    try {
      await this.hotelRoomImageRepo.softDelete({ id: In(ids) });
      return { message: `Đã xóa mềm ${ids.length} hình ảnh` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể xóa mềm nhiều hình ảnh',
      );
    }
  }

  /** 9️⃣ Khôi phục 1 */
  async restore(id: number) {
    try {
      const result = await this.hotelRoomImageRepo.restore(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Ảnh id=${id} không tồn tại hoặc chưa bị xóa`,
        );
      return { message: `Đã khôi phục hình ảnh id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể khôi phục hình ảnh');
    }
  }

  /** 🔟 Khôi phục nhiều */
  async restoreMany(ids: number[]) {
    try {
      await this.hotelRoomImageRepo.restore({ id: In(ids) });
      return { message: `Đã khôi phục ${ids.length} hình ảnh` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều hình ảnh',
      );
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(id: number) {
    try {
      const image = await this.hotelRoomImageRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!image) throw new NotFoundException(`Ảnh id=${id} không tồn tại`);
      await this.hotelRoomImageRepo.remove(image);
      return { message: `Đã xóa vĩnh viễn hình ảnh id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa vĩnh viễn id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn hình ảnh',
      );
    }
  }
}
