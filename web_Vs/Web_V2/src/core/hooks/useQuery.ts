import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { showToast } from '../../shared/utils/toast.utils';

// Query keys for cache management
export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'] as const,
    permissions: ['auth', 'permissions'] as const,
  },
  restaurants: {
    all: (params?: any) => ['restaurants', 'list', params] as const,
    detail: (id: string) => ['restaurants', 'detail', id] as const,
    menu: (id: string) => ['restaurants', 'menu', id] as const,
  },
  orders: {
    all: (params?: any) => ['orders', 'list', params] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    tracking: (id: string) => ['orders', 'tracking', id] as const,
  },
  cart: {
    details: ['cart'] as const,
  },
};

// Custom wrapper for useQuery with error handling
export function useAppQuery<TData = unknown, TError = AxiosError>(
  key: readonly unknown[],
  fn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError, TData>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TData, TError>({
    queryKey: key,
    queryFn: fn,
    onError: (error: any) => {
      showToast.error(error?.message || 'An error occurred');
      // Log to monitoring service
      console.error('Query error:', { key, error });
    },
    ...options,
  });
}

// Custom wrapper for useMutation with automatic cache invalidation
export function useAppMutation<TData = unknown, TVariables = unknown, TError = AxiosError>(
  fn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, TError, TVariables> & {
    invalidateQueries?: readonly unknown[][];
    showSuccessToast?: boolean;
    successMessage?: string;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables>({
    mutationFn: fn,
    onSuccess: async (data, variables, context) => {
      // Invalidate related queries
      if (options?.invalidateQueries) {
        await Promise.all(
          options.invalidateQueries.map((key) =>
            queryClient.invalidateQueries({ queryKey: key })
          )
        );
      }

      // Show success toast
      if (options?.showSuccessToast) {
        showToast.success(options.successMessage || 'Operation successful');
      }

      // Call original onSuccess
      await options?.onSuccess?.(data, variables, context);
    },
    onError: (error: any) => {
      showToast.error(error?.message || 'Operation failed');
      options?.onError?.(error, null as any, null as any);
    },
    ...options,
  });
}