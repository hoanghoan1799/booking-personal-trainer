import { UseInterceptors } from '@nestjs/common';

// Interceptors
import {
  ClassConstructor,
  SerializeInterceptor,
} from '../interceptors/transform.interceptor';

/**
 * Decorator that enables serialization of a response to a specified DTO.
 * @param {ClassConstructor<T>} dto - The DTO to serialize the response to.
 * @returns {MethodDecorator} A method decorator that enables serialization of the response.
 */
export function Serialize<T>(dto: ClassConstructor<T>) {
  return UseInterceptors(new SerializeInterceptor(dto));
}
