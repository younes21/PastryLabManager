import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery as useQueryTanstack } from "@tanstack/react-query";
import { usePageTitle } from "@/hooks/usePageTitle";
import { OrdersTable } from "@/components/orders-table";

const orderStatusLabels = {
  draft: "Devis (brouillon)",
  confirmed: "Confirmée",
  validated: "Validée",
  prepared: "Préparée",
  ready: "Prête",
  partially_delivered: "Livrée partiellement",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const orderStatusColors = {
  draft: "bg-gray-200 text-gray-800",
  confirmed: "bg-blue-400 text-white",
  validated: "bg-green-500 text-white",
  prepared: "bg-indigo-300 text-white",
  ready: "bg-yellow-400 text-black",
  partially_delivered: "bg-orange-400 text-white",
  delivered: "bg-green-700 text-white",
  cancelled: "bg-red-500 text-white"
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
  const [currentView, setCurrentView] = useState<"list" | "create" | "edit">("list");
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);

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
      console.log('orders:', orders.map(o => ({ id:o.id, order:o.order })));
      const updates = orders.map((order) => ({
        id: order.id,
        order: order.order ?? 0
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
    if (order.status === "validated") {
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

  // Filtrage et tri
  const filteredAndSortedOrders = orders
    .filter((order) => {
      const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(order.clientId).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = ((!filterStatus || filterStatus === "all") && order.status != 'draft') || order.status === filterStatus;
      const matchesType = !filterType || filterType === "all" || order.type === filterType;
      const matchesClient = !filterClient || filterClient === "all" || order.clientId.toString() === filterClient;
      const matchesDate = !filterDate || filterDate === "all" || matchesDateFilter(order.deliveryDate);
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

  // Récupération des lignes d'articles pour les commandes filtrées
  const orderIds = filteredAndSortedOrders.map(o => o.id);
  const { data: orderItemsByOrder = {}, isLoading: orderItemsLoading } = useQueryTanstack<{ [orderId: number]: any[] }>({
    queryKey: ["/api/orders/items", orderIds],
    enabled: orderIds.length > 0,
    queryFn: async () => {
      const result: { [orderId: number]: any[] } = {};
      await Promise.all(orderIds.map(async (id) => {
        const res = await fetch(`/api/orders/${id}/items`);
        const json = await res.json();
        result[id] = json || [];
      }));
      return result;
    }
  });

  // Handlers
  const handleCreate = () => {
    setCurrentView("create");
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setCurrentView("edit");
  };

  const handleStatusChange = (order: Order, newStatus: string) => {
    // Vérifications de règles métier
    // if ( newStatus != "draft" && order.status === "confirmed") {
    //   toast({
    //     title: "Action non autorisée",
    //     description: "Une commande confirmée ne peut pas revenir en brouillon",
    //     variant: "destructive"
    //   });
    //   return;
    // }

    updateStatusMutation.mutate({ id: order.id, status: newStatus });
  };

  const handleDelete = (order: Order) => {
    // Vérifications de règles métier
    if (order.status != "draft" && order.status != "confirmed") {
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

  usePageTitle('Gestion des commandes');

  return (
    <>
      {currentView === "create" && (
        <OrderForm
          onSuccess={() => setCurrentView("list")}
          onCancel={() => setCurrentView("list")}
        />
      )}
      {currentView === "edit" && editingOrder && (
        <OrderForm
          order={editingOrder}
          onSuccess={() => {
            setEditingOrder(null);
            setCurrentView("list");
          }}
          onCancel={() => {
            setEditingOrder(null);
            setCurrentView("list");
          }}
        />
      )}
      {currentView === "list" && (
        <div className="container mx-auto min-w-full p-6 space-y-8">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtres et recherche
                </CardTitle>
                <Button
                  onClick={handleCreate}
                  className="bg-accent hover:bg-accent-hover"
                >
                  Ajouter une commande
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6  gap-3 items-end">
                <div className="col-span-1">
                  {/* Statut */}
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger data-testid="select-filter-status" className="h-9 text-sm">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Devis (brouillon)</SelectItem>
                      <hr className="my-1 border-orange-400" />
                      <SelectItem value="all">Toutes commandes</SelectItem>
                      {Object.entries(orderStatusLabels).filter(f => f[0] != 'draft').map(([status, label]) => (
                        <SelectItem key={status} value={status}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  {/* État production */}
                  <Select value={filterProductionStatus} onValueChange={setFilterProductionStatus}>
                    <SelectTrigger data-testid="select-filter-production" className="h-9 text-sm">
                      <SelectValue placeholder="⚙️ Prod." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {Object.entries(productionStatusLabels).map(([status, label]) => (
                        <SelectItem key={status} value={status}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Client */}
                <div className="col-span-3">
                  <label className="text-xs text-gray-600"> Client</label>
                  <Select value={filterClient} onValueChange={setFilterClient}>
                    <SelectTrigger data-testid="select-filter-client" className="h-9 text-sm">
                      <SelectValue placeholder="👤 Client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.type !== 'societe'
                            ? `${client.firstName} ${client.lastName}`
                            : client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="flex gap-2 col-span-3">
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
            </CardContent>
          </Card>



          {/* Onglets: Liste des commandes / Récap */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-2 ">
              <TabsTrigger value="list" className="hover:bg-orange-200">Liste des commandes</TabsTrigger>
              <TabsTrigger value="recap" className="[aria-selected]:bg-orange-200">Récap</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-4">
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
                    onEdit={handleEdit}
                    onReorder={handleReorder}
                    orderStatusLabels={orderStatusLabels}
                    orderStatusColors={orderStatusColors}
                    isLoading={ordersLoading}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recap" className="space-y-4">
              <ProductsRecapServer
                filters={{
                  search: searchTerm,
                  status: filterStatus,
                  type: filterType,
                  clientId: filterClient,
                  date: filterDate,
                  dateFrom: filterDateFrom,
                  dateTo: filterDateTo,
                }}
              />
            </TabsContent>
          </Tabs>

          {/* Modale de consultation */}
          <Dialog open={!!viewingOrder} onOpenChange={() => setViewingOrder(null)}>
            <DialogContent className="max-w-2xl max-h-[100vh] overflow-y-auto">
              <DialogHeader >
                <DialogTitle className="text-2xl font-bold text-orange-700 flex items-center gap-2">
                  <Eye className="w-6 h-6 text-orange-400" /> <span>Consultation de la commande</span>
                </DialogTitle>
              </DialogHeader>
              <DialogBody>
                {viewingOrder && (
                  <div className="p-6 pt-0 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700 flex items-center gap-2">
                        <span className="bg-orange-200 text-orange-800 rounded px-2 py-1 text-xs font-mono">{viewingOrder.code}</span>
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs px-2 py-1 ${orderStatusColors[viewingOrder.status as keyof typeof orderStatusLabels]} `
                        }
                      >
                        {orderStatusLabels[viewingOrder.status as keyof typeof orderStatusLabels]}
                      </Badge>
                    </div>
                    <hr className="my-2" />
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
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
                    <hr className="my-1" />
                    <div className="mt-1">
                      <div className="font-semibold mb-2 text-gray-700 text-base flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-orange-400" /> Articles de la commande
                      </div>
                      <OrderItemsSummary orderId={viewingOrder.id} products={products} />
                    </div>
                    {/* <hr className="my-1" /> */}
                    <div className="grid grid-cols-2 gap-1 text-base font-semibold ">
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
                    <div className="flex justify-center mt-2">
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
              </DialogBody>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
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
      <div className="overflow-x-auto rounded-lg border border-gray-100 shadow-sm  overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-orange-100 sticky top-0 z-10">
            <tr>
              <th className="p-2 text-left font-semibold text-gray-700">Produit</th>
              <th className="p-2 text-right font-semibold text-gray-700">Qté</th>
              <th className="p-2 text-right font-semibold text-gray-700">PU</th>
              <th className="p-2 text-right font-semibold text-gray-700">Total</th>
            </tr>
          </thead>
          <tbody >
            {items.map((item: any, idx: number) => {
              const product = products.find((p) => p.id === item.articleId);
              return (
                <tr key={item.articleId}>
                  <td className="p-2 font-semibold"> <div className="flex items-center gap-4">
                    <img src={product?.photo} alt={product?.name} className="w-[5rem] h-[4rem] object-cover rounded-t-lg" />
                    {product ? product.name : item.articleId}
                  </div></td>
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

function ProductsRecapServer({ filters }: { filters: { search: string; status: string; type: string; clientId: string; date: string; dateFrom: string; dateTo: string; } }) {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.status) params.set('status', filters.status);
  if (filters.type) params.set('type', filters.type);
  if (filters.clientId) params.set('clientId', filters.clientId);
  if (filters.date) params.set('date', filters.date);
  if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) params.set('dateTo', filters.dateTo);

  const { data, isLoading } = useQueryTanstack<any[]>({
    queryKey: ["/api/orders/production-summary", Object.fromEntries(params.entries())],
    queryFn: async () => {
      const res = await fetch(`/api/orders/production-summary?${params.toString()}`);
      return res.json();
    }
  });

  const rows = (data || []) as Array<{ 
    articleId: number; 
    name: string; 
    photo?: string | null; 
    unit?: string | null; 
    ordered: number; 
    toDeliver: number; 
    delivered: number; 
    remaining: number; 
    toPick: number; 
    toProduce: number 
  }>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" /> Récap par produit ({rows.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-gray-500">Chargement...</div>
        ) : rows.length === 0 ? (
          <div className="text-sm text-gray-500 italic">Aucun article à afficher</div>
        ) : (
          <ScrollArea className="h-[60vh]">
            <div className="w-full border rounded-lg overflow-hidden">
              {/* Header du tableau */}
              <div className="grid grid-cols-8 bg-slate-100 text-sm font-semibold text-slate-700">
                <div className="p-3 col-span-2">Produit</div>
                <div className="p-3 text-center">Commandées</div>
                <div className="p-3 text-center">Déjà livrées</div>
                <div className="p-3 text-center">À livrer</div>
                <div className="p-3 text-center">Commandes restantes</div>
                <div className="p-3 text-center">Que tu peut planifier</div>
                <div className="p-3 text-center">À produire</div>
              </div>

              {/* Lignes produits */}
              <div className="divide-y divide-slate-200">
                {rows.map((row) => (
                  <div
                    key={row.articleId}
                    className="grid grid-cols-8 items-center hover:bg-slate-50 transition-colors"
                  >
                    {/* Produit */}
                    <div className="flex items-center gap-3 p-3 col-span-2">
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-slate-100">
                        {row.photo ? (
                          <img
                            src={row.photo}
                            alt={row.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                            Aucune photo
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{row.name}</div>
                        {/* <div className="text-xs text-slate-500">ID: {row.articleId}</div> */}
                      </div>
                    </div>

                    {/* Qtés */}
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-slate-900">
                        {row.ordered.toFixed(2)} {row.unit || ""}
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {row.delivered.toFixed(2)} {row.unit || ""}
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-purple-600">
                        {row.toDeliver.toFixed(2)} {row.unit || ""}
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-gray-600">
                        {row.remaining.toFixed(2)} {row.unit || ""}
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-blue-600">
                        {row.toPick.toFixed(2)} {row.unit || ""}
                      </div>
                    </div>
                    <div className="p-3 text-center">
                      <div className="text-lg font-semibold text-orange-600">
                        {row.toProduce.toFixed(2)} {row.unit || ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );


}