import { BcryptService } from '../bcrypt.service';

jest.mock('bcrypt', () => ({
  genSalt: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
}));

import { compare, genSalt, hash } from 'bcrypt';

describe('BcryptService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('hash should generate salt and hash', async () => {
    (genSalt as unknown as jest.Mock).mockResolvedValue('salt');
    (hash as unknown as jest.Mock).mockResolvedValue('hashed');
    const service = new BcryptService();

    const actual = await service.hash('pw');

    expect(genSalt).toHaveBeenCalled();
    expect(hash).toHaveBeenCalledWith('pw', 'salt');
    expect(actual).toBe('hashed');
  });

  it('compare should delegate to bcrypt.compare', async () => {
    (compare as unknown as jest.Mock).mockResolvedValue(true);
    const service = new BcryptService();

    const actual = await service.compare('pw', 'hashed');

    expect(compare).toHaveBeenCalledWith('pw', 'hashed');
    expect(actual).toBe(true);
  });
});
