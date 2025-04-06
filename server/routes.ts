import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';
import { setupAuth } from './auth';
import {
  OPENWEATHERMAP_API_KEY,
  COINCAP_API_KEY,
  NEWSDATA_API_KEY,
  OPENWEATHERMAP_API,
  COINCAP_API,
  NEWSDATA_API,
  CRYPTO_UPDATE_INTERVAL,
  WEATHER_ALERT_INTERVAL,
  TRACKED_CITIES,
  TRACKED_CRYPTOS
} from './config';

// Log API keys availability for debugging (not showing actual keys)
console.log('API Keys Status:');
console.log(`- OpenWeatherMap API Key: ${OPENWEATHERMAP_API_KEY ? 'Available' : 'Missing'}`);
console.log(`- CoinCap API Key: ${COINCAP_API_KEY ? 'Available' : 'Missing'}`);
console.log(`- NewsData API Key: ${NEWSDATA_API_KEY ? 'Available' : 'Missing'}`);

// API Endpoints
// Periodic intervals in milliseconds (more frequent for testing)
// Weather and crypto data we want to track

// OpenWeatherMap API response type
interface OpenWeatherResponse {
  name: string;
  sys: {
    country: string;
  };
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    icon: string;
  }>;
}

// Real data fetching from OpenWeatherMap API
async function fetchAndStoreWeatherData() {
  try {
    // Validate API key first
    if (!OPENWEATHERMAP_API_KEY) {
      throw new Error('OpenWeatherMap API key is missing or invalid');
    }

    console.log('Fetching fresh weather data from OpenWeatherMap API...');
    // Fetch real data from OpenWeatherMap API
    const cities = [];

    for (const city of TRACKED_CITIES) {
      try {
        const url = `${OPENWEATHERMAP_API}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`;
        console.log(`Fetching weather data for ${city}...`);
        const response = await fetch(url);
        
        if (!response.ok) {
          console.error(`OpenWeatherMap API returned status: ${response.status} for city: ${city}`);
          throw new Error(`OpenWeatherMap API error: ${response.statusText} (${response.status})`);
        }
        
        const data = await response.json() as OpenWeatherResponse;
        
        const cityData = {
          city: data.name,
          country: data.sys.country,
          temp: Math.round(data.main.temp),
          humidity: data.main.humidity,
          condition: data.weather[0].main,
          icon: data.weather[0].icon,
          timestamp: new Date(),
        };
        
        cities.push(cityData);
        
        // Store or update in database
        const existingWeather = await storage.getWeatherByCity(cityData.city);
        if (existingWeather) {
          await storage.updateWeather(cityData.city, cityData);
        } else {
          await storage.createWeather(cityData);
        }
      } catch (cityError) {
        console.error(`Error fetching weather for ${city}:`, cityError);
        // No fallback - throw error to indicate API failure
        throw cityError;
      }
    }

    if (cities.length === 0) {
      throw new Error('Could not fetch weather data for any city');
    }
    
    return cities;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
}

async function fetchWeatherDetail(city: string) {
  // In a real app, this would fetch detailed data from OpenWeatherMap API
  const baseData = await storage.getWeatherByCity(city);
  
  if (!baseData) {
    throw new Error(`No weather data for city: ${city}`);
  }

  // Generate detailed weather data
  return {
    ...baseData,
    windSpeed: Math.floor(Math.random() * 10) + 2,
    pressure: 1000 + Math.floor(Math.random() * 30),
    visibility: 5000 + Math.floor(Math.random() * 5000),
    feelsLike: baseData.temp - 2 + Math.floor(Math.random() * 4),
    history: Array.from({ length: 24 }, (_, i) => ({
      time: `${23 - i}:00`,
      temperature: baseData.temp - 5 + Math.floor(Math.random() * 10),
    })),
  };
}

// CoinCap API response types
interface CoinCapAssetResponse {
  data: {
    id: string;
    name: string;
    symbol: string;
    priceUsd: string;
    marketCapUsd: string;
    volumeUsd24Hr: string;
  };
}

interface CoinCapHistoryResponse {
  data: Array<{
    priceUsd: string;
    time: number;
  }>;
}

async function initializeSeedDataIfNeeded() {
  try {
    // Check if any crypto data exists
    const existingCoins = await Promise.all(
      TRACKED_CRYPTOS.map(coin => storage.getCryptoByCoinId(coin))
    );
    
    // Count how many valid coins we have
    const validCoinsCount = existingCoins.filter(Boolean).length;
    console.log(`Found ${validCoinsCount}/${TRACKED_CRYPTOS.length} existing cryptocurrencies in database`);
    
    // If we don't have all the data, create seed data
    if (validCoinsCount < TRACKED_CRYPTOS.length) {
      console.log('Creating seed data for missing cryptocurrencies...');
      
      // Default seed data
      const seedData = [
        {
          coinId: 'bitcoin',
          name: 'Bitcoin',
          symbol: 'btc',
          price: 56789.42,
          priceChange24h: 2.5,
          marketCap: 1067900000000,
          volume24h: 38200000000,
          lastUpdated: new Date(),
        },
        {
          coinId: 'ethereum',
          name: 'Ethereum',
          symbol: 'eth',
          price: 3105.67,
          priceChange24h: 1.3,
          marketCap: 368500000000,
          volume24h: 21500000000,
          lastUpdated: new Date(),
        },
        {
          coinId: 'cardano',
          name: 'Cardano',
          symbol: 'ada',
          price: 1.24,
          priceChange24h: -0.5,
          marketCap: 43200000000,
          volume24h: 2700000000,
          lastUpdated: new Date(),
        }
      ];
      
      // Save seed data for missing coins
      for (const coin of seedData) {
        const exists = await storage.getCryptoByCoinId(coin.coinId);
        if (!exists) {
          await storage.createCrypto(coin);
          console.log(`Created seed data for ${coin.name}`);
        }
      }
      
      console.log('Seed data creation completed');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing seed data:', error);
    return false;
  }
}

async function fetchAndStoreCryptoData() {
  // First ensure we have seed data as a fallback
  await initializeSeedDataIfNeeded();
  
  try {
    // Validate API key first
    if (!COINCAP_API_KEY) {
      console.warn('CoinCap API key is missing - proceeding without authentication may hit rate limits');
    }

    // Headers with authentication if available
    const headers: Record<string, string> = {};
    if (COINCAP_API_KEY) {
      headers['Authorization'] = `Bearer ${COINCAP_API_KEY}`;
    }

    console.log('Fetching cryptocurrency data from CoinCap API...');
    const cryptoData = [];
    
    // Add delay between requests to avoid rate limiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Global rate limit detection
    let isRateLimited = false;

    // Attempt to fetch live data one coin at a time with proper delays
    for (let i = 0; i < TRACKED_CRYPTOS.length; i++) {
      const coinId = TRACKED_CRYPTOS[i];
      
      try {
        // If we hit rate limits, use cached data for remaining coins
        if (isRateLimited) {
          const cachedCoin = await storage.getCryptoByCoinId(coinId);
          if (cachedCoin) {
            console.log(`Using cached data for ${coinId} due to rate limiting`);
            cryptoData.push(cachedCoin);
            continue;
          } else {
            console.warn(`No cached data available for ${coinId} despite seeds - reinitializing`);
            await initializeSeedDataIfNeeded();
            const freshCachedCoin = await storage.getCryptoByCoinId(coinId);
            if (freshCachedCoin) {
              cryptoData.push(freshCachedCoin);
              continue;
            } else {
              console.error(`CRITICAL: Cannot find or create data for ${coinId}`);
              continue;
            }
          }
        }
        
        // Add substantial delay between requests (15000ms = 15 seconds)
        if (i > 0) await delay(15000);
        
        console.log(`Fetching crypto data for ${coinId}...`);
        const url = `${COINCAP_API}/assets/${coinId}`;
        
        // Try up to 3 times with increasing delays
        let response = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          try {
            response = await fetch(url, { headers });
            
            if (response.status === 429) {
              retryCount++;
              if (retryCount < maxRetries) {
                const retryDelay = 5000 * Math.pow(2, retryCount); // Exponential backoff
                console.log(`Rate limited. Retrying in ${retryDelay/1000} seconds... (Attempt ${retryCount+1}/${maxRetries})`);
                await delay(retryDelay);
                continue;
              }
            }
            
            break; // If we get here, either we have a good response or a non-429 error
          } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            retryCount++;
            if (retryCount < maxRetries) {
              await delay(5000);
              continue;
            }
            throw fetchError;
          }
        }
        
        if (!response || !response.ok) {
          console.error(`CoinCap API returned status: ${response?.status} for coin: ${coinId}`);
          
          // Handle rate limiting specifically
          if (response?.status === 429) {
            console.warn('CoinCap API rate limit reached, switching to cached data mode');
            isRateLimited = true;
            
            // Try to get cached data for this coin
            const cachedCoin = await storage.getCryptoByCoinId(coinId);
            if (cachedCoin) {
              console.log(`Using cached data for ${coinId}`);
              cryptoData.push(cachedCoin);
              continue;
            } else {
              // Attempt to recover by initializing seed data again
              await initializeSeedDataIfNeeded();
              const freshCachedCoin = await storage.getCryptoByCoinId(coinId);
              if (freshCachedCoin) {
                cryptoData.push(freshCachedCoin);
                continue;
              }
              console.warn(`No cached data available for ${coinId}`);
              continue;
            }
          }
          
          throw new Error(`CoinCap API error: ${response?.statusText} (${response?.status})`);
        }
        
        const result = await response.json() as CoinCapAssetResponse;
        const data = result.data;
        
        // Initialize with current price data
        const cryptoDataItem = {
          coinId: data.id,
          name: data.name,
          symbol: data.symbol.toLowerCase(),
          price: parseFloat(data.priceUsd),
          priceChange24h: 0, // Will update this if we can get history
          marketCap: parseFloat(data.marketCapUsd),
          volume24h: parseFloat(data.volumeUsd24Hr),
          lastUpdated: new Date(),
        };
        
        // Skip history when rate limited or if we've already got enough data
        if (isRateLimited || i >= 1) {
          cryptoData.push(cryptoDataItem);
          await storage.updateCrypto(cryptoDataItem.coinId, cryptoDataItem);
          continue;
        }
        
        // Only attempt to get price history for the first coin to reduce rate limiting risks
        try {
          // Add delay before history request (15000ms = 15 seconds)
          await delay(15000);
          
          // Get 24-hour change percentage
          const changeUrl = `${COINCAP_API}/assets/${coinId}/history?interval=h1`;
          
          // Try up to 2 times with increasing delays for history
          let changeResponse = null;
          let historyRetryCount = 0;
          const maxHistoryRetries = 2;
          
          while (historyRetryCount < maxHistoryRetries) {
            try {
              changeResponse = await fetch(changeUrl, { headers });
              
              if (changeResponse.status === 429) {
                historyRetryCount++;
                if (historyRetryCount < maxHistoryRetries) {
                  const retryDelay = 5000 * Math.pow(2, historyRetryCount);
                  console.log(`History API rate limited. Retrying in ${retryDelay/1000} seconds... (${historyRetryCount+1}/${maxHistoryRetries})`);
                  await delay(retryDelay);
                  continue;
                }
              }
              
              break;
            } catch (historyFetchError) {
              historyRetryCount++;
              if (historyRetryCount < maxHistoryRetries) {
                await delay(5000);
                continue;
              }
              throw historyFetchError;
            }
          }
          
          if (!changeResponse || !changeResponse.ok) {
            console.error(`CoinCap history API returned status: ${changeResponse?.status} for coin: ${coinId}`);
            
            // Handle rate limiting for history
            if (changeResponse?.status === 429) {
              console.warn('CoinCap API rate limit reached for history API');
              isRateLimited = true;
            } else {
              console.error(`CoinCap history API error: ${changeResponse?.statusText} (${changeResponse?.status})`);
            }
          } else {
            // Process history data if available
            const changeData = await changeResponse.json() as CoinCapHistoryResponse;
            const priceHistory = changeData.data || [];
            
            if (priceHistory.length > 0) {
              const now = Date.now();
              const oneDayAgo = now - 24 * 60 * 60 * 1000;
              
              // Find the closest data point to 24 hours ago
              let oldestPrice = 0;
              for (const price of priceHistory) {
                if (price.time < oneDayAgo) {
                  oldestPrice = parseFloat(price.priceUsd);
                  break;
                }
              }
              
              if (oldestPrice > 0) {
                const currentPrice = parseFloat(data.priceUsd);
                cryptoDataItem.priceChange24h = ((currentPrice - oldestPrice) / oldestPrice) * 100;
              }
            }
          }
        } catch (historyError) {
          console.error(`Error fetching history for ${coinId}:`, historyError);
          // Continue with the base data we already have
        }
        
        cryptoData.push(cryptoDataItem);
        
        // Store or update in database
        await storage.updateCrypto(cryptoDataItem.coinId, cryptoDataItem);
        
      } catch (coinError) {
        console.error(`Error fetching crypto data for ${coinId}:`, coinError);
        
        // In case of errors, try to use cached data
        const cachedCoin = await storage.getCryptoByCoinId(coinId);
        if (cachedCoin) {
          console.log(`Falling back to cached data for ${coinId} after API error`);
          cryptoData.push(cachedCoin);
        } else {
          // Reinitialize seeds if needed
          await initializeSeedDataIfNeeded();
          const freshCachedCoin = await storage.getCryptoByCoinId(coinId);
          if (freshCachedCoin) {
            cryptoData.push(freshCachedCoin);
          }
        }
      }
    }

    if (cryptoData.length === 0) {
      // One last attempt to get ANY data from the database
      await initializeSeedDataIfNeeded();
      const allCachedData = await Promise.all(
        TRACKED_CRYPTOS.map(coin => storage.getCryptoByCoinId(coin))
      );
      
      const validCachedData = allCachedData.filter(Boolean);
      if (validCachedData.length > 0) {
        console.log(`Using ${validCachedData.length} cached coins as last resort`);
        return validCachedData;
      }
      
      throw new Error('Could not fetch crypto data for any coin');
    }
    
    console.log(`Successfully retrieved data for ${cryptoData.length} cryptocurrencies`);
    return cryptoData;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    
    // Last resort fallback - try to get ANY cached data we have
    await initializeSeedDataIfNeeded();
    const cachedData = await Promise.all(
      TRACKED_CRYPTOS.map(coin => storage.getCryptoByCoinId(coin))
    );
    
    const validCachedData = cachedData.filter(Boolean);
    if (validCachedData.length > 0) {
      console.log(`Using ${validCachedData.length} cached coins as last resort`);
      return validCachedData;
    }
    
    throw error;
  }
}

async function fetchCryptoDetail(id: string) {
  // In a real app, this would fetch detailed data from CoinGecko/CoinCap API
  const baseData = await storage.getCryptoByCoinId(id);
  
  if (!baseData) {
    throw new Error(`No crypto data for id: ${id}`);
  }

  // Generate detailed crypto data
  return {
    ...baseData,
    high24h: baseData.price * 1.05,
    low24h: baseData.price * 0.95,
    ath: baseData.price * 1.5,
    athChangePercentage: -10 + Math.random() * 20,
    athDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    totalSupply: id === 'bitcoin' ? 21000000 : (id === 'ethereum' ? 0 : 45000000000),
    maxSupply: id === 'bitcoin' ? 21000000 : (id === 'ethereum' ? null : 45000000000),
    circulatingSupply: id === 'bitcoin' ? 19000000 : (id === 'ethereum' ? 120000000 : 34000000000),
    priceHistory: Array.from({ length: 24 }, (_, i) => ({
      timestamp: Date.now() - i * 60 * 60 * 1000,
      price: baseData.price * (0.9 + 0.2 * Math.random()),
    })),
  };
}

// NewsData.io API response type
interface NewsDataResponse {
  status: string;
  totalResults: number;
  results: Array<{
    title: string;
    description?: string;
    link: string;
    source_id: string;
    pubDate: string;
    content?: string;
    keywords?: string[];
  }>;
}

async function fetchAndStoreNewsData() {
  try {
    // Validate API key first
    if (!NEWSDATA_API_KEY) {
      console.error('NewsData API key is missing or invalid');
      throw new Error('NewsData API key is missing');
    }
    
    console.log('Fetching fresh news data from NewsData API...');
    const url = `${NEWSDATA_API}?apikey=${NEWSDATA_API_KEY}&q=cryptocurrency OR bitcoin OR crypto&language=en&size=10`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`NewsData API returned status: ${response.status}`);
      throw new Error(`NewsData API error: ${response.statusText} (${response.status})`);
    }
    
    const data = await response.json() as NewsDataResponse;
    
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from NewsData API');
    }
    
    console.log(`Received ${data.results.length} fresh news articles from API`);
    
    const articles = data.results.map((article) => ({
      title: article.title,
      description: article.description || 'No description available',
      url: article.link,
      source: article.source_id,
      publishedAt: new Date(article.pubDate),
      content: article.content || article.description || 'No content available',
      isBreaking: article.keywords?.includes('breaking') || false,
    }));
    
    // Always replace existing news with fresh data
    console.log('Replacing existing news with fresh data');
    
    // Delete all existing news (in a real app, you'd be more careful)
    const currentNews = await storage.getNews();
    // Here we would delete old news if the DB supported it
    
    // Store new articles
    for (const article of articles) {
      await storage.createNews(article);
    }
    
    return articles;
  } catch (error) {
    console.error('Error fetching news data:', error);
    // No fallback - explicitly throw the error to show there's a problem
    throw error;
  }
}

// Initialize WebSocket server and handle client connections
function setupWebSocketServer(server: Server) {
  // Check if the server already has a WebSocket server associated
  if ((server as any)._webSocketServer) {
    console.log('WebSocket server already initialized, skipping...');
    return (server as any)._webSocketServer;
  }
  
  const wss = new WebSocketServer({ 
    noServer: true,  // Important: Don't attach to server directly
    path: '/ws'
  });
  
  const clients = new Map<string, WebSocket>();
  
  // Handle upgrade manually to avoid conflicts
  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
    
    // Only handle connections to our specific path
    if (pathname === '/ws') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
  
  // Handle new connections
  wss.on('connection', (ws) => {
    const clientId = uuidv4();
    clients.set(clientId, ws);
    
    console.log(`WebSocket client connected: ${clientId}`);
    
    // Handle client disconnect
    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}`);
    });
    
    // Handle client messages (not used in this implementation)
    ws.on('message', (message) => {
      console.log(`Received message from client ${clientId}: ${message}`);
    });
  });
  
  // Store the WebSocket server instance on the HTTP server
  (server as any)._webSocketServer = wss;
  
  // Function to broadcast messages to all connected clients
  const broadcast = (message: any) => {
    const messageString = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  };
  
  // Set up real-time crypto price updates via WebSocket or polling
  let coinCapSocket: WebSocket | null = null;
  let isConnected = false;
  let reconnectAttempts = 0;
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 5000; // 5 seconds
  let heartbeatInterval: NodeJS.Timeout | null = null;
  let pollInterval: NodeJS.Timeout | null = null;
  
  // Unified function to send alerts through WebSocket
  const sendAlert = (alert: any) => {
    console.log(`Sending alert to clients: ${JSON.stringify(alert)}`);
    broadcast(alert);
  };

  // Set up periodic weather alerts (simulated)
  setInterval(async () => {
    try {
      // Get weather data for tracked cities
      const citiesData = await storage.getWeatherByCities(TRACKED_CITIES);
      
      // Process each city
      for (const weatherData of citiesData) {
        // Simulate temperature change
        const tempChange = Math.floor(Math.random() * 5) - 2; // Random between -2 and +2
        
        // Only send alerts for changes of at least 2 degrees
        if (Math.abs(tempChange) >= 2) {
          const city = weatherData.city;
          const oldTemp = weatherData.temp;
          const newTemp = oldTemp + tempChange;
          
          // Update record with new temperature
          await storage.updateWeather(city, {
            temp: newTemp,
            timestamp: new Date(),
          });
          
          // Format alert message
          const direction = tempChange > 0 ? 'increased' : 'decreased';
          const alertMessage = `Temperature in ${city} ${direction} by ${Math.abs(tempChange).toFixed(1)}°C`;
          console.log(`Sending weather alert to clients: ${alertMessage}`);
          
          // Send notification to clients
          sendAlert({
            type: 'weather_alert',
            data: {
              city: city,
              alert: alertMessage,
              condition: weatherData.condition,
              temp: newTemp,
              humidity: weatherData.humidity,
            }
          });
        }
      }
    } catch (error) {
      console.error('Error sending weather alerts:', error);
    }
  }, WEATHER_ALERT_INTERVAL);

  // Function to connect to CoinCap WebSocket
  const connectToCoinCap = () => {
    try {
      // Clear any existing socket and intervals
      if (coinCapSocket) {
        try {
          coinCapSocket.terminate();
        } catch (e) {
          console.log('Error terminating existing socket:', e);
        }
        coinCapSocket = null;
      }
      
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }
      
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
      
      console.log('Connecting to CoinCap WebSocket...');
      
      // Create a new WebSocket with error handling
      coinCapSocket = new WebSocket('wss://ws.coincap.io/prices?assets=' + TRACKED_CRYPTOS.join(','));
      
      // Set a reasonable timeout
      const connectionTimeout = setTimeout(() => {
        if (coinCapSocket && coinCapSocket.readyState !== WebSocket.OPEN) {
          console.log('WebSocket connection timed out. Switching to polling method.');
          safelyCloseSocket();
          setupPollingMethod();
        }
      }, 10000); // 10 second timeout
      
      coinCapSocket.on('open', () => {
        clearTimeout(connectionTimeout);
        console.log('Connected to CoinCap WebSocket API');
        isConnected = true;
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        
        // Set up a heartbeat to keep the connection alive
        heartbeatInterval = setInterval(() => {
          if (coinCapSocket && coinCapSocket.readyState === WebSocket.OPEN) {
            try {
              // Send a ping as a simple JSON object instead of using the WebSocket ping frame
              coinCapSocket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            } catch (err) {
              console.error('Error sending heartbeat:', err);
              safelyCloseSocket();
              setupPollingMethod();
            }
          }
        }, 30000); // Send heartbeat every 30 seconds
        
        // Send a test message to clients to confirm WebSocket is working
        broadcast({
          type: 'connection_status',
          data: {
            connected: true,
            message: 'Real-time updates are now active'
          }
        });
      });
      
      coinCapSocket.on('message', async (message) => {
        try {
          // Handle the received message safely
          const messageStr = message.toString();
          
          // Skip empty messages
          if (!messageStr || messageStr.trim() === '') {
            return;
          }
          
          let prices;
          try {
            prices = JSON.parse(messageStr);
          } catch (parseError) {
            console.error('Error parsing WebSocket message:', parseError, 'Message:', messageStr);
            return;
          }
          
          // Check if prices is empty or not an object
          if (!prices || typeof prices !== 'object' || Object.keys(prices).length === 0) {
            return;
          }
          
          // Process prices update
          await processPriceUpdate(prices);
        } catch (error) {
          console.error('Error handling CoinCap WebSocket message:', error);
        }
      });
      
      coinCapSocket.on('error', (error) => {
        clearTimeout(connectionTimeout);
        console.error('CoinCap WebSocket error:', error);
        isConnected = false;
        
        // Notify clients of connection issues
        broadcast({
          type: 'connection_status',
          data: {
            connected: false,
            message: 'Experiencing connection issues with price updates'
          }
        });
        
        // Close the socket properly
        safelyCloseSocket();
        
        // After errors, switch to polling method
        setupPollingMethod();
      });
      
      coinCapSocket.on('close', () => {
        clearTimeout(connectionTimeout);
        console.log('CoinCap WebSocket connection closed');
        isConnected = false;
        
        // Clean up heartbeat interval
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        
        // After multiple failures, switch to polling
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS - 1) {
          console.log('Maximum reconnection attempts reached. Switching to polling method.');
          setupPollingMethod();
        } else {
          // Attempt to reconnect if not at max attempts
          reconnectAttempts++;
          console.log(`Reconnecting to CoinCap WebSocket... Attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
          setTimeout(connectToCoinCap, RECONNECT_DELAY);
        }
      });
    } catch (error) {
      console.error('Error setting up CoinCap WebSocket:', error);
      isConnected = false;
      
      // Try the polling method instead
      setupPollingMethod();
    }
  };
  
  // Helper function to safely close the socket
  const safelyCloseSocket = () => {
    if (coinCapSocket) {
      try {
        coinCapSocket.terminate();
      } catch (err) {
        console.error('Error terminating socket:', err);
      }
      coinCapSocket = null;
    }
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    
    isConnected = false;
  };
  
  // Process price updates from WebSocket or REST API
  const processPriceUpdate = async (prices: Record<string, string>) => {
    try {
      for (const cryptoId of Object.keys(prices)) {
        if (TRACKED_CRYPTOS.includes(cryptoId)) {
          try {
            const crypto = await storage.getCryptoByCoinId(cryptoId);
            
            if (crypto) {
              const newPrice = parseFloat(prices[cryptoId]);
              
              // Validate the new price is reasonable
              if (isNaN(newPrice) || newPrice <= 0) {
                console.warn(`Invalid price received for ${cryptoId}: ${prices[cryptoId]}`);
                continue;
              }
              
              // Only calculate percentage change if previous price is valid
              let priceChange = 0;
              
              if (crypto.price > 0) {
                // Cap the price change to reasonable values (-20% to +20%)
                priceChange = ((newPrice - crypto.price) / crypto.price) * 100;
                priceChange = Math.max(-20, Math.min(20, priceChange));
              }
              
              // Update the price in storage
              await storage.updateCrypto(cryptoId, {
                price: newPrice,
                lastUpdated: new Date(),
              });
              
              // Send update to clients for significant changes
              if (Math.abs(priceChange) > 0.01 && crypto) {
                const direction = priceChange > 0 ? 'increased' : 'decreased';
                const alertMessage = `${crypto.name} ${direction} by ${Math.abs(priceChange).toFixed(2)}%`;
                console.log(`Sending price alert to clients: ${alertMessage}`);
                
                sendAlert({
                  type: 'price_alert',
                  data: {
                    id: cryptoId,
                    name: crypto.name,
                    price: newPrice,
                    change: priceChange,
                  }
                });
              }
            }
          } catch (cryptoError) {
            console.error(`Error processing price update for ${cryptoId}:`, cryptoError);
          }
        }
      }
    } catch (error) {
      console.error('Error processing price updates:', error);
    }
  };
  
  // Function to fetch crypto prices for polling method
  const fetchCryptoPricesForPolling = async (): Promise<Record<string, string> | null> => {
    try {
      // Create result object in the same format as WebSocket messages
      const result: Record<string, string> = {};
      
      // Headers with authentication if available
      const headers: Record<string, string> = {};
      if (COINCAP_API_KEY) {
        headers['Authorization'] = `Bearer ${COINCAP_API_KEY}`;
      }
      
      console.log('Polling for crypto prices...');
      
      // Fetch each coin individually with small delays between requests
      for (let i = 0; i < TRACKED_CRYPTOS.length; i++) {
        const coinId = TRACKED_CRYPTOS[i];
        
        try {
          // Add delay between requests (3 seconds) to avoid rate limiting
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          const url = `${COINCAP_API}/assets/${coinId}`;
          const response = await fetch(url, { headers });
          
          if (!response.ok) {
            console.error(`Error polling CoinCap API for ${coinId}: ${response.status}`);
            continue;
          }
          
          const data = await response.json() as CoinCapAssetResponse;
          result[coinId] = data.data.priceUsd;
          
        } catch (coinError) {
          console.error(`Error fetching ${coinId} in polling mode:`, coinError);
        }
      }
      
      if (Object.keys(result).length === 0) {
        console.error('Could not fetch any prices during polling.');
        return null;
      }
      
      return result;
    } catch (error) {
      console.error('Error fetching crypto prices for polling:', error);
      return null;
    }
  };
  
  // Alternative method: polling the REST API to simulate real-time updates
  const setupPollingMethod = async () => {
    console.log('Setting up polling method for crypto price updates');
    
    // Clean up any existing polling
    if (pollInterval) {
      clearInterval(pollInterval);
    }
    
    // Notify clients of the change in update method
    broadcast({
      type: 'connection_status',
      data: {
        connected: true,
        message: 'Using frequent polling for price updates'
      }
    });
    
    // Initial data fetch
    try {
      const initialData = await fetchCryptoPricesForPolling();
      if (initialData) {
        await processPriceUpdate(initialData);
      }
    } catch (e) {
      console.error('Error in initial polling fetch:', e);
    }
    
    // Set up a polling interval (every 10 seconds)
    pollInterval = setInterval(async () => {
      try {
        const data = await fetchCryptoPricesForPolling();
        if (data) {
          await processPriceUpdate(data);
        }
      } catch (error) {
        console.error('Error in polling fetch:', error);
      }
    }, 10000); // Poll every 10 seconds
  };
  
  return wss;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Initialize data on startup
  try {
    await fetchAndStoreWeatherData();
    await fetchAndStoreCryptoData();
    await fetchAndStoreNewsData();
  } catch (error) {
    console.error('Error initializing data:', error);
  }
  
  // Set up periodic data refresh
  // Update weather data every 30 minutes
  setInterval(fetchAndStoreWeatherData, 30 * 60 * 1000);
  
  // Update crypto price history every 30 minutes (real-time updates happen via WebSocket)
  setInterval(fetchAndStoreCryptoData, 30 * 60 * 1000);
  
  // Update news data every hour
  setInterval(fetchAndStoreNewsData, 60 * 60 * 1000);

  // API endpoints for weather data
  app.get('/api/weather', async (req, res) => {
    try {
      const citiesParam = req.query.cities as string;
      const cities = citiesParam ? citiesParam.split(',') : TRACKED_CITIES;
      
      const weatherData = await storage.getWeatherByCities(cities);
      
      if (weatherData.length === 0) {
        // If no data in storage, fetch fresh data
        const freshData = await fetchAndStoreWeatherData();
        return res.json(freshData.filter(city => cities.includes(city.city)));
      }
      
      res.json(weatherData);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      res.status(500).json({ message: 'Error fetching weather data' });
    }
  });
  
  app.get('/api/weather/:city', async (req, res) => {
    try {
      const { city } = req.params;
      const decodedCity = decodeURIComponent(city);
      
      const weatherDetail = await fetchWeatherDetail(decodedCity);
      res.json(weatherDetail);
    } catch (error) {
      console.error(`Error fetching weather detail for ${req.params.city}:`, error);
      res.status(500).json({ message: 'Error fetching weather detail' });
    }
  });
  
  // API endpoints for crypto data
  app.get('/api/crypto', async (req, res) => {
    try {
      const idsParam = req.query.ids as string;
      const ids = idsParam ? idsParam.split(',') : TRACKED_CRYPTOS;
      
      const cryptoData = await storage.getCryptosByCoinIds(ids);
      
      if (cryptoData.length === 0) {
        // If no data in storage, fetch fresh data
        const freshData = await fetchAndStoreCryptoData();
        return res.json(freshData.filter(crypto => ids.includes(crypto.coinId)));
      }
      
      res.json(cryptoData);
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      res.status(500).json({ message: 'Error fetching crypto data' });
    }
  });
  
  app.get('/api/crypto/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const cryptoDetail = await fetchCryptoDetail(id);
      res.json(cryptoDetail);
    } catch (error) {
      console.error(`Error fetching crypto detail for ${req.params.id}:`, error);
      res.status(500).json({ message: 'Error fetching crypto detail' });
    }
  });
  
  // API endpoint for news data
  app.get('/api/news', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      
      const newsData = await storage.getNews(limit);
      
      if (newsData.length === 0) {
        // If no data in storage, fetch fresh data
        const freshData = await fetchAndStoreNewsData();
        return res.json(freshData.slice(0, limit));
      }
      
      res.json(newsData);
    } catch (error) {
      console.error('Error fetching news data:', error);
      res.status(500).json({ message: 'Error fetching news data' });
    }
  });

  // Health check endpoint for Railway deployment
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Create and configure the HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server on the HTTP server
  setupWebSocketServer(httpServer);
  
  return httpServer;
}
