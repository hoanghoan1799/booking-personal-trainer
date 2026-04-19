import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class TrainerKpiRowDto {
  @ApiProperty()
  @IsString()
  trainerId!: string;

  @ApiProperty()
  @IsString()
  trainerName!: string;

  @ApiProperty()
  @IsString()
  trainerEmail!: string;

  @ApiProperty()
  @IsInt()
  confirmedBookingsCount!: number;

  @ApiProperty()
  @IsInt()
  cancelledBookingsCount!: number;

  @ApiProperty()
  @IsInt()
  rejectedBookingsCount!: number;

  @ApiProperty()
  @IsInt()
  workoutsDoneCount!: number;

  @ApiProperty({
    description:
      'Sum of workout durations for DONE workouts (whole minutes, rounded down).',
  })
  @IsInt()
  deliveredMinutes!: number;

  @ApiProperty({
    description:
      'Trainer share net cents for the optional currency filter (default USD).',
  })
  @IsInt()
  trainerShareNetCents!: number;
}
