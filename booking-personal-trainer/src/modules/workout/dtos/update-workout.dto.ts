// TODO: Need to implement
import { PartialType } from '@nestjs/mapped-types';

// DTOs
import { CreateWorkoutDto } from './create-workout.dto';

export class UpdateWorkoutDto extends PartialType(CreateWorkoutDto) {}
