import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export function UserMenu() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold">
          U
        </div>
        <span className="hidden md:inline-block text-sm font-medium">User</span>
        <ChevronDown className="h-4 w-4 text-gray-500" />
      </button>

      {userMenuOpen && (
        <div
          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50"
        >
          <a
            href="#"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Profile
          </a>
          <a
            href="#"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Settings
          </a>
          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
          <a
            href="#"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Sign out
          </a>
        </div>
      )}
    </div>
  );
}
