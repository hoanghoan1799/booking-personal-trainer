import { MikroOrmModuleAsyncOptions } from '@mikro-orm/nestjs';
import { defineConfig } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';

config({ path: '.env' });

export const POSTGRES_PORT_DEFAULT = 5432 as const;

export default defineConfig({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? POSTGRES_PORT_DEFAULT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  dbName: process.env.POSTGRES_DB,
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
    glob: '!(*.d).{js,ts}',
  },
});

export const mikroORMConfig: MikroOrmModuleAsyncOptions = {
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    type: 'postgresql',
    host: config.getOrThrow('POSTGRES_HOST'),
    port: config.get<number>('POSTGRES_PORT', POSTGRES_PORT_DEFAULT),
    user: config.getOrThrow('POSTGRES_USER'),
    password: config.getOrThrow('POSTGRES_PASSWORD'),
    dbName: config.getOrThrow('POSTGRES_DB'),
    autoLoadEntities: true,
  }),
};
