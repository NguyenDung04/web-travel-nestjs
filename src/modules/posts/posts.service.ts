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
import { Post as PostEntity } from 'src/model/entities/post.entity';
import { Media } from 'src/model/entities/media.entity';
import { User } from 'src/model/entities/user.entity';
import { Category } from 'src/model/entities/category.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostStatus } from 'src/common/constants/post-status.enum';
import { PostType } from 'src/common/constants/post-type.enum';
import { PostsHelpers } from 'src/common/helpers/posts.helpers';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepo: Repository<PostEntity>,
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  /** 1️⃣ Lấy danh sách bài viết (active) */
  async findAllActive(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.postsRepo.findAndCount({
        where: { deletedAt: IsNull() },
        relations: ['thumbnail', 'createdBy', 'primaryCategory'],
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách bài viết đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách active: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách bài viết',
      );
    }
  }

  /** 2️⃣ Lấy danh sách bài viết đã xóa mềm */
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.postsRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        relations: ['thumbnail', 'createdBy', 'primaryCategory'],
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách bài viết đã xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy danh sách deleted: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách đã xóa');
    }
  }

  /** 3️⃣ Chi tiết bài viết (active) */
  async findOneActive(id: number) {
    try {
      const post = await this.postsRepo.findOne({
        where: { id, deletedAt: IsNull() },
        relations: ['thumbnail', 'createdBy', 'primaryCategory'],
      });
      if (!post)
        throw new NotFoundException(
          `Post id=${id} không tồn tại hoặc đã bị xóa`,
        );
      return { message: 'Chi tiết bài viết', data: post };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy post id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Không thể lấy chi tiết bài viết');
    }
  }

  /** 4️⃣ Chi tiết bài viết (đã xóa mềm) */
  async findOneDeleted(id: number) {
    try {
      const post = await this.postsRepo.findOne({
        withDeleted: true,
        where: { id, deletedAt: Not(IsNull()) },
        relations: ['thumbnail', 'createdBy', 'primaryCategory'],
      });
      if (!post)
        throw new NotFoundException(
          `Post id=${id} chưa bị xóa hoặc không tồn tại`,
        );
      return { message: 'Chi tiết bài viết đã xóa mềm', data: post };
    } catch (error) {
      this.logger.error(`Lỗi khi lấy post deleted id=${id}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Không thể lấy chi tiết bài viết đã xóa',
      );
    }
  }

  /** 5️⃣ Tạo mới bài viết */
  async create(dto: CreatePostDto) {
    try {
      if (!dto.title) throw new BadRequestException('title là bắt buộc');
      if (!dto.post_type)
        throw new BadRequestException('post_type là bắt buộc');

      const slug = await PostsHelpers.buildUniqueSlug(
        this.postsRepo,
        dto.title,
        dto.slug,
      );

      const thumbnail =
        dto.thumbnail_id != null
          ? await PostsHelpers.ensureMedia(dto.thumbnail_id, this.mediaRepo)
          : undefined;

      const createdBy =
        dto.created_by != null
          ? await PostsHelpers.ensureUser(dto.created_by, this.usersRepo)
          : undefined;

      const primaryCategory =
        dto.primary_category_id != null
          ? await PostsHelpers.ensureCategory(
              dto.primary_category_id,
              this.categoriesRepo,
            )
          : undefined;

      let latitude: number | undefined = dto.latitude;
      let longitude: number | undefined = dto.longitude;
      if (dto.address && (latitude == null || longitude == null)) {
        const geo = await PostsHelpers.geocodeAddress(dto.address);
        if (geo) {
          latitude = geo.latitude;
          longitude = geo.longitude;
        }
      }

      const entity = this.postsRepo.create({
        postType: dto.post_type as PostType,
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        content: dto.content,
        thumbnail,
        status: dto.status ?? PostStatus.DRAFT,
        seoTitle: dto.seo_title ?? null,
        seoDescription: dto.seo_description ?? null,
        address: dto.address ?? null,
        publishedAt: dto.published_at ? new Date(dto.published_at) : null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        createdBy: createdBy ?? null,
        taxonomy: dto.taxonomy ?? null,
        primaryCategory: primaryCategory ?? null,
      });

      const saved = await this.postsRepo.save(entity);
      return { message: 'Tạo bài viết thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi tạo bài viết: ${error.message}`);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Không thể tạo bài viết');
    }
  }

  /** 6️⃣ Cập nhật bài viết */
  async update(id: number, dto: UpdatePostDto) {
    try {
      const found = await this.findOneActive(id);
      const post = found.data;

      if (dto.slug || dto.title) {
        post.slug = await PostsHelpers.buildUniqueSlug(
          this.postsRepo,
          dto.title ?? post.title,
          dto.slug,
          post.id,
        );
      }

      if (dto.title !== undefined) post.title = dto.title;
      if (dto.post_type !== undefined)
        post.postType = dto.post_type as PostType;
      if (dto.excerpt !== undefined) post.excerpt = dto.excerpt ?? null;
      if (dto.content !== undefined) post.content = dto.content ?? null;
      if (dto.status !== undefined) post.status = dto.status as PostStatus;
      if (dto.seo_title !== undefined) post.seoTitle = dto.seo_title ?? null;
      if (dto.seo_description !== undefined)
        post.seoDescription = dto.seo_description ?? null;
      if (dto.taxonomy !== undefined) post.taxonomy = dto.taxonomy ?? null;

      if (dto.thumbnail_id !== undefined) {
        post.thumbnail =
          dto.thumbnail_id == null
            ? null
            : await PostsHelpers.ensureMedia(dto.thumbnail_id, this.mediaRepo);
      }

      if (dto.created_by !== undefined) {
        post.createdBy =
          dto.created_by == null
            ? null
            : await PostsHelpers.ensureUser(dto.created_by, this.usersRepo);
      }

      if (dto.primary_category_id !== undefined) {
        post.primaryCategory =
          dto.primary_category_id == null
            ? null
            : await PostsHelpers.ensureCategory(
                dto.primary_category_id,
                this.categoriesRepo,
              );
      }

      if (dto.address !== undefined) {
        post.address = dto.address ?? null;
        if (dto.latitude == null && dto.longitude == null && dto.address) {
          const geo = await PostsHelpers.geocodeAddress(dto.address);
          if (geo) {
            post.latitude = geo.latitude;
            post.longitude = geo.longitude;
          }
        }
      }

      if (dto.latitude !== undefined) post.latitude = dto.latitude ?? null;
      if (dto.longitude !== undefined) post.longitude = dto.longitude ?? null;

      if (dto.published_at !== undefined) {
        post.publishedAt = dto.published_at ? new Date(dto.published_at) : null;
      }

      const saved = await this.postsRepo.save(post);
      return { message: 'Cập nhật bài viết thành công', data: saved };
    } catch (error) {
      this.logger.error(`Lỗi khi cập nhật bài viết id=${id}: ${error.message}`);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Không thể cập nhật bài viết');
    }
  }

  /** 7️⃣ Xóa mềm */
  async softDelete(id: number) {
    try {
      const result = await this.postsRepo.softDelete(id);
      if (result.affected === 0)
        throw new NotFoundException(`Post id=${id} không tồn tại`);
      return { message: `Đã xóa mềm bài viết id=${id}` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm bài viết id=${id}: ${error.message}`);
      throw new InternalServerErrorException('Không thể xóa mềm bài viết');
    }
  }

  /** 8️⃣ Xóa mềm nhiều */
  async softDeleteMany(ids: number[]) {
    try {
      await this.postsRepo.softDelete({ id: In(ids) });
      return { message: `Đã xóa mềm ${ids.length} bài viết` };
    } catch (error) {
      this.logger.error(`Lỗi khi xóa mềm nhiều bài viết: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể xóa mềm nhiều bài viết',
      );
    }
  }

  /** 9️⃣ Khôi phục */
  async restore(id: number) {
    try {
      const result = await this.postsRepo.restore(id);
      if (result.affected === 0)
        throw new NotFoundException(
          `Post id=${id} không tồn tại hoặc chưa bị xóa`,
        );
      return { message: `Đã khôi phục bài viết id=${id}` };
    } catch (error) {
      this.logger.error(
        `Lỗi khi khôi phục bài viết id=${id}: ${error.message}`,
      );
      throw new InternalServerErrorException('Không thể khôi phục bài viết');
    }
  }

  /** 🔟 Khôi phục nhiều */
  async restoreMany(ids: number[]) {
    try {
      await this.postsRepo.restore({ id: In(ids) });
      return { message: `Đã khôi phục ${ids.length} bài viết` };
    } catch (error) {
      this.logger.error(`Lỗi khi khôi phục nhiều bài viết: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể khôi phục nhiều bài viết',
      );
    }
  }

  /** 11️⃣ Xóa vĩnh viễn */
  async permanentDelete(id: number) {
    try {
      const post = await this.postsRepo.findOne({
        where: { id },
        withDeleted: true,
      });
      if (!post) throw new NotFoundException(`Post id=${id} không tồn tại`);
      await this.postsRepo.remove(post);
      return { message: `Đã xóa vĩnh viễn bài viết id=${id}` };
    } catch (error) {
      this.logger.error(
        `Lỗi khi xóa vĩnh viễn bài viết id=${id}: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Không thể xóa vĩnh viễn bài viết',
      );
    }
  }
}
