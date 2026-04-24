import { Repository } from 'typeorm';
import { Media } from 'src/model/entities/media.entity';
import { Post } from 'src/model/entities/post.entity';
import { Slider } from 'src/model/entities/slider.entity';
import { NotFoundException } from '@nestjs/common';

export class SliderHelpers {
  /** Đảm bảo Media tồn tại */
  static async ensureMedia(
    mediaId: number,
    mediaRepo: Repository<Media>,
  ): Promise<Media> {
    const media = await mediaRepo.findOne({ where: { id: mediaId } });
    if (!media) {
      throw new NotFoundException(`Media id=${mediaId} không tồn tại`);
    }
    return media;
  }

  /**
   * Xử lý post_id:
   *  - undefined: không thay đổi
   *  - 0: unlink (null)
   *  - >0: phải tồn tại
   */
  static async resolvePostById(
    postId: number | undefined,
    postRepo: Repository<Post>,
  ): Promise<Post | null | undefined> {
    if (postId === undefined) return undefined;
    if (postId === 0) return null;

    const post = await postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException(`Post id=${postId} không tồn tại`);
    }
    return post;
  }

  /** Lấy sortOrder kế tiếp: MAX(sortOrder) + 1 (an toàn khi null/undefined) */
  static async nextSortOrder(sliderRepo: Repository<Slider>): Promise<number> {
    const raw = await sliderRepo
      .createQueryBuilder('s')
      .select('COALESCE(MAX(s.sortOrder), 0)', 'max')
      .getRawOne<{ max: string | null }>();

    const currentMax = raw && raw.max ? Number(raw.max) : 0;
    return currentMax + 1;
  }
}
