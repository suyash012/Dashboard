# Render Deployment Guide for Dashboard

This guide will walk you through deploying your Dashboard application on Render, which provides full support for WebSockets and real-time notifications.

## Prerequisites

- A [Render account](https://render.com/) (sign up for free)
- Your GitHub repository (for automatic deployments) or the code uploaded directly

## Step 1: Sign Up for Render

Visit [render.com](https://render.com/) and sign up for an account if you don't already have one.

## Step 2: Deploy Your Dashboard

There are two ways to deploy on Render: via GitHub repository or direct deployment.

### Option 1: Deploy from GitHub (Recommended)

1. Push your code to a GitHub repository
2. Log in to your Render dashboard
3. Click "New" and select "Blueprint" (This uses your render.yaml config)
4. Select your GitHub repository
5. Configure settings as needed (or use the defaults from render.yaml)
6. Click "Apply"

### Option 2: Deploy Using Dashboard UI

1. Log in to your Render dashboard
2. Click "New" and select "Web Service"
3. Connect your GitHub repository or upload your code
4. Configure the following settings:
   - **Name**: Dashboard
   - **Environment**: Node
   - **Build Command**: `npm install && cd client && npm install && npm run build && cd ..`
   - **Start Command**: `npm start`
5. Add the following environment variables:
   - `OPENWEATHERMAP_API_KEY`: a4fa92c27a44e3779170a109709d2930
   - `COINCAP_API_KEY`: 16c58799-fd64-449d-b74f-53400e553f42
   - `NEWSDATA_API_KEY`: pub_7852793195b6cf334b12f2cdc635bd8ccb04e
   - `SESSION_SECRET`: 7U1XBIEoln5nZ0VGZC2a2sD1tEz/bKrkMuTesROEf7R21UJN/YyajZa8y6vJykhoAkmX6N4g0kQovP9B7cW6YQ==
6. Click "Create Web Service"

## Step 3: Monitor the Deployment

- Render will automatically start building and deploying your application
- You can monitor the build process in the Render dashboard
- Once deployed, your application will be available at: `https://dashboard.onrender.com` (or similar URL)

## Step 4: Testing Your Deployment

After deployment is complete:

1. Visit your application URL
2. Test the real-time notifications:
   - Watch for cryptocurrency price updates
   - Check for weather alerts
3. Verify that all dashboard features are working correctly

## Benefits of Render

- **WebSocket Support**: Render fully supports WebSockets, ensuring your real-time notifications work properly
- **Continuous Deployment**: Automatically deploys when you push to your repository
- **Custom Domains**: Easily add your own domain (paid feature)
- **Generous Free Tier**: Includes 750 hours of runtime per month

## Troubleshooting

If you encounter issues:

1. Check the Render logs for error messages
2. Verify your environment variables are set correctly
3. Make sure the health check endpoint is responding

## Free Tier Limitations

- Services on the free tier will spin down after 15 minutes of inactivity
- They automatically spin up when a request comes in (may take 30-45 seconds on first request)
- If you need always-on service, consider upgrading to a paid plan
