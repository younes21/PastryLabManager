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
  const [splits, setSplits] = useState<Record<number, Array<{ lotId: number | null, fromStorageZoneId: number | null, quantity: number }>>>({});
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [inventoryOperations, setInventoryOperations] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
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



  // Query optimisée - récupère toutes les données nécessaires en un seul appel
  const { data: pageData, isLoading: deliveriesLoading } = useQuery<{
    deliveries: any[];
    clients: any[];
    orders: Order[];
    articles: Article[];
  }>({
    queryKey: ["/api/deliveries/page-data", { orderId }],
    queryFn: async () => {
      let url = "/api/deliveries/page-data";
      if (orderId) {
        url += `?orderId=${orderId}`;
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch deliveries page data");
      const data = await response.json();

      // Adapter la structure des livraisons pour la compatibilité
      const adaptedDeliveries = data.deliveries.map((d: any) => ({
        ...d,
        scheduledDate: d.deliveryDate || d.scheduledDate, // compatibilité
        notes: d.notes,
        orderId: d.orderId,
        clientId: d.clientId,
        code: d.code,
        totalTTC: d.totalTTC,
        status: d.status,
        items: d.items,
        // autres champs si besoin
      }));

      setInventoryOperations(adaptedDeliveries);

      return {
        deliveries: adaptedDeliveries,
        clients: data.clients,
        orders: data.orders,
        articles: data.articles
      };
    },
    enabled: true,
  });

  // Extraire les données de la réponse
  const deliveries = pageData?.deliveries || [];
  const clients = pageData?.clients || [];
  const orders = pageData?.orders || [];
  const articles = pageData?.articles || [];

  // Query pour récupérer les détails de la commande avec les quantités livrées
  const { data: orderDetails } = useQuery<{
    code: string;
    client: { id: number; name: string } | null;
    orderDate: string;
    total: string;
    scheduledDate: string | null;
    note: string | null;
    items: Array<{
      articleId: number;
      article: { id: number; name: string; code: string; unit: string; unitPrice: string } | null;
      quantityOrdered: number;
      quantityDelivered: number;
      quantityRemaining: number;
    }>;
  }>({
    queryKey: ["/api/orders", orderId, "delivery-details"],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await fetch(`/api/orders/${orderId}/delivery-details`);
      if (!response.ok) throw new Error("Failed to fetch order delivery details");
      return response.json();
    },
    enabled: !!orderId,
  });

  // Extraire les données de la commande
  const currentOrder = orderDetails ? {
    id: orderId,
    code: orderDetails.code,
    clientId: orderDetails.client?.id || null,
    totalTTC: orderDetails.total,
    createdAt: orderDetails.orderDate,
    deliveryDate: orderDetails.scheduledDate,
    notes: orderDetails.note
  } : null;

  const orderItems = orderDetails?.items || [];

  // Mutations
  // Adaptation de la mutation création
  const createDeliveryMutation = useMutation({
    mutationFn: async (data: any) => {
      // Adapter le payload pour l'API backend
      const payload = {
        deliveryDate: data.deliveryDate,
        note: data.note,
        orderId: data.orderId,
        items: data.items.map((item: any) => ({
          idArticle: item.idArticle,
          idzone: item.idzone,
          idlot: item.idlot,
          qteLivree: item.qteLivree,
        })),
      };
      return await apiRequest("/api/deliveries", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId, "delivery-details"] });
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

  // Adaptation de la mutation modification
  const updateDeliveryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const payload = {
        deliveryDate: data.deliveryDate,
        note: data.note,
        orderId: data.orderId,
        items: data.items.map((item: any) => ({
          idArticle: item.idArticle,
          idzone: item.idzone,
          idlot: item.idlot,
          qteLivree: item.qteLivree,
        })),
      };
      return await apiRequest(`/api/deliveries/${id}`, "PUT", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId, "delivery-details"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId, "delivery-details"] });
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
    if (orderId && currentOrder && orderDetails) {
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

      // Pré-remplir avec les articles de la commande (exclure ceux avec quantité restante 0)
      setItems(orderDetails.items
        .filter((item: any) => item.quantityRemaining > 0)
        .map((item: any) => ({
          id: Date.now() + Math.random(), // Nouvel ID temporaire
          articleId: item.articleId,
          article: item.article,
          quantity: item.quantityRemaining, // Utiliser la quantité restante
          // Ne plus gérer unitPrice et totalPrice côté client
          notes: "",
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
        const orderItem = orderDetails?.items.find(oi => oi.articleId === item.articleId);
        if (orderItem) {
          const remainingQuantity = orderItem.quantityRemaining;
          const orderedQuantity = orderItem.quantityOrdered;

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
      const orderItem = orderDetails?.items.find(oi => oi.articleId === item.articleId);
      if (orderItem) {
        const remainingQuantity = orderItem.quantityRemaining;
        const orderedQuantity = orderItem.quantityOrdered;

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
          idArticle: item.articleId,
          qteLivree: split.quantity.toString(),
          idlot: split.lotId ?? null,
          idzone: split.fromStorageZoneId ?? null,
        }));
      } else {
        return [{
          idArticle: item.articleId,
          qteLivree: item.quantity.toString(),
          idlot: null,
          idzone: null,
        }];
      }
    });

    const payload = {
      deliveryDate: currentDelivery.scheduledDate || null,
      note: currentDelivery.notes || null,
      orderId: currentDelivery.orderId,
      items: allItems,
    };

    if (currentDelivery.id) {
      updateDeliveryMutation.mutate({ id: currentDelivery.id, data: payload });
    } else {
      createDeliveryMutation.mutate(payload);
    }
  };

  const getClientName = (clientId: number) => {
    const client = pageData?.clients.find(c => c.id === clientId);
    if (!client) return "Client inconnu";
    return client.name;
  };

  const getOrderCode = (orderId: number | null) => {
    if (!orderId) return "-";
    const order = pageData?.orders.find(o => o.id === orderId);
    return order ? order.code : `CMD-${orderId}`;
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
  // Fonction pour vérifier si une date correspond au filtre
  const matchesDateFilter = (DeliveryDate: string | null) => {
    if (!DeliveryDate) return false;

    const DeliveryDateObj = new Date(DeliveryDate);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Normaliser les dates (ignorer l'heure)
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const normalizedDeliveryDate = normalizeDate(DeliveryDateObj);
    const normalizedToday = normalizeDate(today);
    const normalizedYesterday = normalizeDate(yesterday);
    const normalizedTomorrow = normalizeDate(tomorrow);

    switch (filterDate) {
      case "today":
        return normalizedDeliveryDate.getTime() === normalizedToday.getTime();

      case "yesterday":
        return normalizedDeliveryDate.getTime() === normalizedYesterday.getTime();

      case "tomorrow":
        return normalizedDeliveryDate.getTime() === normalizedTomorrow.getTime();

      case "range": {
        // Si les deux vides → pas de filtre
        if (!filterDateFrom && !filterDateTo) return true;

        const fromDate = filterDateFrom ? normalizeDate(new Date(filterDateFrom)) : null;
        const toDate = filterDateTo ? normalizeDate(new Date(filterDateTo)) : null;

        if (fromDate && toDate) {
          return normalizedDeliveryDate >= fromDate && normalizedDeliveryDate <= toDate;
        }
        if (fromDate) {
          return normalizedDeliveryDate >= fromDate;
        }
        if (toDate) {
          return normalizedDeliveryDate <= toDate;
        }
        return true;
      }

      default:
        return true;
    }

  };

  // Les totaux sont maintenant calculés côté serveur
  // const totals = calculateTotals();

  const filteredDeliveries = deliveries.filter((delivery) => {
    const matchesOrder = orderIdFilter === 'all' || String(delivery.orderId ?? '') === orderIdFilter;
    const matchesDate = !filterDate || filterDate === "all" || matchesDateFilter(delivery?.order?.deliveryDate);
    const matchesClient = clientIdFilter === 'all' || String(delivery.clientId ?? '') === clientIdFilter;
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    // Ajoutez ici la logique de recherche si besoin
    return matchesOrder && matchesClient && matchesStatus && matchesDate;
  });

  return (
    <div className=" mx-auto p-6 pt-2 space-y-6">
      {/* livraisons d'une commande spécifique */}
      {orderId && (
        <div className="flex items-center ">

          <Button
            className="bg-primary text-white hover:bg-primary-hover "
            variant="outline"
            onClick={() => window.location.href = '/orders'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Button>
          {/* Affichage des informations de la commande liée */}
          {orderDetails && (
            <div className="p-3 flex gap-3 m-auto text-blue-800 text-xs bg-blue-50 border border-blue-200 rounded-lg">
              <Package className="h-4 w-4 text-blue-600" />
              <p className="font-medium">Commande: <b>{orderDetails.code}</b></p>
              <p>Client: <b>{orderDetails.client?.name}</b></p>
              <p>Date de commande: <b>{formatDate(orderDetails.orderDate)}</b></p>
              <p>Date prévu: <b>{formatDate(orderDetails.scheduledDate)}</b></p>
              <p>Total: <b>{parseFloat(orderDetails.total?.toString() || "0").toFixed(2)} DA</b></p>

            </div>
          )}
        </div>
      )}

      <Card className="flex  items-center justify-between p-4">
        <CardContent className="p-0 w-full">
          <div className="flex flex-wrap items-center  gap-4">
            {/* Filtres avancés */}
            {!orderId && (
              <>

                <Select value={orderIdFilter} onValueChange={setOrderIdFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Filtrer par commande" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les commandes</SelectItem>
                    {pageData?.orders.map(order => (
                      <SelectItem key={order.id} value={String(order.id)}>
                        {order.code} - {getClientName(order.clientId)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={clientIdFilter} onValueChange={setClientIdFilter}>
                  <SelectTrigger className="flex-1">
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
              </>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
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
            {/* Désactiver le bouton Nouvelle livraison */}
            {orderId && <Button onClick={startNewDelivery} data-testid="button-new-delivery">
              <FileText className="h-4 w-4 mr-2" />
              Nouvelle livraison
            </Button>}
            {/* Dates */}
            <div className="flex  gap-3 items-end w-full">

              <div className="flex flex-1 gap-2 col-span-3">
                <div className="flex flex-col space-y-1 flex-1">
                  <label className="text-xs text-gray-600">📅 Début</label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => { setFilterDateFrom(e.target.value); setFilterDate("range"); }}
                    data-testid="input-date-from"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex flex-col space-y-1 flex-1">
                  <label className="text-xs text-gray-600">📅 Fin</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => { setFilterDateTo(e.target.value); setFilterDate("range"); }}
                    data-testid="input-date-to"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Boutons rapides */}
              <div className="flex  col-span-3 items-center justify-center gap-2">
                {[
                  { label: "Aujourd'hui", value: "today" },
                  { label: "Hier", value: "yesterday" },
                  { label: "Demain", value: "tomorrow" },
                ].map(({ label, value }) => (
                  <Button
                    key={value}
                    variant={filterDate === value ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full ${filterDate === value ? "bg-blue-600 text-white" : ""
                      }`}
                    onClick={() => {
                      const base = new Date();
                      let d: Date;
                      if (value === "yesterday") d = new Date(base.getTime() - 86400000);
                      else if (value === "tomorrow") d = new Date(base.getTime() + 86400000);
                      else d = base;
                      const iso = d.toISOString().split("T")[0];
                      setFilterDate(value);

                    }}
                  >
                    {label}
                  </Button>
                ))}

                {/* Bouton reset */}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-orange-200 text-orange-600 hover:bg-orange-600"
                  onClick={() => {
                    setFilterDate("all");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>




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
                    {!orderId && (<TableHead>Client</TableHead>)}
                    {!orderId && (<TableHead>Commande</TableHead>)}
                   
                    <TableHead>Total TTC</TableHead>
                    <TableHead>etat</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date valdiation</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveriesLoading ? (
                    <TableRow>
                      <TableCell colSpan={orderId ? 6 : 8} className="text-center py-8">
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

                        {!orderId && (
                          <>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {getClientName(delivery.clientId || 0)}
                              </div>
                            </TableCell>
                            <TableCell>{getOrderCode(delivery.orderId)}</TableCell>
                          </>
                        )}
                       
                        <TableCell className="font-semibold">
                          {parseFloat(delivery.totalTTC || "0").toFixed(2)} DA
                        </TableCell>
                        <TableCell>{getStatusBadge(delivery.isPartial)}</TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(delivery.validatedAt)}
                          </div>
                        </TableCell>
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
                            queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
                            queryClient.invalidateQueries({ queryKey: ["/api/orders", orderId, "delivery-details"] });
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
                          // Utiliser les données optimisées de l'API
                          const orderItem = orderDetails?.items.find(oi => oi.articleId === item.articleId);
                          const orderedQuantity = orderItem ? orderItem.quantityOrdered : 0;
                          const deliveredQuantity = orderItem ? orderItem.quantityDelivered : 0;
                          const remainingQuantity = orderItem ? orderItem.quantityRemaining : 0;

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
        onSplitValidated={(newSplits: Array<{ lotId: number | null, fromStorageZoneId: number | null, quantity: number }>) => {
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
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
        }}
      />

      <DeliveryPackagesModal
        open={packagesModal.open}
        onOpenChange={(open) => setPackagesModal({ open, delivery: null })}
        delivery={packagesModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
        }}
      />

      <DeliveryTrackingModal
        open={trackingModal.open}
        onOpenChange={(open) => setTrackingModal({ open, delivery: null })}
        delivery={trackingModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
        }}
      />

      <DeliveryPaymentModal
        open={paymentModal.open}
        onOpenChange={(open) => setPaymentModal({ open, delivery: null })}
        delivery={paymentModal.delivery}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/deliveries/page-data"] });
        }}
      />
    </div>
  );
}