/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
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
import { DataSource } from 'typeorm';
import { Media } from 'src/model/entities/media.entity';
import { CreateMediaDto } from './dto/create-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { User } from 'src/model/entities/user.entity';
import { Post } from 'src/model/entities/post.entity';
import { assertSingleSource } from 'src/common/helpers/media/media-source.helper';
import { resolveCreator } from 'src/common/helpers/media/media-creator.helper';
import { prepareFromFile } from 'src/common/helpers/media/media-file.helper';
import { prepareFromUrl } from 'src/common/helpers/media/media-url.helper';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly AUTO_MIRROR =
    (process.env.MEDIA_AUTO_MIRROR ?? 'true').toLowerCase() === 'true';
  private readonly MAX_BYTES = Number(
    process.env.UPLOAD_IMAGE_MAX_BYTES ?? 5 * 1024 * 1024,
  );

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  /** 1️⃣ Lấy tất cả media (trừ soft delete) */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.mediaRepo.findAndCount({
        where: { deletedAt: IsNull() },
        relations: { createdBy: true },
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách media đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách media');
    }
  }

  /** 2️⃣ Lấy tất cả media đã xóa mềm */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.mediaRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        relations: { createdBy: true },
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách media đã bị xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách đã xóa');
    }
  }

  /** 3️⃣ Lấy chi tiết media (trừ soft delete) */
  async findOneActive(id: number) {
    try {
      const media = await this.mediaRepo.findOne({
        where: { id, deletedAt: IsNull() },
        relations: { createdBy: true },
      });
      if (!media)
        throw new NotFoundException(
          `Media id=${id} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết media', data: media };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy media id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể lấy chi tiết media');
    }
  }

  /** 4️⃣ Lấy chi tiết media đã xóa mềm */
  async findOneDeleted(id: number) {
    try {
      const media = await this.mediaRepo.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
        relations: { createdBy: true },
      });
      if (!media)
        throw new NotFoundException(
          `Media id=${id} chưa bị xóa hoặc không tồn tại`,
        );
      return { message: 'Chi tiết media đã xóa mềm', data: media };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy media deleted id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết media đã xóa',
      );
    }
  }

  /** 5️⃣ Tạo mới (qua URL hoặc upload file) */
  async create(
    dto: CreateMediaDto,
    file?: Express.Multer.File,
    actorId?: number,
  ) {
    try {
      const { hasUrl, hasFile } = assertSingleSource(dto?.url, file);
      const creator = await resolveCreator(
        this.userRepo,
        dto?.createdBy ?? actorId,
      );

      const payload = hasFile
        ? await prepareFromFile(this.mediaRepo, file!)
        : await prepareFromUrl(this.mediaRepo, dto!.url, {
            autoMirror: this.AUTO_MIRROR,
            maxBytes: this.MAX_BYTES,
          });

      const entity = this.mediaRepo.create({
        fileName: dto?.fileName?.trim() || payload.fileName,
        url: payload.url,
        createdBy: creator,
      });
      const saved = await this.mediaRepo.save(entity);
      return { message: 'Tạo media thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo media: ${error.message}`);
      throw new InternalServerErrorException('Không thể tạo media');
    }
  }

  /** 6️⃣ Cập nhật (URL hoặc file) */
  async update(id: number, dto: UpdateMediaDto, file?: Express.Multer.File) {
    try {
      const found = await this.findOneActive(id);
      const media = found.data;

      const hasUrl = !!dto.url;
      const hasFile = !!file;

      if (hasUrl && hasFile)
        throw new BadRequestException('Chỉ chọn 1 trong 2: URL hoặc file');

      if (dto.createdBy !== undefined) {
        media.createdBy = await resolveCreator(
          this.userRepo,
          dto.createdBy as number,
          true,
        );
      }

      if (hasFile) {
        const payload = await prepareFromFile(this.mediaRepo, file!, id);
        media.url = payload.url;
        if (!dto.fileName) media.fileName = payload.fileName;
      }

      if (hasUrl) {
        if (!dto.url)
          throw new BadRequestException('Thiếu URL để cập nhật media');
        const payload = await prepareFromUrl(
          this.mediaRepo,
          dto.url as string,
          {
            autoMirror: this.AUTO_MIRROR,
            maxBytes: this.MAX_BYTES,
            excludeId: id,
          },
        );
        media.url = payload.url;
        if (dto.fileName) media.fileName = dto.fileName;
      }

      if (dto.fileName) media.fileName = dto.fileName;
      const updated = await this.mediaRepo.save(media);
      return { message: 'Cập nhật media thành công', data: updated };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật media id=${id}: ${error.message}`);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException('Không thể cập nhật media');
    }
  }

  /** 7️⃣ Xóa mềm */
  async softDelete(id: number) {
    try {
      const result = await this.mediaRepo.softDelete(id);
      if (result.affected === 0)
        throw new NotFoundException(`Media id=${id} không tồn tại`);
      return { message: `Đã xóa mềm media id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể xóa mềm media');
    }
  }

  /** 8️⃣ Xóa mềm nhiều */
  async softDeleteMany(ids: number[]) {
    try {
      await this.mediaRepo.softDelete({ id: In(ids) });
      return { message: `Đã xóa mềm ${ids.length} media` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều media: ${error.message}`);
      throw new InternalServerErrorException('Không thể xóa mềm nhiều media');
    }
  }

  /** 9️⃣ Khôi phục 1 */
  async restore(id: number) {
    try {
      const result = await this.mediaRepo.restore(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Media id=${id} không tồn tại hoặc chưa bị xóa`,
        );
      return { message: `Đã khôi phục media id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục media id=${id}: ${error.message}`);
      throw new InternalServerErrorException('Không thể khôi phục media');
    }
  }

  /** 🔟 Khôi phục nhiều */
  async restoreMany(ids: number[]) {
    try {
      await this.mediaRepo.restore({ id: In(ids) });
      return { message: `Đã khôi phục ${ids.length} media` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều media: ${error.message}`);
      throw new InternalServerErrorException('Không thể khôi phục nhiều media');
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(id: number) {
    try {
      const media = await this.mediaRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!media) throw new NotFoundException(`Media id=${id} không tồn tại`);
      await this.mediaRepo.remove(media);
      return { message: `Đã xóa vĩnh viễn media id=${id}` };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa vĩnh viễn media id=${id}: ${error.message}`,
      );
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể xóa vĩnh viễn media');
    }
  }
}
