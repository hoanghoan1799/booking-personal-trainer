import { Expose } from 'class-transformer';

export class ExerciseResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;
}
