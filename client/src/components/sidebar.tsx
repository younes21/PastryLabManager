import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { useLayout } from "@/contexts/LayoutContext";
import {
  LayoutDashboard,
  Package,
  ChefHat,
  BookOpen,
  Factory,
  Warehouse,
  ShoppingCart,
  Truck,
  Users,
  Cake,
  LogOut,
  CheckCircle,
  Scale,
  FolderTree,
  DollarSign,
  Receipt,
  Coins,
  TruckIcon,
  BookIcon,
  Calculator,
  Building,
  Settings,
  Mail,
  Leaf,
  FileText,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { closeSidebar } = useLayout();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Principal"]) // Principal group expanded by default
  );

  // Fermer la sidebar sur mobile après navigation
  const handleNavigation = () => {
    if (window.innerWidth < 1366) { // lg breakpoint
       closeSidebar();
    }
  };

  // Keep the group expanded if it contains the active item
  const shouldGroupBeExpanded = (groupItems: typeof filteredNavItems, groupName: string) => {
    return expandedGroups.has(groupName);
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      if (prev.has(groupName)) {
        // Si le groupe est déjà ouvert, le fermer
        const newExpanded = new Set(prev);
        newExpanded.delete(groupName);
        return newExpanded;
      } else {
        // Ouvrir uniquement ce groupe (fermer tous les autres)
        return new Set([groupName]);
      }
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      path: "/",
      label: "Tableau de bord",
      icon: "fas fa-tachometer-alt",
      lucideIcon: LayoutDashboard,
      order: 0,
      group: "Principal",
    },
    {
      path: "/stock",
      label: "Gestion de Stock",
      icon: "fas fa-boxes",
      lucideIcon: Package,
      order: 0,
      group: "Inventaire",
    },
    {
      path: "/inventory-physical",
      label: "Inventaire Physique",
      icon: "fas fa-clipboard-check",
      lucideIcon: CheckCircle,
      order: 1,
      group: "Inventaire",
    },
    {
      path: "/recipes",
      label: "Recettes",
      icon: "fas fa-book-open",
      lucideIcon: BookOpen,
      order: 0,
      group: "Production",
    },
    {
      path: "/orders",
      label: "Commandes",
      icon: "fas fa-shopping-cart",
      lucideIcon: ShoppingCart,
      order: 0,
      group: "Ventes",
    },
    {
      path: "/client_orders",
      label: "Commandes clients",
      icon: "fas fa-shopping-cart",
      lucideIcon: ShoppingCart,
      order: 0,
      group: "Ventes",
    },
    // {
    //   path: "/inventory-operations",
    //   label: "Opérations Stock",
    //   icon: "fas fa-warehouse",
    //   lucideIcon: Package,
    //   order: 0,
    //   group: "Inventaire",
    // },
    {
      path: "/invoices",
      label: "Facturation",
      icon: "fas fa-file-invoice",
      lucideIcon: FileText,
      order: 0,
      group: "Ventes",
    },
    {
      path: "/deliveries",
      label: "Livraisons",
      icon: "fas fa-truck",
      lucideIcon: Truck,
      order: 0,
      group: "Ventes",
    },
    {
      path: "/users",
      label: "Utilisateurs",
      icon: "fas fa-users",
      lucideIcon: Users,
      order: 0,
      group: "admin",
    },
    {
      path: "/measurement-units",
      label: "Unités de Mesure",
      icon: "fas fa-balance-scale",
      lucideIcon: Scale,
      order: 0,
      group: "admin",
    },
    {
      path: "/article-categories",
      label: "Catégories d'Articles",
      icon: "fas fa-folder-tree",
      lucideIcon: FolderTree,
      order: 0,
      group: "admin",
    },
    {
      path: "/price-lists",
      label: "Listes de Prix",
      icon: "fas fa-dollar-sign",
      lucideIcon: DollarSign,
      order: 0,
      group: "admin",
    },
    {
      path: "/taxes",
      label: "Taxes",
      icon: "fas fa-receipt",
      lucideIcon: Receipt,
      order: 0,
      group: "admin",
    },
    {
      path: "/currencies",
      label: "Devises",
      icon: "fas fa-coins",
      lucideIcon: Coins,
      order: 0,
      group: "admin",
    },
    {
      path: "/delivery-methods",
      label: "Méthodes de Livraison",
      icon: "fas fa-shipping-fast",
      lucideIcon: TruckIcon,
      order: 0,
      group: "admin",
    },
    {
      path: "/accounting-journals",
      label: "Journaux Comptables",
      icon: "fas fa-book",
      lucideIcon: BookIcon,
      order: 0,
      group: "admin",
    },
    {
      path: "/accounting-accounts",
      label: "Comptes Comptables",
      icon: "fas fa-calculator",
      lucideIcon: Calculator,
      order: 0,
      group: "admin",
    },
    {
      path: "/storage-zones",
      label: "Zones de Stockage",
      icon: "fas fa-building",
      lucideIcon: Building,
      order: 0,
      group: "admin",
    },
    {
      path: "/work-stations",
      label: "Postes de Travail",
      icon: "fas fa-cogs",
      lucideIcon: Settings,
      order: 0,
      group: "admin",
    },
    {
      path: "/email-config",
      label: "Configuration Email",
      icon: "fas fa-envelope",
      lucideIcon: Mail,
      order: 0,
      group: "admin",
    },
    {
      path: "/suppliers",
      label: "Fournisseurs",
      icon: "fas fa-truck",
      lucideIcon: Truck,
      order: 0,
      group: "Achats",
    },
    {
      path: "/purchase-orders",
      label: "Achats Fournisseurs",
      icon: "fas fa-shopping-cart",
      lucideIcon: ShoppingCart,
      order: 1,
      group: "Achats",
    },
    {
      path: "/clients",
      label: "Clients",
      icon: "fas fa-users",
      lucideIcon: Users,
      order: 0,
      group: "Ventes",
    },
    {
      path: "/products",
      label: "Produits",
      icon: "fas fa-box",
      lucideIcon: Package,
      order: 0,
      group: "Ventes",
    },
    {
      path: "/ingredients",
      label: "Ingrédients",
      icon: "fas fa-leaf",
      lucideIcon: Leaf,
      order: 0,
      group: "Achats",
    },
    {
      path: "/preparateur-preparations",
      label: "Mes Préparations",
      icon: "fas fa-chef-hat",
      lucideIcon: ChefHat,
      order: 0,
      group: "Production",
    },
    {
      path: "/preparation",
      label: "Planif. Préparations",
      icon: "fas fa-chef-hat",
      lucideIcon: ChefHat,
      order: 0,
      group: "Production",
    },
  ];

  // Filter navigation based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;

    switch (user.role) {
      case "client":
        return ["/", "/client_orders"].includes(item.path);
      case "livreur":
        return ["/"].includes(item.path);
      case "preparateur":
        return ["/production", "/orders", "/preparateur-preparations"].includes(item.path);
      case "admin":
        return true;
      case "gerant":
        return !["/email-config"].includes(item.path);
      default:
        return false;
    }
  });

  // Group navigation items by group
  const groupedMenu = filteredNavItems.reduce((acc, item) => {
    const group = item.group || "Principal";
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, typeof filteredNavItems>);

  // Define group order for consistent display
  const groupOrder = ["admin","Principal", "Inventaire","Ventes", "Achats",  "Production"];
  const sortedGroupEntries = Object.entries(groupedMenu).sort(([a], [b]) => {
    const indexA = groupOrder.indexOf(a);
    const indexB = groupOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  // Function to get display name for groups
  const getGroupDisplayName = (groupName: string) => {
    switch (groupName) {
      case "admin": return "Administration";
      default: return groupName;
    }
  };

  // Check if any item in a group is active
  const isGroupActive = (groupItems: typeof filteredNavItems) => {
    return groupItems.some(item => isActive(item.path));
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 shadow-xl xl:shadow-none">
      <div className="flex flex-col h-full">
        {/* Header mobile avec bouton de fermeture */}
        <div className=" flex items-center justify-between  h-[73px] border-b border-gray-200 bg-white">
          <div className="flex items-center ml-6">
            <div className="mr-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                className="text-primary"
              >
                <defs>
                  <linearGradient
                    id="logoGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="50%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#eab308" />
                  </linearGradient>
                </defs>
                <path
                  d="M8 14c0-2.5 1.5-4.5 4-5.5C12.5 6.5 14.5 5 17 5s4.5 1.5 5 3.5c2.5 1 4 3 4 5.5v2c0 1-0.5 2-1.5 2.5v6c0 1.5-1 2.5-2.5 2.5h-12c-1.5 0-2.5-1-2.5-2.5v-6C7.5 18 7 17 7 16v-2z"
                  fill="url(#logoGradient)"
                />
                <rect
                  x="8"
                  y="18"
                  width="16"
                  height="2"
                  fill="white"
                  opacity="0.8"
                  rx="1"
                />
                <circle cx="12" cy="12" r="1" fill="white" opacity="0.6" />
                <circle cx="17" cy="10" r="1" fill="white" opacity="0.6" />
                <circle cx="22" cy="12" r="1" fill="white" opacity="0.6" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">PâtissLab</h1>
              <p className="text-xs text-gray-500 font-medium">Gestion Pro</p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className=" xl:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Fermer le menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenu principal de la sidebar */}
        <div className="flex flex-col flex-grow  overflow-y-auto">
          {/* Logo desktop */}
        {/* <div className="flex items-center ml-6">
            <div className="mr-3">
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                className="text-primary"
              >
                <defs>
                  <linearGradient
                    id="logoGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="50%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#eab308" />
                  </linearGradient>
                </defs>
                <path
                  d="M8 14c0-2.5 1.5-4.5 4-5.5C12.5 6.5 14.5 5 17 5s4.5 1.5 5 3.5c2.5 1 4 3 4 5.5v2c0 1-0.5 2-1.5 2.5v6c0 1.5-1 2.5-2.5 2.5h-12c-1.5 0-2.5-1-2.5-2.5v-6C7.5 18 7 17 7 16v-2z"
                  fill="url(#logoGradient)"
                />
                <rect
                  x="8"
                  y="18"
                  width="16"
                  height="2"
                  fill="white"
                  opacity="0.8"
                  rx="1"
                />
                <circle cx="12" cy="12" r="1" fill="white" opacity="0.6" />
                <circle cx="17" cy="10" r="1" fill="white" opacity="0.6" />
                <circle cx="22" cy="12" r="1" fill="white" opacity="0.6" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">PâtissLab</h1>
              <p className="text-xs text-gray-500 font-medium">Gestion Pro</p>
            </div>
          </div> */}

          {/* User Info */}
          {user && (
            <div className="mt-2 px-4">
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

          {/* Navigation avec Accordéon */}
          <nav className="mt-6 flex-1 px-2 space-y-2 overflow-y-auto">
            {sortedGroupEntries.map(([groupName, groupItems]) => {
              const isExpanded = shouldGroupBeExpanded(groupItems, groupName);
              const groupActive = isGroupActive(groupItems);
              
              return (
                <div key={groupName} className="mb-2">
                  {/* Group Header - Accordéon */}
                  <button
                    onClick={() => toggleGroup(groupName)}
                    className={`w-full flex items-center justify-between px-3 py-4 border-gray-100 border bg-slate-50   text-sm font-semibold rounded-md transition-all duration-200 ease-in-out ${
                      groupActive 
                        ? " text-blue-700" 
                        : "text-gray-700 hover:bg-blue-200"
                    }`}
                  >
                    <span className="uppercase tracking-wider text-xs">
                      {getGroupDisplayName(groupName)}
                    </span>
                    <div className="flex items-center">
                      {groupActive && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                      )}
                    </div>
                  </button>

                  {/* Group Items */}
                  {isExpanded && (
                    <div className="ml-4 space-y-1 mt-1">
                      {groupItems.map((item) => (
                        <div key={item.path}>
                          <Link href={item.path} onClick={handleNavigation}>
                            <div
                              className={`relative flex border border-gray-50 items-center px-3 py-2 text-sm rounded-md transition-all duration-150 ease-in-out cursor-pointer ${
                                isActive(item.path)
                                  ? "bg-blue-200 text-blue-700 font-semibold shadow-sm"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                            >
                              {item.lucideIcon && (
                                <item.lucideIcon
                                  className={`mr-3 h-4 w-4 ${
                                    isActive(item.path) ? "text-white" : "text-gray-400"
                                  }`}
                                />
                              )}
                              <span className="truncate">{item.label}</span>
                              {isActive(item.path) && (
                                <div className="absolute right-2 w-2 h-2 bg-white rounded-full"></div>
                              )}
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={logout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}