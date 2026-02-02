// TODO: Need to implement
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';

// DTOs
import { CreateWorkoutDto } from './dtos/create-workout.dto';
import { UpdateWorkoutDto } from './dtos/update-workout.dto';

@Injectable()
export class WorkoutService {
  create(createWorkoutDto: CreateWorkoutDto) {
    return 'This action adds a new workout';
  }

  findAll() {
    return `This action returns all workout`;
  }

  findOne(id: string) {
    return `This action returns a #${id} workout`;
  }

  update(id: string, updateWorkoutDto: UpdateWorkoutDto) {
    return `This action updates a #${id} workout`;
  }

  remove(id: string) {
    return `This action removes a #${id} workout`;
  }
}
