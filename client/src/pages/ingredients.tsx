import { useState, useCallback, memo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Package, Euro, Tag, ImageIcon } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertArticleSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Types pour les ingrédients (articles de type "ingredient")
type Ingredient = {
  id: number;
  code: string;
  name: string;
  type: string;
  description?: string;
  managedInStock: boolean;
  storageLocationId?: number;
  categoryId?: number;
  unitId?: number;
  allowSale: boolean;
  saleCategoryId?: number;
  saleUnitId?: number;
  salePrice: string;
  taxId?: number;
  photo?: string;
  active: boolean;
  currentStock: string;
  minStock: string;
  maxStock: string;
  costPerUnit: string; // PMP
  createdAt: string;
};

// Validation avec schéma étendu pour les articles de type "ingredient"
const ingredientFormSchema = insertArticleSchema.extend({
  name: z.string().min(1, "La désignation est requise"),
  type: z.literal("ingredient"),
  description: z.string().optional(),
  managedInStock: z.boolean().default(true),
  storageLocationId: z.number().optional(),
  categoryId: z.number().optional(),
  unitId: z.number().optional(),
  allowSale: z.boolean().default(false),
  saleCategoryId: z.number().optional(),
  saleUnitId: z.number().optional(),
  salePrice: z.string().optional(),
  taxId: z.number().optional(),
  photo: z.string().optional(),
  active: z.boolean().default(true),
  currentStock: z.string().optional(),
  minStock: z.string().optional(),
  maxStock: z.string().optional(),
  costPerUnit: z.string().optional(),
});

// Composant formulaire stable
const StableIngredientForm = memo(({ form, activeTab, setActiveTab, onSubmit, onCancel, submitting }: {
  form: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  submitting: boolean;
}) => {
  // Requêtes pour les données de référence
  const { data: storageLocations = [] } = useQuery({
    queryKey: ["/api/storage-locations"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/article-categories"],
  });

  const { data: measurementUnits = [] } = useQuery({
    queryKey: ["/api/measurement-units"],
  });

  const { data: taxes = [] } = useQuery({
    queryKey: ["/api/taxes"],
  });

  const managedInStock = form.watch("managedInStock");
  const allowSale = form.watch("allowSale");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Général</TabsTrigger>
            <TabsTrigger value="stock">Stock</TabsTrigger>
            <TabsTrigger value="sale">Vente</TabsTrigger>
            <TabsTrigger value="other">Autres</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Désignation *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom de l'ingrédient" data-testid="input-ingredient-name" />
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
                    <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(categories as any[]).map((category: any) => (
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
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Description de l'ingrédient" data-testid="textarea-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unitId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité de mesure</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger data-testid="select-unit">
                          <SelectValue placeholder="Sélectionnez une unité" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(measurementUnits as any[]).map((unit: any) => (
                          <SelectItem key={unit.id} value={unit.id.toString()}>
                            {unit.label} ({unit.abbreviation})
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
                name="photo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Photo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="URL de la photo"
                        data-testid="input-photo"
                      />
                    </FormControl>
                    <FormDescription>
                      URL ou chemin vers la photo de l'ingrédient
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Ingrédient actif</FormLabel>
                    <FormDescription>
                      Cet ingrédient peut être utilisé
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-active" />
                  </FormControl>
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="stock" className="space-y-4">
            <FormField
              control={form.control}
              name="managedInStock"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Gérer en stock</FormLabel>
                    <FormDescription>
                      Activer la gestion de stock pour cet ingrédient
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-managed-stock" />
                  </FormControl>
                </FormItem>
              )}
            />

            {managedInStock && (
              <>
                <FormField
                  control={form.control}
                  name="storageLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone de stockage</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger data-testid="select-storage-location">
                            <SelectValue placeholder="Sélectionnez une zone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(storageLocations as any[]).map((location: any) => (
                            <SelectItem key={location.id} value={location.id.toString()}>
                              {location.name} ({location.temperature}°C)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="col-span-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Stock actuel :</strong> {form.watch("currentStock") || "0"}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Le stock actuel sera modifié via les opérations d'inventaire initial ou d'ajustement
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock minimum</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-min-stock" />
                        </FormControl>
                        <FormDescription>
                          Seuil d'alerte de stock bas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock maximum</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-max-stock" />
                        </FormControl>
                        <FormDescription>
                          Limite maximale de stock
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="costPerUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix Moyen Pondéré (PMP)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-cost-per-unit" />
                      </FormControl>
                      <FormDescription>
                        Prix moyen pondéré par unité de mesure
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </TabsContent>

          <TabsContent value="sale" className="space-y-4">
            <FormField
              control={form.control}
              name="allowSale"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Autoriser à la vente</FormLabel>
                    <FormDescription>
                      Cet ingrédient peut être vendu directement
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-allow-sale" />
                  </FormControl>
                </FormItem>
              )}
            />

            {allowSale && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="saleCategoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie de vente</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-sale-category">
                              <SelectValue placeholder="Catégorie pour la vente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(categories as any[]).map((category: any) => (
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
                    name="saleUnitId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unité de vente</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-sale-unit">
                              <SelectValue placeholder="Unité pour la vente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(measurementUnits as any[]).map((unit: any) => (
                              <SelectItem key={unit.id} value={unit.id.toString()}>
                                {unit.label} ({unit.abbreviation})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prix de vente</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-sale-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>TVA</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-tax">
                              <SelectValue placeholder="Sélectionnez une TVA" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(taxes as any[]).map((tax: any) => (
                              <SelectItem key={tax.id} value={tax.id.toString()}>
                                {tax.designation} ({tax.rate}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              <p>Aucun champ supplémentaire pour le moment</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={submitting} data-testid="button-submit-ingredient">
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </Form>
  );
});

export default function IngredientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterActive, setFilterActive] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Formulaire stable avec valeurs par défaut
  const form = useForm<z.infer<typeof ingredientFormSchema>>({
    resolver: zodResolver(ingredientFormSchema),
    defaultValues: {
      name: "",
      description: "",
      managedInStock: true,
      allowSale: false,
      active: true,
      currentStock: "0",
      minStock: "0",
      maxStock: "0",
      costPerUnit: "0",
      salePrice: "0",
    },
  });

  // Requêtes
  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ["/api/ingredients"],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/article-categories"],
  });

  const { data: storageLocations = [] } = useQuery({
    queryKey: ["/api/storage-locations"],
  });

  const { data: measurementUnits = [] } = useQuery({
    queryKey: ["/api/measurement-units"],
  });

  const { data: taxes = [] } = useQuery({
    queryKey: ["/api/taxes"],
  });



  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof ingredientFormSchema>) => {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, type: "ingredient" }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur lors de la création");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setIsCreateDialogOpen(false);
      form.reset({
        name: "",
        description: "",
        managedInStock: true,
        allowSale: false,
        active: true,
        currentStock: "0",
        minStock: "0",
        maxStock: "0",
        costPerUnit: "0",
        salePrice: "0",
      });
      setActiveTab("general");
      toast({
        title: "Succès",
        description: "Ingrédient créé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof ingredientFormSchema> }) => {
      const response = await fetch(`/api/articles/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, type: "ingredient" }),
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur lors de la mise à jour");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      setIsEditDialogOpen(false);
      form.reset({
        name: "",
        description: "",
        managedInStock: true,
        allowSale: false,
        active: true,
        currentStock: "0",
        minStock: "0",
        maxStock: "0",
        costPerUnit: "0",
        salePrice: "0",
      });
      setActiveTab("general");
      toast({
        title: "Succès",
        description: "Ingrédient mis à jour avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Erreur lors de la suppression");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({
        title: "Succès",
        description: "Ingrédient supprimé avec succès",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression",
        variant: "destructive",
      });
    },
  });

  // Handlers stables
  const handleCreate = useCallback((data: z.infer<typeof ingredientFormSchema>) => {
    createMutation.mutate(data);
  }, [createMutation]);

  const handleEdit = useCallback((ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    form.reset({
      name: ingredient.name || "",
      description: ingredient.description || "",
      managedInStock: ingredient.managedInStock ?? true,
      storageLocationId: ingredient.storageLocationId,
      categoryId: ingredient.categoryId,
      unitId: ingredient.unitId,
      allowSale: ingredient.allowSale ?? false,
      saleCategoryId: ingredient.saleCategoryId,
      saleUnitId: ingredient.saleUnitId,
      salePrice: ingredient.salePrice || "0",
      taxId: ingredient.taxId,
      photo: ingredient.photo || "",
      active: ingredient.active ?? true,
      currentStock: ingredient.currentStock || "0",
      minStock: ingredient.minStock || "0",
      maxStock: ingredient.maxStock || "0",
      costPerUnit: ingredient.costPerUnit || "0",
    });
    setActiveTab("general");
    setIsEditDialogOpen(true);
  }, [form]);

  const handleUpdate = useCallback((data: z.infer<typeof ingredientFormSchema>) => {
    if (selectedIngredient) {
      updateMutation.mutate({ id: selectedIngredient.id, data });
    }
  }, [selectedIngredient, updateMutation]);

  const handleDelete = useCallback((id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
      deleteMutation.mutate(id);
    }
  }, [deleteMutation]);

  const handleCancel = useCallback(() => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setActiveTab("general");
    form.reset({
      name: "",
      description: "",
      managedInStock: true,
      allowSale: false,
      active: true,
      currentStock: "0",
      minStock: "0",
      maxStock: "0",
      costPerUnit: "0",
      salePrice: "0",
    });
  }, [form]);

  // Helpers
  const getCategoryName = (categoryId?: number) => {
    if (!categoryId) return "N/A";
    const category = (categories as any[]).find((c: any) => c.id === categoryId);
    return category?.designation || "N/A";
  };

  const getUnitName = (unitId?: number) => {
    if (!unitId) return "N/A";
    const unit = (measurementUnits as any[]).find((u: any) => u.id === unitId);
    return unit ? `${unit.label} (${unit.abbreviation})` : "N/A";
  };

  const getStockStatus = (current: string, min: string) => {
    const currentStock = parseFloat(current || "0");
    const minStock = parseFloat(min || "0");
    
    if (currentStock <= 0) return { status: "Rupture", color: "bg-red-500" };
    if (currentStock <= minStock) return { status: "Faible", color: "bg-orange-500" };
    return { status: "Normal", color: "bg-green-500" };
  };

  // Filtrage des ingrédients
  const filteredIngredients = (ingredients as Ingredient[]).filter((ingredient) => {
    const matchesSearch = searchTerm === "" || 
      ingredient.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingredient.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === "all" || ingredient.categoryId?.toString() === filterCategory;
    const matchesActive = filterActive === "all" || 
      (filterActive === "active" && ingredient.active) ||
      (filterActive === "inactive" && !ingredient.active);
    
    return matchesSearch && matchesCategory && matchesActive;
  });

  return (
    <Layout title="Gestion des Ingrédients">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Ingrédients
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gérez vos ingrédients, leur stock et leurs paramètres de vente
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (open) {
              setActiveTab("general");
              form.reset({
                name: "",
                description: "",
                managedInStock: true,
                allowSale: false,
                active: true,
                currentStock: "0",
                minStock: "0",
                maxStock: "0",
                costPerUnit: "0",
                salePrice: "0",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="button-add-ingredient">
                <Plus className="mr-2 h-4 w-4" />
                Nouvel Ingrédient
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nouvel Ingrédient</DialogTitle>
                <DialogDescription>
                  Créez un nouvel ingrédient avec tous ses paramètres
                </DialogDescription>
              </DialogHeader>
              <StableIngredientForm 
                form={form}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSubmit={handleCreate}
                onCancel={handleCancel}
                submitting={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par code ou nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-ingredients"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[200px]" data-testid="select-filter-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {(categories as any[]).map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.designation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterActive} onValueChange={setFilterActive}>
                <SelectTrigger className="w-[150px]" data-testid="select-filter-active">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table des ingrédients */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actif
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Désignation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      PMP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Chargement des ingrédients...
                      </td>
                    </tr>
                  ) : filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        Aucun ingrédient trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((ingredient) => {
                      const stockStatus = getStockStatus(ingredient.currentStock, ingredient.minStock);
                      
                      return (
                        <tr key={ingredient.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={ingredient.active ? "default" : "secondary"}>
                              {ingredient.active ? "Actif" : "Inactif"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {ingredient.code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {getCategoryName(ingredient.categoryId)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Package className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {ingredient.name}
                                </div>
                                {ingredient.description && (
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                    {ingredient.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Euro className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {parseFloat(ingredient.costPerUnit || "0").toFixed(2)} DA
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full ${stockStatus.color} mr-2`}></div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {parseFloat(ingredient.currentStock || "0").toFixed(2)} {getUnitName(ingredient.unitId)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {stockStatus.status}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(ingredient)}
                                data-testid={`button-edit-ingredient-${ingredient.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(ingredient.id)}
                                className="text-red-600 hover:text-red-700"
                                data-testid={`button-delete-ingredient-${ingredient.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de modification */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modifier l'Ingrédient</DialogTitle>
              <DialogDescription>
                Modifiez les informations de l'ingrédient
              </DialogDescription>
            </DialogHeader>
            <StableIngredientForm 
              form={form}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onSubmit={handleUpdate}
              onCancel={handleCancel}
              submitting={updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}