import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from 'src/model/entities/user.entity';

// Overloads để TS hiểu rõ kiểu trả về
export function resolveCreator(
  userRepo: Repository<User>,
  creatorId: number,
  required: true,
): Promise<User>;
export function resolveCreator(
  userRepo: Repository<User>,
  creatorId?: number,
  required?: false,
): Promise<User | undefined>;

// Implementation
export async function resolveCreator(
  userRepo: Repository<User>,
  creatorId?: number,
  required = false,
): Promise<User | undefined> {
  if (creatorId === undefined || creatorId === null) {
    if (required) throw new NotFoundException('Thiếu createdBy');
    return undefined;
  }
  const u = await userRepo.findOne({ where: { id: creatorId } });
  if (!u) throw new NotFoundException(`User id=${creatorId} không tồn tại`);
  return u;
}
