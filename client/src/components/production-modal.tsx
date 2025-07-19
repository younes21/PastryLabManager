import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductionModal({ isOpen, onClose }: ProductionModalProps) {
  const [formData, setFormData] = useState({
    recipeId: "",
    preparerId: "",
    quantity: "",
    scheduledTime: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipes } = useQuery({
    queryKey: ["/api/recipes/active"],
  });

  const { data: preparers } = useQuery({
    queryKey: ["/api/users"],
    select: (users: any[]) => users.filter(user => user.role === "preparateur")
  });

  const createProductionMutation = useMutation({
    mutationFn: async (productionData: any) => {
      const response = await apiRequest("POST", "/api/productions", productionData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/productions"] });
      toast({
        title: "Production programmée",
        description: "La production a été ajoutée au planning avec succès.",
      });
      onClose();
      setFormData({
        recipeId: "",
        preparerId: "",
        quantity: "",
        scheduledTime: ""
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de programmer la production.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipeId || !formData.preparerId || !formData.quantity || !formData.scheduledTime) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    const scheduledDateTime = new Date(formData.scheduledTime);
    
    createProductionMutation.mutate({
      recipeId: parseInt(formData.recipeId),
      preparerId: parseInt(formData.preparerId),
      quantity: parseInt(formData.quantity),
      scheduledTime: scheduledDateTime.toISOString(),
      status: "scheduled"
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nouvelle Production</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="recipe">Produit</Label>
              <Select value={formData.recipeId} onValueChange={(value) => setFormData({...formData, recipeId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {recipes?.map((recipe: any) => (
                    <SelectItem key={recipe.id} value={recipe.id.toString()}>
                      {recipe.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="quantity">Quantité</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                min="1"
              />
            </div>
            
            <div>
              <Label htmlFor="scheduledTime">Date et heure</Label>
              <Input
                id="scheduledTime"
                type="datetime-local"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
              />
            </div>
            
            <div>
              <Label htmlFor="preparer">Préparateur</Label>
              <Select value={formData.preparerId} onValueChange={(value) => setFormData({...formData, preparerId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un préparateur" />
                </SelectTrigger>
                <SelectContent>
                  {preparers?.map((preparer: any) => (
                    <SelectItem key={preparer.id} value={preparer.id.toString()}>
                      {preparer.firstName} {preparer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={createProductionMutation.isPending}>
              {createProductionMutation.isPending ? "Programmation..." : "Programmer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
