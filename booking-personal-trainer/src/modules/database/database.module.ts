import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Configs
import { mikroORMConfig } from '../../configs/mikro-orm.config';

@Module({
  imports: [ConfigModule, MikroOrmModule.forRootAsync(mikroORMConfig)],
})
export class DatabaseModule {}
