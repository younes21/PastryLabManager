import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  User
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Order, Client, Article } from "@shared/schema";

const orderStatusLabels = {
  draft: "Brouillon",
  confirmed: "Confirmé",
  prepared: "Préparé",
  ready: "Prêt",
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

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState<"orderDate" | "code" | "totalTTC">("orderDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showCreateForm, setShowCreateForm] = useState(false);

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
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/orders", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setShowCreateForm(false);
      toast({ title: "Commande créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
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
      return await apiRequest(`/api/orders/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Commande supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  // Filtrage et tri
  const filteredAndSortedOrders = orders
    .filter((order) => {
      const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           getClientName(order.clientId).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || filterStatus === "all" || order.status === filterStatus;
      const matchesType = !filterType || filterType === "all" || order.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
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

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
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
      <div className="container mx-auto p-6 space-y-8">
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

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commandes & Devis</h1>
          <p className="text-muted-foreground">
            Gestion des commandes et devis clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreate} data-testid="button-create-order">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle commande
          </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger data-testid="select-sort-by">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("code")}
                >
                  <div className="flex items-center gap-2">
                    Référence
                    {sortBy === "code" && (
                      sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("orderDate")}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date commande
                    {sortBy === "orderDate" && (
                      sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Date livraison</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("totalTTC")}
                >
                  <div className="flex items-center gap-2">
                    Total TTC
                    {sortBy === "totalTTC" && (
                      sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordersLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Chargement des commandes...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Aucune commande trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedOrders.map((order) => (
                  <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                    <TableCell className="font-medium">{order.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order.type === "quote" ? "Devis" : "Commande"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {getClientName(order.clientId)}
                      </div>
                    </TableCell>
                    <TableCell>{getClientPhone(order.clientId)}</TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                    <TableCell className="font-semibold">
                      {parseFloat(order.totalTTC).toFixed(2)} DA
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order, value)}
                      >
                        <SelectTrigger className="w-auto">
                          <Badge variant={orderStatusColors[order.status as keyof typeof orderStatusColors]}>
                            {orderStatusLabels[order.status as keyof typeof orderStatusLabels]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(orderStatusLabels).map(([status, label]) => (
                            <SelectItem key={status} value={status}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-view-order-${order.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-order-${order.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(order)}
                          disabled={order.status === "confirmed" || order.status === "delivered"}
                          data-testid={`button-delete-order-${order.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}