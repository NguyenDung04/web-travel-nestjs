import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { PostMediaService } from './post_media.service';
import { PostMedia } from 'src/model/entities/post-media.entity';
import { Post } from 'src/model/entities/post.entity';
import { Media } from 'src/model/entities/media.entity';

// Mock toàn bộ helper để tách khỏi DB logic
jest.mock('src/common/helpers/post_media.helpers', () => ({
  PostMediaHelpers: {
    ensurePost: jest.fn(),
    ensureMedia: jest.fn(),
    nextSortOrder: jest.fn(),
    enforceSingleCover: jest.fn(),
  },
}));
import { PostMediaHelpers } from 'src/common/helpers/post_media.helpers';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  exist: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
});

type MockRepo<T = any> = {
  [P in keyof ReturnType<typeof mockRepo>]: jest.Mock;
};

describe('PostMediaService', () => {
  let service: PostMediaService;
  let postsMediaRepo: MockRepo<Repository<PostMedia>>;
  let postsRepo: MockRepo<Repository<Post>>;
  let mediaRepo: MockRepo<Repository<Media>>;
  const helpers = PostMediaHelpers as jest.Mocked<typeof PostMediaHelpers>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostMediaService,
        { provide: getRepositoryToken(PostMedia), useValue: mockRepo() },
        { provide: getRepositoryToken(Post), useValue: mockRepo() },
        { provide: getRepositoryToken(Media), useValue: mockRepo() },
      ],
    }).compile();

    service = moduleRef.get(PostMediaService);
    postsMediaRepo = moduleRef.get(getRepositoryToken(PostMedia));
    postsRepo = moduleRef.get(getRepositoryToken(Post));
    mediaRepo = moduleRef.get(getRepositoryToken(Media));
  });

  // ===== R =====
  it('findAll -> gọi repo.find với relations + order', async () => {
    const rows = [{ postId: 1, mediaId: 2 }] as any;
    postsMediaRepo.find.mockResolvedValue(rows);

    const res = await service.findAll();
    expect(res).toBe(rows);
    expect(postsMediaRepo.find).toHaveBeenCalledWith({
      relations: ['post', 'media'],
      order: { postId: 'ASC', sortOrder: 'ASC', mediaId: 'ASC' },
    });
  });

  it('findOne -> trả entity khi tồn tại', async () => {
    const row = { postId: 3, mediaId: 4 } as any;
    postsMediaRepo.findOne.mockResolvedValue(row);

    const res = await service.findOne(3, 4);
    expect(res).toBe(row);
    expect(postsMediaRepo.findOne).toHaveBeenCalledWith({
      where: { postId: 3, mediaId: 4 },
      relations: ['post', 'media'],
    });
  });

  it('findOne -> NotFound khi không tồn tại', async () => {
    postsMediaRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(10, 20)).rejects.toThrow(
      new NotFoundException(
        'PostMedia với postId=10 và mediaId=20 không tồn tại',
      ),
    );
  });

  // ===== C =====
  it('create -> trùng (post_id, media_id) -> BadRequest', async () => {
    postsMediaRepo.exist.mockResolvedValue(true);
    await expect(
      service.create({ post_id: 1, media_id: 2 } as any),
    ).rejects.toThrow(
      new BadRequestException('Cặp (post_id=1, media_id=2) đã tồn tại'),
    );
  });

  it('create -> ok: ensure refs, nextSortOrder, create+save, enforceSingleCover khi is_cover=true', async () => {
    postsMediaRepo.exist.mockResolvedValue(false);
    helpers.ensurePost.mockResolvedValue({ id: 9 } as any);
    helpers.ensureMedia.mockResolvedValue({ id: 8 } as any);
    helpers.nextSortOrder.mockResolvedValue(12);

    const dto = {
      post_id: 9,
      media_id: 8,
      caption: 'cap',
      // sort_order undefined => dùng nextSortOrder
      is_cover: true,
    } as any;

    const created = { postId: 9, mediaId: 8 } as any;
    const saved = { postId: 9, mediaId: 8, sortOrder: 12 } as any;
    postsMediaRepo.create.mockReturnValue(created);
    postsMediaRepo.save.mockResolvedValue(saved);

    const res = await service.create(dto);

    expect(helpers.ensurePost).toHaveBeenCalledWith(9, postsRepo);
    expect(helpers.ensureMedia).toHaveBeenCalledWith(8, mediaRepo);
    expect(helpers.nextSortOrder).toHaveBeenCalledWith(postsMediaRepo, 9);

    expect(postsMediaRepo.create).toHaveBeenCalledWith({
      postId: 9,
      mediaId: 8,
      isCover: true,
      sortOrder: 12,
      post: { id: 9 },
      media: { id: 8 },
      caption: 'cap',
    });
    expect(postsMediaRepo.save).toHaveBeenCalledWith(created);
    expect(helpers.enforceSingleCover).toHaveBeenCalledWith(
      postsMediaRepo,
      9,
      8,
    );
    expect(res).toBe(saved);
  });

  it('create -> có sort_order sẵn -> không gọi nextSortOrder, không enforce khi is_cover=false', async () => {
    postsMediaRepo.exist.mockResolvedValue(false);
    helpers.ensurePost.mockResolvedValue({ id: 1 } as any);
    helpers.ensureMedia.mockResolvedValue({ id: 2 } as any);

    const dto = {
      post_id: 1,
      media_id: 2,
      sort_order: 5,
      is_cover: false,
    } as any;

    postsMediaRepo.create.mockReturnValue({});
    postsMediaRepo.save.mockResolvedValue({ postId: 1, mediaId: 2 });

    await service.create(dto);

    expect(PostMediaHelpers.nextSortOrder).not.toHaveBeenCalled();
    expect(PostMediaHelpers.enforceSingleCover).not.toHaveBeenCalled();
    expect(postsMediaRepo.create).toHaveBeenCalledWith({
      postId: 1,
      mediaId: 2,
      isCover: false,
      sortOrder: 5,
      post: { id: 1 },
      media: { id: 2 },
    });
  });

  // ===== U =====
  it('update -> cập nhật field, save, enforceSingleCover nếu is_cover=true', async () => {
    const existing = {
      postId: 3,
      mediaId: 4,
      caption: null,
      sortOrder: 1,
      isCover: false,
    } as any;
    postsMediaRepo.findOne.mockResolvedValue(existing);
    postsMediaRepo.save.mockResolvedValue({
      ...existing,
      caption: 'x',
      sortOrder: 9,
      isCover: true,
    });

    const dto = { caption: 'x', sort_order: 9, is_cover: true } as any;
    const res = await service.update(3, 4, dto);

    expect(postsMediaRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ caption: 'x', sortOrder: 9, isCover: true }),
    );
    expect(PostMediaHelpers.enforceSingleCover).toHaveBeenCalledWith(
      postsMediaRepo,
      3,
      4,
    );
    expect(res.caption).toBe('x');
  });

  it('update -> không đổi cover => không enforceSingleCover', async () => {
    const existing = { postId: 3, mediaId: 4, isCover: false } as any;
    postsMediaRepo.findOne.mockResolvedValue(existing);
    postsMediaRepo.save.mockResolvedValue(existing);

    await service.update(3, 4, { caption: 'y' } as any);
    expect(PostMediaHelpers.enforceSingleCover).not.toHaveBeenCalled();
  });

  // ===== D =====
  it('remove -> tồn tại => delete', async () => {
    postsMediaRepo.exist.mockResolvedValue(true);
    postsMediaRepo.delete.mockResolvedValue({} as any);
    await expect(service.remove(1, 2)).resolves.toBeUndefined();
    expect(postsMediaRepo.exist).toHaveBeenCalledWith({
      where: { postId: 1, mediaId: 2 },
    });
    expect(postsMediaRepo.delete).toHaveBeenCalledWith({
      postId: 1,
      mediaId: 2,
    });
  });

  it('remove -> NotFound khi không tồn tại', async () => {
    postsMediaRepo.exist.mockResolvedValue(false);
    await expect(service.remove(10, 20)).rejects.toThrow(
      new NotFoundException(
        'PostMedia với postId=10 và mediaId=20 không tồn tại',
      ),
    );
  });
});
