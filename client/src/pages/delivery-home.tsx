import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Package, Clock, CheckCircle, RefreshCw, XCircle, User, ChevronRight, Bell } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function DeliveryHomePage() {
  const { user } = useAuth();

  // Récupérer les statistiques des livraisons du jour
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/deliveries/stats", user?.id],
  });

  const currentDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const currentTime = new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec informations du livreur */}
      <div className="bg-blue-500 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-blue-600" data-testid="icon-user-avatar" />
          </div>
          <div>
            <h2 className="text-xl font-bold" data-testid="text-delivery-name">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-blue-100 text-sm" data-testid="text-delivery-role">Livreur</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4" />
          <span data-testid="text-current-datetime">{currentDate} - {currentTime}</span>
        </div>
      </div>

      {/* Statistiques du jour */}
      <div className="px-4 py-6">
        <h3 className="font-bold text-gray-800 mb-3 text-lg">Résumé du jour</h3>
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl shadow-sm" data-testid="card-stat-total">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {stats?.total || 0}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="bg-green-50 p-4 rounded-xl shadow-sm" data-testid="card-stat-delivered">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-3xl font-bold text-green-600">
                  {stats?.delivered || 0}
                </span>
              </div>
              <div className="text-sm text-gray-600">Livrées</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl shadow-sm" data-testid="card-stat-in-progress">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-6 h-6 text-orange-600" />
                <span className="text-3xl font-bold text-orange-600">
                  {stats?.inProgress || 0}
                </span>
              </div>
              <div className="text-sm text-gray-600">En cours</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl shadow-sm" data-testid="card-stat-pending">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-6 h-6 text-gray-600" />
                <span className="text-3xl font-bold text-gray-600">
                  {stats?.pending || 0}
                </span>
              </div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="bg-red-50 p-4 rounded-xl shadow-sm col-span-2" data-testid="card-stat-cancelled">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="text-3xl font-bold text-red-600">
                  {stats?.cancelled || 0}
                </span>
              </div>
              <div className="text-sm text-gray-600">Annulées</div>
            </div>
          </div>
        )}
      </div>

      {/* Actions rapides */}
      <div className="px-4 pb-20">
        <h3 className="font-bold text-gray-800 mb-3 text-lg">Actions rapides</h3>
        <div className="space-y-2">
          <Link href="/delivery/list">
            <button 
              className="w-full bg-blue-500 text-white p-4 rounded-xl flex items-center justify-between shadow-lg active:scale-95 transition"
              data-testid="button-view-deliveries"
            >
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6" />
                <span className="font-semibold">Voir mes livraisons</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>
          
          <Link href="/delivery/payments">
            <button 
              className="w-full bg-white text-gray-800 p-4 rounded-xl flex items-center justify-between shadow active:scale-95 transition"
              data-testid="button-view-payments"
            >
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-green-600" />
                <span className="font-semibold">Paiements</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>

          <Link href="/delivery/profile">
            <button 
              className="w-full bg-white text-gray-800 p-4 rounded-xl flex items-center justify-between shadow active:scale-95 transition"
              data-testid="button-view-profile"
            >
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                <span className="font-semibold">Mon profil</span>
              </div>
              <ChevronRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
