import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SetKeyDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsNumber()
  ttlSeconds?: number;
}

export class KeyDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  key: string;
}
