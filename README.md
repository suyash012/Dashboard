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

## Local Development

### Prerequisites

- Node.js 18+ installed
- Git
- Text editor (VS Code recommended)

### Setup Steps

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/real-time-dashboard.git
   cd real-time-dashboard
   ```

2. Create a `.env` file in the root directory with the following variables:
   ```
   NEWSDATA_API_KEY=your_newsdata_api_key
   OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
   COINCAP_API_KEY=your_coincap_api_key
   SESSION_SECRET=any_random_string_for_session_encryption
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5000`

### Development Tips

- Changes to client-side code trigger hot module replacement (HMR)
- Server-side changes require a manual restart (`Ctrl+C` and `npm run dev` again)
- WebSocket messages can be monitored in the browser console

## License

MIT License

## Deployment to Vercel

### Prerequisites

- Vercel account
- Vercel CLI installed

### Setup Steps

1. Create a vercel.json file with the following content:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": { "distDir": "build" }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.ts"
    },
    {
      "src": "/ws",
      "dest": "server/index.ts"
    },
    {
      "src": "/(.*)",
      "dest": "client/build/$1"
    }
  ]
}
```

2. Deploy your application using the Vercel dashboard or CLI.

### Environment Variables in Vercel

Add the following environment variables in the Vercel dashboard:

- `NEWSDATA_API_KEY`: Your NewsData.io API key
- `OPENWEATHERMAP_API_KEY`: Your OpenWeatherMap API key
- `COINCAP_API_KEY`: Your CoinCap API key
- `SESSION_SECRET`: Random string for session encryption
- `NODE_ENV`: Set to "production"

### Deployment Considerations

- WebSockets require a Vercel Pro plan
- Serverless functions have timeouts and cold starts
- Configure custom domains in the Vercel dashboard
