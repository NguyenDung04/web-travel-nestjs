import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { User } from 'src/model/entities/user.entity';
import { Role } from 'src/model/entities/role.entity';

export class UserHelper {
  /**
   * Kiểm tra username/email có bị trùng không
   */
  static async checkUniqueField(
    repo: Repository<User>,
    field: 'username' | 'email',
    value?: string,
    excludeId?: number,
  ) {
    if (!value) return;
    const exist = await repo.findOne({ where: { [field]: value } });
    if (exist && exist.id !== excludeId) {
      throw new BadRequestException(`${field} đã tồn tại`);
    }
  }

  /**
   * Lấy role theo id, nếu không có thì throw error
   */
  static async getRoleOrThrow(
    roleRepo: Repository<Role>,
    roleId: number,
  ): Promise<Role> {
    const role = await roleRepo.findOne({ where: { id: roleId } });
    if (!role)
      throw new BadRequestException(`Role với id=${roleId} không tồn tại`);
    return role;
  }

  /**
   * Hash password nếu có
   */
  static async hashPassword(password?: string): Promise<string | null> {
    return password ? bcrypt.hash(password, 10) : null;
  }
}
