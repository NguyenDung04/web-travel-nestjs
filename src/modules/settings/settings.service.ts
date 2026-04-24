/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { Setting } from 'src/model/entities/setting.entity';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
  ) {}

  /** 1️⃣ Danh sách active */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.settingsRepo.findAndCount({
        where: { deletedAt: IsNull() },
        order: { sort_order: 'ASC', key: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      const parsed = data.map((s) => ({
        ...s,
        value_json:
          typeof s.value_json === 'string'
            ? JSON.parse(s.value_json)
            : s.value_json,
      }));
      return {
        message: 'Danh sách settings đang hoạt động',
        meta: { page, limit, total },
        data: parsed,
      };
    } catch (error) {
      this.logger.error(`Lỗi lấy danh sách settings active: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách settings',
      );
    }
  }

  /** 2️⃣ Danh sách deleted */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.settingsRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách settings đã xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách đã xóa');
    }
  }

  /** 3️⃣ Chi tiết active */
  async findOneActive(key: string) {
    const setting = await this.settingsRepo.findOne({
      where: { key, deletedAt: IsNull() },
    });
    if (!setting)
      throw new NotFoundException(
        `Setting với key=${key} không tồn tại hoặc đã bị xóa`,
      );
    return setting;
  }

  /** 4️⃣ Chi tiết deleted */
  async findOneDeleted(key: string) {
    const setting = await this.settingsRepo.findOne({
      where: { key, deletedAt: Not(IsNull()) },
      withDeleted: true,
    });
    if (!setting)
      throw new NotFoundException(
        `Setting với key=${key} chưa bị xóa hoặc không tồn tại`,
      );
    return setting;
  }

  /** 5️⃣ Tạo mới */
  async create(dto: CreateSettingDto): Promise<Setting> {
    try {
      const exist = await this.settingsRepo.findOne({
        where: { key: dto.key },
      });
      if (exist)
        throw new BadRequestException(
          `Setting với key='${dto.key}' đã tồn tại`,
        );

      const parsedJson =
        dto.value_json && typeof dto.value_json === 'string'
          ? JSON.parse(dto.value_json)
          : dto.value_json;

      const setting = this.settingsRepo.create({
        ...dto,
        // ép kiểu đúng theo entity
        start_web: Boolean(dto.start_web),
        value_json: parsedJson ?? null,
      } as Partial<Setting>);

      const saved = await this.settingsRepo.save(setting as Setting);
      return saved;
    } catch (error) {
      this.logger.error(`Lỗi khi tạo setting: ${error.message}`);
      if (error instanceof SyntaxError)
        throw new BadRequestException(
          'Giá trị value_json không hợp lệ (JSON sai định dạng)',
        );
      throw new InternalServerErrorException('Không thể tạo setting');
    }
  }

  /** 6️⃣ Cập nhật */
  async update(key: string, dto: UpdateSettingDto): Promise<Setting> {
    try {
      const setting = await this.findOneActive(key);
      if (dto.value_json) {
        try {
          setting.value_json =
            typeof dto.value_json === 'string'
              ? JSON.parse(dto.value_json)
              : dto.value_json;
        } catch {
          throw new BadRequestException('value_json phải là JSON hợp lệ');
        }
      }
      Object.assign(setting, dto);
      return await this.settingsRepo.save(setting);
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật setting ${key}: ${error.message}`);
      throw error;
    }
  }

  /** 7️⃣ Xóa mềm */
  async softDelete(key: string) {
    const result = await this.settingsRepo.softDelete(key);
    if (result.affected === 0)
      throw new NotFoundException(`Setting với key=${key} không tồn tại`);
    return { message: `Đã xóa mềm setting key=${key}` };
  }

  /** 8️⃣ Xóa mềm nhiều */
  async softDeleteMany(keys: string[]) {
    await this.settingsRepo.softDelete({ key: In(keys) });
    return { message: `Đã xóa mềm ${keys.length} setting` };
  }

  /** 9️⃣ Khôi phục 1 */
  async restore(key: string) {
    const result = await this.settingsRepo.restore(key);
    if (result.affected === 0)
      throw new NotFoundException(
        `Setting key=${key} không tồn tại hoặc chưa bị xóa`,
      );
    return { message: `Đã khôi phục setting key=${key}` };
  }

  /** 🔟 Khôi phục nhiều */
  async restoreMany(keys: string[]) {
    await this.settingsRepo.restore({ key: In(keys) });
    return { message: `Đã khôi phục ${keys.length} setting` };
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(key: string) {
    const record = await this.settingsRepo.findOne({
      where: { key },
      withDeleted: true,
    });
    if (!record)
      throw new NotFoundException(`Setting key=${key} không tồn tại`);
    await this.settingsRepo.remove(record);
    return { message: `Đã xóa vĩnh viễn setting key=${key}` };
  }
}
