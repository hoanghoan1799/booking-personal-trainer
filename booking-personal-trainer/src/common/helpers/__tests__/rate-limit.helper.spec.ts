import type { Request } from 'express';

import { getRateLimitTracker } from '../rate-limit.helper';

describe('getRateLimitTracker', () => {
  it('should prefer user id when present', () => {
    const req = { user: { id: 'u1' } } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.tracker).toBe('user:u1');
    expect(actual.kind).toBe('user');
  });

  it('should ignore non-string user id and fall back', () => {
    const req = {
      user: { id: 123 },
      ip: '1.2.3.4',
      headers: {},
    } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('ip');
    expect(actual.tracker).toBe('ip:1.2.3.4');
  });

  it('should ignore empty user id and use token when present', () => {
    const req = {
      user: { id: '' },
      headers: { authorization: 'Bearer my-token' },
    } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('token');
    expect(actual.tracker.startsWith('token:')).toBe(true);
  });

  it('should use token hash when bearer token present and no user id', () => {
    const req = {
      headers: { authorization: 'Bearer my-token' },
    } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('token');
    expect(actual.tracker.startsWith('token:')).toBe(true);
    expect(actual.tracker.length).toBe('token:'.length + 64);
  });

  it('should ignore non-string authorization header and fall back to ip', () => {
    const req = {
      headers: { authorization: 123 },
      ip: '1.2.3.4',
    } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('ip');
    expect(actual.tracker).toBe('ip:1.2.3.4');
  });

  it('should ignore non-bearer authorization schemes', () => {
    const req = {
      headers: { authorization: 'Basic abc' },
      ip: '1.2.3.4',
    } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('ip');
  });

  it('should ignore bearer prefix without token', () => {
    const req = {
      headers: { authorization: 'Bearer ' },
      ip: '1.2.3.4',
    } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('ip');
    expect(actual.tracker).toBe('ip:1.2.3.4');
  });

  it('should ignore empty bearer token', () => {
    const req = {
      headers: { authorization: 'Bearer   ' },
      ip: '1.2.3.4',
    } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('ip');
  });

  it('should accept any casing and whitespace around Bearer', () => {
    const req = {
      headers: { authorization: '  bEaReR   my-token  ' },
    } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('token');
  });

  it('should fall back to ip when no user and no token', () => {
    const req = { ip: '1.2.3.4', headers: {} } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('ip');
    expect(actual.tracker).toBe('ip:1.2.3.4');
  });

  it('should use unknown-ip when req.ip missing', () => {
    const req = { headers: {} } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('ip');
    expect(actual.tracker).toBe('ip:unknown-ip');
  });

  it('should use unknown-ip when req.ip is empty', () => {
    const req = { headers: {}, ip: '' } as unknown as Request;

    const actual = getRateLimitTracker(req);

    expect(actual.kind).toBe('ip');
    expect(actual.tracker).toBe('ip:unknown-ip');
  });
});
