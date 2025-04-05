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
  
  const socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
  };
  
  socket.onmessage = (event) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
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
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
  };
  
  // Return a cleanup function
  return () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  };
}

function handlePriceAlert(data: { id: string; name: string; price: number; change: number }) {
  const { id, name, price, change } = data;
  
  // Update crypto price in store
  store.dispatch(updateCryptoPrice({ id, price }));
  
  // Add notification for significant price changes (e.g., > 1%)
  if (Math.abs(change) > 1) {
    const direction = change > 0 ? 'increased' : 'decreased';
    const message = `${name} price just ${direction} by ${Math.abs(change).toFixed(2)}%`;
    
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
  store.dispatch(
    addNotification({
      type: 'weather_alert',
      message: `${city}: ${alert}`,
    })
  );
}
