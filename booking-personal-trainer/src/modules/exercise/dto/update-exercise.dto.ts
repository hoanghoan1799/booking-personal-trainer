import { PartialType } from '@nestjs/mapped-types';

// DTOs
import { CreateExerciseDto } from './create-exercise.dto';

export class UpdateExerciseDto extends PartialType(CreateExerciseDto) {}
