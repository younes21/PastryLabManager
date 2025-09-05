import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DollarSign, 
  Receipt, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Eye,
  Plus
} from "lucide-react";

interface DeliveryPayment {
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
}

interface DeliveryPaymentDetailsProps {
  deliveryId: number;
}

export function DeliveryPaymentDetails({ deliveryId }: DeliveryPaymentDetailsProps) {
  // Query pour récupérer les paiements liés à cette livraison
  const { data: payments = [], isLoading } = useQuery<DeliveryPayment[]>({
    queryKey: ["/api/payments", { deliveryId }],
    queryFn: async () => {
      const response = await fetch(`/api/payments?deliveryId=${deliveryId}`);
      if (!response.ok) throw new Error("Failed to fetch delivery payments");
      return response.json();
    },
    enabled: !!deliveryId,
  });

  // Calculs des statistiques
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalInvoiced = payments.length > 0 ? payments[0].invoiceTotalTTC : 0;
  const outstandingAmount = totalInvoiced - totalPaid;
  const isFullyPaid = outstandingAmount <= 0;
  const isPartiallyPaid = totalPaid > 0 && outstandingAmount > 0;

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

  const getPaymentStatusIcon = () => {
    if (isFullyPaid) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (isPartiallyPaid) {
      return <Clock className="h-4 w-4 text-orange-600" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getPaymentStatusText = () => {
    if (isFullyPaid) {
      return "Entièrement payée";
    } else if (isPartiallyPaid) {
      return "Paiement partiel";
    } else {
      return "Non payée";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Détails de paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Détails de paiement
          </div>
          <div className="flex items-center gap-2">
            {getPaymentStatusIcon()}
            <span className="text-sm font-medium">{getPaymentStatusText()}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Résumé financier */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-muted-foreground">Total facturé</div>
            <div className="text-lg font-bold">{formatCurrency(totalInvoiced)}</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-sm text-muted-foreground">Montant payé</div>
            <div className="text-lg font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-sm text-muted-foreground">Encours</div>
            <div className="text-lg font-bold text-orange-600">{formatCurrency(outstandingAmount)}</div>
          </div>
        </div>

        {/* Alertes */}
        {outstandingAmount > 0 && (
          <Alert variant={isPartiallyPaid ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isPartiallyPaid 
                ? `Paiement partiel - Encours de ${formatCurrency(outstandingAmount)}`
                : `Facture non payée - Montant dû: ${formatCurrency(outstandingAmount)}`
              }
            </AlertDescription>
          </Alert>
        )}

        {isFullyPaid && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Facture entièrement payée
            </AlertDescription>
          </Alert>
        )}

        {/* Informations de la facture */}
        {payments.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Receipt className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Facture: {payments[0].invoiceCode}
              </span>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <p>Statut: {getStatusBadge(payments[0].invoiceStatus)}</p>
              <p>Total: {formatCurrency(payments[0].invoiceTotalTTC)}</p>
              <p>Payé: {formatCurrency(payments[0].invoiceAmountPaid)}</p>
            </div>
          </div>
        )}

        {/* Historique des paiements */}
        {payments.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Historique des paiements ({payments.length})</h4>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter paiement
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
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
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun paiement enregistré pour cette livraison</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un paiement
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
