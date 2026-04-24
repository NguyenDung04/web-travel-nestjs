import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, UpdateResult, DeleteResult } from 'typeorm';
import { UsersService } from './users.service';
import { User } from 'src/model/entities/user.entity';
import { Role } from 'src/model/entities/role.entity';
import { UserStatus } from 'src/common/constants/user-status.enum';

// Mock toàn bộ module helper để tránh đụng bcrypt/DB logic bên trong
jest.mock('src/common/helpers/user.helper', () => ({
  UserHelper: {
    checkUniqueField: jest.fn(),
    getRoleOrThrow: jest.fn(),
    hashPassword: jest.fn(),
  },
}));
import { UserHelper } from 'src/common/helpers/user.helper';

const mockRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  delete: jest.fn(),
});

type MockRepo<T = any> = {
  [P in keyof ReturnType<typeof mockRepo>]: jest.Mock;
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: MockRepo<Repository<User>>;
  let roleRepo: MockRepo<Repository<Role>>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockRepo() },
        { provide: getRepositoryToken(Role), useValue: mockRepo() },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
    userRepo = moduleRef.get(getRepositoryToken(User));
    roleRepo = moduleRef.get(getRepositoryToken(Role));
  });

  it('findAll -> trả danh sách user', async () => {
    const rows = [{ id: 1 }, { id: 2 }] as any;
    userRepo.find.mockResolvedValue(rows);
    await expect(service.findAll()).resolves.toBe(rows);
    expect(userRepo.find).toHaveBeenCalled();
  });

  it('findOne -> trả user khi tồn tại', async () => {
    const row = { id: 7 } as any;
    userRepo.findOne.mockResolvedValue(row);
    await expect(service.findOne(7)).resolves.toBe(row);
    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 7 } });
  });

  it('findOne -> throw NotFound khi không có', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(
      'User with id=99 not found',
    );
  });

  it('findOneWithRole -> gọi relations role', async () => {
    const row = { id: 1, role: { id: 1 } } as any;
    userRepo.findOne.mockResolvedValue(row);
    const res = await service.findOneWithRole(1);
    expect(res).toBe(row);
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['role'],
    });
  });

  it('findOneWithPassword -> select password + role', async () => {
    const row = { id: 1, password: 'hash' } as any;
    userRepo.findOne.mockResolvedValue(row);
    const res = await service.findOneWithPassword(1);
    expect(res).toBe(row);
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      select: ['id', 'username', 'email', 'password', 'status'],
      relations: ['role'],
    });
  });

  it('findByEmail -> select password + role theo email', async () => {
    const row = { id: 1 } as any;
    userRepo.findOne.mockResolvedValue(row);
    const res = await service.findByEmail('a@b.c');
    expect(res).toBe(row);
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { email: 'a@b.c' },
      select: ['id', 'username', 'email', 'password', 'status'],
      relations: ['role'],
    });
  });

  it('findByUsername -> select password + role theo username', async () => {
    const row = { id: 1 } as any;
    userRepo.findOne.mockResolvedValue(row);
    const res = await service.findByUsername('u');
    expect(res).toBe(row);
    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { username: 'u' },
      select: ['id', 'username', 'email', 'password', 'status'],
      relations: ['role'],
    });
  });

  it('createUser -> check unique, lấy role, hash password, create+save', async () => {
    (UserHelper.checkUniqueField as jest.Mock).mockResolvedValue(undefined);
    (UserHelper.getRoleOrThrow as jest.Mock).mockResolvedValue({
      id: 2,
      name: 'admin',
    });
    (UserHelper.hashPassword as jest.Mock).mockResolvedValue('hashed');

    const dto = {
      username: 'new',
      email: 'n@e.w',
      phone: '0123',
      password: 'Abc123',
      status: undefined,
      lastLoginAt: undefined,
      role_id: 2,
    } as any;

    userRepo.create.mockReturnValue({ id: undefined, username: 'new' });
    userRepo.save.mockResolvedValue({
      id: 10,
      username: 'new',
      role: { id: 2 },
    });

    const res = await service.createUser(dto);

    // helper calls
    expect(UserHelper.checkUniqueField).toHaveBeenCalledTimes(2);
    expect(UserHelper.checkUniqueField).toHaveBeenNthCalledWith(
      1,
      userRepo,
      'username',
      'new',
    ); // <— bỏ đối số thứ 4
    expect(UserHelper.checkUniqueField).toHaveBeenNthCalledWith(
      2,
      userRepo,
      'email',
      'n@e.w',
    ); // <— bỏ đối số thứ 4
    expect(UserHelper.getRoleOrThrow).toHaveBeenCalledWith(roleRepo, 2);
    expect(UserHelper.hashPassword).toHaveBeenCalledWith('Abc123');

    // repo calls
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'new',
        email: 'n@e.w',
        phone: '0123',
        password: 'hashed',
        status: UserStatus.INACTIVE,
        role: { id: 2, name: 'admin' },
      }),
    );
    expect(userRepo.save).toHaveBeenCalled();
    expect(res).toEqual({ id: 10, username: 'new', role: { id: 2 } });
  });

  it('updateUser -> merge dữ liệu & save', async () => {
    (UserHelper.checkUniqueField as jest.Mock).mockResolvedValue(undefined);
    (UserHelper.getRoleOrThrow as jest.Mock).mockResolvedValue({
      id: 3,
      name: 'manager',
    });
    (UserHelper.hashPassword as jest.Mock).mockResolvedValue('hashed2');

    const existing = {
      id: 5,
      username: 'old',
      email: 'old@a.b',
      phone: '000',
      password: 'hashOld',
      status: UserStatus.ACTIVE,
      lastLoginAt: null,
      role: { id: 1, name: 'user' },
    } as any;

    userRepo.findOne.mockResolvedValue(existing);
    userRepo.save.mockResolvedValue({
      ...existing,
      username: 'new',
      password: 'hashed2',
      role: { id: 3 },
    });

    const dto = { username: 'new', password: 'New123', role_id: 3 } as any;
    const res = await service.updateUser(5, dto);

    expect(UserHelper.checkUniqueField).toHaveBeenCalledWith(
      userRepo,
      'username',
      'new',
      5,
    );
    expect(UserHelper.getRoleOrThrow).toHaveBeenCalledWith(roleRepo, 3);
    expect(UserHelper.hashPassword).toHaveBeenCalledWith('New123');
    expect(userRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 5,
        username: 'new',
        password: 'hashed2',
        role: { id: 3, name: 'manager' },
      }),
    );
    expect(res.username).toBe('new');
  });

  it('removeUser -> findOne + remove', async () => {
    const row = { id: 9 } as any;
    userRepo.findOne.mockResolvedValue(row);
    userRepo.remove.mockResolvedValue(row);

    await expect(service.removeUser(9)).resolves.toBeUndefined();

    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 9 } });
    expect(userRepo.remove).toHaveBeenCalledWith(row);
  });

  it('updateLastLogin -> gọi update(id, { lastLoginAt })', async () => {
    userRepo.update.mockResolvedValue({ affected: 1 } as UpdateResult);
    const when = new Date();
    await service.updateLastLogin(12, when);
    expect(userRepo.update).toHaveBeenCalledWith(12, { lastLoginAt: when });
  });

  it('saveUser -> gọi save', async () => {
    const u = { id: 1 } as any;
    userRepo.save.mockResolvedValue(u);
    await expect(service.saveUser(u)).resolves.toBe(u);
    expect(userRepo.save).toHaveBeenCalledWith(u);
  });
});
