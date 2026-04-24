/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { RoomInventory } from 'src/model/entities/room-inventory.entity';
import { RoomType } from 'src/model/entities/room-type.entity';
import { CreateRoomInventoryDto } from './dto/create-room-inventory.dto';
import { UpdateRoomInventoryDto } from './dto/update-room-inventory.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class RoomInventoryService {
  private readonly logger = new Logger(RoomInventoryService.name);

  constructor(
    @InjectRepository(RoomInventory)
    private readonly inventoryRepo: Repository<RoomInventory>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
  ) {}

  /** 1️⃣ Danh sách tồn kho active */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.inventoryRepo.findAndCount({
        where: { deletedAt: IsNull() },
        relations: ['room_type'],
        order: { room_type_id: 'ASC', date: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách tồn kho phòng đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách tồn kho phòng',
      );
    }
  }

  /** 2️⃣ Danh sách đã xóa mềm */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.inventoryRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        relations: ['room_type'],
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách tồn kho phòng đã xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách đã xóa');
    }
  }

  /** 3️⃣ Chi tiết active */
  async findOneActive(room_type_id: number, date: string) {
    try {
      const data = await this.inventoryRepo.findOne({
        where: { room_type_id, date, deletedAt: IsNull() },
        relations: ['room_type'],
      });
      if (!data)
        throw new NotFoundException(
          `Không tìm thấy tồn kho cho room_type_id=${room_type_id}, date=${date}`,
        );
      return { message: 'Chi tiết tồn kho phòng', data };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy tồn kho: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết tồn kho phòng',
      );
    }
  }

  /** 4️⃣ Chi tiết đã xóa mềm */
  async findOneDeleted(room_type_id: number, date: string) {
    try {
      const data = await this.inventoryRepo.findOne({
        withDeleted: true,
        where: { room_type_id, date, deletedAt: Not(IsNull()) },
        relations: ['room_type'],
      });
      if (!data)
        throw new NotFoundException(
          `Bản ghi tồn kho (room_type_id=${room_type_id}, date=${date}) chưa bị xóa`,
        );
      return { message: 'Chi tiết tồn kho phòng đã xóa mềm', data };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy bản ghi deleted: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết tồn kho đã xóa',
      );
    }
  }

  /** 5️⃣ Tạo mới */
  async create(dto: CreateRoomInventoryDto) {
    try {
      const exist = await this.inventoryRepo.findOne({
        where: { room_type_id: dto.room_type_id, date: dto.date },
        withDeleted: true,
      });
      if (exist) {
        throw new BadRequestException(
          `Tồn kho cho room_type_id=${dto.room_type_id} ngày ${dto.date} đã tồn tại`,
        );
      }

      const roomType = await this.roomTypeRepo.findOne({
        where: { id: dto.room_type_id },
      });
      if (!roomType) {
        throw new NotFoundException(
          `Room type id=${dto.room_type_id} không tồn tại`,
        );
      }

      const record = this.inventoryRepo.create({
        room_type_id: dto.room_type_id,
        date: dto.date,
        allotment: dto.allotment,
        // ✅ Sửa dòng này:
        price: dto.price !== undefined ? dto.price : undefined,
        room_type: roomType,
      } as Partial<RoomInventory>);

      const saved = await this.inventoryRepo.save(record);
      return { message: 'Tạo tồn kho thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo tồn kho: ${error.message}`);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException('Không thể tạo tồn kho phòng');
    }
  }

  /** 6️⃣ Cập nhật */
  async update(
    room_type_id: number,
    date: string,
    dto: UpdateRoomInventoryDto,
  ) {
    try {
      const found = await this.findOneActive(room_type_id, date);
      const record = found.data;
      const { room_type_id: _ignore1, date: _ignore2, ...rest } = dto as any;
      Object.assign(record, rest);
      const saved = await this.inventoryRepo.save(record);
      return { message: 'Cập nhật tồn kho thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật tồn kho: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể cập nhật tồn kho phòng',
      );
    }
  }

  /** 7️⃣ Xóa mềm */
  async softDelete(room_type_id: number, date: string) {
    try {
      const result = await this.inventoryRepo.softDelete({
        room_type_id,
        date,
      });
      if (result.affected === 0)
        throw new NotFoundException(
          `Không tìm thấy tồn kho (room_type_id=${room_type_id}, date=${date})`,
        );
      return {
        message: `Đã xóa mềm tồn kho (room_type_id=${room_type_id}, date=${date})`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm tồn kho: ${error.message}`);
      throw new InternalServerErrorException('Không thể xóa mềm tồn kho phòng');
    }
  }

  /** 8️⃣ Xóa mềm nhiều (theo room_type_id) */
  async softDeleteMany(room_type_id: number) {
    try {
      const result = await this.inventoryRepo.softDelete({ room_type_id });
      return {
        message: `Đã xóa mềm ${result.affected ?? 0} bản ghi của room_type_id=${room_type_id}`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều tồn kho: ${error.message}`);
      throw new InternalServerErrorException('Không thể xóa mềm nhiều tồn kho');
    }
  }

  /** 9️⃣ Khôi phục 1 */
  async restore(room_type_id: number, date: string) {
    try {
      const result = await this.inventoryRepo.restore({ room_type_id, date });
      if (result.affected === 0)
        throw new NotFoundException(
          `Không tìm thấy bản ghi (room_type_id=${room_type_id}, date=${date}) đã xóa mềm`,
        );
      return {
        message: `Đã khôi phục tồn kho (room_type_id=${room_type_id}, date=${date})`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục tồn kho: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục tồn kho phòng',
      );
    }
  }

  /** 🔟 Khôi phục nhiều */
  async restoreMany(room_type_id: number) {
    try {
      const result = await this.inventoryRepo.restore({ room_type_id });
      return {
        message: `Đã khôi phục ${result.affected ?? 0} bản ghi của room_type_id=${room_type_id}`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều tồn kho: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều tồn kho',
      );
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(room_type_id: number, date: string) {
    try {
      const record = await this.inventoryRepo.findOne({
        where: { room_type_id, date },
        withDeleted: true,
      });
      if (!record)
        throw new NotFoundException(
          `Không tìm thấy bản ghi tồn kho (room_type_id=${room_type_id}, date=${date})`,
        );
      await this.inventoryRepo.remove(record);
      return {
        message: `Đã xóa vĩnh viễn tồn kho (room_type_id=${room_type_id}, date=${date})`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa vĩnh viễn tồn kho: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn tồn kho phòng',
      );
    }
  }
}
