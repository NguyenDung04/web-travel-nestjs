/* eslint-disable @typescript-eslint/require-await */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { ChangePasswordDto } from 'src/modules/auth/dto/change-password.dto';
import { UserStatus } from 'src/common/constants/user-status.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: any) {
    try {
      // Cập nhật thời gian đăng nhập gần nhất
      await this.usersService.updateLastLogin(user.id, new Date());

      const payload = { sub: user.id, role: user.role?.name };
      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES,
      });

      return {
        message:
          user.status === UserStatus.INACTIVE
            ? 'Đăng nhập thành công, vui lòng đổi mật khẩu lần đầu'
            : 'Đăng nhập thành công',
        data: { accessToken },
      };
    } catch (error) {
      this.logger.error(`Lỗi trong login(): ${error.message}`, error.stack);
      throw new InternalServerErrorException('Lỗi hệ thống khi đăng nhập');
    }
  }

  async validateUser(username: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByUsername(username);
      if (!user) return null;

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return null;

      return user;
    } catch (error) {
      this.logger.error(
        `Lỗi trong validateUser(${username}): ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Lỗi hệ thống khi xác thực user');
    }
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<any> {
    try {
      const user = await this.usersService.findOneWithPassword(userId);
      if (!user) {
        throw new NotFoundException('User không tồn tại');
      }

      const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('Mật khẩu cũ không đúng');
      }

      if (dto.newPassword !== dto.confirmPassword) {
        throw new BadRequestException('Xác nhận mật khẩu mới không khớp');
      }

      const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
      user.password = hashedPassword;

      if (user.status === UserStatus.INACTIVE) {
        user.status = UserStatus.ACTIVE;
      }

      await this.usersService.saveUser(user);

      return { message: 'Đổi mật khẩu thành công' };
    } catch (error) {
      // Nếu là lỗi đã biết, ném lại
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }

      this.logger.error(
        `Lỗi trong changePassword(userId=${userId}): ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Lỗi hệ thống khi đổi mật khẩu');
    }
  }
}
