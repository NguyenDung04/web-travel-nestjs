import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// Lưu ý: @UseGuards ở class-level **không chạy** khi bạn gọi method trực tiếp.
// Vì vậy unit test controller chỉ cần mock UsersService là đủ.

describe('UsersController', () => {
  let controller: UsersController;

  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    removeUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /users -> trả {message,data}', async () => {
    service.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await controller.findAll();
    expect(res).toEqual({ message: 'Danh sách user', data: [{ id: 1 }] });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('GET /users/:id -> trả {message,data}', async () => {
    service.findOne.mockResolvedValue({ id: 5 });
    const res = await controller.findOne(5);
    expect(res).toEqual({ message: 'Chi tiết user', data: { id: 5 } });
    expect(service.findOne).toHaveBeenCalledWith(5);
  });

  it('POST /users -> gọi createUser và trả message', async () => {
    const dto = { username: 'u', password: 'Abc123', role_id: 1 } as any;
    service.createUser.mockResolvedValue({ id: 10, username: 'u' });

    const res = await controller.create(dto);
    expect(service.createUser).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ message: 'Tạo user thành công' });
  });

  it('PATCH /users/:id -> gọi updateUser và trả message', async () => {
    const dto = { email: 'a@b.c' } as any;
    service.updateUser.mockResolvedValue({ id: 2, email: 'a@b.c' });

    const res = await controller.update(2, dto);
    expect(service.updateUser).toHaveBeenCalledWith(2, dto);
    expect(res).toEqual({ message: 'Cập nhật user thành công' });
  });

  it('DELETE /users/:id -> gọi removeUser và trả message', async () => {
    service.removeUser.mockResolvedValue(undefined);

    const res = await controller.remove(9);
    expect(service.removeUser).toHaveBeenCalledWith(9);
    expect(res).toEqual({ message: 'Xóa user thành công' });
  });
});
