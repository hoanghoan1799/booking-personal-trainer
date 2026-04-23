import { AdminSeedService } from '../admin-seed.service';
import type { ConfigService } from '@nestjs/config';
import type { UserService } from '../../../user/services/user.service';
import type { HashingService } from '../hashing.service';

describe('AdminSeedService', () => {
  const createConfigServiceMock = (
    values: Record<string, string | undefined>,
  ) =>
    ({
      get: jest.fn((key: string, defaultValue?: string) => {
        return values[key] ?? defaultValue;
      }),
    }) as unknown as ConfigService;

  const createUserServiceMock = (): {
    readonly userService: UserService;
    readonly findByEmailMock: jest.Mock;
    readonly createMock: jest.Mock;
  } => {
    const findByEmailMock = jest.fn();
    const createMock = jest.fn();
    const userService = {
      findByEmail: findByEmailMock,
      create: createMock,
    } as unknown as UserService;
    return { userService, findByEmailMock, createMock };
  };

  const createHashingServiceMock = (): HashingService =>
    ({
      hash: jest.fn(),
    }) as unknown as HashingService;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should return early when default env values missing', async () => {
    const { userService, findByEmailMock } = createUserServiceMock();
    const configService = createConfigServiceMock({
      DEFAULT_ADMIN_EMAIL: '',
      DEFAULT_ADMIN_PASSWORD: '',
    });
    const hashingService = createHashingServiceMock();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const service = new AdminSeedService(
      userService,
      configService,
      hashingService,
    );
    await service.onModuleInit();

    expect(findByEmailMock).not.toHaveBeenCalled();
  });

  it('should return early when admin already exists', async () => {
    const { userService, findByEmailMock, createMock } =
      createUserServiceMock();
    findByEmailMock.mockResolvedValue({ id: 'admin' });
    const configService = createConfigServiceMock({
      DEFAULT_ADMIN_EMAIL: 'admin@test.com',
      DEFAULT_ADMIN_PASSWORD: 'pass',
    });
    const hashingService = createHashingServiceMock();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const service = new AdminSeedService(
      userService,
      configService,
      hashingService,
    );
    await service.onModuleInit();

    expect(createMock).not.toHaveBeenCalled();
  });

  it('should create admin when missing', async () => {
    const { userService, findByEmailMock, createMock } =
      createUserServiceMock();
    findByEmailMock.mockResolvedValue(null);
    const configService = createConfigServiceMock({
      DEFAULT_ADMIN_EMAIL: 'admin@test.com',
      DEFAULT_ADMIN_PASSWORD: 'pass',
    });
    const hashingService = createHashingServiceMock();
    (hashingService.hash as jest.Mock).mockResolvedValue('hashed');
    jest.spyOn(console, 'log').mockImplementation(() => undefined);

    const service = new AdminSeedService(
      userService,
      configService,
      hashingService,
    );
    await service.onModuleInit();

    const hashMock = (hashingService as unknown as { hash: jest.Mock }).hash;
    expect(hashMock).toHaveBeenCalledWith('pass');
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@test.com',
        password: 'hashed',
      }),
    );
  });

  it('should swallow create errors', async () => {
    const { userService, findByEmailMock, createMock } =
      createUserServiceMock();
    findByEmailMock.mockResolvedValue(null);
    createMock.mockRejectedValue(new Error('db'));
    const configService = createConfigServiceMock({
      DEFAULT_ADMIN_EMAIL: 'admin@test.com',
      DEFAULT_ADMIN_PASSWORD: 'pass',
    });
    const hashingService = createHashingServiceMock();
    (hashingService.hash as jest.Mock).mockResolvedValue('hashed');
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const service = new AdminSeedService(
      userService,
      configService,
      hashingService,
    );
    await service.onModuleInit();

    expect(console.error).toHaveBeenCalled();
  });
});
