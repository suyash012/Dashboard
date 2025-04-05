import { useState, useEffect } from 'react';
import { Bell, Plus } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks';
import { markAllAsRead, addNotification } from '@/lib/redux/slices/notificationsSlice';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";

export function NotificationBell() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifications = useAppSelector(state => state.notifications.notifications);
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  // Flash notification when new ones arrive
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      if (!latestNotification.read) {
        // Show toast for the newest notification
        toast({
          title: latestNotification.type === 'price_alert' ? 'Price Alert' : 'Weather Alert',
          description: latestNotification.message,
          variant: "default",
        });
      }
    }
  }, [notifications.length, toast]);
  
  // Automatically add a test notification when component mounts
  useEffect(() => {
    const initialNotification = setTimeout(() => {
      dispatch(addNotification({
        type: 'price_alert',
        message: 'Welcome! This is a test notification to show that alerts are working'
      }));
    }, 2000);
    
    return () => clearTimeout(initialNotification);
  }, [dispatch]);

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };
  
  const addTestPriceAlert = () => {
    const message = 'Bitcoin price changed by 3.5%';
    dispatch(addNotification({
      type: 'price_alert',
      message
    }));
    
    toast({
      title: 'Test Price Alert Created',
      description: message,
      variant: "default",
    });
  };
  
  const addTestWeatherAlert = () => {
    const message = 'Severe weather warning for New York';
    dispatch(addNotification({
      type: 'weather_alert',
      message
    }));
    
    toast({
      title: 'Test Weather Alert Created',
      description: message,
      variant: "default",
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-1 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold">
                {unreadNotificationsCount}
              </span>
            )}
          </button>
          
          <div className="flex flex-col">
            <button 
              onClick={addTestPriceAlert}
              className="p-1 rounded-full text-blue-600 hover:bg-blue-100 animate-pulse"
              title="Click to add test price alert"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button 
              onClick={addTestWeatherAlert}
              className="p-1 rounded-full text-amber-600 hover:bg-amber-100 animate-pulse"
              title="Click to add test weather alert"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="text-xs bg-blue-50 text-blue-800 px-2 py-1 rounded-md dark:bg-blue-900/50 dark:text-blue-300">
          Click + to test notifications
        </div>
      </div>

      {notificationsOpen && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 border border-gray-200 dark:border-gray-700"
        >
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadNotificationsCount > 0 && (
              <span className="text-xs bg-red-100 text-red-800 font-medium px-2 py-0.5 rounded-full dark:bg-red-900 dark:text-red-200">
                {unreadNotificationsCount} new
              </span>
            )}
          </div>
          
          <div className="max-h-72 overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {notification.type === 'price_alert' ? (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                          <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.read ? 'font-medium' : ''} text-gray-800 dark:text-gray-200`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(notification.time), 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="px-4 py-2 flex justify-between items-center text-xs border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleMarkAllAsRead}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
              >
                Mark all as read
              </button>
              <span className="text-gray-500 dark:text-gray-400">
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
