import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export default function Delivery() {
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter deliveries based on user role
  const deliveriesQuery = user?.role === "livreur" 
    ? { queryKey: [`/api/deliveries/deliverer/${user.id}`] }
    : { queryKey: ["/api/deliveries"] };

  const { data: deliveries, isLoading } = useQuery(deliveriesQuery);

  const { data: orders } = useQuery({
    queryKey: ["/api/orders"],
    select: (orders: any[]) => orders.filter(order => 
      order.status === "ready" || order.status === "in_delivery"
    )
  });

  const createDeliveryMutation = useMutation({
    mutationFn: async (deliveryData: any) => {
      const response = await apiRequest("POST", "/api/deliveries", deliveryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Livraison assignée",
        description: "La livraison a été assignée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner la livraison.",
        variant: "destructive",
      });
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/deliveries/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
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

  const assignDelivery = (orderId: number) => {
    if (!user) return;
    
    createDeliveryMutation.mutate({
      orderId,
      delivererId: user.id,
      status: "assigned"
    });
  };

  const startDelivery = (deliveryId: number) => {
    updateDeliveryMutation.mutate({
      id: deliveryId,
      data: { status: "in_transit" }
    });
  };

  const completeDelivery = (deliveryId: number) => {
    setSelectedDelivery(deliveries?.find((d: any) => d.id === deliveryId));
    setIsPaymentModalOpen(true);
  };

  const confirmDelivery = () => {
    if (!selectedDelivery) return;

    updateDeliveryMutation.mutate({
      id: selectedDelivery.id,
      data: { 
        status: "delivered",
        deliveredAt: new Date().toISOString(),
        paymentReceived: paymentAmount || "0"
      }
    });

    // Also update order status
    queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
    
    setIsPaymentModalOpen(false);
    setPaymentAmount("");
    setSelectedDelivery(null);
  };

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
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (isLoading) {
    return (
      <Layout title="Livraisons">
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Livraisons">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {user?.role === "livreur" ? "Mes Livraisons" : "Gestion des Livraisons"}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Available Orders (for assignment) */}
          {user?.role !== "livreur" && (
            <Card>
              <CardHeader>
                <CardTitle>Commandes Prêtes à Livrer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders && orders.length > 0 ? (
                    orders.filter((order: any) => order.status === "ready").map((order: any) => (
                      <div key={order.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Commande #{order.id}
                            </h3>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                            <p className="text-sm text-gray-500">{order.deliveryAddress}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{order.totalAmount}€</p>
                            <Button 
                              size="sm" 
                              className="mt-1"
                              onClick={() => assignDelivery(order.id)}
                              disabled={createDeliveryMutation.isPending}
                            >
                              Assigner
                            </Button>
                          </div>
                        </div>
                        {order.deliveryDate && (
                          <p className="text-xs text-gray-500">
                            Livraison prévue: {formatDateTime(order.deliveryDate)}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-truck text-4xl text-gray-300 mb-4"></i>
                      <p className="text-gray-500">Aucune commande prête à livrer</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Deliveries */}
          <Card className={user?.role === "livreur" ? "lg:col-span-2" : ""}>
            <CardHeader>
              <CardTitle>
                {user?.role === "livreur" ? "Mes Livraisons Actives" : "Livraisons en Cours"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliveries && deliveries.length > 0 ? (
                  deliveries.map((delivery: any) => (
                    <div key={delivery.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">
                              Commande #{delivery.orderId}
                            </h3>
                            {getStatusBadge(delivery.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            Assignée le {formatDateTime(delivery.assignedAt)}
                          </p>
                          {delivery.deliveredAt && (
                            <p className="text-sm text-gray-600">
                              Livrée le {formatDateTime(delivery.deliveredAt)}
                            </p>
                          )}
                          {delivery.paymentReceived && (
                            <p className="text-sm text-green-600 font-medium">
                              Paiement encaissé: {delivery.paymentReceived}€
                            </p>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          {delivery.status === "assigned" && (
                            <Button 
                              size="sm"
                              onClick={() => startDelivery(delivery.id)}
                              disabled={updateDeliveryMutation.isPending}
                            >
                              <i className="fas fa-play mr-1"></i>
                              Démarrer
                            </Button>
                          )}
                          {delivery.status === "in_transit" && (
                            <Button 
                              size="sm"
                              onClick={() => completeDelivery(delivery.id)}
                              disabled={updateDeliveryMutation.isPending}
                            >
                              <i className="fas fa-check mr-1"></i>
                              Livré
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {delivery.notes && (
                        <p className="text-sm text-gray-600 italic border-t pt-2">
                          Notes: {delivery.notes}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <i className="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">
                      {user?.role === "livreur" 
                        ? "Aucune livraison assignée" 
                        : "Aucune livraison en cours"
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Modal */}
        <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirmer la Livraison</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Commande #{selectedDelivery?.orderId} livrée avec succès.
              </p>
              
              <div>
                <Label htmlFor="paymentAmount">Montant encaissé (€)</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsPaymentModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={confirmDelivery}
                  disabled={updateDeliveryMutation.isPending}
                >
                  Confirmer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
