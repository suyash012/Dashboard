import { store } from './redux/store';
import { addNotification } from './redux/slices/notificationsSlice';
import { updateCryptoPrice } from './redux/slices/cryptoSlice';
import { addWeatherAlert } from './redux/slices/weatherSlice';

interface WebSocketMessage {
  type: 'price_alert' | 'weather_alert';
  data: any;
}

export function setupWebSocketConnection() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  let socket: WebSocket | null = null;
  let reconnectTimeout: number | null = null;
  let isManualClose = false;
  
  // Function to create a new socket connection
  const connect = () => {
    // If we have an existing reconnect timeout, clear it
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    // Create a new WebSocket connection
    socket = new WebSocket(wsUrl);
    
    socket.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    socket.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        console.log('Received WebSocket message:', message);
        
        // Handle different message types
        switch (message.type) {
          case 'price_alert':
            handlePriceAlert(message.data);
            break;
          case 'weather_alert':
            handleWeatherAlert(message.data);
            break;
          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    socket.onclose = (event) => {
      console.log(`WebSocket connection closed (${event.code}): ${event.reason}`);
      
      // Only attempt to reconnect if it wasn't manually closed
      if (!isManualClose) {
        console.log('Attempting to reconnect in 3 seconds...');
        reconnectTimeout = window.setTimeout(connect, 3000);
      }
    };
  };
  
  // Initial connection
  connect();
  
  // Dispatching a test notification for verification
  setTimeout(() => {
    console.log('Dispatching test notification');
    store.dispatch(
      addNotification({
        type: 'price_alert',
        message: 'Test notification: Connection to real-time updates is active',
      })
    );
  }, 3000);
  
  // Return a cleanup function
  return () => {
    isManualClose = true;
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  };
}

function handlePriceAlert(data: { id: string; name: string; price: number; change: number }) {
  const { id, name, price, change } = data;
  
  console.log(`Received price update for ${name}: ${price} (${change.toFixed(2)}%)`);
  
  // Update crypto price in store using coinId (id from the message)
  store.dispatch(updateCryptoPrice({ id, price }));
  
  // Add notification for all price changes during testing
  // Lowered threshold to catch more updates
  if (Math.abs(change) > 0.01) {
    const direction = change > 0 ? 'increased' : 'decreased';
    const message = `${name} price just ${direction} by ${Math.abs(change).toFixed(2)}%`;
    console.log(`Creating notification: ${message}`);
    
    store.dispatch(
      addNotification({
        type: 'price_alert',
        message,
      })
    );
  }
}

function handleWeatherAlert(data: { city: string; alert: string; condition: string; temp: number; humidity: number }) {
  const { city, alert, condition, temp, humidity } = data;
  
  console.log(`Received weather alert for ${city}: ${alert}`);
  
  // Update weather data in store
  store.dispatch(
    addWeatherAlert({
      city,
      country: '', // This will be filled in by the backend
      condition,
      temp,
      humidity,
      icon: '', // This will be filled in by the backend
      timestamp: Date.now(),
    })
  );
  
  // Add notification for weather alert
  console.log(`Creating weather notification for ${city}`);
  store.dispatch(
    addNotification({
      type: 'weather_alert',
      message: `${city}: ${alert}`,
    })
  );
}
