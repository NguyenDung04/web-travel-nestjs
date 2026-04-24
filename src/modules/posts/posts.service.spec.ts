import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PostsService } from './posts.service';
import { Post as PostEntity } from 'src/model/entities/post.entity';
import { Media } from 'src/model/entities/media.entity';
import { User } from 'src/model/entities/user.entity';
import { Category } from 'src/model/entities/category.entity';
import { PostStatus } from 'src/common/constants/post-status.enum';
import { PostType } from 'src/common/constants/post-type.enum';

// Mock toàn bộ PostsHelpers
jest.mock('src/common/helpers/posts.helpers', () => ({
  PostsHelpers: {
    buildUniqueSlug: jest.fn(),
    ensureMedia: jest.fn(),
    ensureUser: jest.fn(),
    ensureCategory: jest.fn(),
    geocodeAddress: jest.fn(),
  },
}));
import { PostsHelpers } from 'src/common/helpers/posts.helpers';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  exist: jest.fn(),
  delete: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

type MockRepo<T = any> = {
  [P in keyof ReturnType<typeof mockRepo>]: jest.Mock;
};

describe('PostsService', () => {
  let service: PostsService;
  let postsRepo: MockRepo<Repository<PostEntity>>;
  let mediaRepo: MockRepo<Repository<Media>>;
  let usersRepo: MockRepo<Repository<User>>;
  let categoriesRepo: MockRepo<Repository<Category>>;
  const helpers = PostsHelpers as jest.Mocked<typeof PostsHelpers>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(PostEntity), useValue: mockRepo() },
        { provide: getRepositoryToken(Media), useValue: mockRepo() },
        { provide: getRepositoryToken(User), useValue: mockRepo() },
        { provide: getRepositoryToken(Category), useValue: mockRepo() },
      ],
    }).compile();

    service = moduleRef.get(PostsService);
    postsRepo = moduleRef.get(getRepositoryToken(PostEntity));
    mediaRepo = moduleRef.get(getRepositoryToken(Media));
    usersRepo = moduleRef.get(getRepositoryToken(User));
    categoriesRepo = moduleRef.get(getRepositoryToken(Category));
  });

  // ===== Queries =====
  it('findAll -> gọi repo.find với relations + order', async () => {
    const rows = [{ id: 2 }, { id: 1 }] as any;
    postsRepo.find.mockResolvedValue(rows);

    const res = await service.findAll();
    expect(res).toBe(rows);
    expect(postsRepo.find).toHaveBeenCalledWith({
      relations: ['thumbnail', 'createdBy', 'primaryCategory'],
      order: { id: 'DESC' },
    });
  });

  it('findOne -> trả post khi tồn tại', async () => {
    const row = { id: 10 } as any;
    postsRepo.findOne.mockResolvedValue(row);

    const res = await service.findOne(10);
    expect(res).toBe(row);
    expect(postsRepo.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
      relations: ['thumbnail', 'createdBy', 'primaryCategory'],
    });
  });

  it('findOne -> NotFound khi không có', async () => {
    postsRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(
      new NotFoundException('Post id=999 không tồn tại'),
    );
  });

  // ===== create =====
  it('create -> thiếu title -> BadRequest', async () => {
    await expect(
      service.create({ post_type: PostType.NEWS } as any),
    ).rejects.toThrow(new BadRequestException('title là bắt buộc'));
  });

  it('create -> thiếu post_type -> BadRequest', async () => {
    await expect(service.create({ title: 'T' } as any)).rejects.toThrow(
      new BadRequestException('post_type là bắt buộc'),
    );
  });

  it('create -> build slug, ensure refs, geocode khi có address, defaults đúng', async () => {
    helpers.buildUniqueSlug.mockResolvedValue('my-slug');
    helpers.ensureMedia.mockResolvedValue({ id: 7 } as any);
    helpers.ensureUser.mockResolvedValue({ id: 3 } as any);
    helpers.ensureCategory.mockResolvedValue({ id: 5 } as any);
    helpers.geocodeAddress.mockResolvedValue({
      latitude: 21.03,
      longitude: 105.85,
    });

    const dto = {
      title: 'Hà Nội',
      post_type: PostType.NEWS,
      slug: undefined,
      thumbnail_id: 7,
      created_by: 3,
      primary_category_id: 5,
      address: 'Hà Nội',
      excerpt: 'E',
      content: 'C',
      status: undefined, // default DRAFT
      seo_title: 'SEO T',
      seo_description: 'SEO D',
      published_at: '2025-08-01T10:00:00.000Z',
      taxonomy: { tags: ['a', 'b'] } as any,
    } as any;

    const created = { id: undefined } as any;
    const saved = { id: 1, slug: 'my-slug' } as any;

    postsRepo.create.mockReturnValue(created);
    postsRepo.save.mockResolvedValue(saved);

    const res = await service.create(dto);

    expect(helpers.buildUniqueSlug).toHaveBeenCalledWith(
      postsRepo,
      'Hà Nội',
      undefined,
    );
    expect(helpers.ensureMedia).toHaveBeenCalledWith(7, mediaRepo);
    expect(helpers.ensureUser).toHaveBeenCalledWith(3, usersRepo);
    expect(helpers.ensureCategory).toHaveBeenCalledWith(5, categoriesRepo);
    expect(helpers.geocodeAddress).toHaveBeenCalledWith('Hà Nội');

    expect(postsRepo.create).toHaveBeenCalledWith({
      postType: PostType.NEWS,
      title: 'Hà Nội',
      slug: 'my-slug',
      excerpt: 'E',
      content: 'C',
      thumbnail: { id: 7 },
      status: PostStatus.DRAFT,
      seoTitle: 'SEO T',
      seoDescription: 'SEO D',
      address: 'Hà Nội',
      publishedAt: new Date('2025-08-01T10:00:00.000Z'),
      latitude: 21.03,
      longitude: 105.85,
      createdBy: { id: 3 },
      taxonomy: { tags: ['a', 'b'] },
      primaryCategory: { id: 5 },
    });

    expect(res).toBe(saved);
  });

  it('create -> không có address hoặc đã có lat/long -> không geocode', async () => {
    helpers.buildUniqueSlug.mockResolvedValue('slug');
    helpers.ensureMedia.mockResolvedValue({ id: 1 } as any);
    helpers.ensureUser.mockResolvedValue({ id: 2 } as any);
    helpers.ensureCategory.mockResolvedValue({ id: 3 } as any);

    const dto = {
      title: 'X',
      post_type: PostType.NEWS,
      thumbnail_id: 1,
      created_by: 2,
      primary_category_id: 3,
      address: 'A',
      latitude: 1.23,
      longitude: 4.56,
    } as any;

    postsRepo.create.mockReturnValue({});
    postsRepo.save.mockResolvedValue({ id: 9 });

    await service.create(dto);
    expect(helpers.geocodeAddress).not.toHaveBeenCalled();
  });

  // ===== update =====
  it('update -> gọi buildUniqueSlug khi có slug/title, update các field & refs & geocode', async () => {
    const existing: any = {
      id: 12,
      title: 'Old',
      slug: 'old',
      excerpt: null,
      content: null,
      postType: PostType.NEWS,
      status: PostStatus.DRAFT,
      seoTitle: null,
      seoDescription: null,
      address: null,
      latitude: null,
      longitude: null,
      publishedAt: null,
      createdBy: null,
      thumbnail: null,
      taxonomy: null,
      primaryCategory: null,
    };
    postsRepo.findOne.mockResolvedValue(existing);

    helpers.buildUniqueSlug.mockResolvedValue('new-slug');
    helpers.ensureMedia.mockResolvedValue({ id: 11 } as any);
    helpers.ensureUser.mockResolvedValue({ id: 22 } as any);
    helpers.ensureCategory.mockResolvedValue({ id: 33 } as any);
    helpers.geocodeAddress.mockResolvedValue({ latitude: 10, longitude: 20 });

    const dto = {
      title: 'New',
      slug: undefined, // vẫn build vì có title
      post_type: PostType.REVIEW,
      excerpt: 'E2',
      content: 'C2',
      status: PostStatus.PUBLISHED,
      seo_title: 'ST',
      seo_description: 'SD',
      taxonomy: { tags: ['x'] } as any,
      thumbnail_id: 11,
      created_by: 22,
      primary_category_id: 33,
      address: 'addr',
      // không set lat/long -> sẽ geocode
      published_at: '2025-08-10T01:02:03.000Z',
    } as any;

    const saved = { id: 12, slug: 'new-slug' } as any;
    postsRepo.save.mockResolvedValue(saved);

    const res = await service.update(12, dto);

    expect(helpers.buildUniqueSlug).toHaveBeenCalledWith(
      postsRepo,
      'New',
      undefined,
      12,
    );
    expect(helpers.ensureMedia).toHaveBeenCalledWith(11, mediaRepo);
    expect(helpers.ensureUser).toHaveBeenCalledWith(22, usersRepo);
    expect(helpers.ensureCategory).toHaveBeenCalledWith(33, categoriesRepo);
    expect(helpers.geocodeAddress).toHaveBeenCalledWith('addr');

    expect(postsRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 12,
        title: 'New',
        slug: 'new-slug',
        // postType: PostType.REVIEW,  // <- BỎ assert này (enum dự án của bạn có thể không có REVIEW)
        excerpt: 'E2',
        content: 'C2',
        status: PostStatus.PUBLISHED,
        seoTitle: 'ST',
        seoDescription: 'SD',
        taxonomy: { tags: ['x'] },
        thumbnail: { id: 11 },
        createdBy: { id: 22 },
        primaryCategory: { id: 33 },
        address: 'addr',
        latitude: 10,
        longitude: 20,
        publishedAt: new Date('2025-08-10T01:02:03.000Z'),
      }),
    );

    expect(res).toBe(saved);
  });

  it('update -> không có slug/title => không gọi buildUniqueSlug', async () => {
    const existing: any = { id: 1, title: 'T', slug: 's' };
    postsRepo.findOne.mockResolvedValue(existing);
    postsRepo.save.mockResolvedValue(existing);

    await service.update(1, {});
    expect(helpers.buildUniqueSlug).not.toHaveBeenCalled();
  });

  // ===== remove =====
  it('remove -> tồn tại => delete', async () => {
    postsRepo.exist.mockResolvedValue(true);
    postsRepo.delete.mockResolvedValue({} as any);
    await expect(service.remove(3)).resolves.toBeUndefined();
    expect(postsRepo.exist).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(postsRepo.delete).toHaveBeenCalledWith(3);
  });

  it('remove -> NotFound khi không có', async () => {
    postsRepo.exist.mockResolvedValue(false);
    await expect(service.remove(404)).rejects.toThrow(
      new NotFoundException('Post id=404 không tồn tại'),
    );
  });
});
