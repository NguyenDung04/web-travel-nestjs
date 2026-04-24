import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { MediaService } from './media.service';
import { Media } from 'src/model/entities/media.entity';
import { User } from 'src/model/entities/user.entity';
import { Post } from 'src/model/entities/post.entity';

// Mock toàn bộ helper nhánh media/*
jest.mock('src/common/helpers/media/media-source.helper', () => ({
  assertSingleSource: jest.fn(),
}));
jest.mock('src/common/helpers/media/media-creator.helper', () => ({
  resolveCreator: jest.fn(),
}));
jest.mock('src/common/helpers/media/media-file.helper', () => ({
  prepareFromFile: jest.fn(),
}));
jest.mock('src/common/helpers/media/media-url.helper', () => ({
  prepareFromUrl: jest.fn(),
}));

import { assertSingleSource } from 'src/common/helpers/media/media-source.helper';
import { resolveCreator } from 'src/common/helpers/media/media-creator.helper';
import { prepareFromFile } from 'src/common/helpers/media/media-file.helper';
import { prepareFromUrl } from 'src/common/helpers/media/media-url.helper';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(), // dùng ở postsRepo
});

type MockRepo<T = any> = {
  [P in keyof ReturnType<typeof mockRepo>]: jest.Mock;
};

// query builder đơn giản cho getCount()
const qbCount = (count: number) => ({
  where: jest.fn().mockReturnThis(),
  getCount: jest.fn().mockResolvedValue(count),
});

// query builder trong transaction: update().set().where().execute()
const txQB = () => ({
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue(undefined),
});

describe('MediaService', () => {
  let service: MediaService;
  let dataSource: { transaction: jest.Mock };
  let mediaRepo: MockRepo<Repository<Media>>;
  let userRepo: MockRepo<Repository<User>>;
  let postRepo: MockRepo<Repository<Post>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    dataSource = { transaction: jest.fn() } as any;

    const moduleRef = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: DataSource, useValue: dataSource },
        { provide: getRepositoryToken(Media), useValue: mockRepo() },
        { provide: getRepositoryToken(User), useValue: mockRepo() },
        { provide: getRepositoryToken(Post), useValue: mockRepo() },
      ],
    }).compile();

    service = moduleRef.get(MediaService);
    mediaRepo = moduleRef.get(getRepositoryToken(Media));
    userRepo = moduleRef.get(getRepositoryToken(User));
    postRepo = moduleRef.get(getRepositoryToken(Post));
  });

  // ===== R =====
  it('findAll -> gọi repo.find với relations + order', async () => {
    const rows = [{ id: 2 }] as any;
    mediaRepo.find.mockResolvedValue(rows);

    const res = await service.findAll();
    expect(res).toBe(rows);
    expect(mediaRepo.find).toHaveBeenCalledWith({
      relations: { createdBy: true },
      order: { id: 'DESC' },
    });
  });

  it('findOne -> trả entity khi tồn tại', async () => {
    const row = { id: 9 } as any;
    mediaRepo.findOne.mockResolvedValue(row);

    const res = await service.findOne(9);
    expect(res).toBe(row);
    expect(mediaRepo.findOne).toHaveBeenCalledWith({
      where: { id: 9 },
      relations: { createdBy: true },
    });
  });

  it('findOne -> NotFound nếu không tồn tại', async () => {
    mediaRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(404)).rejects.toThrow(
      new NotFoundException('Media với id=404 không tồn tại'),
    );
  });

  // ===== C =====
  it('create (URL) -> chọn nguồn URL, resolve creator, prepareFromUrl, create+save', async () => {
    (assertSingleSource as jest.Mock).mockReturnValue({
      hasUrl: true,
      hasFile: false,
    });
    (resolveCreator as jest.Mock).mockResolvedValue({ id: 7 });
    (prepareFromUrl as jest.Mock).mockResolvedValue({
      url: 'http://u/img.jpg',
      fileName: 'img.jpg',
    });

    const dto = {
      url: 'http://u/img.jpg',
      fileName: undefined,
      createdBy: undefined,
    } as any;
    const created = { id: undefined } as any;
    const saved = { id: 1, url: 'http://u/img.jpg' } as any;

    mediaRepo.create.mockReturnValue(created);
    mediaRepo.save.mockResolvedValue(saved);

    const res = await service.create(dto, undefined, 7);

    expect(assertSingleSource).toHaveBeenCalledWith(
      'http://u/img.jpg',
      undefined,
    );
    expect(resolveCreator).toHaveBeenCalledWith(userRepo, 7);
    expect(prepareFromUrl).toHaveBeenCalledWith(
      mediaRepo,
      'http://u/img.jpg',
      expect.any(Object),
    );
    expect(mediaRepo.create).toHaveBeenCalledWith({
      fileName: 'img.jpg',
      url: 'http://u/img.jpg',
      createdBy: { id: 7 },
    });
    expect(res).toBe(saved);
  });

  it('create (FILE) -> chọn nguồn file, prepareFromFile, create+save (không creator)', async () => {
    (assertSingleSource as jest.Mock).mockReturnValue({
      hasUrl: false,
      hasFile: true,
    });
    (resolveCreator as jest.Mock).mockResolvedValue(null);
    (prepareFromFile as jest.Mock).mockResolvedValue({
      url: '/upload/a.jpg',
      fileName: 'a.jpg',
    });

    const file = { originalname: 'x.jpg' } as any;
    const dto = {} as any;
    const created = { id: undefined } as any;
    const saved = { id: 2, url: '/upload/a.jpg' } as any;

    mediaRepo.create.mockReturnValue(created);
    mediaRepo.save.mockResolvedValue(saved);

    const res = await service.create(dto, file, undefined);

    expect(assertSingleSource).toHaveBeenCalledWith(undefined, file);
    expect(prepareFromFile).toHaveBeenCalledWith(mediaRepo, file);
    expect(mediaRepo.create).toHaveBeenCalledWith({
      fileName: 'a.jpg',
      url: '/upload/a.jpg',
    });
    expect(res).toBe(saved);
  });

  // ===== U =====
  it('update -> lỗi nếu vừa có url vừa có file', async () => {
    mediaRepo.findOne.mockResolvedValue({ id: 5 } as any);
    await expect(
      service.update(5, { url: 'x' } as any, { originalname: 'y' } as any),
    ).rejects.toThrow(
      new BadRequestException('Chỉ chọn 1 trong 2: URL hoặc file'),
    );
  });

  it('update -> lỗi nếu không có gì để cập nhật', async () => {
    mediaRepo.findOne.mockResolvedValue({ id: 5 } as any);
    await expect(service.update(5, {} as any)).rejects.toThrow(
      new BadRequestException('Không có gì để cập nhật'),
    );
  });

  it('update (FILE) -> đổi url + fileName từ payload nếu không gửi fileName', async () => {
    const existing = { id: 3, url: '/old.jpg', fileName: 'old.jpg' } as any;
    mediaRepo.findOne.mockResolvedValue(existing);
    (prepareFromFile as jest.Mock).mockResolvedValue({
      url: '/new.jpg',
      fileName: 'new.jpg',
    });

    mediaRepo.save.mockResolvedValue(undefined);
    mediaRepo.findOne.mockResolvedValue({
      ...existing,
      url: '/new.jpg',
      fileName: 'new.jpg',
    });

    const res = await service.update(
      3,
      {} as any,
      { originalname: 'x' } as any,
    );
    expect(prepareFromFile).toHaveBeenCalledWith(
      mediaRepo,
      { originalname: 'x' },
      3,
    );
    expect(mediaRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 3, url: '/new.jpg', fileName: 'new.jpg' });
  });

  it('update (URL) -> đổi url, giữ/đổi fileName theo dto, excludeId truyền vào helper', async () => {
    const existing = { id: 7, url: '/a.jpg', fileName: 'a.jpg' } as any;
    mediaRepo.findOne.mockResolvedValue(existing);
    (prepareFromUrl as jest.Mock).mockResolvedValue({
      url: 'http://cdn/new.jpg',
      fileName: 'from-url.jpg',
    });

    mediaRepo.save.mockResolvedValue(undefined);
    mediaRepo.findOne.mockResolvedValue({
      ...existing,
      url: 'http://cdn/new.jpg',
      fileName: 'foo.jpg',
    });

    const dto = { url: 'http://cdn/new.jpg', fileName: 'foo.jpg' } as any;

    const res = await service.update(7, dto);
    expect(prepareFromUrl).toHaveBeenCalledWith(
      mediaRepo,
      'http://cdn/new.jpg',
      expect.objectContaining({ excludeId: 7 }),
    );
    expect(mediaRepo.save).toHaveBeenCalled();
    expect(res.fileName).toBe('foo.jpg');
  });

  it('update -> cập nhật createdBy: null và required=true khi set id', async () => {
    const existing = { id: 10, createdBy: { id: 1 } } as any;
    mediaRepo.findOne.mockResolvedValue(existing);
    (resolveCreator as jest.Mock).mockResolvedValue({ id: 99 });

    mediaRepo.save.mockResolvedValue(undefined);
    mediaRepo.findOne.mockResolvedValue({
      id: 10,
      createdBy: { id: 99 },
    } as any);

    await service.update(10, { createdBy: 99 } as any);
    expect(resolveCreator).toHaveBeenCalledWith(userRepo, 99, true);

    mediaRepo.findOne.mockResolvedValue({ id: 10, createdBy: null } as any);
    await service.update(10, { createdBy: null } as any);
    expect(mediaRepo.save).toHaveBeenCalledTimes(2);
  });

  // ===== D =====
  it('remove -> NotFound nếu không có media', async () => {
    mediaRepo.findOne.mockResolvedValue(null);
    await expect(service.remove(123)).rejects.toThrow(
      new NotFoundException('Media với id=123 không tồn tại'),
    );
  });

  it('remove -> không bị dùng làm thumbnail => xoá thẳng', async () => {
    mediaRepo.findOne.mockResolvedValue({ id: 1 } as any);
    postRepo.createQueryBuilder.mockReturnValue(qbCount(0));
    mediaRepo.delete.mockResolvedValue({} as any);

    await expect(service.remove(1)).resolves.toEqual({ deleted: true });
    expect(mediaRepo.delete).toHaveBeenCalledWith(1);
  });

  it('remove -> đang được dùng, force=false => BadRequest', async () => {
    mediaRepo.findOne.mockResolvedValue({ id: 2 } as any);
    postRepo.createQueryBuilder.mockReturnValue(qbCount(3));

    await expect(service.remove(2, false)).rejects.toThrow(BadRequestException);
  });

  it('remove -> đang được dùng, force=true => chạy transaction: gỡ thumbnail & xoá media', async () => {
    mediaRepo.findOne.mockResolvedValue({ id: 5 } as any);
    postRepo.createQueryBuilder.mockReturnValue(qbCount(2));

    const mgrQB = txQB();
    const txManager = {
      createQueryBuilder: jest.fn().mockReturnValue(mgrQB),
      delete: jest.fn().mockResolvedValue(undefined),
    };
    dataSource.transaction.mockImplementation(async (fn) =>
      fn(txManager as any),
    );

    const res = await service.remove(5, true);

    expect(dataSource.transaction).toHaveBeenCalled();
    expect(txManager.createQueryBuilder).toHaveBeenCalled();
    expect(mgrQB.update).toHaveBeenCalledWith(Post);
    expect(mgrQB.set).toHaveBeenCalledWith({ thumbnail: null as any });
    expect(mgrQB.where).toHaveBeenCalledWith('thumbnail_id = :id', { id: 5 });
    expect(mgrQB.execute).toHaveBeenCalled();
    expect(txManager.delete).toHaveBeenCalledWith(Media, { id: 5 });
    expect(res).toEqual({ deleted: true });
  });
});
