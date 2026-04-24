import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { RoomType } from 'src/model/entities/room-type.entity';
import { Hotel } from 'src/model/entities/hotel.entity';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class RoomTypesService {
  private readonly logger = new Logger(RoomTypesService.name);

  constructor(
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
    @InjectRepository(Hotel)
    private readonly hotelRepo: Repository<Hotel>,
  ) {}

  /** 1️⃣ Lấy danh sách loại phòng đang hoạt động */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.roomTypeRepo.findAndCount({
        where: { deletedAt: IsNull() },
        relations: ['hotel'],
        order: { id: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách loại phòng đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách loại phòng',
      );
    }
  }

  /** 2️⃣ Lấy danh sách loại phòng đã xóa mềm */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.roomTypeRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        relations: ['hotel'],
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách loại phòng đã xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách đã xóa');
    }
  }

  /** 3️⃣ Chi tiết loại phòng active */
  async findOneActive(id: number) {
    try {
      const data = await this.roomTypeRepo.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['hotel'],
      });
      if (!data)
        throw new NotFoundException(
          `Room type id=${id} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết loại phòng', data };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy room type id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết loại phòng',
      );
    }
  }

  /** 4️⃣ Chi tiết loại phòng đã xóa mềm */
  async findOneDeleted(id: number) {
    try {
      const data = await this.roomTypeRepo.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
        relations: ['hotel'],
      });
      if (!data)
        throw new NotFoundException(
          `Room type id=${id} chưa bị xóa hoặc không tồn tại`,
        );
      return { message: 'Chi tiết loại phòng đã xóa mềm', data };
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy deleted room type id=${id}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết loại phòng đã xóa',
      );
    }
  }

  /** 5️⃣ Tạo mới */
  async create(dto: CreateRoomTypeDto) {
    try {
      const hotel = await this.hotelRepo.findOne({
        where: { id: dto.hotel_id },
      });
      if (!hotel)
        throw new NotFoundException(
          `Hotel id=${dto.hotel_id} không tồn tại để gắn loại phòng`,
        );

      const record = this.roomTypeRepo.create({
        name: dto.name.trim(),
        description: dto.description ?? undefined,
        base_price: dto.base_price,
        maxGuests: dto.max_guests ?? 2,
        bedType: dto.bed_type ?? undefined,
        isActive: dto.is_active ?? true,
        hotel,
      } as Partial<RoomType>);

      const saved = await this.roomTypeRepo.save(record);
      return { message: 'Tạo loại phòng thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo room type: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Không thể tạo loại phòng');
    }
  }

  /** 6️⃣ Cập nhật */
  async update(id: number, dto: UpdateRoomTypeDto) {
    try {
      const found = await this.findOneActive(id);
      const roomType = found.data;

      if (dto.hotel_id) {
        const hotel = await this.hotelRepo.findOne({
          where: { id: dto.hotel_id },
        });
        if (!hotel)
          throw new NotFoundException(
            `Hotel id=${dto.hotel_id} không tồn tại để gắn loại phòng`,
          );
        roomType.hotel = hotel;
      }

      Object.assign(roomType, dto);
      const saved = await this.roomTypeRepo.save(roomType);
      return { message: 'Cập nhật loại phòng thành công', data: saved };
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật room type id=${id}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể cập nhật loại phòng');
    }
  }

  /** 7️⃣ Xóa mềm */
  async softDelete(id: number) {
    try {
      const result = await this.roomTypeRepo.softDelete(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Room type id=${id} không tồn tại để xóa mềm`,
        );
      return { message: `Đã xóa mềm room type id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm room type id=${id}: ${error.message}`);
      throw new InternalServerErrorException('Không thể xóa mềm loại phòng');
    }
  }

  /** 8️⃣ Xóa mềm nhiều */
  async softDeleteMany(ids: number[]) {
    try {
      await this.roomTypeRepo.softDelete({ id: In(ids) });
      return { message: `Đã xóa mềm ${ids.length} loại phòng` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều loại phòng: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể xóa mềm nhiều loại phòng',
      );
    }
  }

  /** 9️⃣ Khôi phục 1 */
  async restore(id: number) {
    try {
      const result = await this.roomTypeRepo.restore(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Room type id=${id} không tồn tại hoặc chưa bị xóa`,
        );
      return { message: `Đã khôi phục room type id=${id}` };
    } catch (error) {
      this.logger.error(
        `Lỗi khi khôi phục room type id=${id}: ${error.message}`,
      );
      throw new InternalServerErrorException('Không thể khôi phục loại phòng');
    }
  }

  /** 🔟 Khôi phục nhiều */
  async restoreMany(ids: number[]) {
    try {
      await this.roomTypeRepo.restore({ id: In(ids) });
      return { message: `Đã khôi phục ${ids.length} loại phòng` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều loại phòng: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều loại phòng',
      );
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(id: number) {
    try {
      const record = await this.roomTypeRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!record)
        throw new NotFoundException(`Room type id=${id} không tồn tại`);
      await this.roomTypeRepo.remove(record);
      return { message: `Đã xóa vĩnh viễn room type id=${id}` };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa vĩnh viễn room type id=${id}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn loại phòng',
      );
    }
  }
}
