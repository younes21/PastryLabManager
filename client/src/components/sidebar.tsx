import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Package, 
  ChefHat, 
  BookOpen, 
  Factory, 
  ShoppingCart, 
  Truck, 
  Users, 
  Cake,
  LogOut,
  CheckCircle
} from "lucide-react";

interface StorageLocationStatus {
  id: number;
  name: string;
  temperature: string;
  status: "ok" | "warning" | "error";
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const { data: storageLocations } = useQuery({
    queryKey: ["/api/storage-locations"],
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    { path: "/", label: "Tableau de bord", icon: "fas fa-tachometer-alt", lucideIcon: LayoutDashboard },
    { path: "/inventory", label: "Gestion de Stock", icon: "fas fa-boxes", lucideIcon: Package },
    { path: "/ingredients", label: "Ingrédients", icon: "fas fa-seedling", lucideIcon: ChefHat },
    { path: "/recipes", label: "Recettes", icon: "fas fa-book-open", lucideIcon: BookOpen },
    { path: "/production", label: "Production", icon: "fas fa-industry", lucideIcon: Factory },
    { path: "/orders", label: "Commandes", icon: "fas fa-shopping-cart", lucideIcon: ShoppingCart },
    { path: "/delivery", label: "Livraisons", icon: "fas fa-truck", lucideIcon: Truck },
    { path: "/users", label: "Utilisateurs", icon: "fas fa-users", lucideIcon: Users },
  ];

  // Filter navigation based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!user) return false;
    
    switch (user.role) {
      case "client":
        return ["/"].includes(item.path); // Only dashboard for clients
      case "livreur":
        return ["/"].includes(item.path); // Only dashboard for deliverers
      case "preparateur":
        return !["/users"].includes(item.path);
      default:
        return true; // admin, gerant have access to everything
    }
  });

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4">
          <Cake className="text-primary h-8 w-8 mr-3" />
          <h1 className="text-xl font-bold text-gray-900">PâtissLab</h1>
        </div>
        
        {/* User Info */}
        {user && (
          <div className="mt-6 px-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getInitials(user.firstName, user.lastName)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-6 flex-1 px-2 space-y-1">
          {filteredNavItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <div
                className={`${
                  isActive(item.path)
                    ? "bg-primary/10 border-r-4 border-primary text-primary-foreground group flex items-center px-2 py-2 text-sm font-medium rounded-l-md cursor-pointer"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer"
                }`}
              >
                <item.lucideIcon className={`h-5 w-5 mr-3 ${isActive(item.path) ? "text-primary" : ""}`} />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
        
        {/* Storage Temperature Status */}
        <div className="px-4 pb-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-2">État des Stockages</h4>
            <div className="space-y-1">
              {storageLocations?.map((location: any) => (
                <div key={location.id} className="flex justify-between text-xs">
                  <span className="text-blue-700">
                    {location.name} ({location.temperature}°C)
                  </span>
                  <span className="text-green-600">
                    <CheckCircle className="h-4 w-4" />
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Logout button */}
          <button
            onClick={logout}
            className="mt-4 w-full text-left text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded flex items-center"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}
