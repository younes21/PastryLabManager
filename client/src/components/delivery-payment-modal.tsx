import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CreditCard, Banknote, Receipt, Trash2, XCircle, Edit } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeliveryPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: any;
  onSuccess?: () => void;
}

interface PaymentData {
  id?: number;
  amount: number;
  method: string;
  reference?: string;
  notes?: string;
  date?: string;
  receivedBy?: number;
}

export function DeliveryPaymentModal({ open, onOpenChange, delivery, onSuccess }: DeliveryPaymentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [paymentData, setPaymentData] = useState<PaymentData>({
    amount: 0,
    method: "cash",
    reference: "",
    notes: "",
    date: new Date().toISOString().split('T')[0],
    receivedBy: undefined,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Récupérer les paiements existants
  const { data: existingPayments = [], refetch } = useQuery({
    queryKey: ["/api/deliveries", delivery?.id, "payments"],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/${delivery?.id}/payments`);
      return response.json();
    },
    enabled: !!delivery?.id && open,
  });

  // Récupérer les livreurs disponibles
  const { data: deliveryPersons = [] } = useQuery({
    queryKey: ["/api/deliveries/available-delivery-persons"],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/available-delivery-persons`);
      return response.json();
    },
    enabled: open,
  });

  // Mutation pour créer/modifier un paiement
  const savePaymentMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      // Include deliveryId and clientId explicitly
      const payloadWithIds = {
        ...data,
        deliveryId: delivery.id,
        clientId: delivery.clientId,
      };
      return await apiRequest(`/api/deliveries/${delivery.id}/payments`, "POST", payloadWithIds);
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

  // Mutation pour supprimer un paiement
  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest(`/api/payments/${paymentId}`, "DELETE");
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Paiement supprimé",
        description: "Le paiement a été supprimé avec succès",
      });
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le paiement",
        variant: "destructive",
      });
    },
  });

  // Mutation pour annuler un paiement
  const cancelPaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest(`/api/payments/${paymentId}/cancel`, "PUT");
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Paiement annulé",
        description: "Le paiement a été annulé avec succès",
      });
      setCancelDialogOpen(false);
      setSelectedPayment(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'annuler le paiement",
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
      date: new Date().toISOString().split('T')[0],
      receivedBy: undefined,
    });
    setIsEditing(false);
  };

  const handleEdit = (payment: any) => {
    setPaymentData({
      id: payment.id,
      amount: parseFloat(payment.amount),
      method: payment.method,
      reference: payment.reference || "",
      notes: payment.notes || "",
      date: payment.date ? new Date(payment.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      receivedBy: payment.receivedBy || undefined,
    });
    setIsEditing(true);
  };

  const handleDelete = (payment: any) => {
    setSelectedPayment(payment);
    setDeleteDialogOpen(true);
  };

  const handleCancel = (payment: any) => {
    setSelectedPayment(payment);
    setCancelDialogOpen(true);
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

    savePaymentMutation.mutate(paymentData);
  };

  // Calculate totals based on delivery, not order
  const deliveryTotal = parseFloat(delivery?.totalTTC || "0");
  const totalPaid = existingPayments
    .filter((p: any) => p.status !== 'CANCELLED')
    .reduce((sum: number, payment: any) => sum + parseFloat(payment.amount || "0"), 0);
  const remainingAmount = deliveryTotal - totalPaid;

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return <Badge variant="default" className="bg-green-600">Validé</Badge>;
      case "PENDING":
        return <Badge variant="secondary">En attente</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <>
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
              {/* Informations de la livraison */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Total livraison</Label>
                  <p className="text-lg font-semibold">{deliveryTotal.toFixed(2)} DA</p>
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
                <h3 className="font-medium mb-4">{isEditing ? "Modifier le paiement" : "Nouveau paiement"}</h3>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date *</Label>
                      <Input
                        id="date"
                        type="date"
                        value={paymentData.date}
                        onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="receivedBy">Reçu par</Label>
                      <Select value={paymentData.receivedBy?.toString() || ""} onValueChange={(value) => setPaymentData({ ...paymentData, receivedBy: value ? parseInt(value) : undefined })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un livreur" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryPersons.map((person: any) => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.firstName} {person.lastName}
                            </SelectItem>
                          ))}
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
                      {isEditing ? "Annuler la modification" : "Réinitialiser"}
                    </Button>
                    <Button
                      type="submit"
                      disabled={savePaymentMutation.isPending}
                    >
                      {savePaymentMutation.isPending ? "Enregistrement..." : (isEditing ? "Mettre à jour" : "Enregistrer le paiement")}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Historique des paiements */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-medium">Historique des paiements</h3>
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
                        <TableHead>Reçu par</TableHead>
                        <TableHead>Référence</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {existingPayments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.date ? new Date(payment.date).toLocaleDateString() : "-"}
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
                          <TableCell>
                            {deliveryPersons.find((p: any) => p.id === payment.receivedBy)?.firstName || "-"}
                          </TableCell>
                          <TableCell>{payment.reference || "-"}</TableCell>
                          <TableCell>{getStatusBadge(payment.status || "PENDING")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {payment.status !== 'CANCELLED' && payment.status !== 'VALID' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(payment)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDelete(payment)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                              {payment.status === 'VALID' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancel(payment)}
                                >
                                  <XCircle className="h-4 w-4 text-orange-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce paiement de {selectedPayment?.amount} DA ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPayment && deletePaymentMutation.mutate(selectedPayment.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'annulation</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir annuler ce paiement validé de {selectedPayment?.amount} DA ?
              Le paiement sera marqué comme annulé mais restera dans l'historique.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Non</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPayment && cancelPaymentMutation.mutate(selectedPayment.id)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Annuler le paiement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
