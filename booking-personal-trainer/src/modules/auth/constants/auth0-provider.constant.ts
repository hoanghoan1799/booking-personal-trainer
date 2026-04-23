import { USER_PROVIDER_NAME_LOCAL } from '../../user/constants/user-provider-name.constant';

/** Stored in user_providers.provider_name for Auth0 logins. */
export const AUTH0_PROVIDER_NAME = 'auth0' as const;

/**
 * Stored in user_providers.provider_name for email + password (local credentials).
 * Same value as {@link USER_PROVIDER_NAME_LOCAL}.
 */
export const LOCAL_PROVIDER_NAME: typeof USER_PROVIDER_NAME_LOCAL =
  USER_PROVIDER_NAME_LOCAL;
