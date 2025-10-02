import { useState, useEffect, useCallback } from 'react';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiOptions {
  immediate?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export function useApi<T>(
  apiCall: () => Promise<{ success: boolean; data?: T; error?: { message: string } }>,
  dependencies: any[] = [],
  options: UseApiOptions = {}
) {
  const { immediate = true, retryCount = 0, retryDelay = 1000 } = options;
  
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (attempt = 0) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall();
      
      if (response.success) {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
        });
      } else {
        throw new Error(response.error?.message || 'API call failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (attempt < retryCount) {
        setTimeout(() => execute(attempt + 1), retryDelay);
      } else {
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
      }
    }
  }, [apiCall, retryCount, retryDelay]);

  const retry = useCallback(() => {
    execute();
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return {
    ...state,
    execute,
    retry,
  };
}

export function useApiMutation<T, P = any>(
  apiCall: (params: P) => Promise<{ success: boolean; data?: T; error?: { message: string } }>
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(async (params: P) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await apiCall(params);
      
      if (response.success) {
        setState({
          data: response.data || null,
          loading: false,
          error: null,
        });
        return response.data;
      } else {
        throw new Error(response.error?.message || 'API call failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}