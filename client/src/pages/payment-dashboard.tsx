import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  FileText,
  RotateCcw,
  Percent,
  AlertCircle,
  CreditCard,
} from "lucide-react";

type Client = {
  id: number;
  firstName: string;
  lastName: string;
  companyName?: string;
};

type DashboardStats = {
  du: {
    facture: number;
    commande: number;
    livre: number;
  };
  encaissements: number;
  encours: {
    facture: number;
    commande: number;
    livre: number;
  };
  tauxRecouvrement: {
    facture: number;
    commande: number;
    livre: number;
  };
  impayes: number;
  totalRetours: number;
  totalRembourse: number;
  totalTransport: number;
  totalDiscount: number;
  nombreCommandes: number;
  nombreLivraisons: number;
  nombreFactures: number;
};

export default function PaymentDashboard() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("all");
  const [clientId, setClientId] = useState("all");
  const [orderCode, setOrderCode] = useState("");
  const [deliveryCode, setDeliveryCode] = useState("");
  const [invoiceCode, setInvoiceCode] = useState("");

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Build query params
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    if (status && status !== "all") params.append("status", status);
    if (clientId && clientId !== "all") params.append("clientId", clientId);
    if (orderCode) params.append("orderId", orderCode);
    if (deliveryCode) params.append("deliveryId", deliveryCode);
    if (invoiceCode) params.append("invoiceId", invoiceCode);
    return params.toString();
  };

  // Fetch dashboard statistics
  const {
    data: stats,
    isLoading,
    refetch,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/payments/dashboard/stats{query}", buildQueryParams()],
    queryFn: async () => {
      const query = buildQueryParams();
      const res = await fetch(`/api/payments/dashboard/stats?${query}`);
      if (!res.ok) throw new Error("Erreur de chargement des stats");
      return res.json();
    },
  });

  // Auto-refetch when filters change
  useEffect(() => {
    refetch();
  }, [dateFrom, dateTo, status, clientId, orderCode, deliveryCode, invoiceCode, refetch]);

  const resetFilters = () => {
    setDateFrom("");
    setDateTo("");
    setStatus("all");
    setClientId("all");
    setOrderCode("");
    setDeliveryCode("");
    setInvoiceCode("");
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} DA`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (isLoading && !stats) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-bold">Tableau de Bord Paiements</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-dashboard-title">
          Tableau de Bord Paiements
        </h1>
        <Button
          variant="outline"
          onClick={resetFilters}
          data-testid="button-reset-filters"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Réinitialiser
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date début</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                data-testid="input-date-from"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date fin</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                data-testid="input-date-to"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">État paiement</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status" data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="VALID">Validé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                  <SelectItem value="REFUNDED">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client" data-testid="select-client">
                  <SelectValue placeholder="Tous les clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.companyName ||
                        `${client.firstName} ${client.lastName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderCode">Code commande</Label>
              <Input
                id="orderCode"
                type="text"
                placeholder="CMD-..."
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                data-testid="input-order-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryCode">Code livraison</Label>
              <Input
                id="deliveryCode"
                type="text"
                placeholder="LIV-..."
                value={deliveryCode}
                onChange={(e) => setDeliveryCode(e.target.value)}
                data-testid="input-delivery-code"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoiceCode">Code facture</Label>
              <Input
                id="invoiceCode"
                type="text"
                placeholder="FAC-..."
                value={invoiceCode}
                onChange={(e) => setInvoiceCode(e.target.value)}
                data-testid="input-invoice-code"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {stats && (
        <>
          {/* Dû Section */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4" data-testid="text-section-du">
              Montants Dû
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Facturé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-3xl font-bold" data-testid="text-du-facture">
                    {formatCurrency(stats.du.facture)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Commandé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-3xl font-bold" data-testid="text-du-commande">
                    {formatCurrency(stats.du.commande)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Livré (net)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-3xl font-bold" data-testid="text-du-livre">
                    {formatCurrency(stats.du.livre)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Encaissements */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4" data-testid="text-section-encaissements">
              Encaissements
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Encaissé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl md:text-4xl font-bold text-emerald-600" data-testid="text-encaissements">
                    {formatCurrency(stats.encaissements)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Encours Section */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4" data-testid="text-section-encours">
              Encours Client
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Encours Facturé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-3xl font-bold text-orange-600" data-testid="text-encours-facture">
                    {formatCurrency(stats.encours.facture)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Encours Commandé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-3xl font-bold text-amber-600" data-testid="text-encours-commande">
                    {formatCurrency(stats.encours.commande)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Encours Livré
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-3xl font-bold text-yellow-600" data-testid="text-encours-livre">
                    {formatCurrency(stats.encours.livre)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Taux de Recouvrement */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4" data-testid="text-section-taux">
              Taux de Recouvrement
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Par rapport Facturé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-3xl font-bold text-indigo-600" data-testid="text-taux-facture">
                    {formatPercent(stats.tauxRecouvrement.facture)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-violet-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Par rapport Commandé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-3xl font-bold text-violet-600" data-testid="text-taux-commande">
                    {formatPercent(stats.tauxRecouvrement.commande)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-fuchsia-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Par rapport Livré
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl md:text-3xl font-bold text-fuchsia-600" data-testid="text-taux-livre">
                    {formatPercent(stats.tauxRecouvrement.livre)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Autres Métriques */}
          <div>
            <h2 className="text-xl md:text-2xl font-semibold mb-4" data-testid="text-section-autres">
              Autres Métriques
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Impayés / Pertes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl md:text-2xl font-bold text-red-600" data-testid="text-impayes">
                    {formatCurrency(stats.impayes)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-rose-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Valeur Retours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl md:text-2xl font-bold" data-testid="text-retours">
                    {formatCurrency(stats.totalRetours)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-pink-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Montant Remboursé
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl md:text-2xl font-bold" data-testid="text-rembourse">
                    {formatCurrency(stats.totalRembourse)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-cyan-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Total Transport
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl md:text-2xl font-bold" data-testid="text-transport">
                    {formatCurrency(stats.totalTransport)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-teal-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Total Remises
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl md:text-2xl font-bold" data-testid="text-discount">
                    {formatCurrency(stats.totalDiscount)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-sky-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Nombre de Commandes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl md:text-2xl font-bold" data-testid="text-nb-commandes">
                    {stats.nombreCommandes}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-lime-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Nombre de Livraisons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl md:text-2xl font-bold" data-testid="text-nb-livraisons">
                    {stats.nombreLivraisons}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-slate-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Nombre de Factures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl md:text-2xl font-bold" data-testid="text-nb-factures">
                    {stats.nombreFactures}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
