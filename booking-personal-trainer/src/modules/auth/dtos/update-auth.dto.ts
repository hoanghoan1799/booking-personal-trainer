// TODO: Need to implement
import { PartialType } from '@nestjs/mapped-types';

// DTOs
import { CreateAuthDto } from './create-auth.dto';

export class UpdateAuthDto extends PartialType(CreateAuthDto) {}
