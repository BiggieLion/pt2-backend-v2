import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration } from './configuration';
import { validationSchema } from './validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Use an environment-specific file if NODE_ENV is set, otherwise fall back to
      // a simple .env file. This avoids pointing to a non-existing file path.
      envFilePath: process.env.NODE_ENV
        ? `${process.cwd()}/.env.${process.env.NODE_ENV}`
        : `${process.cwd()}/.env`,
      load: [configuration],
      validationSchema,
    }),
  ],
})
export class ConfigurationModule {}
