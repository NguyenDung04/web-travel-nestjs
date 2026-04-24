import { Test, TestingModule } from '@nestjs/testing';
import { SlidersController } from './sliders.controller';
import { SlidersService } from './sliders.service';

// Lưu ý: @UseGuards ở class-level không chạy khi gọi method trực tiếp trong unit test.
describe('SlidersController', () => {
  let controller: SlidersController;

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
      controllers: [SlidersController],
      providers: [{ provide: SlidersService, useValue: service }],
    }).compile();

    controller = module.get<SlidersController>(SlidersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /sliders -> trả {message,data}', async () => {
    service.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await controller.findAll();
    expect(res).toEqual({ message: 'Danh sách slider', data: [{ id: 1 }] });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('GET /sliders/:id -> trả {message,data}', async () => {
    service.findOne.mockResolvedValue({ id: 9 });
    const res = await controller.findOne(9);
    expect(res).toEqual({ message: 'Chi tiết slider', data: { id: 9 } });
    expect(service.findOne).toHaveBeenCalledWith(9);
  });

  it('POST /sliders -> gọi service.create và trả message', async () => {
    const dto = { mediaId: 7, title: 'A' } as any;
    service.create.mockResolvedValue({ id: 10 });
    const res = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual({ message: 'Tạo slider thành công' });
  });

  it('PATCH /sliders/:id -> gọi service.update và trả message', async () => {
    const dto = { title: 'New' } as any;
    service.update.mockResolvedValue({ id: 5, title: 'New' });
    const res = await controller.update(5, dto);
    expect(service.update).toHaveBeenCalledWith(5, dto);
    expect(res).toEqual({ message: 'Cập nhật slider thành công' });
  });

  it('DELETE /sliders/:id -> gọi service.remove và trả message', async () => {
    service.remove.mockResolvedValue(undefined);
    const res = await controller.remove(7);
    expect(service.remove).toHaveBeenCalledWith(7);
    expect(res).toEqual({ message: 'Xoá slider thành công' });
  });
});
