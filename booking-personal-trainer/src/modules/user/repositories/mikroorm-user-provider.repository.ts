import { Injectable } from '@nestjs/common';
import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';

// Entities
import { User } from '../entities/user.entity';
import { UserProvider } from '../entities/user-provider.entity';

// Interfaces
import type {
  CreateUserProviderData,
  UserProviderRepository,
} from './user-provider.repository.interface';

@Injectable()
export class MikroOrmUserProviderRepository implements UserProviderRepository {
  constructor(
    @InjectRepository(UserProvider)
    private readonly repo: EntityRepository<UserProvider>,
    @InjectRepository(User)
    private readonly userRepo: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {}

  async findByProviderIdentity(args: {
    providerName: string;
    providerUserId: string;
  }): Promise<UserProvider | null> {
    return this.repo.findOne({
      providerName: args.providerName,
      providerUserId: args.providerUserId,
    });
  }

  async create(data: CreateUserProviderData): Promise<UserProvider> {
    const user = await this.userRepo.findOneOrFail({ id: data.userId });
    const provider = this.repo.create({
      user,
      providerName: data.providerName,
      providerUserId: data.providerUserId,
    });
    await this.em.persist(provider).flush();

    return provider;
  }
}
