import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/core';

// DTOs
import { RegisterDto } from '../auth/dtos/register.dto';
import { ResponseUserDto } from './dtos/response-user.dto';

// Entities
import { User } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async create(data: RegisterDto): Promise<ResponseUserDto> {
    const newUser: User = this.userRepo.create({
      email: data.email,
      password: data.password,
      userName: data.userName,
      userType: data.userType,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      approvalStatus: data.approvalStatus,
      status: data.status,
    });

    await this.em.persist(newUser).flush();

    const responseUser: ResponseUserDto = {
      userName: newUser.userName,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      userType: newUser.userType,
      approvalStatus: newUser.approvalStatus,
      status: newUser.status,
    };

    return responseUser;
  }

  async findByEmailOrUserName(
    email: string,
    userName?: string,
  ): Promise<User | null> {
    return this.userRepo.findOne({
      $or: [{ userName }, { email }],
    });
  }
}
