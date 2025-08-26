import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { PaymentManager } from "@/components/payment-manager";
import { 
  ArrowLeft, 
  FileText, 
  User, 
  Calendar, 
  Euro, 
  Printer,
  Edit
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Invoice, Client, InvoiceItem, Article } from "@shared/schema";

export default function InvoiceDetailPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/invoices/:id");
  const invoiceId = parseInt(params?.id || "0");

  // Queries
  const { data: invoice, isLoading: invoiceLoading } = useQuery<Invoice>({
    queryKey: ["/api/invoices", invoiceId],
    queryFn: () => apiRequest(`/api/invoices/${invoiceId}`),
  });

  const { data: client } = useQuery<Client>({
    queryKey: ["/api/clients", invoice?.clientId],
    queryFn: () => apiRequest(`/api/clients/${invoice?.clientId}`),
    enabled: !!invoice?.clientId,
  });

  const { data: invoiceItems = [] } = useQuery<InvoiceItem[]>({
    queryKey: ["/api/invoices", invoiceId, "items"],
    queryFn: () => apiRequest(`/api/invoices/${invoiceId}/items`),
    enabled: !!invoiceId,
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const getArticleName = (articleId: number) => {
    const article = articles.find(a => a.id === articleId);
    return article ? article.name : `Article #${articleId}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "secondary";
      case "partial": return "default";
      case "paid": return "default";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Brouillon";
      case "partial": return "Partiellement payé";
      case "paid": return "Payé";
      case "cancelled": return "Annulé";
      default: return status;
    }
  };

  const handlePrint = () => {
    toast({ title: "Impression en cours de développement..." });
  };

  if (invoiceLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux factures
            </Button>
          </Link>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux factures
            </Button>
          </Link>
        </div>
        <div className="text-center py-8">
          <h2 className="text-2xl font-bold mb-2">Facture non trouvée</h2>
          <p className="text-muted-foreground">La facture demandée n'existe pas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/invoices">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux factures
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              Facture {invoice.code}
            </h1>
            <p className="text-muted-foreground">
              Détails et paiements de la facture
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimer
          </Button>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Statut</span>
              <Badge variant={getStatusColor(invoice.status)}>
                {getStatusLabel(invoice.status)}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date d'émission</span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(invoice.issueDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date d'échéance</span>
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(invoice.dueDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conditions de paiement</span>
              <span>{invoice.paymentTerms || "-"}</span>
            </div>
            {invoice.notes && (
              <div className="pt-2 border-t">
                <p className="text-muted-foreground text-sm mb-1">Notes</p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nom</span>
                  <span className="font-medium">
                    {client.firstName} {client.lastName}
                  </span>
                </div>
                {client.companyName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Société</span>
                    <span>{client.companyName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Téléphone</span>
                  <span>{client.phone || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{client.email || "-"}</span>
                </div>
                {client.address && (
                  <div className="pt-2 border-t">
                    <p className="text-muted-foreground text-sm mb-1">Adresse</p>
                    <p className="text-sm">
                      {client.address}
                      {client.city && `, ${client.city}`}
                      {client.postalCode && ` ${client.postalCode}`}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center py-4 text-muted-foreground">
                Chargement des informations client...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Articles facturés ({invoiceItems.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Article</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantité</TableHead>
                <TableHead className="text-right">Prix unitaire</TableHead>
                <TableHead className="text-right">TVA</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoiceItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Aucun article facturé
                  </TableCell>
                </TableRow>
              ) : (
                invoiceItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {getArticleName(item.articleId)}
                    </TableCell>
                    <TableCell>{item.description || "-"}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {parseFloat(item.unitPrice).toFixed(2)} DA
                    </TableCell>
                    <TableCell className="text-right">
                      {parseFloat(item.taxAmount || "0").toFixed(2)} DA
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {parseFloat(item.totalPrice).toFixed(2)} DA
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* Total Summary */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total HT</span>
              <span>{parseFloat(invoice.subtotalHT).toFixed(2)} DA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">TVA</span>
              <span>{parseFloat(invoice.totalTax).toFixed(2)} DA</span>
            </div>
            {parseFloat(invoice.discount || "0") > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Remise</span>
                <span>-{parseFloat(invoice.discount || "0").toFixed(2)} DA</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Total TTC</span>
              <span className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                {parseFloat(invoice.totalTTC).toFixed(2)} DA
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Manager */}
      <PaymentManager invoice={invoice} />
    </div>
  );
}