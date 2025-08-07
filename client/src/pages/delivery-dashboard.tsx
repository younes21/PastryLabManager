import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);

  // Fetch deliveries assigned to current user
  const { data: assignedDeliveries, isLoading: assignedLoading } = useQuery({
    queryKey: ["/api/deliveries", user?.id, "assigned"],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries?delivererId=${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  // Fetch all available deliveries (not assigned)
  const { data: availableDeliveries, isLoading: availableLoading } = useQuery({
    queryKey: ["/api/deliveries", "available"],
    queryFn: async () => {
      const response = await fetch("/api/deliveries?status=assigned&available=true");
      return response.json();
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ deliveryId, updateData }: { deliveryId: number; updateData: any }) => {
      const response = await apiRequest("PATCH", `/api/deliveries/${deliveryId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Livraison mise à jour",
        description: "Le statut de la livraison a été mis à jour.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la livraison.",
        variant: "destructive",
      });
    },
  });

  const acceptDeliveryMutation = useMutation({
    mutationFn: async (deliveryId: number) => {
      const response = await apiRequest("PATCH", `/api/deliveries/${deliveryId}`, {
        delivererId: user?.id,
        status: "assigned",
        assignedAt: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Livraison acceptée",
        description: "La livraison a été assignée à votre planning.",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { label: "Assignée", variant: "secondary" as const },
      in_transit: { label: "En transit", variant: "default" as const },
      delivered: { label: "Livrée", variant: "outline" as const },
      failed: { label: "Échec", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusUpdate = (deliveryId: number, status: string, additionalData?: any) => {
    const updateData = { status, ...additionalData };
    
    if (status === "in_transit") {
      updateData.startTime = new Date().toISOString();
    } else if (status === "delivered") {
      updateData.deliveredAt = new Date().toISOString();
    }

    updateDeliveryMutation.mutate({ deliveryId, updateData });
  };

  const DeliveryCard = ({ delivery, showActions = true }: { delivery: any; showActions?: boolean }) => (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">Commande #{delivery.orderId}</h3>
          <p className="text-sm text-gray-600">Client: {delivery.order?.customerName}</p>
        </div>
        <div className="text-right">
          {getStatusBadge(delivery.status)}
          <div className="text-lg font-bold mt-1">{parseFloat(delivery.order?.totalAmount || "0").toFixed(2)} DA</div>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center text-gray-600">
          <i className="fas fa-map-marker-alt mr-2 w-4"></i>
          {delivery.order?.deliveryAddress || "Adresse non spécifiée"}
        </div>
        <div className="flex items-center text-gray-600">
          <i className="fas fa-phone mr-2 w-4"></i>
          {delivery.order?.customerPhone || "Téléphone non spécifié"}
        </div>
        <div className="flex items-center text-gray-600">
          <i className="fas fa-clock mr-2 w-4"></i>
          Assignée le {formatDateTime(delivery.assignedAt)}
        </div>
        {delivery.deliveredAt && (
          <div className="flex items-center text-green-600">
            <i className="fas fa-check mr-2 w-4"></i>
            Livrée le {formatDateTime(delivery.deliveredAt)}
          </div>
        )}
      </div>

      {delivery.notes && (
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-sm font-medium mb-1">Notes:</p>
          <p className="text-sm text-gray-600">{delivery.notes}</p>
        </div>
      )}

      {showActions && (
        <div className="flex space-x-2">
          {delivery.status === "assigned" && (
            <Button
              size="sm"
              onClick={() => handleStatusUpdate(delivery.id, "in_transit")}
              disabled={updateDeliveryMutation.isPending}
            >
              <i className="fas fa-truck mr-1"></i>
              Commencer livraison
            </Button>
          )}
          {delivery.status === "in_transit" && (
            <>
              <Button
                size="sm"
                onClick={() => handleStatusUpdate(delivery.id, "delivered", { deliveredAt: new Date().toISOString() })}
                disabled={updateDeliveryMutation.isPending}
              >
                <i className="fas fa-check mr-1"></i>
                Marquer livrée
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleStatusUpdate(delivery.id, "failed")}
                disabled={updateDeliveryMutation.isPending}
              >
                <i className="fas fa-times mr-1"></i>
                Échec
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Layout title="Espace Livreur">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bonjour {user?.firstName} !</h1>
            <p className="text-gray-600">Gérez vos livraisons</p>
          </div>
        </div>

        <Tabs defaultValue="assigned" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assigned">Mes Livraisons ({assignedDeliveries?.filter((d: any) => d.status !== "delivered").length || 0})</TabsTrigger>
            <TabsTrigger value="available">Disponibles ({availableDeliveries?.length || 0})</TabsTrigger>
            <TabsTrigger value="completed">Terminées</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned">
            <Card>
              <CardHeader>
                <CardTitle>Mes Livraisons Assignées</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedLoading ? (
                  <div className="text-center py-8">Chargement des livraisons...</div>
                ) : assignedDeliveries?.filter((d: any) => d.status !== "delivered").length > 0 ? (
                  <div className="space-y-4">
                    {assignedDeliveries
                      .filter((d: any) => d.status !== "delivered")
                      .map((delivery: any) => (
                        <DeliveryCard key={delivery.id} delivery={delivery} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-truck text-4xl text-gray-300 mb-4"></i>
                    <p className="text-lg font-medium mb-2">Aucune livraison assignée</p>
                    <p className="text-sm text-gray-600">Consultez les livraisons disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="available">
            <Card>
              <CardHeader>
                <CardTitle>Livraisons Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                {availableLoading ? (
                  <div className="text-center py-8">Chargement des livraisons disponibles...</div>
                ) : availableDeliveries?.length > 0 ? (
                  <div className="space-y-4">
                    {availableDeliveries.map((delivery: any) => (
                      <div key={delivery.id} className="border rounded-lg p-4 space-y-3">
                        <DeliveryCard delivery={delivery} showActions={false} />
                        <div className="border-t pt-3">
                          <Button
                            onClick={() => acceptDeliveryMutation.mutate(delivery.id)}
                            disabled={acceptDeliveryMutation.isPending}
                            className="w-full"
                          >
                            <i className="fas fa-hand-paper mr-2"></i>
                            Accepter cette livraison
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-clipboard-check text-4xl text-gray-300 mb-4"></i>
                    <p className="text-lg font-medium mb-2">Aucune livraison disponible</p>
                    <p className="text-sm text-gray-600">Revenez plus tard pour de nouvelles livraisons</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Livraisons Terminées</CardTitle>
              </CardHeader>
              <CardContent>
                {assignedLoading ? (
                  <div className="text-center py-8">Chargement de l'historique...</div>
                ) : assignedDeliveries?.filter((d: any) => d.status === "delivered").length > 0 ? (
                  <div className="space-y-4">
                    {assignedDeliveries
                      .filter((d: any) => d.status === "delivered")
                      .map((delivery: any) => (
                        <DeliveryCard key={delivery.id} delivery={delivery} showActions={false} />
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-history text-4xl text-gray-300 mb-4"></i>
                    <p className="text-lg font-medium mb-2">Aucune livraison terminée</p>
                    <p className="text-sm text-gray-600">Vos livraisons terminées apparaîtront ici</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}