import { Test, type TestingModule } from '@nestjs/testing';

import type { JwtAuthPayload } from '../../../auth/types/jwt-auth.type';
import { UserRole } from '../../../../common/enums/user/user.enum';
import { BaseResponseDto } from '../../../../common/dtos/base-response.dto';

import { UserController } from '../user.controller';
import { UserService } from '../../services/user.service';

describe('UserController', () => {
  let controller: UserController;
  let userService: {
    getAll: jest.Mock;
    updateProfile: jest.Mock;
    requestTrainerRole: jest.Mock;
    updateUserRole: jest.Mock;
  };

  beforeEach(async () => {
    userService = {
      getAll: jest.fn(),
      updateProfile: jest.fn(),
      requestTrainerRole: jest.fn(),
      updateUserRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: userService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('getAll should forward args', async () => {
    const currentUser: JwtAuthPayload = {
      id: 'u1',
      email: 'u1@test.com',
      userName: 'u1',
      role: UserRole.ADMIN,
    };
    const expected = BaseResponseDto.okWithPagination([], {
      totalItems: 0,
      page: 1,
      limit: 10,
    });
    userService.getAll.mockResolvedValue(expected);

    const actual = await controller.getAll({ page: 1, limit: 10 }, currentUser);

    expect(userService.getAll).toHaveBeenCalledWith(
      { page: 1, limit: 10 },
      currentUser,
    );
    expect(actual).toBe(expected);
  });

  it('updateProfile should forward args', async () => {
    const currentUser: JwtAuthPayload = {
      id: 'u1',
      email: 'u1@test.com',
      userName: 'u1',
      role: UserRole.TRAINEE,
    };
    const expected = BaseResponseDto.ok({ id: 'u1' });
    userService.updateProfile.mockResolvedValue(expected);

    const actual = await controller.updateProfile({ age: 30 }, currentUser);

    expect(userService.updateProfile).toHaveBeenCalledWith(
      { age: 30 },
      currentUser,
    );
    expect(actual).toBe(expected);
  });

  it('requestTrainerRole should forward args', async () => {
    const currentUser: JwtAuthPayload = {
      id: 'u1',
      email: 'u1@test.com',
      userName: 'u1',
      role: UserRole.TRAINEE,
    };
    const expected = BaseResponseDto.ok({ id: 'u1' });
    userService.requestTrainerRole.mockResolvedValue(expected);

    const actual = await controller.requestTrainerRole(currentUser);

    expect(userService.requestTrainerRole).toHaveBeenCalledWith(currentUser);
    expect(actual).toBe(expected);
  });

  it('updateUserRole should forward args', async () => {
    const currentUser: JwtAuthPayload = {
      id: 'admin-id',
      email: 'admin@test.com',
      userName: 'admin',
      role: UserRole.ADMIN,
    };
    const expected = BaseResponseDto.ok({ id: 'target-id' });
    userService.updateUserRole.mockResolvedValue(expected);

    const actual = await controller.updateUserRole(
      'target-id',
      { role: UserRole.TRAINER },
      currentUser,
    );

    expect(userService.updateUserRole).toHaveBeenCalledWith(
      'target-id',
      { role: UserRole.TRAINER },
      currentUser,
    );
    expect(actual).toBe(expected);
  });
});
