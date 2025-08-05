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
  Package,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  Factory
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { InventoryOperation } from "@shared/schema";

const operationTypeLabels = {
  reception: "Réception",
  preparation: "Préparation", 
  preparation_reliquat: "Préparation Reliquat",
  ajustement: "Ajustement",
  ajustement_rebut: "Ajustement Rebut",
  inventaire_initiale: "Inventaire Initial",
  interne: "Transfert Interne",
  livraison: "Livraison"
};

const operationStatusLabels = {
  draft: "Brouillon",
  pending: "En attente",
  ready: "Prêt",
  completed: "Terminé",
  cancelled: "Annulé",
  programmed: "Programmé",
  in_progress: "En cours"
};

const operationStatusColors = {
  draft: "secondary",
  pending: "default",
  ready: "outline",
  completed: "default",
  cancelled: "destructive",
  programmed: "secondary",
  in_progress: "default"
} as const;

export default function InventoryOperationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "code" | "type">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Queries
  const { data: operations = [], isLoading: operationsLoading } = useQuery<InventoryOperation[]>({
    queryKey: ["/api/inventory-operations", { type: filterType }],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/inventory-operations", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-operations"] });
      toast({ title: "Opération créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/inventory-operations/${id}`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-operations"] });
      toast({ title: "Statut mis à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  // Filtrage et tri
  const filteredAndSortedOperations = operations
    .filter((operation) => {
      const matchesSearch = operation.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || filterStatus === "all" || operation.status === filterStatus;
      const matchesType = !filterType || filterType === "all" || operation.type === filterType;
      return matchesSearch && matchesStatus && matchesType;
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const handleStatusChange = (operation: InventoryOperation, newStatus: string) => {
    // Vérifications de règles métier
    if (operation.status === "completed" && newStatus !== "cancelled") {
      toast({ 
        title: "Action non autorisée", 
        description: "Une opération terminée ne peut être modifiée que par l'administrateur",
        variant: "destructive" 
      });
      return;
    }

    updateStatusMutation.mutate({ id: operation.id, status: newStatus });
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opérations d'Inventaire</h1>
          <p className="text-muted-foreground">
            Gestion des opérations de stock et d'inventaire
          </p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="button-create-operation">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle opération
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
                placeholder="Rechercher une opération..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-operations"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-testid="select-filter-status">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(operationStatusLabels).map(([status, label]) => (
                  <SelectItem key={status} value={status}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger data-testid="select-filter-type">
                <SelectValue placeholder="Type d'opération" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {Object.entries(operationTypeLabels).map(([type, label]) => (
                  <SelectItem key={type} value={type}>
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
                  <SelectItem value="createdAt">Date</SelectItem>
                  <SelectItem value="code">Référence</SelectItem>
                  <SelectItem value="type">Type</SelectItem>
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

      {/* Tableau des opérations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Liste des opérations ({filteredAndSortedOperations.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead>Date programmée</TableHead>
                <TableHead>Opérateur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operationsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Chargement des opérations...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedOperations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Aucune opération trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedOperations.map((operation) => (
                  <TableRow key={operation.id} data-testid={`row-operation-${operation.id}`}>
                    <TableCell className="font-medium">{operation.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-2">
                        <Factory className="h-3 w-3" />
                        {operationTypeLabels[operation.type as keyof typeof operationTypeLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(operation.createdAt)}</TableCell>
                    <TableCell>{formatDate(operation.scheduledDate)}</TableCell>
                    <TableCell>
                      {operation.operatorId ? `Opérateur ${operation.operatorId}` : "-"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={operation.status}
                        onValueChange={(value) => handleStatusChange(operation, value)}
                      >
                        <SelectTrigger className="w-auto">
                          <Badge variant={operationStatusColors[operation.status as keyof typeof operationStatusColors]}>
                            {operationStatusLabels[operation.status as keyof typeof operationStatusLabels]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(operationStatusLabels).map(([status, label]) => (
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
                          data-testid={`button-view-operation-${operation.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-operation-${operation.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={operation.status === "completed"}
                          data-testid={`button-delete-operation-${operation.id}`}
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