import { useAuth } from "@/lib/auth";
import { ArrowLeft, User, Mail, Phone, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DeliveryProfilePage() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-500 text-white p-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setLocation("/delivery/home")}
            className="text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Mon profil</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Avatar et nom */}
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <User className="w-16 h-16 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold" data-testid="text-profile-name">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-500" data-testid="text-profile-role">Livreur</p>
          </CardContent>
        </Card>

        {/* Informations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Nom d'utilisateur</p>
                <p className="font-semibold" data-testid="text-profile-username">{user.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold" data-testid="text-profile-email">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
