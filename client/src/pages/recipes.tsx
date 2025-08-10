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
import { Layout } from "@/components/layout";

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
  const { data: recipes = [], isLoading: recipesLoading } = useQuery<any[]>({
    queryKey: ["/api/recipes"],
  });

  const { data: articles = [] } = useQuery<Article[]>({
    queryKey: ["/api/articles"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: InsertRecipe) => {
      const response = await apiRequest("/api/recipes", "POST", data);
      return await response.json();
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
      const response = await apiRequest(`/api/recipes/${selectedRecipe?.id}`, "PUT", data);
      return await response.json();
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
      const response = await apiRequest(`/api/recipes/${id}`, "DELETE");
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
      toast({ title: "Recette supprimée avec succès" });
    },
    onError: () => {
      toast({ title: "Erreur lors de la suppression", variant: "destructive" });
    },
  });

  // Fonction utilitaire pour obtenir le nom de l'article
  const getArticleName = (articleId: number) => {
    const article = articles.find((a) => a.id === articleId);
    return article?.name || "Article inconnu";
  };

  // Filtrage et tri
  const productArticles = articles.filter((article) => article.type === "product");
  const availableUnits = Array.from(new Set(recipes.map((recipe) => recipe.unit)));

    const filteredAndSortedRecipes = recipes
    .filter((recipe) => {
      const matchesSearch = recipe.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleSubmit = async (data: InsertRecipe): Promise<Recipe | void> => {
    if (selectedRecipe) {
      // Pour la modification, on ne peut pas retourner la recette car updateMutation est asynchrone
      updateMutation.mutate(data);
      return;
    } else {
      // Pour la création, on attend la réponse pour avoir l'ID de la recette
      try {
        console.log("Creating recipe with data:", data);
        const response = await apiRequest("/api/recipes", "POST", data);
        const responseData = await response.json();

        console.log("Recipe created:", responseData);

        if (responseData && responseData.id) {
          queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
          setShowCreateForm(false);
          toast({ title: "Recette créée avec succès" });
          return responseData;
        }
      } catch (error) {
        console.error("Error creating recipe:", error);
        toast({ title: "Erreur lors de la création", variant: "destructive" });
      }
    }
  };

  const handleCancel = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedRecipe(null);
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Affichage du formulaire en dialog
  if (showCreateForm || showEditForm) {
    return (
      <Layout title="Recettes">
        <RecipeForm
          recipe={selectedRecipe || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </Layout>
    );
  }

  return (
    <Layout title="Recettes">
      <div>
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div>

                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Gérer les recettes et fiches techniques de votre laboratoire
                </p>
              </div>
              <button
                onClick={handleCreate}
                className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
                data-testid="button-create-recipe"
              >
                <Plus className="w-4 h-4" />
                <span>Nouvelle recette</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="mx-auto px-4 py-6">
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Filtres et recherche</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
            </div>
          </div>

          {/* Tableau des recettes */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto rounded-lg">
              <table className="w-full">
                                 <thead>
                   <tr className="bg-gray-50 border-b">
                     <th className="px-4 py-3 text-left text-sm font-semibold">Produit</th>
                     <th className="px-4 py-3 text-center text-sm font-semibold">Quantité</th>
                     <th className="px-4 py-3 text-center text-sm font-semibold">Type</th>
                     <th className="px-4 py-3 text-center text-sm font-semibold">Ingrédients</th>
                     <th className="px-4 py-3 text-center text-sm font-semibold">Opérations</th>
                     <th className="px-4 py-3 text-center text-sm font-semibold">Durée tot. (min)</th>
                     <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                     <th className="px-4 py-3 text-center text-sm font-semibold">Actions</th>
                   </tr>
                 </thead>
                <tbody>
                  {recipesLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        Chargement des recettes...
                      </td>
                    </tr>
                  ) : filteredAndSortedRecipes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        <p>Aucune recette trouvée.</p>
                        <button
                          onClick={handleCreate}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Créer votre première recette
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedRecipes.map((recipe, index) => (
                      <tr key={recipe.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} data-testid={`row-recipe-${recipe.id}`}>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {getArticleName(recipe.articleId)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {recipe.quantity} {recipe.unit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${recipe.isSubRecipe
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                            }`}>
                            {recipe.isSubRecipe ? "Sous-recette" : "Recette"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {(recipe as any).ingredientsCount ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {(recipe as any).operationsCount ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            {(recipe as any).totalOperationDuration ?? 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                          {recipe.description || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleEdit(recipe)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              data-testid={`button-edit-recipe-${recipe.id}`}
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(recipe)}
                              className="text-red-600 hover:text-red-800 p-1"
                              data-testid={`button-delete-recipe-${recipe.id}`}
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}