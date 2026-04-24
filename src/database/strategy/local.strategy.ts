import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    // Cấu hình để sử dụng field "username" thay vì "username" mặc định
    super({ usernameField: 'username' });
  }

  async validate(username: string, password: string): Promise<any> {
    try {
      const user = await this.authService.validateUser(username, password);

      if (!user) {
        throw new UnauthorizedException(
          'Tên đăng nhập hoặc mật khẩu không đúng',
        );
      }

      return user; // Passport sẽ gắn user vào req.user
    } catch (error) {
      // Nếu là Unauthorized thì ném lại, tránh mất thông tin gốc
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Ghi log (nếu bạn có Logger)
      console.error('Lỗi trong LocalStrategy.validate:', error);

      // Ném lỗi chung cho những lỗi không xác định
      throw new InternalServerErrorException(
        'Đã xảy ra lỗi trong quá trình xác thực',
      );
    }
  }
}
