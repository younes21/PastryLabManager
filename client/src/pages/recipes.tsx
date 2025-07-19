import { useState } from "react";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { RecipeImage } from "@/components/recipe-image";

export default function Recipes() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    preparationTime: "",
    difficulty: "easy",
    servings: "",
    price: ""
  });
  const [ingredientFormData, setIngredientFormData] = useState({
    ingredientId: "",
    quantity: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ["/api/recipes"],
  });

  const { data: ingredients } = useQuery({
    queryKey: ["/api/ingredients"],
  });

  const { data: recipeIngredients } = useQuery({
    queryKey: ["/api/recipes", selectedRecipe?.id, "ingredients"],
    enabled: !!selectedRecipe?.id,
  });

  const createRecipeMutation = useMutation({
    mutationFn: async (recipeData: any) => {
      const response = await apiRequest("POST", "/api/recipes", recipeData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recette créée",
        description: "La recette a été créée avec succès.",
      });
      closeModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la recette.",
        variant: "destructive",
      });
    },
  });

  const updateRecipeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest("PUT", `/api/recipes/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recette modifiée",
        description: "La recette a été modifiée avec succès.",
      });
      closeModal();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la recette.",
        variant: "destructive",
      });
    },
  });

  const deleteRecipeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/recipes/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({
        title: "Recette supprimée",
        description: "La recette a été supprimée avec succès.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la recette.",
        variant: "destructive",
      });
    },
  });

  const addIngredientMutation = useMutation({
    mutationFn: async (ingredientData: any) => {
      const response = await apiRequest("POST", `/api/recipes/${selectedRecipe.id}/ingredients`, ingredientData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", selectedRecipe?.id, "ingredients"] });
      toast({
        title: "Ingrédient ajouté",
        description: "L'ingrédient a été ajouté à la recette.",
      });
      setIsIngredientModalOpen(false);
      setIngredientFormData({ ingredientId: "", quantity: "" });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'ingrédient.",
        variant: "destructive",
      });
    },
  });

  const openModal = (recipe?: any) => {
    if (recipe) {
      setEditingRecipe(recipe);
      setFormData({
        name: recipe.name,
        description: recipe.description || "",
        preparationTime: recipe.preparationTime?.toString() || "",
        difficulty: recipe.difficulty || "easy",
        servings: recipe.servings?.toString() || "",
        price: recipe.price || ""
      });
    } else {
      setEditingRecipe(null);
      setFormData({
        name: "",
        description: "",
        preparationTime: "",
        difficulty: "easy",
        servings: "",
        price: ""
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Erreur",
        description: "Le nom de la recette est obligatoire.",
        variant: "destructive",
      });
      return;
    }

    const recipeData = {
      ...formData,
      preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null,
      servings: formData.servings ? parseInt(formData.servings) : 1,
    };

    if (editingRecipe) {
      updateRecipeMutation.mutate({ id: editingRecipe.id, data: recipeData });
    } else {
      createRecipeMutation.mutate(recipeData);
    }
  };

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ingredientFormData.ingredientId || !ingredientFormData.quantity) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un ingrédient et indiquer la quantité.",
        variant: "destructive",
      });
      return;
    }

    addIngredientMutation.mutate({
      ingredientId: parseInt(ingredientFormData.ingredientId),
      quantity: ingredientFormData.quantity
    });
  };

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyConfig = {
      easy: { label: "Facile", variant: "secondary" as const },
      medium: { label: "Moyen", variant: "default" as const },
      hard: { label: "Difficile", variant: "destructive" as const },
    };

    const config = difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig.easy;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (recipesLoading) {
    return (
      <Layout title="Recettes">
        <div className="px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center">Chargement...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Recettes">
      <div className="px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Recettes</h1>
          <Button onClick={() => openModal()}>
            <i className="fas fa-plus mr-2"></i>
            Nouvelle Recette
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recipes List */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recipes?.map((recipe: any) => (
                    <div
                      key={recipe.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedRecipe?.id === recipe.id ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <div className="flex items-start mb-2 space-x-3">
                        <RecipeImage recipeName={recipe.name} className="w-16 h-16 flex-shrink-0" />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-gray-900">{recipe.name}</h3>
                            <div className="flex space-x-1">
                              <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(recipe);
                            }}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRecipeMutation.mutate(recipe.id);
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {recipe.description || "Pas de description"}
                      </p>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{recipe.preparationTime || 0} min</span>
                        {getDifficultyBadge(recipe.difficulty)}
                      </div>
                      
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-sm text-gray-500">{recipe.servings || 1} portions</span>
                        <span className="font-medium text-gray-900">{recipe.price || 0}€</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recipe Details */}
          <div className="lg:col-span-1">
            {selectedRecipe ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {selectedRecipe.name}
                    <Button 
                      size="sm"
                      onClick={() => setIsIngredientModalOpen(true)}
                    >
                      <i className="fas fa-plus mr-1"></i>
                      Ingrédient
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Ingrédients</h4>
                      {recipeIngredients && recipeIngredients.length > 0 ? (
                        <ul className="space-y-2">
                          {recipeIngredients.map((ri: any) => (
                            <li key={ri.id} className="flex justify-between items-center text-sm">
                              <span>{ri.ingredient?.name}</span>
                              <span className="font-medium">
                                {ri.quantity} {ri.ingredient?.unit}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">Aucun ingrédient ajouté</p>
                      )}
                    </div>
                    
                    {selectedRecipe.description && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{selectedRecipe.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Temps de préparation</span>
                        <p className="font-medium">{selectedRecipe.preparationTime || 0} minutes</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Difficulté</span>
                        <div className="mt-1">{getDifficultyBadge(selectedRecipe.difficulty)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Portions</span>
                        <p className="font-medium">{selectedRecipe.servings || 1}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Prix</span>
                        <p className="font-medium">{selectedRecipe.price || 0}€</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-gray-500">
                  Sélectionnez une recette pour voir les détails
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recipe Modal */}
        <Dialog open={isModalOpen} onOpenChange={closeModal}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingRecipe ? "Modifier la recette" : "Nouvelle recette"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preparationTime">Temps de préparation (min)</Label>
                  <Input
                    id="preparationTime"
                    type="number"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({...formData, preparationTime: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="difficulty">Difficulté</Label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facile</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="hard">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="servings">Portions</Label>
                  <Input
                    id="servings"
                    type="number"
                    value={formData.servings}
                    onChange={(e) => setFormData({...formData, servings: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Prix (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createRecipeMutation.isPending || updateRecipeMutation.isPending}
                >
                  {editingRecipe ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Ingredient Modal */}
        <Dialog open={isIngredientModalOpen} onOpenChange={setIsIngredientModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Ajouter un ingrédient</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddIngredient} className="space-y-4">
              <div>
                <Label htmlFor="ingredient">Ingrédient</Label>
                <Select 
                  value={ingredientFormData.ingredientId} 
                  onValueChange={(value) => setIngredientFormData({...ingredientFormData, ingredientId: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un ingrédient" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredients?.map((ingredient: any) => (
                      <SelectItem key={ingredient.id} value={ingredient.id.toString()}>
                        {ingredient.name} ({ingredient.unit})
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
                  step="0.01"
                  value={ingredientFormData.quantity}
                  onChange={(e) => setIngredientFormData({...ingredientFormData, quantity: e.target.value})}
                  required
                />
              </div>
              
              <div className="flex items-center justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsIngredientModalOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={addIngredientMutation.isPending}>
                  Ajouter
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
