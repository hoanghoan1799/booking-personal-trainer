import {
  Equipment,
  MuscleGroup,
} from '../../../common/enums/exercise/exercise.enum';

export class ResponseExerciseDto {
  id: string;
  name: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
}
