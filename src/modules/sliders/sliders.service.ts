import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';

import { Slider } from 'src/model/entities/slider.entity';
import { Media } from 'src/model/entities/media.entity';
import { Post } from 'src/model/entities/post.entity';

import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { PaginationDto } from 'src/model/dto/pagination.dto';

@Injectable()
export class SlidersService {
  private readonly logger = new Logger(SlidersService.name);

  constructor(
    @InjectRepository(Slider) private readonly sliderRepo: Repository<Slider>,
    @InjectRepository(Media) private readonly mediaRepo: Repository<Media>,
    @InjectRepository(Post) private readonly postRepo: Repository<Post>,
  ) {}

  // 🧩 1) Lấy tất cả (active)
  async findAll(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.sliderRepo.findAndCount({
        where: { deletedAt: IsNull() },
        relations: ['media', 'post'],
        order: { id: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách sliders đang hoạt động',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi lấy danh sách sliders: ${error.message}`);
      throw new InternalServerErrorException('Không thể lấy danh sách sliders');
    }
  }

  // 🧩 2) Lấy danh sách đã xóa mềm
  async findAllDeleted(pagination: PaginationDto) {
    try {
      const { page, limit } = pagination;
      const [data, total] = await this.sliderRepo.findAndCount({
        withDeleted: true,
        where: { deletedAt: Not(IsNull()) },
        relations: ['media', 'post'],
        order: { deletedAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return {
        message: 'Danh sách sliders đã xóa mềm',
        meta: { page, limit, total },
        data,
      };
    } catch (error) {
      this.logger.error(`Lỗi lấy danh sách deleted sliders: ${error.message}`);
      throw new InternalServerErrorException(
        'Không thể lấy danh sách sliders đã xóa',
      );
    }
  }

  // 🧩 3) Chi tiết active
  async findOne(id: number): Promise<Slider> {
    const slider = await this.sliderRepo.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['media', 'post'],
    });
    if (!slider) throw new NotFoundException(`Slider id=${id} không tồn tại`);
    return slider;
  }

  // 🧩 4) Chi tiết deleted
  async findOneDeleted(id: number): Promise<Slider> {
    const slider = await this.sliderRepo.findOne({
      where: { id, deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: ['media', 'post'],
    });
    if (!slider)
      throw new NotFoundException(
        `Slider id=${id} chưa bị xóa hoặc không tồn tại`,
      );
    return slider;
  }

  // 🧩 5) Tạo mới
  async create(dto: CreateSliderDto): Promise<Slider> {
    try {
      const media = await this.mediaRepo.findOne({
        where: { id: dto.mediaId },
      });
      if (!media)
        throw new NotFoundException(`Media id=${dto.mediaId} không tồn tại`);

      let post: Post | null = null;
      if (dto.postId) {
        post = await this.postRepo.findOne({ where: { id: dto.postId } });
        if (!post)
          throw new NotFoundException(`Post id=${dto.postId} không tồn tại`);
      }

      const slider = this.sliderRepo.create({
        media,
        post,
        title: dto.title ?? null,
        linkUrl: dto.linkUrl ?? null,
        isShow: dto.isShow ?? true,
      } as Partial<Slider>);

      return await this.sliderRepo.save(slider);
    } catch (error) {
      this.logger.error(`Lỗi khi tạo slider: ${error.message}`);
      throw error;
    }
  }

  // 🧩 6) Cập nhật
  async update(id: number, dto: UpdateSliderDto): Promise<Slider> {
    try {
      const slider = await this.findOne(id);

      if (dto.mediaId !== undefined) {
        const media = await this.mediaRepo.findOne({
          where: { id: dto.mediaId },
        });
        if (!media)
          throw new NotFoundException(`Media id=${dto.mediaId} không tồn tại`);
        slider.media = media;
      }

      if (dto.postId !== undefined) {
        const post =
          dto.postId === null
            ? null
            : await this.postRepo.findOne({ where: { id: dto.postId } });
        if (dto.postId && !post)
          throw new NotFoundException(`Post id=${dto.postId} không tồn tại`);
        slider.post = post;
      }

      slider.title = dto.title ?? slider.title;
      slider.linkUrl = dto.linkUrl ?? slider.linkUrl;
      slider.isShow = dto.isShow ?? slider.isShow;

      return await this.sliderRepo.save(slider);
    } catch (error) {
      this.logger.error(`Lỗi cập nhật slider id=${id}: ${error.message}`);
      throw error;
    }
  }

  // 🧩 7) Xóa mềm
  async softDelete(id: number) {
    const result = await this.sliderRepo.softDelete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Slider id=${id} không tồn tại`);
    return { message: `Đã xóa mềm slider id=${id}` };
  }

  // 🧩 8) Xóa mềm nhiều
  async softDeleteMany(ids: number[]) {
    await this.sliderRepo.softDelete({ id: In(ids) });
    return { message: `Đã xóa mềm ${ids.length} slider` };
  }

  // 🧩 9) Khôi phục 1
  async restore(id: number) {
    const result = await this.sliderRepo.restore(id);
    if (result.affected === 0)
      throw new NotFoundException(
        `Slider id=${id} không tồn tại hoặc chưa bị xóa`,
      );
    return { message: `Đã khôi phục slider id=${id}` };
  }

  // 🧩 🔟 Khôi phục nhiều
  async restoreMany(ids: number[]) {
    await this.sliderRepo.restore({ id: In(ids) });
    return { message: `Đã khôi phục ${ids.length} slider` };
  }

  // 🧩 11) Xóa vĩnh viễn
  async permanentDelete(id: number) {
    const record = await this.sliderRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!record) throw new NotFoundException(`Slider id=${id} không tồn tại`);
    await this.sliderRepo.remove(record);
    return { message: `Đã xóa vĩnh viễn slider id=${id}` };
  }
}
