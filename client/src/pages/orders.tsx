import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Orders() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    deliveryAddress: "",
    deliveryDate: "",
    deliveryTime: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/orders"],
  });

  const { data: orderItems } = useQuery({
    queryKey: ["/api/orders", selectedOrder?.id, "items"],
    enabled: !!selectedOrder?.id,
  });

  const { data: recipes } = useQuery({
    queryKey: ["/api/recipes/active"],
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Commande créée",
        description: "La commande a été créée avec succès.",
      });
      closeModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la commande.",
        variant: "destructive",
      });
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/orders/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la commande a été mis à jour.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    },
  });

  const openModal = () => {
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      deliveryAddress: "",
      deliveryDate: "",
      deliveryTime: "",
      notes: ""
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customerName || !formData.customerEmail) {
      toast({
        title: "Erreur",
        description: "Le nom et l'email du client sont obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      ...formData,
      totalAmount: "0", // Will be calculated when items are added
      status: "pending",
      deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate).toISOString() : null
    };

    createOrderMutation.mutate(orderData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "En attente", variant: "secondary" as const },
      confirmed: { label: "Confirmée", variant: "default" as const },
      preparation: { label: "En préparation", variant: "default" as const },
      ready: { label: "Prête", variant: "outline" as const },
      in_delivery: { label: "En livraison", variant: "default" as const },
      delivered: { label: "Livrée", variant: "default" as const },
      cancelled: { label: "Annulée", variant: "destructive" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      pending: "confirmed",
      confirmed: "preparation",
      preparation: "ready",
      ready: "in_delivery",
      in_delivery: "delivered"
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getNextStatusLabel = (currentStatus: string) => {
    const statusLabels = {
      pending: "Confirmer",
      confirmed: "Démarrer préparation",
      preparation: "Marquer prêt",
      ready: "Démarrer livraison",
      in_delivery: "Marquer livré"
    };
    return statusLabels[currentStatus as keyof typeof statusLabels];
  };

  if (isLoading) {
    return (
      <Layout title="Commandes">
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Commandes">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <Button onClick={openModal}>
            <i className="fas fa-plus mr-2"></i>
            Nouvelle Commande
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {orders && orders.length > 0 ? (
                    orders.map((order: any) => (
                      <div
                        key={order.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedOrder?.id === order.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedOrder(order)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Commande #{order.id}
                            </h3>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                          </div>
                          <div className="text-right">
                            {getStatusBadge(order.status)}
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {order.totalAmount}€
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{formatDateTime(order.createdAt)}</span>
                          {order.deliveryDate && (
                            <span>Livraison: {formatDate(order.deliveryDate)}</span>
                          )}
                        </div>
                        
                        {order.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">
                            {order.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <i className="fas fa-shopping-cart text-4xl text-gray-300 mb-4"></i>
                      <p className="text-lg font-medium text-gray-500 mb-2">Aucune commande</p>
                      <p className="text-sm text-gray-400">Cliquez sur "Nouvelle Commande" pour commencer</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            {selectedOrder ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    Commande #{selectedOrder.id}
                    {getNextStatus(selectedOrder.status) && (
                      <Button 
                        size="sm"
                        onClick={() => updateOrderStatusMutation.mutate({
                          id: selectedOrder.id,
                          status: getNextStatus(selectedOrder.status)
                        })}
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        {getNextStatusLabel(selectedOrder.status)}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Informations Client</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Nom:</span> {selectedOrder.customerName}</p>
                        <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail}</p>
                        {selectedOrder.customerPhone && (
                          <p><span className="font-medium">Téléphone:</span> {selectedOrder.customerPhone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Statut</h4>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                    
                    {selectedOrder.deliveryAddress && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Adresse de livraison</h4>
                        <p className="text-sm text-gray-600">{selectedOrder.deliveryAddress}</p>
                      </div>
                    )}
                    
                    {selectedOrder.deliveryDate && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Date de livraison</h4>
                        <p className="text-sm text-gray-600">
                          {formatDate(selectedOrder.deliveryDate)}
                          {selectedOrder.deliveryTime && ` à ${selectedOrder.deliveryTime}`}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Articles</h4>
                      {orderItems && orderItems.length > 0 ? (
                        <div className="space-y-2">
                          {orderItems.map((item: any) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                              <span>{item.recipe?.name || "Produit supprimé"}</span>
                              <span className="font-medium">
                                {item.quantity}x {item.unitPrice}€
                              </span>
                            </div>
                          ))}
                          <div className="border-t pt-2 flex justify-between items-center font-medium">
                            <span>Total</span>
                            <span>{selectedOrder.totalAmount}€</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Aucun article ajouté</p>
                      )}
                    </div>
                    
                    {selectedOrder.notes && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                        <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      <p>Créée le {formatDateTime(selectedOrder.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Sélectionnez une commande pour voir les détails
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Create Order Modal */}
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nouvelle Commande</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">Nom du client *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerEmail">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="customerPhone">Téléphone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="deliveryTime">Heure de livraison</Label>
                  <Input
                    id="deliveryTime"
                    value={formData.deliveryTime}
                    onChange={(e) => setFormData({...formData, deliveryTime: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="deliveryAddress">Adresse de livraison</Label>
                <Textarea
                  id="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="deliveryDate">Date de livraison</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({...formData, deliveryDate: e.target.value})}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Annuler
                </Button>
                <Button type="submit" disabled={createOrderMutation.isPending}>
                  {createOrderMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
