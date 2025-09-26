import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, CreditCard, Trash2, Calendar, DollarSign } from "lucide-react";
import type { Payment, Invoice } from "@shared/schema";

const paymentFormSchema = z.object({
  invoiceId: z.number(),
  amount: z.string().min(0.01, "Montant requis"),
  method: z.enum(["cash", "bank", "card", "cheque"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
  paymentDate: z.string().optional()
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

const paymentMethodLabels = {
  cash: "Espèces",
  bank: "Virement",
  card: "Carte",
  cheque: "Chèque"
};

interface PaymentManagerProps {
  invoice: Invoice;
}

export function PaymentManager({ invoice }: PaymentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Queries
  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments", { invoiceId: invoice.id }],
    queryFn: async () => {
      const response = await apiRequest(`/api/invoices/${invoice.id}/payments`, 'GET');
      return response.json();
    },
  });

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      invoiceId: invoice.id,
      amount: "",
      method: "cash",
      reference: "",
      notes: "",
      paymentDate: new Date().toISOString().split('T')[0]
    }
  });

  // Mutations
  const createPaymentMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const paymentData = {
        ...data,
        paymentDate: data.paymentDate || new Date().toISOString(),
      };
      return await apiRequest("/api/payments", "POST", paymentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Paiement enregistré",
        description: "Le paiement a été ajouté avec succès"
      });
      setOpen(false);
      form.reset({
        invoiceId: invoice.id,
        amount: "",
        method: "cash",
        reference: "",
        notes: "",
        paymentDate: new Date().toISOString().split('T')[0]
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de l'enregistrement du paiement",
        variant: "destructive"
      });
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: number) => {
      return await apiRequest(`/api/payments/${paymentId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Paiement supprimé",
        description: "Le paiement a été supprimé avec succès"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const handleDeletePayment = (paymentId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce paiement ?")) {
      deletePaymentMutation.mutate(paymentId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
  const totalTTC = parseFloat(invoice.totalTTC);
  const remainingAmount = Math.max(0, totalTTC - totalPaid);

  return (
    <div className="space-y-6">
      {/* Résumé des paiements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Résumé des paiements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total facture</p>
              <p className="text-2xl font-bold">{totalTTC.toFixed(2)} DA</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Total payé</p>
              <p className="text-2xl font-bold text-green-600">{totalPaid.toFixed(2)} DA</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Reste à payer</p>
              <p className={`text-2xl font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {remainingAmount.toFixed(2)} DA
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "partial" ? "secondary" : "outline"}>
              {invoice.status === "paid" ? "Payé" :
                invoice.status === "partial" ? "Partiellement payé" :
                  "Non payé"}
            </Badge>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button disabled={remainingAmount <= 0} data-testid="button-add-payment">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un paiement
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Nouveau paiement
                  </DialogTitle>
                </DialogHeader>
                <DialogBody>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Montant (DA) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={remainingAmount.toString()}
                                placeholder={`Max: ${remainingAmount.toFixed(2)} DA`}
                                {...field}
                                data-testid="input-payment-amount"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Méthode de paiement *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-payment-method">
                                  <SelectValue placeholder="Sélectionner la méthode" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(paymentMethodLabels).map(([method, label]) => (
                                  <SelectItem key={method} value={method}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="reference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Référence</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="N° de chèque, référence virement..."
                                {...field}
                                data-testid="input-payment-reference"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date de paiement</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                data-testid="input-payment-date"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Notes sur le paiement..."
                                {...field}
                                data-testid="textarea-payment-notes"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                          Annuler
                        </Button>
                        <Button type="submit" disabled={createPaymentMutation.isPending}>
                          {createPaymentMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogBody>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Historique des paiements */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements ({payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-4">Chargement des paiements...</p>
          ) : payments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              Aucun paiement enregistré pour cette facture
            </p>
          ) : (
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
                  <TableRow key={payment.id} data-testid={`row-payment-${payment.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(payment.paymentDate)}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {parseFloat(payment.amount).toFixed(2)} DA
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {paymentMethodLabels[payment.method as keyof typeof paymentMethodLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.reference || "-"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePayment(payment.id)}
                        data-testid={`button-delete-payment-${payment.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}