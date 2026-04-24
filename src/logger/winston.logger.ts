import { WinstonModule, utilities } from 'nest-winston';
import * as winston from 'winston';

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    // In ra console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        utilities.format.nestLike('WebTravel', {
          colors: true,
          prettyPrint: true,
        }),
      ),
    }),
    // Ghi log vào file
    new winston.transports.File({
      dirname: 'logs',
      filename: 'application.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
    }),
  ],
});
