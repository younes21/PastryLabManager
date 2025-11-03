import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Calendar, User, FileText, Package, Receipt } from "lucide-react";
import type { Payment, Client, Order, Invoice, InventoryOperation } from "@shared/schema";
import { DateTypes, FILTER_ALL } from "@shared/constants";

type PaymentWithRelations = Payment & {
  client: Client | null;
  order: Order | null;
  invoice: Invoice | null;
  delivery: InventoryOperation | null;
};

type PaymentsResponse = {
  payments: PaymentWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export default function PaymentsPage() {
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterDate, setFilterDate] = useState(FILTER_ALL);
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("");
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [invoiceFilter, setInvoiceFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  const { data: clientsData } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: ordersData } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: invoicesData } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: deliveriesData } = useQuery<InventoryOperation[]>({
    queryKey: ["/api/inventory-operations"],
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    
    if (filterDateFrom) params.append("dateFrom", filterDateFrom);
    if (filterDateTo) params.append("dateTo", filterDateTo);
    if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
    if (clientFilter && clientFilter !== "all") params.append("clientId", clientFilter);
    if (orderFilter) params.append("orderId", orderFilter);
    if (deliveryFilter) params.append("deliveryId", deliveryFilter);
    if (invoiceFilter) params.append("invoiceId", invoiceFilter);
    params.append("page", currentPage.toString());
    params.append("limit", pageSize.toString());

    return params.toString();
  };

  const { data: paymentsData, isLoading } = useQuery<PaymentsResponse>({
    queryKey: ["/api/payments/all/list", filterDateFrom, filterDateTo, statusFilter, clientFilter, orderFilter, deliveryFilter, invoiceFilter, currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/payments/all/list?${buildQueryParams()}`);
      if (!response.ok) throw new Error("Failed to fetch payments");
      return response.json();
    },
  });

  const getClientName = (client: Client | null) => {
    if (!client) return "-";
    if (client.type === "company") {
      return client.companyName || "-";
    }
    return `${client.firstName || ""} ${client.lastName || ""}`.trim() || "-";
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "En attente", variant: "secondary" },
      VALID: { label: "Validé", variant: "default" },
      CANCELLED: { label: "Annulé", variant: "destructive" },
      REFUNDED: { label: "Remboursé", variant: "outline" },
    };

    const config = statusConfig[status || "PENDING"] || { label: status || "-", variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", { 
      year: "numeric", 
      month: "2-digit", 
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAmount = (amount: string | null) => {
    if (!amount) return "0.00 DA";
    return `${parseFloat(amount).toFixed(2)} DA`;
  };

  const handleQuickDateFilter = (type: string) => {
    const base = new Date();
    let d: Date;
    
    if (type === DateTypes.YESTERDAY) {
      d = new Date(base.getTime() - 86400000);
    } else if (type === DateTypes.TOMORROW) {
      d = new Date(base.getTime() + 86400000);
    } else {
      d = base;
    }
    
    const iso = d.toISOString().split("T")[0];
    setFilterDateFrom(iso);
    setFilterDateTo(iso);
    setFilterDate(type);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilterDate(FILTER_ALL);
    setFilterDateFrom("");
    setFilterDateTo("");
    setStatusFilter("all");
    setClientFilter("all");
    setOrderFilter("");
    setDeliveryFilter("");
    setInvoiceFilter("");
    setCurrentPage(1);
  };

  const totalPages = paymentsData?.pagination.totalPages || 0;
  const payments = paymentsData?.payments || [];

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Paiements
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-3 items-end w-full flex-wrap">
              <div className="flex flex-1 gap-2 min-w-[300px]">
                <div className="flex flex-col space-y-1 flex-1">
                  <label className="text-xs text-gray-600">📅 Début</label>
                  <Input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => {
                      setFilterDateFrom(e.target.value);
                      setFilterDate(DateTypes.RANGE);
                      setCurrentPage(1);
                    }}
                    data-testid="input-date-from"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="flex flex-col space-y-1 flex-1">
                  <label className="text-xs text-gray-600">📅 Fin</label>
                  <Input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => {
                      setFilterDateTo(e.target.value);
                      setFilterDate(DateTypes.RANGE);
                      setCurrentPage(1);
                    }}
                    data-testid="input-date-to"
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  { label: "Aujourd'hui", value: DateTypes.TODAY },
                  { label: "Hier", value: DateTypes.YESTERDAY },
                ].map(({ label, value }) => (
                  <Button
                    key={value}
                    variant={filterDate === value ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full ${filterDate === value ? "bg-blue-600 text-white" : ""}`}
                    onClick={() => handleQuickDateFilter(value)}
                  >
                    {label}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-orange-200 text-orange-600 hover:bg-orange-600"
                  onClick={handleResetFilters}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                <SelectTrigger data-testid="select-status">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="VALID">Validé</SelectItem>
                  <SelectItem value="CANCELLED">Annulé</SelectItem>
                  <SelectItem value="REFUNDED">Remboursé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={clientFilter} onValueChange={(val) => { setClientFilter(val); setCurrentPage(1); }}>
                <SelectTrigger data-testid="select-client">
                  <SelectValue placeholder="Filtrer par client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {clientsData?.map((client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {getClientName(client)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="text"
                placeholder="Code commande..."
                value={orderFilter}
                onChange={(e) => { setOrderFilter(e.target.value); setCurrentPage(1); }}
                data-testid="input-order-code"
                className="h-9"
              />

              <Input
                type="text"
                placeholder="Code livraison..."
                value={deliveryFilter}
                onChange={(e) => { setDeliveryFilter(e.target.value); setCurrentPage(1); }}
                data-testid="input-delivery-code"
                className="h-9"
              />

              <Input
                type="text"
                placeholder="Code facture..."
                value={invoiceFilter}
                onChange={(e) => { setInvoiceFilter(e.target.value); setCurrentPage(1); }}
                data-testid="input-invoice-code"
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Liste des paiements ({paymentsData?.pagination.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead className="hidden md:table-cell">Commande</TableHead>
                  <TableHead className="hidden md:table-cell">Livraison</TableHead>
                  <TableHead className="hidden lg:table-cell">Facturation</TableHead>
                  <TableHead className="hidden lg:table-cell">Méthode</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Chargement des paiements...
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Aucun paiement trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(payment.date)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{getClientName(payment.client)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold text-green-600">
                        {formatAmount(payment.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {payment.order ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{payment.order.code}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(payment.order.orderDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {payment.delivery ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{payment.delivery.code}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(payment.delivery.scheduledDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {payment.invoice ? (
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{payment.invoice.code}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(payment.invoice.issueDate)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{payment.method || "-"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages} ({paymentsData?.pagination.total} paiements)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  data-testid="button-prev-page"
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  data-testid="button-next-page"
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
