import { EntityManager, MikroORM } from '@mikro-orm/core';

/**
 * Forked request context EntityManager (matches typical request-scoped usage).
 */
export const getForkedEntityManager = (orm: MikroORM): EntityManager => {
  return orm.em.fork();
};
