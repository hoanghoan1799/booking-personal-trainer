import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

import { API_FORMATS } from '../../../common/constants/message.constant';

export class CreateBookingWorkoutDto {
  @ApiProperty({
    description: 'Exercise template id to snapshot into the workout',
    format: API_FORMATS.UUID,
    example: '9b3b77d0-3e3c-4c0b-8a0d-1c4d2b2e2b0a',
  })
  @IsUUID()
  @IsNotEmpty()
  templateId!: string;
}
