import { Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        base: {},
        formatters: {
          level: (label: string) => {
            return { level: label.toUpperCase() };
          },
        },
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie'],
          censor: '[REDACTED]',
        },
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: false,
            levelFirst: true,
            colorize: true,
            translateTime: 'SYS:dd/mm/yyyy h:MM:ss TT',
            ignore: 'pid,hostname',
            customLevels: {
              trace: 'gray',
              debug: 'cyan',
              info: 'green',
              warn: 'yellow',
              error: 'red',
            },
          },
        },
      },
    }),
  ],
})
export class LoggerModule {}
