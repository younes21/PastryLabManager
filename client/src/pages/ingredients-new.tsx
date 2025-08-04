import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

// Schema pour les ingrédients selon spécifications exactes
const ingredientSchema = z.object({
  name: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  managedInStock: z.boolean().default(true),
  storageLocationId: z.number().optional(),
  categoryId: z.number().optional(),
  unit: z.string().min(1, "L'unité de mesure est requise"),
  allowSale: z.boolean().default(false),
  saleCategoryId: z.number().optional(),
  saleUnit: z.string().optional(),
  salePrice: z.number().min(0, "Le prix de vente doit être positif").optional(),
  taxId: z.number().optional(),
  photo: z.string().optional(),
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

  const { data: taxes } = useQuery({
    queryKey: ["/api/taxes"],
  });

  const form = useForm<IngredientFormData>({
    resolver: zodResolver(ingredientSchema),
    defaultValues: {
      name: "",
      description: "",
      managedInStock: true,
      unit: "kg",
      allowSale: false,
      saleUnit: "kg",
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: IngredientFormData) => apiRequest("/api/ingredients", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingrédient créé avec succès" });
      setIsDialogOpen(false);
      form.reset();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: IngredientFormData) => 
      apiRequest(`/api/ingredients/${editingIngredient?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingrédient modifié avec succès" });
      setIsDialogOpen(false);
      setEditingIngredient(null);
      form.reset();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/ingredients/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ingredients"] });
      toast({ title: "Ingrédient supprimé avec succès" });
    },
  });

  const onSubmit = (data: IngredientFormData) => {
    if (editingIngredient) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (ingredient: Article) => {
    setEditingIngredient(ingredient);
    form.reset({
      name: ingredient.name,
      description: ingredient.description || "",
      managedInStock: (ingredient as any).managedInStock ?? true,
      storageLocationId: ingredient.storageLocationId || undefined,
      categoryId: ingredient.categoryId || undefined,
      unit: ingredient.unit || "kg",
      allowSale: (ingredient as any).allowSale ?? false,
      saleCategoryId: (ingredient as any).saleCategoryId || undefined,
      saleUnit: (ingredient as any).saleUnit || "kg",
      salePrice: Number((ingredient as any).salePrice) || undefined,
      taxId: (ingredient as any).taxId || undefined,
      photo: (ingredient as any).photo || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cet ingrédient ?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingIngredient(null);
    form.reset();
  };

  if (isLoading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Ingrédients</h1>
          <p className="text-muted-foreground">
            Gérez vos ingrédients avec toutes leurs propriétés
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleClose()} data-testid="button-add-ingredient">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un Ingrédient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingIngredient ? "Modifier l'ingrédient" : "Ajouter un ingrédient"}
              </DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">Général</TabsTrigger>
                    <TabsTrigger value="stock">Stock</TabsTrigger>
                    <TabsTrigger value="vente">Vente</TabsTrigger>
                    <TabsTrigger value="photo">Photo</TabsTrigger>
                  </TabsList>

                  {/* Onglet Général */}
                  <TabsContent value="general" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Désignation *</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-ingredient-name" />
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
                              onValueChange={(value) => field.onChange(value === "no-category" ? undefined : parseInt(value))} 
                              defaultValue={field.value?.toString() || "no-category"}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-ingredient-category">
                                  <SelectValue placeholder="Sélectionner une catégorie" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="no-category">Aucune catégorie</SelectItem>
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
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} data-testid="input-ingredient-description" />
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
                              <SelectItem value="pièce">Pièce</SelectItem>
                              <SelectItem value="paquet">Paquet</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Onglet Stock */}
                  <TabsContent value="stock" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="managedInStock"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Gérer en stock ?</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Activer le suivi des stocks pour cet ingrédient
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-ingredient-stock"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="storageLocationId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone de stockage</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value === "no-zone" ? undefined : parseInt(value))} 
                            defaultValue={field.value?.toString() || "no-zone"}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-ingredient-storage">
                                <SelectValue placeholder="Sélectionner une zone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="no-zone">Aucune zone</SelectItem>
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

                    <FormField
                      control={form.control}
                      name="minStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock minimum</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              data-testid="input-ingredient-min-stock" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>

                  {/* Onglet Vente */}
                  <TabsContent value="vente" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="allowSale"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Autoriser à la vente ?</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Permettre la vente de cet ingrédient aux clients
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="switch-ingredient-sale"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("allowSale") && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="saleCategoryId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Catégorie de vente</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(value === "no-category" ? undefined : parseInt(value))} 
                                  defaultValue={field.value?.toString() || "no-category"}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-ingredient-sale-category">
                                      <SelectValue placeholder="Sélectionner une catégorie" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="no-category">Aucune catégorie</SelectItem>
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
                            name="saleUnit"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Unité de vente</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-ingredient-sale-unit">
                                      <SelectValue placeholder="Sélectionner une unité" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="kg">Kilogramme (kg)</SelectItem>
                                    <SelectItem value="g">Gramme (g)</SelectItem>
                                    <SelectItem value="l">Litre (l)</SelectItem>
                                    <SelectItem value="ml">Millilitre (ml)</SelectItem>
                                    <SelectItem value="pièce">Pièce</SelectItem>
                                    <SelectItem value="paquet">Paquet</SelectItem>
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
                                <FormLabel>Prix de vente (DA)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                                    data-testid="input-ingredient-sale-price"
                                  />
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
                                <Select 
                                  onValueChange={(value) => field.onChange(value === "no-tax" ? undefined : parseInt(value))} 
                                  defaultValue={field.value?.toString() || "no-tax"}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-ingredient-tax">
                                      <SelectValue placeholder="Sélectionner une TVA" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="no-tax">Aucune TVA</SelectItem>
                                    {(taxes as any[])?.map((tax: any) => (
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

                  {/* Onglet Photo */}
                  <TabsContent value="photo" className="space-y-4">
                    <FormField
                      control={form.control}
                      name="photo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL de la photo</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="https://exemple.com/photo.jpg"
                              data-testid="input-ingredient-photo"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-ingredient"
                  >
                    {editingIngredient ? "Modifier" : "Créer"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ingrédients</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {ingredients?.length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendables</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {ingredients?.filter(ing => (ing as any).allowSale).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {ingredients?.filter(ing => ing.active).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table des ingrédients selon spécifications */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Ingrédients</CardTitle>
          <CardDescription>
            Colonnes: Actif, Code, Catégorie, Désignation, PMP (Prix Moyen Pondéré), Stock Min
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actif</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>PMP</TableHead>
                <TableHead>Stock Min</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients?.map((ingredient) => (
                <TableRow key={ingredient.id} data-testid={`row-ingredient-${ingredient.id}`}>
                  <TableCell>
                    <Badge variant={ingredient.active ? "default" : "secondary"}>
                      {ingredient.active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{ingredient.code}</TableCell>
                  <TableCell>
                    {ingredient.categoryId 
                      ? (categories as any[])?.find((c: any) => c.id === ingredient.categoryId)?.designation || "Sans catégorie" 
                      : "Sans catégorie"
                    }
                  </TableCell>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>{Number(ingredient.costPerUnit) || 0} DA</TableCell>
                  <TableCell>{Number(ingredient.minStock) || 0}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}