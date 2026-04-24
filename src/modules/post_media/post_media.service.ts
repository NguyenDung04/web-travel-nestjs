import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { PostMedia } from 'src/model/entities/post-media.entity';
import { Post } from 'src/model/entities/post.entity';
import { Media } from 'src/model/entities/media.entity';
import { CreatePostMediaDto } from './dto/create-post-media.dto';
import { UpdatePostMediaDto } from './dto/update-post-media.dto';
import { PostMediaHelpers } from 'src/common/helpers/post_media.helpers';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class PostMediaService {
  private readonly logger = new Logger(PostMediaService.name);

  constructor(
    @InjectRepository(PostMedia)
    private readonly postMediaRepo: Repository<PostMedia>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
  ) {}

  /** 1️⃣ Lấy danh sách active */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.postMediaRepo.findAndCount({
        where: { deletedAt: IsNull() },
        relations: ['post', 'media'],
        order: { postId: 'ASC', sortOrder: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách PostMedia đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách PostMedia',
      );
    }
  }

  /** 2️⃣ Lấy danh sách đã xóa mềm */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.postMediaRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        relations: ['post', 'media'],
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách PostMedia đã xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy PostMedia đã xóa');
    }
  }

  /** 3️⃣ Chi tiết active */
  async findOneActive(postId: number, mediaId: number) {
    try {
      const data = await this.postMediaRepo.findOne({
        where: { postId, mediaId, deletedAt: IsNull() },
        relations: ['post', 'media'],
      });
      if (!data)
        throw new NotFoundException(
          `PostMedia với postId=${postId} và mediaId=${mediaId} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết PostMedia', data };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy PostMedia: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết PostMedia',
      );
    }
  }

  /** 4️⃣ Chi tiết đã xóa mềm */
  async findOneDeleted(postId: number, mediaId: number) {
    try {
      const data = await this.postMediaRepo.findOne({
        withDeleted: true,
        where: { postId, mediaId, deletedAt: Not(IsNull()) },
        relations: ['post', 'media'],
      });
      if (!data)
        throw new NotFoundException(
          `PostMedia (postId=${postId}, mediaId=${mediaId}) chưa bị xóa`,
        );
      return { message: 'Chi tiết PostMedia đã xóa mềm', data };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy PostMedia đã xóa mềm: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết PostMedia đã xóa',
      );
    }
  }

  /** 5️⃣ Tạo mới */
  async create(dto: CreatePostMediaDto) {
    try {
      const exists = await this.postMediaRepo.exist({
        where: { postId: dto.post_id, mediaId: dto.media_id },
      });
      if (exists)
        throw new BadRequestException(
          `Cặp (post_id=${dto.post_id}, media_id=${dto.media_id}) đã tồn tại`,
        );

      const post = await PostMediaHelpers.ensurePost(
        dto.post_id,
        this.postRepo,
      );
      const media = await PostMediaHelpers.ensureMedia(
        dto.media_id,
        this.mediaRepo,
      );

      const sortOrder =
        dto.sort_order ??
        (await PostMediaHelpers.nextSortOrder(this.postMediaRepo, dto.post_id));

      const entity = this.postMediaRepo.create({
        postId: dto.post_id,
        mediaId: dto.media_id,
        isCover: dto.is_cover,
        caption: dto.caption,
        sortOrder,
        post,
        media,
      });

      const saved = await this.postMediaRepo.save(entity);

      if (dto.is_cover)
        await PostMediaHelpers.enforceSingleCover(
          this.postMediaRepo,
          dto.post_id,
          dto.media_id,
        );

      return { message: 'Tạo PostMedia thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo PostMedia: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Không thể tạo PostMedia');
    }
  }

  /** 6️⃣ Cập nhật */
  async update(postId: number, mediaId: number, dto: UpdatePostMediaDto) {
    try {
      const found = await this.findOneActive(postId, mediaId);
      const entity = found.data;

      if (dto.caption !== undefined) entity.caption = dto.caption ?? null;
      if (dto.sort_order !== undefined) entity.sortOrder = dto.sort_order;
      if (dto.is_cover !== undefined) entity.isCover = dto.is_cover;

      const saved = await this.postMediaRepo.save(entity);

      if (dto.is_cover)
        await PostMediaHelpers.enforceSingleCover(
          this.postMediaRepo,
          postId,
          mediaId,
        );

      return { message: 'Cập nhật PostMedia thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật PostMedia: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể cập nhật PostMedia');
    }
  }

  /** 7️⃣ Xóa mềm */
  async softDelete(postId: number, mediaId: number) {
    try {
      const result = await this.postMediaRepo.softDelete({ postId, mediaId });
      if (result.affected === 0)
        throw new NotFoundException(
          `PostMedia (postId=${postId}, mediaId=${mediaId}) không tồn tại`,
        );
      return {
        message: `Đã xóa mềm PostMedia (postId=${postId}, mediaId=${mediaId})`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm PostMedia: ${error.message}`);
      throw new InternalServerErrorException('Không thể xóa mềm PostMedia');
    }
  }

  /** 8️⃣ Xóa mềm nhiều theo postId */
  async softDeleteMany(postId: number) {
    try {
      const result = await this.postMediaRepo.softDelete({ postId });
      return {
        message: `Đã xóa mềm ${result.affected ?? 0} PostMedia của postId=${postId}`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều PostMedia: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể xóa mềm nhiều PostMedia',
      );
    }
  }

  /** 9️⃣ Khôi phục 1 */
  async restore(postId: number, mediaId: number) {
    try {
      const result = await this.postMediaRepo.restore({ postId, mediaId });
      if (result.affected === 0)
        throw new NotFoundException(
          `PostMedia (postId=${postId}, mediaId=${mediaId}) không tồn tại hoặc chưa bị xóa`,
        );
      return {
        message: `Đã khôi phục PostMedia (postId=${postId}, mediaId=${mediaId})`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục PostMedia: ${error.message}`);
      throw new InternalServerErrorException('Không thể khôi phục PostMedia');
    }
  }

  /** 🔟 Khôi phục nhiều theo postId */
  async restoreMany(postId: number) {
    try {
      const result = await this.postMediaRepo.restore({ postId });
      return {
        message: `Đã khôi phục ${result.affected ?? 0} PostMedia của postId=${postId}`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều PostMedia: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều PostMedia',
      );
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(postId: number, mediaId: number) {
    try {
      const data = await this.postMediaRepo.findOne({
        where: { postId, mediaId },
        withDeleted: true,
      });
      if (!data)
        throw new NotFoundException(
          `PostMedia (postId=${postId}, mediaId=${mediaId}) không tồn tại`,
        );
      await this.postMediaRepo.remove(data);
      return {
        message: `Đã xóa vĩnh viễn PostMedia (postId=${postId}, mediaId=${mediaId})`,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa vĩnh viễn PostMedia: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn PostMedia',
      );
    }
  }
}
