import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Customer } from 'src/model/entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  /** 1️⃣ Lấy tất cả khách hàng (trừ xóa mềm) */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.customerRepo.findAndCount({
        where: { deletedAt: IsNull() },
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        message: 'Danh sách khách hàng đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách khách hàng',
      );
    }
  }

  /** 2️⃣ Lấy tất cả khách hàng đã xóa mềm */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.customerRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        message: 'Danh sách khách hàng đã bị xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách đã xóa');
    }
  }

  /** 3️⃣ Lấy chi tiết khách hàng (trừ xóa mềm) */
  async findOneActive(id: number) {
    try {
      const customer = await this.customerRepo.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!customer)
        throw new NotFoundException(
          `Khách hàng id=${id} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết khách hàng', data: customer };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy khách hàng id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết khách hàng',
      );
    }
  }

  /** 4️⃣ Lấy chi tiết khách hàng đã xóa mềm */
  async findOneDeleted(id: number) {
    try {
      const customer = await this.customerRepo.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
      });
      if (!customer)
        throw new NotFoundException(
          `Khách hàng id=${id} chưa bị xóa hoặc không tồn tại`,
        );
      return { message: 'Chi tiết khách hàng đã xóa mềm', data: customer };
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy khách hàng deleted id=${id}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết khách hàng đã xóa',
      );
    }
  }

  /** 5️⃣ Thêm khách hàng mới */
  async create(dto: CreateCustomerDto) {
    try {
      if (dto.email) {
        const exist = await this.customerRepo.findOne({
          where: { email: dto.email },
        });
        if (exist)
          throw new BadRequestException(`Email ${dto.email} đã tồn tại`);
      }

      const customer = this.customerRepo.create(dto as any);
      const saved = await this.customerRepo.save(customer);
      return { message: 'Tạo khách hàng thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo khách hàng: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Không thể tạo khách hàng');
    }
  }

  /** 6️⃣ Cập nhật thông tin khách hàng */
  async update(id: number, dto: UpdateCustomerDto) {
    try {
      const customer = await this.customerRepo.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!customer)
        throw new NotFoundException(
          `Khách hàng id=${id} không tồn tại hoặc đã bị xóa`,
        );

      if (dto.email && dto.email !== customer.email) {
        const exist = await this.customerRepo.findOne({
          where: { email: dto.email },
        });
        if (exist)
          throw new BadRequestException(`Email ${dto.email} đã tồn tại`);
      }

      Object.assign(customer, dto);
      const updated = await this.customerRepo.save(customer);
      return { message: 'Cập nhật khách hàng thành công', data: updated };
    } catch (error) {
      this.logger.error(
        `Lỗi khi cập nhật khách hàng id=${id}: ${error.message}`,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Không thể cập nhật khách hàng');
    }
  }

  /** 7️⃣ Xóa mềm 1 khách hàng */
  async softDelete(id: number) {
    try {
      const result = await this.customerRepo.softDelete(id);
      if (result.affected === 0)
        throw new NotFoundException(`Khách hàng id=${id} không tồn tại`);
      return { message: `Đã xóa mềm khách hàng id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể xóa mềm khách hàng');
    }
  }

  /** 8️⃣ Xóa mềm nhiều khách hàng */
  async softDeleteMany(ids: number[]) {
    try {
      await this.customerRepo.softDelete({ id: In(ids) });
      return { message: `Đã xóa mềm ${ids.length} khách hàng` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể xóa mềm nhiều khách hàng',
      );
    }
  }

  /** 9️⃣ Khôi phục 1 khách hàng */
  async restore(id: number) {
    try {
      const result = await this.customerRepo.restore(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Khách hàng id=${id} không tồn tại hoặc chưa bị xóa`,
        );
      return { message: `Đã khôi phục khách hàng id=${id}` };
    } catch (error) {
      this.logger.error(
        `Lỗi khi khôi phục khách hàng id=${id}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể khôi phục khách hàng');
    }
  }

  /** 🔟 Khôi phục nhiều khách hàng */
  async restoreMany(ids: number[]) {
    try {
      await this.customerRepo.restore({ id: In(ids) });
      return { message: `Đã khôi phục ${ids.length} khách hàng` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều khách hàng: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều khách hàng',
      );
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(id: number) {
    try {
      const customer = await this.customerRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!customer)
        throw new NotFoundException(`Khách hàng id=${id} không tồn tại`);
      await this.customerRepo.remove(customer);
      return { message: `Đã xóa vĩnh viễn khách hàng id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa vĩnh viễn id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn khách hàng',
      );
    }
  }
}
