import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, IsNull, Not, Repository } from 'typeorm';
import { Category } from 'src/model/entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { generateSlug } from 'src/common/helpers/slug.helper';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  /** 🔹 Kiểm tra tên trùng lặp */
  private async ensureUniqueName(name: string, excludeId?: number) {
    const exist = await this.categoryRepo.findOne({
      where: { name: ILike(name) },
      withDeleted: true,
    });
    if (exist && exist.id !== excludeId)
      throw new BadRequestException(`Tên danh mục '${name}' đã tồn tại`);
  }

  /** 1️⃣ Lấy tất cả (trừ xóa mềm) */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.categoryRepo.findAndCount({
        where: { deletedAt: IsNull() },
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        message: 'Danh sách danh mục đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy danh sách category active: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Không thể lấy danh sách danh mục',
      );
    }
  }

  /** 2️⃣ Lấy tất cả (đã xóa mềm) */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.categoryRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        message: 'Danh sách danh mục đã bị xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy danh sách category deleted: ${error.message}`,
      );
      throw new InternalServerErrorException('Không thể lấy danh sách đã xóa');
    }
  }

  /** 3️⃣ Lấy chi tiết (trừ xóa mềm) */
  async findOneActive(id: number) {
    try {
      const category = await this.categoryRepo.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!category)
        throw new NotFoundException(
          `Category id=${id} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết category', data: category };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy category id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể lấy chi tiết category');
    }
  }

  /** 4️⃣ Lấy chi tiết (đã xóa mềm) */
  async findOneDeleted(id: number) {
    try {
      const category = await this.categoryRepo.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
      });
      if (!category)
        throw new NotFoundException(
          `Category id=${id} chưa bị xóa hoặc không tồn tại`,
        );
      return { message: 'Chi tiết category đã xóa mềm', data: category };
    } catch (error) {
      this.logger.error(
        `Lỗi khi lấy category deleted id=${id}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết category đã xóa',
      );
    }
  }

  /** 5️⃣ Tạo mới */
  async create(dto: CreateCategoryDto) {
    try {
      await this.ensureUniqueName(dto.name);
      const category = this.categoryRepo.create({
        name: dto.name.trim(),
        slug: generateSlug(dto.name),
      });
      const saved = await this.categoryRepo.save(category);
      return { message: 'Tạo danh mục thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo category: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Không thể tạo danh mục');
    }
  }

  /** 6️⃣ Cập nhật */
  async update(id: number, dto: UpdateCategoryDto) {
    try {
      const category = await this.categoryRepo.findOne({
        where: { id, deletedAt: IsNull() },
      });
      if (!category)
        throw new NotFoundException(
          `Category id=${id} không tồn tại hoặc đã bị xóa`,
        );

      if (dto.name && dto.name.trim() !== category.name) {
        await this.ensureUniqueName(dto.name, id);
        category.name = dto.name.trim();
        category.slug = generateSlug(dto.name);
      }

      const updated = await this.categoryRepo.save(category);
      return { message: 'Cập nhật danh mục thành công', data: updated };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật category id=${id}: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Không thể cập nhật danh mục');
    }
  }

  /** 7️⃣ Xóa mềm 1 */
  async softDelete(id: number) {
    try {
      const result = await this.categoryRepo.softDelete(id);
      if (result.affected === 0)
        throw new NotFoundException(`Category id=${id} không tồn tại`);
      return { message: `Đã xóa mềm category id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể xóa mềm category');
    }
  }

  /** 8️⃣ Xóa mềm nhiều */
  async softDeleteMany(ids: number[]) {
    try {
      await this.categoryRepo.softDelete({ id: In(ids) });
      return { message: `Đã xóa mềm ${ids.length} category` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều category: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể xóa mềm nhiều category',
      );
    }
  }

  /** 9️⃣ Khôi phục 1 */
  async restore(id: number) {
    try {
      const result = await this.categoryRepo.restore(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Category id=${id} không tồn tại hoặc chưa bị xóa`,
        );
      return { message: `Đã khôi phục category id=${id}` };
    } catch (error) {
      this.logger.error(
        `Lỗi khi khôi phục category id=${id}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể khôi phục category');
    }
  }

  /** 🔟 Khôi phục nhiều */
  async restoreMany(ids: number[]) {
    try {
      await this.categoryRepo.restore({ id: In(ids) });
      return { message: `Đã khôi phục ${ids.length} category` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều category: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều category',
      );
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(id: number) {
    try {
      const category = await this.categoryRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!category)
        throw new NotFoundException(`Category id=${id} không tồn tại`);
      await this.categoryRepo.remove(category);
      return { message: `Đã xóa vĩnh viễn category id=${id}` };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa vĩnh viễn category id=${id}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn category',
      );
    }
  }
}
