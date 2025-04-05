import { Card } from '@/components/ui/card';
import { CryptoData } from '@/lib/redux/slices/cryptoSlice';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { toggleFavoriteCrypto } from '@/lib/redux/slices/favoritesSlice';
import { Star, ChevronRight } from 'lucide-react';

interface CryptoCardProps {
  data?: CryptoData[];
  loading?: boolean;
  error?: string | null;
}

export function CryptoCard({ data, loading, error }: CryptoCardProps) {
  const dispatch = useAppDispatch();
  const favoriteCryptos = useAppSelector(state => state.favorites.favoriteCryptos);
  
  const handleToggleFavorite = (crypto: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(toggleFavoriteCrypto(crypto));
  };
  
  const getCryptoSymbol = (symbol: string) => {
    switch (symbol.toLowerCase()) {
      case 'btc':
        return '₿';
      case 'eth':
        return 'Ξ';
      case 'ada':
        return 'A';
      default:
        return symbol.charAt(0).toUpperCase();
    }
  };
  
  const getCryptoColor = (symbol: string) => {
    switch (symbol.toLowerCase()) {
      case 'btc':
        return 'bg-amber-100 text-amber-600';
      case 'eth':
        return 'bg-purple-100 text-purple-600';
      case 'ada':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  if (loading) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Cryptocurrency</h3>
            <button 
              onClick={() => window.location.href = '/crypto/bitcoin'}
              className="text-white/80 hover:text-white text-sm flex items-center"
            >
              View All
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
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
        <div className="p-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Cryptocurrency</h3>
          </div>
        </div>
        <div className="p-5 text-center">
          <p className="text-red-500 dark:text-red-400">Error loading crypto data: {error}</p>
          <button className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
            Retry
          </button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Cryptocurrency</h3>
          <button 
            onClick={() => window.location.href = '/crypto/bitcoin'}
            className="text-white/80 hover:text-white text-sm flex items-center"
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {data?.map((crypto) => (
          <div 
            key={crypto.id}
            onClick={() => window.location.href = `/crypto/${encodeURIComponent(crypto.coinId)}`}
            className="block p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full ${getCryptoColor(crypto.symbol)} flex items-center justify-center mr-3`}>
                  <span className="font-bold">{getCryptoSymbol(crypto.symbol)}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                    {crypto.name}
                    <Star
                      className={`h-4 w-4 ml-1 cursor-pointer ${
                        favoriteCryptos.includes(crypto.coinId) ? 'text-amber-400 fill-amber-400' : 'text-gray-400'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation when clicking the star
                        handleToggleFavorite(crypto.coinId, e);
                      }}
                    />
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{crypto.symbol.toUpperCase()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`text-sm font-medium ${crypto.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {crypto.priceChange24h >= 0 ? '+' : ''}{crypto.priceChange24h.toFixed(2)}% (24h)
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
