import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationModule } from '../configuration';
import { ConfigService } from '@nestjs/config';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigurationModule],
      useFactory: (configSvc: ConfigService) => ({
        type: 'postgres',
        host: configSvc.getOrThrow<string>('database.host'),
        port: configSvc.getOrThrow<number>('database.port'),
        username: configSvc.getOrThrow<string>('database.username'),
        password: configSvc.getOrThrow<string>('database.password'),
        database: configSvc.getOrThrow<string>('database.database'),
        synchronize: configSvc.getOrThrow<string>('node_env') === 'dev',
        autoLoadEntities: true,
        ssl:
          configSvc.getOrThrow<string>('node_env') === 'prod'
            ? { rejectUnauthorized: false }
            : false,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {
  static forFeature(entity: EntityClassOrSchema[]): DynamicModule {
    return TypeOrmModule.forFeature(entity);
  }
}
