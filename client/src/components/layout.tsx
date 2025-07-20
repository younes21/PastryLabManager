import { Sidebar } from "./sidebar";
import { useAuth } from "@/lib/auth";
import { Menu, Bell } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title = "Tableau de bord" }: LayoutProps) {
  const { user } = useAuth();

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="min-h-full">
      <Sidebar />
      
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top Navigation */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pl-1 pr-4 py-1 sm:pl-3 sm:pr-6 lg:pr-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button className="lg:hidden -mr-2 p-2 text-gray-400 hover:text-gray-600">
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="ml-4 text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
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
        <main className="flex-1 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
