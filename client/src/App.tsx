import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/index";
import CryptoDetailPage from "@/pages/crypto/[id]";
import WeatherDetailPage from "@/pages/weather/[city]";
import AuthPage from "@/pages/auth-page";
import { useEffect } from "react";
import { setupWebSocketConnection } from "./lib/websocket";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/crypto/:id" component={CryptoDetailPage} />
      <ProtectedRoute path="/weather/:city" component={WeatherDetailPage} />
      <Route path="/auth" component={AuthPage} />
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
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
