import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Eye, Edit, Trash2, Plus, Package, Thermometer, Calendar, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertArticleSchema, insertRecipeSchema, insertRecipeIngredientSchema, insertRecipeOperationSchema, type Article, type InsertArticle, type Recipe, type InsertRecipe, type RecipeIngredient, type InsertRecipeIngredient, type RecipeOperation, type InsertRecipeOperation, type WorkStation, type ArticleCategory, type StorageZone, type MeasurementUnit } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Unités de mesure communes
const stockTrackingOptions = [
  { value: "unit", label: "Par unité" },
  { value: "weight", label: "Par poids" },
  { value: "volume", label: "Par volume" }
];

const commonUnits = [
  "pièce", "kg", "g", "l", "ml", "m", "cm", "m²", "m³", "boîte", "paquet", "sachet"
];

function RecipeDisplay({ articleId }: { articleId: number }) {
  const [recipeDialogOpen, setRecipeDialogOpen] = useState(false);
  
  const { data: recipe, isLoading } = useQuery<Recipe>({
    queryKey: ["/api/articles", articleId, "recipe"],
    queryFn: () => fetch(`/api/articles/${articleId}/recipe`).then(res => {
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch recipe');
      return res.json();
    }),
  });

  if (isLoading) {
    return <div className="p-4">Chargement de la recette...</div>;
  }

  if (!recipe) {
    return (
      <div className="text-center p-6">
        <p className="text-muted-foreground mb-4">Aucune recette associée à ce produit</p>
        <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-recipe">
              <Plus className="w-4 h-4 mr-2" />
              Créer une recette
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer une recette</DialogTitle>
              <DialogDescription>
                Créer une nouvelle recette pour ce produit
              </DialogDescription>
            </DialogHeader>
            <RecipeForm articleId={articleId} onSuccess={() => setRecipeDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{recipe.designation}</h3>
          {recipe.description && (
            <p className="text-muted-foreground">{recipe.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <Dialog open={recipeDialogOpen} onOpenChange={setRecipeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" data-testid="button-edit-recipe">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Modifier la recette</DialogTitle>
                <DialogDescription>
                  Modifier la recette de ce produit
                </DialogDescription>
              </DialogHeader>
              <RecipeForm 
                articleId={articleId} 
                recipeData={recipe}
                onSuccess={() => setRecipeDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
        <div>
          <span className="text-sm font-medium">Quantité/Parts:</span>
          <p className="text-lg">{recipe.quantity} {recipe.unit}</p>
        </div>
        <div>
          <span className="text-sm font-medium">Type:</span>
          <Badge variant={recipe.isSubRecipe ? "secondary" : "default"}>
            {recipe.isSubRecipe ? "Sous-recette" : "Recette principale"}
          </Badge>
        </div>
      </div>

      {/* Onglets pour gérer les ingrédients et opérations */}
      <Tabs defaultValue="ingredients" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ingredients" data-testid="tab-recipe-ingredients">Ingrédients</TabsTrigger>
          <TabsTrigger value="operations" data-testid="tab-recipe-operations">Opérations</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ingredients" className="space-y-4">
          <RecipeIngredients recipeId={recipe.id} />
        </TabsContent>
        
        <TabsContent value="operations" className="space-y-4">
          <RecipeOperations recipeId={recipe.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RecipeForm({ articleId, recipeData, onSuccess }: { 
  articleId: number; 
  recipeData?: Recipe; 
  onSuccess: () => void;
}) {
  const { toast } = useToast();

  const { data: measurementUnits } = useQuery<MeasurementUnit[]>({
    queryKey: ["/api/measurement-units"],
  });

  const form = useForm<InsertRecipe>({
    resolver: zodResolver(insertRecipeSchema),
    defaultValues: {
      articleId,
      designation: recipeData?.designation || "",
      description: recipeData?.description || "",
      quantity: recipeData?.quantity || "1",
      unit: recipeData?.unit || "pièce",
      isSubRecipe: Boolean(recipeData?.isSubRecipe ?? false),
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertRecipe) => apiRequest("/api/recipes", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", articleId, "recipe"] });
      toast({ title: "Recette créée avec succès" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertRecipe) => apiRequest(`/api/recipes/${recipeData!.id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", articleId, "recipe"] });
      toast({ title: "Recette modifiée avec succès" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertRecipe) => {
    if (recipeData) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="designation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Désignation *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nom de la recette" data-testid="input-recipe-designation" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} placeholder="Description de la recette" data-testid="input-recipe-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité/Nombre de parts *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="1" placeholder="1" data-testid="input-recipe-quantity" />
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
                <FormLabel>Unité de mesure *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-recipe-unit">
                      <SelectValue placeholder="Sélectionner une unité" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {measurementUnits?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.label}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <FormLabel className="text-base">Est sous-recette ?</FormLabel>
            <p className="text-sm text-muted-foreground">
              Cette recette est-elle une sous-recette d'une recette principale ?
            </p>
          </div>
          <FormField
            control={form.control}
            name="isSubRecipe"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Switch
                    checked={Boolean(field.value)}
                    onCheckedChange={field.onChange}
                    data-testid="switch-is-sub-recipe"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-submit-recipe"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Enregistrement..."
              : recipeData
              ? "Modifier"
              : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function ProductForm({ product, onSuccess }: { product?: Article; onSuccess: () => void }) {
  const { toast } = useToast();
  const isEditing = !!product;
  
  const form = useForm<InsertArticle>({
    resolver: zodResolver(insertArticleSchema.extend({
      type: z.literal("product")
    })),
    defaultValues: {
      type: "product" as const,
      name: product?.name || "",
      description: product?.description || "",
      managedInStock: Boolean(product?.managedInStock ?? true),
      active: Boolean(product?.active ?? true),
      stockTracking: product?.stockTracking || "unit",
      managementUnit: product?.managementUnit || "pièce",
      storageLocationId: product?.storageLocationId || undefined,
      stockAlertThreshold: product?.stockAlertThreshold || "0",
      allowSale: Boolean(product?.allowSale ?? true),
      tax: product?.tax || "0",
      salePrice: product?.salePrice || "0",
      saleUnit: product?.saleUnit || "pièce",
      categoryId: product?.categoryId || undefined,
      photo: product?.photo || "",
    },
  });



  const { data: categories } = useQuery<ArticleCategory[]>({
    queryKey: ["/api/article-categories"],
  });

  const { data: storageZones } = useQuery<StorageZone[]>({
    queryKey: ["/api/storage-zones"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertArticle) => apiRequest("/api/articles", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Produit créé avec succès" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertArticle) => apiRequest(`/api/articles/${product!.id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Produit modifié avec succès" });
      onSuccess();
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertArticle) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="stock">Stock & Gestion</TabsTrigger>
            <TabsTrigger value="vente">Vente & Prix</TabsTrigger>
            <TabsTrigger value="recipe">Recette</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <FormField
              control={form.control}
              name="designation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Désignation *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nom du produit" data-testid="input-designation" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ""} placeholder="Description détaillée du produit" data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Catégorie</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune catégorie</SelectItem>
                      {categories?.map((category) => (
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

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Produit actif</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Le produit est disponible dans le système
                </p>
              </div>
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Gérer en stock</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Activer la gestion des stocks pour ce produit
                </p>
              </div>
              <FormField
                control={form.control}
                name="managedInStock"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        data-testid="switch-managed-in-stock"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="stockTracking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suivi stock *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-stock-tracking">
                        <SelectValue placeholder="Sélectionner le type de suivi" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stockTrackingOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="managementUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité de gestion *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-management-unit">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
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
                name="stockAlertThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seuil d'alerte stock</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="1" placeholder="0" value={field.value || ""} data-testid="input-stock-alert" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="storageZoneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone de stockage</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} 
                    value={field.value?.toString() || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-storage-zone">
                        <SelectValue placeholder="Sélectionner une zone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Aucune zone spécifique</SelectItem>
                      {storageZones?.map((zone) => (
                        <SelectItem key={zone.id} value={zone.id.toString()}>
                          {zone.designation} ({zone.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="vente" className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Autorisé à la vente</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Le produit peut être vendu aux clients
                </p>
              </div>
              <FormField
                control={form.control}
                name="allowedForSale"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Switch
                        checked={Boolean(field.value)}
                        onCheckedChange={field.onChange}
                        data-testid="switch-allowed-for-sale"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix de vente * (DA)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="1" placeholder="0.00" data-testid="input-sale-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="saleUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité de vente *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-sale-unit">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commonUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
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
                name="tax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taux TVA (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="1" placeholder="0.00" value={field.value || ""} data-testid="input-tax" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>



          <TabsContent value="recipe" className="space-y-4">
            {isEditing && product ? (
              <RecipeDisplay articleId={product.id} />
            ) : (
              <div className="text-center p-6 text-muted-foreground">
                <p>La gestion des recettes est disponible après la création du produit</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-submit"
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Enregistrement..."
              : isEditing
              ? "Modifier"
              : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Products() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Article | undefined>();
  const [viewMode, setViewMode] = useState<"edit" | "view">("edit");
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
    queryFn: () => fetch("/api/articles?type=product").then(res => res.json()),
  });

  const { data: storageZones } = useQuery<StorageZone[]>({
    queryKey: ["/api/storage-zones"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/articles/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles"] });
      toast({ title: "Produit supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const handleEdit = (product: Article) => {
    setSelectedProduct(product);
    setViewMode("edit");
    setIsDialogOpen(true);
  };

  const handleView = (product: Article) => {
    setSelectedProduct(product);
    setViewMode("view");
    setIsDialogOpen(true);
  };

  const handleDelete = (product: Article) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le produit "${product.designation}" ?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedProduct(undefined);
  };

  const formatPrice = (price: string | number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
    }).format(Number(price));
  };

  const formatTemperature = (temp: string | number | null) => {
    if (!temp) return "-";
    return `${temp}°C`;
  };

  const formatDLC = (dlc: string | null) => {
    if (!dlc) return "-";
    return new Date(dlc).toLocaleDateString('fr-FR');
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Produits</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent-hover"  onClick={() => setSelectedProduct(undefined)} data-testid="button-add">
                <Plus className="mr-2 h-4 w-4" />
                Nouveau Produit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {viewMode === "view" 
                    ? `Détails du produit` 
                    : selectedProduct 
                      ? "Modifier le produit" 
                      : "Nouveau produit"
                  }
                </DialogTitle>
                <DialogDescription>
                  {viewMode === "view" 
                    ? "Consultation des informations détaillées du produit" 
                    : selectedProduct 
                      ? "Modification des informations du produit existant" 
                      : "Création d'un nouveau produit dans le système"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <ProductForm product={selectedProduct} onSuccess={handleDialogClose} />
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent>
          {products && products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Conservation</TableHead>
                  <TableHead>DLC</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Zone de stockage</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const storageLocation = product.storageLocationId 
                    ? storageZones?.find(z => z.id === product.storageLocationId)
                    : null;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium">{product.designation}</div>
                            <div className="text-sm text-muted-foreground">{product.code}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-cyan-500" />
                          -
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          -
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-green-500" />
                          {formatPrice(product.salePrice || "0")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {storageLocation ? storageLocation.designation : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={product.active ? "default" : "destructive"}>
                            {product.active ? "Actif" : "Inactif"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(product)}
                            data-testid={`button-view-${product.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(product)}
                            data-testid={`button-edit-${product.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(product)}
                            data-testid={`button-delete-${product.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Aucun produit trouvé. Commencez par ajouter votre premier produit.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Composant pour gérer les ingrédients de recette
function RecipeIngredients({ recipeId }: { recipeId: number }) {
  const [ingredientDialogOpen, setIngredientDialogOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<RecipeIngredient | null>(null);
  const { toast } = useToast();

  const { data: ingredients, isLoading } = useQuery<RecipeIngredient[]>({
    queryKey: ["/api/recipes", recipeId, "ingredients"],
  });

  const { data: articles } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: measurementUnits } = useQuery<MeasurementUnit[]>({
    queryKey: ["/api/measurement-units"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertRecipeIngredient) => 
      apiRequest(`/api/recipes/${recipeId}/ingredients`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "ingredients"] });
      toast({ title: "Ingrédient ajouté avec succès" });
      setIngredientDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertRecipeIngredient> }) =>
      apiRequest(`/api/recipe-ingredients/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "ingredients"] });
      toast({ title: "Ingrédient modifié avec succès" });
      setEditingIngredient(null);
      setIngredientDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/recipe-ingredients/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "ingredients"] });
      toast({ title: "Ingrédient supprimé avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const handleEdit = (ingredient: RecipeIngredient) => {
    setEditingIngredient(ingredient);
    setIngredientDialogOpen(true);
  };

  const handleDelete = (ingredient: RecipeIngredient) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
      deleteMutation.mutate(ingredient.id);
    }
  };

  if (isLoading) {
    return <div className="p-4">Chargement des ingrédients...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Ingrédients de la recette</h4>
        <Dialog open={ingredientDialogOpen} onOpenChange={setIngredientDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingIngredient(null); }} data-testid="button-add-ingredient">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter ingrédient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingIngredient ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}
              </DialogTitle>
              <DialogDescription>
                {editingIngredient 
                  ? "Modifier les informations de cet ingrédient" 
                  : "Ajouter un nouvel ingrédient à la recette"}
              </DialogDescription>
            </DialogHeader>
            <RecipeIngredientForm
              recipeId={recipeId}
              ingredient={editingIngredient}
              articles={articles || []}
              measurementUnits={measurementUnits || []}
              onSubmit={(data) => {
                if (editingIngredient) {
                  updateMutation.mutate({ id: editingIngredient.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {ingredients && ingredients.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Unité</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ingredients.map((ingredient) => {
              const article = articles?.find(a => a.id === ingredient.articleId);
              return (
                <TableRow key={ingredient.id}>
                  <TableCell>
                    <div className="font-medium">{article?.designation || "Article inconnu"}</div>
                    <div className="text-sm text-muted-foreground">{article?.code}</div>
                  </TableCell>
                  <TableCell>{ingredient.quantity}</TableCell>
                  <TableCell>{ingredient.unit}</TableCell>
                  <TableCell>{ingredient.notes || "-"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(ingredient)}
                        data-testid={`button-edit-ingredient-${ingredient.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(ingredient)}
                        data-testid={`button-delete-ingredient-${ingredient.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Aucun ingrédient ajouté. Commencez par ajouter des ingrédients à cette recette.
        </div>
      )}
    </div>
  );
}

// Formulaire pour ajouter/modifier un ingrédient de recette
function RecipeIngredientForm({
  recipeId,
  ingredient,
  articles,
  measurementUnits,
  onSubmit,
  isLoading
}: {
  recipeId: number;
  ingredient?: RecipeIngredient | null;
  articles: Article[];
  measurementUnits: MeasurementUnit[];
  onSubmit: (data: InsertRecipeIngredient) => void;
  isLoading: boolean;
}) {
  const form = useForm<InsertRecipeIngredient>({
    resolver: zodResolver(insertRecipeIngredientSchema),
    defaultValues: {
      recipeId,
      articleId: ingredient?.articleId || undefined,
      quantity: ingredient?.quantity || "1",
      unit: ingredient?.unit || "pièce",
      notes: ingredient?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="articleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Article (Ingrédient/Produit) *</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-ingredient-article">
                    <SelectValue placeholder="Sélectionner un article" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {articles.map((article) => (
                    <SelectItem key={article.id} value={article.id.toString()}>
                      {article.designation} ({article.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantité *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="1" placeholder="1" data-testid="input-ingredient-quantity" />
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
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-ingredient-unit">
                      <SelectValue placeholder="Sélectionner une unité" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {measurementUnits?.map((unit) => (
                      <SelectItem key={unit.id} value={unit.label}>
                        {unit.label}
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} placeholder="Notes optionnelles" data-testid="input-ingredient-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading} data-testid="button-submit-ingredient">
            {isLoading ? "Enregistrement..." : ingredient ? "Modifier" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Composant pour gérer les opérations de recette
function RecipeOperations({ recipeId }: { recipeId: number }) {
  const [operationDialogOpen, setOperationDialogOpen] = useState(false);
  const [editingOperation, setEditingOperation] = useState<RecipeOperation | null>(null);
  const { toast } = useToast();

  const { data: operations, isLoading } = useQuery<RecipeOperation[]>({
    queryKey: ["/api/recipes", recipeId, "operations"],
  });

  const { data: workStations } = useQuery<WorkStation[]>({
    queryKey: ["/api/work-stations"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertRecipeOperation) => 
      apiRequest(`/api/recipes/${recipeId}/operations`, "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "operations"] });
      toast({ title: "Opération ajoutée avec succès" });
      setOperationDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erreur lors de l'ajout", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertRecipeOperation> }) =>
      apiRequest(`/api/recipe-operations/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "operations"] });
      toast({ title: "Opération modifiée avec succès" });
      setEditingOperation(null);
      setOperationDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/recipe-operations/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes", recipeId, "operations"] });
      toast({ title: "Opération supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  const handleEdit = (operation: RecipeOperation) => {
    setEditingOperation(operation);
    setOperationDialogOpen(true);
  };

  const handleDelete = (operation: RecipeOperation) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette opération ?")) {
      deleteMutation.mutate(operation.id);
    }
  };

  if (isLoading) {
    return <div className="p-4">Chargement des opérations...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold">Opérations de préparation</h4>
        <Dialog open={operationDialogOpen} onOpenChange={setOperationDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingOperation(null); }} data-testid="button-add-operation">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter opération
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingOperation ? "Modifier l'opération" : "Ajouter une opération"}
              </DialogTitle>
              <DialogDescription>
                {editingOperation 
                  ? "Modifier les informations de cette opération" 
                  : "Ajouter une nouvelle opération à la recette"}
              </DialogDescription>
            </DialogHeader>
            <RecipeOperationForm
              recipeId={recipeId}
              operation={editingOperation}
              workStations={workStations || []}
              nextStepOrder={(operations?.length || 0) + 1}
              onSubmit={(data) => {
                if (editingOperation) {
                  updateMutation.mutate({ id: editingOperation.id, data });
                } else {
                  createMutation.mutate(data);
                }
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {operations && operations.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Étape</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Poste de travail</TableHead>
              <TableHead>Température</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.map((operation) => {
              const workStation = workStations?.find(ws => ws.id === operation.workStationId);
              return (
                <TableRow key={operation.id}>
                  <TableCell>
                    <Badge variant="outline">Étape {operation.stepOrder}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{operation.description}</div>
                    {operation.notes && (
                      <div className="text-sm text-muted-foreground">{operation.notes}</div>
                    )}
                  </TableCell>
                  <TableCell>{operation.duration} min</TableCell>
                  <TableCell>{workStation?.designation || "-"}</TableCell>
                  <TableCell>
                    {operation.temperature ? `${operation.temperature}°C` : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(operation)}
                        data-testid={`button-edit-operation-${operation.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(operation)}
                        data-testid={`button-delete-operation-${operation.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          Aucune opération ajoutée. Commencez par ajouter des étapes de préparation à cette recette.
        </div>
      )}
    </div>
  );
}

// Formulaire pour ajouter/modifier une opération de recette
function RecipeOperationForm({
  recipeId,
  operation,
  workStations,
  nextStepOrder,
  onSubmit,
  isLoading
}: {
  recipeId: number;
  operation?: RecipeOperation | null;
  workStations: WorkStation[];
  nextStepOrder: number;
  onSubmit: (data: InsertRecipeOperation) => void;
  isLoading: boolean;
}) {
  const form = useForm<InsertRecipeOperation>({
    resolver: zodResolver(insertRecipeOperationSchema),
    defaultValues: {
      recipeId,
      stepOrder: operation?.stepOrder || nextStepOrder,
      description: operation?.description || "",
      duration: operation?.duration || 10,
      workStationId: operation?.workStationId || undefined,
      temperature: operation?.temperature || undefined,
      notes: operation?.notes || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="stepOrder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Numéro d'étape *</FormLabel>
              <FormControl>
                <Input {...field} type="number" min="1" data-testid="input-operation-step" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Description de l'opération" data-testid="input-operation-description" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durée (minutes) *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min="1" placeholder="10" data-testid="input-operation-duration" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Température (°C)</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} type="number" step="0.1" placeholder="180" data-testid="input-operation-temperature" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="workStationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Poste de travail</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger data-testid="select-operation-workstation">
                    <SelectValue placeholder="Sélectionner un poste de travail" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {workStations.map((station) => (
                    <SelectItem key={station.id} value={station.id.toString()}>
                      {station.designation} ({station.type})
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
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value || ""} placeholder="Notes complémentaires" data-testid="input-operation-notes" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading} data-testid="button-submit-operation">
            {isLoading ? "Enregistrement..." : operation ? "Modifier" : "Ajouter"}
          </Button>
        </div>
      </form>
    </Form>
  );
}