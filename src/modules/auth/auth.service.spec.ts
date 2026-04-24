import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

// Mock toàn bộ module bcryptjs để tránh lỗi "Cannot redefine property: compare"
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  // Mocks
  const usersService = {
    updateLastLogin: jest.fn(),
    findByUsername: jest.fn(),
    findOneWithPassword: jest.fn(),
    saveUser: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('fake.jwt.token'),
  };

  const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

  beforeEach(async () => {
    // reset mọi mock giữa các test
    jest.clearAllMocks();

    // bcrypt.compare mặc định trả true
    mockedBcrypt.compare.mockResolvedValue(true as any);

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('validateUser -> trả về user khi đúng mật khẩu', async () => {
    usersService.findByUsername.mockResolvedValue({ id: 1, password: 'hash' });

    await expect(service.validateUser('u', 'p')).resolves.toEqual({
      id: 1,
      password: 'hash',
    });

    expect(usersService.findByUsername).toHaveBeenCalledWith('u');
    expect((bcrypt.compare as jest.Mock).mock.calls.length).toBe(1);
  });

  it('login -> trả token & update last login', async () => {
    const user = { id: 1, role: { name: 'admin' }, status: 'ACTIVE' };
    const res = await service.login(user as any);

    expect(usersService.updateLastLogin).toHaveBeenCalledWith(
      1,
      expect.any(Date),
    );
    expect(jwtService.sign).toHaveBeenCalledWith(
      { sub: 1, role: 'admin' },
      expect.any(Object),
    );
    expect(res).toEqual({
      message: 'Đăng nhập thành công',
      data: { accessToken: 'fake.jwt.token' },
    });
  });
});
