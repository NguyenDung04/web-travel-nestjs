import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';

// Lưu ý: @UseGuards ở class-level **không chạy** trong unit test controller.
describe('PostsController', () => {
  let controller: PostsController;

  const service = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: service }],
    }).compile();

    controller = module.get<PostsController>(PostsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /posts -> trả {message,data}', async () => {
    service.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await controller.findAll();
    expect(res).toEqual({ message: 'Danh sách posts', data: [{ id: 1 }] });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('GET /posts/:id -> trả {message,data}', async () => {
    service.findOne.mockResolvedValue({ id: 9 });
    const res = await controller.findOne(9);
    expect(res).toEqual({ message: 'Chi tiết post', data: { id: 9 } });
    expect(service.findOne).toHaveBeenCalledWith(9);
  });

  it('POST /posts -> gọi service.create và trả message', async () => {
    const dto = { title: 'T', post_type: 'NEWS' } as any;
    service.create.mockResolvedValue({ id: 10 });
    const res = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ message: 'Tạo post thành công' });
  });

  it('PATCH /posts/:id -> gọi service.update và trả message', async () => {
    const dto = { title: 'New' } as any;
    service.update.mockResolvedValue({ id: 5, title: 'New' });
    const res = await controller.update(5, dto);
    expect(service.update).toHaveBeenCalledWith(5, dto);
    expect(res).toEqual({ message: 'Cập nhật post thành công' });
  });

  it('DELETE /posts/:id -> gọi service.remove và trả message', async () => {
    service.remove.mockResolvedValue(undefined);
    const res = await controller.remove(7);
    expect(service.remove).toHaveBeenCalledWith(7);
    expect(res).toEqual({ message: 'Xoá post thành công' });
  });
});
