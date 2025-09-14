import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Package,
  Truck,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { OrderForm } from "@/components/forms/order-form";
import type { Order, Client, Article } from "@shared/schema";
import { Layout } from "@/components/layout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery as useQueryTanstack } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { OrdersTable } from "@/components/orders-table";

const orderStatusLabels = {
  draft: "Brouillon",
  confirmed: "Confirmé",
  partially_delivered: "Livré partiellement",
  delivered: "Livré",
  cancelled: "Annulé"
};

const orderStatusColors = {
  draft: "secondary",
  confirmed: "default",
  prepared: "outline",
  ready: "default",
  partially_delivered: "secondary",
  delivered: "default",
  cancelled: "destructive"
} as const;

const productionStatusLabels = {
  not_started: "Non commencée",
  in_progress: "En cours",
  completed: "Terminée",
  partially_completed: "Partiellement terminée"
};

const productionStatusColors = {
  not_started: "secondary",
  in_progress: "default",
  completed: "default",
  partially_completed: "outline"
} as const;

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterProductionStatus, setFilterProductionStatus] = useState("");
  const [sortBy, setSortBy] = useState<"order" | "orderDate" | "code" | "totalTTC">("order");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Queries
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: products = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    select: (data) => data?.filter((article: Article) => article.type === "product" && article.allowSale),
  });

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/orders/${id}`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Statut mis à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/orders/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (orders: Order[]) => {
      const updates = orders.map((order, index) => ({
        id: order.id,
        order: index
      }));
      return await apiRequest("/api/orders/reorder", "PUT", { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Ordre des commandes mis à jour" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour de l'ordre", variant: "destructive" });
    },
  });

  // Fonction pour calculer l'état de production d'une commande
  const getProductionStatus = (order: Order): keyof typeof productionStatusLabels => {
    if (order.status === "draft" || order.status === "cancelled") {
      return "not_started";
    }
    
    // Pour les commandes confirmées, on peut déterminer l'état de production
    // basé sur les quantités préparées vs commandées
    // Note: Cette logique pourrait être améliorée avec des données réelles de production
    if (order.status === "confirmed") {
      return "in_progress";
    } else if (order.status === "prepared" || order.status === "ready") {
      return "completed";
    } else if (order.status === "partially_delivered") {
      return "partially_completed";
    } else if (order.status === "delivered") {
      return "completed";
    }
    
    return "not_started";
  };

  // Fonction pour vérifier si une date correspond au filtre
  const matchesDateFilter = (orderDate: string | null) => {
    if (!orderDate) return false;
    
    const orderDateObj = new Date(orderDate);
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
    
    const normalizedOrderDate = normalizeDate(orderDateObj);
    const normalizedToday = normalizeDate(today);
    const normalizedYesterday = normalizeDate(yesterday);
    const normalizedTomorrow = normalizeDate(tomorrow);
    
    switch (filterDate) {
      case "today":
        return normalizedOrderDate.getTime() === normalizedToday.getTime();
      case "yesterday":
        return normalizedOrderDate.getTime() === normalizedYesterday.getTime();
      case "tomorrow":
        return normalizedOrderDate.getTime() === normalizedTomorrow.getTime();
      case "range":
        if (!filterDateFrom || !filterDateTo) return true;
        const fromDate = normalizeDate(new Date(filterDateFrom));
        const toDate = normalizeDate(new Date(filterDateTo));
        return normalizedOrderDate >= fromDate && normalizedOrderDate <= toDate;
      default:
        return true;
    }
  };

  // Filtrage et tri
  const filteredAndSortedOrders = orders
    .filter((order) => {
      const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(order.clientId).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || filterStatus === "all" || order.status === filterStatus;
      const matchesType = !filterType || filterType === "all" || order.type === filterType;
      const matchesClient = !filterClient || filterClient === "all" || order.clientId.toString() === filterClient;
      const matchesDate = !filterDate || filterDate === "all" || matchesDateFilter(order.orderDate || order.createdAt);
      const matchesProductionStatus = !filterProductionStatus || filterProductionStatus === "all" || 
        getProductionStatus(order) === filterProductionStatus;
      
      return matchesSearch && matchesStatus && matchesType && matchesClient && matchesDate && matchesProductionStatus;
    })
    .sort((a, b) => {
      // Si on trie par ordre personnalisé, utiliser le champ order
      if (sortBy === "order") {
        return sortOrder === "asc" ? (a.order || 0) - (b.order || 0) : (b.order || 0) - (a.order || 0);
      }

      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === "totalTTC") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Handlers
  const handleCreate = () => {
    setShowCreateForm(true);
  };

  const handleStatusChange = (order: Order, newStatus: string) => {
    // Vérifications de règles métier
    if (order.status === "confirmed" && newStatus === "draft") {
      toast({
        title: "Action non autorisée",
        description: "Une commande confirmée ne peut pas revenir en brouillon",
        variant: "destructive"
      });
      return;
    }

    updateStatusMutation.mutate({ id: order.id, status: newStatus });
  };

  const handleDelete = (order: Order) => {
    // Vérifications de règles métier
    if (order.status === "confirmed" || order.status === "delivered") {
      toast({
        title: "Action non autorisée",
        description: "Une commande confirmée ou livrée ne peut pas être supprimée",
        variant: "destructive"
      });
      return;
    }

    if (confirm("Êtes-vous sûr de vouloir supprimer cette commande ?")) {
      deleteMutation.mutate(order.id);
    }
  };

  const handleReorder = (newOrders: Order[]) => {
    reorderMutation.mutate(newOrders);
  };

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    if (client?.type != 'societe') return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
    else return client ? `${client.companyName}` : "Client inconnu";
  };

  const getClientPhone = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.phone || "-";
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  if (showCreateForm) {
    return (
      <div className="container mx-auto min-w-full p-6 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouvelle Commande</h1>
            <p className="text-muted-foreground">
              Créer une nouvelle commande ou devis client
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowCreateForm(false)}
          >
            Retour à la liste
          </Button>
        </div>
        {/* TODO: Ajouter le formulaire de création de commande */}
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              Formulaire de création de commande en cours de développement...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  usePageTitle('Gestion des commandes'); 
  
  return (
    <div className="container mx-auto min-w-full p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-muted-foreground">
            Gestion des commandes et devis clients
          </p>
        </div>
        <div className="flex gap-2">
          <OrderForm />
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher une commande..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-orders"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-testid="select-filter-status">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(orderStatusLabels).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger data-testid="select-filter-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="quote">Devis</SelectItem>
                <SelectItem value="order">Commande</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger data-testid="select-filter-client">
                <SelectValue placeholder="👤 Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.type !== 'societe' 
                      ? `${client.firstName} ${client.lastName}` 
                      : client.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDate} onValueChange={setFilterDate}>
              <SelectTrigger data-testid="select-filter-date">
                <SelectValue placeholder="📅 Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les dates</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="yesterday">Hier</SelectItem>
                <SelectItem value="tomorrow">Demain</SelectItem>
                <SelectItem value="range">Intervalle personnalisé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterProductionStatus} onValueChange={setFilterProductionStatus}>
              <SelectTrigger data-testid="select-filter-production">
                <SelectValue placeholder="⚙️ État de production" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                {Object.entries(productionStatusLabels).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger data-testid="select-sort-by">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="order">Ordre personnalisé</SelectItem>
                  <SelectItem value="orderDate">Date</SelectItem>
                  <SelectItem value="code">Référence</SelectItem>
                  <SelectItem value="totalTTC">Montant</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                data-testid="button-sort-order"
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {/* Filtres de date personnalisés */}
          {filterDate === "range" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de début
                </label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  data-testid="input-date-from"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date de fin
                </label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  data-testid="input-date-to"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableau des commandes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Liste des commandes ({filteredAndSortedOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <OrdersTable
            orders={filteredAndSortedOrders}
            clients={clients}
            products={products}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
            onView={setViewingOrder}
            onReorder={handleReorder}
            orderStatusLabels={orderStatusLabels}
            orderStatusColors={orderStatusColors}
            isLoading={ordersLoading}
          />
        </CardContent>
      </Card>

      {/* Modale de consultation */}
      <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="bg-gradient-to-r from-orange-100 to-amber-100 rounded-t-xl p-6">
            <DialogTitle className="text-2xl font-bold text-orange-700 flex items-center gap-2">
              <Eye className="w-6 h-6 text-orange-400" /> Consultation de la commande
            </DialogTitle>
          </DialogHeader>
          {viewingOrder && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-gray-700 flex items-center gap-2">
                  <span className="bg-orange-200 text-orange-800 rounded px-2 py-1 text-xs font-mono">{viewingOrder.code}</span>
                </span>
                <Badge
                  variant={orderStatusColors[viewingOrder.status as keyof typeof orderStatusColors] as any}
                  className="text-xs px-3 py-1 rounded-full capitalize"
                >
                  {orderStatusLabels[viewingOrder.status as keyof typeof orderStatusLabels]}
                </Badge>
              </div>
              <hr className="my-2" />
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-400" />
                  <span>Date de création :</span>
                </div>
                <span>{formatDate(viewingOrder.orderDate || viewingOrder.createdAt)}</span>
                {viewingOrder.deliveryDate && (
                  <>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-orange-400" />
                      <span>Date de livraison :</span>
                    </div>
                    <span>{formatDate(viewingOrder.deliveryDate)}</span>
                  </>
                )}
                {viewingOrder.notes && (
                  <>
                    <div className="flex items-center gap-2">
                      <Edit className="w-4 h-4 text-orange-400" />
                      <span>Notes :</span>
                    </div>
                    <span className="italic text-gray-500">{viewingOrder.notes}</span>
                  </>
                )}
              </div>
              <hr className="my-2" />
              <div className="mt-2">
                <div className="font-semibold mb-2 text-gray-700 text-base flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-orange-400" /> Articles de la commande
                </div>
                <OrderItemsSummary orderId={viewingOrder.id} products={products} />
              </div>
              <hr className="my-2" />
              <div className="grid grid-cols-2 gap-4 text-base font-semibold mt-4">
                <div className="flex items-center gap-2 text-orange-700">
                  Total TTC
                </div>
                <span className="text-right text-orange-700">{parseFloat(viewingOrder.totalTTC?.toString() || "0").toFixed(2)} DA</span>
                <div className="flex items-center gap-2 text-amber-700">
                  <Badge className="bg-amber-200 text-amber-800 px-2 py-1">TVA</Badge>
                </div>
                <span className="text-right text-amber-700">{parseFloat(viewingOrder.totalTax?.toString() || "0").toFixed(2)} DA</span>
              </div>
              
              {/* Bouton pour afficher les livraisons liées */}
              <div className="flex justify-center mt-6">
                <Button
                  onClick={() => {
                    // Rediriger vers la page des livraisons avec un filtre sur cette commande
                    window.location.href = `/deliveries?orderId=${viewingOrder.id}`;
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <Truck className="w-5 h-5" />
                  Voir les livraisons de cette commande
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderItemsSummary({ orderId, products }: { orderId: number; products: Article[] }) {
  const { data: items, isLoading } = useQueryTanstack({
    queryKey: ["/api/orders", orderId, "items"],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/items`);
      return res.json();
    },
    enabled: !!orderId,
  });
  
  if (isLoading) return <div>Chargement des articles...</div>;
  if (!items || items.length === 0) return <div className="text-gray-400 italic">Aucun article</div>;

  const totalHT = items.reduce((sum: number, item: any) => sum + parseFloat(item.unitPrice || "0") * parseFloat(item.quantity || "0"), 0);
  
  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-orange-100 sticky top-0 z-10">
            <tr>
              <th className="p-2 text-left font-semibold text-gray-700">Produit</th>
              <th className="p-2 text-right font-semibold text-gray-700">Qté</th>
              <th className="p-2 text-right font-semibold text-gray-700">PU</th>
              <th className="p-2 text-right font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item: any, idx: number) => {
              const product = products.find((p) => p.id === item.articleId);
              return (
                <tr key={item.articleId}>
                  <td className="p-2 font-semibold">{product ? product.name : item.articleId}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">{parseFloat(item.unitPrice || "0").toFixed(2)} DA</td>
                  <td className="p-2 text-right font-semibold">{(parseFloat(item.unitPrice || "0") * parseFloat(item.quantity || "0")).toFixed(2)} DA</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-2">
        <span className="text-sm text-gray-700 font-semibold bg-gray-50 rounded px-3 py-1">Total HT : {totalHT.toFixed(2)} DA</span>
      </div>
    </>
  );
}