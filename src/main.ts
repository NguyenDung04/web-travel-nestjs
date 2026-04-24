/* eslint-disable @typescript-eslint/unbound-method */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { winstonLogger } from './logger/winston.logger';
import { HttpLoggerInterceptor } from './logger/http-logger.interceptor';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { LoggerMiddleware } from './logger/middleware.logger';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger, // thay logger mặc định bằng winston
  });
  app.useGlobalInterceptors(new HttpLoggerInterceptor());

  // app.useLogger(['error', 'warn', 'log', 'debug', 'verbose']);
  app.use(new LoggerMiddleware().use);

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // loại field không có trong DTO
      forbidNonWhitelisted: true, // báo lỗi nếu gửi field thừa
      transform: true, // bật transform theo DTO
      transformOptions: { enableImplicitConversion: true },
      stopAtFirstError: false, // gom tất cả lỗi của 1 field
      // validateCustomDecorators: true, // bật nếu dùng custom decorators
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        return new BadRequestException(
          validationErrors.map((error) => ({
            field: error.property,
            error: error.constraints
              ? Object.values(error.constraints).join(', ')
              : '',
          })),
        );
      },
    }),
  );

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
