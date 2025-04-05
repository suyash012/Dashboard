import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { fetchWeatherDetailData } from '@/lib/redux/slices/weatherSlice';
import { toggleFavoriteCity } from '@/lib/redux/slices/favoritesSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, Wind, Droplets, Eye, Thermometer } from 'lucide-react';
import { Link } from 'wouter';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

interface WeatherDetailPageProps {
  city: string;
}

export function WeatherDetailPage({ city }: WeatherDetailPageProps) {
  const dispatch = useAppDispatch();
  const { cityDetails, loading, error } = useAppSelector(state => state.weather);
  const favoriteCities = useAppSelector(state => state.favorites.favoriteCities);
  
  const isFavorite = favoriteCities.includes(city);
  const cityDetail = cityDetails[city];

  useEffect(() => {
    dispatch(fetchWeatherDetailData(city));
  }, [dispatch, city]);

  const handleToggleFavorite = () => {
    dispatch(toggleFavoriteCity(city));
  };

  if (loading && !cityDetail) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <a className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </a>
          </Link>
          <Skeleton className="h-8 w-48" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-2 gap-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error && !cityDetail) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <a className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </a>
          </Link>
          <h1 className="text-2xl font-bold">Weather for {city}</h1>
        </div>
        
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">
              Error loading weather data: {error}
            </p>
            <Button
              onClick={() => dispatch(fetchWeatherDetailData(city))}
              className="bg-primary hover:bg-primary/90"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cityDetail) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/">
            <a className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </a>
          </Link>
          <h1 className="text-2xl font-bold">Weather for {city}</h1>
        </div>
        
        <Button
          variant="outline"
          onClick={handleToggleFavorite}
          className="flex items-center space-x-2"
        >
          <Star className={`h-4 w-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{isFavorite ? 'Favorited' : 'Add to Favorites'}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-4xl font-bold">{Math.round(cityDetail.temp)}°C</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{cityDetail.condition}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-700 dark:text-gray-300">Feels like {Math.round(cityDetail.feelsLike)}°C</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                  {format(new Date(cityDetail.timestamp), 'EEEE, MMMM d, yyyy h:mm a')}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-center">
                <Wind className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Wind Speed</p>
                  <p className="font-semibold">{cityDetail.windSpeed} m/s</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-center">
                <Droplets className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
                  <p className="font-semibold">{cityDetail.humidity}%</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-center">
                <Eye className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Visibility</p>
                  <p className="font-semibold">{cityDetail.visibility / 1000} km</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg flex items-center">
                <Thermometer className="h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Pressure</p>
                  <p className="font-semibold">{cityDetail.pressure} hPa</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Temperature History (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={cityDetail.history}
                  margin={{ top: 5, right: 20, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#CCCCCC" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#3B82F6"
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
