import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Truck, Plus, MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DeliveryTrackingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: any;
  onSuccess?: () => void;
}

export function DeliveryTrackingModal({ open, onOpenChange, delivery, onSuccess }: DeliveryTrackingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [trackingNumber, setTrackingNumber] = useState("");

  // Récupérer les détails de la livraison
  const { data: deliveryDetails, refetch } = useQuery({
    queryKey: ["/api/deliveries", delivery?.id],
    queryFn: async () => {
      const response = await fetch(`/api/deliveries/${delivery?.id}/details`);
      return response.json();
    },
    enabled: !!delivery?.id && open,
  });

  // Mutation pour ajouter un numéro de suivi
  const addTrackingMutation = useMutation({
    mutationFn: async (trackingNumber: string) => {
      return await apiRequest(`/api/deliveries/${delivery.id}/tracking`, "PUT", {
        trackingNumber,
      });
    },
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Numéro de suivi ajouté",
        description: "Le numéro de suivi a été ajouté avec succès",
      });
      setTrackingNumber("");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le numéro de suivi",
        variant: "destructive",
      });
    },
  });

  const handleAddTracking = () => {
    if (!trackingNumber.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un numéro de suivi",
        variant: "destructive",
      });
      return;
    }

    addTrackingMutation.mutate(trackingNumber);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_transit": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "En attente";
      case "in_transit": return "En transit";
      case "delivered": return "Livré";
      case "cancelled": return "Annulé";
      default: return status;
    }
  };

  const trackingNumbers = deliveryDetails?.trackingNumbers 
    ? JSON.parse(deliveryDetails.trackingNumbers) 
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Suivi de livraison - #{delivery?.code}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
              <div className="mt-1">
                <Badge className={getStatusColor(deliveryDetails?.status || "pending")}>
                  {getStatusLabel(deliveryDetails?.status || "pending")}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Livreur</Label>
              <p className="mt-1 text-sm">
                {deliveryDetails?.deliveryPersonId ? "Assigné" : "Non assigné"}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date prévue</Label>
              <p className="mt-1 text-sm">
                {deliveryDetails?.scheduledDate 
                  ? new Date(deliveryDetails.scheduledDate).toLocaleDateString()
                  : "Non définie"
                }
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Date de livraison</Label>
              <p className="mt-1 text-sm">
                {deliveryDetails?.deliveredAt 
                  ? new Date(deliveryDetails.deliveredAt).toLocaleDateString()
                  : "Non livré"
                }
              </p>
            </div>
          </div>

          {/* Adresse de livraison */}
          {deliveryDetails?.deliveryAddress && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Adresse de livraison</Label>
              <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <p className="text-sm">{deliveryDetails.deliveryAddress}</p>
                </div>
              </div>
            </div>
          )}

          {/* Numéros de suivi existants */}
          {trackingNumbers.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Numéros de suivi</Label>
              <div className="mt-2 space-y-2">
                {trackingNumbers.map((number: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono text-sm">{number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ajouter un numéro de suivi */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Ajouter un numéro de suivi</Label>
            <div className="mt-2 flex gap-2">
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Ex: TRK123456789"
                className="flex-1"
              />
              <Button 
                onClick={handleAddTracking}
                disabled={addTrackingMutation.isPending || !trackingNumber.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>

          {/* Notes de livraison */}
          {deliveryDetails?.deliveryNotes && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Notes de livraison</Label>
              <div className="mt-1 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm">{deliveryDetails.deliveryNotes}</p>
              </div>
            </div>
          )}

          {/* Timeline de statuts */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Historique</Label>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Livraison créée</p>
                  <p className="text-xs text-muted-foreground">
                    {deliveryDetails?.createdAt 
                      ? new Date(deliveryDetails.createdAt).toLocaleString()
                      : "Date inconnue"
                    }
                  </p>
                </div>
              </div>
              
              {deliveryDetails?.deliveredAt && (
                <div className="flex items-center gap-3 p-2 bg-green-50 rounded-lg">
                  <Clock className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Livraison effectuée</p>
                    <p className="text-xs text-green-600">
                      {new Date(deliveryDetails.deliveredAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
