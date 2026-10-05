import { ApiClientError } from './api';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

export interface NormalizedApiError {
  message: string;
  status?: number;
  traceId?: string;
  details?: Array<{ path: string; message: string }>;
}

export const normalizeError = (error: unknown): NormalizedApiError => {
  if (error instanceof ApiClientError) {
    return {
      message: error.message,
      status: error.status,
      traceId: error.traceId,
      details: error.data?.error?.details || error.data?.details || undefined
    };
  }
  
  if (error instanceof Error) {
    return { message: error.message };
  }
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  return { message: 'An unknown error occurred' };
};

/**
 * Extracts a user-friendly error message, combining validation details if present.
 */
export const getErrorMessage = (error: NormalizedApiError | string | null | undefined): string => {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'string') return error;
  
  if (error.details && error.details.length > 0) {
    return `${error.message}: ${error.details.map(d => `${d.path} ${d.message}`).join(', ')}`;
  }
  
  return error.message;
};
