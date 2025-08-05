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
  FileText,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  User,
  Printer,
  Euro
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice, Client } from "@shared/schema";

const invoiceStatusLabels = {
  draft: "Brouillon",
  sent: "Envoyé", 
  paid: "Payé",
  overdue: "En retard",
  cancelled: "Annulé"
};

const invoiceStatusColors = {
  draft: "secondary",
  sent: "default",
  paid: "default",
  overdue: "destructive",
  cancelled: "destructive"
} as const;

export default function InvoicesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<"issueDate" | "code" | "totalTTC">("issueDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Queries
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/invoices", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Facture créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest(`/api/invoices/${id}`, "PUT", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({ title: "Statut mis à jour avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la mise à jour", variant: "destructive" });
    },
  });

  // Filtrage et tri
  const filteredAndSortedInvoices = invoices
    .filter((invoice) => {
      const matchesSearch = invoice.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           getClientName(invoice.clientId).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || filterStatus === "all" || invoice.status === filterStatus;
      return matchesSearch && matchesStatus;
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

  const getClientName = (clientId: number) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? `${client.firstName} ${client.lastName}` : "Client inconnu";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const handleStatusChange = (invoice: Invoice, newStatus: string) => {
    // Vérifications de règles métier
    if (invoice.status === "paid" && newStatus === "draft") {
      toast({ 
        title: "Action non autorisée", 
        description: "Une facture payée ne peut pas revenir en brouillon",
        variant: "destructive" 
      });
      return;
    }

    updateStatusMutation.mutate({ id: invoice.id, status: newStatus });
  };

  const handlePrint = (invoice: Invoice) => {
    // TODO: Implémenter l'impression de facture
    toast({ title: "Impression en cours de développement..." });
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
          <h1 className="text-3xl font-bold tracking-tight">Facturation</h1>
          <p className="text-muted-foreground">
            Gestion des factures et paiements clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button data-testid="button-create-invoice">
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle facture
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
                placeholder="Rechercher une facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-invoices"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger data-testid="select-filter-status">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(invoiceStatusLabels).map(([status, label]) => (
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
                <SelectItem value="issueDate">Date</SelectItem>
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
        </CardContent>
      </Card>

      {/* Tableau des factures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des factures ({filteredAndSortedInvoices.length})
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
                <TableHead>Client</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("issueDate")}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date émission
                    {sortBy === "issueDate" && (
                      sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Date échéance</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("totalTTC")}
                >
                  <div className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Total TTC
                    {sortBy === "totalTTC" && (
                      sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Montant payé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Chargement des factures...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Aucune facture trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedInvoices.map((invoice) => (
                  <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                    <TableCell className="font-medium">{invoice.code}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {getClientName(invoice.clientId)}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="font-semibold">
                      {parseFloat(invoice.totalTTC).toFixed(2)} DA
                    </TableCell>
                    <TableCell className="font-medium">
                      {parseFloat(invoice.amountPaid).toFixed(2)} DA
                    </TableCell>
                    <TableCell>
                      <Select
                        value={invoice.status}
                        onValueChange={(value) => handleStatusChange(invoice, value)}
                      >
                        <SelectTrigger className="w-auto">
                          <Badge variant={invoiceStatusColors[invoice.status as keyof typeof invoiceStatusColors]}>
                            {invoiceStatusLabels[invoice.status as keyof typeof invoiceStatusLabels]}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(invoiceStatusLabels).map(([status, label]) => (
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
                          onClick={() => handlePrint(invoice)}
                          data-testid={`button-print-invoice-${invoice.id}`}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-view-invoice-${invoice.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-edit-invoice-${invoice.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={invoice.status === "paid"}
                          data-testid={`button-delete-invoice-${invoice.id}`}
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