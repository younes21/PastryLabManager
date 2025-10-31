import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Map } from "lucide-react";
import { useLocation } from "wouter";

export default function DeliveryMapPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Récupérer les livraisons du livreur
  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["/api/deliveries/livreur", user?.id],
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-500 text-white p-4">
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={() => setLocation("/delivery/home")}
            className="text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Carte de tournée</h1>
        </div>
      </div>

      <div className="relative">
        {/* Simulation de carte */}
        <div className="h-96 bg-gradient-to-br from-green-100 to-blue-100 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <Map className="w-16 h-16 text-gray-400" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-600 bg-white px-4 py-2 rounded-lg shadow">
              Carte interactive (à implémenter)
            </p>
          </div>
        </div>

        {/* Liste horizontale */}
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-3">
            {deliveries.map((delivery: any) => {
              const clientName = delivery.client?.firstName && delivery.client?.lastName
                ? `${delivery.client.firstName} ${delivery.client.lastName}`
                : delivery.client?.companyName || 'Client inconnu';
              
              const address = delivery.client?.address && delivery.client?.city
                ? `${delivery.client.address}, ${delivery.client.postalCode || ''} ${delivery.client.city}`
                : 'Adresse non renseignée';

              const getStatusColor = (status: string) => {
                if (status === 'delivered' || status === 'partially_delivered') return 'bg-green-500';
                if (status === 'in_progress') return 'bg-orange-500';
                if (status === 'cancelled') return 'bg-red-500';
                return 'bg-gray-400';
              };

              return (
                <div 
                  key={delivery.id}
                  onClick={() => setLocation(`/delivery/detail/${delivery.id}`)}
                  className="flex-shrink-0 w-64 bg-white rounded-xl shadow-sm p-3 cursor-pointer"
                  data-testid={`card-map-delivery-${delivery.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{clientName}</span>
                    <span className={`w-3 h-3 rounded-full ${getStatusColor(delivery.statusDeliveryPerson || 'pending')}`}></span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{address}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {delivery.scheduledDate 
                      ? new Date(delivery.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                      : 'N/A'
                    }
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
