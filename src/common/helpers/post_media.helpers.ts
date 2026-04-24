import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { PostMedia } from 'src/model/entities/post-media.entity';
import { Post } from 'src/model/entities/post.entity';
import { Media } from 'src/model/entities/media.entity';

export class PostMediaHelpers {
  static async ensurePost(
    postId: number,
    postRepo: Repository<Post>,
  ): Promise<Post> {
    const post = await postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException(`Post id=${postId} không tồn tại`);
    return post;
  }

  static async ensureMedia(
    mediaId: number,
    mediaRepo: Repository<Media>,
  ): Promise<Media> {
    const media = await mediaRepo.findOne({ where: { id: mediaId } });
    if (!media)
      throw new NotFoundException(`Media id=${mediaId} không tồn tại`);
    return media;
  }

  /** MAX(sort_order) + 1 trong phạm vi 1 post */
  static async nextSortOrder(
    repo: Repository<PostMedia>,
    postId: number,
  ): Promise<number> {
    const raw = await repo
      .createQueryBuilder('pm')
      .select('COALESCE(MAX(pm.sortOrder), 0)', 'max')
      .where('pm.postId = :postId', { postId })
      .getRawOne<{ max: string | null }>();
    const current = raw?.max ? Number(raw.max) : 0;
    return current + 1;
  }

  /** Đảm bảo chỉ 1 cover trong mỗi post */
  static async enforceSingleCover(
    repo: Repository<PostMedia>,
    postId: number,
    mediaIdToKeep: number,
  ): Promise<void> {
    await repo
      .createQueryBuilder()
      .update(PostMedia)
      .set({ isCover: false })
      .where('post_id = :postId AND media_id <> :mediaId', {
        postId,
        mediaId: mediaIdToKeep,
      })
      .execute();
  }
}
