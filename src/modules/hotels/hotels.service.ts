import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Hotel } from 'src/model/entities/hotel.entity';
import { CreateHotelDto } from './dto/create-hotel.dto';
import { UpdateHotelDto } from './dto/update-hotel.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';
import { generateSlug } from 'src/common/helpers/slug.helper';

@Injectable()
export class HotelsService {
  private readonly logger = new Logger(HotelsService.name);

  constructor(
    @InjectRepository(Hotel)
    private readonly hotelRepo: Repository<Hotel>,
  ) {}

  /** 1️⃣ Lấy danh sách active */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.hotelRepo.findAndCount({
        where: { deletedAt: IsNull() },
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách khách sạn đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách khách sạn',
      );
    }
  }

  /** 2️⃣ Lấy danh sách đã xóa mềm */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.hotelRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách khách sạn đã xóa mềm',
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
      const hotel = await this.hotelRepo.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!hotel)
        throw new NotFoundException(
          `Khách sạn id=${id} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết khách sạn', data: hotel };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy chi tiết id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết khách sạn',
      );
    }
  }

  /** 4️⃣ Chi tiết (deleted) */
  async findOneDeleted(id: number) {
    try {
      const hotel = await this.hotelRepo.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
      });
      if (!hotel)
        throw new NotFoundException(
          `Khách sạn id=${id} chưa bị xóa hoặc không tồn tại`,
        );
      return { message: 'Chi tiết khách sạn đã xóa mềm', data: hotel };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy deleted id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết khách sạn đã xóa mềm',
      );
    }
  }

  /** 5️⃣ Thêm mới */
  async create(dto: CreateHotelDto) {
    try {
      const slug = generateSlug(dto.name);
      const existSlug = await this.hotelRepo.findOne({ where: { slug } });
      if (existSlug)
        throw new BadRequestException(
          'Slug đã tồn tại, vui lòng nhập tên khác',
        );

      const hotel = this.hotelRepo.create({ ...dto, slug });
      const saved = await this.hotelRepo.save(hotel);
      return { message: 'Tạo khách sạn thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo hotel: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Không thể tạo khách sạn');
    }
  }

  /** 6️⃣ Cập nhật */
  async update(id: number, dto: UpdateHotelDto) {
    try {
      const hotel = await this.hotelRepo.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!hotel)
        throw new NotFoundException(
          `Khách sạn id=${id} không tồn tại hoặc đã bị xóa`,
        );

      if (dto.name && dto.name !== hotel.name) {
        const newSlug = generateSlug(dto.name);
        const existSlug = await this.hotelRepo.findOne({
          where: { slug: newSlug },
        });
        if (existSlug && existSlug.id !== id)
          throw new BadRequestException(
            'Slug đã tồn tại, vui lòng nhập tên khác',
          );
        hotel.slug = newSlug;
      }

      Object.assign(hotel, dto);
      const updated = await this.hotelRepo.save(hotel);
      return { message: 'Cập nhật khách sạn thành công', data: updated };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật id=${id}: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Không thể cập nhật khách sạn');
    }
  }

  /** 7️⃣ Xóa mềm */
  async softDelete(id: number) {
    try {
      const result = await this.hotelRepo.softDelete(id);
      if (result.affected === 0)
        throw new NotFoundException(`Khách sạn id=${id} không tồn tại`);
      return { message: `Đã xóa mềm khách sạn id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể xóa mềm khách sạn');
    }
  }

  /** 8️⃣ Xóa mềm nhiều */
  async softDeleteMany(ids: number[]) {
    try {
      await this.hotelRepo.softDelete({ id: In(ids) });
      return { message: `Đã xóa mềm ${ids.length} khách sạn` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể xóa mềm nhiều khách sạn',
      );
    }
  }

  /** 9️⃣ Khôi phục 1 */
  async restore(id: number) {
    try {
      const result = await this.hotelRepo.restore(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Khách sạn id=${id} không tồn tại hoặc chưa bị xóa`,
        );
      return { message: `Đã khôi phục khách sạn id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể khôi phục khách sạn');
    }
  }

  /** 🔟 Khôi phục nhiều */
  async restoreMany(ids: number[]) {
    try {
      await this.hotelRepo.restore({ id: In(ids) });
      return { message: `Đã khôi phục ${ids.length} khách sạn` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều khách sạn',
      );
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(id: number) {
    try {
      const hotel = await this.hotelRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!hotel)
        throw new NotFoundException(`Khách sạn id=${id} không tồn tại`);
      await this.hotelRepo.remove(hotel);
      return { message: `Đã xóa vĩnh viễn khách sạn id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa vĩnh viễn id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn khách sạn',
      );
    }
  }

  /** 📌 Lấy danh sách loại phòng theo khách sạn */
  async getRoomsByHotel(hotelId: number) {
    try {
      const hotel = await this.hotelRepo.findOne({
        where: { id: hotelId },
        relations: ['roomTypes'],
      });
      if (!hotel)
        throw new NotFoundException(`Khách sạn id=${hotelId} không tồn tại`);
      return {
        message: 'Danh sách loại phòng của khách sạn',
        data: hotel.roomTypes,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy loại phòng hotel=${hotelId}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể lấy danh sách phòng');
    }
  }
}
