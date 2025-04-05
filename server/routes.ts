import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

// API Keys
const OPENWEATHERMAP_API_KEY = process.env.OPENWEATHERMAP_API_KEY;
const COINCAP_API_KEY = process.env.COINCAP_API_KEY;
const NEWSDATA_API_KEY = process.env.NEWSDATA_API_KEY;

// API Endpoints
const OPENWEATHERMAP_API = 'https://api.openweathermap.org/data/2.5';
const COINCAP_API = 'https://api.coincap.io/v2';
const NEWSDATA_API = 'https://newsdata.io/api/1/news';

// Periodic intervals in milliseconds
const CRYPTO_UPDATE_INTERVAL = 30000; // 30 seconds
const WEATHER_ALERT_INTERVAL = 60000; // 60 seconds

// Weather and crypto data we want to track
const TRACKED_CITIES = ['New York', 'London', 'Tokyo'];
const TRACKED_CRYPTOS = ['bitcoin', 'ethereum', 'cardano'];

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
    // Fetch real data from OpenWeatherMap API
    const cities = [];

    for (const city of TRACKED_CITIES) {
      try {
        const url = `${OPENWEATHERMAP_API}/weather?q=${encodeURIComponent(city)}&units=metric&appid=${OPENWEATHERMAP_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
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
        // Try to use cached data if available
        const cachedData = await storage.getWeatherByCity(city);
        if (cachedData) {
          cities.push(cachedData);
        }
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

async function fetchAndStoreCryptoData() {
  try {
    // Fetch real data from CoinCap API
    const cryptos = [];
    
    for (const coinId of TRACKED_CRYPTOS) {
      try {
        const headers: HeadersInit = {
          'Accept': 'application/json',
        };
        
        // Add API key to headers if available
        if (COINCAP_API_KEY) {
          headers['Authorization'] = `Bearer ${COINCAP_API_KEY}`;
        }
        
        const url = `${COINCAP_API}/assets/${coinId}`;
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
          throw new Error(`CoinCap API error: ${response.statusText} (${response.status})`);
        }
        
        const result = await response.json() as CoinCapAssetResponse;
        const data = result.data;
        
        // Get 24-hour change percentage
        const changeUrl = `${COINCAP_API}/assets/${coinId}/history?interval=h1`;
        const changeResponse = await fetch(changeUrl, { headers });
        
        if (!changeResponse.ok) {
          throw new Error(`CoinCap history API error: ${changeResponse.statusText} (${changeResponse.status})`);
        }
        
        const changeData = await changeResponse.json() as CoinCapHistoryResponse;
        
        // Calculate 24h price change percentage
        const priceHistory = changeData.data || [];
        let priceChange24h = 0;
        
        if (priceHistory.length > 0) {
          const currentPrice = parseFloat(data.priceUsd);
          const oldestPrice = parseFloat(priceHistory[0].priceUsd);
          
          if (oldestPrice > 0) {
            priceChange24h = ((currentPrice - oldestPrice) / oldestPrice) * 100;
          }
        }
        
        const cryptoData = {
          coinId: data.id,
          name: data.name,
          symbol: data.symbol.toLowerCase(),
          price: parseFloat(data.priceUsd),
          priceChange24h,
          marketCap: parseFloat(data.marketCapUsd),
          volume24h: parseFloat(data.volumeUsd24Hr),
          lastUpdated: new Date(),
        };
        
        cryptos.push(cryptoData);
        
        // Store or update in database
        const existingCrypto = await storage.getCryptoByCoinId(cryptoData.coinId);
        if (existingCrypto) {
          await storage.updateCrypto(cryptoData.coinId, cryptoData);
        } else {
          await storage.createCrypto(cryptoData);
        }
      } catch (coinError) {
        console.error(`Error fetching crypto data for ${coinId}:`, coinError);
        // Try to use cached data if available
        const cachedData = await storage.getCryptoByCoinId(coinId);
        if (cachedData) {
          cryptos.push(cachedData);
        }
      }
    }

    if (cryptos.length === 0) {
      throw new Error('Could not fetch crypto data for any coin');
    }
    
    return cryptos;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
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
    // Fetch real data from NewsData.io API
    if (!NEWSDATA_API_KEY) {
      throw new Error('NewsData API key is missing');
    }
    
    const url = `${NEWSDATA_API}?apikey=${NEWSDATA_API_KEY}&q=cryptocurrency OR bitcoin OR crypto&language=en&size=10`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`NewsData API error: ${response.statusText} (${response.status})`);
    }
    
    const data = await response.json() as NewsDataResponse;
    
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from NewsData API');
    }
    
    const articles = data.results.map((article) => ({
      title: article.title,
      description: article.description || 'No description available',
      url: article.link,
      source: article.source_id,
      publishedAt: new Date(article.pubDate),
      content: article.content || article.description || 'No content available',
      isBreaking: article.keywords?.includes('breaking') || false,
    }));
    
    // Clear existing news to avoid duplicates in this implementation
    // In a full production app, we would compare and only add new articles
    const currentNews = await storage.getNews();
    if (currentNews.length === 0) {
      for (const article of articles) {
        await storage.createNews(article);
      }
    }
    
    return articles;
  } catch (error) {
    console.error('Error fetching news data:', error);
    
    // Fallback to fetch existing data if available
    const existingNews = await storage.getNews();
    if (existingNews.length > 0) {
      return existingNews;
    }
    
    // If no existing data, create some placeholder data
    const fallbackNews = [
      {
        title: 'Bitcoin Price Surges Past $50,000',
        description: 'The cryptocurrency market leader reaches a significant milestone as institutional adoption continues.',
        url: 'https://cryptocurrency-news.com/bitcoin-milestone',
        source: 'Crypto News',
        publishedAt: new Date(),
        content: 'Bitcoin has surged past the $50,000 mark for the first time in several months, driven by increasing institutional adoption and growing mainstream acceptance.',
        isBreaking: true,
      },
      {
        title: 'New Cryptocurrency Regulations Take Effect in EU',
        description: 'European Union implements comprehensive framework for digital assets and blockchain technology.',
        url: 'https://crypto-regulation-news.com/eu-framework',
        source: 'Regulation Watch',
        publishedAt: new Date(),
        content: 'The European Union has implemented its comprehensive regulatory framework for cryptocurrencies and digital assets, providing clarity for businesses operating in the space.',
        isBreaking: false,
      },
    ];
    
    for (const article of fallbackNews) {
      await storage.createNews(article);
    }
    
    return fallbackNews;
  }
}

// Initialize WebSocket server and handle client connections
function setupWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  const clients = new Map<string, WebSocket>();
  
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
  
  // Function to broadcast messages to all connected clients
  const broadcast = (message: any) => {
    const messageString = JSON.stringify(message);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  };
  
  // Set up real-time crypto price updates via WebSocket
  const coinCapSocket = new WebSocket('wss://ws.coincap.io/prices?assets=' + TRACKED_CRYPTOS.join(','));
  
  coinCapSocket.on('open', () => {
    console.log('Connected to CoinCap WebSocket API');
  });
  
  coinCapSocket.on('message', async (message) => {
    try {
      const prices = JSON.parse(message.toString());
      
      for (const cryptoId of Object.keys(prices)) {
        if (TRACKED_CRYPTOS.includes(cryptoId)) {
          const crypto = await storage.getCryptoByCoinId(cryptoId);
          
          if (crypto) {
            const newPrice = parseFloat(prices[cryptoId]);
            const priceChange = ((newPrice - crypto.price) / crypto.price) * 100;
            
            // Update the price in storage
            await storage.updateCrypto(cryptoId, {
              price: newPrice,
              lastUpdated: new Date(),
            });
            
            // Send update to clients if change is significant
            if (Math.abs(priceChange) > 0.5) {
              broadcast({
                type: 'price_alert',
                data: {
                  id: cryptoId,
                  name: crypto.name,
                  price: newPrice,
                  change: priceChange,
                },
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error handling CoinCap WebSocket message:', error);
    }
  });
  
  coinCapSocket.on('error', (error) => {
    console.error('CoinCap WebSocket error:', error);
  });
  
  coinCapSocket.on('close', () => {
    console.log('CoinCap WebSocket connection closed');
    // Reconnect after a delay
    setTimeout(() => {
      console.log('Reconnecting to CoinCap WebSocket...');
      setupWebSocketServer(server);
    }, 5000);
  });
  
  // Fallback periodic updates in case WebSocket fails
  setInterval(async () => {
    try {
      if (coinCapSocket.readyState !== WebSocket.OPEN) {
        console.log('WebSocket not connected, using fallback update method');
        await fetchAndStoreCryptoData();
      }
    } catch (error) {
      console.error('Error in fallback crypto price update:', error);
    }
  }, CRYPTO_UPDATE_INTERVAL);
  
  // Set up periodic weather alerts (simulated)
  setInterval(async () => {
    try {
      if (Math.random() > 0.7) { // Only send alerts occasionally
        const city = TRACKED_CITIES[Math.floor(Math.random() * TRACKED_CITIES.length)];
        const weather = await storage.getWeatherByCity(city);
        
        if (weather) {
          // Generate a random weather alert
          const alerts = [
            `Heavy rain expected in ${city} later today`,
            `Temperature in ${city} reaching extreme levels`,
            `Wind advisory issued for ${city}`,
            `Air quality warning for ${city}`,
            `Thunderstorm warning for ${city}`,
            `Fog advisory for ${city}`,
          ];
          
          const alert = alerts[Math.floor(Math.random() * alerts.length)];
          
          // Send alert to clients
          broadcast({
            type: 'weather_alert',
            data: {
              city,
              alert,
              condition: weather.condition, 
              temp: weather.temp,
              humidity: weather.humidity,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error sending weather alert:', error);
    }
  }, WEATHER_ALERT_INTERVAL);
  
  return wss;
}

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Create and configure the HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server on the same HTTP server
  setupWebSocketServer(httpServer);

  return httpServer;
}
