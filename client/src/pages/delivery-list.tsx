import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Search, MapPin, Clock, Navigation, CheckCircle, RefreshCw, XCircle, ChevronRight, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

export default function DeliveryListPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();

  // Récupérer les livraisons du livreur
  const { data: deliveries = [], isLoading } = useQuery({
    queryKey: ["/api/deliveries/livreur", user?.id],
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'partially_delivered': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'delivered': return <CheckCircle className="w-4 h-4" />;
      case 'partially_delivered': return <CheckCircle className="w-4 h-4" />;
      case 'in_progress': return <RefreshCw className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case 'delivered': return 'Livrée';
      case 'partially_delivered': return 'Livré partiellement';
      case 'in_progress': return 'En cours';
      case 'cancelled': return 'Annulée';
      case 'pending': return 'En attente';
      default: return 'En attente';
    }
  };

  // Filtrer les livraisons
  const filteredDeliveries = deliveries.filter((delivery: any) => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = delivery.client?.firstName && delivery.client?.lastName
      ? `${delivery.client.firstName} ${delivery.client.lastName}`
      : delivery.client?.companyName || '';
    
    return (
      delivery.code?.toLowerCase().includes(searchLower) ||
      delivery.order?.code?.toLowerCase().includes(searchLower) ||
      clientName.toLowerCase().includes(searchLower)
    );
  });

  // Trier par statusDeliveryPerson puis par heure de livraison
  const sortedDeliveries = [...filteredDeliveries].sort((a: any, b: any) => {
    const statusOrder = ['pending', 'in_progress', 'delivered', 'partially_delivered', 'cancelled'];
    const aStatusIndex = statusOrder.indexOf(a.statusDeliveryPerson || 'pending');
    const bStatusIndex = statusOrder.indexOf(b.statusDeliveryPerson || 'pending');
    
    if (aStatusIndex !== bStatusIndex) {
      return aStatusIndex - bStatusIndex;
    }
    
    return new Date(a.scheduledDate || 0).getTime() - new Date(b.scheduledDate || 0).getTime();
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={() => setLocation("/delivery/home")}
            className="text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Mes livraisons</h1>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            type="text"
            placeholder="Code commande, code livraison, nom client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800"
            data-testid="input-search"
          />
        </div>
      </div>

      {/* Liste des livraisons */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div>Chargement...</div>
        ) : sortedDeliveries.length === 0 ? (
          <div className="text-center text-gray-500 py-10" data-testid="text-no-deliveries">
            Aucune livraison trouvée
          </div>
        ) : (
          sortedDeliveries.map((delivery: any) => {
            const clientName = delivery.client?.firstName && delivery.client?.lastName
              ? `${delivery.client.firstName} ${delivery.client.lastName}`
              : delivery.client?.companyName || 'Client inconnu';
            
            const address = delivery.client?.address && delivery.client?.city
              ? `${delivery.client.address}, ${delivery.client.postalCode || ''} ${delivery.client.city}${delivery.client.wilaya ? ', ' + delivery.client.wilaya : ''}`
              : 'Adresse non renseignée';

            return (
              <Link key={delivery.id} href={`/delivery/detail/${delivery.id}`}>
                <div 
                  className="bg-white rounded-xl shadow-sm p-4 active:scale-98 transition cursor-pointer"
                  data-testid={`card-delivery-${delivery.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800" data-testid={`text-client-name-${delivery.id}`}>
                        {clientName}
                      </h3>
                      <p className="text-sm text-gray-500" data-testid={`text-order-code-${delivery.id}`}>
                        Commande: {delivery.order?.code || 'N/A'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Livraison: {delivery.code}
                      </p>
                    </div>
                    <span 
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(delivery.statusDeliveryPerson || 'pending')}`}
                      data-testid={`badge-status-${delivery.id}`}
                    >
                      {getStatusIcon(delivery.statusDeliveryPerson || 'pending')}
                      {getStatusText(delivery.statusDeliveryPerson || 'pending')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="line-clamp-1">{address}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        {delivery.scheduledDate 
                          ? new Date(delivery.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <span className="font-bold text-green-600">
                      {parseFloat(delivery.totalTTC || 0).toLocaleString()} DA
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
