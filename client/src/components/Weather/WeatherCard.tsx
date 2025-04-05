import { Card } from '@/components/ui/card';
import { WeatherData } from '@/lib/redux/slices/weatherSlice';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { toggleFavoriteCity } from '@/lib/redux/slices/favoritesSlice';
import { Link } from 'wouter';
import { Star } from 'lucide-react';

interface WeatherCardProps {
  data?: WeatherData[];
  loading?: boolean;
  error?: string | null;
}

export function WeatherCard({ data, loading, error }: WeatherCardProps) {
  const dispatch = useAppDispatch();
  const favoriteCities = useAppSelector(state => state.favorites.favoriteCities);

  const handleToggleFavorite = (city: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFavoriteCity(city));
  };

  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Weather</h3>
            <Link href="/weather/New%20York">
              <a className="text-white/80 hover:text-white text-sm flex items-center">
                View All
                <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </Link>
          </div>
        </div>
        <div className="p-5 flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Weather</h3>
          </div>
        </div>
        <div className="p-5 text-center">
          <p className="text-red-500 dark:text-red-400">Error loading weather data: {error}</p>
          <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Retry
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Weather</h3>
          <Link href="/weather/New%20York">
            <a className="text-white/80 hover:text-white text-sm flex items-center">
              View All
              <svg className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </Link>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {data?.map((city) => (
          <Link key={city.city} href={`/weather/${encodeURIComponent(city.city)}`}>
            <a className="block p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    {city.city}
                    <Star
                      className={`h-4 w-4 ml-1 cursor-pointer ${
                        favoriteCities.includes(city.city) ? 'text-amber-400 fill-amber-400' : 'text-gray-400'
                      }`}
                      onClick={(e) => handleToggleFavorite(city.city, e)}
                    />
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{city.condition}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {Math.round(city.temp)}°C
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-sm">
                    Humidity: {city.humidity}%
                  </div>
                </div>
              </div>
            </a>
          </Link>
        ))}
      </div>
    </Card>
  );
}
