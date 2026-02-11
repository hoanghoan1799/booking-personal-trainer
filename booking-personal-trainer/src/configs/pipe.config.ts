import { ValidationPipe } from '@nestjs/common';

/**
 * Global Validation Pipe configuration.
 *
 * ValidationPipe is a built-in NestJS pipe that uses class-validator and class-transformer
 * to automatically validate incoming request data against DTOs (Data Transfer Objects).
 *
 * This pipe runs automatically on all incoming requests before they reach your controllers,
 * ensuring data integrity and type safety throughout your application.
 *
 * How it works:
 * 1. Receives incoming request data (body, query params, route params)
 * 2. Transforms plain JavaScript objects to DTO class instances
 * 3. Validates the data against decorators (e.g., @IsEmail(), @IsNotEmpty())
 * 4. Throws BadRequestException if validation fails
 * 5. Strips out properties not defined in the DTO (if whitelist is enabled)
 */
export const GLOBAL_PIPE_CONFIG = new ValidationPipe({
  /**
   * `whitelist`
   *
   * Purpose:
   * - Automatically removes properties from incoming data that are not defined in the DTO.
   *
   * Current value:
   * - `true`: strips unknown properties from request payloads.
   *
   * How it works:
   * - If a request contains extra fields not in your DTO, they are automatically removed.
   * - Example: DTO has `email` and `password`, but request has `email`, `password`, `admin: true`.
   *   With whitelist: `true`, the `admin` property is removed before reaching your controller.
   *
   * Security benefit:
   * - Prevents mass assignment attacks where attackers try to set properties they shouldn't.
   * - Example: Without whitelist, a user could send `role: 'admin'` and potentially escalate privileges.
   *
   * Note:
   * - Works in conjunction with `forbidNonWhitelisted` - if both are true, extra properties cause errors.
   */
  whitelist: true,

  /**
   * `forbidNonWhitelisted`
   *
   * Purpose:
   * - Throws a validation error if the request contains properties not defined in the DTO.
   *
   * Current value:
   * - `true`: rejects requests with unknown properties (returns 400 Bad Request).
   *
   * How it works:
   * - When combined with `whitelist: true`, this ensures strict validation.
   * - If a request has extra fields, instead of silently removing them, it throws an error.
   *
   * Example:
   * - DTO: `{ email: string, password: string }`
   * - Request: `{ email: "test@example.com", password: "123456", role: "admin" }`
   * - Result: 400 Bad Request with error message about `role` being an unknown property.
   *
   * Security benefit:
   * - Makes API contracts explicit - clients know exactly what fields are allowed.
   * - Helps catch typos or incorrect field names early.
   *
   * Trade-off:
   * - Stricter validation means clients must send exactly the right fields.
   * - Consider setting to `false` if you need backward compatibility with older API versions.
   */
  forbidNonWhitelisted: true,

  /**
   * `transform`
   *
   * Purpose:
   * - Automatically transforms incoming plain JavaScript objects into DTO class instances.
   *
   * Current value:
   * - `true`: enables automatic transformation.
   *
   * How it works:
   * - Request bodies come as plain objects: `{ email: "test@example.com", age: "25" }`
   * - With transform: `true`, they become instances of your DTO class.
   * - This enables:
   *   - Type checking and IntelliSense in your controllers
   *   - Class methods and getters/setters to work
   *   - Type transformation (e.g., string "25" → number 25) via class-transformer
   *
   * Example:
   * ```typescript
   * // Without transform: req.body is { email: string, age: string }
   * // With transform: req.body is LoginDto instance with proper types
   * @Post()
   * login(@Body() dto: LoginDto) {
   *   // dto is now a LoginDto instance, not a plain object
   * }
   * ```
   *
   * Why it's needed:
   * - TypeScript types are erased at runtime - transform ensures runtime types match compile-time types.
   * - Works with `transformOptions.enableImplicitConversion` to convert string numbers to numbers, etc.
   */
  transform: true,

  /**
   * `transformOptions`
   *
   * Purpose:
   * - Configures how class-transformer performs type transformations.
   *
   * Current configuration:
   * - `enableImplicitConversion: true`: automatically converts types based on DTO property types.
   */
  transformOptions: {
    /**
     * `enableImplicitConversion`
     *
     * Purpose:
     * - Automatically converts incoming values to match the TypeScript type of DTO properties.
     *
     * Current value:
     * - `true`: enables automatic type conversion.
     *
     * How it works:
     * - HTTP requests send everything as strings (query params, form data).
     * - With this enabled, strings are converted to the expected type automatically.
     *
     * Examples:
     * - DTO: `age: number`, Request: `age: "25"` → Converts to `age: 25` (number)
     * - DTO: `isActive: boolean`, Request: `isActive: "true"` → Converts to `isActive: true`
     * - DTO: `tags: string[]`, Request: `tags: "a,b,c"` → Converts to `tags: ["a", "b", "c"]`
     *
     * Without this:
     * - You'd need explicit decorators like `@Type(() => Number)` on every property.
     * - Or manually convert in your controllers (error-prone).
     *
     * Benefits:
     * - Cleaner DTOs - no need for `@Type()` decorators everywhere.
     * - Automatic type safety - TypeScript types are enforced at runtime.
     * - Works seamlessly with query parameters (always strings) and JSON bodies.
     *
     * Note:
     * - Still respects explicit `@Type()` decorators if you need custom transformation logic.
     */
    enableImplicitConversion: true,
  },
});
