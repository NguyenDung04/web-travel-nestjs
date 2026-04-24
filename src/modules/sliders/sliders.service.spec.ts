import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlidersService } from './sliders.service';
import { Slider } from 'src/model/entities/slider.entity';
import { Media } from 'src/model/entities/media.entity';
import { Post } from 'src/model/entities/post.entity';

// Mock toàn bộ helper để tránh logic phụ thuộc
jest.mock('src/common/helpers/sliders.helpers', () => ({
  SliderHelpers: {
    ensureMedia: jest.fn(),
    resolvePostById: jest.fn(),
    nextSortOrder: jest.fn(),
  },
}));
import { SliderHelpers } from 'src/common/helpers/sliders.helpers';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  exist: jest.fn(),
  delete: jest.fn(),
});

type MockRepo<T = any> = {
  [P in keyof ReturnType<typeof mockRepo>]: jest.Mock;
};

describe('SlidersService', () => {
  let service: SlidersService;
  let sliderRepo: MockRepo<Repository<Slider>>;
  let mediaRepo: MockRepo<Repository<Media>>;
  let postRepo: MockRepo<Repository<Post>>;
  const helpers = SliderHelpers as jest.Mocked<typeof SliderHelpers>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        SlidersService,
        { provide: getRepositoryToken(Slider), useValue: mockRepo() },
        { provide: getRepositoryToken(Media), useValue: mockRepo() },
        { provide: getRepositoryToken(Post), useValue: mockRepo() },
      ],
    }).compile();

    service = moduleRef.get(SlidersService);
    sliderRepo = moduleRef.get(getRepositoryToken(Slider));
    mediaRepo = moduleRef.get(getRepositoryToken(Media));
    postRepo = moduleRef.get(getRepositoryToken(Post));
  });

  // ===== Queries =====
  it('findAll -> gọi repo.find với relations + order', async () => {
    const rows = [{ id: 1 }, { id: 2 }] as any;
    sliderRepo.find.mockResolvedValue(rows);

    const res = await service.findAll();
    expect(res).toBe(rows);
    expect(sliderRepo.find).toHaveBeenCalledWith({
      relations: ['media', 'post'],
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  });

  it('findOne -> trả slider khi tồn tại', async () => {
    const row = { id: 10 } as any;
    sliderRepo.findOne.mockResolvedValue(row);

    const res = await service.findOne(10);
    expect(res).toBe(row);
    expect(sliderRepo.findOne).toHaveBeenCalledWith({
      where: { id: 10 },
      relations: ['media', 'post'],
    });
  });

  it('findOne -> throw NotFound khi không tồn tại', async () => {
    sliderRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(
      'Slider with id=999 not found',
    );
  });

  // ===== Commands: create =====
  it('create -> thiếu mediaId -> BadRequest', async () => {
    await expect(service.create({ title: 'A' } as any)).rejects.toThrow(
      'mediaId là bắt buộc',
    );
  });

  it('create -> có mediaId, không có postId, sortOrder = nextSortOrder, isShow default true', async () => {
    helpers.ensureMedia.mockResolvedValue({ id: 7 } as any);
    helpers.resolvePostById.mockResolvedValue(null);
    helpers.nextSortOrder.mockResolvedValue(5);

    const dto = {
      mediaId: 7,
      title: 'T',
      linkUrl: 'https://example.com',
      // sortOrder undefined => dùng nextSortOrder
      // isShow undefined => true
    } as any;

    const created = { id: undefined, title: 'T' } as any;
    const saved = { id: 1, title: 'T', sortOrder: 5 } as any;

    sliderRepo.create.mockReturnValue(created);
    sliderRepo.save.mockResolvedValue(saved);

    const res = await service.create(dto);

    expect(helpers.ensureMedia).toHaveBeenCalledWith(7, mediaRepo);
    expect(helpers.resolvePostById).toHaveBeenCalledWith(undefined, postRepo);
    expect(helpers.nextSortOrder).toHaveBeenCalledWith(sliderRepo);

    expect(sliderRepo.create).toHaveBeenCalledWith({
      media: { id: 7 },
      post: null,
      sortOrder: 5,
      title: 'T',
      linkUrl: 'https://example.com',
      isShow: true,
    });
    expect(res).toBe(saved);
  });

  it('create -> sortOrder truyền sẵn + postId có thật + isShow=false', async () => {
    helpers.ensureMedia.mockResolvedValue({ id: 3 } as any);
    helpers.resolvePostById.mockResolvedValue({ id: 11 } as any);

    const dto = {
      mediaId: 3,
      postId: 11,
      sortOrder: 8,
      title: 'Banner',
      linkUrl: '/post/11',
      isShow: false,
    } as any;

    const created = { id: undefined } as any;
    const saved = { id: 101 } as any;

    sliderRepo.create.mockReturnValue(created);
    sliderRepo.save.mockResolvedValue(saved);

    const res = await service.create(dto);

    expect(helpers.nextSortOrder).not.toHaveBeenCalled(); // có sortOrder sẵn => không gọi
    expect(sliderRepo.create).toHaveBeenCalledWith({
      media: { id: 3 },
      post: { id: 11 },
      sortOrder: 8,
      title: 'Banner',
      linkUrl: '/post/11',
      isShow: false,
    });
    expect(res).toBe(saved);
  });

  // ===== Commands: update =====
  it('update -> thay media & post khi dto có mediaId/postId', async () => {
    const existing = {
      id: 9,
      title: 'Old',
      linkUrl: '/old',
      sortOrder: 1,
      isShow: true,
      media: { id: 1 },
      post: { id: 2 },
    } as any;

    sliderRepo.findOne.mockResolvedValue(existing);
    helpers.ensureMedia.mockResolvedValue({ id: 77 } as any);
    helpers.resolvePostById.mockResolvedValue({ id: 88 } as any);

    const dto = {
      mediaId: 77,
      postId: 88,
      title: 'New',
      sortOrder: 10,
      isShow: false,
    } as any;
    const saved = {
      id: 9,
      title: 'New',
      linkUrl: '/old',
      sortOrder: 10,
      isShow: false,
      media: { id: 77 },
      post: { id: 88 },
    } as any;
    sliderRepo.save.mockResolvedValue(saved);

    const res = await service.update(9, dto);

    expect(helpers.ensureMedia).toHaveBeenCalledWith(77, mediaRepo);
    expect(helpers.resolvePostById).toHaveBeenCalledWith(88, postRepo);
    expect(sliderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 9,
        title: 'New',
        sortOrder: 10,
        isShow: false,
        media: { id: 77 },
        post: { id: 88 },
      }),
    );
    expect(res).toBe(saved);
  });

  it('update -> giữ nguyên media/post khi dto không có mediaId/postId', async () => {
    const existing = {
      id: 4,
      title: 'T',
      linkUrl: '/l',
      sortOrder: 2,
      isShow: true,
      media: { id: 1 },
      post: { id: 2 },
    } as any;

    sliderRepo.findOne.mockResolvedValue(existing);
    const saved = { ...existing, title: 'T2' };
    sliderRepo.save.mockResolvedValue(saved);

    const dto = { title: 'T2' } as any;
    const res = await service.update(4, dto);

    expect(SliderHelpers.ensureMedia).not.toHaveBeenCalled();
    expect(SliderHelpers.resolvePostById).not.toHaveBeenCalled();
    expect(sliderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 4,
        title: 'T2',
        media: { id: 1 },
        post: { id: 2 },
      }),
    );
    expect(res).toBe(saved);
  });

  // ===== Commands: remove =====
  it('remove -> tồn tại thì delete', async () => {
    sliderRepo.exist.mockResolvedValue(true);
    sliderRepo.delete.mockResolvedValue({} as any);
    await expect(service.remove(33)).resolves.toBeUndefined();
    expect(sliderRepo.exist).toHaveBeenCalledWith({ where: { id: 33 } });
    expect(sliderRepo.delete).toHaveBeenCalledWith(33);
  });

  it('remove -> không tồn tại -> NotFound', async () => {
    sliderRepo.exist.mockResolvedValue(false);
    await expect(service.remove(404)).rejects.toThrow(
      'Slider with id=404 not found',
    );
  });
});
