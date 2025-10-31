import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Download,
  Eye
} from "lucide-react";
import { usePageTitle } from "@/hooks/usePageTitle";

interface PaymentStatistics {
  totalInvoices: {
    count: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
  };
  overdueInvoices: {
    count: number;
    totalAmount: number;
  };
  recentPayments: {
    count: number;
    totalAmount: number;
  };
}

interface OutstandingPayment {
  clientId: number;
  clientCode: string;
  clientName: string;
  clientPrenom: string;
  clientRaisonSociale: string;
  invoiceId: number;
  invoiceCode: string;
  invoiceTotalTTC: number;
  invoiceAmountPaid: number;
  outstandingAmount: number;
  invoiceStatus: string;
  dueDate: string;
  daysOverdue: number;
  orderCode: string;
  orderStatus: string;
  deliveryCode: string;
  deliveryStatus: string;
}

export default function PaymentDashboard() {
  usePageTitle("Tableau de Bord des Règlements");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [overdueFilter, setOverdueFilter] = useState<string>("all");

  // Queries
  const { data: statistics, isLoading: statsLoading } = useQuery<PaymentStatistics>({
    queryKey: ["/api/payments/statistics"],
    queryFn: async () => {
      const response = await fetch("/api/payments/statistics");
      if (!response.ok) throw new Error("Failed to fetch payment statistics");
      return response.json();
    },
  });

  const { data: outstandingPayments = [], isLoading: paymentsLoading } = useQuery<OutstandingPayment[]>({
    queryKey: ["/api/payments/outstanding"],
    queryFn: async () => {
      const response = await fetch("/api/payments/outstanding");
      if (!response.ok) throw new Error("Failed to fetch outstanding payments");
      return response.json();
    },
  });

  // Filtrage des données
  const filteredPayments = outstandingPayments.filter(payment => {
    const matchesSearch =
      payment.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.clientCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || payment.invoiceStatus === statusFilter;

    const matchesOverdue = overdueFilter === "all" ||
      (overdueFilter === "overdue" && payment.daysOverdue > 0) ||
      (overdueFilter === "not_overdue" && payment.daysOverdue === 0);

    return matchesSearch && matchesStatus && matchesOverdue;
  });

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'DZD'
    }).format(amount || 0);
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

  const getOverdueBadge = (daysOverdue: number) => {
    if (daysOverdue === 0) {
      return <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />À jour</Badge>;
    } else if (daysOverdue <= 30) {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{daysOverdue} jours</Badge>;
    } else {
      return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />{daysOverdue} jours</Badge>;
    }
  };

  if (statsLoading || paymentsLoading) {
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord des Règlements</h1>
          <p className="text-muted-foreground">
            Suivi des paiements et encours clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Factures</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics?.totalInvoices?.count || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(statistics?.totalInvoices?.totalAmount || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Payé</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(statistics?.totalInvoices?.paidAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.totalInvoices?.totalAmount ?
                Math.round((statistics.totalInvoices?.paidAmount / statistics.totalInvoices?.totalAmount) * 100) : 0}% du total
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
              {formatCurrency(statistics?.totalInvoices?.outstandingAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.overdueInvoices?.count || 0} factures en retard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements 30j</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(statistics?.recentPayments?.totalAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.recentPayments?.count || 0} paiements
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes */}
      {statistics?.overdueInvoices?.count || 0 > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{statistics?.overdueInvoices?.count}</strong> factures en retard pour un montant de{" "}
            <strong>{formatCurrency(statistics?.overdueInvoices?.totalAmount)}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets */}
      <Tabs defaultValue="outstanding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="outstanding">Encours Clients</TabsTrigger>
          <TabsTrigger value="recent">Paiements Récents</TabsTrigger>
        </TabsList>

        <TabsContent value="outstanding" className="space-y-4">
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
                      placeholder="Client, facture, commande..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Statut</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="sent">Envoyée</SelectItem>
                      <SelectItem value="partial">Partiel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Échéance</label>
                  <Select value={overdueFilter} onValueChange={setOverdueFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      <SelectItem value="overdue">En retard</SelectItem>
                      <SelectItem value="not_overdue">À jour</SelectItem>
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

          {/* Tableau des encours */}
          <Card>
            <CardHeader>
              <CardTitle>
                Encours Clients ({filteredPayments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Commande</TableHead>
                    <TableHead>Livraison</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Encours</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={`${payment.clientId}-${payment.invoiceId}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.clientRaisonSociale || `${payment.clientName} ${payment.clientPrenom}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.clientCode}
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
                      <TableCell className="font-medium">
                        {formatCurrency(payment.invoiceTotalTTC)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(payment.invoiceAmountPaid)}
                      </TableCell>
                      <TableCell className="font-medium text-orange-600">
                        {formatCurrency(payment.outstandingAmount)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">
                            {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString('fr-FR') : 'N/A'}
                          </div>
                          {getOverdueBadge(payment.daysOverdue)}
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

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Paiements Récents</CardTitle>
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
