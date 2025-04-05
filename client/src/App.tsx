import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/index";
import CryptoDetailPage from "@/pages/crypto/[id]";
import WeatherDetailPage from "@/pages/weather/[city]";
import { useEffect } from "react";
import { setupWebSocketConnection } from "./lib/websocket";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/crypto/:id" component={CryptoDetailPage} />
      <Route path="/weather/:city" component={WeatherDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    const cleanup = setupWebSocketConnection();
    return () => {
      cleanup();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
