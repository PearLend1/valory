import { trpc } from '@/lib/trpc';
import { useCallback } from 'react';

export function useAuth() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation();

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  }, [logoutMutation]);

  return {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };
}
