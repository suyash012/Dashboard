# Real-Time Dashboard Application

A dynamic dashboard application providing real-time insights into weather, cryptocurrency, and news data through interactive WebSocket-powered visualizations with enhanced user authentication.

## Features

- **Real-time Data**: Live updates for weather conditions, cryptocurrency prices, and breaking news
- **User Authentication**: Secure login/registration system with personalized dashboards
- **WebSocket Integration**: Instant notifications for price alerts and weather warnings
- **Responsive Design**: Mobile-first interface that adapts to any screen size
- **Favorites System**: Save your preferred cities and cryptocurrencies for quick access
- **Detailed Views**: Comprehensive information pages for each data source

## Tech Stack

- **Frontend**: React with Redux for state management
- **UI Components**: ShadCN/UI with Tailwind CSS
- **Server**: Express.js backend
- **Authentication**: Passport.js with local strategy
- **Real-time Updates**: WebSockets (ws)
- **Data Fetching**: TanStack Query (React Query)
- **Form Management**: React Hook Form with Zod validation
- **Storage**: In-memory database with optional PostgreSQL compatibility

## External APIs

- **Weather Data**: OpenWeatherMap API
- **Cryptocurrency Data**: CoinCap API
- **News Data**: NewsData.io API

## Development Challenges and Solutions

### API Rate Limiting

**Challenge**: The CoinCap API has strict rate limits that frequently returned 429 (Too Many Requests) errors.

**Solution**:
- Implemented exponential backoff for API requests
- Added caching to reduce unnecessary calls
- Created graceful fallback UI for when data couldn't be fetched

### WebSocket Stability

**Challenge**: WebSocket connections would occasionally disconnect, causing missed notifications.

**Solution**:
- Added automatic reconnection logic
- Implemented a fallback mechanism that uses HTTP polling
- Created a message queue to ensure no notifications are lost during disconnections

### Authentication Issues

**Challenge**: Users could register but faced issues when logging in.

**Solution**:
- Improved error handling in auth hooks
- Added detailed logging for debugging authentication flow
- Fixed JSON response parsing in the login mutation
- Added error fallbacks for API responses

## Alternative APIs

While the application is configured to use OpenWeatherMap, CoinCap, and NewsData.io, it can be adapted to use these alternatives:

- **Weather**:
  - AccuWeather API
  - Weather API (weatherapi.com)
  - Visual Crossing Weather API

- **Cryptocurrency**:
  - CoinGecko API (free with limitations)
  - CryptoCompare API
  - Binance API

- **News**:
  - GNews API
  - News API
  - Guardian API

## Project Structure

```
├── client/               # Frontend React application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions and services
│   │   ├── pages/        # Page components
│   │   └── App.tsx       # Main application component
├── server/               # Backend Express application
│   ├── auth.ts           # Authentication setup
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database interface
│   └── index.ts          # Server entry point
├── shared/               # Shared code between client and server
│   └── schema.ts         # Data schemas
└── README.md             # Project documentation
```

## License

MIT License
