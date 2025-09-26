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
  const { data: availableDeliveryPersons = [] } = useQuery({
    queryKey: ["/api/deliveries/available-delivery-persons"],
    queryFn: async () => {
      const response = await fetch("/api/deliveries/available-delivery-persons");
      return response.json();
    },
  });

  // Mutation pour assigner un livreur
  const assignMutation = useMutation({
    mutationFn: async (deliveryPersonId: number) => {
      return await apiRequest(`/api/deliveries/${delivery.id}/assign`, "PUT", {
        deliveryPersonId,
      });
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
              <Select value={selectedDeliveryPersonId} onValueChange={setSelectedDeliveryPersonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un livreur" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(availableDeliveryPersons) && availableDeliveryPersons.map((person: any) => (
                    <SelectItem key={person.id} value={person.id.toString()}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {person.firstName} {person.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
