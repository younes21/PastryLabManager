import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
// import Ingredients supprimé - utiliser Articles avec filtrage
// Modules supprimés - à réimplémenter
// import Recipes from "@/pages/recipes";
// import Production from "@/pages/production";
// import Orders from "@/pages/orders";
// import Delivery from "@/pages/delivery";
import Stock from "@/pages/stock";
import Users from "@/pages/users";
import MeasurementUnits from "@/pages/measurement-units";
import ArticleCategories from "@/pages/article-categories";
import PriceLists from "@/pages/price-lists";
import ClientCatalog from "@/pages/client-catalog";
import ClientDashboard from "@/pages/client-dashboard";
import DeliveryDashboard from "@/pages/delivery-dashboard";
import Taxes from "@/pages/taxes";
import Currencies from "@/pages/currencies";
import DeliveryMethods from "@/pages/delivery-methods";
import AccountingJournals from "@/pages/accounting-journals";
import AccountingAccounts from "@/pages/accounting-accounts";
import StorageZones from "@/pages/storage-zones";
import WorkStations from "@/pages/work-stations";
import EmailConfig from "@/pages/email-config";
import Suppliers from "@/pages/suppliers";
import Clients from "@/pages/clients-new";
import Products from "@/pages/products";
import IngredientsNew from "@/pages/ingredients-new";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, lazy } from "react";

function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const success = await login(username, password);
    
    if (!success) {
      setError("Nom d'utilisateur ou mot de passe incorrect");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-6 justify-center">
            <div className="text-center">
              <i className="fas fa-birthday-cake text-primary text-4xl mb-2"></i>
              <h1 className="text-2xl font-bold text-gray-900">PâtissLab</h1>
              <p className="text-gray-600">Connexion</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-4 text-sm text-gray-600">
            <p>Compte par défaut :</p>
            <p>Utilisateur: admin | Mot de passe: admin123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProtectedRouter() {
  const { user } = useAuth();

  // Route based on user role
  if (user?.role === "client") {
    return (
      <Switch>
        <Route path="/" component={ClientDashboard} />
        <Route path="/catalog" component={ClientCatalog} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user?.role === "livreur") {
    return (
      <Switch>
        <Route path="/" component={DeliveryDashboard} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Default routes for admin, preparateur, gerant
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inventory" component={Inventory} />
      {/* Route ingredients supprimée - utiliser Articles avec filtrage */}
      {/* Routes supprimées - à réimplémenter */}
      {/* <Route path="/recipes" component={Recipes} /> */}
      {/* <Route path="/production" component={Production} /> */}
      {/* <Route path="/orders" component={Orders} /> */}
      {/* <Route path="/delivery" component={Delivery} /> */}
      <Route path="/stock" component={Stock} />
      <Route path="/users" component={Users} />
      <Route path="/measurement-units" component={MeasurementUnits} />
      <Route path="/article-categories" component={ArticleCategories} />
      <Route path="/price-lists" component={PriceLists} />
      <Route path="/taxes" component={Taxes} />
      <Route path="/currencies" component={Currencies} />
      <Route path="/delivery-methods" component={DeliveryMethods} />
      <Route path="/accounting-journals" component={AccountingJournals} />
      <Route path="/accounting-accounts" component={AccountingAccounts} />
      <Route path="/storage-zones" component={StorageZones} />
      <Route path="/work-stations" component={WorkStations} />
      <Route path="/email-config" component={EmailConfig} />
      <Route path="/suppliers" component={Suppliers} />
      <Route path="/clients" component={Clients} />
      <Route path="/products" component={Products} />
      <Route path="/ingredients" component={IngredientsNew} />
      <Route path="/catalog" component={ClientCatalog} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <i className="fas fa-birthday-cake text-primary text-4xl mb-4"></i>
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  return user ? <ProtectedRouter /> : <LoginPage />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
