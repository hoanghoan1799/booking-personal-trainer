import { HttpStatus } from '@nestjs/common';
import { getSchemaPath } from '@nestjs/swagger';
import type { ApiBodyOptions, ApiResponseOptions } from '@nestjs/swagger';

import {
  API_DESCRIPTIONS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '../../../common/constants/message.constant';

import {
  ResponseFullUserDto,
  ResponseUserDto,
} from '../../user/dtos/response-user.dto';
import { LoginDto, AuthResponseDataDto } from '../dtos/login.dto';
import { LogoutDto } from '../dtos/logout.dto';
import { LinkAuth0ToLocalDto } from '../dtos/link-auth0-to-local.dto';
import { RegisterDto } from '../dtos/register.dto';
import { SetPasswordDto } from '../dtos/set-password.dto';
import { TokenExchangeDto } from '../dtos/token-exchange.dto';
import {
  LogoutResponseDto,
  RefreshTokenRequestDto,
  TokensDto,
} from '../dtos/token.dto';

import { AuthDtoSwagger } from './auth-swagger-dto.constants';

export const AuthSwagger = {
  Controller: {
    ApiOperation: {
      Register: {
        summary: API_DESCRIPTIONS.AUTH.REGISTER_SUMMARY,
        description: API_DESCRIPTIONS.AUTH.REGISTER_DESCRIPTION,
      },
      Login: {
        summary: API_DESCRIPTIONS.AUTH.LOGIN_SUMMARY,
        description: API_DESCRIPTIONS.AUTH.LOGIN_DESCRIPTION,
      },
      TokenExchange: {
        summary: API_DESCRIPTIONS.AUTH.TOKEN_EXCHANGE_SUMMARY,
        description: API_DESCRIPTIONS.AUTH.TOKEN_EXCHANGE_DESCRIPTION,
      },
      LinkAuth0: {
        summary: 'Link Auth0 to existing local account',
        description:
          'Verifies third-party JWT and links it to an existing local user after password verification, then returns application tokens.',
      },
      SetPassword: {
        summary: 'Create password for current user',
        description:
          'Allows Auth0-first users to create a password so they can log in with email/password next time.',
      },
      RefreshToken: {
        summary: API_DESCRIPTIONS.AUTH.REFRESH_TOKEN_SUMMARY,
        description: API_DESCRIPTIONS.AUTH.REFRESH_TOKEN_DESCRIPTION,
      },
      Logout: {
        summary: API_DESCRIPTIONS.AUTH.LOGOUT_SUMMARY,
        description: API_DESCRIPTIONS.AUTH.LOGOUT_DESCRIPTION,
      },
      Profile: {
        summary: API_DESCRIPTIONS.AUTH.PROFILE_SUMMARY,
        description: API_DESCRIPTIONS.AUTH.PROFILE_DESCRIPTION,
      },
    },
    ApiBody: {
      Register: { type: RegisterDto },
      Login: { type: LoginDto },
      TokenExchange: { type: TokenExchangeDto },
      LinkAuth0: { type: LinkAuth0ToLocalDto },
      SetPassword: { type: SetPasswordDto },
      RefreshToken: { type: RefreshTokenRequestDto },
      Logout: { type: LogoutDto },
    } satisfies Record<string, ApiBodyOptions>,
    ApiResponse: {
      RegisterCreated: {
        status: HttpStatus.CREATED,
        description: SUCCESS_MESSAGES.USER.CREATED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(AuthResponseDataDto) },
          },
        },
      },
      RegisterConflict: {
        status: HttpStatus.CONFLICT,
        description: `${ERROR_MESSAGES.USER.EMAIL_TAKEN} or ${ERROR_MESSAGES.USER.USERNAME_TAKEN}`,
      },
      RegisterBadRequest: {
        status: HttpStatus.BAD_REQUEST,
        description: ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS,
      },
      LoginOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.USER.LOGGED_IN,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(AuthResponseDataDto) },
          },
        },
      },
      LoginNotFound: {
        status: HttpStatus.NOT_FOUND,
        description: ERROR_MESSAGES.USER.NOT_FOUND,
      },
      LoginPasswordNotMatch: {
        status: HttpStatus.BAD_REQUEST,
        description: ERROR_MESSAGES.VALIDATION.PASSWORD_NOT_MATCH,
      },
      LoginMissingRequiredFields: {
        status: HttpStatus.BAD_REQUEST,
        description: ERROR_MESSAGES.AUTH.MISSING_REQUIRED_FIELDS,
      },
      TokenExchangeOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.USER.LOGGED_IN,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(AuthResponseDataDto) },
          },
        },
      },
      TokenExchangeUnauthorized: {
        status: HttpStatus.UNAUTHORIZED,
        description: ERROR_MESSAGES.AUTH.INVALID_TOKEN,
      },
      TokenExchangeBadRequestEmailMissing: {
        status: HttpStatus.BAD_REQUEST,
        description: ERROR_MESSAGES.AUTH.EMAIL_MISSING,
      },
      LinkAuth0Ok: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.USER.LOGGED_IN,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(AuthResponseDataDto) },
          },
        },
      },
      SetPasswordNoContent: {
        status: HttpStatus.NO_CONTENT,
        description: 'Password created successfully',
      },
      RefreshTokenOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.AUTH.TOKEN_REFRESHED,
        type: TokensDto,
      },
      RefreshTokenBadRequestRequired: {
        status: HttpStatus.BAD_REQUEST,
        description: ERROR_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED,
      },
      RefreshTokenUnauthorizedInvalid: {
        status: HttpStatus.UNAUTHORIZED,
        description: ERROR_MESSAGES.AUTH.INVALID_REFRESH_TOKEN,
      },
      LogoutOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.AUTH.LOGGED_OUT,
        type: LogoutResponseDto,
      },
      ProfileOk: {
        status: HttpStatus.OK,
        description: SUCCESS_MESSAGES.USER.PROFILE_RETRIEVED,
        schema: {
          required: ['data'],
          properties: {
            data: { $ref: getSchemaPath(ResponseFullUserDto) },
          },
        },
      },
      ProfileUnauthorized: {
        status: HttpStatus.UNAUTHORIZED,
        description: ERROR_MESSAGES.AUTH.ACCESS_TOKEN_INVALID,
      },
      ProfileNotFound: {
        status: HttpStatus.NOT_FOUND,
        description: ERROR_MESSAGES.USER.NOT_FOUND,
      },
    } satisfies Record<string, ApiResponseOptions>,
    ApiExtraModels: {
      User: ResponseUserDto,
      FullUser: ResponseFullUserDto,
      AuthResponseData: AuthResponseDataDto,
    },
  },
  Dto: { ...AuthDtoSwagger },
} as const;
