import { Expose } from 'class-transformer';
import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';

export class ResponseExerciseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  thumbnailUrl?: string;

  @Expose()
  videoUrl?: string;

  @Expose()
  muscleGroup: MuscleGroup;

  @Expose()
  equipment: Equipment;
}
