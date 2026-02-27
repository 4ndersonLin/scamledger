import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@cryptoscam/shared';
import { api } from '../lib/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(path: string | null): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: !!path,
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!path) return;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result: ApiResponse<T> = await api.get<T>(path);
      if (result.success) {
        setState({ data: result.data, loading: false, error: null });
      } else {
        setState({ data: null, loading: false, error: result.error.message });
      }
    } catch {
      setState({ data: null, loading: false, error: 'Network error' });
    }
  }, [path]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { ...state, refetch: () => void fetchData() };
}
