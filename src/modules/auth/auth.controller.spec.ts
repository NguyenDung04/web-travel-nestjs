import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;

  // Mocks cho dependency của AuthService
  const usersService = {
    updateLastLogin: jest.fn(),
    findByUsername: jest.fn(),
    findOneWithPassword: jest.fn(),
    findOneWithRole: jest.fn(),
    saveUser: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('fake.jwt.token'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Test trực tiếp method (bỏ qua guard)
  it('profile trả về req.user', () => {
    const req = { user: { id: 1, username: 'demo' } } as any;
    const res = controller.getProfile(req);
    expect(res.data).toEqual({ id: 1, username: 'demo' });
  });
});
