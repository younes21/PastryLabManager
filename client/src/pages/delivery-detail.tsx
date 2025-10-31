import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useRoute, useLocation } from "wouter";
import { ArrowLeft, Package, Phone, Navigation, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
// Select/Input components not used in this page
import { useToast } from "@/hooks/use-toast";
import {  queryClient } from "@/lib/queryClient";

export default function DeliveryDetailPage() {
  const { user } = useAuth();
  const [, params] = useRoute("/delivery/detail/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [problemDescription, setProblemDescription] = useState("");
  const [rebutItems, setRebutItems] = useState<any[]>([]);
  const [retourItems, setRetourItems] = useState<any[]>([]);

  const deliveryId = parseInt(params?.id || "0");


  // Récupérer les détails de la livraison
  const { data: delivery, isLoading } = useQuery({
    queryKey: ["/api/deliveries", deliveryId],
       queryFn: async () => {
      const response = await fetch(`/api/deliveries/${deliveryId}/details-deliver`);
      return response.json();
    },
  });

  // Mutation pour changer le statut
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return fetch(`/api/deliveries/${deliveryId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ statusDeliveryPerson: newStatus }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries", deliveryId] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/livreur", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries/stats", user?.id] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la livraison a été mis à jour avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut.",
        variant: "destructive",
      });
    },
  });

  // Mutation pour signaler un problème
  const reportProblemMutation = useMutation({
    mutationFn: async (problemData: any) => {
      return fetch(`/api/deliveries/${deliveryId}/problem`, {
        method: "PATCH",
        body: JSON.stringify({ deliveryPersonNote: JSON.stringify(problemData) }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries", deliveryId] });
      toast({
        title: "Problème signalé",
        description: "Le problème a été signalé avec succès.",
      });
      setProblemDialogOpen(false);
      setProblemDescription("");
      setRebutItems([]);
      setRetourItems([]);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de signaler le problème.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 p-4">Chargement...</div>;
  }

  if (!delivery) {
    return <div className="min-h-screen bg-gray-50 p-4">Livraison introuvable</div>;
  }

  const clientName = delivery.client?.firstName && delivery.client?.lastName
    ? `${delivery.client.firstName} ${delivery.client.lastName}`
    : delivery.client?.companyName || 'Client inconnu';
  
  const address = delivery.client?.address && delivery.client?.city
    ? `${delivery.client.address}, ${delivery.client.postalCode || ''} ${delivery.client.city}${delivery.client.wilaya ? ', ' + delivery.client.wilaya : ''}`
    : 'Adresse non renseignée';

  const phone = delivery.client?.phone || delivery.client?.mobile || 'N/A';

  const handleSubmitProblem = () => {
    if (!problemDescription.trim()) {
      toast({
        title: "Erreur",
        description: "La description du problème est obligatoire.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier que rebut + retour <= quantité livrée
    // TODO: Ajouter validation

    const problemData = {
      description: problemDescription,
      rebut: rebutItems,
      retour: retourItems,
      date: new Date().toISOString(),
    };

    reportProblemMutation.mutate(problemData);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4">
        <button 
          onClick={() => setLocation("/delivery/list")}
          className="mb-3 flex items-center gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Retour</span>
        </button>
        <h1 className="text-xl font-bold">Détails de livraison</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* Informations client */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Numéro de commande</p>
              <p className="font-semibold" data-testid="text-order-number">{delivery.order?.code || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Numéro de livraison</p>
              <p className="font-semibold">{delivery.code}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Client</p>
              <p className="font-semibold" data-testid="text-client-name">{clientName}</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="font-semibold">{phone}</p>
              </div>
              <a 
                href={`tel:${phone}`}
                className="bg-green-500 text-white p-3 rounded-full"
                data-testid="button-call"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-semibold">{address}</p>
              </div>
              <button 
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)}
                className="bg-blue-500 text-white p-3 rounded-full ml-2"
                data-testid="button-navigate"
              >
                <Navigation className="w-5 h-5" />
              </button>
            </div>
            <div>
              <p className="text-sm text-gray-500">Heure de livraison</p>
              <p className="font-semibold">
                {delivery.scheduledDate 
                  ? new Date(delivery.scheduledDate).toLocaleString('fr-FR')
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Statut admin</p>
              <p className="font-semibold">{delivery.status}</p>
            </div>
          </CardContent>
        </Card>

        {/* Articles à livrer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Articles à livrer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {delivery.items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{item.article?.name || 'Article inconnu'}</p>
                      <p className="text-sm text-gray-500">
                        {parseFloat(item.quantity || 0)} × {parseFloat(item.unitPriceSale || 0).toLocaleString()} DA
                      </p>
                    </div>
                  </div>
                  <p className="font-bold">
                    {parseFloat(item.totalPriceSale || 0).toLocaleString()} DA
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="font-semibold text-lg">Total</span>
              <span className="text-2xl font-bold text-green-600" data-testid="text-total-amount">
                {parseFloat(delivery.totalTTC || 0).toLocaleString()} DA
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Changer le statut */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Changer le statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => updateStatusMutation.mutate('in_progress')}
                variant={delivery.statusDeliveryPerson === 'in_progress' ? 'default' : 'outline'}
                className="w-full"
                data-testid="button-status-in-progress"
              >
                En route
              </Button>
              <Button 
                onClick={() => updateStatusMutation.mutate('delivered')}
                variant={delivery.statusDeliveryPerson === 'delivered' ? 'default' : 'outline'}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-status-delivered"
              >
                Livré
              </Button>
              <Button 
                onClick={() => updateStatusMutation.mutate('partially_delivered')}
                variant={delivery.statusDeliveryPerson === 'partially_delivered' ? 'default' : 'outline'}
                className="w-full"
                data-testid="button-status-partially-delivered"
              >
                Livré partiellement
              </Button>
              <Button 
                onClick={() => updateStatusMutation.mutate('cancelled')}
                variant={delivery.statusDeliveryPerson === 'cancelled' ? 'destructive' : 'outline'}
                className="w-full"
                data-testid="button-status-cancelled"
              >
                Annulé
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Signaler un problème */}
        <Dialog open={problemDialogOpen} onOpenChange={setProblemDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="destructive" 
              className="w-full" 
              size="lg"
              data-testid="button-report-problem"
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              Signaler un problème
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Signaler un problème</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="problem-description">Description du problème *</Label>
                <Textarea 
                  id="problem-description"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Décrivez le problème rencontré..."
                  rows={4}
                  data-testid="textarea-problem-description"
                />
              </div>
              <Button 
                onClick={handleSubmitProblem}
                disabled={reportProblemMutation.isPending}
                className="w-full"
                data-testid="button-submit-problem"
              >
                {reportProblemMutation.isPending ? "Envoi..." : "Soumettre"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
