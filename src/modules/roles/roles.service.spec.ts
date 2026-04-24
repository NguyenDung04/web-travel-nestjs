import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { RolesService } from './roles.service';
import { Role } from 'src/model/entities/role.entity';
import { User } from 'src/model/entities/user.entity';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
});

type MockRepo<T = any> = {
  [P in keyof ReturnType<typeof mockRepo>]: jest.Mock;
};

describe('RolesService', () => {
  let service: RolesService;
  let roleRepo: MockRepo<Repository<Role>>;
  let userRepo: MockRepo<Repository<User>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        RolesService,
        { provide: getRepositoryToken(Role), useValue: mockRepo() },
        { provide: getRepositoryToken(User), useValue: mockRepo() },
      ],
    }).compile();

    service = moduleRef.get(RolesService);
    roleRepo = moduleRef.get(getRepositoryToken(Role));
    userRepo = moduleRef.get(getRepositoryToken(User));
  });

  // create
  it('create -> tạo role khi chưa tồn tại', async () => {
    roleRepo.findOne.mockResolvedValue(null); // chưa tồn tại
    roleRepo.create.mockReturnValue({ name: 'admin' });
    roleRepo.save.mockResolvedValue({ id: 1, name: 'admin' });

    const res = await service.create({ name: 'admin' });
    expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { name: 'admin' } });
    expect(roleRepo.create).toHaveBeenCalledWith({ name: 'admin' });
    expect(res).toEqual({ id: 1, name: 'admin' });
  });

  it('create -> ném BadRequest nếu role đã tồn tại', async () => {
    roleRepo.findOne.mockResolvedValue({ id: 9, name: 'admin' });
    await expect(service.create({ name: 'admin' })).rejects.toThrow(
      new BadRequestException("Role 'admin' đã tồn tại"),
    );
  });

  // findAll
  it('findAll -> trả danh sách role', async () => {
    const rows = [
      { id: 1, name: 'a' },
      { id: 2, name: 'b' },
    ];
    roleRepo.find.mockResolvedValue(rows as any);
    await expect(service.findAll()).resolves.toBe(rows);
    expect(roleRepo.find).toHaveBeenCalled();
  });

  // findOne
  it('findOne -> trả role khi tồn tại', async () => {
    roleRepo.findOne.mockResolvedValue({ id: 5, name: 'x' });
    await expect(service.findOne(5)).resolves.toEqual({ id: 5, name: 'x' });
    expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it('findOne -> NotFound khi không tồn tại', async () => {
    roleRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(404)).rejects.toThrow(
      new NotFoundException('Role với id=404 không tồn tại'),
    );
  });

  // update
  it('update -> đổi name hợp lệ và lưu', async () => {
    // findOne(id)
    roleRepo.findOne.mockResolvedValueOnce({ id: 7, name: 'old' });
    // findOne({name:new}) để check trùng tên
    roleRepo.findOne.mockResolvedValueOnce(null);
    roleRepo.save.mockResolvedValue({ id: 7, name: 'new' });

    const res = await service.update(7, { name: 'new' });
    expect(roleRepo.findOne).toHaveBeenNthCalledWith(1, { where: { id: 7 } });
    expect(roleRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: { name: 'new' },
    });
    expect(roleRepo.save).toHaveBeenCalledWith({ id: 7, name: 'new' });
    expect(res).toEqual({ id: 7, name: 'new' });
  });

  it('update -> ném BadRequest nếu tên mới đã tồn tại', async () => {
    roleRepo.findOne
      .mockResolvedValueOnce({ id: 7, name: 'old' }) // findOne(id)
      .mockResolvedValueOnce({ id: 8, name: 'duplicated' }); // findOne({name})
    await expect(service.update(7, { name: 'duplicated' })).rejects.toThrow(
      new BadRequestException("Role 'duplicated' đã tồn tại"),
    );
  });

  // remove
  it('remove -> reset user.role về NULL và xóa role', async () => {
    roleRepo.findOne.mockResolvedValue({ id: 3, name: 'to-del' });
    userRepo.update.mockResolvedValue({ affected: 1 } as any);
    roleRepo.remove.mockResolvedValue({} as any);

    const res = await service.remove(3);
    expect(roleRepo.findOne).toHaveBeenCalledWith({ where: { id: 3 } });
    expect(userRepo.update).toHaveBeenCalledWith(
      { role: { id: 3, name: 'to-del' } },
      { role: null },
    );
    expect(roleRepo.remove).toHaveBeenCalledWith({ id: 3, name: 'to-del' });
    expect(res).toEqual({
      message: 'Xóa role thành công, tất cả user đã reset role_id = NULL',
    });
  });

  it('remove -> NotFound khi không có role', async () => {
    roleRepo.findOne.mockResolvedValue(null);
    await expect(service.remove(999)).rejects.toThrow(
      new NotFoundException('Role với id=999 không tồn tại'),
    );
  });
});
