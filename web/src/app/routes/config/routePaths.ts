export const ROUTE_PATHS = {
  ROOT: '/',
  USER_LANDING: '/user',
  ADMIN_LANDING: '/admin',
  OWNER_LANDING: '/owner',
  PARTNER_LANDING: '/partner',
  DEV_LANDING: '/dev',
  SHOWCASE: '/showcase',

  // Auth paths
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Fallbacks & Errors
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND: '/404',
} as const;
