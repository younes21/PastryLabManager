import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ChefHat,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { RecipeForm } from "@/components/recipe-form";
import { apiRequest } from "@/lib/queryClient";
import type { Recipe, InsertRecipe, Article } from "@shared/schema";

export default function RecipesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUnit, setFilterUnit] = useState("");
  const [sortBy, setSortBy] = useState<"designation" | "quantity" | "createdAt">("designation");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Queries
  const { data: recipes = [], isLoading: recipesLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: InsertRecipe) => {
      return await apiRequest("/api/recipes", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowCreateForm(false);
      toast({ title: "Recette créée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertRecipe) => {
      return await apiRequest(`/api/recipes/${selectedRecipe?.id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      setShowEditForm(false);
      setSelectedRecipe(null);
      toast({ title: "Recette modifiée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la modification", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/recipes/${id}`, {
        method: "DELETE",
      });
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
    setSelectedRecipe(null);
    setShowCreateForm(true);
  };

  const handleEdit = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setShowEditForm(true);
  };

  const handleDelete = (recipe: Recipe) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette recette ?")) {
      deleteMutation.mutate(recipe.id);
    }
  };

  const handleSubmit = (data: InsertRecipe) => {
    if (selectedRecipe) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedRecipe(null);
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

  // Affichage du formulaire
  if (showCreateForm || showEditForm) {
    return (
      <RecipeForm
        recipe={selectedRecipe || undefined}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    );
  }

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
                <TableHead>Produit</TableHead>
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
                <TableHead>Actions</TableHead>
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
                  <TableCell colSpan={6} className="text-center py-8">
                    Aucune recette trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedRecipes.map((recipe) => (
                  <TableRow key={recipe.id} data-testid={`row-recipe-${recipe.id}`}>
                    <TableCell className="font-medium">{recipe.designation}</TableCell>
                    <TableCell>{getArticleName(recipe.articleId)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {recipe.quantity} {recipe.unit}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={recipe.isSubRecipe ? "secondary" : "default"}>
                        {recipe.isSubRecipe ? "Sous-recette" : "Recette"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {recipe.description || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(recipe)}
                          data-testid={`button-edit-recipe-${recipe.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recipe)}
                          data-testid={`button-delete-recipe-${recipe.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
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
    </div>
  );
}