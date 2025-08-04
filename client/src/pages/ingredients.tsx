import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Package, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

// Schema pour les ingrédients (basé sur les articles)
const ingredientSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  unit: z.string().min(1, "L'unité est requise"),
  currentStock: z.number().min(0, "Le stock doit être positif").default(0),
  minStock: z.number().min(0, "Le stock minimum doit être positif").default(0),
  maxStock: z.number().min(0, "Le stock maximum doit être positif").optional(),
  price: z.number().min(0, "Le prix doit être positif").default(0),
  costPerUnit: z.number().min(0, "Le coût doit être positif").default(0),
  storageLocationId: z.number().optional(),
  active: z.boolean().default(true),
});

type IngredientFormData = z.infer<typeof ingredientSchema>;

export default function IngredientsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Article | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupération des données
  const { data: ingredients, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/ingredients"],
  });

  const { data: categories } = useQuery({
    queryKey: ["/api/article-categories"],
  });

  const { data: storageLocations } = useQuery({
    queryKey: ["/api/storage-locations"],
  });

  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "kg",
      currentStock: 0,
      minStock: 0,
      maxStock: 0,
      price: 0,
      costPerUnit: 0,
      active: true,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: IngredientFormData) => apiRequest("/api/ingredients", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setIsDialogOpen(false);
      form.reset();
      toast({ title: "Ingrédient créé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: IngredientFormData }) =>
      apiRequest(`/api/ingredients/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setIsDialogOpen(false);
      setEditingIngredient(null);
      form.reset();
      toast({ title: "Ingrédient modifié avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/ingredients/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingrédient supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const handleSubmit = (data: IngredientFormData) => {
    if (editingIngredient) {
      updateMutation.mutate({ id: editingIngredient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (ingredient: Article) => {
    setEditingIngredient(ingredient);
    form.reset({
      name: ingredient.name,
      description: ingredient.description || "",
      categoryId: ingredient.categoryId || undefined,
      unit: "kg", // Default unit for articles
      currentStock: Number(ingredient.currentStock) || 0,
      minStock: Number(ingredient.minStock) || 0,
      maxStock: Number(ingredient.maxStock) || 0,
      price: Number(ingredient.costPerUnit) || 0,
      costPerUnit: Number(ingredient.costPerUnit) || 0,
      storageLocationId: ingredient.storageLocationId || undefined,
      active: Boolean(ingredient.active),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
      deleteMutation.mutate(id);
    }
  };

  const openCreateDialog = () => {
    setEditingIngredient(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const getStockStatus = (ingredient: Article) => {
    const current = Number(ingredient.currentStock) || 0;
    const min = Number(ingredient.minStock) || 0;
    
    if (current === 0) return { label: "Rupture", variant: "destructive" as const };
    if (current <= min) return { label: "Stock faible", variant: "secondary" as const };
    return { label: "En stock", variant: "default" as const };
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Ingrédients</h1>
          <p className="text-muted-foreground">
            Gérez vos ingrédients et surveillez les stocks
          </p>
        </div>
        <Button onClick={openCreateDialog} data-testid="button-add-ingredient">
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Ingrédient
        </Button>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingrédients</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ingredients?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Faible</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {ingredients?.filter(ing => Number(ing.currentStock) <= Number(ing.minStock)).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {ingredients?.filter(ing => ing.active).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des ingrédients */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Ingrédients</CardTitle>
          <CardDescription>
            Consultez et gérez tous vos ingrédients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Unité</TableHead>
                <TableHead>Stock Actuel</TableHead>
                <TableHead>Stock Min</TableHead>
                <TableHead>Prix Achat</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients?.map((ingredient) => {
                const stockStatus = getStockStatus(ingredient);
                return (
                  <TableRow key={ingredient.id} data-testid={`row-ingredient-${ingredient.id}`}>
                    <TableCell className="font-mono text-sm">{ingredient.code}</TableCell>
                    <TableCell className="font-medium">{ingredient.name}</TableCell>
                    <TableCell>kg</TableCell>
                    <TableCell>{Number(ingredient.currentStock) || 0}</TableCell>
                    <TableCell>{Number(ingredient.minStock) || 0}</TableCell>
                    <TableCell>{Number(ingredient.costPerUnit) || 0} DA</TableCell>
                    <TableCell>
                      <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(ingredient)}
                          data-testid={`button-edit-ingredient-${ingredient.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ingredient.id)}
                          data-testid={`button-delete-ingredient-${ingredient.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog pour créer/modifier */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingIngredient ? "Modifier l'Ingrédient" : "Nouvel Ingrédient"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-ingredient-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unité *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-ingredient-unit">
                            <SelectValue placeholder="Sélectionner une unité" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">Kilogramme (kg)</SelectItem>
                          <SelectItem value="g">Gramme (g)</SelectItem>
                          <SelectItem value="l">Litre (l)</SelectItem>
                          <SelectItem value="ml">Millilitre (ml)</SelectItem>
                          <SelectItem value="piece">Pièce</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="textarea-ingredient-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Actuel</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-ingredient-current-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Minimum</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-ingredient-min-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Maximum</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-ingredient-max-stock"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix d'Achat (DA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-ingredient-cost"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix de Vente (DA)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-ingredient-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-ingredient-category">
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Aucune catégorie</SelectItem>
                          {(categories as any[])?.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.designation}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="storageLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone de Stockage</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-ingredient-storage">
                            <SelectValue placeholder="Sélectionner une zone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Aucune zone</SelectItem>
                          {(storageLocations as any[])?.map((location: any) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Actif</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Cet ingrédient est-il disponible pour utilisation ?
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        data-testid="switch-ingredient-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel-ingredient"
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-ingredient"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Enregistrement..."
                    : editingIngredient
                    ? "Modifier"
                    : "Créer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}