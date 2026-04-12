import { UserProvider } from '../entities/user-provider.entity';

/** Injection token for UserProviderRepository */
export const UserProviderRepositoryToken = Symbol('UserProviderRepository');

export interface CreateUserProviderData {
  userId: string;
  providerName: string;
  providerUserId: string;
}

export interface UserProviderRepository {
  findByProviderIdentity(args: {
    providerName: string;
    providerUserId: string;
  }): Promise<UserProvider | null>;
  create(data: CreateUserProviderData): Promise<UserProvider>;
}
