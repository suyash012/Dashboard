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

## Deployment to Render

### Prerequisites

- Render account (register at render.com)
- Git repository connected to Render

### Setup Steps

1. Create a `render.yaml` file in the root directory with the following content:
   ```yaml
   services:
     - type: web
       name: dashboard
       env: node
       buildCommand: >
         npm install &&
         cd client && npm install && npm run build &&
         cd .. && mkdir -p server/public &&
         cp -R dist/public/* server/public/
       startCommand: npm run dev
       envVars:
         - key: OPENWEATHERMAP_API_KEY
           value: your_openweathermap_api_key
         - key: COINCAP_API_KEY
           value: your_coincap_api_key
         - key: NEWSDATA_API_KEY
           value: your_newsdata_api_key
         - key: SESSION_SECRET
           value: your_session_secret
       healthCheckPath: /api/health
   ```

2. On Render, create a new Web Service:
   - Connect your GitHub repository
   - Select "Use render.yaml" as your deployment configuration
   - Click "Create Web Service"

3. Render will automatically deploy your application using the configuration from render.yaml

### Environment Variables in Render

Render.yaml already contains the necessary environment variables, but you can also add or modify them in the Render dashboard:

- `NEWSDATA_API_KEY`: Your NewsData.io API key
- `OPENWEATHERMAP_API_KEY`: Your OpenWeatherMap API key
- `COINCAP_API_KEY`: Your CoinCap API key
- `SESSION_SECRET`: Random string for session encryption
- `NODE_ENV`: Set to "production"

### Render Deployment Considerations

1. **WebSocket Support**: Render fully supports WebSockets, ensuring your real-time notifications work properly
2. **Continuous Deployment**: Automatically deploys when you push to your repository
3. **Custom Domains**: Easily add your own domain (paid feature)
4. **Generous Free Tier**: Includes 750 hours of runtime per month

### Troubleshooting Render Deployments

If you encounter issues:

1. Check the Render logs for error messages
2. Verify your environment variables are set correctly
3. Ensure the build command is properly copying files from `dist/public/` to `server/public/`
4. Check that your application's health check endpoint is responding correctly

## Required Environment Variables

- `NEWSDATA_API_KEY`: API key for NewsData.io
- `OPENWEATHERMAP_API_KEY`: API key for OpenWeatherMap
- `COINCAP_API_KEY`: API key for CoinCap
- `SESSION_SECRET`: Random string for encrypting session data

### Optional Environment Variables

- `PORT`: Override the default port (5000)
- `NODE_ENV`: Set to "production" in production environments
- `LOG_LEVEL`: Control logging verbosity (default: "info")
- `DISABLE_WEBSOCKETS`: Set to "true" to disable WebSocket connections
- `API_CACHE_DURATION`: Time in seconds to cache API responses (default: 300)

## Design Decisions

### Architecture

The application uses a monorepo structure with separated client and server code but shared types. This architecture allows for:
- Type safety across the stack
- Simplified deployment to services like Render
- Shared validation logic between client and server

### State Management

We chose Redux for global state management due to:
- Centralized state for complex real-time data
- DevTools for debugging state changes
- Middleware support for handling WebSocket events

### UI Framework

ShadCN/UI with Tailwind CSS was selected because:
- Component-based architecture aligns with React principles
- Highly customizable design system
- Excellent responsive behavior with minimal effort
- Accessible components out of the box

### Data Fetching

TanStack Query (React Query) was chosen for data fetching because:
- Built-in caching reduces API calls
- Automatic refetching ensures fresh data
- Loading and error states simplify UI handling
- Stale-while-revalidate pattern improves perceived performance

## License

MIT License
