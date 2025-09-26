import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Banknote, Receipt } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DeliveryPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: any;
  onSuccess?: () => void;
}

interface PaymentData {
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
}

export function DeliveryPaymentModal({ open, onOpenChange, delivery, onSuccess }: DeliveryPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 0,
    method: "cash",
    reference: "",
    notes: "",
  });

  // Récupérer les paiements existants
  const { data: existingPayments = [], refetch } = useQuery({
    queryKey: ["/api/deliveries", delivery?.id, "payments"],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/${delivery?.id}/payments`);
      return response.json();
    },
    enabled: !!delivery?.id && open,
  });

  // Récupérer les détails de la commande pour calculer le montant restant
  const { data: orderDetails } = useQuery({
    queryKey: ["/api/orders", delivery?.orderId],
    queryFn: async () => {
      const response = await fetch(`/api/orders/${delivery?.orderId}`);
      return response.json();
    },
    enabled: !!delivery?.orderId && open,
  });

  // Mutation pour créer un paiement
  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      return await apiRequest(`/api/deliveries/${delivery.id}/payments`, "POST", data);
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Paiement enregistré",
        description: "Le paiement a été enregistré avec succès",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer le paiement",
        variant: "destructive",
      });
    },
  });

  // Mutation pour créer une facture
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/deliveries/${delivery.id}/invoice`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Facture créée",
        description: "La facture a été créée automatiquement",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la facture",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setPaymentData({
      amount: 0,
      method: "cash",
      reference: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentData.amount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive",
      });
      return;
    }

    createPaymentMutation.mutate(paymentData);
  };

  const totalPaid = existingPayments.reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || "0"), 0);
  const remainingAmount = parseFloat(orderDetails?.totalTTC || "0") - totalPaid;

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "cash": return <Banknote className="h-4 w-4" />;
      case "card": return <CreditCard className="h-4 w-4" />;
      case "bank": return <Receipt className="h-4 w-4" />;
      default: return <Banknote className="h-4 w-4" />;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "cash": return "Espèces";
      case "card": return "Carte bancaire";
      case "bank": return "Virement";
      case "cheque": return "Chèque";
      default: return method;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paiement à la livraison - #{delivery?.code}
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-6">
            {/* Informations de la commande */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Total commande</Label>
                <p className="text-lg font-semibold">{parseFloat(orderDetails?.totalTTC || "0").toFixed(2)} DA</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Montant payé</Label>
                <p className="text-lg font-semibold text-green-600">{totalPaid.toFixed(2)} DA</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Reste à payer</Label>
                <p className="text-lg font-semibold text-orange-600">{remainingAmount.toFixed(2)} DA</p>
              </div>
            </div>

            {/* Formulaire de paiement */}
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-4">Nouveau paiement</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Montant *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentData.amount || ""}
                      onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="method">Méthode de paiement *</Label>
                    <Select value={paymentData.method} onValueChange={(value) => setPaymentData({ ...paymentData, method: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">
                          <div className="flex items-center gap-2">
                            <Banknote className="h-4 w-4" />
                            Espèces
                          </div>
                        </SelectItem>
                        <SelectItem value="card">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Carte bancaire
                          </div>
                        </SelectItem>
                        <SelectItem value="bank">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Virement
                          </div>
                        </SelectItem>
                        <SelectItem value="cheque">
                          <div className="flex items-center gap-2">
                            <Receipt className="h-4 w-4" />
                            Chèque
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="reference">Référence</Label>
                  <Input
                    id="reference"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                    placeholder="N° de transaction, chèque, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                    placeholder="Notes sur le paiement..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={createPaymentMutation.isPending}
                  >
                    {createPaymentMutation.isPending ? "Enregistrement..." : "Enregistrer le paiement"}
                  </Button>
                </div>
              </form>
            </div>

            {/* Historique des paiements */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">Historique des paiements</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => createInvoiceMutation.mutate()}
                  disabled={createInvoiceMutation.isPending}
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Créer facture
                </Button>
              </div>

              {existingPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun paiement enregistré</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Méthode</TableHead>
                      <TableHead>Référence</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {existingPayments.map((payment: any) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {parseFloat(payment.amount).toFixed(2)} DA
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getMethodIcon(payment.method)}
                            {getMethodLabel(payment.method)}
                          </div>
                        </TableCell>
                        <TableCell>{payment.reference || "-"}</TableCell>
                        <TableCell>{payment.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
