
// ===================================================

// 2. Modifier votre Layout existant
// components/Layout.tsx
import { useLayout } from "@/contexts/LayoutContext";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/lib/auth";
import { Menu, Bell, X } from "lucide-react";
import { useEffect } from "react";


interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const { title, sidebarOpen, toggleSidebar, closeSidebar } = useLayout(); // Récupérer le titre et l'état de la sidebar depuis le context

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Fermer la sidebar sur mobile quand on clique sur l'overlay
  const handleOverlayClick = () => {
    closeSidebar();
  };


  return (
    <div className="min-h-full flex">
      {/* Sidebar - Position fixe sur mobile, relative sur desktop */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out xl:relative xl:z-auto xl:flex-shrink-0 ${
        sidebarOpen ? 'translate-x-0 xl:translate-x-0' : '-translate-x-full xl:-translate-x-64'
      }`}>
        <Sidebar />
      </div>
      
      {/* Overlay sombre pour mobile uniquement */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 xl:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Contenu principal avec animation synchronisée */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'xl:ml-0' : 'xl:-ml-64'
      }`}>
        {/* Top Navigation */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 pl-1 pr-4 py-1 sm:pl-3 sm:pr-6 lg:pr-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              {/* Bouton menu amélioré */}
              <button 
                className=" -mr-2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200  "
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
                aria-expanded={sidebarOpen}
              >
               <Menu className="h-6 w-6" />
              </button>
              
              {/* Le titre vient maintenant du context */}
              <h2 className="ml-4 text-2xl font-semibold text-gray-900">{title}</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-400"></span>
              </button>
              
              {/* Profile */}
              {user && (
                <div className="relative">
                  <button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {getInitials(user.firstName, user.lastName)}
                      </span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
  
        {/* Main Content Area */}
        <main className="flex-1 min-h-[calc(100vh-73px)] pb-8 bg-gradient-to-br from-orange-50 to-amber-50">
          {children}
        </main>
      </div>
    </div>
  );
}