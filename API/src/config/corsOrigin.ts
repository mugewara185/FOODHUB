import { config } from './env';

export const allowedOrigins = (config.clientUrl || 'http://localhost:5173')
  .split(',')
  .map(url => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const isOriginAllowed = (origin?: string): boolean => {
  if (!origin) return true; // Server-to-server, health check, mobile/CLI tools
  const normalized = origin.trim().replace(/\/+$/, '');
  if (allowedOrigins.includes('*') || allowedOrigins.includes(normalized)) {
    return true;
  }
  // Allow Azure Static Web Apps deployment and PR preview subdomains
  if (
    allowedOrigins.some(ao => ao.includes('azurestaticapps.net')) &&
    (normalized.endsWith('.azurestaticapps.net') || /^https:\/\/[a-z0-9-]+\.azurestaticapps\.net$/i.test(normalized))
  ) {
    return true;
  }
  return false;
};
