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
  @IsString()
  @IsNotEmpty()
  key: string;
}
