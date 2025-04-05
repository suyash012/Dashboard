import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Periodic intervals in milliseconds
const CRYPTO_UPDATE_INTERVAL = 10000; // 10 seconds
const WEATHER_ALERT_INTERVAL = 30000; // 30 seconds

// Weather and crypto data we want to track
const TRACKED_CITIES = ['New York', 'London', 'Tokyo'];
const TRACKED_CRYPTOS = ['bitcoin', 'ethereum', 'cardano'];

// Mock data generation for APIs
async function fetchAndStoreWeatherData() {
  try {
    // In a real app, this would fetch from OpenWeatherMap API
    const cities = [
      {
        city: 'New York',
        country: 'US',
        temp: 24,
        humidity: 65,
        condition: 'Partly Cloudy',
        icon: '03d',
        timestamp: Date.now(),
      },
      {
        city: 'London',
        country: 'UK',
        temp: 18,
        humidity: 78,
        condition: 'Rainy',
        icon: '10d',
        timestamp: Date.now(),
      },
      {
        city: 'Tokyo',
        country: 'JP',
        temp: 28,
        humidity: 52,
        condition: 'Clear Sky',
        icon: '01d',
        timestamp: Date.now(),
      },
    ];

    for (const cityData of cities) {
      const existingWeather = await storage.getWeatherByCity(cityData.city);
      if (existingWeather) {
        await storage.updateWeather(cityData.city, cityData);
      } else {
        await storage.createWeather(cityData);
      }
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

async function fetchAndStoreCryptoData() {
  try {
    // In a real app, this would fetch from CoinGecko/CoinCap API
    const cryptos = [
      {
        coinId: 'bitcoin',
        name: 'Bitcoin',
        symbol: 'btc',
        price: 42385.67,
        priceChange24h: 5.2,
        marketCap: 816900000000,
        volume24h: 38200000000,
        lastUpdated: new Date().toISOString(),
      },
      {
        coinId: 'ethereum',
        name: 'Ethereum',
        symbol: 'eth',
        price: 2842.15,
        priceChange24h: -1.7,
        marketCap: 342100000000,
        volume24h: 21500000000,
        lastUpdated: new Date().toISOString(),
      },
      {
        coinId: 'cardano',
        name: 'Cardano',
        symbol: 'ada',
        price: 1.28,
        priceChange24h: 3.5,
        marketCap: 45700000000,
        volume24h: 3100000000,
        lastUpdated: new Date().toISOString(),
      },
    ];

    for (const cryptoData of cryptos) {
      const existingCrypto = await storage.getCryptoByCoinId(cryptoData.coinId);
      if (existingCrypto) {
        await storage.updateCrypto(cryptoData.coinId, cryptoData);
      } else {
        await storage.createCrypto(cryptoData);
      }
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

async function fetchAndStoreNewsData() {
  try {
    // In a real app, this would fetch from NewsData.io or similar API
    const news = [
      {
        title: 'SEC Approves Bitcoin ETF, Market Responds with All-Time Highs',
        description: 'The Securities and Exchange Commission has approved the first Bitcoin exchange-traded fund, marking a significant milestone for cryptocurrency adoption.',
        url: 'https://example.com/news/1',
        source: 'Crypto News',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        content: 'The Securities and Exchange Commission has approved the first Bitcoin exchange-traded fund, marking a significant milestone for cryptocurrency adoption. This decision is expected to pave the way for more institutional investment in the crypto space.',
        isBreaking: true,
      },
      {
        title: 'Ethereum 2.0 Transition Completes Successfully, Gas Fees Drop 90%',
        description: 'The long-awaited Ethereum 2.0 transition has completed without major issues, resulting in dramatically lower transaction fees and improved network performance.',
        url: 'https://example.com/news/2',
        source: 'Blockchain Daily',
        publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        content: 'The long-awaited Ethereum 2.0 transition has completed without major issues, resulting in dramatically lower transaction fees and improved network performance. This upgrade moves Ethereum from proof-of-work to proof-of-stake, significantly reducing its environmental impact.',
        isBreaking: false,
      },
      {
        title: 'Major Bank Announces Cryptocurrency Custody Services for Institutional Clients',
        description: "One of the world's largest banks has revealed plans to offer cryptocurrency custody services, targeting institutional investors seeking secure storage for digital assets.",
        url: 'https://example.com/news/3',
        source: 'Financial Times',
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        content: "One of the world's largest banks has revealed plans to offer cryptocurrency custody services, targeting institutional investors seeking secure storage for digital assets. This move signals growing acceptance of cryptocurrencies within traditional financial institutions.",
        isBreaking: false,
      },
      {
        title: 'NFT Market Shows Signs of Recovery as Trading Volume Rises 30%',
        description: 'After months of declining activity, the NFT market is showing signs of recovery with trading volume up 30% compared to last month, driven by new collections and use cases.',
        url: 'https://example.com/news/4',
        source: 'Digital Arts Review',
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        content: 'After months of declining activity, the NFT market is showing signs of recovery with trading volume up 30% compared to last month, driven by new collections and use cases. Analysts suggest this could indicate renewed interest in digital collectibles.',
        isBreaking: false,
      },
      {
        title: 'New Regulatory Framework for Stablecoins Introduced by EU Commission',
        description: 'The European Union Commission has introduced a comprehensive regulatory framework for stablecoins, aiming to provide clarity for issuers and greater protection for users.',
        url: 'https://example.com/news/5',
        source: 'EU Policy Monitor',
        publishedAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
        content: 'The European Union Commission has introduced a comprehensive regulatory framework for stablecoins, aiming to provide clarity for issuers and greater protection for users. The new rules establish requirements for reserves, operational resilience, and consumer protection.',
        isBreaking: false,
      },
    ];

    // Clear existing news to avoid duplicates in this demo
    // In a real app, we would compare and only add new articles
    const currentNews = await storage.getNews();
    if (currentNews.length === 0) {
      for (const article of news) {
        await storage.createNews(article);
      }
    }

    return news;
  } catch (error) {
    console.error('Error fetching news data:', error);
    throw error;
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
  
  // Set up periodic crypto price updates
  setInterval(async () => {
    try {
      for (const cryptoId of TRACKED_CRYPTOS) {
        const crypto = await storage.getCryptoByCoinId(cryptoId);
        if (crypto) {
          // Calculate a random price change between -2% and +2%
          const changePercent = -2 + Math.random() * 4;
          const newPrice = crypto.price * (1 + changePercent / 100);
          
          // Update the price in storage
          await storage.updateCrypto(cryptoId, {
            price: newPrice,
            priceChange24h: crypto.priceChange24h + changePercent / 10, // Adjust the 24h change slightly
            lastUpdated: new Date().toISOString(),
          });
          
          // Send update to clients if change is significant
          if (Math.abs(changePercent) > 0.5) {
            broadcast({
              type: 'price_alert',
              data: {
                id: cryptoId,
                name: crypto.name,
                price: newPrice,
                change: changePercent,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating crypto prices:', error);
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
