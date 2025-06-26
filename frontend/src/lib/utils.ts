import { clsx, type ClassValue } from "clsx"
import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type UseGetResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

export function useGet<T = any>(url: string, options?: RequestInit): UseGetResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const token = localStorage.getItem("token");

    fetch(`${import.meta.env.VITE_BACKEND_URL}${url}`, {
      ...options,
      method: "GET",
      headers: {
        ...(options?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`GET ${url} failed`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url, refetchIndex]);

  return {
    data,
    loading,
    error,
    refetch: () => setRefetchIndex((i) => i + 1),
  };
}

type UseRequestOptions = RequestInit & { body?: any };

type UsePostResult<T> = {
  trigger: (body?: any, extraOptions?: RequestInit) => Promise<T | null>;
  data: T | null;
  loading: boolean;
  error: Error | null;
};
function createMethodHook(method: string) {
  return function useRequest<T = any>(url: string, options: UseRequestOptions = {}): UsePostResult<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const trigger = async (body?: any, extraOptions: RequestInit = {}): Promise<T | null> => {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      try {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${url}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
            ...(extraOptions.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body ?? options.body),
          ...options,
          ...extraOptions,
        });

        if (!res.ok) throw new Error(`${method} ${url} failed`);
        const json: T = await res.json();
        setData(json);
        return json;
      } catch (err: any) {
        setError(err);
        return null;
      } finally {
        setLoading(false);
      }
    };

    return { trigger, data, loading, error };
  };
}


export const usePost = createMethodHook("POST");
export const usePut = createMethodHook("PUT");
export const usePatch = createMethodHook("PATCH");
export const useDelete = createMethodHook("DELETE");