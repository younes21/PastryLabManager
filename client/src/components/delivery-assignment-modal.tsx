import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Truck } from "lucide-react";

interface DeliveryAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  delivery: any;
  onSuccess?: () => void;
}

export function DeliveryAssignmentModal({ open, onOpenChange, delivery, onSuccess }: DeliveryAssignmentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState<string>("");

  // Récupérer les livreurs disponibles
  const { data: availableDeliveryPersons = [], isLoading, isError, error } = useQuery({
    queryKey: ["/api/deliveries/available-delivery-persons"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/deliveries/available-delivery-persons");
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des livreurs");
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error fetching delivery persons:", error);
        throw error;
      }
    },
    enabled: open, // Only fetch when modal is open
  });

  // Mutation pour assigner un livreur
  const assignMutation = useMutation({
    mutationFn: async (deliveryPersonId: number) => {
      if (!delivery?.id) {
        throw new Error("ID de livraison manquant");
      }
      const response = await fetch(`/api/deliveries/${delivery.id}/assign`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ deliveryPersonId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erreur lors de l'assignation du livreur");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deliveries"] });
      toast({
        title: "Livreur assigné",
        description: "Le livreur a été assigné avec succès à cette livraison",
      });
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'assigner le livreur",
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedDeliveryPersonId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un livreur",
        variant: "destructive",
      });
      return;
    }

    assignMutation.mutate(parseInt(selectedDeliveryPersonId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Assigner un livreur
          </DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Livraison #{delivery?.code}</p>
              <p className="text-sm text-muted-foreground">
                Commande #{delivery?.orderId}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryPerson">Livreur *</Label>
              {isError ? (
                <div className="text-red-500 text-sm">
                  Erreur lors du chargement des livreurs : {(error as Error)?.message || "Erreur inconnue"}
                </div>
              ) : (
                <Select 
                  value={selectedDeliveryPersonId} 
                  onValueChange={setSelectedDeliveryPersonId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Chargement..." : "Sélectionner un livreur"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDeliveryPersons.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500">Aucun livreur disponible</div>
                    ) : (
                      availableDeliveryPersons.map((person: any) => (
                        <SelectItem key={person.id} value={person.id.toString()}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {`${person.firstName} ${person.lastName}`}
                            {person.email && (
                              <span className="text-xs text-gray-500">
                                ({person.email})
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={handleAssign}
                disabled={assignMutation.isPending || !selectedDeliveryPersonId}
              >
                {assignMutation.isPending ? "Assignation..." : "Assigner"}
              </Button>
            </div>
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
