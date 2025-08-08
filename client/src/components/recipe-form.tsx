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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, MoveUp, MoveDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Recipe, InsertRecipe, Article, RecipeIngredient, RecipeOperation, WorkStation, MeasurementUnit } from "@shared/schema";

const recipeSchema = z.object({
  articleId: z.number(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  quantity: z.string().min(1, "La quantité est requise"),
  unit: z.string().min(1, "L'unité est requise"),
  isSubRecipe: z.boolean().default(false),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

interface RecipeFormProps {
  recipe?: Recipe;
  onSubmit: (data: InsertRecipe) => Promise<Recipe | void>;
  onCancel: () => void;
}

export function RecipeForm({ recipe, onSubmit, onCancel }: RecipeFormProps) {
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
      articleId: recipe?.articleId || 0,
      designation: recipe?.designation || "",
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
  
  const products = (allArticles as Article[]).filter((article: Article) => article.type === "product");

  const { data: workStations = [] } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
  });

  const { data: measurementUnits = [] } = useQuery<MeasurementUnit[]>({
    queryKey: ["/api/measurement-units/active"],
  });

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

  // Ajouter un ingrédient
  const addIngredient = () => {
    console.log("addIngredient called", { currentIngredient, allArticles: allArticles?.length });
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

    const article = (allArticles as Article[]).find((art: Article) => art.id === parseInt(currentIngredient.articleId));
    const newIngredient = {
      id: Date.now(), // ID temporaire pour les nouveaux éléments
      recipeId: recipe?.id || 0,
      articleId: parseInt(currentIngredient.articleId),
      quantity: currentIngredient.quantity,
      unit: currentIngredient.unit,
      notes: currentIngredient.notes,
      order: ingredients.length,
      createdAt: new Date().toISOString(),
      article,
    };

    console.log("Adding ingredient to state:", newIngredient);
    setIngredients([...ingredients, newIngredient]);
    setCurrentIngredient({ articleId: "", quantity: "", unit: "", notes: "" });
    console.log("New ingredients state:", [...ingredients, newIngredient]);
  };

  // Supprimer un ingrédient
  const removeIngredient = async (index: number) => {
    const ingredient = ingredients[index];
    
    // Si c'est un ingrédient existant, le supprimer en base
    if (ingredient.id && ingredient.id > 1000000) {
      try {
        await apiRequest(`/api/recipe-ingredients/${ingredient.id}`, "DELETE");
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
  const addOperation = () => {
    console.log("addOperation called", { currentOperation, workStations: workStations?.length });
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

    const workStation = (workStations as WorkStation[]).find((ws: WorkStation) => ws.id === parseInt(currentOperation.workStationId));
    const newOperation = {
      id: Date.now(), // ID temporaire
      recipeId: recipe?.id || 0,
      description: currentOperation.description,
      duration: currentOperation.duration ? parseInt(currentOperation.duration) : null,
      workStationId: currentOperation.workStationId ? parseInt(currentOperation.workStationId) : null,
      temperature: currentOperation.temperature,
      notes: currentOperation.notes,
      order: operations.length,
      createdAt: new Date().toISOString(),
      workStation,
    };

    setOperations([...operations, newOperation]);
    setCurrentOperation({ description: "", duration: "", workStationId: "", temperature: "", notes: "" });
  };

  // Supprimer une opération
  const removeOperation = async (index: number) => {
    const operation = operations[index];
    
    // Si c'est une opération existante, la supprimer en base
    if (operation.id && operation.id > 1000000) {
      try {
        await apiRequest(`/api/recipe-operations/${operation.id}`, "DELETE");
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
    
    const recipeData: InsertRecipe = {
      ...data,
      quantity: data.quantity,
    };
    
    console.log("Recipe data to save:", recipeData);
    
    // Sauvegarder la recette d'abord
    const savedRecipe = await onSubmit(recipeData);
    
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
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {recipe ? "Modifier la recette" : "Nouvelle recette"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="ingredients">Ingrédients</TabsTrigger>
                <TabsTrigger value="operations">Opérations</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="articleId">Produit *</Label>
                    <Select 
                      value={form.watch("articleId")?.toString()} 
                      onValueChange={(value) => form.setValue("articleId", parseInt(value))}
                      data-testid="select-articleId"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un produit" />
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

                  <div>
                    <Label htmlFor="designation">Désignation *</Label>
                    <Input 
                      {...form.register("designation")} 
                      data-testid="input-designation"
                    />
                    {form.formState.errors.designation && (
                      <p className="text-red-500 text-sm mt-1">
                        {form.formState.errors.designation.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantité/Portions *</Label>
                    <Input 
                      {...form.register("quantity")} 
                      data-testid="input-quantity"
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit">Unité *</Label>
                    <Select 
                      value={form.watch("unit")} 
                      onValueChange={(value) => form.setValue("unit", value)}
                      data-testid="select-unit"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {(measurementUnits as MeasurementUnit[]).map((unit: MeasurementUnit) => (
                          <SelectItem key={unit.id} value={unit.abbreviation}>
                            {unit.label} ({unit.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    {...form.register("description")} 
                    rows={3}
                    data-testid="textarea-description"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    checked={form.watch("isSubRecipe")}
                    onCheckedChange={(checked) => form.setValue("isSubRecipe", Boolean(checked))}
                    data-testid="checkbox-isSubRecipe"
                  />
                  <Label>Est une sous-recette</Label>
                </div>
              </TabsContent>

              <TabsContent value="ingredients" className="space-y-4">
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h3 className="font-medium mb-3">Ajouter un ingrédient</h3>
                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <Select 
                      value={currentIngredient.articleId} 
                      onValueChange={(value) => setCurrentIngredient(prev => ({ ...prev, articleId: value }))}
                      data-testid="select-ingredient-article"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Article" />
                      </SelectTrigger>
                      <SelectContent>
                        {(allArticles as Article[]).filter((art: Article) => art.type === 'ingredient' || art.type === 'product')
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

                    <Input 
                      placeholder="Quantité" 
                      value={currentIngredient.quantity}
                      onChange={(e) => setCurrentIngredient(prev => ({ ...prev, quantity: e.target.value }))}
                      data-testid="input-ingredient-quantity"
                    />

                    <Select 
                      value={currentIngredient.unit} 
                      onValueChange={(value) => setCurrentIngredient(prev => ({ ...prev, unit: value }))}
                      data-testid="select-ingredient-unit"
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Unité" />
                      </SelectTrigger>
                      <SelectContent>
                        {(measurementUnits as MeasurementUnit[]).map((unit: MeasurementUnit) => (
                          <SelectItem key={unit.id} value={unit.abbreviation}>
                            {unit.abbreviation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button 
                      type="button" 
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
                    <Input 
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

                    <Input 
                      placeholder="Température" 
                      value={currentOperation.temperature}
                      onChange={(e) => setCurrentOperation(prev => ({ ...prev, temperature: e.target.value }))}
                      data-testid="input-operation-temperature"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Input 
                      placeholder="Notes (optionnel)" 
                      value={currentOperation.notes}
                      onChange={(e) => setCurrentOperation(prev => ({ ...prev, notes: e.target.value }))}
                      className="flex-1"
                      data-testid="input-operation-notes"
                    />
                    <Button 
                      type="button" 
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel">
                Annuler
              </Button>
              <Button type="submit" data-testid="button-submit">
                {recipe ? "Modifier" : "Créer"} la recette
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}