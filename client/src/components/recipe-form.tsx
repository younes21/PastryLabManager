import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, MoveUp, MoveDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Recipe, InsertRecipe, Article, RecipeIngredient, RecipeOperation, WorkStation, MeasurementUnit } from "@shared/schema";

const recipeSchema = z.object({
  articleId: z.number(),
  description: z.string().optional(),
  quantity: z.string().min(1, "La quantité est requise"),
  unit: z.string().min(1, "L'unité est requise"),
  isSubRecipe: z.boolean().default(false),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit?: (data: InsertRecipe) => Promise<Recipe | void>;
  onCancel: () => void;
  articleId?: number; // nouvelle prop optionnelle
}

export function RecipeForm({ recipe, onSubmit, onCancel, articleId }: RecipeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // États pour les ingrédients et opérations
  const [ingredients, setIngredients] = useState<(RecipeIngredient & { article?: Article })[]>([]);
  const [operations, setOperations] = useState<(RecipeOperation & { workStation?: WorkStation })[]>([]);
  const [currentIngredient, setCurrentIngredient] = useState({
    articleId: "",
    quantity: "",
    unit: "",
    notes: "",
  });
  const [currentOperation, setCurrentOperation] = useState({
    description: "",
    duration: "",
    workStationId: "",
    temperature: "",
    notes: "",
  });

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      articleId: articleId ?? recipe?.articleId ?? 0,
      description: recipe?.description || "",
      quantity: recipe?.quantity || "",
      unit: recipe?.unit || "",
      isSubRecipe: recipe?.isSubRecipe || false,
    },
  });

  // Récupérer les données de référence
  const { data: allArticles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: existingRecipes = [] } = useQuery<any[]>({
    queryKey: ["/api/recipes"],
  });

  // Filtrer les produits qui n'ont pas encore de recette (sauf si on est en mode édition)
  const products = (allArticles as Article[]).filter((article: Article) => {
    if (article.type !== "product") return false;

    // Si on est en mode édition, inclure le produit actuel
    if (recipe?.id && article.id === recipe.articleId) return true;

    // Sinon, exclure les produits qui ont déjà une recette
    const hasRecipe = existingRecipes.some((r: any) => r.articleId === article.id);
    return !hasRecipe;
  });

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
  });

  const { data: measurementUnits = [] } = useQuery<MeasurementUnit[]>({
    queryKey: ["/api/measurement-units/active"],
  });

  // Filtrer les unités selon l'article sélectionné
  const selectedArticle = products.find((article: Article) => article.id === form.watch("articleId"));
  const compatibleUnits = selectedArticle
    ? (measurementUnits as MeasurementUnit[]).filter((unit: MeasurementUnit) =>
      unit.abbreviation === selectedArticle.unit ||
      unit.categoryId === (measurementUnits as MeasurementUnit[]).find(u => u.abbreviation === selectedArticle.unit)?.categoryId
    )
    : (measurementUnits as MeasurementUnit[]);

  // Charger les ingrédients et opérations existants si c'est une modification
  useEffect(() => {
    console.log("useEffect triggered", { recipeId: recipe?.id, allArticles: allArticles?.length, workStations: workStations?.length });
    if (recipe?.id) {
      // Charger les ingrédients
      apiRequest(`/api/recipes/${recipe.id}/ingredients`, "GET")
        .then(res => res.json())
        .then(ingredientsData => {
          console.log("Ingredients loaded:", ingredientsData);
          const enrichedIngredients = ingredientsData.map((ing: RecipeIngredient) => ({
            ...ing,
            article: allArticles.find((art: Article) => art.id === ing.articleId)
          }));
          setIngredients(enrichedIngredients);
        })
        .catch(error => {
          console.error("Erreur lors du chargement des ingrédients:", error);
        });

      // Charger les opérations
      apiRequest(`/api/recipes/${recipe.id}/operations`, "GET")
        .then(res => res.json())
        .then(operationsData => {
          console.log("Operations loaded:", operationsData);
          const enrichedOperations = operationsData.map((op: RecipeOperation) => ({
            ...op,
            workStation: workStations.find((ws: WorkStation) => ws.id === op.workStationId)
          }));
          setOperations(enrichedOperations);
        })
        .catch(error => {
          console.error("Erreur lors du chargement des opérations:", error);
        });
    }
  }, [recipe?.id, allArticles, workStations]);

  // Réinitialiser l'unité quand l'article change
  useEffect(() => {
    if (selectedArticle && !recipe) { // Seulement pour les nouvelles recettes
      form.setValue("unit", selectedArticle.unit);
    }
  }, [selectedArticle, recipe]);

  // Réinitialiser l'unité de l'ingrédient quand l'article d'ingrédient change
  useEffect(() => {
    if (currentIngredient.articleId) {
      const selectedIngredientArticle = (allArticles as Article[]).find((art: Article) => art.id === parseInt(currentIngredient.articleId));
      if (selectedIngredientArticle) {
        setCurrentIngredient(prev => ({ ...prev, unit: selectedIngredientArticle.unit }));
      }
    }
  }, [currentIngredient.articleId, allArticles]);

  // Ajouter un ingrédient
  const addIngredient = async () => {
    console.log("addIngredient called", { currentIngredient, allArticles: allArticles?.length });

    // Empêcher d'ajouter deux fois le même ingrédient (frontend only)
    if (ingredients.some(ing => String(ing.articleId) === String(currentIngredient.articleId))) {
      toast({
        title: "Erreur",
        description: "Cet ingrédient est déjà ajouté à la recette.",
        variant: "destructive",
      });
      return;
    }

    // Vérifier que la recette existe
    if (!recipe?.id) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord créer la recette avant d'ajouter des ingrédients",
        variant: "destructive",
      });
      return;
    }

    if (!allArticles || allArticles.length === 0) {
      toast({
        title: "Erreur",
        description: "Les articles ne sont pas encore chargés",
        variant: "destructive",
      });
      return;
    }
    if (!currentIngredient.articleId || !currentIngredient.quantity || !currentIngredient.unit) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires de l'ingrédient",
        variant: "destructive",
      });
      return;
    }

    try {
      const ingredientData = {
        recipeId: recipe.id,
        articleId: parseInt(currentIngredient.articleId),
        quantity: currentIngredient.quantity,
        unit: currentIngredient.unit,
        notes: currentIngredient.notes,
        order: ingredients.length,
      };

      console.log("Creating ingredient via API:", ingredientData);
      const response = await apiRequest(`/api/recipes/${recipe.id}/ingredients`, "POST", ingredientData);
      const newIngredient = await response.json();

      console.log("Ingredient created:", newIngredient);

      // Ajouter l'ingrédient à la liste locale
      const article = (allArticles as Article[]).find((art: Article) => art.id === parseInt(currentIngredient.articleId));
      setIngredients([...ingredients, { ...newIngredient, article }]);
      setCurrentIngredient({ articleId: "", quantity: "", unit: "", notes: "" });

      toast({
        title: "Succès",
        description: "Ingrédient ajouté avec succès",
      });

      // Rafraîchir la liste des recettes
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    } catch (error) {
      console.error("Erreur lors de la création de l'ingrédient:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'ingrédient",
        variant: "destructive",
      });
    }
  };

  // Supprimer un ingrédient
  const removeIngredient = async (index: number) => {
    const ingredient = ingredients[index];

    // Si c'est un ingrédient existant, le supprimer en base
    if (ingredient.id) {
      try {
        await apiRequest(`/api/recipe-ingredients/${ingredient.id}`, "DELETE");
        toast({
          title: "Succès",
          description: "Ingrédient supprimé avec succès",
        });

        // Rafraîchir la liste des recettes
        queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      } catch (error) {
        console.error("Erreur lors de la suppression de l'ingrédient:", error);
      }
    }

    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Déplacer un ingrédient
  const moveIngredient = (index: number, direction: 'up' | 'down') => {
    const newIngredients = [...ingredients];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < ingredients.length) {
      [newIngredients[index], newIngredients[targetIndex]] = [newIngredients[targetIndex], newIngredients[index]];
      setIngredients(newIngredients);
    }
  };

  // Ajouter une opération
  const addOperation = async () => {
    console.log("addOperation called", { currentOperation, workStations: workStations?.length });

    // Vérifier que la recette existe
    if (!recipe?.id) {
      toast({
        title: "Erreur",
        description: "Veuillez d'abord créer la recette avant d'ajouter des opérations",
        variant: "destructive",
      });
      return;
    }

    if (!workStations || workStations.length === 0) {
      toast({
        title: "Erreur",
        description: "Les postes de travail ne sont pas encore chargés",
        variant: "destructive",
      });
      return;
    }
    if (!currentOperation.description) {
      toast({
        title: "Erreur",
        description: "La description de l'opération est requise",
        variant: "destructive",
      });
      return;
    }

    try {
      const operationData = {
        recipeId: recipe.id,
        description: currentOperation.description,
        duration: currentOperation.duration ? parseInt(currentOperation.duration) : null,
        workStationId: currentOperation.workStationId ? parseInt(currentOperation.workStationId) : null,
        temperature: currentOperation.temperature,
        notes: currentOperation.notes,
        order: operations.length,
      };

      console.log("Creating operation via API:", operationData);
      const response = await apiRequest(`/api/recipes/${recipe.id}/operations`, "POST", operationData);
      const newOperation = await response.json();

      console.log("Operation created:", newOperation);

      // Ajouter l'opération à la liste locale
      const workStation = (workStations as WorkStation[]).find((ws: WorkStation) => ws.id === parseInt(currentOperation.workStationId));
      setOperations([...operations, { ...newOperation, workStation }]);
      setCurrentOperation({ description: "", duration: "", workStationId: "", temperature: "", notes: "" });

      toast({
        title: "Succès",
        description: "Opération ajoutée avec succès",
      });

      // Rafraîchir la liste des recettes
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    } catch (error) {
      console.error("Erreur lors de la création de l'opération:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'ajout de l'opération",
        variant: "destructive",
      });
    }
  };

  // Supprimer une opération
  const removeOperation = async (index: number) => {
    const operation = operations[index];

    // Si c'est une opération existante, la supprimer en base
    if (operation.id && operation.id) {
      try {
        await apiRequest(`/api/recipe-operations/${operation.id}`, "DELETE");
        toast({
          title: "Succès",
          description: "opération supprimée avec succès",
        });

        // Rafraîchir la liste des recettes
        queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      } catch (error) {
        console.error("Erreur lors de la suppression de l'opération:", error);
      }
    }

    setOperations(operations.filter((_, i) => i !== index));
  };

  // Déplacer une opération
  const moveOperation = (index: number, direction: 'up' | 'down') => {
    const newOperations = [...operations];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < operations.length) {
      [newOperations[index], newOperations[targetIndex]] = [newOperations[targetIndex], newOperations[index]];
      setOperations(newOperations);
    }
  };

  const handleSubmit = async (data: RecipeFormData) => {
    console.log("handleSubmit called with data:", data);
    console.log("Current ingredients:", ingredients);
    console.log("Current operations:", operations);

    // Vérifier si une recette existe déjà pour cet article (sauf si on est en mode édition)
    if (!recipe?.id) {
      try {
        const existingRecipeResponse = await apiRequest(`/api/articles/${data.articleId}/recipe`, "GET");
        if (existingRecipeResponse.ok) {
          const existingRecipe = await existingRecipeResponse.json();
          if (existingRecipe && existingRecipe.id) {
            toast({
              title: "Erreur",
              description: "Une recette existe déjà pour ce produit. Vous ne pouvez pas créer plusieurs recettes pour le même produit.",
              variant: "destructive",
            });
            return;
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'existence de la recette:", error);
      }
    }

    const recipeData: InsertRecipe = {
      ...data,
      quantity: data.quantity,
    };

    console.log("Recipe data to save:", recipeData);

    // Sauvegarder la recette d'abord
    let savedRecipe;
    try {
      savedRecipe = await onSubmit?.(recipeData);
    } catch (error: any) {
      console.error("Erreur lors de la création de la recette:", error);

      // Gérer l'erreur de contrainte unique
      if (error?.response?.status === 409) {
        toast({
          title: "Erreur",
          description: "Une recette existe déjà pour ce produit. Vous ne pouvez pas créer plusieurs recettes pour le même produit.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Erreur lors de la création de la recette",
          variant: "destructive",
        });
      }
      return;
    }

    // Rafraîchir la liste des recettes après création
    queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });

    // Sauvegarder les ingrédients et opérations si la recette a été créée
    console.log("savedRecipe:", savedRecipe);
    if (savedRecipe && savedRecipe.id) {
      console.log("Saving ingredients and operations for recipe ID:", savedRecipe.id);
      // Sauvegarder les ingrédients
      for (const ingredient of ingredients) {
        console.log("Processing ingredient:", ingredient);
        if (!ingredient.id || ingredient.id < 1000000) { // Nouvel ingrédient (ID temporaire)
          try {
            console.log("Saving new ingredient:", ingredient);
            const response = await apiRequest(`/api/recipes/${savedRecipe.id}/ingredients`, "POST", {
              articleId: ingredient.articleId,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              notes: ingredient.notes,
              order: ingredient.order,
            });
            console.log("Ingredient saved successfully:", await response.json());
          } catch (error) {
            console.error("Erreur lors de la sauvegarde de l'ingrédient:", error);
          }
        } else if (ingredient.id > 1000000) { // Ingrédient existant à modifier
          try {
            console.log("Updating existing ingredient:", ingredient);
            const response = await apiRequest(`/api/recipe-ingredients/${ingredient.id}`, "PUT", {
              articleId: ingredient.articleId,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              notes: ingredient.notes,
              order: ingredient.order,
            });
            console.log("Ingredient updated successfully:", await response.json());
          } catch (error) {
            console.error("Erreur lors de la modification de l'ingrédient:", error);
          }
        }
      }

      // Sauvegarder les opérations
      for (const operation of operations) {
        if (!operation.id || operation.id < 1000000) { // Nouvelle opération (ID temporaire)
          try {
            await apiRequest(`/api/recipes/${savedRecipe.id}/operations`, "POST", {
              description: operation.description,
              duration: operation.duration,
              workStationId: operation.workStationId,
              temperature: operation.temperature,
              notes: operation.notes,
              order: operation.order,
            });
          } catch (error) {
            console.error("Erreur lors de la sauvegarde de l'opération:", error);
          }
        } else if (operation.id > 1000000) { // Opération existante à modifier
          try {
            await apiRequest(`/api/recipe-operations/${operation.id}`, "PUT", {
              description: operation.description,
              duration: operation.duration,
              workStationId: operation.workStationId,
              temperature: operation.temperature,
              notes: operation.notes,
              order: operation.order,
            });
          } catch (error) {
            console.error("Erreur lors de la modification de l'opération:", error);
          }
        }
      }
    }
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {recipe ? "Modifier la recette" : "Nouvelle recette"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Section Générale compacte */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Informations générales</h3>
            <div className="grid grid-cols-5 gap-3">
              {/* Si pas de articleId, afficher le select produit */}
              {!articleId && (
                <div className="col-span-2">
                  <Label htmlFor="articleId" className="text-xs">Produit *</Label>
                  <Select
                    value={form.watch("articleId")?.toString()}
                    onValueChange={(value) => form.setValue("articleId", parseInt(value))}
                    data-testid="select-articleId"
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {products?.map((product: Article) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {/* Si articleId fourni, afficher le nom du produit en lecture seule */}
              {articleId && (
                <div className="col-span-2 flex items-center">
                  <Label className="text-xs mr-2">Produit :</Label>
                  <span className="font-medium text-sm">
                    {allArticles.find((a: Article) => a.id === articleId)?.name || "Produit inconnu"}
                  </span>
                </div>
              )}

              <div>
                <Label htmlFor="quantity" className="text-xs">Quantité *</Label>
                <Input
                  {...form.register("quantity")}
                  data-testid="input-quantity"
                  className="h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="unit" className="text-xs">Unité *</Label>
                <Select
                  value={form.watch("unit")}
                  onValueChange={(value) => form.setValue("unit", value)}
                  data-testid="select-unit"
                  disabled={!selectedArticle}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={selectedArticle ? "Unité" : "Sélectionnez d'abord un produit"} />
                  </SelectTrigger>
                  <SelectContent>
                    {compatibleUnits.map((unit: MeasurementUnit) => (
                      <SelectItem key={unit.id} value={unit.abbreviation}>
                        {unit.label} ({unit.abbreviation})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedArticle && (
                  <p className="text-xs text-gray-500 mt-1">
                    Unité de l'article: {selectedArticle.unit}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 ">
                <Checkbox
                  checked={form.watch("isSubRecipe")}
                  onCheckedChange={(checked) => form.setValue("isSubRecipe", Boolean(checked))}
                  data-testid="checkbox-isSubRecipe"
                />
                <Label className="text-xs">Sous-recette</Label>
              </div>

              <div className="col-span-4">
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Textarea
                  {...form.register("description")}
                  rows={2}
                  data-testid="textarea-description"
                  className="text-sm"
                  placeholder="Description de la recette..."
                />
              </div>
            </div>
          </div>
          {/* Boutons d'action */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
              Annuler
            </Button>
            <Button type="submit" data-testid="button-submit">
              {recipe ? "Modifier" : "Créer"} la recette
            </Button>
          </div>

          {/* Onglets Ingrédients et Opérations - seulement si la recette existe */}
          {recipe?.id ? (
            <>
              <Tabs defaultValue="ingredients" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
                  <TabsTrigger value="operations">Opérations</TabsTrigger>
                </TabsList>

                <TabsContent value="ingredients" className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium mb-3">Ajouter un ingrédient</h3>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="col-span-2">
                        <Select
                          value={currentIngredient.articleId}
                          onValueChange={(value) => setCurrentIngredient(prev => ({ ...prev, articleId: value }))}
                          data-testid="select-ingredient-article"
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Article" />
                          </SelectTrigger>
                          <SelectContent>
                            {(allArticles as Article[])
                              .filter((art: Article) => {
                                if (art.type === 'ingredient') return true;
                                if (art.type === 'product') {
                                  // On cherche une recette pour ce produit qui est une sous-recette
                                  return existingRecipes.some((rec: any) => rec.articleId === art.id && rec.isSubRecipe);
                                }
                                return false;
                              })
                              .map((article: Article) => (
                                <SelectItem key={article.id} value={article.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={article.type === 'ingredient' ? 'default' : 'secondary'}>
                                      {article.type === 'ingredient' ? 'ING' : 'PROD'}
                                    </Badge>
                                    {article.name}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder="Quantité"
                        value={currentIngredient.quantity}
                        onChange={(e) => setCurrentIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                        data-testid="input-ingredient-quantity"
                      />
                      <div className="flex gap-2">
                        <div>
                          <Select
                            value={currentIngredient.unit}
                            onValueChange={(value) => setCurrentIngredient(prev => ({ ...prev, unit: value }))}
                            data-testid="select-ingredient-unit"
                            disabled={!currentIngredient.articleId}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={currentIngredient.articleId ? "Unité" : "Sélectionnez d'abord un ingrédient"} />
                            </SelectTrigger>
                            <SelectContent>
                              {(() => {
                                const selectedIngredientArticle = (allArticles as Article[]).find((art: Article) => art.id === parseInt(currentIngredient.articleId));
                                const compatibleIngredientUnits = selectedIngredientArticle
                                  ? (measurementUnits as MeasurementUnit[]).filter((unit: MeasurementUnit) =>
                                    unit.abbreviation === selectedIngredientArticle.unit ||
                                    unit.categoryId === (measurementUnits as MeasurementUnit[]).find(u => u.abbreviation === selectedIngredientArticle.unit)?.categoryId
                                  )
                                  : (measurementUnits as MeasurementUnit[]);

                                return compatibleIngredientUnits.map((unit: MeasurementUnit) => (
                                  <SelectItem key={unit.id} value={unit.abbreviation}>
                                    {unit.label} ({unit.abbreviation})
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                          {currentIngredient.articleId && (() => {
                            const selectedIngredientArticle = (allArticles as Article[]).find((art: Article) => art.id === parseInt(currentIngredient.articleId));
                            return selectedIngredientArticle && (
                              <p className="text-xs text-gray-500 mt-1">
                                Unité de l'article: {selectedIngredientArticle.unit}
                              </p>
                            );
                          })()}</div>
                        <Button
                          type="button"
                          className="rounded-full w-10 h-10"
                          onClick={(e) => {
                            console.log("Button clicked");
                            try {
                              addIngredient();
                            } catch (error) {
                              console.error("Error in addIngredient:", error);
                            }
                          }}
                          data-testid="button-add-ingredient"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>


                    </div>

                    <Input
                      placeholder="Notes (optionnel)"
                      value={currentIngredient.notes}
                      onChange={(e) => setCurrentIngredient(prev => ({ ...prev, notes: e.target.value }))}
                      data-testid="input-ingredient-notes"
                    />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Ingrédients de la recette ({ingredients.length})</h3>
                    {ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={ingredient.article?.type === 'ingredient' ? 'default' : 'secondary'}>
                              {ingredient.article?.type === 'ingredient' ? 'ING' : 'PROD'}
                            </Badge>
                            <span className="font-medium">{ingredient.article?.name}</span>
                            <span className="text-gray-600">
                              {ingredient.quantity} {ingredient.unit}
                            </span>
                          </div>
                          {ingredient.notes && (
                            <p className="text-sm text-gray-500 mt-1">{ingredient.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveIngredient(index, 'up')}
                            disabled={index === 0}
                            data-testid={`button-move-ingredient-up-${index}`}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveIngredient(index, 'down')}
                            disabled={index === ingredients.length - 1}
                            data-testid={`button-move-ingredient-down-${index}`}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIngredient(index).catch(console.error)}
                            data-testid={`button-remove-ingredient-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="operations" className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium mb-3">Ajouter une opération</h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Input className="col-span-2"
                        placeholder="Description *"
                        value={currentOperation.description}
                        onChange={(e) => setCurrentOperation(prev => ({ ...prev, description: e.target.value }))}
                        data-testid="input-operation-description"
                      />

                      <Input
                        placeholder="Durée (min)"
                        type="number"
                        value={currentOperation.duration}
                        onChange={(e) => setCurrentOperation(prev => ({ ...prev, duration: e.target.value }))}
                        data-testid="input-operation-duration"
                      />
                      <div className="flex gap-2">
                        <Select
                          value={currentOperation.workStationId}
                          onValueChange={(value) => setCurrentOperation(prev => ({ ...prev, workStationId: value }))}
                          data-testid="select-operation-workstation"
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Poste de travail" />
                          </SelectTrigger>
                          <SelectContent>
                            {workStations?.map((station: WorkStation) => (
                              <SelectItem key={station.id} value={station.id.toString()}>
                                {station.designation}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          className="rounded-full w-10 h-10"
                          onClick={(e) => {
                            console.log("Operation button clicked");
                            try {
                              addOperation();
                            } catch (error) {
                              console.error("Error in addOperation:", error);
                            }
                          }}
                          data-testid="button-add-operation"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {/* <Input 
                      placeholder="Température" 
                      value={currentOperation.temperature}
                      onChange={(e) => setCurrentOperation(prev => ({ ...prev, temperature: e.target.value }))}
                      data-testid="input-operation-temperature"
                    /> */}
                      {/*  <div >
                    <Input 
                      placeholder="Notes (optionnel)" 
                      value={currentOperation.notes}
                      onChange={(e) => setCurrentOperation(prev => ({ ...prev, notes: e.target.value }))}
                      className="flex-1"
                      data-testid="input-operation-notes"
                    /> */}


                    </div>


                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Opérations de la recette ({operations.length})</h3>
                    {operations.map((operation, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <div className="font-medium">{operation.description}</div>
                          <div className="text-sm text-gray-600 flex gap-4 mt-1">
                            {operation.duration && <span>⏱️ {operation.duration} min</span>}
                            {operation.workStation && <span>🏭 {operation.workStation.designation}</span>}
                            {operation.temperature && <span>🌡️ {operation.temperature}</span>}
                          </div>
                          {operation.notes && (
                            <p className="text-sm text-gray-500 mt-1">{operation.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveOperation(index, 'up')}
                            disabled={index === 0}
                            data-testid={`button-move-operation-up-${index}`}
                          >
                            <MoveUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => moveOperation(index, 'down')}
                            disabled={index === operations.length - 1}
                            data-testid={`button-move-operation-down-${index}`}
                          >
                            <MoveDown className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOperation(index).catch(console.error)}
                            data-testid={`button-remove-operation-${index}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 Créez d'abord la recette pour pouvoir ajouter des ingrédients et des opérations
              </p>
            </div>
          )}

        </form>
      </DialogContent>
    </Dialog >
  );
}