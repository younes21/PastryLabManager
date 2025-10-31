import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, CheckCircle, Clock, Search } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function DeliveryPaymentsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deliveredAmounts, setDeliveredAmounts] = useState<Record<number, string>>({});

  // Récupérer les paiements affectés au livreur
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["/api/payments/livreur", user?.id],
  });

  // Mutation pour confirmer/annuler un paiement
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, confirmed, deliveredAmount }: { paymentId: number, confirmed: boolean, deliveredAmount?: number }) => {
      return apiRequest(`/api/payments/${paymentId}/confirm`, {
        method: "PATCH",
        body: JSON.stringify({ 
          confirmedByDeliver: confirmed,
          confirmationDate: confirmed ? new Date().toISOString() : null,
          deliveredAmount: deliveredAmount || null
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments/livreur", user?.id] });
      toast({
        title: "Paiement mis à jour",
        description: "Le paiement a été mis à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le paiement.",
        variant: "destructive",
      });
    },
  });

  // Filtrer les paiements
  const filteredPayments = payments.filter((payment: any) => {
    const searchLower = searchTerm.toLowerCase();
    const clientName = payment.delivery?.client?.firstName && payment.delivery?.client?.lastName
      ? `${payment.delivery.client.firstName} ${payment.delivery.client.lastName}`
      : payment.delivery?.client?.companyName || '';
    
    return (
      payment.delivery?.code?.toLowerCase().includes(searchLower) ||
      payment.delivery?.order?.code?.toLowerCase().includes(searchLower) ||
      clientName.toLowerCase().includes(searchLower)
    );
  });

  // Calculer les totaux
  const totalEncaisse = filteredPayments
    .filter((p: any) => p.confirmedByDeliver)
    .reduce((sum: number, p: any) => sum + parseFloat(p.deliveredAmount || p.amount || 0), 0);

  const totalEnAttente = filteredPayments
    .filter((p: any) => !p.confirmedByDeliver)
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0);

  // Trier par état (non encaissés en haut)
  const sortedPayments = [...filteredPayments].sort((a: any, b: any) => {
    if (a.confirmedByDeliver === b.confirmedByDeliver) return 0;
    return a.confirmedByDeliver ? 1 : -1;
  });

  const handleDeliveredAmountChange = (paymentId: number, value: string) => {
    setDeliveredAmounts(prev => ({ ...prev, [paymentId]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-blue-500 text-white p-4">
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={() => setLocation("/delivery/home")}
            className="text-white"
            data-testid="button-back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold">Paiements</h1>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            type="text"
            placeholder="Code commande, code livraison, nom client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg text-gray-800"
            data-testid="input-search-payments"
          />
        </div>
      </div>

      <div className="p-4">
        {/* Totaux */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-gray-700">Total encaissé</span>
              <span className="text-2xl font-bold text-green-600" data-testid="text-total-encaisse">
                {totalEncaisse.toLocaleString()} DA
              </span>
            </div>
            <div className="flex items-center justify-between text-sm pt-3 border-t">
              <span className="text-gray-600">En attente</span>
              <span className="font-semibold text-orange-600" data-testid="text-total-en-attente">
                {totalEnAttente.toLocaleString()} DA
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Liste des paiements */}
        {isLoading ? (
          <div>Chargement...</div>
        ) : sortedPayments.length === 0 ? (
          <div className="text-center text-gray-500 py-10" data-testid="text-no-payments">
            Aucun paiement trouvé
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPayments.map((payment: any) => {
              const clientName = payment.delivery?.client?.firstName && payment.delivery?.client?.lastName
                ? `${payment.delivery.client.firstName} ${payment.delivery.client.lastName}`
                : payment.delivery?.client?.companyName || 'Client inconnu';
              
              const deliveredAmount = deliveredAmounts[payment.id] || payment.amount;

              return (
                <Card key={payment.id} data-testid={`card-payment-${payment.id}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold">
                          Commande: {payment.delivery?.order?.code || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Livraison: {payment.delivery?.code || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">{clientName}</p>
                      </div>
                      {payment.confirmedByDeliver ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <Clock className="w-6 h-6 text-orange-500" />
                      )}
                    </div>

                    {!payment.confirmedByDeliver && (
                      <div className="mb-3">
                        <label className="text-sm text-gray-600 mb-1 block">
                          Montant livré (DA)
                        </label>
                        <Input
                          type="number"
                          value={deliveredAmount}
                          onChange={(e) => handleDeliveredAmountChange(payment.id, e.target.value)}
                          className="w-full"
                          step="0.01"
                          data-testid={`input-delivered-amount-${payment.id}`}
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-500">Montant:</span>
                        <span className="text-xl font-bold ml-2">
                          {parseFloat(payment.amount || 0).toLocaleString()} DA
                        </span>
                      </div>
                      {payment.confirmedByDeliver ? (
                        <div className="flex gap-2">
                          <span className="text-sm text-green-600 font-semibold">
                            Encaissé: {parseFloat(payment.deliveredAmount || payment.amount || 0).toLocaleString()} DA
                          </span>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => confirmPaymentMutation.mutate({ 
                              paymentId: payment.id, 
                              confirmed: false 
                            })}
                            disabled={confirmPaymentMutation.isPending}
                            data-testid={`button-cancel-payment-${payment.id}`}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => confirmPaymentMutation.mutate({ 
                            paymentId: payment.id, 
                            confirmed: true,
                            deliveredAmount: parseFloat(deliveredAmount || payment.amount)
                          })}
                          disabled={confirmPaymentMutation.isPending}
                          size="sm"
                          data-testid={`button-confirm-payment-${payment.id}`}
                        >
                          Confirmer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
