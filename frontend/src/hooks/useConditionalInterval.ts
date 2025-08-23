import { useEffect, useRef } from 'react';

interface UseConditionalIntervalOptions {
  enabled: boolean;
  delay: number;
  callback: () => void;
}

export function useConditionalInterval({ enabled, delay, callback }: UseConditionalIntervalOptions) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (enabled && delay !== null) {
      intervalRef.current = setInterval(callback, delay);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, delay, callback]);

  return intervalRef.current;
}
