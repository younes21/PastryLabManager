import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft,
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  Package,
  Receipt
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Link } from "wouter";

interface ClientPayment {
  id: number;
  invoiceId: number;
  date: string;
  amount: number;
  method: string;
  reference: string;
  notes: string;
  createdAt: string;
  createdBy: number;
  // Informations de la facture
  invoiceCode: string;
  invoiceStatus: string;
  invoiceTotalTTC: number;
  invoiceAmountPaid: number;
  // Informations de la commande
  orderCode: string;
  orderStatus: string;
  // Informations de la livraison
  deliveryCode: string;
  deliveryStatus: string;
}

interface Client {
  id: number;
  code: string;
  nom: string;
  prenom: string;
  raisonSociale: string;
  type: string;
  active: boolean;
}

export default function ClientPaymentHistory() {
  const { clientId } = useParams();
  usePageTitle("Historique des Paiements Client");
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  // Queries
  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client");
      return response.json();
    },
    enabled: !!clientId,
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery<ClientPayment[]>({
    queryKey: ["/api/payments", { clientId }],
    queryFn: async () => {
      const response = await fetch(`/api/payments?clientId=${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch client payments");
      return response.json();
    },
    enabled: !!clientId,
  });

  // Calculs des statistiques
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalInvoiced = payments.reduce((sum, payment) => sum + payment.invoiceTotalTTC, 0);
  const outstandingAmount = totalInvoiced - totalPaid;
  const paymentCount = payments.length;

  // Filtrage des données
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.invoiceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.deliveryCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.invoiceStatus === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Brouillon", variant: "secondary" as const },
      sent: { label: "Envoyée", variant: "default" as const },
      paid: { label: "Payée", variant: "default" as const },
      partial: { label: "Partiel", variant: "outline" as const },
      cancelled: { label: "Annulée", variant: "destructive" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMethodBadge = (method: string) => {
    const methodConfig = {
      cash: { label: "Espèces", variant: "default" as const },
      bank: { label: "Virement", variant: "secondary" as const },
      card: { label: "Carte", variant: "outline" as const },
      cheque: { label: "Chèque", variant: "outline" as const },
    };
    
    const config = methodConfig[method as keyof typeof methodConfig] || { label: method, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (clientLoading || paymentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des données...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Client non trouvé
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Historique des Paiements</h1>
            <p className="text-muted-foreground">
              {client.raisonSociale || `${client.nom} ${client.prenom}`} - {client.code}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Informations client */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informations Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Code Client</p>
              <p className="font-mono text-sm">{client.code}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Type</p>
              <Badge variant={client.type === "societe" ? "default" : "secondary"}>
                {client.type === "societe" ? "Société" : "Particulier"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Statut</p>
              <Badge variant={client.active ? "default" : "destructive"}>
                {client.active ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturé</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInvoiced)}</div>
            <p className="text-xs text-muted-foreground">
              Montant total des factures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payé</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {paymentCount} paiements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encours</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(outstandingAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalInvoiced > 0 ? Math.round((outstandingAmount / totalInvoiced) * 100) : 0}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Paiement</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Paiements / Factures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {outstandingAmount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Encours de <strong>{formatCurrency(outstandingAmount)}</strong> à recouvrer
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets */}
      <Tabs defaultValue="payments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="payments">Paiements</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {/* Filtres */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filtres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Facture, commande, livraison..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut Facture</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="sent">Envoyée</SelectItem>
                      <SelectItem value="paid">Payée</SelectItem>
                      <SelectItem value="partial">Partiel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Méthode</label>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les méthodes</SelectItem>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="bank">Virement</SelectItem>
                      <SelectItem value="card">Carte</SelectItem>
                      <SelectItem value="cheque">Chèque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Actions</label>
                  <Button variant="outline" size="sm" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Exporter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des paiements */}
          <Card>
            <CardHeader>
              <CardTitle>
                Historique des Paiements ({filteredPayments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Livraison</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(payment.date).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(payment.date).toLocaleTimeString('fr-FR')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.invoiceCode}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(payment.invoiceTotalTTC)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.orderCode}</div>
                          <Badge variant="outline" className="text-xs">
                            {payment.orderStatus}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{payment.deliveryCode}</div>
                          <Badge variant="outline" className="text-xs">
                            {payment.deliveryStatus}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(payment.method)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {payment.reference || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.invoiceStatus)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Factures</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Module en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commandes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Module en cours de développement...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
