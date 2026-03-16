import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized React Query client configuration
 *
 * Default settings:
 * - staleTime: 30s - Data is fresh for 30 seconds before refetching
 * - gcTime: 5min - Unused data is garbage collected after 5 minutes
 * - retry: 2 - Failed queries retry twice
 * - refetchOnWindowFocus: true - Refetch when window regains focus
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

/**
 * Query key factory for type-safe, hierarchical cache management
 *
 * Usage:
 * - queryKeys.user.profile() -> ['user', 'profile']
 * - queryKeys.user.settings() -> ['user', 'settings']
 * - queryKeys.items.all -> ['items']
 * - queryKeys.items.byId(id) -> ['items', id]
 *
 * Invalidation examples:
 * - queryClient.invalidateQueries({ queryKey: queryKeys.user.all }) // Invalidate all user queries
 * - queryClient.invalidateQueries({ queryKey: queryKeys.items.byId('123') }) // Invalidate specific item
 */
export const queryKeys = {
  // User-related queries
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },

  // Items/resources queries (customize per project)
  // items: {
  //   all: ['items'] as const,
  //   list: (filters?: Record<string, unknown>) =>
  //     [...queryKeys.items.all, 'list', filters] as const,
  //   byId: (id: string) => [...queryKeys.items.all, id] as const,
  //   detail: (id: string) => [...queryKeys.items.all, id, 'detail'] as const,
  // },

  // Health check
  health: {
    all: ['health'] as const,
    check: () => [...queryKeys.health.all, 'check'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    fcmToken: () => [...queryKeys.notifications.all, 'fcmToken'] as const,
    settings: () => [...queryKeys.notifications.all, 'settings'] as const,
  },
} as const;
