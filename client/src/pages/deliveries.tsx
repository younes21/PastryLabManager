import React, { useState, useEffect } from "react";
import {
  Save,
  X,
  FileText,
  Edit3,
  Trash2,
  Package,
  Truck,
  ArrowLeft,
  Eye,
  User,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Plus,
  CreditCard,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { 
  InventoryOperation, 
  InventoryOperationItem, 
  Client, 
  Order, 
  Article 
} from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DeliverySplitModal } from "@/components/delivery-split-modal";
import { CancellationDetails } from '@/components/delivery-cancellation-details';
import { CancellationModal } from '@/pages/delivery-cancellations';
import { DeliveryPaymentDetails } from "@/components/delivery-payment-details";
import { DeliveryAssignmentModal } from "@/components/delivery-assignment-modal";
import { DeliveryPackagesModal } from "@/components/delivery-packages-modal";
import { DeliveryTrackingModal } from "@/components/delivery-tracking-modal";
import { DeliveryPaymentModal } from "@/components/delivery-payment-modal";

export default function DeliveriesPage() {
  usePageTitle("Livraisons");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Récupérer le paramètre orderId de l'URL
  const [orderId, setOrderId] = useState<number | null>(null);
  
  // States
  const [currentDelivery, setCurrentDelivery] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("list");
  const [splitModal, setSplitModal] = useState<{ open: boolean, articleId: number | null }>({ open: false, articleId: null });
  const [splits, setSplits] = useState<Record<number, Array<{ lotId: number|null, fromStorageZoneId: number|null, quantity: number }>>>({});
  const [lots, setLots] = useState<any[]>([]); // à charger via API
  const [zones, setZones] = useState<any[]>([]); // à charger via API
  const [splitError, setSplitError] = useState<string>("");
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [inventoryOperations, setInventoryOperations] = useState<any[]>([]);
  
  // Nouveaux modals
  const [assignmentModal, setAssignmentModal] = useState<{ open: boolean, delivery: any }>({ open: false, delivery: null });
  const [packagesModal, setPackagesModal] = useState<{ open: boolean, delivery: any }>({ open: false, delivery: null });
  const [trackingModal, setTrackingModal] = useState<{ open: boolean, delivery: any }>({ open: false, delivery: null });
  const [paymentModal, setPaymentModal] = useState<{ open: boolean, delivery: any }>({ open: false, delivery: null });

  const [orderIdFilter, setOrderIdFilter] = useState<string>('all');
  const [clientIdFilter, setClientIdFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');


  // Récupérer le paramètre orderId de l'URL au chargement de la page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderIdParam = urlParams.get('orderId');
    if (orderIdParam) {
      setOrderId(parseInt(orderIdParam));
    }
  }, []);

  // Charger lots et zones au montage
  useEffect(() => {
    fetch('/api/lots').then(r => r.json()).then(setLots);
    fetch('/api/storage-zones').then(r => r.json()).then(setZones);
  }, []);

  // Charger les opérations d'inventaire pour la traçabilité
  useEffect(() => {
    fetch('/api/inventory-operations').then(r => r.json()).then(setInventoryOperations);
  }, []);

  // Queries
  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<any[]>({
    queryKey: ["/api/deliveries", { orderId }],
    queryFn: async () => {
      let url = "/api/deliveries";
      if (orderId) {
        url += `?orderId=${orderId}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch deliveries");
      return response.json();
    },
    enabled: true,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  // Query pour récupérer la commande spécifique si orderId est présent
  const { data: currentOrder } = useQuery<Order>({
    queryKey: ["/api/orders", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await fetch(`/api/orders/${orderId}`);
      if (!response.ok) throw new Error("Failed to fetch order");
      return response.json();
    },
    enabled: !!orderId,
  });

  // Query pour récupérer les articles de la commande si orderId est présent
  const { data: orderItems = [] } = useQuery<any[]>({
    queryKey: ["/api/orders", orderId, "items"],
    queryFn: async () => {
      if (!orderId) return [];
      const response = await fetch(`/api/orders/${orderId}/items`);
      if (!response.ok) throw new Error("Failed to fetch order items");
      return response.json();
    },
    enabled: !!orderId,
  });

  // Mutations
  const createDeliveryMutation = useMutation({
    mutationFn: async (data: { deliveryData: any, orderItems: any[], splits?: any }) => {
      return await apiRequest("/api/deliveries/with-items", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({ 
        title: "Livraison créée",
        description: "La livraison a été créée avec succès"
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Erreur lors de la création",
        variant: "destructive" 
      });
    },
  });

  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest(`/api/deliveries/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({ 
        title: "Livraison mise à jour",
        description: "La livraison a été modifiée avec succès"
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Erreur lors de la modification",
        variant: "destructive" 
      });
    },
  });

  const deleteDeliveryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/deliveries/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({ 
        title: "Livraison supprimée",
        description: "La livraison a été supprimée avec succès"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Erreur", 
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive" 
      });
    },
  });



  // Helper functions
  const resetForm = () => {
    setCurrentDelivery(null);
    setItems([]);
    setIsEditing(false);
    setIsViewing(false);
    setActiveTab("list");
  };

  const startNewDelivery = () => {
    if (orderId && currentOrder) {
      // Si on a un orderId, pré-remplir avec les données de la commande
      setCurrentDelivery({
        type: "delivery",
        status: "draft",
        clientId: currentOrder.clientId,
        orderId: orderId,
        scheduledDate: new Date().toISOString().split('T')[0],
        notes: `Livraison pour la commande ${currentOrder.code}`,
        currency: "DZD",
        // Ne plus initialiser les totaux - ils seront calculés côté serveur
      });
      
      // Pré-remplir avec les articles de la commande (exclure ceux avec quantité 0)
      setItems(orderItems
        .filter((item: any) => parseFloat(item.quantity) > 0)
        .map((item: any) => ({
          id: Date.now() + Math.random(), // Nouvel ID temporaire
          articleId: item.articleId,
          article: articles.find(a => a.id === item.articleId),
          quantity: parseFloat(item.quantity),
          // Ne plus gérer unitPrice et totalPrice côté client
          notes: item.notes || "",
        })));
    } else {
      // Formulaire vide normal
      setCurrentDelivery({
        type: "delivery",
        status: "draft",
        clientId: null,
        orderId: null,
        scheduledDate: new Date().toISOString().split('T')[0],
        notes: "",
        currency: "DZD",
        // Ne plus initialiser les totaux - ils seront calculés côté serveur
      });
      setItems([]);
    }
    setIsEditing(true);
    setIsViewing(false);
    setActiveTab("form");
  };

  const editDelivery = (delivery: InventoryOperation) => {
    setCurrentDelivery(delivery);
    // Charger les items de la livraison
    loadDeliveryItems(delivery.id);
    setIsEditing(true);
    setIsViewing(false);
    setActiveTab("form");
  };

  const viewDelivery = (delivery: InventoryOperation) => {
    setCurrentDelivery(delivery);
    loadDeliveryItems(delivery.id);
    setIsEditing(false);
    setIsViewing(true);
    setActiveTab("form");
  };

  const loadDeliveryItems = async (deliveryId: number) => {
    try {
      const response = await fetch(`/api/inventory-operations/${deliveryId}/items`);
      if (!response.ok) throw new Error("Failed to fetch delivery items");
      const deliveryItems = await response.json();
      
      setItems(deliveryItems.map((item: any) => ({
        id: item.id,
        articleId: item.articleId,
        article: articles.find(a => a.id === item.articleId),
        quantity: parseFloat(item.quantity),
        // Ne plus gérer unitPrice et totalPrice côté client
        notes: item.notes || "",
      })));
    } catch (error) {
      console.error("Erreur lors du chargement des articles:", error);
    }
  };



  const updateItemQuantity = (itemId: number | string, quantity: number) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        // Vérifier les limites avant de mettre à jour
        const orderItem = orderItems.find(oi => oi.articleId === item.articleId);
        if (orderItem) {
          const orderedQuantity = parseFloat(orderItem.quantity);
          const deliveredQuantity = getDeliveredQuantity(item.articleId, orderId || 0);
          const remainingQuantity = orderedQuantity - deliveredQuantity;
          
          // Ne pas dépasser la quantité restante ni la quantité commandée
          const finalQuantity = Math.min(quantity, remainingQuantity, orderedQuantity);
          
          return { 
            ...item, 
            quantity: finalQuantity
            // Ne plus calculer totalPrice côté client
          };
        }
      }
      return item;
    }));
  };





  // Cette fonction n'est plus utilisée car les totaux sont calculés côté serveur
  // const calculateTotals = () => {
  //   const subtotalHT = items.reduce((sum, item) => sum + item.totalPrice, 0);
  //   const totalTax = subtotalHT * 0.19; // TVA 19%
  //   const totalTTC = subtotalHT + totalTax;
  //   return { subtotalHT, totalTax, totalTTC };
  // };

  const saveDelivery = async () => {
    // Pour chaque article, la répartition doit exister et être correcte
    for (const item of items) {
      const split = splits[item.articleId];
      const sum = getSplitSum(item.articleId);
      if (!split || split.length === 0 || sum !== item.quantity || sum === 0) {
        toast({
          title: "Répartition incomplète",
          description: `Veuillez répartir correctement la quantité pour l'article ${item.article?.name}`,
          variant: "destructive"
        });
        return;
      }
    }

    if (!currentDelivery.clientId) {
      toast({
        title: "Client requis",
        description: "Veuillez sélectionner un client",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Articles requis",
        description: "Veuillez ajouter au moins un article",
        variant: "destructive"
      });
      return;
    }

    // Vérifier que les quantités ne dépassent pas les limites
    for (const item of items) {
      const orderItem = orderItems.find(oi => oi.articleId === item.articleId);
      if (orderItem) {
        const orderedQuantity = parseFloat(orderItem.quantity);
        const deliveredQuantity = getDeliveredQuantity(item.articleId, orderId || 0);
        const remainingQuantity = orderedQuantity - deliveredQuantity;
        
        if (item.quantity > remainingQuantity) {
          toast({
            title: "Quantité invalide",
            description: `La quantité pour ${item.article?.name} dépasse la quantité restante (${remainingQuantity})`,
            variant: "destructive"
          });
          return;
        }
        
        if (item.quantity > orderedQuantity) {
          toast({
            title: "Quantité invalide",
            description: `La quantité pour ${item.article?.name} dépasse la quantité commandée (${orderedQuantity})`,
            variant: "destructive"
          });
          return;
        }
      }
    }

    // Pour chaque article, si une répartition existe, utiliser les splits, sinon fallback sur item.quantity
    const allItems = items.flatMap(item => {
      if (splits[item.articleId] && splits[item.articleId].length > 0) {
        return splits[item.articleId].map(split => ({
          articleId: item.articleId,
          quantity: split.quantity.toString(),
          lotId: split.lotId,
          fromStorageZoneId: split.fromStorageZoneId,
          notes: item.notes,
        }));
      } else {
        return [{
          articleId: item.articleId,
          quantity: item.quantity.toString(),
          notes: item.notes,
        }];
      }
    });

    // Préparer les données de livraison
    const deliveryData = {
      orderId: currentDelivery.orderId,
      deliveryPersonId: currentDelivery.deliveryPersonId || null,
      scheduledDate: currentDelivery.scheduledDate || null,
      status: currentDelivery.status || "pending",
      deliveryAddress: currentDelivery.deliveryAddress || null,
      deliveryNotes: currentDelivery.notes || null,
      packageCount: currentDelivery.packageCount || 1,
      trackingNumbers: currentDelivery.trackingNumbers || null,
      createdBy: 1, // TODO: Récupérer l'ID de l'utilisateur connecté
    };

    // Préparer les orderItems pour l'API
    const orderItemsForAPI = items.map(item => ({
      id: item.id,
      articleId: item.articleId,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice || "0.000",
      taxRate: item.taxRate || "0.000",
    }));

    if (currentDelivery.id) {
      updateDeliveryMutation.mutate({ id: currentDelivery.id, data: deliveryData });
    } else {
      createDeliveryMutation.mutate({ 
        deliveryData, 
        orderItems: orderItemsForAPI, 
        splits: Object.keys(splits).length > 0 ? splits : undefined 
      });
    }
  };

  const getClientName = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return "Client inconnu";
    return client.companyName || `${client.firstName} ${client.lastName}`;
  };

  const getOrderCode = (orderId: number | null) => {
    if (!orderId) return "-";
    const order = orders.find(o => o.id === orderId);
    return order ? order.code : `CMD-${orderId}`;
  };

  // Fonction pour calculer la quantité déjà livrée pour un article donné
  const getDeliveredQuantity = (articleId: number, orderId: number) => {
    if (!orderId) return 0;
    
    // Filtrer les livraisons pour cette commande (exclure la livraison actuelle et les annulées)
    const relevantDeliveries = deliveries.filter(d => 
      d.orderId === orderId && 
      d.id !== currentDelivery?.id && 
      d.status !== 'cancelled'
    );
    
    // Pour simplifier, on retourne 0 car on n'a pas accès aux items des livraisons
    // Dans une vraie implémentation, il faudrait récupérer les items de chaque livraison
    return 0;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Brouillon" },
      pending: { variant: "default" as const, label: "En attente" },
      ready: { variant: "default" as const, label: "Prêt" },
      completed: { variant: "default" as const, label: "Livré" },
      cancelled: { variant: "destructive" as const, label: "Annulé" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { variant: "outline" as const, label: status };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  // Fonction utilitaire pour calculer la somme répartie pour un article
  const getSplitSum = (articleId: number) => (splits[articleId] || []).reduce((sum, s) => sum + (s.quantity || 0), 0);

  const handleCancelDelivery = (delivery: any) => {
    setSelectedDelivery(delivery);
    setIsCancelModalOpen(true);
  };

  const handleCancelModalSuccess = () => {
    setSelectedDelivery(null);
    setIsCancelModalOpen(false);
    // Recharger les livraisons et opérations
    queryClient.invalidateQueries({ queryKey: ["/api/inventory-operations"] });
    fetch('/api/inventory-operations').then(r => r.json()).then(setInventoryOperations);
  };

  const getRelatedOperations = (deliveryId: number) => {
    return inventoryOperations.filter(op => op.parentOperationId === deliveryId || (op.type === 'livraison' && op.orderId === deliveryId));
  };


  // Les totaux sont maintenant calculés côté serveur
  // const totals = calculateTotals();

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesOrder = orderIdFilter === 'all' || String(delivery.orderId ?? '') === orderIdFilter;
    const matchesClient = clientIdFilter === 'all' || String(delivery.clientId ?? '') === clientIdFilter;
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    // Ajoutez ici la logique de recherche si besoin
    return matchesOrder && matchesClient && matchesStatus;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Truck className="h-8 w-8" />
            Livraisons
            {orderId && (
              <span className="text-lg text-muted-foreground font-normal">
                - Commande #{orderId}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            {orderId 
              ? `Livraisons liées à la commande #${orderId}`
              : "Gestion des livraisons clients"
            }
          </p>
          {orderId && (
            <Button
              variant="outline"
              onClick={() => window.location.href = '/orders'}
              className="mt-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux commandes
            </Button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {/* Filtres avancés */}
          <Select value={orderIdFilter} onValueChange={setOrderIdFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par commande" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les commandes</SelectItem>
              {orders.map(order => (
                <SelectItem key={order.id} value={String(order.id)}>
                  {order.code} - {getClientName(order.clientId)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={clientIdFilter} onValueChange={setClientIdFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par client" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les clients</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={String(client.id)}>
                  {getClientName(client.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="ready">Prêt</SelectItem>
              <SelectItem value="completed">Livré</SelectItem>
              <SelectItem value="cancelled">Annulé</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Recherche..." className="w-64" disabled />
        </div>
        {/* Désactiver le bouton Nouvelle livraison */}
       {orderId && <Button onClick={startNewDelivery} data-testid="button-new-delivery">
          <FileText className="h-4 w-4 mr-2" />
          Nouvelle livraison
        </Button> } 
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Liste des livraisons</TabsTrigger>
          {(isEditing || isViewing) && (
            <TabsTrigger value="form">
              {isViewing ? "Détails" : isEditing && currentDelivery?.id ? "Modifier" : "Nouvelle"}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Liste des livraisons ({filteredDeliveries.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Date prévue</TableHead>
                    <TableHead>Total TTC</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Chargement des livraisons...
                      </TableCell>
                    </TableRow>
                  ) : filteredDeliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Aucune livraison trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDeliveries.map((delivery) => (
                      <TableRow key={delivery.id} data-testid={`row-delivery-${delivery.id}`}>
                        <TableCell className="font-medium">{delivery.code}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {getClientName(delivery.clientId || 0)}
                          </div>
                        </TableCell>
                        <TableCell>{getOrderCode(delivery.orderId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(delivery.scheduledDate)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {parseFloat(delivery.totalTTC || "0").toFixed(2)} DA
                        </TableCell>
                        <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewDelivery(delivery)}
                              data-testid={`button-view-delivery-${delivery.id}`}
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editDelivery(delivery)}
                              disabled={delivery.status === "completed"}
                              data-testid={`button-edit-delivery-${delivery.id}`}
                              title="Modifier"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setAssignmentModal({ open: true, delivery })}
                              title="Assigner un livreur"
                            >
                              <User className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPackagesModal({ open: true, delivery })}
                              title="Gérer les colis"
                            >
                              <Package className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTrackingModal({ open: true, delivery })}
                              title="Suivi de livraison"
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPaymentModal({ open: true, delivery })}
                              title="Paiement à la livraison"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                             <Select
                               value={delivery.status}
                               onValueChange={(newStatus) => {
                                 if (newStatus !== delivery.status) {
                                   updateDeliveryMutation.mutate({
                                     id: delivery.id,
                                     data: { status: newStatus }
                                   });
                                 }
                               }}
                               disabled={delivery.status === "completed"}
                             >
                               <SelectTrigger className="w-32">
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="draft">Brouillon</SelectItem>
                                 <SelectItem value="pending">En attente</SelectItem>
                                 <SelectItem value="ready">Prêt</SelectItem>
                                 <SelectItem value="completed">Livré</SelectItem>
                                 <SelectItem value="cancelled">Annulé</SelectItem>
                               </SelectContent>
                             </Select>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => {
                                 if (confirm("Êtes-vous sûr de vouloir supprimer cette livraison ?")) {
                                   deleteDeliveryMutation.mutate(delivery.id);
                                 }
                               }}
                               disabled={delivery.status === "completed"}
                               data-testid={`button-delete-delivery-${delivery.id}`}
                             >
                               <Trash2 className="h-4 w-4 text-red-500" />
                             </Button>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => handleCancelDelivery(delivery)}
                               disabled={delivery.status === "completed" || delivery.status === "cancelled"}
                               data-testid={`button-cancel-delivery-${delivery.id}`}
                             >
                               <X className="h-4 w-4 text-red-500" />
                             </Button>
                           </div>
                        </TableCell>
                        {delivery.status === 'cancelled' && (
                          <CancellationDetails
                            delivery={{
                              ...delivery,
                              cancellationReason: delivery.cancellationReason || undefined
                            }}
                            inventoryOperations={getRelatedOperations(delivery.id)}
                          />
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="form">
          
          {(isEditing || isViewing) && currentDelivery && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    onClick={() => setActiveTab("list")}
                    data-testid="button-back-to-list"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour à la liste
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {isViewing ? "Détails" : currentDelivery.id ? "Modifier" : "Nouvelle"} livraison
                    </h2>
                    {currentDelivery.code && (
                      <p className="text-muted-foreground">{currentDelivery.code}</p>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={resetForm}>
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                    <Button 
                      onClick={saveDelivery}
                      disabled={createDeliveryMutation.isPending || updateDeliveryMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {currentDelivery.id ? "Mettre à jour" : "Créer"}
                    </Button>
                    {currentDelivery.id && currentDelivery.status !== "completed" && (
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={async () => {
                          try {
                            await apiRequest(`/api/deliveries/${currentDelivery.id}/validate`, "POST");
                            toast({ title: "Livraison validée", description: "Le stock a été déduit et l'opération d'inventaire créée." });
                            queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
                            resetForm();
                          } catch (e: any) {
                            toast({ title: "Erreur lors de la validation", description: e?.message || "Erreur inconnue", variant: "destructive" });
                          }
                        }}
                        disabled={createDeliveryMutation.isPending || updateDeliveryMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Valider la livraison
                      </Button>
                    )}
                  </div>
                )}
              </div>
  {/* Articles */}
  <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Articles à livrer ({items.length})</span>
                    {currentDelivery.orderId && currentOrder && (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        <Package className="h-3 w-3 mr-1" />
                        Commande {currentOrder.code}
                      </Badge>
                    )}

                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                                         <TableHeader>
                       <TableRow>
                         <TableHead>Article</TableHead>
                         <TableHead>Quantité commandée</TableHead>
                         <TableHead>Quantité déjà livrée</TableHead>
                         <TableHead>Quantité restante</TableHead>
                         <TableHead>Quantité à livrer</TableHead>
                         <TableHead>Notes</TableHead>
                       </TableRow>
                     </TableHeader>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isEditing ? 4 : 4} className="text-center py-8">
                            Aucun article ajouté
                          </TableCell>
                        </TableRow>
                      ) : (
                                                 items.map((item) => {
                           // Calculer les quantités déjà livrées et restantes
                           const orderItem = orderItems.find(oi => oi.articleId === item.articleId);
                           const orderedQuantity = orderItem ? parseFloat(orderItem.quantity) : 0;
                           
                           // Calculer la quantité déjà livrée
                           const deliveredQuantity = getDeliveredQuantity(item.articleId, orderId || 0);
                           
                           const remainingQuantity = orderedQuantity - deliveredQuantity;
                           
                           return (
                             <TableRow key={item.id}>
                               <TableCell>
                                 <div>
                                   <p className="font-medium">{item.article?.name}</p>
                                   <p className="text-sm text-muted-foreground">
                                     {item.article?.code} • {item.article?.unit}
                                   </p>
                                 </div>
                               </TableCell>
                               <TableCell className="text-center">
                                 {orderedQuantity}
                               </TableCell>
                               <TableCell className="text-center">
                                 {deliveredQuantity}
                               </TableCell>
                               <TableCell className="text-center">
                                 {remainingQuantity}
                               </TableCell>
                               <TableCell>
                                 {isEditing ? (
                                   <Input
                                     type="number"
                                     min="0.01"
                                     max={remainingQuantity}
                                     step="0.01"
                                     value={item.quantity}
                                     onChange={(e) => {
                                       const newQuantity = parseFloat(e.target.value) || 0;
                                       if (newQuantity <= remainingQuantity && newQuantity <= orderedQuantity) {
                                         updateItemQuantity(item.id, newQuantity);
                                       }
                                     }}
                                     className="w-20"
                                   />
                                 ) : (
                                   item.quantity
                                 )}
                               </TableCell>
                               {/* Prix unitaire et total supprimés - calculés côté serveur */}
                               <TableCell>
                                 {isEditing ? (
                                   <Input
                                     value={item.notes}
                                     onChange={(e) => setItems(items.map(i => 
                                       i.id === item.id ? { ...i, notes: e.target.value } : i
                                     ))}
                                     placeholder="Notes..."
                                     className="w-32"
                                   />
                                 ) : (
                                   item.notes || "-"
                                 )}
                               </TableCell>
                                                               <TableCell>
                                  {getSplitSum(item.articleId) === item.quantity && splits[item.articleId]?.length > 0 ? (
                                    <>
                                      <CheckCircle className="text-green-600 inline-block mr-1" />
                                      <span className="sr-only">Répartition complète</span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertTriangle className="text-yellow-500 inline-block mr-1" />
                                      <span className="sr-only">Répartition incomplète</span>
                                    </>
                                  )}
                                  {/* Masquer le bouton "Répartir" si c'est un cas simple (livraison directe possible) */}
                                  {!splits[item.articleId] || splits[item.articleId].length === 0 ? (
                                    <Button size="sm" variant="outline" onClick={() => setSplitModal({ open: true, articleId: item.articleId })}>
                                      Répartir
                                    </Button>
                                  ) : (
                                    <span className="text-sm text-green-600 font-medium">
                                      ✓ Répartition validée
                                    </span>
                                  )}
                                </TableCell>
                             </TableRow>
                           );
                         })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              {/* Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informations générales</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    

                    {/* Affichage des informations de la commande liée */}
                    {currentDelivery.orderId && currentOrder && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Commande liée: {currentOrder.code}
                          </span>
                        </div>
                        <div className="text-xs text-blue-700 space-y-1">
                          <p>Client: {getClientName(currentOrder.clientId)}</p>
                          <p>Date de commande: {currentOrder.createdAt ? new Date(currentOrder.createdAt).toLocaleDateString('fr-FR') : 'N/A'}</p>
                          <p>Total: {parseFloat(currentOrder.totalTTC?.toString() || "0").toFixed(2)} DA</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-sm font-medium">Date prévue</label>
                      <Input
                        type="date"
                        value={currentDelivery.scheduledDate?.split('T')[0] || ""}
                        onChange={(e) => setCurrentDelivery({
                          ...currentDelivery,
                          scheduledDate: e.target.value
                        })}
                        disabled={!isEditing}
                        data-testid="input-scheduled-date"
                      />
                    </div>



                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea
                        value={currentDelivery.notes || ""}
                        onChange={(e) => setCurrentDelivery({
                          ...currentDelivery,
                          notes: e.target.value
                        })}
                        placeholder="Notes sur la livraison..."
                        disabled={!isEditing}
                        data-testid="textarea-notes"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Totals */}
                <Card>
                  <CardHeader>
                    <CardTitle>Résumé financier</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Sous-total HT</span>
                        <span>
                          {currentDelivery.subtotalHT 
                            ? parseFloat(currentDelivery.subtotalHT.toString()).toFixed(2) 
                            : "0.00"} DA
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TVA (19%)</span>
                        <span>
                          {currentDelivery.totalTax 
                            ? parseFloat(currentDelivery.totalTax.toString()).toFixed(2) 
                            : "0.00"} DA
                        </span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Total TTC</span>
                        <span>
                          {currentDelivery.totalTTC 
                            ? parseFloat(currentDelivery.totalTTC.toString()).toFixed(2) 
                            : "0.00"} DA
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Détails de paiement */}
                <DeliveryPaymentDetails deliveryId={currentDelivery.id} />
              </div>

            
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de répartition amélioré */}
      <DeliverySplitModal
        open={splitModal.open}
        onOpenChange={(open: boolean) => setSplitModal({ open, articleId: splitModal.articleId })}
        articleId={splitModal.articleId}
        articleName={splitModal.articleId ? items.find(i => i.articleId === splitModal.articleId)?.articleName || "" : ""}
        requestedQuantity={splitModal.articleId ? items.find(i => i.articleId === splitModal.articleId)?.quantity || 0 : 0}
        onSplitValidated={(newSplits: Array<{ lotId: number|null, fromStorageZoneId: number|null, quantity: number }>) => {
          if (splitModal.articleId) {
            setSplits(s => ({ ...s, [splitModal.articleId!]: newSplits }));
          }
        }}
      />
      {selectedDelivery && (
        <CancellationModal
          delivery={selectedDelivery}
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onSuccess={handleCancelModalSuccess}
        />
      )}

      {/* Nouveaux modals */}
      <DeliveryAssignmentModal
        open={assignmentModal.open}
        onOpenChange={(open) => setAssignmentModal({ open, delivery: null })}
        delivery={assignmentModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
        }}
      />

      <DeliveryPackagesModal
        open={packagesModal.open}
        onOpenChange={(open) => setPackagesModal({ open, delivery: null })}
        delivery={packagesModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
        }}
      />

      <DeliveryTrackingModal
        open={trackingModal.open}
        onOpenChange={(open) => setTrackingModal({ open, delivery: null })}
        delivery={trackingModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
        }}
      />

      <DeliveryPaymentModal
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal({ open, delivery: null })}
        delivery={paymentModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
        }}
      />
    </div>
  );
}