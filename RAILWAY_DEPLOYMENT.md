# Railway Deployment Guide for Dashboard

This guide will walk you through deploying your Dashboard application on Railway, which provides full support for WebSockets and real-time notifications.

## Prerequisites

- A [Railway](https://railway.app/) account
- Railway CLI installed: `npm install -g @railway/cli`

## Step 1: Prepare Your Local Project

Your project is already configured for Railway deployment with:
- `railway.json` configuration file
- Updated start script in package.json
- Health check endpoint in the server

## Step 2: Login to Railway

```bash
railway login
```

This will open a browser window for authentication.

## Step 3: Initialize Railway Project

In your project directory, run:

```bash
railway init
```

Select "Create a new project" when prompted.

## Step 4: Set Environment Variables

You'll need to set up your environment variables in Railway. Based on the latest Railway CLI, use the following commands:

```bash
# Set each variable individually
railway variables --set "OPENWEATHERMAP_API_KEY=a4fa92c27a44e3779170a109709d2930"
railway variables --set "COINCAP_API_KEY=16c58799-fd64-449d-b74f-53400e553f42" 
railway variables --set "NEWSDATA_API_KEY=pub_7852793195b6cf334b12f2cdc635bd8ccb04e"
railway variables --set "SESSION_SECRET=7U1XBIEoln5nZ0VGZC2a2sD1tEz/bKrkMuTesROEf7R21UJN/YyajZa8y6vJykhoAkmX6N4g0kQovP9B7cW6YQ=="
```

Alternatively, you can set all variables at once by using multiple `--set` flags:

```bash
railway variables \
  --set "OPENWEATHERMAP_API_KEY=a4fa92c27a44e3779170a109709d2930" \
  --set "COINCAP_API_KEY=16c58799-fd64-449d-b74f-53400e553f42" \
  --set "NEWSDATA_API_KEY=pub_7852793195b6cf334b12f2cdc635bd8ccb04e" \
  --set "SESSION_SECRET=7U1XBIEoln5nZ0VGZC2a2sD1tEz/bKrkMuTesROEf7R21UJN/YyajZa8y6vJykhoAkmX6N4g0kQovP9B7cW6YQ=="
```

## Step 5: Deploy the Application

```bash
railway up
```

This command builds and deploys your application on Railway.

## Step 6: Connect to Your Deployed Application

```bash
railway open
```

This will open your deployed application in the browser.

## Step a7: Continuous Deployment (Optional)

To set up continuous deployment:

1. Push your code to GitHub
2. Connect your GitHub repository in the Railway dashboard
3. Configure automatic deployments

## Troubleshooting

If you encounter any issues:

1. Check application logs:
   ```bash
   railway logs
   ```

2. SSH into your service:
   ```bash
   railway ssh
   ```

3. Restart your service:
   ```bash
   railway service restart
   ```

## Monitoring and Scaling

Railway provides a dashboard for monitoring the performance of your application. You can:

- Set up custom domains
- Monitor resource usage
- Scale your application as needed

Visit the [Railway documentation](https://docs.railway.app/) for more information.
