import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { fetchCryptoDetailData } from '@/lib/redux/slices/cryptoSlice';
import { toggleFavoriteCrypto } from '@/lib/redux/slices/favoritesSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, TrendingUp, DollarSign, BarChart } from 'lucide-react';
import { Link } from 'wouter';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

interface CryptoDetailPageProps {
  id: string;
}

export function CryptoDetailPage({ id }: CryptoDetailPageProps) {
  const dispatch = useAppDispatch();
  const { cryptoDetails, loading, error } = useAppSelector(state => state.crypto);
  const favoriteCryptos = useAppSelector(state => state.favorites.favoriteCryptos);
  
  const isFavorite = favoriteCryptos.includes(id);
  const cryptoDetail = cryptoDetails[id];

  useEffect(() => {
    dispatch(fetchCryptoDetailData(id));
  }, [dispatch, id]);

  const handleToggleFavorite = () => {
    dispatch(toggleFavoriteCrypto(id));
  };
  
  const formatPrice = (price: number) => {
    return price.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  
  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1_000_000_000_000) {
      return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
    }
    if (marketCap >= 1_000_000_000) {
      return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
    }
    if (marketCap >= 1_000_000) {
      return `$${(marketCap / 1_000_000).toFixed(2)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  if (loading && !cryptoDetail) {
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        
        <Skeleton className="h-[400px] w-full mb-8" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-60 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </div>
    );
  }

  if (error && !cryptoDetail) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/">
            <a className="mr-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <ArrowLeft className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </a>
          </Link>
          <h1 className="text-2xl font-bold">{id.charAt(0).toUpperCase() + id.slice(1)}</h1>
        </div>
        
        <Card className="mb-8">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 dark:text-red-400 mb-4">
              Error loading crypto data: {error}
            </p>
            <Button
              onClick={() => dispatch(fetchCryptoDetailData(id))}
              className="bg-primary hover:bg-primary/90"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cryptoDetail) {
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
          <h1 className="text-2xl font-bold">{cryptoDetail.name} ({cryptoDetail.symbol.toUpperCase()})</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium">Price</h3>
            </div>
            <p className="text-3xl font-bold">${formatPrice(cryptoDetail.price)}</p>
            <div className={`mt-2 flex items-center ${cryptoDetail.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {cryptoDetail.priceChange24h >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              )}
              <span>{cryptoDetail.priceChange24h >= 0 ? '+' : ''}{cryptoDetail.priceChange24h.toFixed(2)}% (24h)</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <BarChart className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium">Market Cap</h3>
            </div>
            <p className="text-3xl font-bold">{formatMarketCap(cryptoDetail.marketCap)}</p>
            <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm">
              Volume (24h): ${formatMarketCap(cryptoDetail.volume24h)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h3 className="text-lg font-medium">All Time High</h3>
            </div>
            <p className="text-3xl font-bold">${formatPrice(cryptoDetail.ath)}</p>
            <div className="mt-2 text-gray-500 dark:text-gray-400 text-sm flex items-center">
              <span>{format(new Date(cryptoDetail.athDate), 'MMM d, yyyy')}</span>
              <span className="mx-2">•</span>
              <span className={cryptoDetail.athChangePercentage >= 0 ? 'text-green-500' : 'text-red-500'}>
                {cryptoDetail.athChangePercentage >= 0 ? '+' : ''}{cryptoDetail.athChangePercentage.toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Price History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={cryptoDetail.priceHistory.map(item => ({
                  time: format(new Date(item.timestamp), 'MMM d, HH:mm'),
                  price: item.price
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis
                  domain={['auto', 'auto']}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Price']}
                />
                <ReferenceLine y={cryptoDetail.price} stroke="red" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#10B981"
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Supply Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Circulating Supply</span>
                <span className="font-medium">{cryptoDetail.circulatingSupply.toLocaleString()} {cryptoDetail.symbol.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Total Supply</span>
                <span className="font-medium">{cryptoDetail.totalSupply.toLocaleString()} {cryptoDetail.symbol.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Max Supply</span>
                <span className="font-medium">
                  {cryptoDetail.maxSupply ? 
                    `${cryptoDetail.maxSupply.toLocaleString()} ${cryptoDetail.symbol.toUpperCase()}` : 
                    'No Max Supply'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Price Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">24h High</span>
                <span className="font-medium">${formatPrice(cryptoDetail.high24h)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">24h Low</span>
                <span className="font-medium">${formatPrice(cryptoDetail.low24h)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Market Rank</span>
                <span className="font-medium">#{cryptoDetail.id === 'bitcoin' ? 1 : (cryptoDetail.id === 'ethereum' ? 2 : 3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                <span className="font-medium">{format(new Date(cryptoDetail.lastUpdated), 'MMM d, yyyy HH:mm')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
