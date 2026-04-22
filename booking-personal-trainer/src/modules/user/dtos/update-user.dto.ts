import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';

// Commons
import { UserRole } from '../../../common/enums/user/user.enum';
import { FIELD_DESCRIPTIONS } from '../../../common/constants/message.constant';

// DTOs

export class UpdateUserRoleDto {
  @ApiProperty({
    description: FIELD_DESCRIPTIONS.USER.ROLE,
    enum: UserRole,
  })
  @IsEnum(UserRole)
  role: UserRole;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.USER.AGE,
  })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.USER.HEIGHT,
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({
    description: FIELD_DESCRIPTIONS.USER.WEIGHT,
  })
  @IsOptional()
  @IsNumber()
  weight?: number;
}
