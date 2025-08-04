import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChefHat, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface ClientLayoutProps {
  children: ReactNode;
  title?: string;
}

export function ClientLayout({ children, title = "Espace Client" }: ClientLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">
                  Laboratoire Pâtisserie
                </h1>
                <p className="text-sm text-gray-500">{title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Retour au menu principal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
    </div>
  );
}