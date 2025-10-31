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
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock
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

interface ClientSummary {
  clientId: number;
  clientCode: string;
  clientName: string;
  clientPrenom: string;
  clientRaisonSociale: string;
  totalInvoiced: number;
  totalPaid: number;
  outstandingAmount: number;
  invoiceCount: number;
  paymentCount: number;
  lastPaymentDate: string;
  averagePaymentDays: number;
}

export default function PaymentReports() {
  usePageTitle("Rapports de Règlements");

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

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

  // Simulation des données de résumé client (à remplacer par une vraie API)
  const { data: clientSummaries = [], isLoading: clientsLoading } = useQuery<ClientSummary[]>({
    queryKey: ["/api/payments/client-summaries"],
    queryFn: async () => {
      // Simulation - à remplacer par une vraie API
      const clients = outstandingPayments.reduce((acc, payment) => {
        const clientId = payment.clientId;
        if (!acc[clientId]) {
          acc[clientId] = {
            clientId,
            clientCode: payment.clientCode,
            clientName: payment.clientName,
            clientPrenom: payment.clientPrenom,
            clientRaisonSociale: payment.clientRaisonSociale,
            totalInvoiced: 0,
            totalPaid: 0,
            outstandingAmount: 0,
            invoiceCount: 0,
            paymentCount: 0,
            lastPaymentDate: '',
            averagePaymentDays: 0
          };
        }
        acc[clientId].totalInvoiced += payment.invoiceTotalTTC;
        acc[clientId].totalPaid += payment.invoiceAmountPaid;
        acc[clientId].outstandingAmount += payment.outstandingAmount;
        acc[clientId].invoiceCount += 1;
        return acc;
      }, {} as Record<number, ClientSummary>);

      return Object.values(clients);
    },
    enabled: outstandingPayments.length > 0,
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

  const getClientPaymentStatus = (outstandingAmount: number, totalInvoiced: number) => {
    if (outstandingAmount === 0) {
      return { label: "Bon payeur", variant: "default" as const, icon: CheckCircle };
    } else if (outstandingAmount / totalInvoiced < 0.1) {
      return { label: "Très bon", variant: "default" as const, icon: CheckCircle };
    } else if (outstandingAmount / totalInvoiced < 0.3) {
      return { label: "Bon", variant: "outline" as const, icon: Clock };
    } else {
      return { label: "À surveiller", variant: "destructive" as const, icon: AlertTriangle };
    }
  };

  if (statsLoading || paymentsLoading || clientsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Chargement des rapports...</p>
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
          <h1 className="text-3xl font-bold">Rapports de Règlements</h1>
          <p className="text-muted-foreground">
            Analyses et statistiques des paiements clients
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter Excel
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-2" />
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres et Période
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Date de début</label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date de fin</label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Client</label>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clientSummaries.map(client => (
                    <SelectItem key={client.clientId} value={client.clientId.toString()}>
                      {client.clientRaisonSociale || `${client.clientName} ${client.clientPrenom}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="paid">Payé</SelectItem>
                  <SelectItem value="partial">Partiel</SelectItem>
                  <SelectItem value="overdue">En retard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'Affaires</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(statistics?.totalInvoices?.totalAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.totalInvoices?.count || 0} factures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encaissements</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(statistics?.totalInvoices?.paidAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.totalInvoices?.totalAmount ?
                Math.round((statistics.totalInvoices?.paidAmount / statistics?.totalInvoices?.totalAmount) * 100) : 0}% du CA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encours</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(statistics?.totalInvoices?.outstandingAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {statistics?.overdueInvoices?.count || 0} en retard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de Recouvrement</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {statistics?.totalInvoices?.totalAmount ?
                Math.round((statistics.totalInvoices?.paidAmount / statistics?.totalInvoices?.totalAmount) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Paiements / Factures
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes importantes */}
      {statistics?.overdueInvoices?.count || 0 > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{statistics?.overdueInvoices?.count}</strong> factures en retard pour un montant de{" "}
            <strong>{formatCurrency(statistics?.overdueInvoices?.totalAmount)}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets des rapports */}
      <Tabs defaultValue="clients" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clients">Résumé Clients</TabsTrigger>
          <TabsTrigger value="outstanding">Encours Détaillés</TabsTrigger>
          <TabsTrigger value="analytics">Analyses</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Résumé par Client ({clientSummaries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Facturé</TableHead>
                    <TableHead>Payé</TableHead>
                    <TableHead>Encours</TableHead>
                    <TableHead>Factures</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientSummaries.map((client) => {
                    const status = getClientPaymentStatus(client.outstandingAmount, client.totalInvoiced);
                    const StatusIcon = status.icon;

                    return (
                      <TableRow key={client.clientId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {client.clientRaisonSociale || `${client.clientName} ${client.clientPrenom}`}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {client.clientCode}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(client.totalInvoiced)}
                        </TableCell>
                        <TableCell className="text-green-600">
                          {formatCurrency(client.totalPaid)}
                        </TableCell>
                        <TableCell className="font-medium text-orange-600">
                          {formatCurrency(client.outstandingAmount)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {client.invoiceCount} factures
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <FileText className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Encours Détaillés ({outstandingPayments.length})
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
                  {outstandingPayments.map((payment) => (
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
                          <FileText className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Analyse des Délais de Paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module en cours de développement...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évolution des Encaissements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Module en cours de développement...
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
