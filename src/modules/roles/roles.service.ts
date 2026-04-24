import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Role } from 'src/model/entities/role.entity';
import { User } from 'src/model/entities/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class RolesService {
  private readonly logger = new Logger(RolesService.name);

  constructor(
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  /** 1️⃣ Lấy danh sách roles đang hoạt động */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.roleRepo.findAndCount({
        where: { deletedAt: IsNull() },
        order: { id: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách vai trò đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách vai trò');
    }
  }

  /** 2️⃣ Lấy danh sách roles đã xóa mềm */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.roleRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách vai trò đã xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách đã xóa');
    }
  }

  /** 3️⃣ Chi tiết role active */
  async findOneActive(id: number) {
    try {
      const role = await this.roleRepo.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!role)
        throw new NotFoundException(
          `Role id=${id} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết vai trò', data: role };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy role id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể lấy chi tiết vai trò');
    }
  }

  /** 4️⃣ Chi tiết role đã xóa mềm */
  async findOneDeleted(id: number) {
    try {
      const role = await this.roleRepo.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
      });
      if (!role)
        throw new NotFoundException(
          `Role id=${id} chưa bị xóa hoặc không tồn tại`,
        );
      return { message: 'Chi tiết vai trò đã xóa mềm', data: role };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy role deleted id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết vai trò đã xóa',
      );
    }
  }

  /** 5️⃣ Tạo mới role */
  async create(dto: CreateRoleDto) {
    try {
      const exist = await this.roleRepo.findOne({ where: { name: dto.name } });
      if (exist) throw new BadRequestException(`Role '${dto.name}' đã tồn tại`);

      const role = this.roleRepo.create(dto);
      const saved = await this.roleRepo.save(role);
      return { message: 'Tạo role thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo role: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Không thể tạo vai trò');
    }
  }

  /** 6️⃣ Cập nhật role */
  async update(id: number, dto: UpdateRoleDto) {
    try {
      const found = await this.findOneActive(id);
      const role = found.data;

      if (dto.name && dto.name !== role.name) {
        const exist = await this.roleRepo.findOne({
          where: { name: dto.name },
        });
        if (exist)
          throw new BadRequestException(`Role '${dto.name}' đã tồn tại`);
      }

      Object.assign(role, dto);
      const updated = await this.roleRepo.save(role);
      return { message: 'Cập nhật role thành công', data: updated };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật role id=${id}: ${error.message}`);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException('Không thể cập nhật vai trò');
    }
  }

  /** 7️⃣ Xóa mềm 1 */
  async softDelete(id: number) {
    try {
      const result = await this.roleRepo.softDelete(id);
      if (result.affected === 0)
        throw new NotFoundException(`Role id=${id} không tồn tại`);
      return { message: `Đã xóa mềm role id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm role id=${id}: ${error.message}`);
      throw new InternalServerErrorException('Không thể xóa mềm role');
    }
  }

  /** 8️⃣ Xóa mềm nhiều */
  async softDeleteMany(ids: number[]) {
    try {
      await this.roleRepo.softDelete({ id: In(ids) });
      return { message: `Đã xóa mềm ${ids.length} vai trò` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều role: ${error.message}`);
      throw new InternalServerErrorException('Không thể xóa mềm nhiều vai trò');
    }
  }

  /** 9️⃣ Khôi phục 1 */
  async restore(id: number) {
    try {
      const result = await this.roleRepo.restore(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Role id=${id} không tồn tại hoặc chưa bị xóa`,
        );
      return { message: `Đã khôi phục role id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục role id=${id}: ${error.message}`);
      throw new InternalServerErrorException('Không thể khôi phục vai trò');
    }
  }

  /** 🔟 Khôi phục nhiều */
  async restoreMany(ids: number[]) {
    try {
      await this.roleRepo.restore({ id: In(ids) });
      return { message: `Đã khôi phục ${ids.length} vai trò` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều role: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều vai trò',
      );
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(id: number) {
    try {
      const role = await this.roleRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!role) throw new NotFoundException(`Role id=${id} không tồn tại`);

      // reset role_id của tất cả user về NULL
      await this.userRepo.update({ role }, { role: null });

      await this.roleRepo.remove(role);
      return {
        message: `Đã xóa vĩnh viễn role id=${id}, và reset role_id của users`,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa vĩnh viễn role id=${id}: ${error.message}`,
      );
      throw new InternalServerErrorException('Không thể xóa vĩnh viễn vai trò');
    }
  }
}
