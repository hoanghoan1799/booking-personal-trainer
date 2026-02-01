import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { mikroORMConfig } from 'src/configs/mikro-orm.config';

@Module({
  imports: [ConfigModule, MikroOrmModule.forRootAsync(mikroORMConfig)],
})
export class DatabaseModule {}
