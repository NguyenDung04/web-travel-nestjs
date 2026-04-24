import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, In, IsNull, Not, Repository } from 'typeorm';
import { User } from 'src/model/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from 'src/model/entities/role.entity';
import { UserHelper } from 'src/common/helpers/user.helper';
import { UserStatus } from 'src/common/constants/user-status.enum';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Role) private readonly roleRepo: Repository<Role>,
  ) {}

  // 🧩 1) Danh sách active (có phân trang)
  async findAll(pagination?: PaginationDto): Promise<any> {
    try {
      const { page = 1, limit = 20 } = pagination || {};
      const [users, total] = await this.userRepo.findAndCount({
        where: { deletedAt: IsNull() },
        relations: ['role'],
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        message: 'Danh sách người dùng đang hoạt động',
        meta: { page, limit, total },
        data: users,
      };
    } catch (error) {
      this.logger.error(`Lỗi lấy danh sách user: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách user');
    }
  }

  // 🧩 2) Danh sách đã xóa mềm
  async findAllDeleted(pagination?: PaginationDto) {
    try {
      const { page = 1, limit = 20 } = pagination || {};
      const [data, total] = await this.userRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        relations: ['role'],
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách người dùng đã bị xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi lấy user deleted: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách đã xóa mềm',
      );
    }
  }

  // 🧩 3) Chi tiết active
  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['role'],
    });
    if (!user) throw new NotFoundException(`User id=${id} không tồn tại`);
    return user;
  }

  // 🧩 4) Chi tiết deleted
  async findOneDeleted(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: ['role'],
    });
    if (!user)
      throw new NotFoundException(
        `User id=${id} chưa bị xóa hoặc không tồn tại`,
      );
    return user;
  }

  // 🧩 5) Tạo mới
  async createUser(dto: CreateUserDto): Promise<User> {
    try {
      await UserHelper.checkUniqueField(
        this.userRepo,
        'username',
        dto.username,
      );
      await UserHelper.checkUniqueField(this.userRepo, 'email', dto.email);

      const role = await UserHelper.getRoleOrThrow(this.roleRepo, dto.role_id);
      const hashedPassword = await UserHelper.hashPassword(dto.password);

      const user = this.userRepo.create({
        username: dto.username,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        password: hashedPassword,
        status: dto.status ?? UserStatus.INACTIVE,
        lastLoginAt: dto.lastLoginAt ? new Date(dto.lastLoginAt) : null,
        role,
        createdAt: new Date(),
      } as DeepPartial<User>);

      return await this.userRepo.save(user);
    } catch (error) {
      this.logger.error(`Lỗi khi tạo user: ${error.message}`);
      throw new BadRequestException(error.message || 'Không thể tạo user');
    }
  }

  // 🧩 6) Cập nhật
  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findOne(id);

      await UserHelper.checkUniqueField(
        this.userRepo,
        'username',
        dto.username,
        id,
      );
      await UserHelper.checkUniqueField(this.userRepo, 'email', dto.email, id);

      const role = dto.role_id
        ? await UserHelper.getRoleOrThrow(this.roleRepo, dto.role_id)
        : user.role;

      const hashedPassword = dto.password
        ? await UserHelper.hashPassword(dto.password)
        : user.password;

      Object.assign(user, {
        username: dto.username ?? user.username,
        email: dto.email ?? user.email,
        phone: dto.phone ?? user.phone,
        password: hashedPassword,
        status: dto.status ?? user.status,
        lastLoginAt: dto.lastLoginAt
          ? new Date(dto.lastLoginAt)
          : user.lastLoginAt,
        role,
        updatedAt: new Date(),
      });

      return this.userRepo.save(user);
    } catch (error) {
      this.logger.error(`Lỗi cập nhật user id=${id}: ${error.message}`);
      throw new BadRequestException(error.message || 'Không thể cập nhật user');
    }
  }

  // 🧩 7) Xóa mềm
  async softDelete(id: number) {
    const result = await this.userRepo.softDelete(id);
    if (result.affected === 0)
      throw new NotFoundException(`User id=${id} không tồn tại`);
    return { message: `Đã xóa mềm user id=${id}` };
  }

  // 🧩 8) Xóa mềm nhiều
  async softDeleteMany(ids: number[]) {
    await this.userRepo.softDelete({ id: In(ids) });
    return { message: `Đã xóa mềm ${ids.length} user` };
  }

  // 🧩 9) Khôi phục
  async restore(id: number) {
    const result = await this.userRepo.restore(id);
    if (result.affected === 0)
      throw new NotFoundException(
        `User id=${id} không tồn tại hoặc chưa bị xóa`,
      );
    return { message: `Đã khôi phục user id=${id}` };
  }

  // 🧩 10) Khôi phục nhiều
  async restoreMany(ids: number[]) {
    await this.userRepo.restore({ id: In(ids) });
    return { message: `Đã khôi phục ${ids.length} user` };
  }

  // 🧩 11) Xóa vĩnh viễn
  async permanentDelete(id: number) {
    const record = await this.userRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!record) throw new NotFoundException(`User id=${id} không tồn tại`);
    await this.userRepo.remove(record);
    return { message: `Đã xóa vĩnh viễn user id=${id}` };
  }

  // Giữ nguyên các hàm dùng ở Auth / Helper
  async findOneWithRole(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id }, relations: ['role'] });
  }

  async findOneWithPassword(id: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'password', 'status'],
      relations: ['role'],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      select: ['id', 'username', 'email', 'password', 'status'],
      relations: ['role'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'password', 'status'],
      relations: ['role'],
    });
  }

  async updateLastLogin(id: number, date: Date): Promise<void> {
    await this.userRepo.update(id, { lastLoginAt: date });
  }

  async saveUser(user: User): Promise<User> {
    return this.userRepo.save(user);
  }
}
