// Fix ESM 'file-type' khi Jest chạy CJS
jest.mock(
  'file-type',
  () => ({
    fileTypeFromBuffer: jest.fn(async () => ({
      ext: 'jpg',
      mime: 'image/jpeg',
    })),
  }),
  { virtual: true },
);

import { Test, TestingModule } from '@nestjs/testing';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

describe('MediaController', () => {
  let controller: MediaController;

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
      controllers: [MediaController],
      providers: [{ provide: MediaService, useValue: service }],
    }).compile();

    controller = module.get<MediaController>(MediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /media -> trả {message,data}', async () => {
    service.findAll.mockResolvedValue([{ id: 1 }]);
    const res = await controller.findAll();
    expect(res).toEqual({ message: 'Danh sách media', data: [{ id: 1 }] });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('GET /media/:id -> trả {message,data}', async () => {
    service.findOne.mockResolvedValue({ id: 9 });
    const res = await controller.findOne(9);
    expect(res).toEqual({ message: 'Chi tiết media', data: { id: 9 } });
    expect(service.findOne).toHaveBeenCalledWith(9);
  });

  it('POST /media -> gọi service.create với file & actorId, trả message', async () => {
    const dto = { fileName: 'pic.jpg' } as any;
    const file = { originalname: 'x.jpg' } as any;
    const req = { user: { id: 77 } } as any;

    service.create.mockResolvedValue({ id: 1 });

    const res = await controller.create(dto, file, req);
    expect(service.create).toHaveBeenCalledWith(dto, file, 77);
    expect(res).toEqual({ message: 'Tạo media thành công' });
  });

  it('PATCH /media/:id -> gọi service.update (có file)', async () => {
    const dto = { fileName: 'new.jpg' } as any;
    const file = { originalname: 'y.jpg' } as any;

    service.update.mockResolvedValue({ id: 2 });
    const res = await controller.update(2, dto, file);

    expect(service.update).toHaveBeenCalledWith(2, dto, file);
    expect(res).toEqual({ message: 'Cập nhật media thành công' });
  });

  it('DELETE /media/:id -> gọi service.remove với mặc định force=false và trả message phù hợp', async () => {
    service.remove.mockResolvedValue({ deleted: true });
    const res = await controller.remove(5);

    expect(service.remove).toHaveBeenCalledWith(5, false);
    // Theo mặc định env không set => DELETE_FORCE_DEFAULT=false
    expect(res).toEqual({ message: 'Đã xoá media' });
  });
});
