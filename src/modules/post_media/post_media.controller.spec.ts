import { Test, TestingModule } from '@nestjs/testing';
import { PostMediaController } from './post_media.controller';
import { PostMediaService } from './post_media.service';

// Lưu ý: @UseGuards không chạy trong unit test controller (gọi method trực tiếp).
describe('PostMediaController', () => {
  let controller: PostMediaController;

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
      controllers: [PostMediaController],
      providers: [{ provide: PostMediaService, useValue: service }],
    }).compile();

    controller = module.get<PostMediaController>(PostMediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET /post-media -> trả {message,data}', async () => {
    service.findAll.mockResolvedValue([{ postId: 1, mediaId: 2 }]);
    const res = await controller.findAll();
    expect(res).toEqual({
      message: 'Danh sách post_media',
      data: [{ postId: 1, mediaId: 2 }],
    });
    expect(service.findAll).toHaveBeenCalled();
  });

  it('GET /post-media/:postId/:mediaId -> trả {message,data}', async () => {
    service.findOne.mockResolvedValue({ postId: 3, mediaId: 4 });
    const res = await controller.findOne(3, 4);
    expect(res).toEqual({
      message: 'Chi tiết post_media',
      data: { postId: 3, mediaId: 4 },
    });
    expect(service.findOne).toHaveBeenCalledWith(3, 4);
  });

  it('POST /post-media -> gọi service.create và trả message + data', async () => {
    const dto = { post_id: 9, media_id: 8 } as any;
    service.create.mockResolvedValue({ postId: 9, mediaId: 8 });
    const res = await controller.create(dto);
    expect(service.create).toHaveBeenCalledWith(dto);
    expect(res).toEqual({
      message: 'Thêm media vào post thành công',
      data: { postId: 9, mediaId: 8 },
    });
  });

  it('PATCH /post-media/:postId/:mediaId -> gọi service.update và trả message + data', async () => {
    const dto = { caption: 'x' } as any;
    service.update.mockResolvedValue({ postId: 1, mediaId: 2, caption: 'x' });
    const res = await controller.update(1, 2, dto);
    expect(service.update).toHaveBeenCalledWith(1, 2, dto);
    expect(res).toEqual({
      message: 'Cập nhật post_media thành công',
      data: { postId: 1, mediaId: 2, caption: 'x' },
    });
  });

  it('DELETE /post-media/:postId/:mediaId -> gọi service.remove và trả message', async () => {
    service.remove.mockResolvedValue(undefined);
    const res = await controller.remove(5, 6);
    expect(service.remove).toHaveBeenCalledWith(5, 6);
    expect(res).toEqual({ message: 'Xoá post_media thành công' });
  });
});
