/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const logger = new Logger('request');
    logger.log(`Incoming request: ${req.method} ${req.url}`);
    next();
  }
}
