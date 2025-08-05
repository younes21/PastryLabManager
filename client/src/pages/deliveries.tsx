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
  Truck,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Package,
  MapPin
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Delivery, Order, Client } from "@shared/schema";

const deliveryStatusLabels = {
  pending: "En attente",
  in_transit: "En cours",
  delivered: "Livré",
  cancelled: "Annulé"
};

const deliveryStatusColors = {
  pending: "secondary",
  in_transit: "default",
  delivered: "default",
  cancelled: "destructive"
} as const;

export default function DeliveriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<"scheduledDate" | "code">("scheduledDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Queries
  const { data: deliveries = [], isLoading: deliveriesLoading } = useQuery<Delivery[]>({
    queryKey: ["/api/deliveries"],
  });

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/deliveries", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({ title: "Livraison créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/deliveries/${id}`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({ title: "Statut mis à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  // Filtrage et tri
  const filteredAndSortedDeliveries = deliveries
    .filter((delivery) => {
      const matchesSearch = delivery.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           getOrderCode(delivery.orderId).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || filterStatus === "all" || delivery.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getOrderCode = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    return order?.code || "Commande inconnue";
  };

  const getClientName = (orderId: number) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return "Client inconnu";
    const client = clients.find((c) => c.id === order.clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
  };

  const getDeliveryPersonName = (deliveryPersonId: number | null) => {
    if (!deliveryPersonId) return "-";
    const user = users.find((u: any) => u.id === deliveryPersonId);
    return user?.username || "Livreur inconnu";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const handleStatusChange = (delivery: Delivery, newStatus: string) => {
    // Vérifications de règles métier
    if (delivery.status === "delivered" && newStatus !== "delivered") {
      toast({ 
        title: "Action non autorisée", 
        description: "Une livraison terminée ne peut pas changer de statut",
        variant: "destructive" 
      });
      return;
    }

    updateStatusMutation.mutate({ id: delivery.id, status: newStatus });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Livraisons</h1>
          <p className="text-muted-foreground">
            Gestion des livraisons et suivi des colis
          </p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="button-create-delivery">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle livraison
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
                placeholder="Rechercher une livraison..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-deliveries"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-testid="select-filter-status">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(deliveryStatusLabels).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger data-testid="select-sort-by">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduledDate">Date prévue</SelectItem>
                <SelectItem value="code">Référence</SelectItem>
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
        </CardContent>
      </Card>

      {/* Tableau des livraisons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Liste des livraisons ({filteredAndSortedDeliveries.length})
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
                <TableHead>Commande</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Livreur</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("scheduledDate")}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date prévue
                    {sortBy === "scheduledDate" && (
                      sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Date livraison</TableHead>
                <TableHead>Colis</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveriesLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Chargement des livraisons...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    Aucune livraison trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedDeliveries.map((delivery) => (
                  <TableRow key={delivery.id} data-testid={`row-delivery-${delivery.id}`}>
                    <TableCell className="font-medium">{delivery.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getOrderCode(delivery.orderId)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {getClientName(delivery.orderId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {getDeliveryPersonName(delivery.deliveryPersonId)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(delivery.scheduledDate)}</TableCell>
                    <TableCell>{formatDate(delivery.deliveredAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {delivery.packageCount || 1} colis
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={delivery.status}
                        onValueChange={(value) => handleStatusChange(delivery, value)}
                      >
                        <SelectTrigger className="w-auto">
                          <Badge variant={deliveryStatusColors[delivery.status as keyof typeof deliveryStatusColors]}>
                            {deliveryStatusLabels[delivery.status as keyof typeof deliveryStatusLabels]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(deliveryStatusLabels).map(([status, label]) => (
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
                          data-testid={`button-view-delivery-${delivery.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-delivery-${delivery.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={delivery.status === "delivered"}
                          data-testid={`button-delete-delivery-${delivery.id}`}
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