/**
 * Frontend route constants aligned with backend modules.
 * Backend API: /api/v1/{module}
 */

/** API base path (matches backend app.constant and main.ts) */
export const API_PREFIX = "api" as const;

/** API version paths */
export const API_VERSION = {
  V1: "v1",
  V2: "v2",
} as const;

/** Full API base URL segment */
export const API_BASE = `/${API_PREFIX}/${API_VERSION.V1}` as const;

/** Backend API endpoint paths (append to API_BASE for full URL) */
export const API_ROUTES = {
  AUTH: "/auth",
  BOOKINGS: "/bookings",
  BOOKING_DISCOVERY: "/booking-discovery",
  EXERCISES: "/exercises",
  TEMPLATES: "/templates",
  TRAINERS: "/trainers",
  USERS: "/users",
  WORKOUTS: "/workouts",
} as const;

/** Full API endpoint paths for fetch calls */
export const API_ENDPOINTS = {
  AUTH: `${API_BASE}${API_ROUTES.AUTH}`,
  BOOKINGS: `${API_BASE}${API_ROUTES.BOOKINGS}`,
  BOOKING_DISCOVERY: `${API_BASE}${API_ROUTES.BOOKING_DISCOVERY}`,
  EXERCISES: `${API_BASE}${API_ROUTES.EXERCISES}`,
  TEMPLATES: `${API_BASE}${API_ROUTES.TEMPLATES}`,
  TRAINERS: `${API_BASE}${API_ROUTES.TRAINERS}`,
  USERS: `${API_BASE}${API_ROUTES.USERS}`,
  WORKOUTS: `${API_BASE}${API_ROUTES.WORKOUTS}`,
} as const;

/** App (frontend) routes for navigation */
export const APP_ROUTES = {
  ROOT: "/",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  REGISTER: "/register",
  PROFILE: "/profile",
  CALENDAR: "/calendar",
  SCHEDULE: "/schedule",
  TEMPLATES: "/templates",
  TEMPLATES_UPLOAD: "/templates/upload",
  BOOKINGS: "/bookings",
  EXERCISES: "/exercises",
  USERS: "/users",
  WORKOUTS: "/workouts",
  ERROR_404: "/error-404",
} as const;
