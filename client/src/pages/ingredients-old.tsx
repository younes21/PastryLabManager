import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { IngredientImage } from "@/components/ingredient-image";

export default function Ingredients() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    unit: "",
    currentStock: "",
    minStock: "",
    maxStock: "",
    costPerUnit: "",
    storageLocationId: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ingredients, isLoading: ingredientsLoading } = useQuery({
    queryKey: ["/api/ingredients"],
  });

  const { data: storageLocations } = useQuery({
    queryKey: ["/api/storage-locations"],
  });

  const createIngredientMutation = useMutation({
    mutationFn: async (ingredientData: any) => {
      const response = await apiRequest("POST", "/api/ingredients", ingredientData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({
        title: "Ingrédient créé",
        description: "L'ingrédient a été ajouté avec succès.",
      });
      closeModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer l'ingrédient.",
        variant: "destructive",
      });
    },
  });

  const updateIngredientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/ingredients/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({
        title: "Ingrédient modifié",
        description: "L'ingrédient a été modifié avec succès.",
      });
      closeModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'ingrédient.",
        variant: "destructive",
      });
    },
  });

  const deleteIngredientMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/ingredients/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({
        title: "Ingrédient supprimé",
        description: "L'ingrédient a été supprimé avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'ingrédient.",
        variant: "destructive",
      });
    },
  });

  const openModal = (ingredient?: any) => {
    if (ingredient) {
      setEditingIngredient(ingredient);
      setFormData({
        name: ingredient.name,
        unit: ingredient.unit,
        currentStock: ingredient.currentStock,
        minStock: ingredient.minStock,
        maxStock: ingredient.maxStock,
        costPerUnit: ingredient.costPerUnit,
        storageLocationId: ingredient.storageLocationId?.toString() || ""
      });
    } else {
      setEditingIngredient(null);
      setFormData({
        name: "",
        unit: "g",
        currentStock: "",
        minStock: "",
        maxStock: "",
        costPerUnit: "",
        storageLocationId: ""
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIngredient(null);
    setFormData({
      name: "",
      unit: "g",
      currentStock: "",
      minStock: "",
      maxStock: "",
      costPerUnit: "",
      storageLocationId: ""
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.unit) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    const ingredientData = {
      ...formData,
      storageLocationId: formData.storageLocationId ? parseInt(formData.storageLocationId) : null
    };

    if (editingIngredient) {
      updateIngredientMutation.mutate({ id: editingIngredient.id, data: ingredientData });
    } else {
      createIngredientMutation.mutate(ingredientData);
    }
  };

  const getStockStatus = (current: string, min: string) => {
    const currentStock = parseFloat(current || "0");
    const minStock = parseFloat(min || "0");
    
    if (currentStock <= minStock) return "low";
    if (currentStock <= minStock * 1.5) return "medium";
    return "high";
  };

  if (ingredientsLoading) {
    return (
      <Layout title="Ingrédients">
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Ingrédients">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Ingrédients</h1>
          <Button onClick={() => openModal()}>
            <i className="fas fa-plus mr-2"></i>
            Nouvel Ingrédient
          </Button>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Emplacement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coût/Unité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ingredients?.map((ingredient: any) => {
                    const stockStatus = getStockStatus(ingredient.currentStock, ingredient.minStock);
                    const storageLocation = storageLocations?.find((loc: any) => loc.id === ingredient.storageLocationId);

                    return (
                      <tr key={ingredient.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <IngredientImage ingredientName={ingredient.name} className="w-8 h-8 mr-3" />
                            {ingredient.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ingredient.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            {ingredient.currentStock} {ingredient.unit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {ingredient.minStock} | Max: {ingredient.maxStock}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge 
                            variant={
                              stockStatus === "low" ? "destructive" :
                              stockStatus === "medium" ? "secondary" : "default"
                            }
                          >
                            {stockStatus === "low" ? "Stock faible" :
                             stockStatus === "medium" ? "Stock moyen" : "Stock OK"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {storageLocation?.name || "Non défini"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ingredient.costPerUnit}DA
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openModal(ingredient)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteIngredientMutation.mutate(ingredient.id)}
                            disabled={deleteIngredientMutation.isPending}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingIngredient ? "Modifier l'ingrédient" : "Nouvel ingrédient"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="unit">Unité *</Label>
                  <Select value={formData.unit || undefined} onValueChange={(value) => setFormData({...formData, unit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une unité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="g">Grammes (g)</SelectItem>
                      <SelectItem value="kg">Kilogrammes (kg)</SelectItem>
                      <SelectItem value="ml">Millilitres (ml)</SelectItem>
                      <SelectItem value="l">Litres (l)</SelectItem>
                      <SelectItem value="piece">Pièces</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="currentStock">Stock actuel</Label>
                  <Input
                    id="currentStock"
                    type="number"
                    step="0.01"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({...formData, currentStock: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="minStock">Stock minimum</Label>
                  <Input
                    id="minStock"
                    type="number"
                    step="0.01"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxStock">Stock maximum</Label>
                  <Input
                    id="maxStock"
                    type="number"
                    step="0.01"
                    value={formData.maxStock}
                    onChange={(e) => setFormData({...formData, maxStock: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="costPerUnit">Coût par unité (DA)</Label>
                  <Input
                    id="costPerUnit"
                    type="number"
                    step="0.01"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({...formData, costPerUnit: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="storageLocation">Emplacement de stockage</Label>
                <Select 
                  value={formData.storageLocationId || undefined} 
                  onValueChange={(value) => setFormData({...formData, storageLocationId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un emplacement" />
                  </SelectTrigger>
                  <SelectContent>
                    {storageLocations?.map((location: any) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name} ({location.temperature}°C)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createIngredientMutation.isPending || updateIngredientMutation.isPending}
                >
                  {editingIngredient ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
