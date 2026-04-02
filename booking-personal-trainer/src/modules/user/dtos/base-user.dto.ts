import { Expose } from 'class-transformer';

export class BaseUserDto {
  @Expose()
  age?: number;

  @Expose()
  height?: number;

  @Expose()
  weight?: number;
}
