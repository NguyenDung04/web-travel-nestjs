import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CategoriesService } from './categories.service';
import { Category } from 'src/model/entities/category.entity';

// Mock helper slug
jest.mock('src/common/helpers/slug.helper', () => ({
  generateSlug: jest.fn((name: string) => `slug-${name.trim().toLowerCase()}`),
}));
import { generateSlug } from 'src/common/helpers/slug.helper';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

type MockRepo<T = any> = {
  [P in keyof ReturnType<typeof mockRepo>]: jest.Mock;
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepo: MockRepo<Repository<Category>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: getRepositoryToken(Category), useValue: mockRepo() },
      ],
    }).compile();

    service = moduleRef.get(CategoriesService);
    categoriesRepo = moduleRef.get(getRepositoryToken(Category));
  });

  it('findAll -> trả danh sách theo order DESC id', async () => {
    const rows = [{ id: 2 }, { id: 1 }] as any;
    categoriesRepo.find.mockResolvedValue(rows);

    const res = await service.findAll();
    expect(res).toBe(rows);
    expect(categoriesRepo.find).toHaveBeenCalledWith({ order: { id: 'DESC' } });
  });

  it('findOne -> trả category khi tồn tại', async () => {
    categoriesRepo.findOne.mockResolvedValue({ id: 7, name: 'A' });
    await expect(service.findOne(7)).resolves.toEqual({ id: 7, name: 'A' });
    expect(categoriesRepo.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it('findOne -> NotFound khi không có', async () => {
    categoriesRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(404)).rejects.toThrow(
      new NotFoundException('Category với id=404 không tồn tại'),
    );
  });

  it('create -> unique name, tạo + save với slug', async () => {
    // ensureUniqueName -> findOne trả null
    categoriesRepo.findOne.mockResolvedValueOnce(null);
    categoriesRepo.create.mockReturnValue({
      name: 'Tour',
      slug: 'slug-tour',
    } as any);
    categoriesRepo.save.mockResolvedValue({
      id: 1,
      name: 'Tour',
      slug: 'slug-tour',
    } as any);

    const res = await service.create({ name: '  Tour  ' } as any);

    expect(categoriesRepo.findOne).toHaveBeenCalled(); // check unique
    expect(generateSlug).toHaveBeenCalledWith('  Tour  ');
    expect(categoriesRepo.create).toHaveBeenCalledWith({
      name: 'Tour',
      slug: 'slug-tour',
    });
    expect(res).toEqual({ id: 1, name: 'Tour', slug: 'slug-tour' });
  });

  it('create -> ném BadRequest khi tên đã tồn tại (không excludeId)', async () => {
    categoriesRepo.findOne.mockResolvedValue({ id: 5, name: 'Travel' });
    await expect(service.create({ name: 'Travel' } as any)).rejects.toThrow(
      new BadRequestException("Category 'Travel' đã tồn tại"),
    );
  });

  it('update -> đổi name khác (unique), cập nhật slug, save', async () => {
    // findOne(id) đầu tiên
    categoriesRepo.findOne.mockResolvedValueOnce({
      id: 9,
      name: 'Old',
      slug: 'slug-old',
    } as any);
    // ensureUniqueName(name, id) -> findOne bằng tên trả null (unique)
    categoriesRepo.findOne.mockResolvedValueOnce(null);
    categoriesRepo.save.mockResolvedValue({
      id: 9,
      name: 'New',
      slug: 'slug-new',
    } as any);

    const res = await service.update(9, { name: '  New  ' } as any);

    expect(categoriesRepo.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: 9 },
    });
    expect(categoriesRepo.findOne).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: { name: expect.anything() } }),
    );
    expect(generateSlug).toHaveBeenCalledWith('  New  ');
    expect(categoriesRepo.save).toHaveBeenCalledWith({
      id: 9,
      name: 'New',
      slug: 'slug-new',
    });
    expect(res).toEqual({ id: 9, name: 'New', slug: 'slug-new' });
  });

  it('update -> ném BadRequest nếu tên mới đã tồn tại (khác id)', async () => {
    // findOne(id)
    categoriesRepo.findOne.mockResolvedValueOnce({ id: 3, name: 'Old' });
    // ensureUniqueName -> collision
    categoriesRepo.findOne.mockResolvedValueOnce({ id: 4, name: 'Duplicated' });

    await expect(
      service.update(3, { name: 'Duplicated' } as any),
    ).rejects.toThrow(
      new BadRequestException("Category 'Duplicated' đã tồn tại"),
    );
  });

  it('update -> không đổi name (bằng nhau sau trim) => save lại entity như cũ', async () => {
    const existing = { id: 2, name: 'Stay', slug: 'slug-stay' } as any;
    categoriesRepo.findOne.mockResolvedValue(existing);
    categoriesRepo.save.mockResolvedValue(existing);

    const res = await service.update(2, { name: '  Stay  ' } as any);
    expect(generateSlug).not.toHaveBeenCalled();
    expect(categoriesRepo.save).toHaveBeenCalledWith(existing);
    expect(res).toBe(existing);
  });

  it('remove -> findOne + remove', async () => {
    const row = { id: 11 } as any;
    categoriesRepo.findOne.mockResolvedValue(row);
    categoriesRepo.remove.mockResolvedValue(row);

    await expect(service.remove(11)).resolves.toBeUndefined();
    expect(categoriesRepo.remove).toHaveBeenCalledWith(row);
  });
});
