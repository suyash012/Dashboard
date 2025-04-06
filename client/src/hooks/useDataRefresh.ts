import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch } from '@/lib/redux/hooks';
import { fetchWeatherData } from '@/lib/redux/slices/weatherSlice';
import { fetchCryptoData } from '@/lib/redux/slices/cryptoSlice';
import { fetchNewsData } from '@/lib/redux/slices/newsSlice';

interface UseDataRefreshOptions {
  interval?: number;
  initialCities?: string[];
  initialCryptos?: string[];
  includeNews?: boolean;
}

export function useDataRefresh({
  interval = 60,
  initialCities = ['New York', 'London', 'Tokyo'],
  initialCryptos = ['bitcoin', 'ethereum', 'cardano'],
  includeNews = true,
}: UseDataRefreshOptions = {}) {
  const dispatch = useAppDispatch();
  const [timeUntilRefresh, setTimeUntilRefresh] = useState(interval);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const refreshData = useCallback(() => {
    dispatch(fetchWeatherData(initialCities));
    dispatch(fetchCryptoData(initialCryptos));
    if (includeNews) {
      dispatch(fetchNewsData());
    }
    setTimeUntilRefresh(interval);
  }, [dispatch, initialCities, initialCryptos, includeNews, interval]);

  useEffect(() => {
    // Initial data load
    if (isInitialLoad) {
      refreshData();
      setIsInitialLoad(false);
    }

    // Set up the countdown timer
    const timer = setInterval(() => {
      setTimeUntilRefresh((prev) => {
        if (prev <= 1) {
          refreshData();
          return interval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [refreshData, interval, isInitialLoad]);

  return {
    refreshData,
    timeUntilRefresh,
    isLoading: isInitialLoad,
  };
}
