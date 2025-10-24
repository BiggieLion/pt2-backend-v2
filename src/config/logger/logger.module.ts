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
          // redact auth headers, cookies and common sensitive fields in bodies
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.*.password',
            'req.body.rfc',
            'req.body.curp',
            'req.body.email',
            'user.password',
          ],
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
