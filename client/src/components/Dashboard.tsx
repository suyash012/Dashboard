import { useState } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import { useDataRefresh } from '@/hooks/useDataRefresh';
import { WeatherCard } from './Weather/WeatherCard';
import { CryptoCard } from './Crypto/CryptoCard';
import { NewsCard } from './News/NewsCard';
import { NotificationBell } from './ui/notification-bell';
import { UserMenu } from './ui/user-menu';
import Sidebar from './Sidebar';
import { RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { refreshData, timeUntilRefresh } = useDataRefresh();
  
  const weatherState = useAppSelector(state => state.weather);
  const cryptoState = useAppSelector(state => state.crypto);
  const newsState = useAppSelector(state => state.news);
  
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isMobile={isMobile} />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <header className="flex items-center justify-between px-4 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 lg:px-6">
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="lg:hidden text-gray-600 dark:text-gray-300"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto py-6 px-4 lg:px-8 bg-gray-100 dark:bg-gray-900">
          <div>
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Dashboard Overview</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Real-time updates from across the globe</p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Refreshing in <span>{timeUntilRefresh}</span>s
                </span>
                <button 
                  onClick={refreshData}
                  className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Weather Section */}
              <WeatherCard 
                data={weatherState.cities} 
                loading={weatherState.loading} 
                error={weatherState.error} 
              />

              {/* Cryptocurrency Section */}
              <CryptoCard 
                data={cryptoState.cryptos} 
                loading={cryptoState.loading} 
                error={cryptoState.error} 
              />

              {/* News Section */}
              <NewsCard />

              {/* Live Market Activity */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden md:col-span-2 lg:col-span-3">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Live Market Activity</h3>
                    <div className="flex items-center">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Live Updates</span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Currency</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">24h Change</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Market Cap</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Volume (24h)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {cryptoState.loading ? (
                        Array(3).fill(0).map((_, index) => (
                          <tr key={index} className="animate-pulse">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                                <div>
                                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                  <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </td>
                          </tr>
                        ))
                      ) : cryptoState.error ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-red-500 dark:text-red-400">
                            {cryptoState.error}
                          </td>
                        </tr>
                      ) : (
                        cryptoState.cryptos.map(crypto => (
                          <tr key={crypto.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full ${
                                  crypto.symbol.toLowerCase() === 'btc' ? 'bg-amber-100 text-amber-600' :
                                  crypto.symbol.toLowerCase() === 'eth' ? 'bg-purple-100 text-purple-600' :
                                  'bg-blue-100 text-blue-600'
                                } flex items-center justify-center mr-3`}>
                                  <span className="font-bold">
                                    {crypto.symbol.toLowerCase() === 'btc' ? '₿' :
                                     crypto.symbol.toLowerCase() === 'eth' ? 'Ξ' :
                                     'A'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold text-gray-900 dark:text-white">{crypto.name}</div>
                                  <div className="text-gray-500 dark:text-gray-400 text-sm">{crypto.symbol.toUpperCase()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900 dark:text-white font-medium">
                                ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`font-medium flex items-center ${crypto.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d={crypto.priceChange24h >= 0 ? 
                                      "M5 10l7-7m0 0l7 7m-7-7v18" : 
                                      "M19 14l-7 7m0 0l-7-7m7 7V3"} 
                                  />
                                </svg>
                                {Math.abs(crypto.priceChange24h).toFixed(2)}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900 dark:text-white">
                                ${(crypto.marketCap / 1_000_000_000).toFixed(1)}B
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-gray-900 dark:text-white">
                                ${(crypto.volume24h / 1_000_000_000).toFixed(1)}B
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
