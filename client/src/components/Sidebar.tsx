import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { CloudLightning, CloudIcon, NewspaperIcon, HomeIcon, SunIcon, MoonIcon } from 'lucide-react';
import { UserMenu } from '@/components/ui/user-menu';

interface SidebarProps {
  isMobile?: boolean;
}

export default function Sidebar({ isMobile = false }: SidebarProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check local storage for dark mode preference
    const storedDarkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(storedDarkMode);
    
    // Apply dark mode class to html element
    document.documentElement.classList.toggle('dark', storedDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  if (isMobile && !sidebarOpen) {
    return (
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden text-gray-600 dark:text-gray-300 fixed top-4 left-4 z-30"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    );
  }

  return (
    <>
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-30 w-64 transform overflow-y-auto bg-white dark:bg-gray-800 transition-all duration-300 lg:static lg:translate-x-0 lg:w-20 xl:w-64 flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-5 lg:justify-center xl:justify-between">
          <div className="flex items-center space-x-2">
            <CloudLightning className="h-8 w-8 text-primary" />
            <span className="text-lg font-bold xl:inline hidden">CryptoWeather</span>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 px-2 py-4 space-y-2">
          <Link href="/">
            <a className={`flex items-center px-4 py-3 rounded-lg ${location === '/' ? 'text-primary bg-blue-50 dark:bg-blue-900/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <HomeIcon className="h-6 w-6" />
              <span className="ml-3 xl:inline hidden">Dashboard</span>
            </a>
          </Link>
          
          <Link href="/weather/New%20York">
            <a className={`flex items-center px-4 py-3 rounded-lg ${location.startsWith('/weather') ? 'text-primary bg-blue-50 dark:bg-blue-900/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <CloudIcon className="h-6 w-6" />
              <span className="ml-3 xl:inline hidden">Weather</span>
            </a>
          </Link>
          
          <Link href="/crypto/bitcoin">
            <a className={`flex items-center px-4 py-3 rounded-lg ${location.startsWith('/crypto') ? 'text-primary bg-blue-50 dark:bg-blue-900/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="ml-3 xl:inline hidden">Crypto</span>
            </a>
          </Link>
          
          <a href="#news-section" className="flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <NewspaperIcon className="h-6 w-6" />
            <span className="ml-3 xl:inline hidden">News</span>
          </a>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg w-full"
          >
            {isDarkMode ? (
              <SunIcon className="h-6 w-6" />
            ) : (
              <MoonIcon className="h-6 w-6" />
            )}
            <span className="ml-3 xl:inline hidden">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          
          <div className="flex items-center px-4 py-2">
            <div className="xl:inline hidden mr-3 text-sm text-gray-600 dark:text-gray-300">Account</div>
            <UserMenu />
          </div>
        </div>
      </div>
    </>
  );
}
