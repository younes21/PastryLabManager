import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Clock, 
  Users, 
  ChefHat,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import type { Recipe, InsertRecipe, Article } from "@shared/schema";

// Schema pour le formulaire de recette
const recipeSchema = z.object({
  articleId: z.number(),
  designation: z.string().min(1, "La désignation est requise"),
  description: z.string().optional(),
  quantity: z.string().min(1, "La quantité est requise"),
  unit: z.string().min(1, "L'unité est requise"),
  isSubRecipe: z.boolean().optional(),
});

type RecipeForm = z.infer<typeof recipeSchema>;

export default function RecipesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [sortBy, setSortBy] = useState<"designation" | "quantity" | "createdAt">("designation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Queries
  const { data: recipes = [], isLoading: recipesLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  const { data: measurementUnits = [] } = useQuery<any[]>({
    queryKey: ["/api/measurement-units"],
  });

  // Formulaire
  const form = useForm<RecipeForm>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      articleId: 0,
      designation: "",
      description: "",
      quantity: "",
      unit: "",
      isSubRecipe: false,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: RecipeForm) => {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          quantity: parseFloat(data.quantity),
        }),
      });
      if (!response.ok) throw new Error("Erreur lors de la création");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowCreateDialog(false);
      form.reset();
      toast({ title: "Recette créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RecipeForm) => {
      const response = await fetch(`/api/recipes/${selectedRecipe?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          quantity: parseFloat(data.quantity),
        }),
      });
      if (!response.ok) throw new Error("Erreur lors de la modification");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowEditDialog(false);
      setSelectedRecipe(null);
      form.reset();
      toast({ title: "Recette modifiée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/recipes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Recette supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  // Filtrage et tri
  const productArticles = articles.filter((article) => article.type === "product");
  const availableUnits = Array.from(new Set(recipes.map((recipe) => recipe.unit)));

  const filteredAndSortedRecipes = recipes
    .filter((recipe) => {
      const matchesSearch = recipe.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recipe.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnit = !filterUnit || filterUnit === "all" || recipe.unit === filterUnit;
      return matchesSearch && matchesUnit;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];
      
      if (sortBy === "quantity") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }
      
      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  // Handlers
  const handleCreate = () => {
    form.reset();
    setShowCreateDialog(true);
  };

  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    form.reset({
      articleId: recipe.articleId,
      designation: recipe.designation,
      description: recipe.description || "",
      quantity: recipe.quantity.toString(),
      unit: recipe.unit,
      isSubRecipe: recipe.isSubRecipe || false,
    });
    setShowEditDialog(true);
  };

  const handleView = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowViewDialog(true);
  };

  const handleDelete = (recipe: Recipe) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) {
      deleteMutation.mutate(recipe.id);
    }
  };

  const onSubmit = (data: RecipeForm) => {
    if (selectedRecipe) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const getArticleName = (articleId: number) => {
    const article = articles.find((a) => a.id === articleId);
    return article?.name || "Article inconnu";
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recettes</h1>
          <p className="text-muted-foreground">
            Gestion des recettes et fiches techniques
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-recipe">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle recette
        </Button>
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres et recherche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Rechercher une recette..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-recipes"
              />
            </div>
            
            <Select value={filterUnit} onValueChange={setFilterUnit}>
              <SelectTrigger data-testid="select-filter-unit">
                <SelectValue placeholder="Filtrer par unité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les unités</SelectItem>
                {availableUnits.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger data-testid="select-sort-by">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="designation">Désignation</SelectItem>
                  <SelectItem value="quantity">Quantité</SelectItem>
                  <SelectItem value="createdAt">Date de création</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                data-testid="button-sort-order"
              >
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des recettes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Liste des recettes ({filteredAndSortedRecipes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("designation")}
                >
                  <div className="flex items-center gap-2">
                    Désignation
                    {sortBy === "designation" && (
                      sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Produit associé</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleSort("quantity")}
                >
                  <div className="flex items-center gap-2">
                    Quantité
                    {sortBy === "quantity" && (
                      sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Chargement des recettes...
                  </TableCell>
                </TableRow>
              ) : filteredAndSortedRecipes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune recette trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedRecipes.map((recipe) => (
                  <TableRow key={recipe.id} data-testid={`row-recipe-${recipe.id}`}>
                    <TableCell className="font-medium">
                      {recipe.designation}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getArticleName(recipe.articleId)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{recipe.quantity}</span>
                        <span className="text-muted-foreground text-sm">{recipe.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {recipe.isSubRecipe ? (
                        <Badge variant="secondary">Sous-recette</Badge>
                      ) : (
                        <Badge variant="default">Recette principale</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <span className="text-sm text-muted-foreground truncate block">
                        {recipe.description || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(recipe)}
                          data-testid={`button-view-${recipe.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(recipe)}
                          data-testid={`button-edit-${recipe.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recipe)}
                          data-testid={`button-delete-${recipe.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de création/édition */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedRecipe(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRecipe ? "Modifier la recette" : "Créer une nouvelle recette"}
            </DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="articleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produit associé</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value?.toString()} 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                        >
                          <SelectTrigger data-testid="select-article">
                            <SelectValue placeholder="Sélectionner un produit" />
                          </SelectTrigger>
                          <SelectContent>
                            {productArticles.map((article) => (
                              <SelectItem key={article.id} value={article.id.toString()}>
                                {article.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Désignation</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Nom de la recette" data-testid="input-designation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantité</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.001" placeholder="1.0" data-testid="input-quantity" />
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
                      <FormLabel>Unité</FormLabel>
                      <FormControl>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-unit">
                            <SelectValue placeholder="Sélectionner une unité" />
                          </SelectTrigger>
                          <SelectContent>
                            {measurementUnits.map((unit) => (
                              <SelectItem key={unit.id} value={unit.label}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
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
                      <Textarea 
                        {...field} 
                        placeholder="Description de la recette..."
                        className="min-h-[100px]"
                        data-testid="textarea-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateDialog(false);
                    setShowEditDialog(false);
                    setSelectedRecipe(null);
                    form.reset();
                  }}
                >
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-submit-recipe"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Enregistrement..." : 
                   selectedRecipe ? "Modifier" : "Créer"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog de visualisation */}
      <Dialog open={showViewDialog} onOpenChange={(open) => {
        if (!open) {
          setShowViewDialog(false);
          setSelectedRecipe(null);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5" />
              {selectedRecipe?.designation}
            </DialogTitle>
          </DialogHeader>
          
          {selectedRecipe && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Informations générales</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Produit associé:</span>
                        <span className="font-medium">{getArticleName(selectedRecipe.articleId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quantité:</span>
                        <span className="font-medium">{selectedRecipe.quantity} {selectedRecipe.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant={selectedRecipe.isSubRecipe ? "secondary" : "default"}>
                          {selectedRecipe.isSubRecipe ? "Sous-recette" : "Recette principale"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Créée le:</span>
                        <span className="font-medium">
                          {selectedRecipe.createdAt ? new Date(selectedRecipe.createdAt).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedRecipe.description && (
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Description</h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedRecipe.description}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Ingrédients</h3>
                    <div className="text-center p-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p>Les ingrédients seront affichés ici</p>
                      <p className="text-sm">Fonctionnalité en développement</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Étapes de préparation</h3>
                    <div className="text-center p-6 text-muted-foreground border-2 border-dashed rounded-lg">
                      <p>Les étapes seront affichées ici</p>
                      <p className="text-sm">Fonctionnalité en développement</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}