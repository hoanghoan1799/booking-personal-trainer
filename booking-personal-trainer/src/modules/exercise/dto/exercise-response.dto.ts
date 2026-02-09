import { Expose } from 'class-transformer';

export class ExerciseResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description?: string;

  @Expose()
  thumbnailUrl?: string;

  @Expose()
  videoUrl?: string;

  @Expose()
  muscleGroup: string;

  @Expose()
  equipment: string;
}
