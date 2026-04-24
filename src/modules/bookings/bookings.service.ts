import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, IsNull, Not } from 'typeorm';
import { Booking } from 'src/model/entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Customer } from 'src/model/entities/customer.entity';
import { Hotel } from 'src/model/entities/hotel.entity';
import { RoomType } from 'src/model/entities/room-type.entity';
import { PaginationDto } from '../../model/dto/pagination.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(Hotel)
    private readonly hotelRepo: Repository<Hotel>,
    @InjectRepository(RoomType)
    private readonly roomTypeRepo: Repository<RoomType>,
  ) {}

  // 1️⃣ Lấy tất cả (trừ xóa mềm)
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.bookingRepo.findAndCount({
        where: { deletedAt: IsNull() },
        relations: ['customer', 'hotel', 'roomType'],
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'DESC' },
      });

      return {
        message: 'Danh sách booking đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách booking');
    }
  }

  // 2️⃣ Lấy tất cả (chỉ có xóa mềm)
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.bookingRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        relations: ['customer', 'hotel', 'roomType'],
        skip: (page - 1) * limit,
        take: limit,
        order: { deletedAt: 'DESC' },
      });

      return {
        message: 'Danh sách booking đã bị xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách đã xóa');
    }
  }

  // 3️⃣ Lấy chi tiết (trừ xóa mềm)
  async findOneActive(id: number) {
    try {
      const booking = await this.bookingRepo.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['customer', 'hotel', 'roomType'],
      });
      if (!booking)
        throw new NotFoundException(
          `Booking id=${id} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết booking', data: booking };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy booking id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể lấy chi tiết booking');
    }
  }

  // 4️⃣ Lấy chi tiết (chỉ có xóa mềm)
  async findOneDeleted(id: number) {
    try {
      const booking = await this.bookingRepo.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
        relations: ['customer', 'hotel', 'roomType'],
      });
      if (!booking)
        throw new NotFoundException(
          `Booking id=${id} chưa bị xóa hoặc không tồn tại`,
        );
      return { message: 'Chi tiết booking đã xóa mềm', data: booking };
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy booking deleted id=${id}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết booking đã xóa',
      );
    }
  }

  // 5️⃣ Thêm
  async create(dto: CreateBookingDto) {
    try {
      const exist = await this.bookingRepo.findOne({
        where: { bookingCode: dto.booking_code },
      });
      if (exist) throw new BadRequestException('Mã đặt phòng đã tồn tại');

      const customer = await this.customerRepo.findOne({
        where: { id: dto.customer_id },
      });
      if (!customer)
        throw new NotFoundException(
          `Customer id=${dto.customer_id} không tồn tại`,
        );

      const hotel = await this.hotelRepo.findOne({
        where: { id: dto.hotel_id },
      });
      if (!hotel)
        throw new NotFoundException(`Hotel id=${dto.hotel_id} không tồn tại`);

      const roomType = await this.roomTypeRepo.findOne({
        where: { id: dto.room_type_id },
      });
      if (!roomType)
        throw new NotFoundException(
          `RoomType id=${dto.room_type_id} không tồn tại`,
        );

      const booking = this.bookingRepo.create({
        bookingCode: dto.booking_code,
        customer,
        hotel,
        roomType,
        checkinDate: dto.checkin_date,
        checkoutDate: dto.checkout_date,
        adults: dto.adults,
        children: dto.children,
        totalAmount: dto.total_amount,
        status: dto.status ?? 'pending',
      });

      const saved = await this.bookingRepo.save(booking);
      return { message: 'Tạo booking thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo booking: ${error.message}`);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException('Không thể tạo booking');
    }
  }

  // 6️⃣ Sửa
  async update(id: number, dto: UpdateBookingDto) {
    try {
      const booking = await this.bookingRepo.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!booking)
        throw new NotFoundException(
          `Booking id=${id} không tồn tại hoặc đã bị xóa`,
        );

      if (dto.booking_code && dto.booking_code !== booking.bookingCode) {
        const exist = await this.bookingRepo.findOne({
          where: { bookingCode: dto.booking_code },
        });
        if (exist) throw new BadRequestException('Mã đặt phòng đã tồn tại');
        booking.bookingCode = dto.booking_code;
      }

      Object.assign(booking, {
        checkinDate: dto.checkin_date ?? booking.checkinDate,
        checkoutDate: dto.checkout_date ?? booking.checkoutDate,
        adults: dto.adults ?? booking.adults,
        children: dto.children ?? booking.children,
        totalAmount: dto.total_amount ?? booking.totalAmount,
        status: dto.status ?? booking.status,
      });

      const updated = await this.bookingRepo.save(booking);
      return { message: 'Cập nhật booking thành công', data: updated };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật booking id=${id}: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Không thể cập nhật booking');
    }
  }

  // 7️⃣ Xóa mềm 1
  async softDelete(id: number) {
    try {
      const result = await this.bookingRepo.softDelete(id);
      if (result.affected === 0)
        throw new NotFoundException(`Booking id=${id} không tồn tại`);
      return { message: `Đã xóa mềm booking id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể xóa mềm booking');
    }
  }

  // 8️⃣ Xóa mềm nhiều
  async softDeleteMany(ids: number[]) {
    try {
      await this.bookingRepo.softDelete({ id: In(ids) });
      return { message: `Đã xóa mềm ${ids.length} booking` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều: ${error.message}`);
      throw new InternalServerErrorException('Không thể xóa mềm nhiều booking');
    }
  }

  // 9️⃣ Khôi phục 1
  async restore(id: number) {
    try {
      const result = await this.bookingRepo.restore(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Booking id=${id} không tồn tại hoặc chưa bị xóa`,
        );
      return { message: `Đã khôi phục booking id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục booking id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể khôi phục booking');
    }
  }

  // 🔟 Khôi phục nhiều
  async restoreMany(ids: number[]) {
    try {
      await this.bookingRepo.restore({ id: In(ids) });
      return { message: `Đã khôi phục ${ids.length} booking` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều booking',
      );
    }
  }

  // 11️⃣ Xóa vĩnh viễn
  async permanentDelete(id: number) {
    try {
      const booking = await this.bookingRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!booking)
        throw new NotFoundException(`Booking id=${id} không tồn tại`);
      await this.bookingRepo.remove(booking);
      return { message: `Đã xóa vĩnh viễn booking id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa vĩnh viễn id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể xóa vĩnh viễn booking');
    }
  }
}
