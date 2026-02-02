// TODO: Need to implement
import { PartialType } from '@nestjs/mapped-types';

// DTOs
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {}
